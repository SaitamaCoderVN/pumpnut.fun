import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Better error handling for missing environment variables
if (!supabaseUrl || !supabaseAnonKey || 
    supabaseUrl.includes('placeholder') || 
    supabaseAnonKey.includes('placeholder')) {
  console.error('❌ Missing or invalid Supabase environment variables');
  console.error('Required variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
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