-- Add unique constraint for team names globally (across all users)
-- First, let's check if there are any duplicate team names
SELECT team_name, COUNT(*) as count 
FROM teams 
GROUP BY team_name 
HAVING COUNT(*) > 1;

-- If there are duplicates, you might want to rename them before applying the constraint
-- For example: UPDATE teams SET team_name = team_name || '_' || user_uid WHERE team_name IN (SELECT team_name FROM teams GROUP BY team_name HAVING COUNT(*) > 1);

-- Drop the existing unique constraint if it exists
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_user_uid_team_name_key;

-- Add new unique constraint for team_name globally
ALTER TABLE teams ADD CONSTRAINT teams_team_name_unique UNIQUE (team_name);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_teams_team_name ON teams(team_name);
