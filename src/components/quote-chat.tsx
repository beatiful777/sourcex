import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { sb, useMyId } from "@/lib/sb";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Msg = { id: string; sender_id: string; body: string; created_at: string };

export function QuoteChat({ applicationId, other }: { applicationId: string; other: string }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const me = useMyId();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const key = ["quote-msgs", applicationId];
  const msgs = useQuery({
    queryKey: key,
    refetchInterval: 8000,
    queryFn: async () => {
      const { data, error } = await sb.from("quote_messages").select("id, sender_id, body, created_at").eq("application_id", applicationId).order("created_at", { ascending: true }).limit(300);
      if (error) throw error;
      return data as Msg[];
    },
  });
  const send = useMutation({
    mutationFn: async (body: string) => {
      const { error } = await sb.from("quote_messages").insert({ application_id: applicationId, body });
      if (error) throw error;
    },
    onSuccess: () => { setText(""); qc.invalidateQueries({ queryKey: key }); },
    onError: () => toast.error(t("ch.fail")),
  });
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [msgs.data?.length]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (body && !send.isPending) send.mutate(body);
  };
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {msgs.data?.length === 0 && <p className="text-xs text-muted-foreground">{t("ch.empty")}</p>}
        {msgs.data?.map((m) => {
          const mine = m.sender_id === me.data;
          return (
            <div key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
              <div className={cn("max-w-[85%] whitespace-pre-wrap break-words rounded-lg px-3 py-1.5 text-sm", mine ? "bg-primary text-primary-foreground" : "bg-muted")}>{m.body}</div>
              <span className="mt-0.5 text-[10px] text-muted-foreground">{mine ? t("ch.you") : other} · {new Date(m.created_at).toLocaleString()}</span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder={t("ch.ph")} className="h-9 flex-1 rounded-md border bg-background px-3 text-sm outline-none" />
        <Button type="submit" size="sm" className="h-9" disabled={send.isPending || !text.trim()}>{t("ch.send")}</Button>
      </form>
      <p className="mt-2 text-[10px] text-muted-foreground">{t("ch.privacy")}</p>
    </div>
  );
}

export function QuoteChatToggle({ applicationId, other }: { applicationId: string; other: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <Button size="sm" variant="outline" className="h-8" onClick={() => setOpen(!open)}>
        <MessageSquare className="mr-1 h-3 w-3" />{open ? t("ch.hide") : t("ch.btn")}
      </Button>
      {open && <QuoteChat applicationId={applicationId} other={other} />}
    </div>
  );
}
