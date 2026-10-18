import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { TURNSTILE_KEY, TurnstileBox } from "@/components/turnstile-box";

function PasswordInput({ id, name }: { id: string; name: string }) {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input id={id} name={name} type={show ? "text" : "password"} autoComplete="new-password" required minLength={8} className="pr-10" />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? t("auth.hide") : t("auth.show")}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — SOURCEX" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [recovery, setRecovery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  useEffect(() => {
    if (/type=recovery/.test(window.location.hash)) setRecovery(true);
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function requestLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email")).trim();
    if (TURNSTILE_KEY && !captchaToken) { toast.error(t("auth.errCaptcha")); return; }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
      ...(captchaToken ? { captchaToken } : {}),
    });
    setBusy(false);
    // A CAPTCHA token can be used only once
    if (TURNSTILE_KEY) setCaptchaReset((n) => n + 1);
    if (error) { toast.error(error.message); return; }
    setSent(true);
  }

  async function setNewPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password"));
    if (password.length < 8) { toast.error(t("rp.short")); return; }
    if (password !== String(f.get("confirm"))) { toast.error(t("rp.mismatch")); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("rp.updated"));
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm rounded-xl border p-8">
        <div className="flex justify-center"><Logo /></div>
        {recovery ? (
          <>
            <h1 className="mt-6 text-center text-xl font-semibold">{t("rp.newTitle")}</h1>
            <form onSubmit={setNewPassword} autoComplete="off" className="mt-6 grid gap-4">
              <div className="grid gap-1.5"><Label htmlFor="password">{t("rp.new")}</Label><PasswordInput id="password" name="password" /></div>
              <div className="grid gap-1.5"><Label htmlFor="confirm">{t("rp.repeat")}</Label><PasswordInput id="confirm" name="confirm" /></div>
              <Button type="submit" disabled={busy}>{t("rp.save")}</Button>
            </form>
          </>
        ) : sent ? (
          <>
            <h1 className="mt-6 text-center text-xl font-semibold">{t("auth.checkEmail")}</h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">{t("rp.checkDesc")}</p>
          </>
        ) : (
          <>
            <h1 className="mt-6 text-center text-xl font-semibold">{t("rp.forgot")}</h1>
            <p className="mt-1 text-center text-sm text-muted-foreground">{t("rp.forgotD")}</p>
            <form onSubmit={requestLink} className="mt-6 grid gap-4">
              <div className="grid gap-1.5"><Label htmlFor="email">{t("rp.email")}</Label><Input id="email" name="email" type="email" placeholder="you@company.com" required /></div>
              {TURNSTILE_KEY && <TurnstileBox onToken={setCaptchaToken} resetKey={captchaReset} />}
              <Button type="submit" disabled={busy || (!!TURNSTILE_KEY && !captchaToken)}>{t("rp.send")}</Button>
            </form>
          </>
        )}
        <Link to="/sign-in" className="mt-4 block text-center text-sm text-primary">{t("rp.back")}</Link>
      </div>
    </div>
  );
}
