import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id: string) => void;
    };
  }
}

// Human check (Cloudflare Turnstile). Shown only when VITE_TURNSTILE_SITE_KEY is set, so the page works without it.
const TURNSTILE_KEY = import.meta.env['VITE_TURNSTILE_SITE_KEY'] as string | undefined;

const COMMON_PASSWORDS = ["password", "12345678", "123456789", "qwerty123", "11111111", "iloveyou", "admin123", "letmein1"];

/** 1 = weak (red), 2 = medium (yellow), 3 = strong (green). 0 = nothing typed yet. */
function passwordStrength(p: string): { level: 0 | 1 | 2 | 3; label: string } {
  if (!p) return { level: 0, label: "" };
  if (p.length < 8 || COMMON_PASSWORDS.includes(p.toLowerCase())) return { level: 1, label: "Weak" };
  let score = 1;
  if (p.length >= 12) score++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
  if (/\d/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  if (score <= 2) return { level: 1, label: "Weak" };
  if (score === 3) return { level: 2, label: "Medium" };
  return { level: 3, label: "Strong" };
}

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
  const [pw, setPw] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  useEffect(() => {
    if (!TURNSTILE_KEY) return;
    setCaptchaToken("");
    let cancelled = false;
    const mount = () => {
      if (cancelled || !widgetRef.current || !window.turnstile) return;
      widgetId.current = window.turnstile.render(widgetRef.current, {
        sitekey: TURNSTILE_KEY,
        callback: (t: string) => setCaptchaToken(t),
        "expired-callback": () => setCaptchaToken(""),
        "error-callback": () => setCaptchaToken(""),
      });
    };
    if (window.turnstile) mount();
    else {
      let script = document.querySelector<HTMLScriptElement>("script[data-turnstile]");
      if (!script) {
        script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.dataset["turnstile"] = "1";
        document.head.appendChild(script);
      }
      script.addEventListener("load", mount);
    }
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [mode]);
  useEffect(() => setPw(""), [mode]);
  const strength = passwordStrength(pw);

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
    if (TURNSTILE_KEY && !captchaToken) { toast.error("Please complete the human check first"); return; }
    const captcha = TURNSTILE_KEY ? { captchaToken } : {};
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setBusy(true);
    const { data, error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password, options: captcha })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/dashboard`, ...captcha } });
    setBusy(false);
    if (TURNSTILE_KEY) { window.turnstile?.reset(widgetId.current ?? undefined); setCaptchaToken(""); } // tokens are single-use
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
              <Input id="password" name="password" type={showPw ? "text" : "password"} defaultValue="" autoComplete={mode === "in" ? "current-password" : "new-password"} required minLength={8} onChange={(e) => setPw(e.target.value)} className="pr-10" />
              <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {mode === "up" && strength.level > 0 && (
              <div className="grid gap-1" aria-live="polite">
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength.level ? (strength.level === 1 ? "bg-red-500" : strength.level === 2 ? "bg-yellow-500" : "bg-green-500") : "bg-muted"}`} />
                  ))}
                </div>
                <p className={`text-xs ${strength.level === 1 ? "text-red-600" : strength.level === 2 ? "text-yellow-600" : "text-green-600"}`}>
                  {strength.label}{strength.level === 1 ? ": use 8+ characters, mix letters and numbers" : ""}
                </p>
              </div>
            )}
          </div>
          {TURNSTILE_KEY && <div ref={widgetRef} className="min-h-[65px]" />}
          <Button type="submit" disabled={busy}>{mode === "in" ? "Sign in" : "Create account"}</Button>
        </form>
        <button className="mt-4 w-full text-center text-sm text-primary" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
