-- Create locked_prices table to store snapshot prices when pool becomes ongoing
CREATE TABLE IF NOT EXISTS locked_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prize_pool_id UUID NOT NULL REFERENCES prize_pools(id) ON DELETE CASCADE,
  coin_id VARCHAR(255) NOT NULL,
  locked_price DECIMAL(20,8) NOT NULL,
  locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prize_pool_id, coin_id)
);

-- Create final_prices table to store snapshot prices when pool finishes
CREATE TABLE IF NOT EXISTS final_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prize_pool_id UUID NOT NULL REFERENCES prize_pools(id) ON DELETE CASCADE,
  coin_id VARCHAR(255) NOT NULL,
  final_price DECIMAL(20,8) NOT NULL,
  finalized_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prize_pool_id, coin_id)
);

-- Add started_at and ends_at columns to prize_pools
ALTER TABLE prize_pools ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE prize_pools ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP WITH TIME ZONE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_locked_prices_pool ON locked_prices(prize_pool_id);
CREATE INDEX IF NOT EXISTS idx_final_prices_pool ON final_prices(prize_pool_id);

-- Enable Row Level Security
ALTER TABLE locked_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE final_prices ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view locked prices" ON locked_prices FOR SELECT USING (true);
CREATE POLICY "Anyone can insert locked prices" ON locked_prices FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view final prices" ON final_prices FOR SELECT USING (true);
CREATE POLICY "Anyone can insert final prices" ON final_prices FOR INSERT WITH CHECK (true);
