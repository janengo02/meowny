-- ============================================
-- Function to get value history with transactions by bucket
-- ============================================

CREATE OR REPLACE FUNCTION get_value_history_with_transactions_by_bucket(
  p_bucket_id INT,
  p_user_id UUID
)
RETURNS TABLE (
  id INT,
  user_id UUID,
  bucket_id INT,
  contributed_amount DECIMAL(19, 2),
  market_value DECIMAL(19, 2),
  recorded_at TIMESTAMP WITH TIME ZONE,
  source_type source_type_enum,
  source_id INT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  transaction JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bvh.id,
    bvh.user_id,
    bvh.bucket_id,
    bvh.contributed_amount,
    bvh.market_value,
    bvh.recorded_at,
    bvh.source_type,
    bvh.source_id,
    bvh.notes,
    bvh.created_at,
    bvh.updated_at,
    CASE
      WHEN bvh.source_type = 'transaction' AND t.id IS NOT NULL THEN
        jsonb_build_object(
          'id', t.id,
          'user_id', t.user_id,
          'from_bucket_id', t.from_bucket_id,
          'from_bucket_name', from_bucket.name,
          'to_bucket_id', t.to_bucket_id,
          'to_bucket_name', to_bucket.name,
          'amount', t.amount,
          'transaction_date', t.transaction_date,
          'notes', t.notes,
          'created_at', t.created_at,
          'updated_at', t.updated_at
        )
      ELSE NULL
    END AS transaction
  FROM bucket_value_history bvh
  LEFT JOIN transaction t ON bvh.source_id = t.id AND bvh.source_type = 'transaction'
  LEFT JOIN bucket from_bucket ON t.from_bucket_id = from_bucket.id
  LEFT JOIN bucket to_bucket ON t.to_bucket_id = to_bucket.id
  WHERE bvh.bucket_id = p_bucket_id
    AND bvh.user_id = p_user_id
  ORDER BY bvh.recorded_at DESC;
END;
$$;
