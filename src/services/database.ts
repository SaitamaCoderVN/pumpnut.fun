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

    if (upsertError) throw upsertError;

    // Then, get the user's rank
    const { data: rankData, error: rankError } = await supabase
      .rpc('get_wallet_rank', {
        wallet_address_param: walletAddress
      });

    if (rankError) throw rankError;

    // Get total number of participants
    const { count, error: countError } = await supabase
      .from('wallet_losses')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    return {
      rank: rankData[0].rank,
      totalParticipants: count || 0
    };
  } catch (error) {
    console.error('Error updating wallet losses:', error);
    throw error;
  }
}; 