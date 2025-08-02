-- Create the prize_pool_participants table
CREATE TABLE IF NOT EXISTS prize_pool_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prize_pool_id UUID NOT NULL REFERENCES prize_pools(id) ON DELETE CASCADE,
  user_uid VARCHAR(10) NOT NULL,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prize_pool_id, user_uid, team_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_participants_prize_pool ON prize_pool_participants(prize_pool_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON prize_pool_participants(user_uid);
CREATE INDEX IF NOT EXISTS idx_participants_team ON prize_pool_participants(team_id);

-- Enable Row Level Security (RLS)
ALTER TABLE prize_pool_participants ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view participants" ON prize_pool_participants
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert participants" ON prize_pool_participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete participants" ON prize_pool_participants
  FOR DELETE USING (true);
