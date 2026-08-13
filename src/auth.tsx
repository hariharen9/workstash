import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { useStore, buildEmptyWorkspace, serializeWorkspaceState, type PersistedWorkspace } from './store';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

let unsubscribeStore: (() => void) | undefined;
let writeTimer: ReturnType<typeof setTimeout> | undefined;
let allowSave = false;

function disconnectSync() {
  allowSave = false;
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = undefined;
  }
  unsubscribeStore?.();
  unsubscribeStore = undefined;
}

async function connectSync(uid: string) {
  disconnectSync();
  allowSave = false;

  const workspaceRef = doc(db, 'users', uid, 'workspace', 'main');
  try {
    const snap = await getDoc(workspaceRef);
    if (snap.exists()) {
      useStore.getState().hydrateCloudWorkspace(snap.data() as PersistedWorkspace);
    } else {
      const empty = buildEmptyWorkspace();
      useStore.getState().hydrateCloudWorkspace(empty);
      await setDoc(workspaceRef, empty);
    }
  } catch (err) {
    console.error('Failed to load cloud workspace; using local state as a temporary fallback.', err);
    allowSave = false;
    return;
  }

  allowSave = true;

  unsubscribeStore = useStore.subscribe((state) => {
    if (!allowSave) return;
    if (writeTimer) clearTimeout(writeTimer);
    writeTimer = setTimeout(() => {
      const payload = serializeWorkspaceState({
        mode: state.mode,
        focusedTaskId: state.focusedTaskId,
        tasks: state.tasks,
        activityLogs: state.activityLogs,
        focusSessions: state.focusSessions,
        gridLayout: state.gridLayout,
        morningIntentDate: state.morningIntentDate,
        notificationPermission: state.notificationPermission,
      });
      setDoc(workspaceRef, payload).catch((err) => {
        console.error('Failed to save cloud workspace:', err);
      });
    }, 800);
  });
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        disconnectSync();
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);
      setLoading(true);
      await connectSync(firebaseUser.uid);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      disconnectSync();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
