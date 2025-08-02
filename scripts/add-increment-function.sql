-- Create function to increment prize pool participant count
CREATE OR REPLACE FUNCTION increment_prize_pool_participants(pool_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prize_pools 
  SET current_participants = current_participants + 1,
      updated_at = NOW()
  WHERE id = pool_id;
  
  -- Check if pool should start (if it reaches max participants)
  UPDATE prize_pools 
  SET status = 'ongoing',
      started_at = NOW()
  WHERE id = pool_id 
    AND status = 'upcoming' 
    AND current_participants >= max_participants;
END;
$$ LANGUAGE plpgsql;
