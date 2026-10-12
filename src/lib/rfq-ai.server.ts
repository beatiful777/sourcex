import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output, APICallError, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { CATEGORIES, COUNTRIES } from "@/lib/catalog";

const MODEL = "openai/gpt-6-astra";

export const rfqDraftSchema = z.object({
  product: z.string(),
  category: z.string(),
  country: z.string(),
  quantity: z.string(),
  details: z.string(),
});
export type RfqDraft = z.infer<typeof rfqDraftSchema>;

export async function draftRfqFromNeeds(needs: string): Promise<RfqDraft> {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) throw new Error("AI drafting is not configured.");
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });

  const categories = CATEGORIES.map((c) => c.name).join(", ");
  const countries = COUNTRIES.map((c) => c.name).join(", ");
  const system = `You turn a buyer's free-form sourcing needs into a clear, structured RFQ (request for quotation) that suppliers can quote on.
Rules:
- product: concise product title with key spec (max ~100 characters).
- category: exactly one of: ${categories}. Pick the closest.
- country: one of: ${countries} if the buyer named or clearly implied a preferred sourcing country, otherwise an empty string.
- quantity: order quantity with units (e.g. "5,000 pcs"). If not stated, write "To be confirmed".
- details: a supplier-ready brief under 1,500 characters using short labelled lines: Specifications, Materials, Certifications/compliance, Packaging & labelling, Target price, Delivery timeline & destination, Samples, Questions for suppliers. Only include facts the buyer gave; mark missing but important items as "Please advise". Plain text, no markdown symbols.
Write in English.`;

  try {
    const result = streamText({
      model: provider.responses(MODEL),
      system,
      prompt: needs,
      output: Output.object({ schema: rfqDraftSchema }),
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    const out = await result.output;
    return normalize(out);
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error) && error.text) {
      try {
        return normalize(rfqDraftSchema.parse(JSON.parse(error.text)));
      } catch {
        /* fall through */
      }
    }
    if (APICallError.isInstance(error)) {
      const s = error.statusCode;
      if (s === 429) throw new Error("Too many requests right now. Please try again in a minute.");
      if (s === 402) throw new Error("AI credits are used up for this workspace. Please add credits to continue.");
      if (s === 403) throw new Error("AI drafting is not available for this workspace right now.");
    }
    console.error("RFQ draft failed", error);
    throw new Error("Couldn't draft the RFQ. Please try again or fill the form manually.");
  }
}

function normalize(d: RfqDraft): RfqDraft {
  const cat = CATEGORIES.find((c) => c.name.toLowerCase() === d.category.trim().toLowerCase());
  const ctry = COUNTRIES.find((c) => c.name.toLowerCase() === d.country.trim().toLowerCase());
  return {
    product: d.product.trim().slice(0, 150),
    category: cat?.name ?? "",
    country: ctry?.name ?? "",
    quantity: d.quantity.trim().slice(0, 60),
    details: d.details.trim().slice(0, 2000),
  };
}
