import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type BuyerRow = { id: string; company_name: string; country: string | null; product: string; quantity: number; message: string | null; supplier_note: string | null; status: string; created_at: string };
type FactoryRow = Omit<BuyerRow, "company_name" | "country">;

const badge = "rounded-full border px-2 py-0.5 text-xs capitalize";

async function setStatus(id: string, status: string, note?: string) {
  const { error } = await supabase.rpc("set_sample_status", { _id: id, _status: status, _note: note ?? "" });
  if (error) { toast.error("Couldn't update", { description: error.message }); return false; }
  return true;
}

/** Buyer's own sample requests. */
export function BuyerSamples() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-samples"],
    queryFn: async () => { const { data, error } = await supabase.rpc("my_sample_requests"); if (error) throw error; return (data ?? []) as BuyerRow[]; },
  });
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!data?.length) return <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No sample requests yet. Open a factory in the directory and choose “Request a sample”.</div>;
  return (
    <div className="grid gap-4">
      {data.map((s) => (
        <div key={s.id} className="rounded-xl border p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-medium">{s.product} <span className="text-muted-foreground">× {s.quantity}</span></p>
              <p className="text-xs text-muted-foreground">{s.company_name}{s.country ? ` · ${s.country}` : ""} · {new Date(s.created_at).toLocaleDateString()}</p>
              {s.message && <p className="mt-2 whitespace-pre-line text-sm">{s.message}</p>}
              {s.supplier_note && <p className="mt-2 text-sm"><b>Factory note:</b> {s.supplier_note}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className={badge}>{s.status}</span>
              {(s.status === "requested" || s.status === "accepted") && (
                <Button size="sm" variant="outline" onClick={async () => { if (await setStatus(s.id, "cancelled")) qc.invalidateQueries({ queryKey: ["my-samples"] }); }}>Cancel</Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Sample requests addressed to the signed-in factory. No buyer identity is returned by the database. */
export function FactorySamples() {
  const qc = useQueryClient();
  const [note, setNote] = useState<Record<string, string>>({});
  const { data, isLoading } = useQuery({
    queryKey: ["factory-samples"],
    queryFn: async () => { const { data, error } = await supabase.rpc("factory_sample_requests"); if (error) throw error; return (data ?? []) as FactoryRow[]; },
  });
  async function act(id: string, status: string) {
    if (await setStatus(id, status, note[id])) qc.invalidateQueries({ queryKey: ["factory-samples"] });
  }
  return (
    <section className="mt-12">
      <h2 className="mb-4 text-lg font-semibold">Sample requests</h2>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : !data?.length ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No sample requests for your factory yet.</div>
      ) : (
        <div className="grid gap-4">
          {data.map((s) => (
            <div key={s.id} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{s.product} <span className="text-muted-foreground">× {s.quantity}</span></p>
                  <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</p>
                  {s.message && <p className="mt-2 whitespace-pre-line text-sm">{s.message}</p>}
                  {s.supplier_note && <p className="mt-2 text-sm"><b>Your note:</b> {s.supplier_note}</p>}
                </div>
                <span className={badge}>{s.status}</span>
              </div>
              {(s.status === "requested" || s.status === "accepted") && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
                  <Input className="max-w-xs" placeholder="Note to buyer (optional)" maxLength={1000} value={note[s.id] ?? ""} onChange={(e) => setNote({ ...note, [s.id]: e.target.value })} />
                  {s.status === "requested" && <><Button size="sm" onClick={() => act(s.id, "accepted")}>Accept</Button><Button size="sm" variant="outline" onClick={() => act(s.id, "declined")}>Decline</Button></>}
                  {s.status === "accepted" && <Button size="sm" onClick={() => act(s.id, "shipped")}>Mark shipped</Button>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
