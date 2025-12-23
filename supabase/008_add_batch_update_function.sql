-- ============================================
-- Performance Optimization: Batch Update Function
-- ============================================
-- This function allows batch updating of bucket_value_history records
-- in a single query instead of N individual queries.
-- This dramatically improves performance when adjusting historical records.
-- Uses JSONB to properly handle NULL values in total_units

CREATE OR REPLACE FUNCTION batch_update_bucket_value_history(
  p_user_id UUID,
  p_updates JSONB
)
RETURNS VOID AS $$
BEGIN
  -- Update all records using JSONB which properly handles NULL values
  -- p_updates format: [{"id": 1, "contributed_amount": 100, "market_value": 100, "total_units": 50}, ...]
  UPDATE bucket_value_history
  SET
    contributed_amount = (updates.value->>'contributed_amount')::DECIMAL,
    market_value = (updates.value->>'market_value')::DECIMAL,
    total_units = CASE
      WHEN updates.value->>'total_units' IS NULL THEN NULL
      ELSE (updates.value->>'total_units')::DECIMAL
    END,
    updated_at = NOW()
  FROM jsonb_array_elements(p_updates) AS updates
  WHERE bucket_value_history.id = (updates.value->>'id')::INTEGER
    AND bucket_value_history.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION batch_update_bucket_value_history IS 'Batch update multiple bucket_value_history records in a single query using JSONB. Properly handles NULL values for total_units. Used to improve performance when adjusting historical records after transaction/market value changes.';
