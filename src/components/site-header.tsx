import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/suppliers", label: "Suppliers" },
  { to: "/open-rfqs", label: "Open RFQs" },
  { to: "/hubs", label: "Country Hubs" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/about", label: "About" },
] as const;

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
        <div className="flex items-center gap-10">
          <Logo />
          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-sm font-medium text-foreground" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-1">
        <div className="hidden items-center gap-2 md:flex">
          {signedIn ? (
            <>
              {isSupplier && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/supplier/rfqs">RFQ Desk</Link>
                </Button>
              )}
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard">My RFQs</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link to="/sign-in">Sign In</Link>
            </Button>
          )}
          <Button asChild size="sm">
            <Link to="/rfq">Post RFQ</Link>
          </Button>
        </div>
        {signedIn && <NotificationBell />}
        <button
          className="md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        </div>
      </div>
      {open && (
        <div className="border-t md:hidden">
          <nav className="container-page flex flex-col py-3">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-2 text-sm">
                {n.label}
              </Link>
            ))}
            {signedIn && isSupplier && (
              <Link to="/supplier/rfqs" onClick={() => setOpen(false)} className="py-2 text-sm font-medium">
                RFQ Desk
              </Link>
            )}
            {signedIn && (
              <Link to="/dashboard" onClick={() => setOpen(false)} className="py-2 text-sm font-medium">
                My RFQs
              </Link>
            )}
            <div className="mt-3 flex gap-2">
              {signedIn ? (
                <Button variant="outline" size="sm" className="flex-1" onClick={handleSignOut}>
                  Sign Out
                </Button>
              ) : (
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link to="/sign-in" onClick={() => setOpen(false)}>Sign In</Link>
                </Button>
              )}
              <Button asChild size="sm" className="flex-1">
                <Link to="/rfq" onClick={() => setOpen(false)}>Post RFQ</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
