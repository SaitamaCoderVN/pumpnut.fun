'use client';

import { motion } from 'framer-motion';
import { Tomorrow } from 'next/font/google';

const tomorrow = Tomorrow({
  weight: '600',
  subsets: ['latin'],
});

interface MemeProgressBarProps {
  currentBatch: number;
  totalBatches: number;
}

export const MemeProgressBar = ({ currentBatch, totalBatches }: MemeProgressBarProps) => {
  const progress = (currentBatch / totalBatches) * 100;
  
  // Determine stage based on progress
  let stage = '';
  let emoji = '';
  let painLevel = 0;
  
  if (progress < 25) {
    stage = 'Copium Stage';
    emoji = '💸';
  } else if (progress < 50) {
    stage = 'Hopium';
    emoji = '🚀';
  } else if (progress < 75) {
    stage = 'Reality';
    emoji = '😐';
  } else {
    stage = 'Pain';
    emoji = '😭';
  }
  
  painLevel = Math.round(progress);

  return (
    <div className="max-w-4xl mx-auto p-8 rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl shadow-2xl">
      {/* Stage Display */}
      <div className="text-center mb-6">
        <h2 
          className="text-3xl md:text-4xl font-bold text-white mb-2"
          style={tomorrow.style}
        >
          {stage} {emoji}
        </h2>
        <p 
          className="text-lg md:text-xl text-white/80"
          style={tomorrow.style}
        >
          Processing batch {currentBatch}/{totalBatches}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Stage Indicators */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div 
            className={`text-sm font-medium ${progress >= 0 ? 'text-purple-400' : 'text-white/40'}`}
            style={tomorrow.style}
          >
            Copium
          </div>
        </div>
        <div className="text-center">
          <div 
            className={`text-sm font-medium ${progress >= 25 ? 'text-purple-400' : 'text-white/40'}`}
            style={tomorrow.style}
          >
            Hopium
          </div>
        </div>
        <div className="text-center">
          <div 
            className={`text-sm font-medium ${progress >= 50 ? 'text-purple-400' : 'text-white/40'}`}
            style={tomorrow.style}
          >
            Reality
          </div>
        </div>
        <div className="text-center">
          <div 
            className={`text-sm font-medium ${progress >= 75 ? 'text-purple-400' : 'text-white/40'}`}
            style={tomorrow.style}
          >
            Pain
          </div>
        </div>
      </div>

      {/* Pain Level */}
      <div className="text-center">
        <div 
          className="text-lg md:text-xl font-bold text-red-400"
          style={tomorrow.style}
        >
          Pain Level: {painLevel}%
        </div>
      </div>
    </div>
  );
};
