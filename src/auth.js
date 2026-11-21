import { supabase } from './supabase';

// Create account using Username, Email and Password
export async function signUpWithEmail(username, email, password) {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username.trim(),
      },
      emailRedirectTo: window.location.origin,
    },
  });
}

// Login using Email and Password
export async function signInWithEmail(email, password) {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

// Send password recovery email
export async function sendPasswordResetEmail(email) {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
}

// Save new password after recovery link is verified
export async function updateUserPassword(password) {
  return await supabase.auth.updateUser({
    password,
  });
}

// Login using Google
export async function signInWithGoogle() {
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
}

// Logout
export async function signOut() {
  return await supabase.auth.signOut();
}

// Get current logged-in user
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return data.user;
}

// Listen for login and logout changes
export function listenToAuthChanges(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}
