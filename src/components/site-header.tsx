import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Key } from "@/lib/translations";

const NAV = [
  { to: "/suppliers", key: "nav.suppliers" },
  { to: "/open-rfqs", key: "nav.openRfqs" },
  { to: "/hubs", key: "nav.hubs" },
  { to: "/how-it-works", key: "nav.how" },
  { to: "/about", key: "nav.about" },
] as const satisfies readonly { to: string; key: Key }[];

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight text-foreground">
      <span className="grid h-7 w-7 place-items-center rounded-md bg-ink text-xs font-bold text-ink-foreground">
        SX
      </span>
      <span className="text-[15px]">SOURCEX</span>
    </Link>
  );
}

export function SiteHeader() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isSupplier, setIsSupplier] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!signedIn) { setIsSupplier(false); return; }
    supabase.rpc("my_approved_supplier").then(({ data }) => setIsSupplier(!!data?.length));
  }, [signedIn]);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    setOpen(false);
    navigate({ to: "/", replace: true });
    router.invalidate();
  }

  return (
    <header className="sticky top-0 z-40 print:hidden border-b bg-background/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-6 xl:gap-10">
          <Logo />
          <nav className="hidden items-center gap-5 xl:gap-7 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="whitespace-nowrap text-sm text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "whitespace-nowrap text-sm font-medium text-foreground" }}
              >
                {t(n.key)}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
        <div className="hidden items-center gap-2 md:flex">
          {signedIn ? (
            <>
              {isSupplier && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/supplier/rfqs">{t("hdr.rfqDesk")}</Link>
                </Button>
              )}
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard">{t("hdr.myRfqs")}</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                {t("hdr.signOut")}
              </Button>
            </>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link to="/sign-in">{t("hdr.signIn")}</Link>
            </Button>
          )}
          <Button asChild size="sm">
            <Link to="/rfq">{t("hdr.postRfq")}</Link>
          </Button>
        </div>
        {signedIn && <NotificationBell />}
        <button
          className="lg:hidden"
          aria-label={open ? t("hdr.closeMenu") : t("hdr.openMenu")}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        </div>
      </div>
      {open && (
        <div className="border-t lg:hidden">
          <nav className="container-page flex flex-col py-3">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-2 text-sm">
                {t(n.key)}
              </Link>
            ))}
            {signedIn && isSupplier && (
              <Link to="/supplier/rfqs" onClick={() => setOpen(false)} className="py-2 text-sm font-medium">
                {t("hdr.rfqDesk")}
              </Link>
            )}
            {signedIn && (
              <Link to="/dashboard" onClick={() => setOpen(false)} className="py-2 text-sm font-medium">
                {t("hdr.myRfqs")}
              </Link>
            )}
            <div className="mt-3 flex gap-2">
              {signedIn ? (
                <Button variant="outline" size="sm" className="flex-1" onClick={handleSignOut}>
                  {t("hdr.signOut")}
                </Button>
              ) : (
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link to="/sign-in" onClick={() => setOpen(false)}>{t("hdr.signIn")}</Link>
                </Button>
              )}
              <Button asChild size="sm" className="flex-1">
                <Link to="/rfq" onClick={() => setOpen(false)}>{t("hdr.postRfq")}</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
