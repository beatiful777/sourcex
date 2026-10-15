import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, fmt } from "@/lib/i18n";

type Item = { id: string; kind: "quote" | "accepted" | "approved" | "rejected"; product?: string; company?: string; to: "/dashboard" | "/supplier/rfqs"; at: number };

// Notifications are derived from existing data (quotes received, quotes accepted,
// supplier application decisions). "Seen" ids are kept in this browser only.
function readSeen(uid: string): Set<string> | null {
  try {
    const raw = window.localStorage.getItem(`sx_seen:${uid}`);
    return raw ? new Set(JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
}
function writeSeen(uid: string, ids: Set<string>) {
  try {
    window.localStorage.setItem(`sx_seen:${uid}`, JSON.stringify([...ids].slice(-500)));
  } catch {
    /* storage unavailable: notifications just stay unread */
  }
}

async function loadItems(uid: string): Promise<Item[]> {
  const items: Item[] = [];

  // Quotes buyers received on their own RFQs
  const { data: rfqs } = await supabase
    .from("rfqs")
    .select("id, product, rfq_applications(id, company_name, created_at)")
    .eq("user_id", uid);
  for (const r of rfqs ?? []) {
    for (const a of r.rfq_applications ?? []) {
      items.push({
        id: `q:${a.id}`,
        kind: "quote",
        product: r.product,
        company: a.company_name ?? "",
        to: "/dashboard",
        at: Date.parse(a.created_at) || 0,
      });
    }
  }

  // Quotes a supplier sent that were accepted
  const { data: mine } = await supabase
    .from("rfq_applications")
    .select("id, rfq_id, status, updated_at")
    .eq("supplier_id", uid)
    .eq("status", "accepted");
  if (mine?.length) {
    const { data: quotes } = await supabase.rpc("my_quotes");
    const product = new Map((quotes ?? []).map((q) => [q.id, q.product]));
    for (const a of mine) {
      items.push({
        id: `acc:${a.id}`,
        kind: "accepted",
        product: product.get(a.id) ?? "",
        to: "/supplier/rfqs",
        at: Date.parse(a.updated_at) || 0,
      });
    }
  }

  // Decision on the user's own supplier application
  const { data: apps } = await supabase
    .from("supplier_applications")
    .select("id, company_name, status")
    .eq("user_id", uid);
  for (const s of apps ?? []) {
    if (s.status === "approved" || s.status === "rejected") {
      items.push({
        id: `sa:${s.id}:${s.status}`,
        kind: s.status === "approved" ? "approved" : "rejected",
        company: s.company_name ?? "",
        to: s.status === "approved" ? "/supplier/rfqs" : "/dashboard",
        at: Number.MAX_SAFE_INTEGER - 1,
      });
    }
  }

  return items.sort((a, b) => b.at - a.at).slice(0, 30);
}

export function NotificationBell() {
  const { t } = useI18n();
  const label = (i: Item) =>
    i.kind === "quote"
      ? fmt(t("nt.quote"), { product: i.product ?? "", company: i.company || t("nt.aFactory") })
      : i.kind === "accepted"
        ? fmt(t("nt.accepted"), { product: i.product || t("nt.anRfq") })
        : fmt(t(i.kind === "approved" ? "nt.approved" : "nt.rejected"), { company: i.company ?? "" });
  const [uid, setUid] = useState<string | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUid(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUid(s?.user.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const { data: items } = useQuery({
    queryKey: ["notifications", uid],
    enabled: !!uid,
    refetchInterval: 60_000,
    queryFn: () => loadItems(uid as string),
  });

  // First run on this browser: treat everything that already exists as seen.
  useEffect(() => {
    if (!uid || !items) return;
    const stored = readSeen(uid);
    if (stored === null) {
      const all = new Set(items.map((i) => i.id));
      writeSeen(uid, all);
      setSeen(all);
    } else {
      setSeen(stored);
    }
  }, [uid, items]);

  const markAllSeen = useCallback(() => {
    if (!uid || !items) return;
    const all = new Set([...seen, ...items.map((i) => i.id)]);
    writeSeen(uid, all);
    setSeen(all);
  }, [uid, items, seen]);

  if (!uid) return null;
  const unread = (items ?? []).filter((i) => !seen.has(i.id));

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) markAllSeen();
      }}
    >
      <PopoverTrigger asChild>
        <button className="relative grid h-9 w-9 place-items-center rounded-md hover:bg-muted" aria-label={t("nt.title")}>
          <Bell className="h-5 w-5" />
          {unread.length > 0 && (
            <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3 text-sm font-semibold">{t("nt.title")}</div>
        {!items?.length ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t("nt.empty")}</p>
        ) : (
          <ul className="max-h-80 divide-y overflow-y-auto">
            {items.map((i) => (
              <li key={i.id}>
                <Link
                  to={i.to}
                  onClick={() => setOpen(false)}
                  className="flex gap-2 px-4 py-3 text-sm hover:bg-muted"
                >
                  {!seen.has(i.id) && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  <span>{label(i)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
