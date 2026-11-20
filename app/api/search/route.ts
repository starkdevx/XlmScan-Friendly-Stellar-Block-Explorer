import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/cache/cache";
import { classifyInput, normalizeNetwork } from "@/lib/stellar/validation";

const SearchRequestSchema = z.object({
  input: z.string().min(1).max(500),
  network: z.enum(["mainnet", "testnet"]).optional(),
});

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rate = await checkRateLimit(`search:${ip}`);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again shortly." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = SearchRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid search input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const network = normalizeNetwork(parsed.data.network);
    const classification = classifyInput(parsed.data.input);

    if (classification.type === "account") {
      return NextResponse.json({
        type: "account",
        redirectTo: `/account/${classification.address}?network=${network}`,
        address: classification.address,
        network,
      });
    }

    if (classification.type === "transaction") {
      return NextResponse.json({
        type: "transaction",
        redirectTo: `/transaction/${classification.hash}?network=${network}`,
        hash: classification.hash,
        network,
      });
    }

    if (classification.type === "contract") {
      return NextResponse.json({
        type: "contract",
        contractId: classification.contractId,
        network,
        message:
          "Soroban contract IDs are recognized. Full contract state inspection is planned for v0.1; you can ask about recent events for this contract.",
      });
    }

    return NextResponse.json({
      type: "natural_language",
      query: classification.query,
      network,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to process search input",
      },
      { status: 500 }
    );
  }
}
