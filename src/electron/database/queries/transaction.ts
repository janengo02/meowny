import { getSupabase } from '../supabase.js';
import { getCurrentUserId } from '../auth.js';

export async function createTransaction(
  params: CreateTransactionParams,
): Promise<Transaction> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  if (params.amount === undefined || params.amount === null) {
    throw new Error('Transaction amount is required');
  }
  if (!params.from_bucket_id && !params.to_bucket_id) {
    throw new Error('At least one bucket (from or to) is required');
  }

  const { data, error } = await supabase
    .from('transaction')
    .insert({
      user_id: userId,
      from_bucket_id: params.from_bucket_id ?? null,
      to_bucket_id: params.to_bucket_id ?? null,
      amount: params.amount,
      transaction_date: params.transaction_date ?? new Date().toISOString(),
      notes: params.notes ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
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
