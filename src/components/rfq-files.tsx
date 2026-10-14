import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Files attached to an RFQ by the buyer.
// Used on the supplier RFQ Desk: <RfqFiles rfqId={r.id} />
export function RfqFiles({ rfqId }: { rfqId: string }) {
  const { data } = useQuery({
    queryKey: ["rfq-files", rfqId],
    // The bucket is private: links are temporary (10 minutes), so refetch before they could expire.
    staleTime: 4 * 60 * 1000,
    gcTime: 4 * 60 * 1000,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("rfq_attachments")
        .select("id, file_name, storage_path, size_bytes")
        .eq("rfq_id", rfqId)
        .order("created_at");
      if (error) throw error;
      if (!rows?.length) return [];
      const { data: signed } = await supabase.storage
        .from("rfq-files")
        .createSignedUrls(rows.map((r) => r.storage_path), 600);
      return rows.map((r) => ({ ...r, url: signed?.find((x) => x.path === r.storage_path)?.signedUrl ?? null }));
    },
  });

  if (!data?.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <p className="w-full text-xs font-medium text-muted-foreground">Attached files:</p>
      {data.map((a) => {
        const kb = Math.max(1, Math.round((a.size_bytes ?? 0) / 1024));
        const label = `📎 ${a.file_name} (${kb} KB)`;
        return a.url ? (
          <a
            key={a.id}
            href={a.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border px-2.5 py-1 text-xs transition-colors hover:bg-muted"
            title={`Open ${a.file_name}`}
          >
            {label}
          </a>
        ) : (
          <span key={a.id} className="rounded-md border px-2.5 py-1 text-xs text-muted-foreground">{label}</span>
        );
      })}
    </div>
  );
}
