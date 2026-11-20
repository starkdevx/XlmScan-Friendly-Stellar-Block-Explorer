import { scValToNative, xdr } from "@stellar/stellar-sdk";
import type { DecodedEvent } from "./providers/types";
import { stroopsToXlm } from "./utils/format";

function safeScValToNative(scVal: xdr.ScVal): unknown {
  try {
    const val = scValToNative(scVal);
    if (typeof val === "bigint") {
      return val.toString();
    }
    return val;
  } catch {
    return "[unparsed ScVal]";
  }
}

function formatTokenAmount(rawAmount: unknown): string | undefined {
  if (rawAmount == null) return undefined;
  if (typeof rawAmount === "bigint" || typeof rawAmount === "number") {
    return stroopsToXlm(rawAmount.toString());
  }
  if (typeof rawAmount === "string" && /^-?\d+$/.test(rawAmount)) {
    return stroopsToXlm(rawAmount);
  }
  if (
    typeof rawAmount === "object" &&
    rawAmount !== null &&
    "amount" in rawAmount
  ) {
    return formatTokenAmount((rawAmount as { amount: unknown }).amount);
  }
  return String(rawAmount);
}

export function decodeContractEventFromXdr(
  contractId: string,
  topicXdrs: string[],
  valueXdr: string | undefined,
  index: number
): DecodedEvent {
  const topics: string[] = [];
  for (const t of topicXdrs) {
    try {
      const scVal = xdr.ScVal.fromXDR(t, "base64");
      const native = safeScValToNative(scVal);
      topics.push(typeof native === "string" ? native : JSON.stringify(native));
    } catch {
      topics.push(t);
    }
  }

  let rawValue: unknown = undefined;
  if (valueXdr) {
    try {
      const scVal = xdr.ScVal.fromXDR(valueXdr, "base64");
      rawValue = safeScValToNative(scVal);
    } catch {
      rawValue = valueXdr;
    }
  }

  const eventName = topics[0]?.toLowerCase();

  // SEP-41 standard token events:
  // transfer: topics = ["transfer", from, to, asset?], data = amount (or { amount })
  if (eventName === "transfer" && topics.length >= 3) {
    return {
      index,
      contractId,
      type: "sep41_transfer",
      topics,
      from: topics[1],
      to: topics[2],
      amount: formatTokenAmount(rawValue),
      assetCode: topics[3] ? topics[3].split(":")[0] : undefined,
      rawValue,
    };
  }

  // mint: topics = ["mint", admin, to, asset?] or ["mint", to, asset?]
  if (eventName === "mint" && topics.length >= 2) {
    const to = topics.length >= 3 ? topics[2] : topics[1];
    return {
      index,
      contractId,
      type: "sep41_mint",
      topics,
      to,
      amount: formatTokenAmount(rawValue),
      assetCode: topics[3] ? topics[3].split(":")[0] : undefined,
      rawValue,
    };
  }

  // burn: topics = ["burn", from, asset?]
  if (eventName === "burn" && topics.length >= 2) {
    return {
      index,
      contractId,
      type: "sep41_burn",
      topics,
      from: topics[1],
      amount: formatTokenAmount(rawValue),
      assetCode: topics[2] ? topics[2].split(":")[0] : undefined,
      rawValue,
    };
  }

  return {
    index,
    contractId,
    type: "contract_event",
    topics,
    rawValue,
  };
}

export function extractEventsFromResultMetaXdr(
  resultMetaXdr?: string
): DecodedEvent[] {
  if (!resultMetaXdr) return [];
  try {
    const meta = xdr.TransactionMeta.fromXDR(resultMetaXdr, "base64");
    if (meta.switch() !== 3) {
      return [];
    }
    const v3 = meta.v3();
    const sorobanMeta = v3.sorobanMeta();
    if (!sorobanMeta) return [];

    const events = sorobanMeta.events();
    return events.map((ev, idx) => {
      const contractId = ev.contractId()
        ? Buffer.from(ev.contractId()!).toString("hex")
        : "unknown";
      const body = ev.body().v0();
      const topicXdrs = body.topics().map((t) => t.toXDR("base64"));
      const valueXdr = body.data().toXDR("base64");
      return decodeContractEventFromXdr(contractId, topicXdrs, valueXdr, idx);
    });
  } catch {
    return [];
  }
}
