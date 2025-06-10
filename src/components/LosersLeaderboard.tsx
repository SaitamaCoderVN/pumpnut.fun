'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { WalletLoss } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export const LosersLeaderboard = () => {
  const [topLosers, setTopLosers] = useState<WalletLoss[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchTopLosers();
  }, []);

  const fetchTopLosers = async () => {
    try {
      const { data, error } = await supabase
        .from('wallet_losses')
        .select('*')
        .order('total_losses', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTopLosers(data || []);
    } catch (error) {
      console.error('Error fetching top losers:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatSOL = (amount: number) => {
    return `${amount.toFixed(2)} SOL`;
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-purple-600 text-white p-3 rounded-l-lg shadow-lg hover:bg-purple-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <span className={`${isOpen ? 'rotate-180' : ''} transition-transform`}>
            {isOpen ? '→' : '←'}
          </span>
        </div>
      </button>

      {/* Leaderboard Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed right-0 top-0 h-screen w-full md:w-96 z-40 bg-black/95 backdrop-blur-xl shadow-2xl"
          >
            <div className="h-full overflow-y-auto pt-20 pb-8 px-4">
              <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">🏆</span> Top Losers
                  </h2>
                  {loading ? (
                    <div className="flex items-center justify-center h-40">
                      <div className="text-purple-400">Loading...</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {topLosers.map((loser, index) => (
                        <motion.div
                          key={loser.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-2xl font-bold text-purple-400 w-8">
                              #{index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="text-white font-mono text-sm">
                                {formatAddress(loser.wallet_address)}
                              </div>
                              <div className="text-red-400 font-bold mt-1">
                                {formatSOL(loser.total_losses)}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {loser.total_transactions} transactions
                              </div>
                            </div>
                            <div className="text-right text-xs">
                              <div className="text-gray-400">Biggest Loss</div>
                              <div className="text-red-400 font-mono mt-1">
                                {formatSOL(loser.biggest_loss)}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}; 