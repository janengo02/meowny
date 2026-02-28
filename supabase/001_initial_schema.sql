-- ============================================
-- Meowny Database Schema for Supabase
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE color_enum AS ENUM (
  'red', 'yellow', 'green', 'blue', 'purple', 'violet',
  'orange', 'pink', 'emerald', 'gray', 'brown', 'navy',
  'cyan', 'magenta', 'teal', 'lime', 'indigo', 'default'
);

CREATE TYPE account_type_enum AS ENUM (
  'expense', 'asset'
);

CREATE TYPE bucket_type_enum AS ENUM (
  'expense', 'saving', 'investment'
);

CREATE TYPE source_type_enum AS ENUM (
  'transaction', 'market'
);

-- ============================================
-- BUCKET CATEGORY
-- ============================================

CREATE TABLE bucket_category (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(225) NOT NULL,
  color color_enum NOT NULL DEFAULT 'default',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================
-- ACCOUNT (formerly BUCKET LOCATION)
-- ============================================

CREATE TABLE account (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(225) NOT NULL,
  type account_type_enum NOT NULL,
  color color_enum NOT NULL DEFAULT 'default',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================
-- BUCKET
-- ============================================

CREATE TABLE bucket (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(225) NOT NULL,
  type bucket_type_enum NOT NULL,
  bucket_category_id INT REFERENCES bucket_category(id) ON DELETE SET NULL,
  account_id INT REFERENCES account(id) ON DELETE SET NULL,
  contributed_amount DECIMAL(19, 2) NOT NULL DEFAULT 0,
  market_value DECIMAL(19, 2) NOT NULL DEFAULT 0,
  total_units DECIMAL(19, 8),
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================
-- BUCKET GOAL
-- ============================================

CREATE TABLE bucket_goal (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bucket_id INT REFERENCES bucket(id) ON DELETE CASCADE NOT NULL,
  min_amount DECIMAL(19, 2),
  max_amount DECIMAL(19, 2),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================
-- TRANSACTION
-- ============================================

CREATE TABLE transaction (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  from_bucket_id INT REFERENCES bucket(id) ON DELETE SET NULL,
  to_bucket_id INT REFERENCES bucket(id) ON DELETE SET NULL,
  amount DECIMAL(19, 2) NOT NULL,
  from_units DECIMAL(19, 8),
  to_units DECIMAL(19, 8),
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================
-- BUCKET VALUE HISTORY
-- ============================================

CREATE TABLE bucket_value_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bucket_id INT REFERENCES bucket(id) ON DELETE CASCADE NOT NULL,
  contributed_amount DECIMAL(19, 2) NOT NULL,
  market_value DECIMAL(19, 2) NOT NULL,
  total_units DECIMAL(19, 8),
  contributed_amount_delta DECIMAL(19, 2) NOT NULL DEFAULT 0,
  market_value_delta DECIMAL(19, 2) NOT NULL DEFAULT 0,
  total_units_delta DECIMAL(19, 8),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  source_type source_type_enum NOT NULL,
  source_id INT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

COMMENT ON COLUMN bucket_value_history.contributed_amount_delta IS 'The change in contributed amount from the previous record (delta). For transactions: the transaction amount (positive for deposits, negative for withdrawals). For market updates: 0.';
COMMENT ON COLUMN bucket_value_history.market_value_delta IS 'The change in market value from the previous record (delta). For transactions: same as contributed_amount_delta. For market updates: difference from previous market value.';
COMMENT ON COLUMN bucket_value_history.total_units_delta IS 'The change in total units from the previous record (delta). For transactions with units: the unit change. NULL if units are not tracked.';

-- ============================================
-- INCOME SOURCE
-- ============================================

CREATE TABLE income_source (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(225) NOT NULL,
  color color_enum NOT NULL DEFAULT 'default',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================
-- INCOME CATEGORY
-- ============================================

CREATE TABLE income_category (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(225) NOT NULL,
  color color_enum NOT NULL DEFAULT 'default',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================
-- INCOME HISTORY
-- ============================================

CREATE TABLE income_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  income_id INT REFERENCES income_source(id) ON DELETE CASCADE NOT NULL,
  income_category_id INT REFERENCES income_category(id) ON DELETE SET NULL,
  gross_amount DECIMAL(19, 2) NOT NULL,
  received_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================
-- TAX CATEGORY
-- ============================================

CREATE TABLE tax_category (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(225) NOT NULL,
  color color_enum NOT NULL DEFAULT 'default',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================
-- INCOME TAX
-- ============================================

CREATE TABLE income_tax (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  income_history_id INT REFERENCES income_history(id) ON DELETE CASCADE NOT NULL,
  tax_category_id INT REFERENCES tax_category(id) ON DELETE SET NULL,
  tax_amount DECIMAL(19, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================
-- KEYWORD BUCKET MAPPING
-- ============================================

-- This table tracks which keywords in transaction notes are commonly associated with which buckets
CREATE TABLE keyword_bucket_mapping (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  bucket_assign_count JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, keyword)
);

-- ============================================
-- USER PREFERENCES
-- ============================================

CREATE TABLE user_preferences (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  preference_key VARCHAR(255) NOT NULL,
  preference_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, preference_key)
);

-- ============================================
-- INDEXES
-- ============================================

-- Bucket indexes
CREATE INDEX idx_bucket_user_id ON bucket(user_id);
CREATE INDEX idx_bucket_category_id ON bucket(bucket_category_id);
CREATE INDEX idx_bucket_account_id ON bucket(account_id);
CREATE INDEX idx_bucket_type ON bucket(type);

-- Transaction indexes
CREATE INDEX idx_transaction_user_id ON transaction(user_id);
CREATE INDEX idx_transaction_from_bucket ON transaction(from_bucket_id);
CREATE INDEX idx_transaction_to_bucket ON transaction(to_bucket_id);
CREATE INDEX idx_transaction_date ON transaction(transaction_date);

-- Bucket value history indexes
CREATE INDEX idx_bucket_value_history_user_id ON bucket_value_history(user_id);
CREATE INDEX idx_bucket_value_history_bucket_recorded_created
  ON bucket_value_history(bucket_id, recorded_at, created_at);

-- Bucket goal indexes
CREATE INDEX idx_bucket_goal_user_id ON bucket_goal(user_id);
CREATE INDEX idx_bucket_goal_bucket_id ON bucket_goal(bucket_id);

-- Income history indexes
CREATE INDEX idx_income_history_user_id ON income_history(user_id);
CREATE INDEX idx_income_history_income_id ON income_history(income_id);
CREATE INDEX idx_income_history_income_category_id ON income_history(income_category_id);
CREATE INDEX idx_income_history_received_date ON income_history(received_date);

-- Income tax indexes
CREATE INDEX idx_income_tax_user_id ON income_tax(user_id);
CREATE INDEX idx_income_tax_income_history_id ON income_tax(income_history_id);
CREATE INDEX idx_income_tax_tax_category_id ON income_tax(tax_category_id);

-- Category/Location indexes
CREATE INDEX idx_bucket_category_user_id ON bucket_category(user_id);
CREATE INDEX idx_account_user_id ON account(user_id);
CREATE INDEX idx_account_type ON account(type);
CREATE INDEX idx_income_source_user_id ON income_source(user_id);
CREATE INDEX idx_income_category_user_id ON income_category(user_id);
CREATE INDEX idx_tax_category_user_id ON tax_category(user_id);

-- Keyword bucket mapping indexes
CREATE INDEX idx_keyword_bucket_mapping_user_keyword ON keyword_bucket_mapping(user_id, keyword);

-- User preferences indexes
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_user_key ON user_preferences(user_id, preference_key);


-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE bucket_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE account ENABLE ROW LEVEL SECURITY;
ALTER TABLE bucket ENABLE ROW LEVEL SECURITY;
ALTER TABLE bucket_goal ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE bucket_value_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_source ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_tax ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_bucket_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - BUCKET_CATEGORY
-- ============================================

CREATE POLICY "Users can view own bucket_category"
  ON bucket_category FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bucket_category"
  ON bucket_category FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bucket_category"
  ON bucket_category FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bucket_category"
  ON bucket_category FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - ACCOUNT
-- ============================================

CREATE POLICY "Users can view own account"
  ON account FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own account"
  ON account FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own account"
  ON account FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own account"
  ON account FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - BUCKET
-- ============================================

CREATE POLICY "Users can view own bucket"
  ON bucket FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bucket"
  ON bucket FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bucket"
  ON bucket FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bucket"
  ON bucket FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - BUCKET_GOAL
-- ============================================

CREATE POLICY "Users can view own bucket_goal"
  ON bucket_goal FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bucket_goal"
  ON bucket_goal FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bucket_goal"
  ON bucket_goal FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bucket_goal"
  ON bucket_goal FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - TRANSACTION
-- ============================================

CREATE POLICY "Users can view own transaction"
  ON transaction FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transaction"
  ON transaction FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transaction"
  ON transaction FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transaction"
  ON transaction FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - BUCKET_VALUE_HISTORY
-- ============================================

CREATE POLICY "Users can view own bucket_value_history"
  ON bucket_value_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bucket_value_history"
  ON bucket_value_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bucket_value_history"
  ON bucket_value_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bucket_value_history"
  ON bucket_value_history FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - INCOME_SOURCE
-- ============================================

CREATE POLICY "Users can view own income_source"
  ON income_source FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own income_source"
  ON income_source FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own income_source"
  ON income_source FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own income_source"
  ON income_source FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - INCOME_CATEGORY
-- ============================================

CREATE POLICY "Users can view own income_category"
  ON income_category FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own income_category"
  ON income_category FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own income_category"
  ON income_category FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own income_category"
  ON income_category FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - INCOME_HISTORY
-- ============================================

CREATE POLICY "Users can view own income_history"
  ON income_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own income_history"
  ON income_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own income_history"
  ON income_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own income_history"
  ON income_history FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - TAX_CATEGORY
-- ============================================

CREATE POLICY "Users can view own tax_category"
  ON tax_category FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tax_category"
  ON tax_category FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tax_category"
  ON tax_category FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tax_category"
  ON tax_category FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - INCOME_TAX
-- ============================================

CREATE POLICY "Users can view own income_tax"
  ON income_tax FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own income_tax"
  ON income_tax FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own income_tax"
  ON income_tax FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own income_tax"
  ON income_tax FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - KEYWORD_BUCKET_MAPPING
-- ============================================

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

-- ============================================
-- RLS POLICIES - USER_PREFERENCES
-- ============================================

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON user_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bucket_category_updated_at
  BEFORE UPDATE ON bucket_category
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_updated_at
  BEFORE UPDATE ON account
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bucket_updated_at
  BEFORE UPDATE ON bucket
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bucket_goal_updated_at
  BEFORE UPDATE ON bucket_goal
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transaction_updated_at
  BEFORE UPDATE ON transaction
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bucket_value_history_updated_at
  BEFORE UPDATE ON bucket_value_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_income_source_updated_at
  BEFORE UPDATE ON income_source
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_income_category_updated_at
  BEFORE UPDATE ON income_category
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_income_history_updated_at
  BEFORE UPDATE ON income_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_category_updated_at
  BEFORE UPDATE ON tax_category
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_income_tax_updated_at
  BEFORE UPDATE ON income_tax
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keyword_bucket_mapping_updated_at
  BEFORE UPDATE ON keyword_bucket_mapping
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
