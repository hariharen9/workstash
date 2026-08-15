import React, { useState } from 'react';
import { useAuth } from '../auth';
import { Zap, Cloud, ShieldCheck, WifiOff, X, ArrowRight, Check } from 'lucide-react';

export const LoginScreen: React.FC<{ isModal?: boolean }> = ({ isModal = false }) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, continueAsGuest, closeLoginModal, isGuest } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

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
      setError('Please enter both email and password.');
      return;
    }
    if (authMode === 'signup') {
      await run(() => signUpWithEmail(email.trim(), password));
    } else {
      await run(() => signInWithEmail(email.trim(), password));
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[100] ${isModal ? 'bg-void/80 backdrop-blur-md' : 'bg-void'} flex items-center justify-center p-4 sm:p-6 overflow-y-auto`}
      data-lenis-prevent="true"
    >
      <div className="w-full max-w-[880px] bg-surface/95 backdrop-blur-xl border border-line rounded-[28px] p-6 sm:p-8 md:p-10 shadow-2xl relative animate-toastIn my-auto">
        {/* Close Button (if modal) */}
        {(isModal || isGuest) && (
          <button
            type="button"
            onClick={closeLoginModal}
            className="absolute top-5 right-5 p-2 rounded-xl bg-elevated/80 border border-line text-muted hover:text-text hover:bg-elevated-hi transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        )}

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-[12px] bg-[conic-gradient(from_220deg,theme(colors.violet),theme(colors.teal),theme(colors.amber),theme(colors.violet))] grid place-items-center shadow-brand shrink-0">
              <span className="w-3.5 h-3.5 rounded-[4px] bg-void"></span>
            </div>
            <h1 className="font-display text-[1.4rem] font-bold m-0 tracking-[-0.03em] leading-none text-text">
              WorkStash
            </h1>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-[-0.03em] m-0 text-text">
            Choose Your Spatial Workspace
          </h2>
          <p className="text-muted text-[0.875rem] max-w-lg mt-2 leading-relaxed m-0">
            WorkStash is built to respect your focus. Whether you prefer zero-cloud local privacy or seamless multi-device sync, both paths give you the full power of the finite Bento grid.
          </p>
        </div>

        {/* Dual First-Class Choice Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* ─── OPTION 1: Local-First & Offline ─── */}
          <div className="rounded-2xl bg-elevated/40 border border-teal/30 hover:border-teal/60 p-6 flex flex-col justify-between transition-all duration-300 relative group overflow-hidden shadow-tile hover:shadow-xl">
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-teal via-emerald-400 to-teal opacity-80" />

            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="font-mono text-[0.62rem] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-teal-dim text-teal border border-teal/30">
                  100% Local • Zero Setup
                </span>
                <div className="w-8 h-8 rounded-xl bg-teal/15 text-teal border border-teal/30 flex items-center justify-center shrink-0">
                  <Zap size={16} />
                </div>
              </div>

              <h3 className="font-display text-[1.25rem] font-bold text-text m-0 mb-2">
                Use Locally & Offline
              </h3>
              <p className="text-muted text-[0.825rem] leading-relaxed m-0 mb-5">
                Jump straight into your workspace. All tasks, scratchpads, and Pomodoro timers live safely inside your browser.
              </p>

              <div className="flex flex-col gap-2.5 mb-6 text-[0.78rem]">
                <div className="flex items-center gap-2 text-text/90">
                  <div className="w-4 h-4 rounded-full bg-teal/20 text-teal flex items-center justify-center shrink-0">
                    <Check size={11} strokeWidth={3} />
                  </div>
                  <span><strong>Zero login needed:</strong> Start in 1 second</span>
                </div>
                <div className="flex items-center gap-2 text-text/90">
                  <div className="w-4 h-4 rounded-full bg-teal/20 text-teal flex items-center justify-center shrink-0">
                    <WifiOff size={10} />
                  </div>
                  <span><strong>PWA Offline First:</strong> Works completely without internet</span>
                </div>
                <div className="flex items-center gap-2 text-text/90">
                  <div className="w-4 h-4 rounded-full bg-teal/20 text-teal flex items-center justify-center shrink-0">
                    <ShieldCheck size={11} />
                  </div>
                  <span><strong>Absolute Privacy:</strong> Zero cloud trackers or cookies</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={continueAsGuest}
                className="w-full py-3.5 px-4 rounded-xl bg-teal hover:bg-teal-hover text-void font-bold text-[0.9rem] cursor-pointer shadow-lg shadow-teal/15 hover:shadow-teal/25 transition-all duration-200 flex items-center justify-center gap-2 border-none active:scale-[0.98]"
              >
                <span>⚡ Start Local Workspace</span>
                <ArrowRight size={16} />
              </button>
              <p className="text-[0.68rem] text-faint text-center mt-2.5 m-0 font-medium">
                You can link a cloud account anytime from Settings or Header.
              </p>
            </div>
          </div>

          {/* ─── OPTION 2: Cloud Sync ─── */}
          <div className="rounded-2xl bg-elevated/40 border border-violet/30 hover:border-violet/60 p-6 flex flex-col justify-between transition-all duration-300 relative group overflow-hidden shadow-tile hover:shadow-xl">
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-violet via-purple-400 to-indigo-500 opacity-80" />

            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="font-mono text-[0.62rem] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-violet-dim text-violet border border-violet/30">
                  Cloud Sync • Multi-Device
                </span>
                <div className="w-8 h-8 rounded-xl bg-violet/15 text-violet border border-violet/30 flex items-center justify-center shrink-0">
                  <Cloud size={16} />
                </div>
              </div>

              <h3 className="font-display text-[1.25rem] font-bold text-text m-0 mb-2">
                Sign In to Sync
              </h3>
              <p className="text-muted text-[0.825rem] leading-relaxed m-0 mb-4">
                Sync your spatial grid across multiple computers and phones with real-time cloud backup.
              </p>

              {/* Google Button */}
              <button
                type="button"
                disabled={busy}
                onClick={() => run(signInWithGoogle)}
                className="w-full py-2.5 px-3 rounded-xl bg-text text-void font-semibold text-[0.825rem] cursor-pointer hover:opacity-90 transition-all border-none disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2 mb-3.5 shadow-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                  <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.16-3.16A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52Z" />
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-2 my-2.5 text-faint text-[0.65rem] font-mono tracking-wider uppercase">
                <span className="flex-1 h-px bg-line/80"></span>
                or email
                <span className="flex-1 h-px bg-line/80"></span>
              </div>

              {/* Email/Password Compact Form */}
              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-2">
                <input
                  type="email"
                  className="tile-field !py-2 !px-3 !text-[0.78rem]"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={busy}
                />
                <input
                  type="password"
                  className="tile-field !py-2 !px-3 !text-[0.78rem]"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                  disabled={busy}
                />

                {error && (
                  <div className="text-danger text-[0.75rem] bg-danger/10 border border-danger/20 rounded-lg px-2.5 py-1.5 leading-snug">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-2.5 rounded-xl bg-violet hover:bg-violet/90 text-white font-semibold text-[0.825rem] cursor-pointer transition-all border-none disabled:opacity-50 disabled:cursor-wait mt-1"
                >
                  {busy ? 'Processing…' : authMode === 'signup' ? 'Create Account & Sync' : 'Sign In & Sync'}
                </button>
              </form>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                disabled={busy}
                onClick={() => setAuthMode(m => m === 'signin' ? 'signup' : 'signin')}
                className="text-muted hover:text-text text-[0.72rem] font-medium bg-transparent border-none cursor-pointer p-0 underline-offset-2 hover:underline"
              >
                {authMode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
