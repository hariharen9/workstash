import React, { useState } from 'react';
import { useAuth } from '../auth';

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong';
      setError(message.replace(/^Firebase:\s*/i, '').replace(/\s*\(auth.*\)$/i, ''));
    } finally {
      setBusy(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter both email and password.');
      return;
    }
    await run(() => signInWithEmail(email.trim(), password));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-void flex items-center justify-center p-5 overflow-y-auto" data-lenis-prevent="true">
      <div className="w-full max-w-[440px] bg-surface border border-line rounded-[24px] p-7 shadow-shutter animate-toastIn">
        <div className="flex items-center gap-3 mb-7">
          <div className="w-9 h-9 rounded-[10px] bg-[conic-gradient(from_220deg,theme(colors.violet),theme(colors.teal),theme(colors.amber),theme(colors.violet))] grid place-items-center shadow-brand shrink-0">
            <span className="w-3 h-3 rounded-[4px] bg-void"></span>
          </div>
          <div>
            <h1 className="font-display text-[1.2rem] font-semibold m-0 tracking-[-0.03em] leading-none">WorkStash</h1>
            <p className="text-muted text-[0.72rem] m-0 mt-1 tracking-wide font-medium">Spatial task workspace</p>
          </div>
        </div>

        <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] m-0 mb-2 text-text">
          Sign in to your workspace
        </h2>
        <p className="text-muted text-[0.875rem] leading-relaxed m-0 mb-6">
          Your board syncs to the cloud, so it survives browser data clears and follows you across browsers.
        </p>

        <button
          type="button"
          disabled={busy}
          onClick={() => run(signInWithGoogle)}
          className="w-full py-3 rounded-xl bg-text text-void font-semibold text-[0.875rem] cursor-pointer hover:shadow-[0_8px_20px_-6px_rgba(255,255,255,0.15)] transition-all border-none disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2.5 mb-4"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
            <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.16-3.16A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52Z" />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-5 text-faint text-[0.7rem] font-mono tracking-wide uppercase">
          <span className="flex-1 h-px bg-line"></span>
          or email
          <span className="flex-1 h-px bg-line"></span>
        </div>

        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.72rem] text-muted font-semibold tracking-[0.04em] uppercase">Email</span>
            <input
              type="email"
              className="tile-field !py-3"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={busy}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.72rem] text-muted font-semibold tracking-[0.04em] uppercase">Password</span>
            <input
              type="password"
              className="tile-field !py-3"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={busy}
            />
          </label>

          {error && (
            <div className="text-danger text-[0.8125rem] bg-danger/10 border border-danger/20 rounded-lg px-3 py-2.5 leading-snug">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-xl bg-violet hover:bg-violet/90 text-white font-semibold text-[0.875rem] cursor-pointer transition-all border-none disabled:opacity-50 disabled:cursor-wait"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <button
          type="button"
          disabled={busy}
          onClick={() => run(async () => {
            if (!email.trim() || !password) {
              setError('Enter both email and password.');
              return;
            }
            await signUpWithEmail(email.trim(), password);
          })}
          className="mt-4 w-full text-muted hover:text-text text-[0.8125rem] font-medium bg-transparent border-none cursor-pointer disabled:opacity-50"
        >
          New here? Create an account
        </button>
      </div>
    </div>
  );
};
