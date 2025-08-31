'use client';

import { motion } from 'framer-motion';
import { Tomorrow } from 'next/font/google';

const tomorrow = Tomorrow({
  weight: '600',
  subsets: ['latin'],
});

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
    <div className="relative overflow-hidden rounded-2xl p-6 border border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-[#654358]/20 via-[#17092A]/30 to-[#2F0D64]/20 opacity-60"></div>
      <div className="relative z-10">
        <h3 className="text-lg font-semibold text-white/80 mb-3" style={tomorrow.style}>Your Rank</h3>
        {rank && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="text-4xl md:text-5xl mb-3">{getRankEmoji(rank)}</div>
            <p className="text-3xl md:text-4xl font-bold bg-gradient-to-b from-[#D69DDE] to-[#B873F8] bg-clip-text text-transparent mb-2">
              #{rank}
            </p>
            <p className="text-sm text-white/60 font-medium">
              of {totalParticipants} players
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}; 