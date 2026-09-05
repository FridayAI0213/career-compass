import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AuthState {
  session: Session | null;
  user: User | null;
  /** True until the very first session resolution completes. */
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ session: null, user: null, loading: true });

/**
 * The single source of auth truth for the client. One listener, one initial
 * getSession() call. Route protection still re-validates with getUser() in the
 * `_authenticated` gate; this context only drives UI.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setLoading(false);

      const nextUserId = nextSession?.user.id ?? null;
      const identityChanged = previousUserId.current !== undefined && previousUserId.current !== nextUserId;
      previousUserId.current = nextUserId;

      // Ignore token refreshes and repeat INITIAL_SESSION events: they would
      // otherwise thrash the router and refetch every query roughly hourly.
      if (!identityChanged && event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;

      void router.invalidate();
      if (event === "SIGNED_OUT") {
        queryClient.clear();
      } else {
        void queryClient.invalidateQueries();
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession((current) => current ?? data.session);
      previousUserId.current = data.session?.user.id ?? null;
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router, queryClient]);

  const value = useMemo<AuthState>(
    () => ({ session, user: session?.user ?? null, loading }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

/** Signs out and removes every trace of the previous user from the client. */
export async function signOutCompletely(queryClient: {
  cancelQueries: () => Promise<void>;
  clear: () => void;
}) {
  await queryClient.cancelQueries();
  queryClient.clear();
  await supabase.auth.signOut();
}
