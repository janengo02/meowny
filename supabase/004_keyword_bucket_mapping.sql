-- Migration: Add keyword_bucket_mapping table for intelligent bucket assignment
-- This table tracks which keywords in transaction notes are commonly associated with which buckets

CREATE TABLE IF NOT EXISTS keyword_bucket_mapping (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  bucket_assign_count JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, keyword)
);

-- Add index for faster keyword lookups
CREATE INDEX idx_keyword_bucket_mapping_user_keyword ON keyword_bucket_mapping(user_id, keyword);

-- Add RLS policies
ALTER TABLE keyword_bucket_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own keyword mappings"
  ON keyword_bucket_mapping FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own keyword mappings"
  ON keyword_bucket_mapping FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own keyword mappings"
  ON keyword_bucket_mapping FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own keyword mappings"
  ON keyword_bucket_mapping FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_keyword_bucket_mapping_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_keyword_bucket_mapping_updated_at
  BEFORE UPDATE ON keyword_bucket_mapping
  FOR EACH ROW
  EXECUTE FUNCTION update_keyword_bucket_mapping_updated_at();
