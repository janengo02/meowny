import { getSupabase } from '../supabase.js';
import { getCurrentUserId } from '../auth.js';

export async function createIncomeTax(
  params: CreateIncomeTaxParams,
): Promise<IncomeTax> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  if (!params.income_history_id) {
    throw new Error('Income history ID is required');
  }
  if (params.tax_amount === undefined || params.tax_amount === null) {
    throw new Error('Tax amount is required');
  }

  const { data, error } = await supabase
    .from('income_tax')
    .insert({
      user_id: userId,
      income_history_id: params.income_history_id,
      tax_category_id: params.tax_category_id ?? null,
      tax_amount: params.tax_amount,
      notes: params.notes ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getIncomeTaxes(): Promise<IncomeTax[]> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('income_tax')
    .select()
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getIncomeTax(id: number): Promise<IncomeTax> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('income_tax')
    .select()
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getIncomeTaxesByIncomeHistory(
  incomeHistoryId: number,
): Promise<IncomeTax[]> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('income_tax')
    .select()
    .eq('user_id', userId)
    .eq('income_history_id', incomeHistoryId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function updateIncomeTax(
  id: number,
  params: UpdateIncomeTaxParams,
): Promise<IncomeTax> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const updateData: Record<string, unknown> = {};
  if (params.income_history_id !== undefined)
    updateData.income_history_id = params.income_history_id;
  if (params.tax_category_id !== undefined)
    updateData.tax_category_id = params.tax_category_id;
  if (params.tax_amount !== undefined) updateData.tax_amount = params.tax_amount;
  if (params.notes !== undefined) updateData.notes = params.notes;

  const { data, error } = await supabase
    .from('income_tax')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteIncomeTax(id: number): Promise<void> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from('income_tax')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}
