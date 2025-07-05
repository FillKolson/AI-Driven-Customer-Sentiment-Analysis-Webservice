import { Database } from '../types/supabase';

export type UserSettings = Database['public']['Tables']['user_preferences']['Row'];

/**
 * Get user settings for a given user ID using a provided Supabase client.
 * Usage: getUserSettings(supabase, userId)
 */
export async function getUserSettings(supabase: any, userId: string): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data as UserSettings;
}

/**
 * Upsert user settings for a given user ID using a provided Supabase client.
 * Usage: upsertUserSettings(supabase, userId, settings)
 */
export async function upsertUserSettings(supabase: any, userId: string, settings: any): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: userId, settings }, { onConflict: ['user_id'] })
    .select()
    .single();
  if (error) return null;
  return data as UserSettings;
} 