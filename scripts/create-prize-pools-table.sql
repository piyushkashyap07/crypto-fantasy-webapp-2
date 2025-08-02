-- Create the prize_pools table
CREATE TABLE IF NOT EXISTS prize_pools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  serial_number VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  entry_fee DECIMAL(10,2) NOT NULL,
  max_participants INTEGER NOT NULL,
  current_participants INTEGER DEFAULT 0,
  duration_minutes INTEGER NOT NULL,
  prize_pool_size DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'finished')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_prize_pools_status ON prize_pools(status);

-- Create an index on created_at for ordering
CREATE INDEX IF NOT EXISTS idx_prize_pools_created_at ON prize_pools(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE prize_pools ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows everyone to read prize pools
CREATE POLICY "Anyone can view prize pools" ON prize_pools
  FOR SELECT USING (true);

-- Create a policy that allows anyone to insert prize pools (for demo purposes)
-- In production, you would want to restrict this to authenticated admin users
CREATE POLICY "Anyone can insert prize pools" ON prize_pools
  FOR INSERT WITH CHECK (true);

-- Create a policy that allows anyone to update prize pools (for demo purposes)
-- In production, you would want to restrict this to authenticated admin users
CREATE POLICY "Anyone can update prize pools" ON prize_pools
  FOR UPDATE USING (true);

-- Create a policy that allows anyone to delete prize pools (for demo purposes)
-- In production, you would want to restrict this to authenticated admin users
CREATE POLICY "Anyone can delete prize pools" ON prize_pools
  FOR DELETE USING (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_prize_pools_updated_at 
  BEFORE UPDATE ON prize_pools 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
