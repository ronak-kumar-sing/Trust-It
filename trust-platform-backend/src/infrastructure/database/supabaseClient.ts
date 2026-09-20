import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates and exports the Supabase admin client.
 * Uses the service_role key which bypasses Row Level Security.
 * MUST only be used for server-side operations — never exposed to clients.
 *
 * @param url - Supabase project URL
 * @param serviceRoleKey - Supabase service role key
 * @returns Configured Supabase admin client
 */
export function createSupabaseAdmin(
  url: string,
  serviceRoleKey: string,
): SupabaseClient {
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
  });
}

/**
 * Creates a user-scoped Supabase client that respects RLS.
 * Use when the operation should be restricted to the user's own data.
 *
 * @param url - Supabase project URL
 * @param anonKey - Supabase anonymous key
 * @param accessToken - User's JWT access token
 * @returns User-scoped Supabase client
 */
export function createUserClient(
  url: string,
  anonKey: string,
  accessToken: string,
): SupabaseClient {
  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
    },
  });
}
