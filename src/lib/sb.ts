import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// The tables added later (favorites, chat, reviews) are not in the generated types yet,
// so they are reached through this untyped handle. Everything else keeps using `supabase`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sb = supabase as any;

/** Id of the signed-in user, or null for a visitor. */
export function useMyId() {
  return useQuery({
    queryKey: ["my-id"],
    staleTime: 60_000,
    queryFn: async () => (await supabase.auth.getSession()).data.session?.user.id ?? null,
  });
}
