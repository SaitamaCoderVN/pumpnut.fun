'use client';

import { Header } from '@/components/Header';
import { AddressSearch } from '@/components/AddressSearch';
import { usePumpTransactions } from '@/hooks/usePumpTransactions';
import { useState } from 'react';
import { MemeProgressBar } from '@/components/MemeProgressBar';
import { LosersLeaderboard } from '@/components/LosersLeaderboard';
import { UserRankCard } from '@/components/UserRankCard';
import { ClientWalletProvider } from '@/components/ClientWalletProvider';

export default function Home() {
  const [searchAddress, setSearchAddress] = useState<string>('');
  const { 
    transactions, 
    isLoading, 
    error, 
    totalLosses, 
    biggestLoss,
    currentBatch,
    totalBatches,
    rankData
  } = usePumpTransactions(searchAddress);

  const formatSOL = (amount: number) => {
    return `${amount.toFixed(2)} SOL`;
  };

  return (
        <ClientWalletProvider>
    <main className="min-h-screen bg-gradient-to-b from-black to-purple-950">
      <Header />
      
      <div className="pt-32 pb-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-white mb-4">
              Track any wallet's pump.fun losses
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Enter any Solana address to see their pump.fun losses! 🎰
            </p>
          </div>

          <AddressSearch onAddressSubmit={setSearchAddress} />

          {isLoading ? (
            <div className="mb-8">
              <MemeProgressBar 
                currentBatch={currentBatch || 0} 
                totalBatches={totalBatches || 0}
              />
            </div>
          ) : (
            searchAddress && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">Total Losses</h3>
                  <p className="text-3xl font-bold text-white">
                    {formatSOL(totalLosses)}
                  </p>
                </div>
                
                <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">Total Transactions</h3>
                  <p className="text-3xl font-bold text-white">
                    {transactions.length}
                  </p>
                </div>
                
                <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">Biggest Loss</h3>
                  <p className="text-3xl font-bold text-white">
                    {formatSOL(biggestLoss)}
                  </p>
                </div>

                <UserRankCard
                  rank={rankData?.rank ?? null}
                  totalParticipants={rankData?.totalParticipants ?? 0}
                />
              </div>
            )
          )}

          {!isLoading && searchAddress && transactions.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-white mb-6">Recent Transactions</h2>
              <div className="overflow-x-auto bg-white/5 backdrop-blur-lg rounded-xl border border-white/10">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-white/10">
                      <th className="p-4 text-gray-300">Time</th>
                      <th className="p-4 text-gray-300">Type</th>
                      <th className="p-4 text-gray-300">Amount</th>
                      <th className="p-4 text-gray-300">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.signature} className="border-b border-white/5">
                        <td className="p-4 text-white">
                          {new Date(tx.timestamp * 1000).toLocaleString()}
                        </td>
                        <td className="p-4 text-white capitalize">{tx.type}</td>
                        <td className="p-4 text-white">{formatSOL(tx.amount)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-sm ${
                            tx.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
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
            <div className="mt-8 p-6 bg-white/5 backdrop-blur-lg rounded-xl border border-red-500/20">
              <div className="flex flex-col items-center text-center">
                <h3 className="text-xl font-semibold text-red-400 mb-2">Error</h3>
                <p className="text-gray-300">{error}</p>
              </div>
            </div>
          )}

          <LosersLeaderboard />
        </div>
      </div>
    </main>
        </ClientWalletProvider>

  );
}
