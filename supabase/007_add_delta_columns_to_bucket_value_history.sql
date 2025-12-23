-- ============================================
-- Performance Optimization: Add Delta Columns to bucket_value_history
-- ============================================
-- This migration adds delta columns to store the change amounts directly,
-- eliminating the need to join with the transaction table during adjustments.
--
-- Benefits:
-- - No need to fetch transaction data during history adjustments
-- - Faster recalculations when inserting/deleting historical records
-- - Simpler queries with fewer joins

-- Add delta columns to track the change amounts
ALTER TABLE bucket_value_history
  ADD COLUMN contributed_amount_delta DECIMAL DEFAULT 0,
  ADD COLUMN market_value_delta DECIMAL DEFAULT 0,
  ADD COLUMN total_units_delta DECIMAL DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN bucket_value_history.contributed_amount_delta IS 'The change in contributed amount from the previous record (delta). For transactions: the transaction amount (positive for deposits, negative for withdrawals). For market updates: 0.';
COMMENT ON COLUMN bucket_value_history.market_value_delta IS 'The change in market value from the previous record (delta). For transactions: same as contributed_amount_delta. For market updates: difference from previous market value.';
COMMENT ON COLUMN bucket_value_history.total_units_delta IS 'The change in total units from the previous record (delta). For transactions with units: the unit change. NULL if units are not tracked.';

-- Backfill existing records with calculated deltas
-- This is a one-time operation to populate deltas for existing historical data

-- For transaction-type records, calculate deltas from the transaction table
UPDATE bucket_value_history h
SET
  contributed_amount_delta = CASE
    WHEN t.from_bucket_id = h.bucket_id THEN -t.amount
    WHEN t.to_bucket_id = h.bucket_id THEN t.amount
    ELSE 0
  END,
  market_value_delta = CASE
    WHEN t.from_bucket_id = h.bucket_id THEN -t.amount
    WHEN t.to_bucket_id = h.bucket_id THEN t.amount
    ELSE 0
  END,
  total_units_delta = CASE
    WHEN t.from_bucket_id = h.bucket_id THEN
      CASE WHEN t.from_units IS NULL THEN NULL ELSE -t.from_units END
    WHEN t.to_bucket_id = h.bucket_id THEN
      CASE WHEN t.to_units IS NULL THEN NULL ELSE t.to_units END
    ELSE NULL
  END
FROM transaction t
WHERE h.source_type = 'transaction'
  AND h.source_id = t.id;

-- For market-type records, calculate deltas based on the difference from previous record
-- This is more complex and requires a window function
WITH market_deltas AS (
  SELECT
    h.id,
    h.market_value - LAG(h.market_value, 1, 0) OVER (
      PARTITION BY h.bucket_id
      ORDER BY h.recorded_at, h.created_at
    ) AS market_delta
  FROM bucket_value_history h
  WHERE h.source_type = 'market'
)
UPDATE bucket_value_history h
SET
  contributed_amount_delta = 0,
  market_value_delta = md.market_delta,
  total_units_delta = NULL
FROM market_deltas md
WHERE h.id = md.id;

-- Make the delta columns NOT NULL after backfill (except total_units_delta which can be NULL)
ALTER TABLE bucket_value_history
  ALTER COLUMN contributed_amount_delta SET NOT NULL,
  ALTER COLUMN market_value_delta SET NOT NULL;
