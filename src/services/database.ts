import { supabase } from '@/lib/supabase';
import type { PumpTransaction } from '@/services/solana';

export interface UserRankData {
  rank: number;
  totalParticipants: number;
  referralCode?: string;
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

    // Generate referral code if it doesn't exist
    let referralCode = walletAddress.slice(0, 8); // Use first 8 characters as default

    // Check if user already exists and has a referral code
    // Only check if the referral_code column exists
    let existingUser = null;
    try {
      const { data, error: selectError } = await supabase
        .from('wallet_losses')
        .select('referral_code')
        .eq('wallet_address', walletAddress)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.warn('Error checking existing user:', selectError);
        // If column doesn't exist, we'll handle it in the upsert
      } else {
        existingUser = data;
      }
    } catch (error) {
      console.warn('Referral code column may not exist yet:', error);
    }

    if (existingUser?.referral_code) {
      referralCode = existingUser.referral_code;
    }

    // First, update or insert the user's data
    // Handle both cases - with and without referral_code column
    let upsertData: any = {
      wallet_address: walletAddress,
      total_losses: totalLosses,
      total_transactions: transactions.length,
      biggest_loss: biggestLoss,
      last_updated: new Date().toISOString(),
    };

    // Try to include referral_code if column exists
    try {
      upsertData.referral_code = referralCode;
      
      const { error: upsertError } = await supabase
        .from('wallet_losses')
        .upsert(upsertData, {
          onConflict: 'wallet_address',
        });

      if (upsertError) {
        // If error is about referral_code column, try without it
        if (upsertError.message?.includes('referral_code')) {
          console.warn('Referral code column not found, updating without it');
          delete upsertData.referral_code;
          
          const { error: secondTryError } = await supabase
            .from('wallet_losses')
            .upsert(upsertData, {
              onConflict: 'wallet_address',
            });
            
          if (secondTryError) {
            console.error('Second upsert error:', secondTryError);
            throw secondTryError;
          }
        } else {
          console.error('Upsert error:', upsertError);
          throw upsertError;
        }
      }
    } catch (error) {
      console.error('Error in upsert operation:', error);
      throw error;
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
        totalParticipants: 1,
        referralCode: referralCode
      };
    }

    return {
      rank: rankData?.[0]?.rank || 1,
      totalParticipants: count || 1,
      referralCode: referralCode
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
      totalParticipants: 1,
      referralCode: walletAddress.slice(0, 8)
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
    // Get referral code from wallet_losses table
    const { data, error } = await supabase
      .from('wallet_losses')
      .select('referral_code')
      .eq('wallet_address', walletAddress)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No referral code found
      throw error;
    }

    if (!data?.referral_code) {
      return null;
    }

    // Count referrals
    const { count: totalReferrals } = await supabase
      .from('wallet_losses')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by', data.referral_code);

    // Sum total referral losses
    const { data: referralLossesData } = await supabase
      .from('wallet_losses')
      .select('total_losses')
      .eq('referred_by', data.referral_code);

    const totalReferralLosses = referralLossesData?.reduce((sum, item) => sum + Number(item.total_losses), 0) || 0;

    return {
      referralCode: data.referral_code,
      totalReferrals: totalReferrals || 0,
      totalReferralLosses: totalReferralLosses,
      pendingRewards: totalReferralLosses * 0.05 // 5% of referral losses as pending rewards
    };
  } catch (error) {
    console.error('Error getting referral data:', error);
    return null; // Return null instead of throwing to avoid breaking the UI
  }
};

export const processReferral = async (
  referrerCode: string,
  referredWallet: string,
  totalLosses: number
): Promise<void> => {
  try {
    // Update the referred wallet to mark who referred them
    const { error } = await supabase
      .from('wallet_losses')
      .update({ referred_by: referrerCode })
      .eq('wallet_address', referredWallet);

    if (error) {
      console.warn('Error processing referral:', error);
      // Don't throw error to avoid breaking the main flow
    }
  } catch (error) {
    console.error('Error processing referral:', error);
    // Don't throw error to avoid breaking the main flow
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

// ===== TRANSACTION CACHE FUNCTIONS =====

export interface CachedTransaction {
  signature: string;
  timestamp: number;
  amount: number;
  type: 'deposit' | 'withdraw' | 'bet';
  success: boolean;
}

export interface WalletSyncInfo {
  lastSyncSignature: string | null;
  lastSyncTimestamp: number | null;
}

// Get cached transactions for a wallet
export const getCachedTransactions = async (walletAddress: string): Promise<CachedTransaction[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_cached_transactions', {
        wallet_address_param: walletAddress
      });

    if (error) {
      console.warn('Error getting cached transactions:', error);
      return [];
    }

    return data.map((tx: any) => ({
      signature: tx.signature,
      timestamp: tx.tx_timestamp,
      amount: parseFloat(tx.amount),
      type: tx.type,
      success: tx.success
    }));
  } catch (error) {
    console.error('Error getting cached transactions:', error);
    return [];
  }
};

// Save new transactions to cache
export const saveTransactionsToCache = async (
  walletAddress: string, 
  transactions: CachedTransaction[]
): Promise<void> => {
  try {
    if (transactions.length === 0) return;

    // Prepare data for insertion
    const transactionData = transactions.map(tx => ({
      wallet_address: walletAddress,
      signature: tx.signature,
      tx_timestamp: tx.timestamp,
      amount: tx.amount,
      type: tx.type,
      success: tx.success
    }));

    const { error } = await supabase
      .from('wallet_transactions')
      .upsert(transactionData, {
        onConflict: 'wallet_address,signature',
        ignoreDuplicates: true
      });

    if (error) {
      console.warn('Error saving transactions to cache:', error);
    } else {
      console.log(`Saved ${transactions.length} transactions to cache for wallet ${walletAddress}`);
    }
  } catch (error) {
    console.error('Error saving transactions to cache:', error);
  }
};

// Get the latest transaction signature for incremental sync
export const getLatestTransactionSignature = async (walletAddress: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .rpc('get_latest_transaction_signature', {
        wallet_address_param: walletAddress
      });

    if (error) {
      console.warn('Error getting latest transaction signature:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting latest transaction signature:', error);
    return null;
  }
};

// Get wallet sync info (last synced signature and timestamp)
export const getWalletSyncInfo = async (walletAddress: string): Promise<WalletSyncInfo> => {
  try {
    const { data, error } = await supabase
      .from('wallet_losses')
      .select('last_sync_signature, last_sync_timestamp')
      .eq('wallet_address', walletAddress)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Error getting wallet sync info:', error);
    }

    return {
      lastSyncSignature: data?.last_sync_signature || null,
      lastSyncTimestamp: data?.last_sync_timestamp || null
    };
  } catch (error) {
    console.error('Error getting wallet sync info:', error);
    return {
      lastSyncSignature: null,
      lastSyncTimestamp: null
    };
  }
};

// Update wallet sync info
export const updateWalletSyncInfo = async (
  walletAddress: string,
  latestSignature: string,
  latestTimestamp: number
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('wallet_losses')
      .update({
        last_sync_signature: latestSignature,
        last_sync_timestamp: latestTimestamp
      })
      .eq('wallet_address', walletAddress);

    if (error) {
      console.warn('Error updating wallet sync info:', error);
    }
  } catch (error) {
    console.error('Error updating wallet sync info:', error);
  }
};

// Clear cache for a wallet (for force refresh)
export const clearWalletCache = async (walletAddress: string): Promise<void> => {
  try {
    // Delete cached transactions
    const { error: deleteError } = await supabase
      .from('wallet_transactions')
      .delete()
      .eq('wallet_address', walletAddress);

    if (deleteError) {
      console.warn('Error clearing transaction cache:', deleteError);
    }

    // Reset sync info
    const { error: updateError } = await supabase
      .from('wallet_losses')
      .update({
        last_sync_signature: null,
        last_sync_timestamp: null
      })
      .eq('wallet_address', walletAddress);

    if (updateError) {
      console.warn('Error resetting sync info:', updateError);
    }

    console.log(`Cache cleared for wallet: ${walletAddress}`);
  } catch (error) {
    console.error('Error clearing wallet cache:', error);
  }
}; 