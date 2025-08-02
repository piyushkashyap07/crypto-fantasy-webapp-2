-- Add prize distribution columns to prize_pools table
ALTER TABLE prize_pools ADD COLUMN IF NOT EXISTS distribution_type VARCHAR(20) DEFAULT 'percentage' CHECK (distribution_type IN ('fixed', 'percentage'));
ALTER TABLE prize_pools ADD COLUMN IF NOT EXISTS distribution_config JSONB DEFAULT '{}';

-- Create prize_distributions table for detailed prize breakdown
CREATE TABLE IF NOT EXISTS prize_distributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prize_pool_id UUID NOT NULL REFERENCES prize_pools(id) ON DELETE CASCADE,
  rank_from INTEGER NOT NULL,
  rank_to INTEGER NOT NULL,
  reward_amount DECIMAL(12,2), -- For fixed distribution
  reward_percentage DECIMAL(5,2), -- For percentage distribution
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create final_rankings table to store final results with prizes
CREATE TABLE IF NOT EXISTS final_rankings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prize_pool_id UUID NOT NULL REFERENCES prize_pools(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_uid VARCHAR(10) NOT NULL,
  final_rank INTEGER NOT NULL,
  final_score DECIMAL(10,2) NOT NULL,
  prize_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  is_tie BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prize_pool_id, team_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_prize_distributions_pool ON prize_distributions(prize_pool_id);
CREATE INDEX IF NOT EXISTS idx_final_rankings_pool ON final_rankings(prize_pool_id);
CREATE INDEX IF NOT EXISTS idx_final_rankings_rank ON final_rankings(prize_pool_id, final_rank);

-- Enable Row Level Security
ALTER TABLE prize_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE final_rankings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view prize distributions" ON prize_distributions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert prize distributions" ON prize_distributions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update prize distributions" ON prize_distributions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete prize distributions" ON prize_distributions FOR DELETE USING (true);

CREATE POLICY "Anyone can view final rankings" ON final_rankings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert final rankings" ON final_rankings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update final rankings" ON final_rankings FOR UPDATE USING (true);
