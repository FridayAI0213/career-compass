import { createFileRoute, useRouter, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
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
      { name: "description", content: "Sign in to JobOS to plan your specialization, score real openings and run your job search as one system." },
      { property: "og:title", content: "Sign in — JobOS Career Intelligence" },
      { property: "og:description", content: "Sign in to JobOS to plan your specialization, score openings and run your job search." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function safePath(value: string | undefined) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

function AuthPage() {
  const router = useRouter();
  const search = useSearch({ from: "/auth" });
  const destination = safePath(search.redirect);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  const [pendingConfirm, setPendingConfirm] = useState<string | null>(null);

  // Send anyone who already has a live session straight on, and react to a
  // session arriving while this page is open (OAuth popup, other tab).
  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) void router.navigate({ to: destination, replace: true });
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void router.navigate({ to: destination, replace: true });
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router, destination]);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      toast.error("Sign-in did not return a session. Please try again.");
      return;
    }
    await router.navigate({ to: destination, replace: true });
  }

  async function signUp(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
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
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Try email instead.");
      return;
    }
    if (result.redirected) return;
    // Wait for the session to be written before leaving this page.
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      toast.error("Google sign-in did not create a session. Please try again.");
      return;
    }
    await router.navigate({ to: destination, replace: true });
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

          <Button variant="outline" className="mt-6 w-full" onClick={google}>
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
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Signing in…" : "Sign in"}
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
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Creating account…" : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}