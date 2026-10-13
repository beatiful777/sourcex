import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const draftRfq = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ needs: z.string().trim().min(15).max(4000) }).parse(d))
  .handler(async ({ data }) => {
    const { draftRfqFromNeeds } = await import("./rfq-ai.server");
    try {
      return { ok: true as const, draft: await draftRfqFromNeeds(data.needs) };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Something went wrong." };
    }
  });
