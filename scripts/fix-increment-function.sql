-- Fix the increment function to properly handle full pools
CREATE OR REPLACE FUNCTION increment_prize_pool_participants(pool_id UUID)
RETURNS void AS $$
DECLARE
  pool_record RECORD;
BEGIN
  -- Get current pool data
  SELECT * INTO pool_record FROM prize_pools WHERE id = pool_id;
  
  -- Only increment if not already at max
  IF pool_record.current_participants < pool_record.max_participants THEN
    UPDATE prize_pools 
    SET current_participants = current_participants + 1,
        updated_at = NOW()
    WHERE id = pool_id;
  END IF;
  
  -- Check if pool should start (if it reaches or exceeds max participants)
  UPDATE prize_pools 
  SET status = 'ongoing',
      started_at = NOW()
  WHERE id = pool_id 
    AND status = 'upcoming' 
    AND current_participants >= max_participants;
END;
$$ LANGUAGE plpgsql; 