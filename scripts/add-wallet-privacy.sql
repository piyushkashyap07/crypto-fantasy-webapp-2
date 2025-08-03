-- Add privacy features to payments table
-- This script adds hashed wallet addresses and recovery codes for better privacy

-- Add hashed wallet address column
ALTER TABLE payments ADD COLUMN IF NOT EXISTS wallet_address_hash VARCHAR(66);

-- Add recovery code column (8-character code)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS recovery_code VARCHAR(8);

-- Create index for faster recovery lookups
CREATE INDEX IF NOT EXISTS idx_payments_wallet_hash ON payments(wallet_address_hash);
CREATE INDEX IF NOT EXISTS idx_payments_recovery_code ON payments(recovery_code);

-- Create a function to automatically hash wallet addresses
CREATE OR REPLACE FUNCTION hash_wallet_address()
RETURNS TRIGGER AS $$
BEGIN
    -- Hash the wallet address using SHA256 (simplified for demo)
    -- In production, use proper cryptographic hashing
    NEW.wallet_address_hash = encode(sha256(NEW.wallet_address::bytea), 'hex');
    
    -- Generate recovery code (first 8 chars of hash)
    NEW.recovery_code = substring(NEW.wallet_address_hash from 1 for 8);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically hash wallet addresses
DROP TRIGGER IF EXISTS hash_wallet_address_trigger ON payments;
CREATE TRIGGER hash_wallet_address_trigger
    BEFORE INSERT OR UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION hash_wallet_address();

-- Update existing records (if any)
UPDATE payments 
SET wallet_address_hash = encode(sha256(wallet_address::bytea), 'hex'),
    recovery_code = substring(encode(sha256(wallet_address::bytea), 'hex') from 1 for 8)
WHERE wallet_address_hash IS NULL;

-- Add privacy policy
COMMENT ON TABLE payments IS 'Payment records with privacy features - wallet addresses are hashed for security';
COMMENT ON COLUMN payments.wallet_address_hash IS 'SHA256 hash of wallet address for privacy';
COMMENT ON COLUMN payments.recovery_code IS '8-character recovery code derived from wallet hash'; 