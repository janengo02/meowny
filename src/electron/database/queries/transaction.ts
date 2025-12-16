import { getSupabase } from '../supabase.js';
import { getCurrentUserId } from '../auth.js';
import {
  createBucketValueHistory,
  getLastBucketValueHistoryBefore,
  adjustBucketValueHistoryForHistoricalTransaction,
} from './bucketValueHistory.js';
import { updateKeywordBucketMapping } from './keywordBucketMapping.js';
import { updateBucketFromLatestHistory } from './bucket.js';
import { withDatabaseLogging, logValidationError } from '../../logger/dbLogger.js';

export async function createTransaction(
  params: CreateTransactionParams,
): Promise<Transaction> {
  return withDatabaseLogging('createTransaction', async () => {
    const supabase = getSupabase();
    const userId = await getCurrentUserId();

    if (params.amount === undefined || params.amount === null) {
      logValidationError('createTransaction', 'amount', 'Transaction amount is required');
      throw new Error('Transaction amount is required');
    }
    if (params.amount <= 0) {
      logValidationError('createTransaction', 'amount', 'Transaction amount must be greater than 0');
      throw new Error('Transaction amount must be greater than 0');
    }
    if (!params.from_bucket_id && !params.to_bucket_id) {
      logValidationError('createTransaction', 'buckets', 'At least one bucket (from or to) is required');
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
      from_units: params.from_units ?? null,
      to_units: params.to_units ?? null,
      transaction_date: transactionDate,
      notes: params.notes ?? null,
    })
    .select()
    .single();

  if (transactionError) throw new Error(transactionError.message);

  // Step 1.5: Update keyword-bucket mappings for intelligent bucket assignment
  // Track keywords from notes for the bucket pair (from_bucket -> to_bucket)
  if (params.notes) {
    updateKeywordBucketMapping(
      params.notes,
      params.from_bucket_id ?? null,
      params.to_bucket_id ?? null,
    ).catch(
      (err) => console.error('Failed to update keyword mapping:', err),
    );
  }

  // Step 2: Update from_bucket if specified
  if (params.from_bucket_id) {
    // Get the last bucket value history record before the transaction date
    const lastHistoryBefore = await getLastBucketValueHistoryBefore(
      params.from_bucket_id,
      transactionDate,
    );

    // Calculate new values based on the previous record (or 0 if no previous record)
    const baseContributedAmount = lastHistoryBefore
      ? lastHistoryBefore.contributed_amount
      : 0;
    const baseMarketValue = lastHistoryBefore
      ? lastHistoryBefore.market_value
      : 0;
    const baseTotalUnits = lastHistoryBefore?.total_units ?? 0;

    const newFromContributedAmount = baseContributedAmount - params.amount;
    const newFromMarketAmount = baseMarketValue - params.amount;

    // Calculate unit values for investment buckets
    let newFromTotalUnits: number | null = null;

    if (params.from_units) {
      // Selling units: subtract from total
      newFromTotalUnits = baseTotalUnits - params.from_units;
    }

    // Adjust all subsequent bucket value history records and update the bucket
    await adjustBucketValueHistoryForHistoricalTransaction(
      params.from_bucket_id,
      transactionDate,
      -params.amount,
      params.from_units ? -params.from_units : null,
    );

    // Create bucket value history for from_bucket
    // Must be done after adjustment to get correct contributed amount
    await createBucketValueHistory({
      bucket_id: params.from_bucket_id,
      contributed_amount: newFromContributedAmount,
      market_value: newFromMarketAmount,
      total_units: newFromTotalUnits,
      recorded_at: transactionDate,
      source_type: 'transaction',
      source_id: transaction.id,
      notes: params.notes ?? null,
    });
    // Update the bucket table with the latest values from bucket_value_history
    await updateBucketFromLatestHistory(params.from_bucket_id);
  }

  // Step 3: Update to_bucket if specified
  if (params.to_bucket_id) {
    // Get the last bucket value history record before the transaction date
    const lastHistoryBefore = await getLastBucketValueHistoryBefore(
      params.to_bucket_id,
      transactionDate,
    );

    // Calculate new values based on the previous record (or 0 if no previous record)
    const baseContributedAmount = lastHistoryBefore
      ? lastHistoryBefore.contributed_amount
      : 0;
    const baseMarketValue = lastHistoryBefore
      ? lastHistoryBefore.market_value
      : 0;
    const baseTotalUnits = lastHistoryBefore?.total_units ?? 0;

    const newToContributedAmount = baseContributedAmount + params.amount;
    const newToMarketAmount = baseMarketValue + params.amount;

    // Calculate unit values for investment buckets
    let newToTotalUnits: number | null = null;

    if (params.to_units) {
      // Buying units: add to total
      newToTotalUnits = baseTotalUnits + params.to_units;
    }

    // Adjust all subsequent bucket value history records and update the bucket
    await adjustBucketValueHistoryForHistoricalTransaction(
      params.to_bucket_id,
      transactionDate,
      params.amount,
      params.to_units ? params.to_units : null,
    );

    // Create bucket value history for to_bucket
    // Must be done after adjustment to get correct contributed amount
    await createBucketValueHistory({
      bucket_id: params.to_bucket_id,
      contributed_amount: newToContributedAmount,
      market_value: newToMarketAmount,
      total_units: newToTotalUnits,
      recorded_at: transactionDate,
      source_type: 'transaction',
      source_id: transaction.id,
      notes: params.notes ?? null,
    });
    // Update the bucket table with the latest values from bucket_value_history
    await updateBucketFromLatestHistory(params.to_bucket_id);
  }

    return transaction;
  }, { amount: params.amount, from_bucket_id: params.from_bucket_id, to_bucket_id: params.to_bucket_id });
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
  if (params.from_units !== undefined)
    updateData.from_units = params.from_units;
  if (params.to_units !== undefined)
    updateData.to_units = params.to_units;
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

export async function getExpenseTransactionsByPeriod(params: {
  startDate: string;
  endDate: string;
}): Promise<ExpenseTransactionSummary[]> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  // Query all transactions within the target period
  // Left join with bucket table on to_bucket_id
  // Filter transactions with to_bucket_id of bucket with type 'expense' only
  const { data: transactions, error } = await supabase
    .from('transaction')
    .select(
      `
      *,
      to_bucket:bucket!transaction_to_bucket_id_fkey(
        id,
        name,
        type
      )
    `,
    )
    .eq('user_id', userId)
    .gte('transaction_date', params.startDate)
    .lte('transaction_date', params.endDate)
    .not('to_bucket_id', 'is', null)
    .order('transaction_date', { ascending: false });

  if (error) throw new Error(error.message);

  // Group by expense bucket and sum the amounts
  const expenseBuckets = new Map<number, ExpenseTransactionSummary>();

  transactions?.forEach((transaction) => {
    const toBucket = transaction.to_bucket as unknown as {
      id: number;
      name: string;
      type: string;
    } | null;

    // Only include transactions where to_bucket.type === 'expense'
    if (toBucket && toBucket.type === 'expense') {
      if (!expenseBuckets.has(toBucket.id)) {
        expenseBuckets.set(toBucket.id, {
          bucket_id: toBucket.id,
          bucket_name: toBucket.name,
          total_amount: 0,
        });
      }

      const summary = expenseBuckets.get(toBucket.id)!;
      summary.total_amount += transaction.amount;
    }
  });

  return Array.from(expenseBuckets.values());
}
