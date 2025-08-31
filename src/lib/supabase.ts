import { createClient } from '@supabase/supabase-js';

// Create supabase client with fallback values for build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface WalletLoss {
  id: number;
  wallet_address: string;
  total_losses: number;
  total_transactions: number;
  biggest_loss: number;
  last_updated: string;
} 