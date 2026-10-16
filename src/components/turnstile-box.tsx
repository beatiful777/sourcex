import { useEffect, useRef } from "react";

// Cloudflare Turnstile (CAPTCHA). Shown only when VITE_TURNSTILE_SITE_KEY is set.
export const TURNSTILE_KEY = import.meta.env['VITE_TURNSTILE_SITE_KEY'] as string | undefined;

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};
function getTurnstile(): TurnstileApi | undefined {
  return (window as unknown as { turnstile?: TurnstileApi }).turnstile;
}

export function TurnstileBox({ onToken, resetKey }: { onToken: (t: string | null) => void; resetKey: number }) {
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
