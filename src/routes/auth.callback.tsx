import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { consumeRedirect, readOAuthError } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Completing sign-in — JobOS" },
      { name: "description", content: "Finishing your JobOS sign-in and returning you to where you left off." },
      { property: "og:title", content: "Completing sign-in — JobOS" },
      { property: "og:description", content: "Finishing your JobOS sign-in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallback,
});

/**
 * Public landing point for OAuth. We never assume a session exists just
 * because the provider sent the browser back here — we wait for Supabase to
 * report one, then continue to the page the user originally asked for.
 */
function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const providerError = readOAuthError();
    if (providerError) {
      setError(providerError);
      return;
    }

    const finish = (destination: string) => {
      if (!active) return;
      void router.navigate({ to: destination, replace: true });
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) finish(consumeRedirect());
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) finish(consumeRedirect());
    });

    // If nothing lands within a few seconds the exchange failed silently.
    const timer = window.setTimeout(() => {
      if (active) setError("We could not complete the sign-in. Please try again.");
    }, 8000);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.clearTimeout(timer);
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="panel max-w-sm space-y-3 p-6 text-center">
        {error ? (
          <>
            <h1 className="font-display text-lg font-semibold">Sign-in didn't complete</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={() => router.navigate({ to: "/auth", replace: true })}>Back to sign in</Button>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" aria-hidden />
            <p role="status" className="text-sm text-muted-foreground">
              Signing you in…
            </p>
          </>
        )}
      </div>
    </main>
  );
}
