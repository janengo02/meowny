import { getSupabase } from '../supabase.js';
import { getCurrentUserId } from '../auth.js';
import { logValidationError } from '../../logger/dbLogger.js';

// ============================================
// VALIDATION UTILITIES
// ============================================

export function validateTransactionParams(
  params: CreateTransactionParams,
): void {
  if (params.amount === undefined || params.amount === null) {
    logValidationError(
      'createTransaction',
      'amount',
      'Transaction amount is required',
    );
    throw new Error('Transaction amount is required');
  }
  if (params.amount <= 0) {
    logValidationError(
      'createTransaction',
      'amount',
      'Transaction amount must be greater than 0',
    );
    throw new Error('Transaction amount must be greater than 0');
  }
  if (!params.from_bucket_id && !params.to_bucket_id) {
    logValidationError(
      'createTransaction',
      'buckets',
      'At least one bucket (from or to) is required',
    );
    throw new Error('At least one bucket (from or to) is required');
  }
  if (!params.transaction_date) {
    logValidationError(
      'createTransaction',
      'transaction_date',
      'Transaction date is required',
    );
    throw new Error('Transaction date is required');
  }
}

// ============================================
// DATABASE UPDATE UTILITIES
// ============================================

export async function insertTransactionToDatabase(
  params: CreateTransactionParams,
): Promise<Transaction> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data: transaction, error: transactionError } = await supabase
    .from('transaction')
    .insert({
      user_id: userId,
      from_bucket_id: params.from_bucket_id ?? null,
      to_bucket_id: params.to_bucket_id ?? null,
      amount: params.amount,
      from_units: params.from_units ?? null,
      to_units: params.to_units ?? null,
      transaction_date: params.transaction_date,
      notes: params.notes ?? null,
    })
    .select()
    .single();

  if (transactionError) throw new Error(transactionError.message);

  return transaction;
}

export async function deleteTransactionToDatabase(id: number): Promise<void> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from('transaction')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}
