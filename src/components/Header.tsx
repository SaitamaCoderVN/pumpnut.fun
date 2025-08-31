'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Image from 'next/image';

interface HeaderProps {
  onLeaderboardToggle: () => void;
}

export const Header = ({ onLeaderboardToggle }: HeaderProps) => {
  const { connected } = useWallet();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-purple-900/10 backdrop-blur-xl border-b border-purple-800/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and X Logo */}
          <div className="flex items-center gap-3">
            <img src="/devfun-logo3.png" alt="Logo" className="h-8 w-auto" />
            <span className="text-white font-bold text-lg">PumpAnalytics</span>
            {/* X Logo - chỉ thêm logo X màu trắng */}
            <a 
              href="https://x.com/pump_analytics" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="ml-2 hover:opacity-80 transition-opacity"
            >
              <Image
                src="/logo-white.png"
                alt="X Logo"
                width={20}
                height={20}
                className="h-5 w-auto"
              />
            </a>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-3">
            {/* Leaderboard Button */}
            <button
              onClick={onLeaderboardToggle}
              className="bg-purple-600/60 hover:bg-purple-700/70 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 backdrop-blur-sm border border-purple-400/20"
            >
              <span className="text-lg">🏆</span>
              Leaderboard
            </button>

            {/* Connect Wallet Button */}
            <WalletMultiButton className="bg-blue-600/60 hover:bg-blue-700/70 text-white px-4 py-2 rounded-lg font-medium transition-colors backdrop-blur-sm border border-blue-400/20" />
          </div>
        </div>
      </div>
    </header>
  );
};
