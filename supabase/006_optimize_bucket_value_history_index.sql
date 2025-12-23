-- ============================================
-- Performance Optimization: Composite Index for bucket_value_history
-- ============================================
-- This composite index optimizes queries that filter by bucket_id and order by recorded_at, created_at
-- Specifically improves performance for:
-- - getLastBucketValueHistoryBeforeAdding (DESC)
-- - getBucketValueHistoriesAfterAdding (ASC)
-- - getLastBucketValueHistoryBeforeDeleting (DESC)
-- - getBucketValueHistoriesAfterDeleting (ASC)
-- - Chart queries (both ASC and DESC)

-- Drop the old individual indexes if they exist (they're redundant with the composite index)
DROP INDEX IF EXISTS idx_bucket_value_history_bucket_id;
DROP INDEX IF EXISTS idx_bucket_value_history_recorded_at;

-- Create composite index WITHOUT direction specification
-- PostgreSQL can efficiently scan this index in both directions (ASC or DESC)
-- This single index supports both use cases optimally
CREATE INDEX idx_bucket_value_history_bucket_recorded_created
  ON bucket_value_history(bucket_id, recorded_at, created_at);

-- This index efficiently supports queries in both directions:
-- WHERE bucket_id = X AND recorded_at <= Y ORDER BY recorded_at DESC, created_at DESC (backward scan)
-- WHERE bucket_id = X AND recorded_at >= Y ORDER BY recorded_at ASC, created_at ASC (forward scan)
