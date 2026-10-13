// Server-only: transactional email through Resend's HTTP API.
// Secrets (Lovable Cloud -> Secrets): RESEND_API_KEY (required to send), RESEND_FROM (optional, a sender on a
// domain verified in Resend; the default sandbox sender only delivers to your own Resend account email),
// SITE_URL (optional, used for links; defaults to the request origin).

export type SendResult = { sent: boolean; reason?: string };
type Mail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  idempotencyKey?: string;
};

export function esc(v: unknown): string {
  return String(v ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

export async function sendEmail(mail: Mail): Promise<SendResult> {
  const key = process.env["RESEND_API_KEY"];
  if (!key) {
    console.warn("[email] RESEND_API_KEY is not set; skipping email to", mail.to);
    return { sent: false, reason: "not_configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(mail.idempotencyKey ? { "Idempotency-Key": mail.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from: process.env["RESEND_FROM"] || "SOURCEX <onboarding@resend.dev>",
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      console.error("[email] Resend error", res.status, await res.text());
      return { sent: false, reason: `resend_${res.status}` };
    }
    return { sent: true };
  } catch (e) {
    console.error("[email] send failed", e);
    return { sent: false, reason: "network" };
  }
}

function layout(title: string, body: string, cta?: { label: string; url: string }) {
  return `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;color:#0f172a"><div style="max-width:560px;margin:0 auto;padding:32px 20px"><p style="font-weight:600;margin:0 0 20px">SOURCEX</p><div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:28px"><h1 style="font-size:20px;margin:0 0 16px">${esc(title)}</h1>${body}${cta ? `<p style="margin:24px 0 0"><a href="${esc(cta.url)}" style="background:#2563eb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;display:inline-block">${esc(cta.label)}</a></p>` : ""}</div><p style="font-size:12px;color:#64748b;margin:16px 0 0">You receive this because of activity on your SOURCEX account.</p></div></body></html>`;
}
const row = (k: string, v: string) =>
  `<tr><td style="padding:4px 12px 4px 0;color:#64748b;font-size:14px">${esc(k)}</td><td style="padding:4px 0;font-size:14px">${esc(v)}</td></tr>`;
const p = (t: string) => `<p style="font-size:14px;line-height:1.6;margin:0">${t}</p>`;

export type Deal = {
  product: string;
  quantity: string;
  company: string;
  unitPrice: string | null;
  leadTime: string | null;
  minOrder: string | null;
  rfqId: string;
};
const table = (d: Deal) =>
  `<table style="border-collapse:collapse;margin:16px 0">${row("Product", d.product)}${row("Quantity", d.quantity)}${row("Supplier", d.company)}${row("Unit price", d.unitPrice || "On request")}${row("Lead time", d.leadTime || "Not given")}${row("Min. order", d.minOrder || "Not given")}${row("RFQ", `#${d.rfqId.slice(0, 8)}`)}</table>`;

export function supplierApprovedMail(a: { company: string; siteUrl: string }) {
  const url = `${a.siteUrl}/supplier/rfqs`;
  return {
    subject: `${a.company} is approved on SOURCEX`,
    html: layout(
      "Your factory is approved",
      p(
        `Good news: <b>${esc(a.company)}</b> passed verification. Your profile is now public and you can quote on open buyer RFQs in your categories.`,
      ),
      { label: "Open the RFQ Desk", url },
    ),
    text: `${a.company} is approved on SOURCEX. Quote on open RFQs: ${url}`,
  };
}
export function newQuoteBuyerMail(d: Deal & { siteUrl: string }) {
  return {
    subject: `New quote for "${d.product}" from ${d.company}`,
    html: layout(
      "You received a new quote",
      p(`<b>${esc(d.company)}</b> answered your request.`) + table(d),
      { label: "Compare quotes", url: `${d.siteUrl}/dashboard` },
    ),
    text: `${d.company} quoted ${d.unitPrice ?? "on request"} for "${d.product}". Compare quotes: ${d.siteUrl}/dashboard`,
  };
}
export function quoteAcceptedSupplierMail(d: Deal & { buyerEmail: string; siteUrl: string }) {
  return {
    subject: `Your quote was accepted — ${d.product}`,
    html: layout(
      "A buyer accepted your quote",
      p(
        `The buyer selected your quote. Reply to this email to reach them (<b>${esc(d.buyerEmail)}</b>) and agree on samples, contract and payment.`,
      ) + table(d),
      { label: "Open the RFQ Desk", url: `${d.siteUrl}/supplier/rfqs` },
    ),
    text: `A buyer accepted your quote for ${d.product} (${d.quantity}). Contact: ${d.buyerEmail}`,
  };
}
export function quoteAcceptedBuyerMail(d: Deal & { supplierEmail: string; siteUrl: string }) {
  return {
    subject: `You accepted a quote — ${d.product}`,
    html: layout(
      "Quote accepted",
      p(
        `You selected <b>${esc(d.company)}</b>. They have been notified. Next step: contact them at <b>${esc(d.supplierEmail)}</b> to confirm samples and terms.`,
      ) + table(d),
      { label: "Open my dashboard", url: `${d.siteUrl}/dashboard` },
    ),
    text: `You accepted ${d.company}'s quote for ${d.product}. Contact: ${d.supplierEmail}`,
  };
}
