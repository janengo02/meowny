import { getSupabase } from '../supabase.js';
import { getCurrentUserId } from '../auth.js';

export async function createAccount(
  params: CreateAccountParams,
): Promise<Account> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  if (!params.name?.trim()) {
    throw new Error('Account name is required');
  }

  const { data, error } = await supabase
    .from('account')
    .insert({
      user_id: userId,
      name: params.name.trim(),
      type: params.type,
      color: params.color ?? 'default',
      notes: params.notes ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getAccounts(): Promise<Account[]> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('account')
    .select()
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getAccount(id: number): Promise<Account> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('account')
    .select()
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateAccount(
  id: number,
  params: UpdateAccountParams,
): Promise<Account> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  if (params.name !== undefined && !params.name?.trim()) {
    throw new Error('Account name cannot be empty');
  }

  const updateData: Record<string, unknown> = {};
  if (params.name !== undefined) updateData.name = params.name.trim();
  if (params.type !== undefined) updateData.type = params.type;
  if (params.color !== undefined) updateData.color = params.color;
  if (params.notes !== undefined) updateData.notes = params.notes;

  const { data, error } = await supabase
    .from('account')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteAccount(id: number): Promise<void> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  // First, delete all buckets associated with this account
  const { error: bucketsError } = await supabase
    .from('bucket')
    .delete()
    .eq('account_id', id)
    .eq('user_id', userId);

  if (bucketsError) {
    throw new Error(`Failed to delete buckets: ${bucketsError.message}`);
  }

  // Then delete the account
  const { error } = await supabase
    .from('account')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    // If no record found, return null instead of throwing
    if (error.code === 'PGRST116') return;
    throw new Error(error.message);
  }
}

export async function getAccountsWithBuckets(): Promise<NormalizedAccountsResponse> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  // Get all accounts
  const { data: accounts, error: accountsError } = await supabase
    .from('account')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (accountsError) throw new Error(accountsError.message);
  if (!accounts || accounts.length === 0) {
    return {
      accounts: {
        byId: {},
        byType: { asset: [], expense: [] },
      },
      buckets: { byId: {}, byAccountId: {}, byCategoryId: {} },
      categories: { byId: {} },
    };
  }

  // Get all buckets (exclude hidden ones)
  const { data: buckets, error: bucketsError } = await supabase
    .from('bucket')
    .select('*')
    .eq('user_id', userId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: true });

  if (bucketsError) throw new Error(bucketsError.message);

  // Get all bucket categories
  const { data: categories, error: categoriesError } = await supabase
    .from('bucket_category')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (categoriesError) throw new Error(categoriesError.message);

  // Normalize accounts
  const normalizedAccounts = {
    byId: {} as Record<number, Account>,
    byType: {
      asset: [] as number[],
      expense: [] as number[],
    },
  };

  accounts.forEach((account) => {
    normalizedAccounts.byId[account.id] = account;
    normalizedAccounts.byType[account.type as AccountTypeEnum].push(account.id);
  });

  // Normalize buckets
  const normalizedBuckets = {
    byId: {} as Record<number, Bucket>,
    byAccountId: {} as Record<number, number[]>,
    byCategoryId: {} as Record<number, number[]>,
  };

  if (buckets) {
    buckets.forEach((bucket) => {
      normalizedBuckets.byId[bucket.id] = bucket;

      if (bucket.account_id !== null) {
        if (!normalizedBuckets.byAccountId[bucket.account_id]) {
          normalizedBuckets.byAccountId[bucket.account_id] = [];
        }
        normalizedBuckets.byAccountId[bucket.account_id].push(bucket.id);
      }

      if (bucket.bucket_category_id !== null) {
        if (!normalizedBuckets.byCategoryId[bucket.bucket_category_id]) {
          normalizedBuckets.byCategoryId[bucket.bucket_category_id] = [];
        }
        normalizedBuckets.byCategoryId[bucket.bucket_category_id].push(
          bucket.id,
        );
      }
    });
  }

  // Normalize categories
  const normalizedCategories = {
    byId: {} as Record<number, BucketCategory>,
  };

  if (categories) {
    categories.forEach((category) => {
      normalizedCategories.byId[category.id] = category;
    });
  }

  return {
    accounts: normalizedAccounts,
    buckets: normalizedBuckets,
    categories: normalizedCategories,
  };
}
