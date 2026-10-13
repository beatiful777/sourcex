import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Message = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  message: string;
  handled: boolean;
};

export function AdminMessages() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["contact-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("id, created_at, name, email, message, handled")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Message[];
    },
  });

  async function toggle(m: Message) {
    const { error } = await supabase.from("contact_messages").update({ handled: !m.handled }).eq("id", m.id);
    if (error) {
      toast.error("Couldn't update the message");
      return;
    }
    await qc.invalidateQueries({ queryKey: ["contact-messages"] });
  }

  const rows = data ?? [];
  const open = rows.filter((r) => !r.handled).length;

  return (
    <section className="mt-14">
      <h2 className="text-xl font-semibold">Contact messages</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Messages sent from the Contact page. {rows.length > 0 ? `${open} not handled yet.` : ""}
      </p>
      <div className="mt-6 grid gap-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : error ? (
          <p className="text-sm text-muted-foreground">Couldn't load messages.</p>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No messages yet.
          </div>
        ) : (
          rows.map((m) => (
            <div key={m.id} className="rounded-xl border">
              <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">
                    {m.name}{" "}
                    <span className="rounded-full border px-2 py-0.5 text-xs">{m.handled ? "handled" : "new"}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <a className="underline" href={`mailto:${m.email}`}>{m.email}</a> ·{" "}
                    {new Date(m.created_at).toLocaleString()}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => toggle(m)}>
                  {m.handled ? "Mark as new" : "Mark as handled"}
                </Button>
              </div>
              <p className="whitespace-pre-line bg-muted/30 p-4 text-sm">{m.message}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
