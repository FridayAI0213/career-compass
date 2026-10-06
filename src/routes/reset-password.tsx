import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signOutCompletely } from "@/lib/auth-context";
import { readOAuthError } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new password — JobOS" },
      { name: "description", content: "Choose a new password for your JobOS account." },
      { property: "og:title", content: "Set a new password — JobOS" },
      { property: "og:description", content: "Choose a new password for your JobOS account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

const MIN_LENGTH = 8;

type Phase = "checking" | "ready" | "invalid";

/**
 * Public landing page for the password-recovery link. The link signs the user
 * in with a short-lived recovery session; we wait for it, then let them set a
 * new password. No session within a few seconds means the link is expired or
 * already used.
 */
function ResetPassword() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (readOAuthError()) {
      setPhase("invalid");
      return;
    }
    const ready = () => active && setPhase("ready");
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        session &&
        (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION")
      )
        ready();
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) ready();
    });
    const timer = window.setTimeout(() => {
      if (active) setPhase((current) => (current === "checking" ? "invalid" : current));
    }, 6000);
    return () => {
      active = false;
      subscription.unsubscribe();
      window.clearTimeout(timer);
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setBusy(false);
      const message = updateError.message.toLowerCase();
      if (message.includes("session") || message.includes("expired") || message.includes("jwt")) {
        setPhase("invalid");
      } else if (
        message.includes("pwned") ||
        message.includes("leaked") ||
        message.includes("weak")
      ) {
        setError(
          "This password has appeared in a data breach or is too weak. Choose a different one.",
        );
      } else if (message.includes("same") || message.includes("different")) {
        setError("Choose a password you haven't used for this account before.");
      } else {
        setError("We couldn't update your password. Please try again.");
      }
      return;
    }
    // End the recovery session so the user signs in fresh with the new password.
    await signOutCompletely(queryClient);
    await router.navigate({ to: "/auth", search: { reset: "1" }, replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold">Set a new password</h1>

        {phase === "checking" ? (
          <p role="status" className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Checking your reset link…
          </p>
        ) : phase === "invalid" ? (
          <div role="alert" className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              This reset link is invalid or has expired. Links work once and only for a limited
              time.
            </p>
            <Button asChild className="w-full">
              <Link to="/auth" search={{ forgot: "1" }}>
                Request a new link
              </Link>
            </Button>
          </div>
        ) : (
          <form className="mt-4 space-y-3" onSubmit={submit}>
            {error ? (
              <p
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {error}
              </p>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={MIN_LENGTH}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">At least {MIN_LENGTH} characters.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={MIN_LENGTH}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Saving…" : "Save new password"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
