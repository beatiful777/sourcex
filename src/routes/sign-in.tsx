import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

// Google sign-in works only after the Google provider is configured in Supabase (Authentication -> Providers).
// Set VITE_ENABLE_GOOGLE="true" on the host to show the button.
const GOOGLE_ENABLED = import.meta.env['VITE_ENABLE_GOOGLE'] === "true";

export const Route = createFileRoute("/sign-in")({
  head: () => ({
    meta: [
      { title: "Sign In — SOURCEX" },
      { name: "description", content: "Sign in to your SOURCEX buyer account to track your RFQs." },
      { property: "og:title", content: "Sign In — SOURCEX" },
      { property: "og:description", content: "Access your SOURCEX buyer account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error") || params.get("error_description");
    if (oauthError) {
      toast.error("Google sign-in didn't complete", { description: "Please try again, or use email and password." });
      window.history.replaceState({}, "", "/sign-in");
    }
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/dashboard" }); });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: "/dashboard" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim();
    const password = String(f.get("password"));
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setBusy(true);
    const { data, error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/dashboard` } });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    // With "Confirm email" switched off in Supabase, signUp returns a session right away.
    if (mode === "up" && !(data && "session" in data && data.session)) { toast.success("Check your email", { description: "Confirm your address to finish signing up." }); return; }
    navigate({ to: "/dashboard" });
  }

  async function google() {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/sign-in` } });
    if (error) toast.error("Google sign-in failed", { description: error.message });
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm rounded-xl border p-8">
        <div className="flex justify-center"><Logo /></div>
        <div className="mt-6 grid grid-cols-2 rounded-lg border p-1 text-sm">
          {(["in", "up"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={`rounded-md py-1.5 font-medium transition-colors ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {m === "in" ? "Login" : "Register"}
            </button>
          ))}
        </div>
        <h1 className="mt-6 text-center text-xl font-semibold">{mode === "in" ? "Sign in" : "Create a buyer account"}</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">Track your RFQs in one place.</p>
        {GOOGLE_ENABLED ? (
          <>
            <Button variant="outline" className="mt-6 w-full" onClick={google}>Continue with Google</Button>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" /></div>
          </>
        ) : (
          <div className="mt-6" />
        )}
        <form key={mode} onSubmit={onSubmit} autoComplete="off" className="grid gap-4">
          <div className="grid gap-1.5"><Label htmlFor="email">Work email</Label><Input id="email" name="email" type="email" defaultValue="" autoComplete="off" placeholder="you@company.com" required /></div>
          <div className="grid gap-1.5"><Label htmlFor="password">Password</Label><div className="relative">
              <Input id="password" name="password" type={showPw ? "text" : "password"} defaultValue="" autoComplete={mode === "in" ? "current-password" : "new-password"} required minLength={8} className="pr-10" />
              <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div></div>
          <Button type="submit" disabled={busy}>{mode === "in" ? "Sign in" : "Create account"}</Button>
        </form>
        <button className="mt-4 w-full text-center text-sm text-primary" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
