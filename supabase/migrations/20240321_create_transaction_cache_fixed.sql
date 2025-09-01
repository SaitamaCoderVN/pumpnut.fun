-- Drop table if exists to recreate with correct schema
DROP TABLE IF EXISTS wallet_transactions;

-- Create table to cache pump.fun transactions
CREATE TABLE wallet_transactions (
    id SERIAL PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    signature TEXT NOT NULL,
    tx_timestamp INTEGER NOT NULL,
    amount DECIMAL(20, 9) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw', 'bet')),
    success BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicates
    UNIQUE(wallet_address, signature)
);

-- Create indexes for better performance
CREATE INDEX idx_wallet_transactions_wallet_address ON wallet_transactions(wallet_address);
CREATE INDEX idx_wallet_transactions_timestamp ON wallet_transactions(wallet_address, tx_timestamp DESC);
CREATE INDEX idx_wallet_transactions_signature ON wallet_transactions(signature);

-- Drop functions if they exist
DROP FUNCTION IF EXISTS get_latest_transaction_signature(TEXT);
DROP FUNCTION IF EXISTS get_cached_transactions(TEXT);

-- Create function to get latest transaction signature for a wallet
CREATE OR REPLACE FUNCTION get_latest_transaction_signature(wallet_address_param TEXT)
RETURNS TEXT AS $$
DECLARE
    latest_signature TEXT;
BEGIN
    SELECT signature INTO latest_signature
    FROM wallet_transactions
    WHERE wallet_address = wallet_address_param
    ORDER BY tx_timestamp DESC
    LIMIT 1;
    
    RETURN latest_signature;
END;
$$ LANGUAGE plpgsql;

-- Create function to get cached transactions for a wallet
CREATE OR REPLACE FUNCTION get_cached_transactions(wallet_address_param TEXT)
RETURNS TABLE(
    signature TEXT,
    tx_timestamp INTEGER,
    amount DECIMAL(20, 9),
    type TEXT,
    success BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wt.signature,
        wt.tx_timestamp,
        wt.amount,
        wt.type,
        wt.success
    FROM wallet_transactions wt
    WHERE wt.wallet_address = wallet_address_param
    ORDER BY wt.tx_timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Add columns to wallet_losses to track last sync (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wallet_losses' 
                   AND column_name = 'last_sync_signature') THEN
        ALTER TABLE wallet_losses ADD COLUMN last_sync_signature TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wallet_losses' 
                   AND column_name = 'last_sync_timestamp') THEN
        ALTER TABLE wallet_losses ADD COLUMN last_sync_timestamp INTEGER;
    END IF;
END $$;
