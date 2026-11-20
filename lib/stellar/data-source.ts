import { AlchemyProvider } from "./providers/alchemy";
import { PublicHorizonProvider } from "./providers/horizon";
import { QuickNodeProvider } from "./providers/quicknode";
import type {
  AccountBalancesResult,
  AccountTransfersResult,
  CanonicalTransaction,
  CoverageInfo,
  DecodedEvent,
  ProviderHealth,
  StellarProvider,
  TransferRecord,
} from "./providers/types";
import type { StellarNetwork } from "./validation";

const HEALTH_CACHE_TTL_MS = 60_000;
const MAX_TRANSFER_PAGES = 3;

const alchemy = new AlchemyProvider();
const quicknode = new QuickNodeProvider();
const publicHorizon = new PublicHorizonProvider();

const healthCache = new Map<
  string,
  { health: ProviderHealth; expiresAt: number }
>();

export function getConfiguredProviders(
  network: StellarNetwork
): StellarProvider[] {
  const list: StellarProvider[] = [];
  if (alchemy.isConfigured(network)) list.push(alchemy);
  if (quicknode.isConfigured(network)) list.push(quicknode);
  list.push(publicHorizon);
  return list;
}

export async function getCachedProviderHealth(
  provider: StellarProvider,
  network: StellarNetwork
): Promise<ProviderHealth> {
  const key = `${provider.name}:${network}`;
  const cached = healthCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.health;
  }

  const health = await provider.getHealth(network);
  healthCache.set(key, {
    health,
    expiresAt: Date.now() + HEALTH_CACHE_TTL_MS,
  });
  return health;
}

export async function fetchAccountBalances(
  network: StellarNetwork,
  address: string
): Promise<AccountBalancesResult> {
  const providers = getConfiguredProviders(network);
  let lastError: unknown;

  for (const provider of providers) {
    try {
      return await provider.getAccountBalances(network, address);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to fetch account balances from all providers");
}

export async function fetchAccountTransfers(
  network: StellarNetwork,
  address: string,
  options?: {
    limit?: number;
    maxPages?: number;
    from?: string;
    to?: string;
  }
): Promise<AccountTransfersResult> {
  const providers = getConfiguredProviders(network);
  const maxPages = Math.min(options?.maxPages ?? 1, MAX_TRANSFER_PAGES);
  const pageLimit = Math.min(options?.limit ?? 20, 50);
  const fromMs = options?.from ? new Date(options.from).getTime() : undefined;
  const toMs = options?.to ? new Date(options.to).getTime() : undefined;

  let lastError: unknown;

  for (const provider of providers) {
    try {
      const allTransfers: TransferRecord[] = [];
      let pageKey: string | undefined;
      let pagesFetched = 0;
      let hasMore = false;
      let lastCoverage: CoverageInfo | undefined;

      for (let page = 0; page < maxPages; page++) {
        const res = await provider.getAccountTransfers(network, address, {
          limit: pageLimit,
          pageKey,
          from: options?.from,
          to: options?.to,
        });

        pagesFetched += 1;
        lastCoverage = res.coverage;
        allTransfers.push(...res.transfers);
        pageKey = res.nextPageKey;
        hasMore = Boolean(pageKey);

        if (!pageKey) break;

        // Stop early if we already passed the lower bound of the requested time range
        if (fromMs && res.transfers.length > 0) {
          const oldestInPage = new Date(
            res.transfers[res.transfers.length - 1].timestamp
          ).getTime();
          if (oldestInPage < fromMs) {
            hasMore = false;
            break;
          }
        }
      }

      const filtered = allTransfers.filter((t) => {
        const ts = new Date(t.timestamp).getTime();
        if (fromMs && ts < fromMs) return false;
        if (toMs && ts > toMs) return false;
        return true;
      });

      const timestamps = filtered.map((t) => t.timestamp).filter(Boolean).sort();

      return {
        network,
        address,
        transfers: filtered,
        nextPageKey: hasMore ? pageKey : undefined,
        pagesFetched,
        isPartial: hasMore,
        fetchedAt: new Date().toISOString(),
        coverage: {
          ...(lastCoverage ?? {
            provider: provider.name,
            method: "transfers",
          }),
          oldestTimestamp: timestamps[0] ?? lastCoverage?.oldestTimestamp,
          latestTimestamp:
            timestamps[timestamps.length - 1] ?? lastCoverage?.latestTimestamp,
          isPartial: hasMore,
          note: hasMore
            ? `Showing up to ${pagesFetched} page(s) of transfer activity. Older records may exist.`
            : lastCoverage?.note,
        },
      };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to fetch account transfers from all providers");
}

export async function fetchTransaction(
  network: StellarNetwork,
  hash: string
): Promise<{
  transaction: CanonicalTransaction | null;
  providerHealth?: ProviderHealth;
}> {
  const providers = getConfiguredProviders(network);

  for (const provider of providers) {
    try {
      const tx = await provider.getTransaction(network, hash);
      if (tx) {
        return { transaction: tx };
      }
    } catch {
      // Try next fallback provider
    }
  }

  // Return health of primary provider so the UI can explain retention window
  const primaryHealth = await getCachedProviderHealth(providers[0], network);
  return { transaction: null, providerHealth: primaryHealth };
}

export async function fetchContractEvents(
  network: StellarNetwork,
  contractId: string,
  options?: { startLedger?: number; limit?: number }
): Promise<{ events: DecodedEvent[]; coverage: CoverageInfo }> {
  const providers = getConfiguredProviders(network);
  let lastError: unknown;

  for (const provider of providers) {
    if (!provider.getContractEvents) continue;
    try {
      return await provider.getContractEvents(network, contractId, options);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to fetch contract events");
}
