-- ============================================
-- Rename bucket_location to account and add type column
-- ============================================

-- Rename the table
ALTER TABLE bucket_location RENAME TO account;

-- Rename the column in bucket table
ALTER TABLE bucket RENAME COLUMN bucket_location_id TO account_id;

-- Rename indexes
ALTER INDEX idx_bucket_location_user_id RENAME TO idx_account_user_id;
ALTER INDEX idx_bucket_location_id RENAME TO idx_bucket_account_id;

-- Rename RLS policies
ALTER POLICY "Users can view own bucket_location" ON account RENAME TO "Users can view own account";
ALTER POLICY "Users can insert own bucket_location" ON account RENAME TO "Users can insert own account";
ALTER POLICY "Users can update own bucket_location" ON account RENAME TO "Users can update own account";
ALTER POLICY "Users can delete own bucket_location" ON account RENAME TO "Users can delete own account";

-- Rename trigger
ALTER TRIGGER update_bucket_location_updated_at ON account RENAME TO update_account_updated_at;

-- Add type column with bucket_type_enum (no default - must be explicitly set)
ALTER TABLE account
ADD COLUMN type bucket_type_enum NOT NULL;

-- Create index on type column for better query performance
CREATE INDEX idx_account_type ON account(type);
