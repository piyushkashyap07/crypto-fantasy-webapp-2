-- Create the teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_uid VARCHAR(10) NOT NULL,
  team_name VARCHAR(255) NOT NULL,
  tokens JSONB NOT NULL,
  total_points INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_uid, team_name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_teams_user_uid ON teams(user_uid);
CREATE INDEX IF NOT EXISTS idx_teams_created_at ON teams(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own teams" ON teams
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own teams" ON teams
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own teams" ON teams
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own teams" ON teams
  FOR DELETE USING (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_teams_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_teams_updated_at 
  BEFORE UPDATE ON teams 
  FOR EACH ROW 
  EXECUTE FUNCTION update_teams_updated_at_column();
