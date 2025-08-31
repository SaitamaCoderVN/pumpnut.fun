import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  console.error('Missing or invalid Supabase environment variables');
  // You might want to throw an error or use a fallback
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder_key'
);

export interface WalletLoss {
  id: number;
  wallet_address: string;
  total_losses: number;
  total_transactions: number;
  biggest_loss: number;
  last_updated: string;
} 