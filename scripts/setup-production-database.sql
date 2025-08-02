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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_prize_pools_status ON prize_pools(status);
CREATE INDEX IF NOT EXISTS idx_prize_pools_created_at ON prize_pools(created_at);

-- Create anonymous_users table to track visitor UIDs
CREATE TABLE IF NOT EXISTS anonymous_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uid VARCHAR(10) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_users table to track admin permissions (using email for admin identification)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE prize_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prize_pools
-- Anyone can view prize pools
CREATE POLICY "Anyone can view prize pools" ON prize_pools
  FOR SELECT USING (true);

-- Only allow inserts/updates/deletes through application logic (no direct database access)
CREATE POLICY "Restrict direct modifications" ON prize_pools
  FOR INSERT WITH CHECK (false);

CREATE POLICY "Restrict direct updates" ON prize_pools
  FOR UPDATE USING (false);

CREATE POLICY "Restrict direct deletes" ON prize_pools
  FOR DELETE USING (false);

-- RLS Policies for anonymous_users
-- Anyone can view and insert anonymous users
CREATE POLICY "Anyone can view anonymous users" ON anonymous_users
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert anonymous users" ON anonymous_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update anonymous users" ON anonymous_users
  FOR UPDATE USING (true);

-- RLS Policies for admin_users
-- No one can directly access admin_users table (handled by application)
CREATE POLICY "Restrict admin access" ON admin_users
  FOR ALL USING (false);

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

-- Create a function to generate random alphanumeric UID
CREATE OR REPLACE FUNCTION generate_uid()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
    length INTEGER := 6 + floor(random() * 5)::INTEGER; -- Random length between 6-10
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars))::INTEGER + 1, 1);
    END LOOP;
    RETURN result;
END;
$$ language 'plpgsql';

-- Insert a default admin user (replace with your desired admin credentials)
-- Password is hashed version of 'admin123' - you should change this
INSERT INTO admin_users (email, password_hash) 
VALUES ('admin@contest.com', '$2b$10$rOzJqQZQQQQQQQQQQQQQQu') 
ON CONFLICT (email) DO NOTHING;
