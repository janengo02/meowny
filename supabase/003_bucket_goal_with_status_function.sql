-- ============================================
-- Function to get bucket goals with current status
-- ============================================

CREATE OR REPLACE FUNCTION get_bucket_goals_with_status(
  p_bucket_id INT,
  p_user_id UUID
)
RETURNS TABLE (
  id INT,
  user_id UUID,
  bucket_id INT,
  min_amount DECIMAL(19, 2),
  max_amount DECIMAL(19, 2),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN,
  current_status DECIMAL(19, 2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bg.id,
    bg.user_id,
    bg.bucket_id,
    bg.min_amount,
    bg.max_amount,
    bg.start_date,
    bg.end_date,
    bg.notes,
    bg.created_at,
    bg.updated_at,
    -- Check if the goal period covers current time
    CASE
      WHEN bg.start_date IS NOT NULL AND bg.end_date IS NOT NULL THEN
        (NOW() >= bg.start_date AND NOW() <= bg.end_date)
      WHEN bg.start_date IS NOT NULL AND bg.end_date IS NULL THEN
        NOW() >= bg.start_date
      WHEN bg.start_date IS NULL AND bg.end_date IS NOT NULL THEN
        NOW() <= bg.end_date
      ELSE
        TRUE
    END AS is_active,
    -- Calculate goal status for all goals based on their period
    COALESCE(
      (
        SELECT
          -- Sum of transactions where bucket is to_bucket (plus)
          COALESCE(SUM(
            CASE
              WHEN t.to_bucket_id = p_bucket_id THEN t.amount
              ELSE 0
            END
          ), 0)
          -- Minus sum of transactions where bucket is from_bucket (minus)
          - COALESCE(SUM(
            CASE
              WHEN t.from_bucket_id = p_bucket_id THEN t.amount
              ELSE 0
            END
          ), 0)
        FROM transaction t
        WHERE
          t.user_id = p_user_id
          AND (t.from_bucket_id = p_bucket_id OR t.to_bucket_id = p_bucket_id)
          -- Filter by goal period
          AND (bg.start_date IS NULL OR t.transaction_date >= bg.start_date)
          AND (bg.end_date IS NULL OR t.transaction_date <= bg.end_date)
      ),
      0
    ) AS current_status
  FROM bucket_goal bg
  WHERE bg.bucket_id = p_bucket_id
    AND bg.user_id = p_user_id
  ORDER BY bg.created_at DESC;
END;
$$;
