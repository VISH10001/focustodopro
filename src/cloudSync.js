
import { supabase } from './supabase';

// Load logged-in user's data from Supabase
export async function loadUserData(userId) {
  const { data, error } = await supabase
    .from('user_data')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.data ?? null;
}

// Save logged-in user's data to Supabase
export async function saveUserData(userId, appData) {
  const { data, error } = await supabase
    .from('user_data')
    .upsert(
      {
        user_id: userId,
        data: appData,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    )
    .select();

  if (error) {
    throw error;
  }

  return data;
}
