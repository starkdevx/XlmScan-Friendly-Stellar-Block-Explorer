import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseNaturalLanguageIntent } from "@/lib/ai/intent-parser";
import { executeNaturalLanguageQuery } from "@/lib/ai/query-executor";
import { checkRateLimit } from "@/lib/cache/cache";
import { normalizeNetwork } from "@/lib/stellar/validation";

const QueryRequestSchema = z.object({
  question: z.string().min(2).max(500),
  network: z.enum(["mainnet", "testnet"]).optional(),
  context: z
    .object({
      address: z.string().optional(),
      txHash: z.string().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rate = await checkRateLimit(`query:${ip}`);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again shortly." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = QueryRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const network = normalizeNetwork(parsed.data.network);
    const intent = await parseNaturalLanguageIntent(
      parsed.data.question,
      parsed.data.context
    );

    const result = await executeNaturalLanguageQuery(
      parsed.data.question,
      network,
      intent
    );

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to execute natural-language query",
      },
      { status: 500 }
    );
  }
}
