import { connectToDatabase } from "../db/connection";
import { AccountModel } from "../db/models/Account";
import { LabelModel } from "../db/models/Label";
import { QueryCacheModel } from "../db/models/QueryCache";
import { RateLimitModel } from "../db/models/RateLimit";
import { TransactionModel } from "../db/models/Transaction";
import type {
  AccountBalancesResult,
  CanonicalTransaction,
  HumanizedTransaction,
} from "../stellar/providers/types";
import type { StellarNetwork } from "../stellar/validation";

const ACCOUNT_TTL_MS = 20_000;
const QUERY_TTL_MS = 5 * 60_000;
const MEMORY_TX_CAP = 500;

const KNOWN_LABELS: Record<string, string> = {
  "mainnet:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN":
    "Circle (USDC Issuer)",
  "mainnet:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5":
    "Circle Test / Legacy",
  "mainnet:GCZST3XVCDTUJ76ZAV2HA72KYQM4Y5J5R6E5E6W4N3P3L7X5Q5X5X5X5":
    "Stellar Anchor",
  "mainnet:GDUKMGUGDZQK6YHYA5Z6AY2G4XDSZPSZ3SW5UN3ARVMO6QSRDWP5YLEX":
    "AnchorUSD (USD)",
  "mainnet:GA24LJXFG73JGARMKG9BG6S2R25R6F6C422B2Q5X3B5F3M3M3M3M3M3M":
    "Stellar Development Foundation",
};

interface CachedEntry<T> {
  value: T;
  expiresAt: number;
}

const memTxCache = new Map<
  string,
  { transaction: CanonicalTransaction; humanized: HumanizedTransaction }
>();
const memAccountCache = new Map<string, CachedEntry<AccountBalancesResult>>();
const memQueryCache = new Map<string, CachedEntry<unknown>>();
const memRateLimits = new Map<string, { count: number; expiresAt: number }>();

export async function getKnownAddressLabel(
  network: StellarNetwork,
  address?: string
): Promise<string | undefined> {
  if (!address) return undefined;
  const builtin = KNOWN_LABELS[`${network}:${address}`];
  if (builtin) return builtin;

  try {
    const db = await connectToDatabase();
    if (!db) return undefined;
    const doc = await LabelModel.findOne({ network, address }).lean();
    return (doc as { name?: string } | null)?.name;
  } catch {
    return undefined;
  }
}

export async function getCachedTransaction(
  network: StellarNetwork,
  hash: string
): Promise<{
  transaction: CanonicalTransaction;
  humanized: HumanizedTransaction;
} | null> {
  const key = `${network}:${hash.toLowerCase()}`;
  const mem = memTxCache.get(key);
  if (mem) {
    return {
      ...mem,
      transaction: {
        ...mem.transaction,
        coverage: { ...mem.transaction.coverage, provider: "cache" },
      },
    };
  }

  try {
    const db = await connectToDatabase();
    if (!db) return null;
    const doc = (await TransactionModel.findOne({
      network,
      hash: hash.toLowerCase(),
    }).lean()) as Record<string, unknown> | null;

    if (!doc || !doc.humanized) return null;

    const tx: CanonicalTransaction = {
      network,
      hash: String(doc.hash),
      status: (doc.status as CanonicalTransaction["status"]) ?? "SUCCESS",
      ledger: typeof doc.ledger === "number" ? doc.ledger : undefined,
      closedAt:
        doc.closedAt instanceof Date
          ? doc.closedAt.toISOString()
          : typeof doc.closedAt === "string"
          ? doc.closedAt
          : undefined,
      sourceAccount:
        typeof doc.sourceAccount === "string" ? doc.sourceAccount : undefined,
      feeChargedStroops:
        typeof doc.feeChargedStroops === "string"
          ? doc.feeChargedStroops
          : undefined,
      feeChargedXlm:
        typeof doc.feeChargedXlm === "string" ? doc.feeChargedXlm : undefined,
      memo: doc.memo as CanonicalTransaction["memo"],
      operations: (doc.operations as CanonicalTransaction["operations"]) ?? [],
      events: (doc.events as CanonicalTransaction["events"]) ?? [],
      envelopeXdr:
        typeof doc.envelopeXdr === "string" ? doc.envelopeXdr : undefined,
      provider: "cache",
      fetchedAt:
        doc.fetchedAt instanceof Date
          ? doc.fetchedAt.toISOString()
          : new Date().toISOString(),
      coverage: {
        ...(doc.coverage as CanonicalTransaction["coverage"]),
        provider: "cache",
        note: "Loaded from persistent transaction cache.",
      },
    };

    return {
      transaction: tx,
      humanized: doc.humanized as HumanizedTransaction,
    };
  } catch {
    return null;
  }
}

export async function saveCachedTransaction(
  transaction: CanonicalTransaction,
  humanized: HumanizedTransaction
): Promise<void> {
  if (transaction.status === "NOT_FOUND") return;

  const key = `${transaction.network}:${transaction.hash.toLowerCase()}`;
  if (memTxCache.size >= MEMORY_TX_CAP) {
    const firstKey = memTxCache.keys().next().value;
    if (firstKey) memTxCache.delete(firstKey);
  }
  memTxCache.set(key, { transaction, humanized });

  try {
    const db = await connectToDatabase();
    if (!db) return;

    await TransactionModel.findOneAndUpdate(
      { network: transaction.network, hash: transaction.hash.toLowerCase() },
      {
        network: transaction.network,
        hash: transaction.hash.toLowerCase(),
        ledger: transaction.ledger,
        closedAt: transaction.closedAt ? new Date(transaction.closedAt) : undefined,
        status: transaction.status,
        sourceAccount: transaction.sourceAccount,
        feeChargedStroops: transaction.feeChargedStroops,
        feeChargedXlm: transaction.feeChargedXlm,
        memo: transaction.memo,
        operations: transaction.operations,
        events: transaction.events,
        humanized,
        coverage: transaction.coverage,
        envelopeXdr: transaction.envelopeXdr,
        decoderVersion: 1,
        humanizerVersion: humanized.humanizerVersion,
        provider: transaction.provider,
        fetchedAt: new Date(transaction.fetchedAt),
      },
      { upsert: true, new: true }
    );
  } catch {
    // Non-fatal cache write failure
  }
}

export async function getCachedAccountBalances(
  network: StellarNetwork,
  address: string
): Promise<AccountBalancesResult | null> {
  const key = `${network}:${address}`;
  const mem = memAccountCache.get(key);
  if (mem && mem.expiresAt > Date.now()) {
    return mem.value;
  }

  try {
    const db = await connectToDatabase();
    if (!db) return null;

    const doc = (await AccountModel.findOne({
      network,
      address,
      expiresAt: { $gt: new Date() },
    }).lean()) as Record<string, unknown> | null;

    if (!doc) return null;

    return {
      network,
      address,
      balances: (doc.balances as AccountBalancesResult["balances"]) ?? [],
      asOfLedger:
        typeof doc.asOfLedger === "number" ? doc.asOfLedger : undefined,
      fetchedAt:
        doc.fetchedAt instanceof Date
          ? doc.fetchedAt.toISOString()
          : new Date().toISOString(),
      coverage: (doc.coverage as AccountBalancesResult["coverage"]) ?? {
        provider: "cache",
        method: "cache/account",
      },
    };
  } catch {
    return null;
  }
}

export async function saveCachedAccountBalances(
  result: AccountBalancesResult
): Promise<void> {
  const key = `${result.network}:${result.address}`;
  const expiresAt = Date.now() + ACCOUNT_TTL_MS;
  memAccountCache.set(key, { value: result, expiresAt });

  try {
    const db = await connectToDatabase();
    if (!db) return;

    await AccountModel.findOneAndUpdate(
      { network: result.network, address: result.address },
      {
        network: result.network,
        address: result.address,
        balances: result.balances,
        asOfLedger: result.asOfLedger,
        provider: result.coverage.provider,
        coverage: result.coverage,
        fetchedAt: new Date(result.fetchedAt),
        expiresAt: new Date(expiresAt),
      },
      { upsert: true }
    );
  } catch {
    // Non-fatal
  }
}

export async function getCachedQueryResult<T>(
  cacheKey: string
): Promise<T | null> {
  const mem = memQueryCache.get(cacheKey);
  if (mem && mem.expiresAt > Date.now()) {
    return mem.value as T;
  }

  try {
    const db = await connectToDatabase();
    if (!db) return null;

    const doc = (await QueryCacheModel.findOne({
      cacheKey,
      expiresAt: { $gt: new Date() },
    }).lean()) as { result?: T } | null;

    return doc?.result ?? null;
  } catch {
    return null;
  }
}

export async function saveCachedQueryResult<T>(
  cacheKey: string,
  network: StellarNetwork,
  intent: string,
  result: T
): Promise<void> {
  const expiresAt = Date.now() + QUERY_TTL_MS;
  memQueryCache.set(cacheKey, { value: result, expiresAt });

  try {
    const db = await connectToDatabase();
    if (!db) return;

    await QueryCacheModel.findOneAndUpdate(
      { cacheKey },
      {
        cacheKey,
        network,
        intent,
        result,
        expiresAt: new Date(expiresAt),
      },
      { upsert: true }
    );
  } catch {
    // Non-fatal
  }
}

export async function checkRateLimit(
  identifier: string
): Promise<{ allowed: boolean; remaining: number }> {
  const maxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? "60");
  const windowSec = Number(process.env.RATE_LIMIT_WINDOW_SECONDS ?? "60");
  const now = Date.now();
  const windowMs = windowSec * 1000;

  try {
    const db = await connectToDatabase();
    if (db) {
      const doc = (await RateLimitModel.findOneAndUpdate(
        { key: identifier, expiresAt: { $gt: new Date(now) } },
        { $inc: { count: 1 } },
        { new: true }
      ).lean()) as { count: number } | null;

      if (doc) {
        return {
          allowed: doc.count <= maxRequests,
          remaining: Math.max(0, maxRequests - doc.count),
        };
      }

      await RateLimitModel.findOneAndUpdate(
        { key: identifier },
        {
          key: identifier,
          count: 1,
          expiresAt: new Date(now + windowMs),
        },
        { upsert: true }
      );
      return { allowed: true, remaining: maxRequests - 1 };
    }
  } catch {
    // Fallback to in-memory rate limiter
  }

  const existing = memRateLimits.get(identifier);
  if (!existing || existing.expiresAt <= now) {
    memRateLimits.set(identifier, { count: 1, expiresAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  existing.count += 1;
  return {
    allowed: existing.count <= maxRequests,
    remaining: Math.max(0, maxRequests - existing.count),
  };
}
