import { cloneElement, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from './supabase';
import { fieldClass } from './styles/constants';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  sendPasswordResetEmail,
  updateUserPassword,
} from './auth';

const withTimeout = (promise, ms, timeoutMessage) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), ms)
    ),
  ]);
};

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return undefined;
    }

    let mounted = true;
    const sessionTimeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 5000);

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      clearTimeout(sessionTimeout);
      if (error) setMessage(error.message);
      setUser(data?.session?.user ?? null);
      setLoading(false);
    }).catch(() => {
      if (!mounted) return;
      clearTimeout(sessionTimeout);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      clearTimeout(sessionTimeout);
      setUser(session?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset');
        setMessage('Enter your new password below.');
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(sessionTimeout);
      subscription?.unsubscribe?.();
    };
  }, []);

  const resetForm = () => {
    setPassword('');
    setConfirmPassword('');
    setMessage('');
  };

  const enterOfflineMode = () => {
    setUser({ id: 'local', isLocal: true });
    setLoading(false);
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setBusy(true);

    try {
      if (mode === 'signup') {
        if (username.trim().length < 2) throw new Error('Username must contain at least 2 characters.');
        const { data, error } = await withTimeout(
          signUpWithEmail(username, email.trim(), password),
          15000,
          'Account creation timed out. Please check your internet connection.'
        );
        if (error) throw error;
        setMessage(data?.session ? 'Account created successfully!' : 'Account created! Please confirm your email.');
        if (data?.user && data?.session) {
          setUser(data.user);
        }
      } else if (mode === 'forgot') {
        const { error } = await withTimeout(
          sendPasswordResetEmail(email.trim()),
          15000,
          'Password reset request timed out. Please check your internet connection.'
        );
        if (error) throw error;
        setMessage('If an account exists, a reset link has been sent.');
      } else if (mode === 'reset') {
        if (password !== confirmPassword) throw new Error('Passwords do not match.');
        const { error } = await withTimeout(
          updateUserPassword(password),
          15000,
          'Password update timed out. Please check your internet connection.'
        );
        if (error) throw error;
        await signOut();
        resetForm();
        setMode('login');
        setMessage('Password updated. Please sign in.');
      } else {
        const { data, error } = await withTimeout(
          signInWithEmail(email.trim(), password),
          15000,
          'Sign in timed out. Please check your internet connection and try again.'
        );
        if (error) throw error;
        if (data?.user) {
          setUser(data.user);
        }
      }
    } catch (error) {
      setMessage(error?.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleLogin() {
    setMessage('');
    setBusy(true);
    try {
      const { error } = await withTimeout(
        signInWithGoogle(),
        15000,
        'Google sign-in timed out. Please check your internet connection and try again.'
      );
      if (error) throw error;
    } catch (error) {
      setMessage(error?.message || 'Google login failed.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="min-h-screen grid place-items-center bg-[#0d1528] text-slate-300">Loading your workspace…</div>;
  if (user && mode !== 'reset') return cloneElement(children, { user, onLogout: user.isLocal ? () => setUser(null) : signOut });

  const isSignup = mode === 'signup';
  const isForgot = mode === 'forgot';
  const isReset = mode === 'reset';
  const subtitle = isSignup ? 'Create a calm, focused workspace.' : isForgot ? 'We’ll help you get back in.' : isReset ? 'Choose a strong new password.' : 'Plan with clarity. Focus without friction.';

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0d1528] text-white p-5 relative overflow-hidden">
      <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_top_right,_#7d43e833,_transparent_32rem),radial-gradient(circle_at_bottom_left,_#ff6d5933,_transparent_30rem)]" />
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#15213b]/95 shadow-2xl shadow-black/40 p-6 sm:p-8 relative">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ffb14a] via-[#ff6d59] to-[#7d43e8] grid place-items-center mx-auto mb-5 shadow-lg shadow-violet-500/20 text-xl font-bold">✓</div>
        <h1 className="text-3xl font-bold text-center tracking-tight">FocusToDoPro</h1>
        <p className="text-slate-400 text-center mt-2 mb-7">{subtitle}</p>

        {!isSupabaseConfigured ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">Cloud sign-in is not configured in this build. Your tasks and focus sessions can still be saved locally on this device.</div>
            <button type="button" onClick={enterOfflineMode} className="w-full rounded-xl bg-gradient-to-r from-[#ffad4c] via-[#ff6d59] to-[#7d43e8] hover:brightness-110 p-3 font-semibold transition">Continue offline</button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && <input type="text" required minLength={2} maxLength={40} autoComplete="username" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className={fieldClass} />}
              {!isReset && <input type="email" required autoComplete="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />}
              {!isForgot && <input type="password" required minLength={6} autoComplete={isReset || isSignup ? 'new-password' : 'current-password'} placeholder={isReset ? 'New password (minimum 6 characters)' : 'Password'} value={password} onChange={(e) => setPassword(e.target.value)} className={fieldClass} />}
              {isReset && <input type="password" required minLength={6} autoComplete="new-password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={fieldClass} />}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-gradient-to-r from-[#ffad4c] via-[#ff6d59] to-[#7d43e8] hover:brightness-110 p-3 font-semibold transition disabled:opacity-50"
              >
                {busy ? 'Please wait…' : isSignup ? 'Create account' : isForgot ? 'Send reset link' : isReset ? 'Update password' : 'Sign in'}
              </button>
            </form>

            {!isSignup && !isForgot && !isReset && (
              <>
                <button type="button" onClick={handleGoogleLogin} disabled={busy} className="w-full mt-3 rounded-xl border border-white/15 p-3 hover:bg-white/5 disabled:opacity-50 transition">Continue with Google</button>
                <div className="flex items-center justify-between mt-4 text-sm">
                  <button type="button" onClick={() => { setMode('forgot'); resetForm(); }} className="text-blue-300 hover:text-blue-200">Forgot password?</button>
                  <button type="button" onClick={enterOfflineMode} className="text-gray-400 hover:text-gray-300">Continue offline</button>
                </div>
              </>
            )}

            {!isForgot && !isReset && (
              <button type="button" disabled={busy} onClick={() => { setMode(isSignup ? 'login' : 'signup'); resetForm(); }} className="w-full mt-5 text-sm text-blue-300 hover:text-blue-200">
                {isSignup ? 'Already have an account? Sign in' : 'New here? Create an account'}
              </button>
            )}

            {(isForgot || isReset) && (
              <button type="button" disabled={busy} onClick={() => { setMode('login'); resetForm(); }} className="w-full mt-5 text-sm text-blue-300 hover:text-blue-200">Back to sign in</button>
            )}

            {message && <p aria-live="polite" className="mt-5 rounded-lg bg-white/5 p-3 text-center text-sm text-amber-200 break-words">{message}</p>}
          </>
        )}
      </section>
    </main>
  );
}
