import {
  FeeBumpTransaction,
  Networks,
  Transaction,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import type { StellarNetwork } from "./validation";
import type {
  CanonicalTransaction,
  DecodedEvent,
  DecodedOperation,
  ProviderName,
  CoverageInfo,
} from "./providers/types";
import { decodeOperation } from "./operation-decoder";
import { extractEventsFromResultMetaXdr } from "./event-decoder";
import { stroopsToXlm } from "./utils/format";

export function getNetworkPassphrase(network: StellarNetwork): string {
  return network === "testnet" ? Networks.TESTNET : Networks.PUBLIC;
}

function decodeMemo(memo: Transaction["memo"]): { type: string; value: string } | undefined {
  if (!memo || memo.type === "none") return undefined;
  const val = memo.value;
  if (val == null) return undefined;
  if (Buffer.isBuffer(val)) {
    return {
      type: memo.type,
      value: memo.type === "text" ? val.toString("utf8") : val.toString("hex"),
    };
  }
  return { type: memo.type, value: String(val) };
}

function extractFeeChargedFromResultXdr(resultXdr?: string): string | undefined {
  if (!resultXdr) return undefined;
  try {
    const res = xdr.TransactionResult.fromXDR(resultXdr, "base64");
    return res.feeCharged().toString();
  } catch {
    return undefined;
  }
}

export interface RawRpcTransactionInput {
  network: StellarNetwork;
  hash: string;
  status: "SUCCESS" | "FAILED";
  ledger?: number;
  closedAt?: string;
  envelopeXdr?: string;
  resultXdr?: string;
  resultMetaXdr?: string;
  feeChargedStroops?: string;
  provider: ProviderName;
  coverage: CoverageInfo;
  events?: DecodedEvent[];
}

export function decodeTransactionFromXdr(
  input: RawRpcTransactionInput
): CanonicalTransaction {
  const passphrase = getNetworkPassphrase(input.network);
  let sourceAccount: string | undefined;
  let memo: { type: string; value: string } | undefined;
  let operations: DecodedOperation[] = [];
  let feeStroops =
    input.feeChargedStroops ?? extractFeeChargedFromResultXdr(input.resultXdr);

  if (input.envelopeXdr) {
    try {
      const parsed = TransactionBuilder.fromXDR(input.envelopeXdr, passphrase);
      const innerTx =
        parsed instanceof FeeBumpTransaction ? parsed.innerTransaction : parsed;

      sourceAccount =
        parsed instanceof FeeBumpTransaction
          ? parsed.feeSource
          : innerTx.source;

      if (!feeStroops) {
        feeStroops = parsed.fee;
      }

      memo = decodeMemo(innerTx.memo);
      operations = innerTx.operations.map((op, index) =>
        decodeOperation(op as unknown as Record<string, unknown>, index, innerTx.source)
      );
    } catch {
      // Preserve raw XDR even if envelope decoding fails on a future protocol
    }
  }

  const events =
    input.events && input.events.length > 0
      ? input.events
      : extractEventsFromResultMetaXdr(input.resultMetaXdr);

  return {
    network: input.network,
    hash: input.hash.toLowerCase(),
    status: input.status,
    ledger: input.ledger,
    closedAt: input.closedAt,
    sourceAccount,
    feeChargedStroops: feeStroops,
    feeChargedXlm: feeStroops ? stroopsToXlm(feeStroops) : undefined,
    memo,
    operations,
    events,
    envelopeXdr: input.envelopeXdr,
    resultXdr: input.resultXdr,
    resultMetaXdr: input.resultMetaXdr,
    provider: input.provider,
    fetchedAt: new Date().toISOString(),
    coverage: input.coverage,
  };
}
