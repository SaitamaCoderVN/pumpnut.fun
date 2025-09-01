'use client';

import { Header } from '@/components/Header';
import { AddressSearch } from '@/components/AddressSearch';
import { usePumpTransactions } from '@/hooks/usePumpTransactions';
import { useState, useEffect } from 'react';
import { MemeProgressBar } from '@/components/MemeProgressBar';
import { LosersLeaderboard } from '@/components/LosersLeaderboard';
import { UserRankCard } from '@/components/UserRankCard';
import { ClientWalletProvider } from '@/components/ClientWalletProvider';
import { ShareModal } from '@/components/ShareModal';
import { getReferralData, ReferralData } from '@/services/database';
import { Tomorrow } from 'next/font/google';

const tomorrow = Tomorrow({
  weight: '600',
  subsets: ['latin'],
});

export default function Home() {
  const [searchAddress, setSearchAddress] = useState<string>('');
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const { 
    transactions, 
    isLoading, 
    error, 
    totalLosses, 
    biggestLoss,
    currentBatch,
    totalBatches,
    rankData,
    forceRefresh,
    realTimeStats
  } = usePumpTransactions(searchAddress);

  const formatSOL = (amount: number) => `${amount.toFixed(2)} SOL`;

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  // Load referral data when search address changes
  useEffect(() => {
    const loadReferralData = async () => {
      if (searchAddress) {
        try {
          const data = await getReferralData(searchAddress);
          setReferralData(data);
        } catch (error) {
          console.error('Error loading referral data:', error);
        }
      }
    };

    loadReferralData();
  }, [searchAddress]);

  return (
    <ClientWalletProvider>
      <main className="min-h-screen bg-cover bg-center bg-no-repeat relative" style={{ backgroundImage: 'url(/raw-4.png)' }}>
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/40 pointer-events-none"></div>

        {/* Share modal */}
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          totalLosses={totalLosses}
          biggestLoss={biggestLoss}
          transactionCount={transactions.length}
          referralCode={rankData?.referralCode || referralData?.referralCode}
        />

        {/* Header with Leaderboard button */}
        <Header onLeaderboardToggle={() => setIsLeaderboardOpen(!isLeaderboardOpen)} />

        <div className="relative z-10 pt-32 pb-16 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h1 
                className="text-4xl md:text-6xl xl:text-7xl 2xl:text-8xl font-bold text-white mb-6 tracking-tight"
                style={tomorrow.style}
              >
                Track any wallet's pump.fun losses
              </h1>
              <p className="text-lg md:text-xl xl:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-4">
                Scan any Solana address to see their pump.fun losses! 🎰
              </p>
              {/* Thêm dòng chữ mới về airdrop */}
              <p className="text-base md:text-lg text-purple-300/80 max-w-2xl mx-auto leading-relaxed">
                Check your wallet and share your results on twitter to qualify for airdrop ✨
              </p>
            </div>

            <AddressSearch onAddressSubmit={setSearchAddress} />

            {isLoading && (
              <MemeProgressBar 
                currentBatch={currentBatch}
                totalBatches={totalBatches}
                realTimeStats={realTimeStats}
              />
            )}

            {/* 🆕 Only show stats cards when NOT loading and have results */}
            {!isLoading && searchAddress && transactions.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="relative overflow-hidden rounded-2xl p-6 border border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#654358]/20 via-[#17092A]/30 to-[#2F0D64]/20 opacity-60"></div>
                  <div className="relative z-10">
                    <h3 className="text-lg font-semibold text-white/80 mb-3">Total Losses</h3>
                    <p className="text-3xl md:text-4xl font-bold bg-gradient-to-b from-[#D69DDE] to-[#B873F8] bg-clip-text text-transparent">
                      {formatSOL(totalLosses)}
                    </p>
                  </div>
                </div>
                
                <div className="relative overflow-hidden rounded-2xl p-6 border border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#654358]/20 via-[#17092A]/30 to-[#2F0D64]/20 opacity-60"></div>
                  <div className="relative z-10">
                    <h3 className="text-lg font-semibold text-white/80 mb-3">Total Transactions</h3>
                    <p className="text-3xl md:text-4xl font-bold bg-gradient-to-b from-[#D69DDE] to-[#B873F8] bg-clip-text text-transparent">
                      {transactions.length}
                    </p>
                  </div>
                </div>
                
                <div className="relative overflow-hidden rounded-2xl p-6 border border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#654358]/20 via-[#17092A]/30 to-[#2F0D64]/20 opacity-60"></div>
                  <div className="relative z-10">
                    <h3 className="text-lg font-semibold text-white/80 mb-3">Biggest Loss</h3>
                    <p className="text-3xl md:text-4xl font-bold bg-gradient-to-b from-[#D69DDE] to-[#B873F8] bg-clip-text text-transparent">
                      {formatSOL(biggestLoss)}
                    </p>
                  </div>
                </div>

                <UserRankCard
                  rank={rankData?.rank ?? null}
                  totalParticipants={rankData?.totalParticipants ?? 0}
                />
              </div>
            )}

            {/* Add share button here - only after loading is complete and we have results */}
            {!isLoading && searchAddress && transactions.length > 0 && rankData && (
              <div className="text-center mt-6 mb-8">
                <div className="flex justify-center gap-3 mb-3">
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors"
                  >
                    Share on X
                  </button>
                  <button
                    onClick={forceRefresh}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors"
                    title="Refresh data from blockchain"
                  >
                    🔄 Refresh
                  </button>
                </div>
                
                {/* Referral bonus message */}
                <div className="text-center">
                  <p className="text-white/70 text-sm">
                    💎 You'll receive 5% extra token airdrop from people who use your referral link!
                  </p>
                  {(rankData?.referralCode || referralData?.referralCode) && (
                    <p className="text-white/60 text-xs mt-1">
                      Referral Code: <span className="font-mono font-medium text-purple-300">{rankData?.referralCode || referralData?.referralCode}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {!isLoading && searchAddress && transactions.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl md:text-3xl xl:text-4xl font-bold text-white mb-6 tracking-tight" style={tomorrow.style}>
                  Recent Transactions
                </h2>
                <div className="overflow-x-auto rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl shadow-2xl">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-white/20">
                        <th className="p-6 text-white/80 font-semibold text-lg">Time</th>
                        <th className="p-6 text-white/80 font-semibold text-lg">Type</th>
                        <th className="p-6 text-white/80 font-semibold text-lg">Amount</th>
                        <th className="p-6 text-white/80 font-semibold text-lg">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.signature} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                          <td className="p-6 text-white/90 text-base">
                            {new Date(tx.timestamp * 1000).toLocaleString()}
                          </td>
                          <td className="p-6 text-white/90 text-base capitalize font-medium">{tx.type}</td>
                          <td className="p-6 text-white/90 text-base font-medium">{formatSOL(tx.amount)}</td>
                          <td className="p-6">
                            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                              tx.success 
                                ? 'bg-gradient-to-r from-green-500/20 to-green-400/20 text-green-300 border border-green-400/30' 
                                : 'bg-gradient-to-r from-red-500/20 to-red-400/20 text-red-300 border border-red-400/30'
                            }`}>
                              {tx.success ? 'Success' : 'Failed'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-8 p-8 rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500/10 via-red-500/5 to-red-500/10 backdrop-blur-xl shadow-2xl">
                <div className="flex flex-col items-center text-center">
                  <h3 className="text-xl md:text-2xl font-semibold text-red-300 mb-3" style={tomorrow.style}>Error</h3>
                  <p className="text-white/80 text-lg">{error}</p>
                </div>
              </div>
            )}

            {/* LosersLeaderboard */}
            <LosersLeaderboard 
              isOpen={isLeaderboardOpen}
              onClose={() => setIsLeaderboardOpen(false)}
            />
          </div>
        </div>
      </main>
    </ClientWalletProvider>
  );
}