import { decodeContractEventFromXdr } from "../event-decoder";
import { decodeTransactionFromXdr } from "../transaction-decoder";
import { stroopsToXlm } from "../utils/format";
import type { StellarNetwork } from "../validation";
import type {
  AccountBalance,
  AccountBalancesResult,
  AccountTransfersResult,
  AssetIdentifier,
  CanonicalTransaction,
  CoverageInfo,
  DecodedEvent,
  ProviderHealth,
  StellarProvider,
  TransferRecord,
} from "./types";

function getAlchemyRpcUrl(network: StellarNetwork, apiKey: string): string {
  return network === "testnet"
    ? `https://stellar-testnet.g.alchemy.com/v2/${apiKey}`
    : `https://stellar-mainnet.g.alchemy.com/v2/${apiKey}`;
}

function getAlchemyDataUrl(network: StellarNetwork, apiKey: string, path: string): string {
  const host =
    network === "testnet"
      ? "https://stellar-testnet.g.alchemy.com"
      : "https://stellar-mainnet.g.alchemy.com";
  return `${host}/data/v1/${apiKey}${path}`;
}

async function fetchJsonWithTimeout<T>(
  url: string,
  init: RequestInit,
  timeoutMs = 10_000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Alchemy HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function parseAlchemyAsset(raw: Record<string, unknown>): AssetIdentifier {
  const assetType = String(raw.assetType ?? raw.type ?? "");
  const code = String(raw.assetCode ?? raw.code ?? raw.symbol ?? "XLM");
  const issuer =
    typeof raw.assetIssuer === "string"
      ? raw.assetIssuer
      : typeof raw.issuer === "string"
      ? raw.issuer
      : undefined;
  const contractId =
    typeof raw.contractId === "string" ? raw.contractId : undefined;

  if (assetType === "native" || (code === "XLM" && !issuer && !contractId)) {
    return { type: "native", code: "XLM" };
  }
  if (contractId) {
    return { type: "soroban", code, contractId };
  }
  return {
    type: code.length <= 4 ? "credit_alphanum4" : "credit_alphanum12",
    code,
    issuer,
  };
}

export class AlchemyProvider implements StellarProvider {
  readonly name = "alchemy" as const;

  private getApiKey(): string | undefined {
    const key = process.env.ALCHEMY_API_KEY?.trim();
    return key ? key : undefined;
  }

  isConfigured(_network: StellarNetwork): boolean {
    return Boolean(this.getApiKey());
  }

  private async rpcCall<T>(
    network: StellarNetwork,
    method: string,
    params?: unknown
  ): Promise<T> {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error("ALCHEMY_API_KEY not configured");

    const payload = await fetchJsonWithTimeout<{
      result?: T;
      error?: { code: number; message: string };
    }>(getAlchemyRpcUrl(network, apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method,
        params,
      }),
    });

    if (payload.error) {
      throw new Error(
        `Alchemy RPC ${method} error ${payload.error.code}: ${payload.error.message}`
      );
    }
    return payload.result as T;
  }

  async getHealth(network: StellarNetwork): Promise<ProviderHealth> {
    try {
      const res = await this.rpcCall<{
        status?: string;
        oldestLedger?: number;
        latestLedger?: number;
        ledgerRetentionWindow?: number;
      }>(network, "getHealth");

      return {
        provider: "alchemy",
        available: res.status === "healthy" || Boolean(res.latestLedger),
        oldestLedger: res.oldestLedger,
        latestLedger: res.latestLedger,
        ledgerRetentionWindow: res.ledgerRetentionWindow,
        checkedAt: new Date().toISOString(),
      };
    } catch {
      return {
        provider: "alchemy",
        available: false,
        checkedAt: new Date().toISOString(),
      };
    }
  }

  async getAccountBalances(
    network: StellarNetwork,
    address: string
  ): Promise<AccountBalancesResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error("ALCHEMY_API_KEY not configured");

    const data = await fetchJsonWithTimeout<{
      balances?: Array<Record<string, unknown>>;
      asOfLedger?: number;
    }>(getAlchemyDataUrl(network, apiKey, "/stellar/balances"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addresses: [address] }),
    });

    const balances: AccountBalance[] = (data.balances ?? []).map((b) => ({
      asset: parseAlchemyAsset(b),
      balance: String(b.balance ?? b.amount ?? "0"),
      limit: b.limit != null ? String(b.limit) : undefined,
      isAuthorized:
        typeof b.isAuthorized === "boolean" ? b.isAuthorized : undefined,
    }));

    return {
      network,
      address,
      balances,
      asOfLedger: data.asOfLedger,
      fetchedAt: new Date().toISOString(),
      coverage: {
        provider: "alchemy",
        method: "data/stellar/balances",
        asOfLedger: data.asOfLedger,
        note: "Indexed unified balances (XLM, classic assets, and supported Soroban tokens).",
      },
    };
  }

  async getAccountTransfers(
    network: StellarNetwork,
    address: string,
    options?: { limit?: number; pageKey?: string; from?: string; to?: string }
  ): Promise<AccountTransfersResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error("ALCHEMY_API_KEY not configured");

    const limit = Math.min(options?.limit ?? 20, 50);
    const body: Record<string, unknown> = {
      address,
      maxCount: limit,
    };
    if (options?.pageKey) body.pageKey = options.pageKey;

    const data = await fetchJsonWithTimeout<{
      transfers?: Array<Record<string, unknown>>;
      pageKey?: string;
    }>(getAlchemyDataUrl(network, apiKey, "/stellar/transfers"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const transfers: TransferRecord[] = (data.transfers ?? []).map((t, idx) => {
      const from = String(t.from ?? t.fromAddress ?? "");
      const to = String(t.to ?? t.toAddress ?? "");
      const direction: TransferRecord["direction"] =
        from === address && to === address
          ? "self"
          : to === address
          ? "incoming"
          : "outgoing";

      const rawAmount = t.amount ?? t.value ?? "0";
      const timestamp = String(
        t.closedAt ?? t.timestamp ?? t.blockTimestamp ?? new Date().toISOString()
      );

      return {
        id: String(t.id ?? `${t.txHash ?? t.hash ?? idx}-${idx}`),
        txHash: String(t.txHash ?? t.hash ?? ""),
        ledger: typeof t.ledger === "number" ? t.ledger : undefined,
        timestamp,
        direction,
        from,
        to,
        asset: parseAlchemyAsset(t),
        amount: String(rawAmount),
        operationType: String(t.operationType ?? t.category ?? "transfer"),
        successful: t.successful !== false,
        memo: typeof t.memo === "string" ? t.memo : undefined,
      };
    });

    const timestamps = transfers.map((t) => t.timestamp).filter(Boolean).sort();

    return {
      network,
      address,
      transfers,
      nextPageKey: data.pageKey,
      pagesFetched: 1,
      isPartial: Boolean(data.pageKey),
      fetchedAt: new Date().toISOString(),
      coverage: {
        provider: "alchemy",
        method: "data/stellar/transfers",
        oldestTimestamp: timestamps[0],
        latestTimestamp: timestamps[timestamps.length - 1],
        isPartial: Boolean(data.pageKey),
        note: "Indexed transfer activity from Alchemy Stellar Data API.",
      },
    };
  }

  async getTransaction(
    network: StellarNetwork,
    hash: string
  ): Promise<CanonicalTransaction | null> {
    const res = await this.rpcCall<{
      status: "SUCCESS" | "FAILED" | "NOT_FOUND";
      ledger?: number;
      createdAt?: number | string;
      latestLedger?: number;
      oldestLedger?: number;
      envelopeXdr?: string;
      resultXdr?: string;
      resultMetaXdr?: string;
    }>(network, "getTransaction", { hash });

    if (!res || res.status === "NOT_FOUND") {
      return null;
    }

    const closedAt =
      typeof res.createdAt === "number"
        ? new Date(res.createdAt * 1000).toISOString()
        : typeof res.createdAt === "string"
        ? res.createdAt
        : undefined;

    const coverage: CoverageInfo = {
      provider: "alchemy",
      method: "rpc/getTransaction",
      oldestLedger: res.oldestLedger,
      latestLedger: res.latestLedger,
    };

    return decodeTransactionFromXdr({
      network,
      hash,
      status: res.status === "FAILED" ? "FAILED" : "SUCCESS",
      ledger: res.ledger,
      closedAt,
      envelopeXdr: res.envelopeXdr,
      resultXdr: res.resultXdr,
      resultMetaXdr: res.resultMetaXdr,
      provider: "alchemy",
      coverage,
    });
  }

  async getContractEvents(
    network: StellarNetwork,
    contractId: string,
    options?: { startLedger?: number; limit?: number }
  ): Promise<{ events: DecodedEvent[]; coverage: CoverageInfo }> {
    const health = await this.getHealth(network);
    const startLedger =
      options?.startLedger ??
      (health.latestLedger ? Math.max(health.oldestLedger ?? 1, health.latestLedger - 5000) : undefined);

    const res = await this.rpcCall<{
      events?: Array<{
        contractId?: string;
        topic?: string[];
        value?: string;
      }>;
      latestLedger?: number;
    }>(network, "getEvents", {
      startLedger,
      filters: [{ type: "contract", contractIds: [contractId] }],
      pagination: { limit: options?.limit ?? 20 },
    });

    const events = (res.events ?? []).map((ev, idx) =>
      decodeContractEventFromXdr(
        ev.contractId ?? contractId,
        ev.topic ?? [],
        ev.value,
        idx
      )
    );

    return {
      events,
      coverage: {
        provider: "alchemy",
        method: "rpc/getEvents",
        oldestLedger: health.oldestLedger,
        latestLedger: res.latestLedger ?? health.latestLedger,
        ledgerRetentionWindow: health.ledgerRetentionWindow,
        note: "Alchemy RPC event retention is limited to recent ledgers.",
      },
    };
  }
}

export { stroopsToXlm };
