import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  getCachedTransaction,
  saveCachedTransaction,
} from "@/lib/cache/cache";
import { fetchTransaction } from "@/lib/stellar/data-source";
import { humanizeTransaction } from "@/lib/stellar/humanizer";
import { isValidTxHash, normalizeNetwork } from "@/lib/stellar/validation";

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rate = await checkRateLimit(`transaction:${ip}`);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again shortly." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const hash = searchParams.get("hash")?.trim().toLowerCase() ?? "";
  const network = normalizeNetwork(searchParams.get("network"));

  if (!isValidTxHash(hash)) {
    return NextResponse.json(
      {
        error:
          "Invalid transaction hash. Expected a 64-character hexadecimal string.",
      },
      { status: 400 }
    );
  }

  try {
    const cached = await getCachedTransaction(network, hash);
    if (cached) {
      return NextResponse.json({
        ...cached,
        cached: true,
      });
    }

    const { transaction, providerHealth } = await fetchTransaction(network, hash);

    if (!transaction) {
      return NextResponse.json(
        {
          error: "Transaction not found in available provider history.",
          hash,
          network,
          coverage: {
            provider: providerHealth?.provider ?? "horizon_public",
            method: "getTransaction",
            oldestLedger: providerHealth?.oldestLedger,
            latestLedger: providerHealth?.latestLedger,
            ledgerRetentionWindow: providerHealth?.ledgerRetentionWindow,
            note: "Not found within the provider's current retention window. Older transactions may require another data source.",
          },
        },
        { status: 404 }
      );
    }

    const humanized = humanizeTransaction(transaction);
    await saveCachedTransaction(transaction, humanized);

    return NextResponse.json({
      transaction,
      humanized,
      cached: false,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to retrieve transaction details",
      },
      { status: 502 }
    );
  }
}
