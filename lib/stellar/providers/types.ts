import type { StellarNetwork } from "../validation";

export type ProviderName = "alchemy" | "quicknode" | "horizon_public" | "cache";

export interface CoverageInfo {
  provider: ProviderName;
  method: string;
  oldestLedger?: number;
  latestLedger?: number;
  ledgerRetentionWindow?: number;
  oldestTimestamp?: string;
  latestTimestamp?: string;
  asOfLedger?: number;
  isPartial?: boolean;
  note?: string;
}

export interface AssetIdentifier {
  type: "native" | "credit_alphanum4" | "credit_alphanum12" | "soroban";
  code: string;
  issuer?: string;
  contractId?: string;
}

export interface AccountBalance {
  asset: AssetIdentifier;
  balance: string;
  limit?: string;
  isAuthorized?: boolean;
}

export interface AccountBalancesResult {
  network: StellarNetwork;
  address: string;
  balances: AccountBalance[];
  asOfLedger?: number;
  fetchedAt: string;
  coverage: CoverageInfo;
  label?: string;
}

export interface TransferRecord {
  id: string;
  txHash: string;
  ledger?: number;
  timestamp: string;
  direction: "incoming" | "outgoing" | "self";
  from: string;
  to: string;
  asset: AssetIdentifier;
  amount: string;
  operationType: string;
  successful: boolean;
  memo?: string;
}

export interface AccountTransfersResult {
  network: StellarNetwork;
  address: string;
  transfers: TransferRecord[];
  nextPageKey?: string;
  pagesFetched: number;
  isPartial: boolean;
  fetchedAt: string;
  coverage: CoverageInfo;
}

export type DecodedOperationType =
  | "payment"
  | "create_account"
  | "change_trust"
  | "path_payment_strict_send"
  | "path_payment_strict_receive"
  | "account_merge"
  | "manage_data"
  | "invoke_host_function"
  | "set_trust_line_flags"
  | "allow_trust"
  | "manage_sell_offer"
  | "manage_buy_offer"
  | "create_claimable_balance"
  | "claim_claimable_balance"
  | "unknown";

export interface DecodedOperation {
  index: number;
  type: DecodedOperationType;
  rawType: string;
  sourceAccount?: string;
  from?: string;
  to?: string;
  asset?: AssetIdentifier;
  amount?: string;
  destAsset?: AssetIdentifier;
  destAmount?: string;
  limit?: string;
  contractId?: string;
  functionName?: string;
  dataName?: string;
  dataValuePresent?: boolean;
  trustlineAuthorized?: boolean;
  details: Record<string, unknown>;
}

export interface DecodedEvent {
  index: number;
  contractId: string;
  type: "sep41_transfer" | "sep41_mint" | "sep41_burn" | "contract_event";
  topics: string[];
  from?: string;
  to?: string;
  amount?: string;
  assetCode?: string;
  rawValue?: unknown;
}

export interface CanonicalTransaction {
  network: StellarNetwork;
  hash: string;
  status: "SUCCESS" | "FAILED" | "NOT_FOUND";
  ledger?: number;
  closedAt?: string;
  sourceAccount?: string;
  feeChargedStroops?: string;
  feeChargedXlm?: string;
  memo?: {
    type: string;
    value: string;
  };
  operations: DecodedOperation[];
  events: DecodedEvent[];
  envelopeXdr?: string;
  resultXdr?: string;
  resultMetaXdr?: string;
  provider: ProviderName;
  fetchedAt: string;
  coverage: CoverageInfo;
}

export interface HumanizedOperation {
  index: number;
  title: string;
  sentence: string;
  category: "transfer" | "account" | "trustline" | "swap" | "contract" | "data" | "other";
}

export interface AssetMovement {
  direction: "transfer" | "mint" | "burn" | "swap";
  from?: string;
  to?: string;
  assetCode: string;
  assetIssuer?: string;
  amount: string;
  destAssetCode?: string;
  destAmount?: string;
}

export interface HumanizedTransaction {
  summary: string;
  statusLabel: string;
  successful: boolean;
  sender?: string;
  receivers: string[];
  assetMovements: AssetMovement[];
  feeDescription: string;
  ledgerDescription: string;
  memoDescription?: string;
  operations: HumanizedOperation[];
  humanizerVersion: number;
}

export interface ProviderHealth {
  provider: ProviderName;
  available: boolean;
  oldestLedger?: number;
  latestLedger?: number;
  ledgerRetentionWindow?: number;
  checkedAt: string;
}

export interface StellarProvider {
  name: ProviderName;
  isConfigured(network: StellarNetwork): boolean;
  getHealth(network: StellarNetwork): Promise<ProviderHealth>;
  getAccountBalances(
    network: StellarNetwork,
    address: string
  ): Promise<AccountBalancesResult>;
  getAccountTransfers(
    network: StellarNetwork,
    address: string,
    options?: {
      limit?: number;
      pageKey?: string;
      from?: string;
      to?: string;
    }
  ): Promise<AccountTransfersResult>;
  getTransaction(
    network: StellarNetwork,
    hash: string
  ): Promise<CanonicalTransaction | null>;
  getContractEvents?(
    network: StellarNetwork,
    contractId: string,
    options?: { startLedger?: number; limit?: number }
  ): Promise<{ events: DecodedEvent[]; coverage: CoverageInfo }>;
}
