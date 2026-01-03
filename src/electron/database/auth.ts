import { getSupabase } from './supabase.js';
import { logger, setUserId } from '../logger/index.js';

export async function signUp(params: SignUpParams): Promise<AuthUser> {
  const supabase = getSupabase();

  logger.info('auth', 'signUp', 'Attempting user registration', {
    email: params.email,
    name: params.name,
  });

  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: { name: params.name },
    },
  });

  if (error) {
    logger.error('auth', 'signUp', error, { email: params.email });
    throw new Error(error.message);
  }
  if (!data.user) {
    const err = new Error('Sign up failed');
    logger.error('auth', 'signUp', err, { email: params.email });
    throw err;
  }

  logger.info('auth', 'signUp', 'User registered successfully', {
    userId: data.user.id,
    email: data.user.email,
  });

  return {
    id: data.user.id,
    email: data.user.email!,
  };
}

export async function signIn(params: SignInParams): Promise<AuthUser> {
  const supabase = getSupabase();

  logger.info('auth', 'signIn', 'Attempting user login', {
    email: params.email,
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  });

  if (error) {
    logger.error('auth', 'signIn', error, { email: params.email });
    throw new Error(error.message);
  }
  if (!data.user) {
    const err = new Error('Sign in failed');
    logger.error('auth', 'signIn', err, { email: params.email });
    throw err;
  }

  // Set user ID for subsequent logs
  setUserId(data.user.id);

  logger.info('auth', 'signIn', 'User logged in successfully', {
    userId: data.user.id,
    email: data.user.email,
  });

  return {
    id: data.user.id,
    email: data.user.email!,
  };
}

export async function signOut(): Promise<void> {
  const supabase = getSupabase();

  logger.info('auth', 'signOut', 'Attempting user logout');

  const { error } = await supabase.auth.signOut();

  if (error) {
    logger.error('auth', 'signOut', error);
    throw new Error(error.message);
  }

  // Clear user ID from logger context
  setUserId(null);

  logger.info('auth', 'signOut', 'User logged out successfully');
}

export async function getUser(): Promise<AuthUser | null> {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    logger.debug('auth', 'getUser', 'No authenticated user found');
    return null;
  }

  logger.debug('auth', 'getUser', 'User session validated', {
    userId: data.user.id,
  });

  return {
    id: data.user.id,
    email: data.user.email!,
  };
}

export async function getCurrentUserId(): Promise<string> {
  const user = await getUser();
  if (!user) {
    const err = new Error('Not authenticated');
    logger.warn('auth', 'getCurrentUserId', 'Authentication required');
    throw err;
  }
  return user.id;
}
