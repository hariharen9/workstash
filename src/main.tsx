import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider, useAuth } from './auth'
import { LoginScreen } from './components/LoginScreen'
import { Logo } from './components/Logo'
import { useStore } from './store'

const Root = () => {
  const { user, loading, isGuest, isLoginModalOpen } = useAuth();
  const theme = useStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
          // Fallback gracefully if SW registration is restricted
        });
      });
    }
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-void flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted">
          <Logo size={36} className="animate-pulse" />
          <span className="text-[0.75rem] font-mono tracking-widest uppercase">Loading workspace</span>
        </div>
      </div>
    );
  }

  if (!user && !isGuest) return <LoginScreen />;

  return (
    <>
      <App />
      {isLoginModalOpen && <LoginScreen isModal />}
    </>
  );
};

const container = document.getElementById('root')!;
const rootKey = '__react_root__';
// @ts-expect-error window HMR root extension
const root = window[rootKey] || createRoot(container);
// @ts-expect-error window HMR root extension
window[rootKey] = root;

root.render(
  <StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </StrictMode>,
);
