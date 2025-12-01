import { getSupabase } from '../supabase.js';
import { getCurrentUserId } from '../auth.js';
import { getBucket, updateBucket } from './bucket.js';
import { createBucketValueHistory } from './bucketValueHistory.js';

export async function createTransaction(
  params: CreateTransactionParams,
): Promise<Transaction> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  if (params.amount === undefined || params.amount === null) {
    throw new Error('Transaction amount is required');
  }
  if (params.amount <= 0) {
    throw new Error('Transaction amount must be greater than 0');
  }
  if (!params.from_bucket_id && !params.to_bucket_id) {
    throw new Error('At least one bucket (from or to) is required');
  }

  const transactionDate = params.transaction_date ?? new Date().toISOString();

  // Step 1: Insert the transaction
  const { data: transaction, error: transactionError } = await supabase
    .from('transaction')
    .insert({
      user_id: userId,
      from_bucket_id: params.from_bucket_id ?? null,
      to_bucket_id: params.to_bucket_id ?? null,
      amount: params.amount,
      transaction_date: transactionDate,
      notes: params.notes ?? null,
    })
    .select()
    .single();

  if (transactionError) throw new Error(transactionError.message);

  // Step 2: Update from_bucket if specified
  if (params.from_bucket_id) {
    const fromBucket = await getBucket(params.from_bucket_id);
    const newFromContributedAmount =
      fromBucket.contributed_amount - params.amount;
    const newFromMarketAmount = fromBucket.market_value - params.amount;

    const normalizedFromContributedAmount =
      newFromContributedAmount < 0 ? 0 : newFromContributedAmount;
    const normalizedFromMarketAmount =
      newFromMarketAmount < 0 ? 0 : newFromMarketAmount;
    await updateBucket(params.from_bucket_id, {
      contributed_amount: normalizedFromContributedAmount,
      market_value: normalizedFromMarketAmount,
    });

    // Create bucket value history for from_bucket
    await createBucketValueHistory({
      bucket_id: params.from_bucket_id,
      contributed_amount: normalizedFromContributedAmount,
      market_value: normalizedFromMarketAmount,
      recorded_at: transactionDate,
      source_type: 'transaction',
      source_id: transaction.id,
      notes: params.notes ?? null,
    });
  }

  // Step 3: Update to_bucket if specified
  if (params.to_bucket_id) {
    const toBucket = await getBucket(params.to_bucket_id);
    const newToContributedAmount = toBucket.contributed_amount + params.amount;
    const newToMarketAmount = toBucket.market_value + params.amount;

    const normalizedToContributedAmount =
      newToContributedAmount < 0 ? 0 : newToContributedAmount;
    const normalizedToMarketAmount =
      newToMarketAmount < 0 ? 0 : newToMarketAmount;

    await updateBucket(params.to_bucket_id, {
      contributed_amount: normalizedToContributedAmount,
      market_value: normalizedToMarketAmount,
    });

    // Create bucket value history for to_bucket
    await createBucketValueHistory({
      bucket_id: params.to_bucket_id,
      contributed_amount: normalizedToContributedAmount,
      market_value: normalizedToMarketAmount,
      recorded_at: transactionDate,
      source_type: 'transaction',
      source_id: transaction.id,
      notes: params.notes ?? null,
    });
  }

  return transaction;
}

export async function getTransactions(): Promise<Transaction[]> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('transaction')
    .select()
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getTransaction(id: number): Promise<Transaction> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('transaction')
    .select()
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getTransactionsByBucket(
  bucketId: number,
): Promise<Transaction[]> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('transaction')
    .select()
    .eq('user_id', userId)
    .or(`from_bucket_id.eq.${bucketId},to_bucket_id.eq.${bucketId}`)
    .order('transaction_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function updateTransaction(
  id: number,
  params: UpdateTransactionParams,
): Promise<Transaction> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const updateData: Record<string, unknown> = {};
  if (params.from_bucket_id !== undefined)
    updateData.from_bucket_id = params.from_bucket_id;
  if (params.to_bucket_id !== undefined)
    updateData.to_bucket_id = params.to_bucket_id;
  if (params.amount !== undefined) updateData.amount = params.amount;
  if (params.transaction_date !== undefined)
    updateData.transaction_date = params.transaction_date;
  if (params.notes !== undefined) updateData.notes = params.notes;

  const { data, error } = await supabase
    .from('transaction')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteTransaction(id: number): Promise<void> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from('transaction')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function checkDuplicateTransaction(params: {
  transaction_date: string;
  amount: number;
  from_bucket_id: number | null;
  to_bucket_id: number | null;
  notes: string | null;
}): Promise<boolean> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  let query = supabase
    .from('transaction')
    .select('id')
    .eq('user_id', userId)
    .eq('transaction_date', params.transaction_date)
    .eq('amount', params.amount);

  // Handle notes - can be null
  if (params.notes === null) {
    query = query.is('notes', null);
  } else {
    query = query.eq('notes', params.notes);
  }

  // Handle from_bucket_id - can be null
  if (params.from_bucket_id === null) {
    query = query.is('from_bucket_id', null);
  } else {
    query = query.eq('from_bucket_id', params.from_bucket_id);
  }

  // Handle to_bucket_id - can be null
  if (params.to_bucket_id === null) {
    query = query.is('to_bucket_id', null);
  } else {
    query = query.eq('to_bucket_id', params.to_bucket_id);
  }

  const { data, error } = await query.limit(1);

  if (error) throw new Error(error.message);

  return data !== null && data.length > 0;
}
