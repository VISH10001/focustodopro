
import { cloneElement, useEffect, useState } from 'react';
import { supabase } from './supabase';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOut,
} from './auth';

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
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
        const { data, error } = await signUpWithEmail(email, password);
        if (error) throw error;

        if (!data.session) {
          setMessage('Account created! Please check your email and confirm your account.');
        } else {
          setMessage('Account created successfully!');
        }
      } else {
        const { error } = await signInWithEmail(email, password);
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
    const { error } = await signInWithGoogle();
    if (error) setMessage(error.message);
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (user) {
  return cloneElement(children, {
    user,
    onLogout: signOut,
  });
}

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-5">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-8">
        <h1 className="text-3xl font-bold text-center mb-2">FocusToDoPro</h1>
        <p className="text-slate-400 text-center mb-8">
          {mode === 'login' ? 'Welcome back! Sign in to continue.' : 'Create your account'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 p-3 text-white"
          />

          <input
            type="password"
            required
            minLength={6}
            placeholder="Password (minimum 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 p-3 text-white"
          />

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 p-3 font-semibold disabled:opacity-50"
          >
            {busy ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>

        <button
          onClick={handleGoogleLogin}
          className="w-full mt-4 rounded-lg border border-slate-600 p-3 hover:bg-slate-800"
        >
          Continue with Google
        </button>

        <button
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setMessage('');
          }}
          className="w-full mt-5 text-blue-400"
        >
          {mode === 'login'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Login'}
        </button>

        {message && (
          <p className="mt-5 text-center text-sm text-amber-300">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
