
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

// Load data together with its cloud revision
export async function loadUserRecord(userId) {
  const { data, error } = await supabase
    .from('user_data')
    .select('data, revision')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  return {
    data: data?.data ?? null,
    revision: data?.revision ?? 0,
  };
}

// Save only if the cloud revision has not changed
export async function saveUserRecord(userId, appData, expectedRevision) {
  if (expectedRevision === 0) {
    const { data, error } = await supabase
      .from('user_data')
      .insert({
        user_id: userId,
        data: appData,
        revision: 1,
        updated_at: new Date().toISOString(),
      })
      .select('revision')
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        return { saved: false, conflict: true };
      }
      throw error;
    }

    return { saved: true, revision: data.revision };
  }

  const nextRevision = expectedRevision + 1;

  const { data, error } = await supabase
    .from('user_data')
    .update({
      data: appData,
      revision: nextRevision,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('revision', expectedRevision)
    .select('revision')
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return { saved: false, conflict: true };
  }

  return { saved: true, revision: data.revision };
}
