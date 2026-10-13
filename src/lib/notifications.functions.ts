import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type EmailStatus = "sent" | "already_sent" | "not_configured" | "failed" | "skipped";

async function siteUrl() {
  const fromEnv = process.env["SITE_URL"];
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const { getRequest } = await import("@tanstack/react-start/server");
  return new URL(getRequest().url).origin;
}

/** Admin approves / rejects a factory. The update runs under the caller's own login, so the database policy still requires the admin role. */
export const decideApplicationFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["approved", "rejected"]) }).parse(input),
  )
  .handler(async ({ data, context }): Promise<{ email: EmailStatus }> => {
    const { data: rows, error } = await context.supabase
      .from("supplier_applications")
      .update({ status: data.status })
      .eq("id", data.id)
      .select("id");
    if (error) throw new Error(error.message);
    if (!rows?.length) throw new Error("Not allowed, or the application no longer exists.");
    if (data.status !== "approved") return { email: "skipped" };
    const { notifySupplierApproved } = await import("./notifications.server");
    return { email: await notifySupplierApproved(data.id, await siteUrl()) };
  });

/** Factory sends or edits a quote (the database function checks approval, category, open RFQ), then the buyer is emailed once. */
export const submitQuoteFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        rfqId: z.string().uuid(),
        unitPrice: z.string().trim().max(60),
        leadTime: z.string().trim().max(60),
        minOrder: z.string().trim().max(60),
        message: z.string().trim().min(1).max(2000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<{ email: EmailStatus }> => {
    const { data: quoteId, error } = await context.supabase.rpc("submit_quote", {
      _rfq: data.rfqId,
      _unit_price: data.unitPrice,
      _lead_time: data.leadTime,
      _min_order: data.minOrder,
      _message: data.message,
    });
    if (error) throw new Error(error.message);
    const { notifyNewQuote } = await import("./notifications.server");
    return { email: await notifyNewQuote(quoteId, await siteUrl()) };
  });

/** Buyer accepts / un-accepts a quote; on accept both sides get an email (once per quote). */
export const acceptQuoteFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ quoteId: z.string().uuid(), accepted: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }): Promise<{ email: EmailStatus }> => {
    const { error } = await context.supabase.rpc("accept_quote", {
      _quote: data.quoteId,
      _accepted: data.accepted,
    });
    if (error) throw new Error(error.message);
    if (!data.accepted) return { email: "skipped" };
    // Read back through RLS: only the buyer who owns the RFQ can see these rows.
    const { data: q } = await context.supabase
      .from("rfq_applications")
      .select("*")
      .eq("id", data.quoteId)
      .maybeSingle();
    if (!q || q.status !== "accepted") return { email: "skipped" };
    const { data: r } = await context.supabase
      .from("rfqs")
      .select("*")
      .eq("id", q.rfq_id)
      .maybeSingle();
    if (!r) return { email: "skipped" };
    const { notifyQuoteAccepted } = await import("./notifications.server");
    return { email: await notifyQuoteAccepted(q, r, await siteUrl()) };
  });
