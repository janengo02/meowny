import { getSupabase } from './supabase.js';

export async function signUp(params: SignUpParams): Promise<AuthUser> {
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: { name: params.name },
    },
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Sign up failed');

  return {
    id: data.user.id,
    email: data.user.email!,
  };
}

export async function signIn(params: SignInParams): Promise<AuthUser> {
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Sign in failed');

  return {
    id: data.user.id,
    email: data.user.email!,
  };
}

export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getUser(): Promise<AuthUser | null> {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getUser();

  if (!data.user) return null;

  return {
    id: data.user.id,
    email: data.user.email!,
  };
}

export async function getCurrentUserId(): Promise<string> {
  const user = await getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}
