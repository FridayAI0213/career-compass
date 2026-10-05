import { createFileRoute, useRouter, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth-context";
import { readOAuthError, rememberRedirect, safePath } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } =>
    typeof search["redirect"] === "string" ? { redirect: search["redirect"] } : {},
  head: () => ({
    meta: [
      { title: "Sign in — JobOS Career Intelligence" },
      { name: "description", content: "Sign in to JobOS to manage your career record, see transparent match scores and track your applications." },
      { property: "og:title", content: "Sign in — JobOS Career Intelligence" },
      { property: "og:description", content: "Sign in to JobOS to manage your career record, see match scores and track applications." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const search = useSearch({ from: "/auth" });
  const destination = safePath(search.redirect);
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState<null | "signin" | "signup" | "google">(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<string | null>(null);

  // Surface an OAuth failure that came back through the URL rather than
  // silently dropping the user on a signed-out sign-in page.
  useEffect(() => {
    const oauthError = readOAuthError();
    if (oauthError) setFormError(oauthError);
  }, []);

  // A live session (including one arriving from another tab) means there is
  // nothing to do here. The shared auth context is the only listener.
  useEffect(() => {
    if (!loading && session) void router.navigate({ to: destination, replace: true });
  }, [loading, session, router, destination]);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setBusy("signin");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(null);
    if (error) {
      setFormError(error.message);
      return;
    }
    if (!data.session) {
      setFormError("Sign-in did not return a session. Please try again.");
      return;
    }
    await router.navigate({ to: destination, replace: true });
  }

  async function signUp(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setBusy("signup");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: fullName },
      },
    });
    setBusy(null);
    if (error) {
      setFormError(error.message);
      return;
    }
    // With email confirmation on, signUp returns no session: the user is NOT
    // signed in yet. Navigating here is what bounced people back out before.
    if (!data.session) {
      setPendingConfirm(email);
      toast.success("Account created. Confirm your email, then sign in.");
      return;
    }
    await router.navigate({ to: destination, replace: true });
  }

  async function google() {
    setFormError(null);
    setBusy("google");
    // The provider returns to a public callback route; the destination is kept
    // separately so a protected page is never used as the redirect target.
    rememberRedirect(destination);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth/callback`,
    });
    if (result.error) {
      setBusy(null);
      setFormError("Google sign-in failed. Please try again or use your email and password.");
      return;
    }
    if (result.redirected) return;
    // Popup flow: the session is set by the helper, but confirm it exists
    // before we treat the user as signed in.
    const { data } = await supabase.auth.getSession();
    setBusy(null);
    if (!data.session) {
      setFormError("Google sign-in did not create a session. Please try again.");
      return;
    }
    await router.navigate({ to: destination, replace: true });
  }

  if (loading || session) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Checking your session…
        </p>
      </main>
    );
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-10 lg:flex">
        <p className="font-display text-lg font-semibold">JobOS</p>
        <div className="max-w-md space-y-4">
          <h2 className="font-display text-3xl font-semibold leading-tight">
            Career intelligence that reasons about evidence, not buzzwords.
          </h2>
          <p className="text-sm text-muted-foreground">
            Deterministic match scoring, specialization mapping for any profession, and an application pipeline that
            tracks every touchpoint.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Your career record stays private to your account.</p>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-semibold">Welcome to JobOS</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to continue your career plan.</p>

          {pendingConfirm ? (
            <div className="mt-5 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              We sent a confirmation link to <span className="text-foreground">{pendingConfirm}</span>. Open it, then
              sign in below.
            </div>
          ) : null}

          {formError ? (
            <p
              role="alert"
              className="mt-5 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {formError}
            </p>
          ) : null}

          <Button variant="outline" className="mt-6 w-full" onClick={google} disabled={busy !== null}>
            {busy === "google" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Continue with Google
          </Button>


          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form className="space-y-3 pt-4" onSubmit={signIn}>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy !== null}>
                  {busy === "signin" ? "Signing in…" : "Sign in"}
                </Button>

              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form className="space-y-3 pt-4" onSubmit={signUp}>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email-up">Email</Label>
                  <Input id="email-up" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password-up">Password</Label>
                  <Input
                    id="password-up"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy !== null}>
                  {busy === "signup" ? "Creating account…" : "Create account"}
                </Button>

              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}