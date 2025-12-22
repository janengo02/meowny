import { getSupabase } from '../supabase.js';
import { getCurrentUserId } from '../auth.js';

export async function getUserPreference(
  params: GetUserPreferenceParams,
): Promise<UserPreference | null> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  if (!params.preference_key?.trim()) {
    throw new Error('Preference key is required');
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .select()
    .eq('user_id', userId)
    .eq('preference_key', params.preference_key)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function upsertUserPreference(
  params: UpsertUserPreferenceParams,
): Promise<UserPreference> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  if (!params.preference_key?.trim()) {
    throw new Error('Preference key is required');
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(
      {
        user_id: userId,
        preference_key: params.preference_key,
        preference_value: params.preference_value,
      },
      {
        onConflict: 'user_id,preference_key',
      },
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
