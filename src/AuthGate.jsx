import { cloneElement, useEffect, useState } from 'react';
import { supabase } from './supabase';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  sendPasswordResetEmail,
  updateUserPassword,
} from './auth';

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;

      if (error) setMessage(error.message);
      setUser(data?.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      setUser(session?.user ?? null);

      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset');
        setMessage('Enter your new password below.');
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setBusy(true);

    try {
      if (mode === 'signup') {
        if (username.trim().length < 2) {
          throw new Error('Username must contain at least 2 characters.');
        }

        const { data, error } = await signUpWithEmail(
          username,
          email.trim(),
          password
        );

        if (error) throw error;

        if (!data.session) {
          setMessage('Account created! Please check your email and confirm your account.');
        } else {
          setMessage('Account created successfully!');
        }
      } else if (mode === 'forgot') {
        const { error } = await sendPasswordResetEmail(email.trim());

        if (error) throw error;

        setMessage('If an account exists with this email, a password reset link has been sent. Please check your inbox.');
      } else if (mode === 'reset') {
        if (password.length < 6) {
          throw new Error('Password must contain at least 6 characters.');
        }

        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }

        const { error } = await updateUserPassword(password);

        if (error) throw error;

        await signOut();
        setPassword('');
        setConfirmPassword('');
        setMode('login');
        setMessage('Password updated successfully. Please login with your new password.');
      } else {
        const { error } = await signInWithEmail(email.trim(), password);
        if (error) throw error;
      }
    } catch (error) {
      setMessage(error.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleLogin() {
    setMessage('');
    setBusy(true);

    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (error) {
      setMessage(error.message || 'Google login failed.');
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Loading...
      </div>
    );
  }

  if (user && mode !== 'reset') {
    return cloneElement(children, {
      user,
      onLogout: signOut,
    });
  }

  const isSignup = mode === 'signup';
  const isForgot = mode === 'forgot';
  const isReset = mode === 'reset';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-5">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-8">
        <h1 className="text-3xl font-bold text-center mb-2">FocusToDoPro</h1>

        <p className="text-slate-400 text-center mb-8">
          {isSignup
            ? 'Create your account'
            : isForgot
              ? 'Recover your account'
              : isReset
                ? 'Create a new password'
                : 'Welcome back! Sign in to continue.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <input
              type="text"
              required
              minLength={2}
              maxLength={40}
              autoComplete="username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 p-3 text-white"
            />
          )}

          {!isReset && (
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 p-3 text-white"
            />
          )}

          {!isForgot && (
            <input
              type="password"
              required
              minLength={6}
              autoComplete={isReset ? 'new-password' : isSignup ? 'new-password' : 'current-password'}
              placeholder={isReset ? 'New password (minimum 6 characters)' : 'Password (minimum 6 characters)'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 p-3 text-white"
            />
          )}

          {isReset && (
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 p-3 text-white"
            />
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 p-3 font-semibold disabled:opacity-50"
          >
            {busy
              ? 'Please wait...'
              : isSignup
                ? 'Create Account'
                : isForgot
                  ? 'Send Reset Link'
                  : isReset
                    ? 'Update Password'
                    : 'Login'}
          </button>
        </form>

        {!isSignup && !isForgot && !isReset && (
          <>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={busy}
              className="w-full mt-4 rounded-lg border border-slate-600 p-3 hover:bg-slate-800 disabled:opacity-50"
            >
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('forgot');
                setPassword('');
                setMessage('');
              }}
              className="w-full mt-4 text-blue-400"
            >
              Forgot Password?
            </button>
          </>
        )}

        {!isForgot && !isReset && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setMode(isSignup ? 'login' : 'signup');
              setPassword('');
              setConfirmPassword('');
              setMessage('');
            }}
            className="w-full mt-5 text-blue-400"
          >
            {isSignup
              ? 'Already have an account? Login'
              : "Don't have an account? Sign up"}
          </button>
        )}

        {(isForgot || isReset) && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setMode('login');
              setPassword('');
              setConfirmPassword('');
              setMessage('');
            }}
            className="w-full mt-5 text-blue-400"
          >
            Back to Login
          </button>
        )}

        {message && (
          <p className="mt-5 text-center text-sm text-amber-300 break-words">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
