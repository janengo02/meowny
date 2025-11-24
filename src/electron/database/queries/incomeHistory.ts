import { getSupabase } from '../supabase.js';
import { getCurrentUserId } from '../auth.js';

export async function createIncomeHistory(
  params: CreateIncomeHistoryParams,
): Promise<IncomeHistory> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  if (!params.income_id) {
    throw new Error('Income source ID is required');
  }
  if (params.gross_amount === undefined || params.gross_amount === null) {
    throw new Error('Gross amount is required');
  }

  const { data, error } = await supabase
    .from('income_history')
    .insert({
      user_id: userId,
      income_id: params.income_id,
      income_category_id: params.income_category_id ?? null,
      gross_amount: params.gross_amount,
      received_date: params.received_date ?? new Date().toISOString(),
      notes: params.notes ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getIncomeHistories(): Promise<IncomeHistory[]> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('income_history')
    .select()
    .eq('user_id', userId)
    .order('received_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getIncomeHistory(id: number): Promise<IncomeHistory> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('income_history')
    .select()
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getIncomeHistoriesBySource(
  incomeId: number,
): Promise<IncomeHistory[]> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('income_history')
    .select()
    .eq('user_id', userId)
    .eq('income_id', incomeId)
    .order('received_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function updateIncomeHistory(
  id: number,
  params: UpdateIncomeHistoryParams,
): Promise<IncomeHistory> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const updateData: Record<string, unknown> = {};
  if (params.income_id !== undefined) updateData.income_id = params.income_id;
  if (params.income_category_id !== undefined)
    updateData.income_category_id = params.income_category_id;
  if (params.gross_amount !== undefined)
    updateData.gross_amount = params.gross_amount;
  if (params.received_date !== undefined)
    updateData.received_date = params.received_date;
  if (params.notes !== undefined) updateData.notes = params.notes;

  const { data, error } = await supabase
    .from('income_history')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteIncomeHistory(id: number): Promise<void> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from('income_history')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}
