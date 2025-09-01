-- Add missing referral_code column to wallet_losses table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wallet_losses' 
                   AND column_name = 'referral_code') THEN
        ALTER TABLE wallet_losses ADD COLUMN referral_code TEXT;
        -- Create index on referral_code for performance
        CREATE INDEX idx_wallet_losses_referral_code ON wallet_losses(referral_code);
    END IF;
    
    -- Add referred_by column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wallet_losses' 
                   AND column_name = 'referred_by') THEN
        ALTER TABLE wallet_losses ADD COLUMN referred_by TEXT;
        -- Create index for referral queries
        CREATE INDEX idx_wallet_losses_referred_by ON wallet_losses(referred_by);
    END IF;
END $$;

-- Create or update the get_wallet_rank function
CREATE OR REPLACE FUNCTION get_wallet_rank(wallet_address_param TEXT)
RETURNS TABLE(rank BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY total_losses DESC) as rank
    FROM wallet_losses wl
    WHERE wl.wallet_address = wallet_address_param;
END;
$$ LANGUAGE plpgsql;
