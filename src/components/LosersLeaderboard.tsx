'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { WalletLoss } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface ReferralStats {
  wallet_address: string;
  total_referrals: number;
  total_referral_losses: number;
  pending_rewards: number;
}

interface LosersLeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LosersLeaderboard = ({ isOpen, onClose }: LosersLeaderboardProps) => {
  const [topLosers, setTopLosers] = useState<WalletLoss[]>([]);
  const [topReferrers, setTopReferrers] = useState<ReferralStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'losers' | 'referrers'>('losers');

  useEffect(() => {
    if (isOpen) {
      fetchTopLosers();
      fetchTopReferrers();
    }
  }, [isOpen]);

  const fetchTopLosers = async () => {
    try {
      console.log('Fetching top losers from Supabase...');
      
      const { data, error } = await supabase
        .from('wallet_losses')
        .select('*')
        .order('total_losses', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('Top losers data:', data);
      setTopLosers(data || []);
    } catch (error) {
      console.error('Error fetching top losers:', error);
    }
  };

  const fetchTopReferrers = async () => {
    try {
      console.log('Fetching top referrers from Supabase...');
      
      const { data, error } = await supabase
        .from('referral_codes')
        .select(`
          wallet_address,
          total_referrals,
          total_referral_losses
        `)
        .order('total_referrals', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching top referrers:', error);
        return;
      }

      // Calculate pending rewards for each referrer
      const referrersWithRewards = await Promise.all(
        (data || []).map(async (referrer) => {
          const { data: rewards, error: rewardsError } = await supabase
            .from('referral_rewards')
            .select('reward_amount')
            .eq('referrer_wallet', referrer.wallet_address)
            .eq('status', 'pending');

          if (rewardsError) {
            console.warn('Error fetching rewards for', referrer.wallet_address, rewardsError);
            return {
              ...referrer,
              pending_rewards: 0
            };
          }

          const pendingRewards = rewards.reduce((sum, reward) => sum + reward.reward_amount, 0);
          return {
            ...referrer,
            pending_rewards: pendingRewards
          };
        })
      );

      console.log('Top referrers data:', referrersWithRewards);
      setTopReferrers(referrersWithRewards);
    } catch (error) {
      console.error('Error fetching top referrers:', error);
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed right-0 top-0 h-screen w-full md:w-96 z-40"
        >
          {/* Semi-transparent background with purple tint - more transparent */}
          <div className="absolute inset-0 bg-purple-900/20 backdrop-blur-xl"></div>
          
          {/* Content container with better spacing */}
          <div className="relative h-full overflow-y-auto pt-24 pb-8 px-6">
            <div className="bg-purple-900/10 backdrop-blur-lg rounded-xl border border-purple-400/20 shadow-2xl">
              {/* Header with close button */}
              <div className="flex items-center justify-between p-4 border-b border-purple-400/15 bg-purple-800/20 rounded-t-xl">
                <h2 className="text-xl font-bold text-white">🏆 Leaderboard</h2>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors text-2xl hover:bg-purple-600/20 p-1 rounded-full"
                >
                  ✕
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-purple-400/15">
                <button
                  onClick={() => setActiveTab('losers')}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                    activeTab === 'losers'
                      ? 'text-purple-300 border-b-2 border-purple-400 bg-purple-800/15'
                      : 'text-white/70 hover:text-white hover:bg-purple-800/5'
                  }`}
                >
                  🏆 Top Losers
                </button>
                <button
                  onClick={() => setActiveTab('referrers')}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                    activeTab === 'referrers'
                      ? 'text-purple-300 border-b-2 border-purple-400 bg-purple-800/15'
                      : 'text-white/70 hover:text-white hover:bg-purple-800/5'
                  }`}
                >
                  🚀 Top Ref
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="text-purple-300">Loading...</div>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    {activeTab === 'losers' && (
                      <motion.div
                        key="losers"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {topLosers.map((loser, index) => (
                          <motion.div
                            key={loser.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 bg-purple-800/15 rounded-lg hover:bg-purple-700/25 transition-colors border border-purple-400/15 backdrop-blur-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-2xl font-bold text-purple-300 w-8">
                                #{index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="text-white font-mono text-sm">
                                  {formatAddress(loser.wallet_address)}
                                </div>
                                <div className="text-red-300 font-bold mt-1">
                                  {formatSOL(loser.total_losses)}
                                </div>
                                <div className="text-xs text-purple-200 mt-1">
                                  {loser.total_transactions} transactions
                                </div>
                              </div>
                              <div className="text-right text-xs">
                                <div className="text-purple-200">Biggest Loss</div>
                                <div className="text-red-300 font-mono mt-1">
                                  {formatSOL(loser.biggest_loss)}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}

                    {activeTab === 'referrers' && (
                      <motion.div
                        key="referrers"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {topReferrers.map((referrer, index) => (
                          <motion.div
                            key={referrer.wallet_address}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 bg-purple-800/15 rounded-lg hover:bg-purple-700/25 transition-colors border border-purple-400/15 backdrop-blur-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-2xl font-bold text-green-300 w-8">
                                #{index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="text-white font-mono text-sm">
                                  {formatAddress(referrer.wallet_address)}
                                </div>
                                <div className="text-green-300 font-bold mt-1">
                                  {referrer.total_referrals} referrals
                                </div>
                                <div className="text-xs text-purple-200 mt-1">
                                  {formatSOL(referrer.total_referral_losses)} total losses referred
                                </div>
                              </div>
                              <div className="text-right text-xs">
                                <div className="text-purple-200">Pending Rewards</div>
                                <div className="text-yellow-300 font-mono mt-1">
                                  {formatSOL(referrer.pending_rewards)}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 