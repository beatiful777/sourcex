import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Files attached to an RFQ by the buyer.
// Used on the supplier RFQ Desk: <RfqFiles rfqId={r.id} />
export function RfqFiles({ rfqId }: { rfqId: string }) {
  const { data } = useQuery({
    queryKey: ["rfq-files", rfqId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rfq_attachments")
        .select("id, file_name, storage_path, size_bytes")
        .eq("rfq_id", rfqId)
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!data?.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <p className="w-full text-xs font-medium text-muted-foreground">Attached files:</p>
      {data.map((a) => {
        const url = supabase.storage.from("rfq-files").getPublicUrl(a.storage_path).data.publicUrl;
        const kb = Math.max(1, Math.round((a.size_bytes ?? 0) / 1024));
        return (
          <a
            key={a.id}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border px-2.5 py-1 text-xs transition-colors hover:bg-muted"
            title={`Open ${a.file_name}`}
          >
            📎 {a.file_name} ({kb} KB)
          </a>
        );
      })}
    </div>
  );
}
