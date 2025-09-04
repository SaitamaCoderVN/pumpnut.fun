import { useConnection } from '@solana/wallet-adapter-react';
import { useCallback, useEffect, useState } from 'react';
import { fetchPumpTransactions, PumpTransaction, calculateTotalLosses, calculateTotalProfits, calculateNetResult } from '@/services/solana';
import { updateWalletLosses, UserRankData, getReferralData, ReferralData, processReferral, clearWalletCache } from '@/services/database';

export const usePumpTransactions = (searchAddressWithTimestamp?: string) => {
  const { connection } = useConnection();
  const [transactions, setTransactions] = useState<PumpTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [rankData, setRankData] = useState<UserRankData | null>(null);
  
  //  Real-time progress states
  const [realTimeStats, setRealTimeStats] = useState({
    processedTransactions: 0,
    pumpTransactions: 0,
    totalProfit: 0,
    totalLoss: 0,
    netResult: 0,
    currentBatchProgress: ''
  });

  const fetchTransactions = useCallback(async (forceRefresh: boolean = false) => {
    if (!searchAddressWithTimestamp) {
      setTransactions([]);
      setError(null);
      setIsLoading(false);
      setCurrentBatch(0);
      setTotalBatches(0);
      setRankData(null);
      // 🆕 Reset real-time stats
      setRealTimeStats({
        processedTransactions: 0,
        pumpTransactions: 0,
        totalProfit: 0,
        totalLoss: 0,
        netResult: 0,
        currentBatchProgress: ''
      });
      return;
    }

    // Extract the actual address and check for referral code
    // Remove timestamp and any query parameters
    const searchAddress = searchAddressWithTimestamp.split('?')[0].split('&')[0].trim();
    
    // Validate wallet address format (basic check)
    if (!searchAddress || searchAddress.length < 32 || searchAddress.length > 44) {
      setError('Invalid wallet address format');
      setIsLoading(false);
      return;
    }
    
    console.log('Parsed wallet address:', searchAddress);
    
    // Check URL for referral code
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');

    setIsLoading(true);
    setError(null);
    setTransactions([]);
    setCurrentBatch(0);
    setTotalBatches(0);
    
    // 🆕 Reset real-time stats
    setRealTimeStats({
      processedTransactions: 0,
      pumpTransactions: 0,
      totalProfit: 0,
      totalLoss: 0,
      netResult: 0,
      currentBatchProgress: 'Starting...'
    });

    try {
      console.log('Fetching transactions for address:', searchAddress);
      
      const txs = await fetchPumpTransactions(
        connection, 
        searchAddress,
        (current, total, progressData) => {
          console.log('Progress update:', { current, total, progressData });
          setCurrentBatch(current);
          setTotalBatches(total);
          
          // 🆕 Update real-time stats
          if (progressData) {
            setRealTimeStats({
              processedTransactions: progressData.processedTransactions,
              pumpTransactions: progressData.pumpTransactions,
              totalProfit: progressData.totalProfit,
              totalLoss: progressData.totalLoss,
              netResult: progressData.netResult,
              currentBatchProgress: progressData.currentBatchProgress
            });
          }
        },
        forceRefresh
      );
      
      console.log('Fetched transactions:', txs.length);
      setTransactions(txs);
      
      if (txs.length > 0) {
        // Calculate profits, losses, and net result
        const totalLoss = calculateTotalLosses(txs);
        const totalProfit = calculateTotalProfits(txs);
        const netResult = calculateNetResult(txs);
        
        const biggestLoss = txs.reduce((max, tx) => 
          tx.type === 'bet' && tx.success && tx.amount > max ? tx.amount : max, 0
        );
        
        const biggestProfit = txs.reduce((max, tx) => 
          tx.type === 'withdraw' && tx.success && tx.amount > max ? tx.amount : max, 0
        );

        console.log('💰 Trading Analysis:', { 
          totalProfit, 
          totalLoss, 
          netResult,
          biggestLoss, 
          biggestProfit,
          status: netResult >= 0 ? 'PROFITABLE' : 'LOSING'
        });

        // Update database and get rank (with error handling)
        try {
          const userRankData = await updateWalletLosses(
            searchAddress,
            txs,
            totalLoss,
            biggestLoss
          );
          console.log('Rank data received:', userRankData);
          setRankData(userRankData);
        } catch (dbError) {
          console.warn('Database update failed, continuing without rank:', dbError);
          // Set fallback rank data
          setRankData({
            rank: 1,
            totalParticipants: 1
          });
        }

        // Process referral if referral code exists
        if (refCode && refCode !== searchAddress) {
          try {
            await processReferral(refCode, searchAddress, totalLoss);
            console.log('Referral processed successfully');
          } catch (refError) {
            console.warn('Referral processing failed:', refError);
            // Continue without referral processing
          }
        }

      } else {
        setError('No transactions found for this address on pump.fun');
      }
    } catch (err) {
      console.error('Error fetching transactions:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        error: err,
        errorType: err?.constructor?.name,
        searchAddress
      });
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while fetching transactions');
      }
    } finally {
      setIsLoading(false);
    }
  }, [connection, searchAddressWithTimestamp]);

  useEffect(() => {
    if (searchAddressWithTimestamp) {
      fetchTransactions();
    }
  }, [searchAddressWithTimestamp, fetchTransactions]);

  // Function to force refresh (clear cache and refetch)
  const forceRefresh = useCallback(async () => {
    if (!searchAddressWithTimestamp) return;
    
    const searchAddress = searchAddressWithTimestamp.split('?')[0];
    setIsLoading(true);
    
    try {
      await clearWalletCache(searchAddress);
      await fetchTransactions(true); // Pass forceRefresh = true
    } catch (err) {
      console.error('Error during force refresh:', err);
      setError('Failed to refresh data');
    }
  }, [searchAddressWithTimestamp, fetchTransactions]);

  return {
    transactions,
    isLoading,
    error,
    totalLosses: calculateTotalLosses(transactions),
    totalProfits: calculateTotalProfits(transactions),
    netResult: calculateNetResult(transactions),
    biggestLoss: transactions.reduce((max, tx) => 
      tx.type === 'bet' && tx.success && tx.amount > max ? tx.amount : max, 0
    ),
    biggestProfit: transactions.reduce((max, tx) => 
      tx.type === 'withdraw' && tx.success && tx.amount > max ? tx.amount : max, 0
    ),
    currentBatch,
    totalBatches,
    rankData,
    forceRefresh,
    // 🆕 Return real-time stats
    realTimeStats,
  };
}; 