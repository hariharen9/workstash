import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  deleteUser,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, type DocumentReference } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import {
  useStore,
  buildEmptyWorkspace,
  serializeWorkspaceState,
  type PersistedWorkspace,
} from './store';

type SyncStatus = 'loading' | 'synced' | 'error';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  syncStatus: SyncStatus;
  syncError: string;
  retrySync: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

let unsubscribeStore: (() => void) | undefined;
let writeTimer: ReturnType<typeof setTimeout> | undefined;
let allowSave = false;
let cloudLoaded = false;
let statusReporter: (status: SyncStatus, error: string) => void = () => {};

function disconnectSync() {
  allowSave = false;
  cloudLoaded = false;
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = undefined;
  }
  unsubscribeStore?.();
  unsubscribeStore = undefined;
}

function getLocalWorkspace(): PersistedWorkspace {
  const s = useStore.getState();
  return serializeWorkspaceState({
    mode: s.mode,
    focusedTaskId: s.focusedTaskId,
    tasks: s.tasks,
    activityLogs: s.activityLogs,
    focusSessions: s.focusSessions,
    gridLayout: s.gridLayout,
    morningIntentDate: s.morningIntentDate,
    notificationPermission: s.notificationPermission,
  });
}

// Union by id with local taking precedence over remote. This keeps tasks/sessions
// added from another browser while preserving the current browser's latest edits.
function byId<T extends { id: string }>(local: T[], remote: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of remote) map.set(item.id, item);
  for (const item of local) map.set(item.id, item);
  return Array.from(map.values());
}

function mergeWorkspace(local: PersistedWorkspace, remote: PersistedWorkspace): PersistedWorkspace {
  return {
    ...remote,
    ...local,
    tasks: byId(local.tasks ?? [], remote.tasks ?? []),
    activityLogs: byId(local.activityLogs ?? [], remote.activityLogs ?? []),
    focusSessions: byId(local.focusSessions ?? [], remote.focusSessions ?? []),
  };
}

// Strip undefined properties recursively since Firestore rejects objects containing undefined
function cleanForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

async function flushSave(workspaceRef: DocumentReference) {
  if (!allowSave) return;

  const local = getLocalWorkspace();
  let payload = local;

  // Pull the latest remote doc before writing so two open browsers don't
  // silently clobber each other's additions.
  try {
    const remoteSnap = await getDoc(workspaceRef);
    if (remoteSnap.exists()) {
      payload = mergeWorkspace(local, remoteSnap.data() as PersistedWorkspace);
    }
  } catch (readErr) {
    console.warn('Could not read remote workspace before save; writing local state only.', readErr);
  }

  try {
    await setDoc(workspaceRef, cleanForFirestore(payload));
    statusReporter('synced', '');
  } catch (err) {
    console.error('Failed to save cloud workspace:', err);
    statusReporter('error', 'Your latest changes could not be saved to the cloud. They are still safe on this device.');
  }
}

async function connectSync(uid: string, isRetry = false) {
  const hadCloud = cloudLoaded;
  disconnectSync();
  allowSave = false;

  const workspaceRef = doc(db, 'users', uid, 'workspace', 'main');
  try {
    const snap = await getDoc(workspaceRef);
    if (snap.exists()) {
      if (isRetry && hadCloud) {
        // Merge offline edits with cloud instead of overwriting them.
        const merged = mergeWorkspace(getLocalWorkspace(), snap.data() as PersistedWorkspace);
        useStore.getState().hydrateCloudWorkspace(merged);
        await setDoc(workspaceRef, cleanForFirestore(merged));
      } else {
        useStore.getState().hydrateCloudWorkspace(snap.data() as PersistedWorkspace);
      }
      cloudLoaded = true;
    } else if (isRetry && hadCloud) {
      const local = getLocalWorkspace();
      useStore.getState().hydrateCloudWorkspace(local);
      await setDoc(workspaceRef, cleanForFirestore(local));
      cloudLoaded = true;
    } else {
      const empty = buildEmptyWorkspace();
      useStore.getState().hydrateCloudWorkspace(empty);
      await setDoc(workspaceRef, cleanForFirestore(empty));
      cloudLoaded = true;
    }
    statusReporter('synced', '');
  } catch (err) {
    console.error('Failed to load cloud workspace; using local state as a temporary fallback.', err);
    statusReporter('error', 'Could not load your cloud workspace. You are working offline — changes will stay on this device until you retry.');
    allowSave = false;
    return;
  }

  allowSave = true;

  unsubscribeStore = useStore.subscribe(() => {
    if (!allowSave) return;
    if (writeTimer) clearTimeout(writeTimer);
    writeTimer = setTimeout(() => {
      void flushSave(workspaceRef);
    }, 800);
  });
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');
  const [syncError, setSyncError] = useState('');

  useEffect(() => {
    statusReporter = (status, error) => {
      setSyncStatus(status);
      setSyncError(error);
    };
    return () => {
      statusReporter = () => {};
    };
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        disconnectSync();
        setUser(null);
        setLoading(false);
        setSyncStatus('loading');
        setSyncError('');
        return;
      }

      setUser(firebaseUser);
      setLoading(true);
      setSyncStatus('loading');
      setSyncError('');
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

  const retrySync = useCallback(async () => {
    if (!user) return;
    await connectSync(user.uid, true);
  }, [user]);

  const deleteAccount = useCallback(async () => {
    disconnectSync();
    const currentUser = user || auth.currentUser;
    if (currentUser) {
      try {
        const workspaceRef = doc(db, 'users', currentUser.uid, 'workspace', 'main');
        await deleteDoc(workspaceRef);
      } catch (err) {
        console.warn('Could not delete firestore workspace doc during account deletion:', err);
      }
      try {
        await deleteUser(currentUser);
      } catch (authErr) {
        console.warn('Could not delete auth user directly; signing out:', authErr);
        await firebaseSignOut(auth);
      }
    }
    try {
      localStorage.removeItem('workstash-v1');
    } catch {
      // ignore
    }
    useStore.getState().resetWorkspace();
    setUser(null);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, syncStatus, syncError, retrySync, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
