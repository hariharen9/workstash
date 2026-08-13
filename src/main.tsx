import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider, useAuth } from './auth'
import { LoginScreen } from './components/LoginScreen'

const Root = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-void flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted">
          <div className="w-7 h-7 rounded-[8px] bg-[conic-gradient(from_220deg,theme(colors.violet),theme(colors.teal),theme(colors.amber),theme(colors.violet))] grid place-items-center shadow-brand animate-pulse">
            <span className="w-2.5 h-2.5 rounded-[3px] bg-void"></span>
          </div>
          <span className="text-[0.75rem] font-mono tracking-widest uppercase">Loading workspace</span>
        </div>
      </div>
    );
  }

  if (!user) return <LoginScreen />;
  return <App />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </StrictMode>,
)
