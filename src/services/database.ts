import { supabase } from '@/lib/supabase';
import type { PumpTransaction } from '@/services/solana';

export interface UserRankData {
  rank: number;
  totalParticipants: number;
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