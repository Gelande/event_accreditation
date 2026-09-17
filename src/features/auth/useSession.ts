import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Retrieve active session on mount
    supabase.auth.getSession()
      .then(({ data: { session: initialSession } }) => {
        if (isMounted) {
          setSession(initialSession);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSession(null);
          setIsLoading(false);
        }
      });

    // Listen to changes in auth state (login, logout, refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, updatedSession) => {
        if (isMounted) {
          setSession(updatedSession);
          setIsLoading(false);
        }
      },
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return {
    session,
    user: (session?.user as User | undefined) ?? null,
    isAuthenticated: Boolean(session?.user),
    isLoading,
    logout,
  };
}
