-- ============================================
-- Migration: Account and Bucket Type Changes
-- ============================================
-- This migration changes:
-- 1. Account types from 'expense | saving | investment' to 'expense | asset'
-- 2. Bucket types remain 'expense | saving | investment'
-- 3. Bucket type validation will be handled at code level

-- ============================================
-- Step 1: Create new account_type_enum
-- ============================================

CREATE TYPE account_type_enum AS ENUM ('expense', 'asset');

-- ============================================
-- Step 2: Add temporary column to account table
-- ============================================

ALTER TABLE account ADD COLUMN new_type account_type_enum;

-- ============================================
-- Step 3: Migrate existing data
-- ============================================
-- Convert 'saving' and 'investment' account types to 'asset'
-- Keep 'expense' as 'expense'

UPDATE account
SET new_type = CASE
  WHEN type = 'expense' THEN 'expense'::account_type_enum
  WHEN type IN ('saving', 'investment') THEN 'asset'::account_type_enum
END;

-- ============================================
-- Step 4: Drop old type column and rename new one
-- ============================================

ALTER TABLE account DROP COLUMN type;
ALTER TABLE account RENAME COLUMN new_type TO type;
ALTER TABLE account ALTER COLUMN type SET NOT NULL;
