import { decodeContractEventFromXdr } from "../event-decoder";
import { decodeTransactionFromXdr } from "../transaction-decoder";
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

async function fetchJsonWithTimeout<T>(
  url: string,
  init: RequestInit = {},
  timeoutMs = 10_000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`QuickNode HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function parseHorizonBalanceAsset(b: Record<string, unknown>): AssetIdentifier {
  const assetType = String(b.asset_type ?? "");
  if (assetType === "native") {
    return { type: "native", code: "XLM" };
  }
  const code = String(b.asset_code ?? "UNKNOWN");
  const issuer = typeof b.asset_issuer === "string" ? b.asset_issuer : undefined;
  return {
    type: assetType === "credit_alphanum12" ? "credit_alphanum12" : "credit_alphanum4",
    code,
    issuer,
  };
}

export function mapHorizonPaymentToTransfer(
  rec: Record<string, unknown>,
  address: string
): TransferRecord | null {
  const type = String(rec.type ?? "");
  const txHash = String(rec.transaction_hash ?? "");
  const timestamp = String(rec.created_at ?? new Date().toISOString());
  const successful = rec.transaction_successful !== false;

  if (type === "payment") {
    const from = String(rec.from ?? "");
    const to = String(rec.to ?? "");
    const asset = parseHorizonBalanceAsset(rec);
    return {
      id: String(rec.id ?? txHash),
      txHash,
      timestamp,
      direction:
        from === address && to === address
          ? "self"
          : to === address
          ? "incoming"
          : "outgoing",
      from,
      to,
      asset,
      amount: String(rec.amount ?? "0"),
      operationType: "payment",
      successful,
    };
  }

  if (type === "create_account") {
    const from = String(rec.funder ?? "");
    const to = String(rec.account ?? "");
    return {
      id: String(rec.id ?? txHash),
      txHash,
      timestamp,
      direction: to === address ? "incoming" : "outgoing",
      from,
      to,
      asset: { type: "native", code: "XLM" },
      amount: String(rec.starting_balance ?? "0"),
      operationType: "create_account",
      successful,
    };
  }

  if (
    type === "path_payment_strict_send" ||
    type === "path_payment_strict_receive"
  ) {
    const from = String(rec.from ?? "");
    const to = String(rec.to ?? "");
    const asset = parseHorizonBalanceAsset(rec);
    return {
      id: String(rec.id ?? txHash),
      txHash,
      timestamp,
      direction: to === address ? "incoming" : "outgoing",
      from,
      to,
      asset,
      amount: String(rec.amount ?? "0"),
      operationType: type,
      successful,
    };
  }

  if (type === "account_merge") {
    const from = String(rec.account ?? "");
    const to = String(rec.into ?? "");
    return {
      id: String(rec.id ?? txHash),
      txHash,
      timestamp,
      direction: to === address ? "incoming" : "outgoing",
      from,
      to,
      asset: { type: "native", code: "XLM" },
      amount: "0",
      operationType: "account_merge",
      successful,
    };
  }

  return null;
}

export class QuickNodeProvider implements StellarProvider {
  readonly name: StellarProvider["name"] = "quicknode";

  protected getRpcUrl(network: StellarNetwork): string | undefined {
    return network === "testnet"
      ? process.env.QUICKNODE_TESTNET_RPC_URL?.trim() || undefined
      : process.env.QUICKNODE_MAINNET_RPC_URL?.trim() || undefined;
  }

  protected getHorizonUrl(network: StellarNetwork): string | undefined {
    return network === "testnet"
      ? process.env.QUICKNODE_TESTNET_HORIZON_URL?.trim() || undefined
      : process.env.QUICKNODE_MAINNET_HORIZON_URL?.trim() || undefined;
  }

  isConfigured(network: StellarNetwork): boolean {
    return Boolean(this.getRpcUrl(network) || this.getHorizonUrl(network));
  }

  private async rpcCall<T>(
    network: StellarNetwork,
    method: string,
    params?: unknown
  ): Promise<T> {
    const url = this.getRpcUrl(network);
    if (!url) throw new Error(`${this.name} RPC URL not configured`);

    const payload = await fetchJsonWithTimeout<{
      result?: T;
      error?: { code: number; message: string };
    }>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });

    if (payload.error) {
      throw new Error(
        `${this.name} RPC ${method} error ${payload.error.code}: ${payload.error.message}`
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
        provider: this.name,
        available: res.status === "healthy" || Boolean(res.latestLedger),
        oldestLedger: res.oldestLedger,
        latestLedger: res.latestLedger,
        ledgerRetentionWindow: res.ledgerRetentionWindow,
        checkedAt: new Date().toISOString(),
      };
    } catch {
      return {
        provider: this.name,
        available: false,
        checkedAt: new Date().toISOString(),
      };
    }
  }

  async getAccountBalances(
    network: StellarNetwork,
    address: string
  ): Promise<AccountBalancesResult> {
    const horizonUrl = this.getHorizonUrl(network);
    if (!horizonUrl) {
      throw new Error(`${this.name} Horizon URL not configured`);
    }

    const res = await fetchJsonWithTimeout<{
      last_modified_ledger?: number;
      balances?: Array<Record<string, unknown>>;
    }>(`${horizonUrl.replace(/\/$/, "")}/accounts/${encodeURIComponent(address)}`);

    const balances: AccountBalance[] = (res.balances ?? []).map((b) => ({
      asset: parseHorizonBalanceAsset(b),
      balance: String(b.balance ?? "0"),
      limit: b.limit != null ? String(b.limit) : undefined,
      isAuthorized:
        typeof b.is_authorized === "boolean" ? b.is_authorized : undefined,
    }));

    return {
      network,
      address,
      balances,
      asOfLedger: res.last_modified_ledger,
      fetchedAt: new Date().toISOString(),
      coverage: {
        provider: this.name,
        method: "horizon/accounts",
        asOfLedger: res.last_modified_ledger,
        note: "Classic & XLM balances retrieved via Horizon.",
      },
    };
  }

  async getAccountTransfers(
    network: StellarNetwork,
    address: string,
    options?: { limit?: number; pageKey?: string; from?: string; to?: string }
  ): Promise<AccountTransfersResult> {
    const horizonUrl = this.getHorizonUrl(network);
    if (!horizonUrl) {
      throw new Error(`${this.name} Horizon URL not configured`);
    }

    const limit = Math.min(options?.limit ?? 20, 50);
    const cursorParam = options?.pageKey
      ? `&cursor=${encodeURIComponent(options.pageKey)}`
      : "";
    const url = `${horizonUrl.replace(/\/$/, "")}/accounts/${encodeURIComponent(address)}/payments?order=desc&limit=${limit}${cursorParam}`;

    const res = await fetchJsonWithTimeout<{
      _embedded?: { records?: Array<Record<string, unknown>> };
    }>(url);

    const records = res._embedded?.records ?? [];
    const transfers = records
      .map((r) => mapHorizonPaymentToTransfer(r, address))
      .filter((t): t is TransferRecord => t !== null);

    const lastRecord = records[records.length - 1];
    const nextCursor =
      records.length >= limit && lastRecord?.paging_token
        ? String(lastRecord.paging_token)
        : undefined;

    const timestamps = transfers.map((t) => t.timestamp).filter(Boolean).sort();

    return {
      network,
      address,
      transfers,
      nextPageKey: nextCursor,
      pagesFetched: 1,
      isPartial: Boolean(nextCursor),
      fetchedAt: new Date().toISOString(),
      coverage: {
        provider: this.name,
        method: "horizon/payments",
        oldestTimestamp: timestamps[0],
        latestTimestamp: timestamps[timestamps.length - 1],
        isPartial: Boolean(nextCursor),
        note: "Payment & account transfer records retrieved via Horizon.",
      },
    };
  }

  async getTransaction(
    network: StellarNetwork,
    hash: string
  ): Promise<CanonicalTransaction | null> {
    if (this.getRpcUrl(network)) {
      try {
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

        if (res && res.status !== "NOT_FOUND") {
          const closedAt =
            typeof res.createdAt === "number"
              ? new Date(res.createdAt * 1000).toISOString()
              : typeof res.createdAt === "string"
              ? res.createdAt
              : undefined;

          return decodeTransactionFromXdr({
            network,
            hash,
            status: res.status === "FAILED" ? "FAILED" : "SUCCESS",
            ledger: res.ledger,
            closedAt,
            envelopeXdr: res.envelopeXdr,
            resultXdr: res.resultXdr,
            resultMetaXdr: res.resultMetaXdr,
            provider: this.name,
            coverage: {
              provider: this.name,
              method: "rpc/getTransaction",
              oldestLedger: res.oldestLedger,
              latestLedger: res.latestLedger,
            },
          });
        }
      } catch {
        // Fall through to Horizon if RPC misses or is unavailable
      }
    }

    const horizonUrl = this.getHorizonUrl(network);
    if (!horizonUrl) return null;

    try {
      const res = await fetchJsonWithTimeout<{
        successful: boolean;
        ledger: number;
        created_at: string;
        envelope_xdr: string;
        result_xdr: string;
        result_meta_xdr?: string;
        fee_charged?: string;
      }>(`${horizonUrl.replace(/\/$/, "")}/transactions/${encodeURIComponent(hash)}`);

      return decodeTransactionFromXdr({
        network,
        hash,
        status: res.successful ? "SUCCESS" : "FAILED",
        ledger: res.ledger,
        closedAt: res.created_at,
        envelopeXdr: res.envelope_xdr,
        resultXdr: res.result_xdr,
        resultMetaXdr: res.result_meta_xdr,
        feeChargedStroops: res.fee_charged,
        provider: this.name,
        coverage: {
          provider: this.name,
          method: "horizon/transactions",
        },
      });
    } catch {
      return null;
    }
  }

  async getContractEvents(
    network: StellarNetwork,
    contractId: string,
    options?: { startLedger?: number; limit?: number }
  ): Promise<{ events: DecodedEvent[]; coverage: CoverageInfo }> {
    const health = await this.getHealth(network);
    const startLedger =
      options?.startLedger ??
      (health.latestLedger
        ? Math.max(health.oldestLedger ?? 1, health.latestLedger - 5000)
        : undefined);

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
        provider: this.name,
        method: "rpc/getEvents",
        oldestLedger: health.oldestLedger,
        latestLedger: res.latestLedger ?? health.latestLedger,
        ledgerRetentionWindow: health.ledgerRetentionWindow,
      },
    };
  }
}
