import { useConnection } from '@solana/wallet-adapter-react';
import { useCallback, useEffect, useState } from 'react';
import { fetchPumpTransactions, PumpTransaction, calculateTotalLosses } from '@/services/solana';
import { updateWalletLosses, UserRankData, getReferralData, ReferralData, processReferral } from '@/services/database';

export const usePumpTransactions = (searchAddressWithTimestamp?: string) => {
  const { connection } = useConnection();
  const [transactions, setTransactions] = useState<PumpTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [rankData, setRankData] = useState<UserRankData | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!searchAddressWithTimestamp) {
      setTransactions([]);
      setError(null);
      setIsLoading(false);
      setCurrentBatch(0);
      setTotalBatches(0);
      setRankData(null);
      return;
    }

    // Extract the actual address and check for referral code
    const searchAddress = searchAddressWithTimestamp.split('?')[0];
    
    // Check URL for referral code
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');

    setIsLoading(true);
    setError(null);
    setTransactions([]); // Reset transactions when starting a new search
    setCurrentBatch(0);
    setTotalBatches(0);

    try {
      console.log('Fetching transactions for address:', searchAddress);
      
      const txs = await fetchPumpTransactions(
        connection, 
        searchAddress,
        (current, total) => {
          console.log('Progress update:', { current, total });
          setCurrentBatch(current);
          setTotalBatches(total);
        }
      );
      
      console.log('Fetched transactions:', txs.length);
      setTransactions(txs);
      
      if (txs.length > 0) {
        // Calculate losses
        const totalLoss = calculateTotalLosses(txs);
        const biggestLoss = txs.reduce((max, tx) => 
          tx.type === 'bet' && tx.success && tx.amount > max ? tx.amount : max, 0
        );

        console.log('Calculated losses:', { totalLoss, biggestLoss });

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

  return {
    transactions,
    isLoading,
    error,
    totalLosses: calculateTotalLosses(transactions),
    biggestLoss: transactions.reduce((max, tx) => 
      tx.type === 'bet' && tx.success && tx.amount > max ? tx.amount : max, 0
    ),
    currentBatch,
    totalBatches,
    rankData,
  };
}; 