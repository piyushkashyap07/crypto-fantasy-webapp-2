-- Add recipient_wallet column to prize_pools table
ALTER TABLE prize_pools ADD COLUMN IF NOT EXISTS recipient_wallet VARCHAR(42) DEFAULT '0xbb5C95B0555b9DE5EEf6DAacEC0fAC734E87e898';

-- Add wallet_address column to prize_pool_participants table
ALTER TABLE prize_pool_participants ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(42);
ALTER TABLE prize_pool_participants ADD COLUMN IF NOT EXISTS transaction_hash VARCHAR(66);
ALTER TABLE prize_pool_participants ADD COLUMN IF NOT EXISTS payment_confirmed BOOLEAN DEFAULT FALSE;

-- Create payments table to track all transactions
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prize_pool_id UUID NOT NULL REFERENCES prize_pools(id) ON DELETE CASCADE,
  user_uid VARCHAR(10) NOT NULL,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  wallet_address VARCHAR(42) NOT NULL,
  transaction_hash VARCHAR(66) NOT NULL,
  amount_usdt DECIMAL(12,6) NOT NULL,
  recipient_wallet VARCHAR(42) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(transaction_hash)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_prize_pool ON payments(prize_pool_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_uid);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_tx_hash ON payments(transaction_hash);

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view payments" ON payments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert payments" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update payments" ON payments FOR UPDATE USING (true);

-- Add index for recipient wallet on prize pools
CREATE INDEX IF NOT EXISTS idx_prize_pools_recipient_wallet ON prize_pools(recipient_wallet);
