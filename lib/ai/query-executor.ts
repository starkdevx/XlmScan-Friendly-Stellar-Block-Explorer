import {
  getCachedQueryResult,
  saveCachedQueryResult,
} from "../cache/cache";
import {
  fetchAccountBalances,
  fetchAccountTransfers,
  fetchContractEvents,
  fetchTransaction,
} from "../stellar/data-source";
import { humanizeTransaction } from "../stellar/humanizer";
import {
  formatAmount,
  formatDateShort,
  shortenAddress,
  sumDecimalStrings,
} from "../stellar/utils/format";
import type { StellarNetwork } from "../stellar/validation";
import type { NaturalLanguageQueryResult, ParsedIntent } from "./schemas";

export function buildQueryCacheKey(
  network: StellarNetwork,
  intent: ParsedIntent
): string {
  const parts = [
    network,
    intent.intent,
    intent.address ?? "",
    intent.txHash ?? "",
    intent.contractId ?? "",
    intent.direction,
    intent.asset?.code?.toUpperCase() ?? "ALL",
    intent.time_range?.from ?? "",
    intent.time_range?.to ?? "",
    intent.aggregation,
    String(intent.limit ?? 20),
  ];
  return parts.join("|");
}

export async function executeNaturalLanguageQuery(
  question: string,
  network: StellarNetwork,
  intent: ParsedIntent
): Promise<NaturalLanguageQueryResult> {
  if (intent.intent === "ambiguous") {
    return {
      question,
      network,
      parsedIntent: intent,
      headline: "More context needed",
      subheadline: "Could not identify a wallet or transaction",
      answer:
        intent.clarification_needed ??
        "Please include a Stellar wallet address (G...) or transaction hash so I can look up the on-chain data.",
      needsClarification: true,
      clarificationMessage: intent.clarification_needed,
      evidence: {},
      coverage: {
        provider: "cache",
        method: "intent_parser",
      },
      cached: false,
    };
  }

  const cacheKey = buildQueryCacheKey(network, intent);
  const cached = await getCachedQueryResult<NaturalLanguageQueryResult>(cacheKey);
  if (cached) {
    return { ...cached, question, cached: true };
  }

  if (intent.intent === "transaction_details" && intent.txHash) {
    const { transaction, providerHealth } = await fetchTransaction(
      network,
      intent.txHash
    );
    if (!transaction) {
      return {
        question,
        network,
        parsedIntent: intent,
        headline: "Transaction not found in available history",
        subheadline: `Hash ${shortenAddress(intent.txHash, 6)}`,
        answer:
          "This transaction was not found within the current provider's ledger retention window. It may be older than the supported history range or on a different Stellar network.",
        evidence: { transactionHash: intent.txHash },
        coverage: {
          provider: providerHealth?.provider ?? "horizon_public",
          method: "getTransaction",
          oldestLedger: providerHealth?.oldestLedger,
          latestLedger: providerHealth?.latestLedger,
          ledgerRetentionWindow: providerHealth?.ledgerRetentionWindow,
        },
        cached: false,
      };
    }

    const humanized = humanizeTransaction(transaction);
    const result: NaturalLanguageQueryResult = {
      question,
      network,
      parsedIntent: intent,
      headline: humanized.statusLabel,
      subheadline: humanized.ledgerDescription,
      answer: humanized.summary,
      evidence: { transactionHash: transaction.hash },
      coverage: transaction.coverage,
      cached: false,
    };
    await saveCachedQueryResult(cacheKey, network, intent.intent, result);
    return result;
  }

  if (intent.intent === "account_balances" && intent.address) {
    const balResult = await fetchAccountBalances(network, intent.address);
    const filtered = intent.asset?.code
      ? balResult.balances.filter(
          (b) => b.asset.code.toUpperCase() === intent.asset!.code.toUpperCase()
        )
      : balResult.balances;

    const summaryParts = filtered.map(
      (b) => `${formatAmount(b.balance)} ${b.asset.code}`
    );

    const headline =
      summaryParts.length > 0 ? summaryParts.slice(0, 2).join(" · ") : "0 balances";
    const answer =
      filtered.length > 0
        ? `Wallet ${shortenAddress(intent.address)} currently holds ${summaryParts.join(", ")}.`
        : intent.asset?.code
        ? `Wallet ${shortenAddress(intent.address)} does not hold any ${intent.asset.code}.`
        : `Wallet ${shortenAddress(intent.address)} has no active asset balances.`;

    const result: NaturalLanguageQueryResult = {
      question,
      network,
      parsedIntent: intent,
      headline,
      subheadline: balResult.asOfLedger
        ? `As of ledger ${balResult.asOfLedger.toLocaleString("en-US")}`
        : "Current account snapshot",
      answer,
      evidence: {
        balances: filtered.map((b) => ({
          code: b.asset.code,
          balance: b.balance,
          issuer: b.asset.issuer,
        })),
      },
      coverage: balResult.coverage,
      cached: false,
    };
    await saveCachedQueryResult(cacheKey, network, intent.intent, result);
    return result;
  }

  if (intent.intent === "contract_events" && intent.contractId) {
    const evRes = await fetchContractEvents(network, intent.contractId, {
      limit: intent.limit ?? 20,
    });
    const result: NaturalLanguageQueryResult = {
      question,
      network,
      parsedIntent: intent,
      headline: `${evRes.events.length} contract event(s)`,
      subheadline: `Contract ${shortenAddress(intent.contractId)}`,
      answer:
        evRes.events.length > 0
          ? `Found ${evRes.events.length} recent event(s) for contract ${shortenAddress(intent.contractId)} within the RPC retention window.`
          : `No recent events were found for contract ${shortenAddress(intent.contractId)} in the RPC retention window.`,
      evidence: {},
      coverage: evRes.coverage,
      cached: false,
    };
    await saveCachedQueryResult(cacheKey, network, intent.intent, result);
    return result;
  }

  // Default: account_transfers
  if (!intent.address) {
    return {
      question,
      network,
      parsedIntent: intent,
      headline: "Wallet address required",
      subheadline: "Missing account context",
      answer: "Please provide a Stellar wallet address (G...) to search transfers.",
      needsClarification: true,
      evidence: {},
      coverage: { provider: "cache", method: "validation" },
      cached: false,
    };
  }

  const transferRes = await fetchAccountTransfers(network, intent.address, {
    limit: intent.limit ?? 20,
    maxPages: intent.time_range?.from ? 3 : 1,
    from: intent.time_range?.from,
    to: intent.time_range?.to,
  });

  let matched = transferRes.transfers;
  if (intent.direction === "incoming") {
    matched = matched.filter((t) => t.direction === "incoming");
  } else if (intent.direction === "outgoing") {
    matched = matched.filter((t) => t.direction === "outgoing");
  }

  if (intent.asset?.code) {
    const targetCode = intent.asset.code.toUpperCase();
    matched = matched.filter((t) => t.asset.code.toUpperCase() === targetCode);
  }

  if (intent.limit) {
    matched = matched.slice(0, intent.limit);
  }

  const timeLabel = intent.time_range?.label ?? "in recent history";
  const assetLabel = intent.asset?.code ? intent.asset.code.toUpperCase() : "all assets";

  let headline = `${matched.length} transfer${matched.length === 1 ? "" : "s"}`;
  let answer = "";

  if (intent.aggregation === "failed_count") {
    const failed = matched.filter((t) => !t.successful);
    headline = `${failed.length} failed`;
    answer = `Found ${failed.length} failed transfer(s) out of ${matched.length} checked ${timeLabel}.`;
    matched = failed;
  } else if (intent.aggregation === "sum" && intent.asset?.code) {
    const total = sumDecimalStrings(
      matched.filter((t) => t.successful).map((t) => t.amount)
    );
    headline = `${formatAmount(total)} ${intent.asset.code.toUpperCase()}`;
    const verb =
      intent.direction === "incoming"
        ? "received"
        : intent.direction === "outgoing"
        ? "sent"
        : "transferred";
    answer = `Wallet ${shortenAddress(intent.address)} ${verb} ${formatAmount(total)} ${intent.asset.code.toUpperCase()} across ${matched.length} transfer(s) ${timeLabel}.`;
  } else if (intent.aggregation === "senders") {
    const senders = Array.from(
      new Set(
        matched
          .filter((t) => t.direction === "incoming")
          .map((t) => shortenAddress(t.from))
      )
    );
    headline = `${senders.length} sender${senders.length === 1 ? "" : "s"}`;
    answer =
      senders.length > 0
        ? `Wallet ${shortenAddress(intent.address)} received ${assetLabel} from ${senders.join(", ")} ${timeLabel}.`
        : `No incoming ${assetLabel} transfers were found ${timeLabel}.`;
  } else {
    const dirLabel =
      intent.direction === "incoming"
        ? "incoming"
        : intent.direction === "outgoing"
        ? "outgoing"
        : "";
    answer =
      matched.length > 0
        ? `Found ${matched.length} ${dirLabel ? `${dirLabel} ` : ""}transfer(s) (${assetLabel}) for ${shortenAddress(intent.address)} ${timeLabel}. Most recent: ${formatAmount(matched[0].amount)} ${matched[0].asset.code} on ${formatDateShort(matched[0].timestamp)}.`
        : `No ${dirLabel ? `${dirLabel} ` : ""}transfers (${assetLabel}) were found for ${shortenAddress(intent.address)} ${timeLabel}.`;
  }

  const result: NaturalLanguageQueryResult = {
    question,
    network,
    parsedIntent: intent,
    headline,
    subheadline: `${timeLabel} · ${matched.length} matching transfer${matched.length === 1 ? "" : "s"}`,
    answer,
    evidence: { transfers: matched },
    coverage: transferRes.coverage,
    cached: false,
  };

  await saveCachedQueryResult(cacheKey, network, intent.intent, result);
  return result;
}
