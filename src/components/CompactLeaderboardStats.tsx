'use client';

import { useLeaderboardStats } from '@/hooks/useLeaderboardStats';

interface CompactLeaderboardStatsProps {
  className?: string;
}

export const CompactLeaderboardStats = ({ className = '' }: CompactLeaderboardStatsProps) => {
  const { stats, isLoading, error } = useLeaderboardStats();

  const formatSOL = (amount: number) => `${amount.toFixed(1)} SOL`;
  const formatNumber = (num: number) => num.toLocaleString();

  if (isLoading) {
    return (
      <div className={`bg-white/5 backdrop-blur-xl rounded-lg border border-white/10 p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-white/20 rounded mb-2 w-3/4"></div>
          <div className="h-6 bg-white/30 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={`bg-red-500/10 backdrop-blur-xl rounded-lg border border-red-500/20 p-4 ${className}`}>
        <p className="text-red-300 text-sm">Failed to load stats</p>
      </div>
    );
  }

  return (
    <div className={`bg-white/5 backdrop-blur-xl rounded-lg border border-white/10 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white/80">Community Stats</h3>
        <span className="text-lg">📊</span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Total Losses:</span>
          <span className="text-red-300 font-medium">{formatSOL(stats.totalLosses)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Traders:</span>
          <span className="text-blue-300 font-medium">{formatNumber(stats.totalParticipants)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Avg Loss:</span>
          <span className="text-yellow-300 font-medium">{formatSOL(stats.averageLoss)}</span>
        </div>
      </div>
    </div>
  );
};
