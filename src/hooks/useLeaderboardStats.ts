import { useState, useEffect, useCallback } from 'react';
import { getLeaderboardStats, LeaderboardStats } from '@/services/database';

export const useLeaderboardStats = () => {
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getLeaderboardStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching leaderboard stats:', err);
      setError('Failed to load leaderboard statistics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshStats = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refreshStats
  };
};
