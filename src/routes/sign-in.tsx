import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

// Google sign-in works only after the Google provider is configured in Supabase (Authentication -> Providers).
// Set VITE_ENABLE_GOOGLE="true" on the host to show the button.
const GOOGLE_ENABLED = import.meta.env['VITE_ENABLE_GOOGLE'] === "true";


// Cloudflare Turnstile (CAPTCHA). Shown only when VITE_TURNSTILE_SITE_KEY is set.
const TURNSTILE_KEY = import.meta.env['VITE_TURNSTILE_SITE_KEY'] as string | undefined;

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};
function getTurnstile(): TurnstileApi | undefined {
  return (window as unknown as { turnstile?: TurnstileApi }).turnstile;
}

function TurnstileBox({ onToken, resetKey }: { onToken: (t: string | null) => void; resetKey: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const idRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    function mount() {
      const ts = getTurnstile();
      if (cancelled || !ts || !ref.current || idRef.current) return;
      idRef.current = ts.render(ref.current, {
        sitekey: TURNSTILE_KEY,
        callback: (t: string) => onToken(t),
        "expired-callback": () => onToken(null),
        "error-callback": () => onToken(null),
      });
    }
    if (getTurnstile()) mount();
    else {
      let s = document.getElementById("cf-turnstile-script") as HTMLScriptElement | null;
      if (!s) {
        s = document.createElement("script");
        s.id = "cf-turnstile-script";
        s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        s.async = true;
        document.head.appendChild(s);
      }
      s.addEventListener("load", mount);
    }
    return () => {
      cancelled = true;
      const ts = getTurnstile();
      if (ts && idRef.current) ts.remove(idRef.current);
      idRef.current = undefined;
      onToken(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resetKey === 0) return;
    const ts = getTurnstile();
    if (ts && idRef.current) ts.reset(idRef.current);
    onToken(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  return <div ref={ref} className="flex justify-center" />;
}

// Password strength: 0 (empty) .. 3 (strong)
function passwordStrength(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length < 8) return 1;
  return score >= 5 ? 3 : score >= 3 ? 2 : 1;
}
const STRENGTH = [
  null,
  { label: "Weak", bar: "bg-red-500", text: "text-red-500", width: "33%" },
  { label: "Medium", bar: "bg-yellow-500", text: "text-yellow-500", width: "66%" },
  { label: "Strong", bar: "bg-green-500", text: "text-green-500", width: "100%" },
] as const;

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
  const { t } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [pw, setPw] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error") || params.get("error_description");
    if (oauthError) {
      toast.error(t("auth.googleFail1"), { description: t("auth.googleFail1Desc") });
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
    if (password.length < 8) { toast.error(t("auth.errShort")); return; }
    if (TURNSTILE_KEY && !captchaToken) { toast.error(t("auth.errCaptcha")); return; }
    const captcha = captchaToken ? { captchaToken } : {};
    setBusy(true);
    const { data, error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password, options: { ...captcha } })
        : await supabase.auth.signUp({ email, password, options: { ...captcha, emailRedirectTo: `${window.location.origin}/dashboard` } });
    setBusy(false);
    // A CAPTCHA token can be used only once
    if (TURNSTILE_KEY) setCaptchaReset((n) => n + 1);
    if (error) { toast.error(error.message); return; }
    // With "Confirm email" switched off in Supabase, signUp returns a session right away.
    if (mode === "up" && !(data && "session" in data && data.session)) { toast.success(t("auth.checkEmail"), { description: t("auth.checkEmailDesc") }); return; }
    navigate({ to: "/dashboard" });
  }

  async function google() {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/sign-in` } });
    if (error) toast.error(t("auth.googleFail2"), { description: error.message });
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm rounded-xl border p-8">
        <div className="flex justify-center"><Logo /></div>
        <div className="mt-6 grid grid-cols-2 rounded-lg border p-1 text-sm">
          {(["in", "up"] as const).map((m) => (
            <button key={m} type="button" onClick={() => { setMode(m); setPw(""); }}
              className={`rounded-md py-1.5 font-medium transition-colors ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {m === "in" ? t("auth.login") : t("auth.register")}
            </button>
          ))}
        </div>
        <h1 className="mt-6 text-center text-xl font-semibold">{mode === "in" ? t("auth.signIn") : t("auth.createBuyer")}</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">{t("auth.tagline")}</p>
        {GOOGLE_ENABLED ? (
          <>
            <Button variant="outline" className="mt-6 w-full" onClick={google}>{t("auth.google")}</Button>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />{t("auth.or")}<div className="h-px flex-1 bg-border" /></div>
          </>
        ) : (
          <div className="mt-6" />
        )}
        <form key={mode} onSubmit={onSubmit} autoComplete="off" className="grid gap-4">
          <div className="grid gap-1.5"><Label htmlFor="email">{t("auth.email")}</Label><Input id="email" name="email" type="email" defaultValue="" autoComplete="off" placeholder="you@company.com" required /></div>
          <div className="grid gap-1.5"><Label htmlFor="password">{t("auth.password")}</Label><div className="relative">
              <Input id="password" name="password" type={showPw ? "text" : "password"} defaultValue="" autoComplete={mode === "in" ? "current-password" : "new-password"} required minLength={8} onChange={(e) => setPw(e.target.value)} className="pr-10" />
              <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? t("auth.hide") : t("auth.show")}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {mode === "up" && pw && STRENGTH[passwordStrength(pw)] && (
              <div className="grid gap-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className={`h-full transition-all ${STRENGTH[passwordStrength(pw)]!.bar}`} style={{ width: STRENGTH[passwordStrength(pw)]!.width }} />
                </div>
                <p className={`text-xs ${STRENGTH[passwordStrength(pw)]!.text}`}>
                  {t(({ 1: "auth.weak", 2: "auth.medium", 3: "auth.strong" } as const)[passwordStrength(pw) as 1 | 2 | 3])}
                  {passwordStrength(pw) < 3 ? ` — ${t("auth.hint")}` : ""}
                </p>
              </div>
            )}
          </div>
          {mode === "in" && <Link to="/reset-password" className="-mt-2 text-right text-xs text-primary">{t("auth.forgot")}</Link>}
          {TURNSTILE_KEY && <TurnstileBox onToken={setCaptchaToken} resetKey={captchaReset} />}
          <Button type="submit" disabled={busy || (!!TURNSTILE_KEY && !captchaToken)}>{mode === "in" ? t("auth.signIn") : t("auth.createAccount")}</Button>
        </form>
        {mode === "up" && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {t("auth.agree1")} <Link to="/terms" className="underline">{t("auth.terms")}</Link> {t("auth.and")} <Link to="/privacy" className="underline">{t("auth.privacy")}</Link>{t("auth.agreeEnd")}
          </p>
        )}
        <button className="mt-4 w-full text-center text-sm text-primary" onClick={() => { setMode(mode === "in" ? "up" : "in"); setPw(""); }}>
          {mode === "in" ? t("auth.newHere") : t("auth.haveAccount")}
        </button>
      </div>
    </div>
  );
}
