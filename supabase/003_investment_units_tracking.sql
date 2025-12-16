-- ============================================
-- Migration: Investment Unit Tracking
-- ============================================
-- This migration adds unit-based tracking for investment buckets
-- while maintaining backward compatibility with money-based transactions.
--
-- Changes:
-- 1. Add unit fields to transaction table (for both from/to sides)
-- 2. Add unit tracking to bucket_value_history table
-- 3. Add unit tracking to bucket table
--
-- All new fields are nullable for backward compatibility
--
-- Note: avg_cost_per_unit can be calculated as contributed_amount / total_units
-- Note: price_per_unit can be calculated as amount / units

-- ============================================
-- Add Unit Tracking to Transaction Table
-- ============================================

ALTER TABLE transaction ADD COLUMN from_units DECIMAL(19, 8);
ALTER TABLE transaction ADD COLUMN to_units DECIMAL(19, 8);

COMMENT ON COLUMN transaction.from_units IS 'Number of units sold from FROM bucket (investment buckets only)';
COMMENT ON COLUMN transaction.to_units IS 'Number of units bought for TO bucket (investment buckets only)';

-- ============================================
-- Add Unit Tracking to BucketValueHistory Table
-- ============================================

ALTER TABLE bucket_value_history ADD COLUMN total_units DECIMAL(19, 8);

COMMENT ON COLUMN bucket_value_history.total_units IS 'Running total of units at this point in time';

-- ============================================
-- Add Unit Tracking to Bucket Table
-- ============================================

ALTER TABLE bucket ADD COLUMN total_units DECIMAL(19, 8);

COMMENT ON COLUMN bucket.total_units IS 'Current total units (derived from latest history)';
