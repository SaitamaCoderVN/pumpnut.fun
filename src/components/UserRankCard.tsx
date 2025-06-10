'use client';

import { motion } from 'framer-motion';

interface UserRankCardProps {
  rank: number | null;
  totalParticipants: number;
}

export const UserRankCard = ({ rank, totalParticipants }: UserRankCardProps) => {
  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '🎯';
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
      <h3 className="text-lg font-semibold text-gray-300 mb-2">Your Rank</h3>
      {rank && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="text-4xl mb-2">{getRankEmoji(rank)}</div>
          <p className="text-3xl font-bold text-purple-400">
            #{rank}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            of {totalParticipants} players
          </p>
        </motion.div>
      )}
    </div>
  );
}; 