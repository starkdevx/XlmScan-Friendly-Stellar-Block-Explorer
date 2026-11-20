import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  getCachedAccountBalances,
  getKnownAddressLabel,
  saveCachedAccountBalances,
} from "@/lib/cache/cache";
import {
  fetchAccountBalances,
  fetchAccountTransfers,
} from "@/lib/stellar/data-source";
import { formatAmount, shortenAddress, sumDecimalStrings } from "@/lib/stellar/utils/format";
import { isValidAccountAddress, normalizeNetwork } from "@/lib/stellar/validation";

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rate = await checkRateLimit(`account:${ip}`);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again shortly." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address")?.trim() ?? "";
  const network = normalizeNetwork(searchParams.get("network"));

  if (!isValidAccountAddress(address)) {
    return NextResponse.json(
      { error: "Invalid Stellar account address. Expected a 56-character G... address." },
      { status: 400 }
    );
  }

  try {
    let balancesResult = await getCachedAccountBalances(network, address);
    let balanceCached = Boolean(balancesResult);

    if (!balancesResult) {
      balancesResult = await fetchAccountBalances(network, address);
      await saveCachedAccountBalances(balancesResult);
      balanceCached = false;
    }

    const label = await getKnownAddressLabel(network, address);
    const transfersResult = await fetchAccountTransfers(network, address, {
      limit: 20,
      maxPages: 1,
    });

    // Build a deterministic plain-English account summary
    const topBalances = balancesResult.balances
      .slice(0, 3)
      .map((b) => `${formatAmount(b.balance)} ${b.asset.code}`);

    const sevenDaysAgo = Date.now() - 7 * 86_400_000;
    const recentTransfers = transfersResult.transfers.filter(
      (t) => t.successful && new Date(t.timestamp).getTime() >= sevenDaysAgo
    );

    const xlmIn = sumDecimalStrings(
      recentTransfers
        .filter((t) => t.direction === "incoming" && t.asset.code === "XLM")
        .map((t) => t.amount)
    );
    const xlmOut = sumDecimalStrings(
      recentTransfers
        .filter((t) => t.direction === "outgoing" && t.asset.code === "XLM")
        .map((t) => t.amount)
    );

    const balanceText =
      topBalances.length > 0
        ? `This wallet currently holds ${topBalances.join(", ")}.`
        : "This wallet has no active asset balances.";

    const activityText =
      recentTransfers.length > 0
        ? ` In the recent transfer window, it recorded ${recentTransfers.length} transfer(s)${xlmIn !== "0" ? `, including ${formatAmount(xlmIn)} XLM received` : ""}${xlmOut !== "0" ? ` and ${formatAmount(xlmOut)} XLM sent` : ""}.`
        : " No recent transfer activity was found in the fetched window.";

    return NextResponse.json({
      network,
      address,
      label: label ?? balancesResult.label,
      summary: `${balanceText}${activityText}`,
      shortAddress: shortenAddress(address),
      balances: balancesResult.balances,
      asOfLedger: balancesResult.asOfLedger,
      balanceCoverage: balancesResult.coverage,
      balanceCached,
      transfers: transfersResult.transfers,
      transferCoverage: transfersResult.coverage,
      isPartialTransfers: transfersResult.isPartial,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch account data";
    const isNotFound = message.includes("404");
    return NextResponse.json(
      {
        error: isNotFound
          ? "Account not found on this Stellar network (it may not be funded yet)."
          : message,
      },
      { status: isNotFound ? 404 : 502 }
    );
  }
}
