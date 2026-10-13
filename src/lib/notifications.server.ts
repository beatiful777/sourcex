// Server-only. Each notification is sent at most once (notification_log UNIQUE(kind, ref_id, recipient)).
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Tables } from "@/integrations/supabase/types";
import {
  quoteAcceptedBuyerMail,
  quoteAcceptedSupplierMail,
  newQuoteBuyerMail,
  sendEmail,
  supplierApprovedMail,
  type Deal,
} from "./email.server";

export type EmailOutcome = "sent" | "already_sent" | "not_configured" | "failed";

async function sendOnce(
  kind: string,
  refId: string,
  recipient: string,
  build: () => Parameters<typeof sendEmail>[0],
): Promise<EmailOutcome> {
  const claim = await supabaseAdmin
    .from("notification_log")
    .insert({ kind, ref_id: refId, recipient });
  if (claim.error) {
    if (claim.error.code === "23505") return "already_sent";
    console.error("[notify] could not record notification", claim.error.message);
    return "failed";
  }
  const result = await sendEmail({ ...build(), idempotencyKey: `${kind}/${refId}/${recipient}` });
  if (!result.sent) {
    // Release the claim so a later attempt (for example after the key is added) can still send.
    await supabaseAdmin
      .from("notification_log")
      .delete()
      .eq("kind", kind)
      .eq("ref_id", refId)
      .eq("recipient", recipient);
    return result.reason === "not_configured" ? "not_configured" : "failed";
  }
  return "sent";
}

const deal = (q: Tables<"rfq_applications">, r: Tables<"rfqs">): Deal => ({
  product: r.product,
  quantity: r.quantity,
  company: q.company_name,
  unitPrice: q.unit_price,
  leadTime: q.lead_time,
  minOrder: q.min_order,
  rfqId: r.id,
});

export async function notifySupplierApproved(
  applicationId: string,
  siteUrl: string,
): Promise<EmailOutcome> {
  const { data: s } = await supabaseAdmin
    .from("supplier_applications")
    .select("company_name, business_email, status")
    .eq("id", applicationId)
    .maybeSingle();
  if (!s || s.status !== "approved") return "failed";
  return sendOnce("supplier_approved", applicationId, s.business_email, () => ({
    to: s.business_email,
    ...supplierApprovedMail({ company: s.company_name, siteUrl }),
  }));
}

export async function notifyNewQuote(quoteId: string, siteUrl: string): Promise<EmailOutcome> {
  const { data: q } = await supabaseAdmin
    .from("rfq_applications")
    .select("*")
    .eq("id", quoteId)
    .maybeSingle();
  if (!q) return "failed";
  const { data: r } = await supabaseAdmin.from("rfqs").select("*").eq("id", q.rfq_id).maybeSingle();
  if (!r) return "failed";
  return sendOnce("new_quote", q.id, r.email, () => ({
    to: r.email,
    replyTo: q.supplier_email,
    ...newQuoteBuyerMail({ ...deal(q, r), siteUrl }),
  }));
}

export async function notifyQuoteAccepted(
  q: Tables<"rfq_applications">,
  r: Tables<"rfqs">,
  siteUrl: string,
): Promise<EmailOutcome> {
  const d = deal(q, r);
  const outcomes = [
    await sendOnce("quote_accepted_supplier", q.id, q.supplier_email, () => ({
      to: q.supplier_email,
      replyTo: r.email,
      ...quoteAcceptedSupplierMail({ ...d, buyerEmail: r.email, siteUrl }),
    })),
    await sendOnce("quote_accepted_buyer", q.id, r.email, () => ({
      to: r.email,
      replyTo: q.supplier_email,
      ...quoteAcceptedBuyerMail({ ...d, supplierEmail: q.supplier_email, siteUrl }),
    })),
  ];
  if (outcomes.includes("failed")) return "failed";
  if (outcomes.includes("not_configured")) return "not_configured";
  return outcomes.includes("sent") ? "sent" : "already_sent";
}
