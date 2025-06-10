'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface MemeProgressBarProps {
  currentBatch: number;
  totalBatches: number;
}

export const MemeProgressBar = ({ currentBatch, totalBatches }: MemeProgressBarProps) => {
  const [internalProgress, setInternalProgress] = useState(0);
  
  // Calculate actual progress percentage
  const actualProgress = totalBatches > 0 
    ? Math.round((currentBatch / totalBatches) * 100) 
    : 0;

  // Log progress values for debugging
  console.log('Progress values:', { currentBatch, totalBatches, actualProgress });

  useEffect(() => {
    const timer = setInterval(() => {
      setInternalProgress(prev => {
        if (prev < actualProgress) {
          return Math.min(prev + 1, actualProgress);
        }
        return prev;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [actualProgress]);

  const getColor = () => {
    if (internalProgress < 33) return 'rgb(34, 197, 94)'; // Green
    if (internalProgress < 66) return 'rgb(234, 179, 8)'; // Yellow
    return 'rgb(239, 68, 68)'; // Red
  };

  const getMessage = () => {
    if (internalProgress < 33) return 'Hopium Stage';
    if (internalProgress < 66) return 'Copium Stage';
    return 'Reality Stage';
  };

  return (
    <div className="w-[70%] mx-auto">
      {/* Title */}
      <div className="text-center mb-6">
        <motion.div
          className="text-2xl font-bold mb-2"
          style={{ color: getColor() }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {getMessage()} 💸
        </motion.div>
        <div className="text-lg font-mono text-gray-400">
          Processing batch {currentBatch}/{totalBatches}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-8 bg-gray-800 rounded-lg overflow-hidden">
        <motion.div
          className="h-full transition-colors duration-1000 relative"
          style={{
            width: `${internalProgress}%`,
            backgroundColor: getColor(),
          }}
        >
          {/* Spark effect */}
          <motion.div
            className="absolute right-0 top-0 h-full w-4"
            animate={{
              opacity: [0, 1, 0],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
            }}
          >
            <div className="h-full w-full bg-white/50 blur-sm" />
          </motion.div>
        </motion.div>
      </div>

      {/* Stage indicators */}
      <div className="flex justify-between mt-2 text-sm font-mono">
        <span className={internalProgress < 33 ? 'text-green-500 font-bold' : 'text-green-500/50'}>
          Hopium
        </span>
        <span className={internalProgress >= 33 && internalProgress < 66 ? 'text-yellow-500 font-bold' : 'text-yellow-500/50'}>
          Copium
        </span>
        <span className={internalProgress >= 66 ? 'text-red-500 font-bold' : 'text-red-500/50'}>
          Reality
        </span>
      </div>

      {/* Pain Level */}
      <div className="text-center mt-4">
        <span className="text-red-500 font-mono">
          Pain Level: {internalProgress}%
        </span>
      </div>
    </div>
  );
};
