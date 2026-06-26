import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userId: string | null;
  lastWorkspaceId: string | null;
  setLastWorkspaceId: (id: string | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ANON_USER_KEY = 'finsight_anon_user_id';
const LAST_WORKSPACE_KEY = 'finsight_last_workspace_id';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [lastWorkspaceId, setLastWorkspaceIdState] = useState<string | null>(() => {
    return localStorage.getItem(LAST_WORKSPACE_KEY);
  });

  const setLastWorkspaceId = useCallback((id: string | null) => {
    if (id) {
      localStorage.setItem(LAST_WORKSPACE_KEY, id);
    } else {
      localStorage.removeItem(LAST_WORKSPACE_KEY);
    }
    setLastWorkspaceIdState(id);
  }, []);

  useEffect(() => {
    // Check for existing anonymous user ID in localStorage
    const storedAnonId = localStorage.getItem(ANON_USER_KEY);

    if (storedAnonId) {
      setUserId(storedAnonId);
      setLoading(false);
      return;
    }

    // Create anonymous auth session automatically
    const initAnonAuth = async () => {
      try {
        // Try to sign in anonymously
        const { data, error } = await supabase.auth.signInAnonymously();

        if (error) {
          // If anonymous auth fails, generate a local UUID
          const localId = `local-${crypto.randomUUID()}`;
          localStorage.setItem(ANON_USER_KEY, localId);
          setUserId(localId);
        } else {
          // Store the anonymous user ID
          const anonId = data.user?.id || `anon-${crypto.randomUUID()}`;
          localStorage.setItem(ANON_USER_KEY, anonId);
          setUserId(anonId);
          setUser(data.user);
          setSession(data.session);
        }
      } catch {
        // Fallback to local UUID
        const localId = `local-${crypto.randomUUID()}`;
        localStorage.setItem(ANON_USER_KEY, localId);
        setUserId(localId);
      }
      setLoading(false);
    };

    initAnonAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setSession(session);
        const anonId = session.user.id;
        localStorage.setItem(ANON_USER_KEY, anonId);
        setUserId(anonId);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, userId, lastWorkspaceId, setLastWorkspaceId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
