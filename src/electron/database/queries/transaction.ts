import { getSupabase } from '../supabase.js';
import { getCurrentUserId } from '../auth.js';

import {
  updateKeywordBucketMapping,
  batchUpdateKeywordBucketMappings,
} from './keywordBucketMapping.js';
import { withDatabaseLogging } from '../../logger/dbLogger.js';
import {
  deleteTransactionToDatabase,
  insertTransactionToDatabase,
  validateTransactionParams,
  batchInsertTransactionsToDatabase,
} from './transactionUtils.js';
import {
  bucketValueProcedureForAddingTransaction,
  bucketValueProcedureForDeletingTransaction,
} from './bucketValueHistory.js';

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
  startDate?: string,
  endDate?: string,
): Promise<Transaction[]> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  let query = supabase
    .from('transaction')
    .select()
    .eq('user_id', userId)
    .or(`from_bucket_id.eq.${bucketId},to_bucket_id.eq.${bucketId}`);

  // Add date filters if provided
  if (startDate) {
    query = query.gte('transaction_date', startDate);
  }
  if (endDate) {
    query = query.lte('transaction_date', endDate);
  }

  query = query.order('transaction_date', { ascending: false });

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data;
}

export async function updateTransaction(
  id: number,
  params: UpdateTransactionParams,
): Promise<Transaction> {
  return withDatabaseLogging(
    'updateTransaction',
    async () => {
      // Step 1: Delete the old transaction (this handles bucket value history cleanup)
      await deleteTransaction(id);

      // Step 2: Create the new transaction with merged params

      const newTransaction = await createTransaction(params);

      return newTransaction;
    },
    {
      transaction_id: id,
      ...params,
    },
  );
}

export async function checkDuplicateTransaction(params: {
  transaction_date: string;
  amount: number;
  from_bucket_id: number | null;
  to_bucket_id: number | null;
  notes: string | null;
  from_units?: number | null;
  to_units?: number | null;
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

  // Handle from_units - can be null or undefined
  if (params.from_units === null || params.from_units === undefined) {
    query = query.is('from_units', null);
  } else {
    query = query.eq('from_units', params.from_units);
  }

  // Handle to_units - can be null or undefined
  if (params.to_units === null || params.to_units === undefined) {
    query = query.is('to_units', null);
  } else {
    query = query.eq('to_units', params.to_units);
  }

  const { data, error } = await query.limit(1);

  if (error) throw new Error(error.message);

  return data !== null && data.length > 0;
}
// ============================================
// CREATE TRANSACTION
// ============================================
export async function createTransaction(
  params: CreateTransactionParams,
): Promise<Transaction> {
  return withDatabaseLogging(
    'createTransaction',
    async () => {
      // Step 1: Validate parameters
      validateTransactionParams(params);

      // Step 2: Insert transaction to database
      const transaction = await insertTransactionToDatabase(params);

      // Step 3: Update keyword-bucket mappings for intelligent bucket assignment
      // Fire-and-forget to avoid blocking transaction creation
      if (params.notes) {
        updateKeywordBucketMapping(
          params.notes ?? null,
          params.from_bucket_id ?? null,
          params.to_bucket_id ?? null,
        ).catch((error) => {
          console.error('Error updating keyword mapping:', error);
        });
      }

      // Step 4: Update from_bucket if specified
      if (params.from_bucket_id) {
        await bucketValueProcedureForAddingTransaction(
          params.from_bucket_id,
          params.transaction_date,
          -params.amount, // Negative delta for source bucket
          params.from_units ? -params.from_units : null,
          transaction.id,
          params.notes ?? null,
        );
      }

      // Step 5: Update to_bucket if specified
      if (params.to_bucket_id) {
        await bucketValueProcedureForAddingTransaction(
          params.to_bucket_id,
          params.transaction_date,
          params.amount, // Positive delta for destination bucket
          params.to_units ? params.to_units : null,
          transaction.id,
          params.notes ?? null,
        );
      }

      return transaction;
    },
    {
      amount: params.amount,
      from_bucket_id: params.from_bucket_id,
      to_bucket_id: params.to_bucket_id,
    },
  );
}

// ============================================
// BATCH CREATE TRANSACTIONS
// ============================================
export async function batchCreateTransactions(
  paramsArray: CreateTransactionParams[],
  onProgress?: (progress: { completed: number; total: number }) => void,
): Promise<Transaction[]> {
  return withDatabaseLogging(
    'batchCreateTransactions',
    async () => {
      if (paramsArray.length === 0) return [];

      // Step 1: Validate all parameters
      for (const params of paramsArray) {
        validateTransactionParams(params);
      }

      // Step 2: Batch insert all transactions to database
      const transactions = await batchInsertTransactionsToDatabase(paramsArray);

      // Step 3: Batch update keyword-bucket mappings
      // Fire-and-forget to avoid blocking transaction creation
      batchUpdateKeywordBucketMappings(
        paramsArray.map((params) => ({
          notes: params.notes ?? null,
          from_bucket_id: params.from_bucket_id ?? null,
          to_bucket_id: params.to_bucket_id ?? null,
        })),
      ).catch((error) => {
        console.error('Error updating keyword mappings:', error);
      });

      // Step 4: Update bucket value histories for each transaction
      const total = transactions.length;
      for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];
        const params = paramsArray[i];

        // Update from_bucket if specified
        if (params.from_bucket_id) {
          await bucketValueProcedureForAddingTransaction(
            params.from_bucket_id,
            params.transaction_date,
            -params.amount, // Negative delta for source bucket
            params.from_units ? -params.from_units : null,
            transaction.id,
            params.notes ?? null,
          );
        }

        // Update to_bucket if specified
        if (params.to_bucket_id) {
          await bucketValueProcedureForAddingTransaction(
            params.to_bucket_id,
            params.transaction_date,
            params.amount, // Positive delta for destination bucket
            params.to_units ? params.to_units : null,
            transaction.id,
            params.notes ?? null,
          );
        }

        // Report progress after each transaction is fully processed
        if (onProgress) {
          onProgress({ completed: i + 1, total });
        }
      }

      return transactions;
    },
    {
      transaction_count: paramsArray.length,
    },
  );
}

// ============================================
// DELETE TRANSACTION
// ============================================
export async function deleteTransaction(id: number): Promise<void> {
  return withDatabaseLogging(
    'deleteTransaction',
    async () => {
      // Step 1: Get the transaction to be deleted
      const transaction = await getTransaction(id);

      // Step 2: Reverse bucket value history for from_bucket
      if (transaction.from_bucket_id) {
        await bucketValueProcedureForDeletingTransaction(
          transaction.from_bucket_id,
          transaction.transaction_date,
          transaction.id,
        );
      }

      // Step 3: Reverse bucket value history for to_bucket
      if (transaction.to_bucket_id) {
        await bucketValueProcedureForDeletingTransaction(
          transaction.to_bucket_id,
          transaction.transaction_date,
          transaction.id,
        );
      }

      // Step 4: Delete the transaction from database
      await deleteTransactionToDatabase(id);
    },
    {
      transaction_id: id,
    },
  );
}

// ============================================
// QUERIES FOR CHARTS
// ============================================
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
        type,
        bucket_category_id,
        category:bucket_category_id(
          id,
          name
        )
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
      category: {
        id: number;
        name: string;
      } | null;
    } | null;

    // Only include transactions where to_bucket.type === 'expense'
    if (toBucket && toBucket.type === 'expense') {
      if (!expenseBuckets.has(toBucket.id)) {
        expenseBuckets.set(toBucket.id, {
          bucket_id: toBucket.id,
          bucket_name: toBucket.name,
          total_amount: 0,
          category_id: toBucket.category?.id ?? null,
          category_name: toBucket.category?.name ?? null,
        });
      }

      const summary = expenseBuckets.get(toBucket.id)!;
      summary.total_amount += transaction.amount;
    }
  });

  return Array.from(expenseBuckets.values());
}

export async function getExpenseTransactionsWithDatesByPeriod(params: {
  startDate: string;
  endDate: string;
}): Promise<Transaction[]> {
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

  // Filter and return only expense transactions
  const expenseTransactions = transactions?.filter((transaction) => {
    const toBucket = transaction.to_bucket as unknown as {
      id: number;
      name: string;
      type: string;
    } | null;

    return toBucket && toBucket.type === 'expense';
  });

  return expenseTransactions || [];
}

export async function getExpenseTransactionsByCategoryAndPeriod(params: {
  categoryId: number;
  startDate: string;
  endDate: string;
}): Promise<Transaction[]> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  // Query all transactions within the target period
  // Left join with bucket table on to_bucket_id
  // Filter transactions with to_bucket_id of bucket with type 'expense' and matching category
  const { data: transactions, error } = await supabase
    .from('transaction')
    .select(
      `
      *,
      to_bucket:bucket!transaction_to_bucket_id_fkey(
        id,
        name,
        type,
        bucket_category_id
      )
    `,
    )
    .eq('user_id', userId)
    .gte('transaction_date', params.startDate)
    .lte('transaction_date', params.endDate)
    .not('to_bucket_id', 'is', null)
    .order('transaction_date', { ascending: false });

  if (error) throw new Error(error.message);

  // Filter transactions to only include those from expense buckets with matching category
  const expenseTransactions = transactions?.filter((transaction) => {
    const toBucket = transaction.to_bucket as unknown as {
      id: number;
      name: string;
      type: string;
      bucket_category_id: number | null;
    } | null;

    return (
      toBucket &&
      toBucket.type === 'expense' &&
      toBucket.bucket_category_id === params.categoryId
    );
  });

  return expenseTransactions || [];
}
