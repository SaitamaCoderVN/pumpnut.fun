'use client';

import { useLeaderboardStats } from '@/hooks/useLeaderboardStats';

export const LeaderboardStats = () => {
  const { stats, isLoading, error, refreshStats } = useLeaderboardStats();

  const formatSOL = (amount: number) => `${amount.toFixed(2)} SOL`;
  const formatNumber = (num: number) => num.toLocaleString();

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto mb-12">
        <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-white/20 rounded-lg mb-6 w-1/3 mx-auto"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/10 rounded-xl p-4">
                  <div className="h-4 bg-white/20 rounded mb-2"></div>
                  <div className="h-6 bg-white/30 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto mb-12">
        <div className="bg-gradient-to-br from-red-500/10 via-red-500/5 to-red-500/10 backdrop-blur-xl rounded-2xl border border-red-500/20 p-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-red-300 mb-2">Error Loading Statistics</h3>
            <p className="text-white/80">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="w-full max-w-6xl mx-auto mb-12">
      <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-b from-[#D69DDE] to-[#B873F8] bg-clip-text text-transparent">
              📊 Community Loss Report
            </h2>
            <button
              onClick={refreshStats}
              disabled={isLoading}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all duration-200 flex items-center gap-2"
            >
              <span className={isLoading ? 'animate-spin' : ''}>🔄</span>
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          <p className="text-white/70 text-lg">
            Total losses across all pump.fun traders
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Losses */}
          <div className="relative overflow-hidden rounded-xl p-6 border border-white/20 bg-gradient-to-br from-red-500/20 via-red-500/10 to-red-500/20 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-red-500/10 opacity-60"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white/80">Total Losses</h3>
                <span className="text-2xl">💸</span>
              </div>
              <p className="text-3xl md:text-4xl font-bold text-red-300">
                {formatSOL(stats.totalLosses)}
              </p>
              <p className="text-sm text-white/60 mt-1">
                Across all traders
              </p>
            </div>
          </div>

          {/* Total Participants */}
          <div className="relative overflow-hidden rounded-xl p-6 border border-white/20 bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-blue-500/20 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-blue-500/10 opacity-60"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white/80">Traders</h3>
                <span className="text-2xl">👥</span>
              </div>
              <p className="text-3xl md:text-4xl font-bold text-blue-300">
                {formatNumber(stats.totalParticipants)}
              </p>
              <p className="text-sm text-white/60 mt-1">
                Active participants
              </p>
            </div>
          </div>

          {/* Average Loss */}
          <div className="relative overflow-hidden rounded-xl p-6 border border-white/20 bg-gradient-to-br from-yellow-500/20 via-yellow-500/10 to-yellow-500/20 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-yellow-500/10 opacity-60"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white/80">Average Loss</h3>
                <span className="text-2xl">📈</span>
              </div>
              <p className="text-3xl md:text-4xl font-bold text-yellow-300">
                {formatSOL(stats.averageLoss)}
              </p>
              <p className="text-sm text-white/60 mt-1">
                Per trader
              </p>
            </div>
          </div>

          {/* Biggest Loss */}
          <div className="relative overflow-hidden rounded-xl p-6 border border-white/20 bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-purple-500/20 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-purple-500/10 opacity-60"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white/80">Biggest Loss</h3>
                <span className="text-2xl">🔥</span>
              </div>
              <p className="text-3xl md:text-4xl font-bold text-purple-300">
                {formatSOL(stats.biggestLoss)}
              </p>
              <p className="text-sm text-white/60 mt-1">
                Single transaction
              </p>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Transactions */}
          <div className="bg-gradient-to-r from-white/5 to-white/10 rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white/80 mb-2">Total Transactions</h3>
                <p className="text-2xl font-bold text-white">
                  {formatNumber(stats.totalTransactions)}
                </p>
                <p className="text-sm text-white/60 mt-1">
                  All pump.fun trades
                </p>
              </div>
              <span className="text-3xl">⚡</span>
            </div>
          </div>

          {/* Last Updated */}
          <div className="bg-gradient-to-r from-white/5 to-white/10 rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white/80 mb-2">Last Updated</h3>
                <p className="text-lg font-bold text-white">
                  {new Date(stats.lastUpdated).toLocaleDateString()}
                </p>
                <p className="text-sm text-white/60 mt-1">
                  {new Date(stats.lastUpdated).toLocaleTimeString()}
                </p>
              </div>
              <span className="text-3xl">🕒</span>
            </div>
          </div>
        </div>

        {/* Fun Fact */}
        <div className="mt-8 text-center">
          <div className="bg-gradient-to-r from-[#654358]/20 via-[#17092A]/30 to-[#2F0D64]/20 rounded-xl p-6 border border-white/10">
            <p className="text-white/80 text-lg">
              <span className="font-semibold text-[#B873F8]">
                {formatSOL(stats.totalLosses)}
              </span> lost across{' '}
              <span className="font-semibold text-[#D69DDE]">
                {formatNumber(stats.totalParticipants)}
              </span> traders
            </p>
            <p className="text-white/60 text-sm mt-2">
              That's an average of {formatSOL(stats.averageLoss)} per trader! 💸
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
