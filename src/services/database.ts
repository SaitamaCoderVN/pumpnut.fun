import { supabase } from '@/lib/supabase';
import type { PumpTransaction } from '@/services/solana';

export interface UserRankData {
  rank: number;
  totalParticipants: number;
}

// Thêm interface cho referral
export interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  totalReferralLosses: number;
  pendingRewards: number;
}

export interface ReferralReward {
  id: number;
  referredWallet: string;
  rewardAmount: number;
  status: 'pending' | 'claimed' | 'expired';
  createdAt: string;
  claimedAt?: string;
}

export const updateWalletLosses = async (
  walletAddress: string,
  transactions: PumpTransaction[],
  totalLosses: number,
  biggestLoss: number
): Promise<UserRankData> => {
  try {
    console.log('Attempting to update wallet losses for:', walletAddress);
    
    // Check if table exists first
    const { data: tableCheck, error: tableError } = await supabase
      .from('wallet_losses')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.error('Table check failed:', tableError);
      // Return fallback data if table doesn't exist
      return {
        rank: 1,
        totalParticipants: 1
      };
    }

    // First, update or insert the user's data
    const { error: upsertError } = await supabase
      .from('wallet_losses')
      .upsert(
        {
          wallet_address: walletAddress,
          total_losses: totalLosses,
          total_transactions: transactions.length,
          biggest_loss: biggestLoss,
          last_updated: new Date().toISOString(),
        },
        {
          onConflict: 'wallet_address',
        }
      );

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      throw upsertError;
    }

    // Try to get user rank (with fallback if RPC function doesn't exist)
    let rankData = null;
    try {
      const { data: rankResult, error: rankError } = await supabase
        .rpc('get_wallet_rank', {
          wallet_address_param: walletAddress
        });

      if (rankError) {
        console.warn('RPC function not available, using fallback:', rankError);
        rankData = [{ rank: 1 }];
      } else {
        rankData = rankResult;
      }
    } catch (rpcError) {
      console.warn('RPC call failed, using fallback:', rpcError);
      rankData = [{ rank: 1 }];
    }

    // Get total number of participants
    const { count, error: countError } = await supabase
      .from('wallet_losses')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.warn('Count query failed, using fallback:', countError);
      return {
        rank: rankData?.[0]?.rank || 1,
        totalParticipants: 1
      };
    }

    return {
      rank: rankData?.[0]?.rank || 1,
      totalParticipants: count || 1
    };
  } catch (error) {
    console.error('Error updating wallet losses:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error,
      errorType: error?.constructor?.name,
      walletAddress,
      totalLosses,
      biggestLoss
    });
    
    // Return fallback data instead of throwing
    return {
      rank: 1,
      totalParticipants: 1
    };
  }
}; 

// Thêm các function referral mới
export const getOrCreateReferralCode = async (walletAddress: string): Promise<string> => {
  try {
    // Check if referral code already exists
    const { data: existingCode, error: selectError } = await supabase
      .from('referral_codes')
      .select('referral_code')
      .eq('wallet_address', walletAddress)
      .single();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw selectError;
    }

    if (existingCode) {
      return existingCode.referral_code;
    }

    // Generate new referral code using the database function
    const { data: newCode, error: generateError } = await supabase
      .rpc('generate_referral_code', { wallet_address: walletAddress });

    if (generateError) {
      throw generateError;
    }

    // Insert the new referral code
    const { error: insertError } = await supabase
      .from('referral_codes')
      .insert({
        wallet_address: walletAddress,
        referral_code: newCode,
        total_referrals: 0,
        total_referral_losses: 0
      });

    if (insertError) {
      throw insertError;
    }

    return newCode;
  } catch (error) {
    console.error('Error getting referral code:', error);
    throw error;
  }
};

export const getReferralData = async (walletAddress: string): Promise<ReferralData | null> => {
  try {
    const { data, error } = await supabase
      .from('referral_codes')
      .select(`
        referral_code,
        total_referrals,
        total_referral_losses
      `)
      .eq('wallet_address', walletAddress)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No referral code found
      throw error;
    }

    // Get pending rewards
    const { data: rewards, error: rewardsError } = await supabase
      .from('referral_rewards')
      .select('reward_amount')
      .eq('referrer_wallet', walletAddress)
      .eq('status', 'pending');

    if (rewardsError) {
      throw rewardsError;
    }

    const pendingRewards = rewards.reduce((sum, reward) => sum + reward.reward_amount, 0);

    return {
      referralCode: data.referral_code,
      totalReferrals: data.total_referrals,
      totalReferralLosses: data.total_referral_losses,
      pendingRewards
    };
  } catch (error) {
    console.error('Error getting referral data:', error);
    throw error;
  }
};

export const processReferral = async (
  referrerWallet: string,
  referredWallet: string,
  referralCode: string,
  totalLosses: number
): Promise<void> => {
  try {
    const { error } = await supabase
      .rpc('process_referral', {
        referrer_wallet: referrerWallet,
        referred_wallet: referredWallet,
        referral_code: referralCode,
        total_losses: totalLosses
      });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error processing referral:', error);
    throw error;
  }
};

export const getReferralRewards = async (walletAddress: string): Promise<ReferralReward[]> => {
  try {
    const { data, error } = await supabase
      .from('referral_rewards')
      .select(`
        id,
        referred_wallet,
        reward_amount,
        status,
        created_at,
        claimed_at
      `)
      .eq('referrer_wallet', walletAddress)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data.map(reward => ({
      id: reward.id,
      referredWallet: reward.referred_wallet,
      rewardAmount: reward.reward_amount,
      status: reward.status,
      createdAt: reward.created_at,
      claimedAt: reward.claimed_at
    }));
  } catch (error) {
    console.error('Error getting referral rewards:', error);
    throw error;
  }
}; 