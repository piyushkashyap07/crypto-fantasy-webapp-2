-- Add pool-specific team name constraints
-- This ensures team names are unique within each prize pool

-- Add a new column to track which pool a team was created for
ALTER TABLE teams ADD COLUMN IF NOT EXISTS created_for_pool_id UUID REFERENCES prize_pools(id);

-- Create a unique constraint for team names within each pool
-- This prevents duplicate team names within the same prize pool
CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_pool_name_unique 
ON teams(created_for_pool_id, team_name) 
WHERE created_for_pool_id IS NOT NULL;

-- Add a comment explaining the constraint
COMMENT ON INDEX idx_teams_pool_name_unique IS 'Ensures team names are unique within each prize pool';

-- Create a function to validate team names within a pool
CREATE OR REPLACE FUNCTION validate_team_name_in_pool(
  p_team_name VARCHAR(255),
  p_pool_id UUID,
  p_user_uid VARCHAR(10)
) RETURNS BOOLEAN AS $$
DECLARE
  existing_team RECORD;
BEGIN
  -- Check if team name already exists in this pool
  SELECT * INTO existing_team
  FROM teams 
  WHERE created_for_pool_id = p_pool_id 
    AND team_name = p_team_name
    AND user_uid != p_user_uid;
  
  -- Return true if no existing team found (name is available)
  RETURN existing_team IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION validate_team_name_in_pool IS 'Validates that a team name is unique within a specific prize pool'; 