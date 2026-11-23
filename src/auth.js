import { supabase } from './supabase';

function getAuthClient() {
  if (!supabase) {
    throw new Error('Cloud sign-in is not configured for this build.');
  }
  return supabase.auth;
}

export async function signUpWithEmail(username, email, password) {
  return getAuthClient().signUp({
    email,
    password,
    options: { data: { username: username.trim() }, emailRedirectTo: window.location.origin },
  });
}

export async function signInWithEmail(email, password) {
  return getAuthClient().signInWithPassword({ email, password });
}

export async function sendPasswordResetEmail(email) {
  return getAuthClient().resetPasswordForEmail(email, { redirectTo: window.location.origin });
}

export async function updateUserPassword(password) {
  return getAuthClient().updateUser({ password });
}

export async function signInWithGoogle() {
  return getAuthClient().signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
}

export async function signOut() {
  return getAuthClient().signOut();
}

export async function getCurrentUser() {
  const { data, error } = await getAuthClient().getUser();
  if (error) throw error;
  return data.user;
}

export function listenToAuthChanges(callback) {
  return getAuthClient().onAuthStateChange((event, session) => callback(event, session));
}
