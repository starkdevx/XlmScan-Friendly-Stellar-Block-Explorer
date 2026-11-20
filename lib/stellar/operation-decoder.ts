import { Address, xdr } from "@stellar/stellar-sdk";
import type {
  AssetIdentifier,
  DecodedOperation,
  DecodedOperationType,
} from "./providers/types";

function decodeAsset(asset: unknown): AssetIdentifier {
  if (!asset || typeof asset !== "object") {
    return { type: "native", code: "XLM" };
  }

  const a = asset as {
    code?: string;
    issuer?: string;
    isNative?: () => boolean;
    getCode?: () => string;
    getIssuer?: () => string;
  };

  if (typeof a.isNative === "function" && a.isNative()) {
    return { type: "native", code: "XLM" };
  }

  const code =
    typeof a.getCode === "function" ? a.getCode() : a.code ?? "UNKNOWN";
  const issuer =
    typeof a.getIssuer === "function" ? a.getIssuer() : a.issuer;

  if (code === "XLM" && !issuer) {
    return { type: "native", code: "XLM" };
  }

  return {
    type: code.length <= 4 ? "credit_alphanum4" : "credit_alphanum12",
    code,
    issuer,
  };
}

function mapOperationType(rawType: string): DecodedOperationType {
  switch (rawType) {
    case "payment":
      return "payment";
    case "createAccount":
      return "create_account";
    case "changeTrust":
      return "change_trust";
    case "pathPaymentStrictSend":
      return "path_payment_strict_send";
    case "pathPaymentStrictReceive":
      return "path_payment_strict_receive";
    case "accountMerge":
      return "account_merge";
    case "manageData":
      return "manage_data";
    case "invokeHostFunction":
      return "invoke_host_function";
    case "setTrustLineFlags":
      return "set_trust_line_flags";
    case "allowTrust":
      return "allow_trust";
    case "manageSellOffer":
      return "manage_sell_offer";
    case "manageBuyOffer":
      return "manage_buy_offer";
    case "createClaimableBalance":
      return "create_claimable_balance";
    case "claimClaimableBalance":
      return "claim_claimable_balance";
    default:
      return "unknown";
  }
}

function tryExtractInvokeContractInfo(op: Record<string, unknown>): {
  contractId?: string;
  functionName?: string;
} {
  try {
    const func = op.func as xdr.HostFunction | undefined;
    if (!func || typeof func.switch !== "function") {
      return {};
    }
    const switchName = func.switch().name;
    if (switchName === "hostFunctionTypeInvokeContract") {
      const invokeArgs = func.invokeContract();
      const contractAddress = invokeArgs.contractAddress();
      const contractId = Address.fromScAddress(contractAddress).toString();
      const functionName = invokeArgs.functionName().toString();
      return { contractId, functionName };
    }
    return { functionName: switchName };
  } catch {
    return {};
  }
}

export function decodeOperation(
  rawOp: Record<string, unknown>,
  index: number,
  txSourceAccount?: string
): DecodedOperation {
  const rawType = String(rawOp.type ?? "unknown");
  const type = mapOperationType(rawType);
  const sourceAccount =
    typeof rawOp.source === "string" ? rawOp.source : txSourceAccount;

  const base: DecodedOperation = {
    index,
    type,
    rawType,
    sourceAccount,
    details: {},
  };

  switch (type) {
    case "payment": {
      return {
        ...base,
        from: sourceAccount,
        to: typeof rawOp.destination === "string" ? rawOp.destination : undefined,
        asset: decodeAsset(rawOp.asset),
        amount: rawOp.amount != null ? String(rawOp.amount) : undefined,
      };
    }

    case "create_account": {
      return {
        ...base,
        from: sourceAccount,
        to: typeof rawOp.destination === "string" ? rawOp.destination : undefined,
        asset: { type: "native", code: "XLM" },
        amount:
          rawOp.startingBalance != null ? String(rawOp.startingBalance) : undefined,
      };
    }

    case "change_trust": {
      const line = rawOp.line;
      return {
        ...base,
        asset: decodeAsset(line),
        limit: rawOp.limit != null ? String(rawOp.limit) : undefined,
      };
    }

    case "path_payment_strict_send": {
      return {
        ...base,
        from: sourceAccount,
        to: typeof rawOp.destination === "string" ? rawOp.destination : undefined,
        asset: decodeAsset(rawOp.sendAsset),
        amount: rawOp.sendAmount != null ? String(rawOp.sendAmount) : undefined,
        destAsset: decodeAsset(rawOp.destAsset),
        destAmount: rawOp.destMin != null ? String(rawOp.destMin) : undefined,
      };
    }

    case "path_payment_strict_receive": {
      return {
        ...base,
        from: sourceAccount,
        to: typeof rawOp.destination === "string" ? rawOp.destination : undefined,
        asset: decodeAsset(rawOp.sendAsset),
        amount: rawOp.sendMax != null ? String(rawOp.sendMax) : undefined,
        destAsset: decodeAsset(rawOp.destAsset),
        destAmount:
          rawOp.destAmount != null ? String(rawOp.destAmount) : undefined,
      };
    }

    case "account_merge": {
      return {
        ...base,
        from: sourceAccount,
        to: typeof rawOp.destination === "string" ? rawOp.destination : undefined,
        asset: { type: "native", code: "XLM" },
      };
    }

    case "manage_data": {
      return {
        ...base,
        dataName: typeof rawOp.name === "string" ? rawOp.name : undefined,
        dataValuePresent: rawOp.value != null,
      };
    }

    case "invoke_host_function": {
      const { contractId, functionName } = tryExtractInvokeContractInfo(rawOp);
      return {
        ...base,
        contractId,
        functionName,
      };
    }

    case "set_trust_line_flags":
    case "allow_trust": {
      const flags = rawOp.flags as { authorized?: boolean } | undefined;
      const authorized =
        typeof rawOp.authorize === "boolean"
          ? rawOp.authorize
          : typeof flags?.authorized === "boolean"
          ? flags.authorized
          : undefined;
      return {
        ...base,
        to: typeof rawOp.trustor === "string" ? rawOp.trustor : undefined,
        asset:
          rawOp.asset != null
            ? decodeAsset(rawOp.asset)
            : typeof rawOp.assetCode === "string"
            ? {
                type:
                  rawOp.assetCode.length <= 4
                    ? "credit_alphanum4"
                    : "credit_alphanum12",
                code: rawOp.assetCode,
                issuer: sourceAccount,
              }
            : undefined,
        trustlineAuthorized: authorized,
      };
    }

    case "manage_sell_offer":
    case "manage_buy_offer": {
      return {
        ...base,
        asset: decodeAsset(rawOp.selling),
        destAsset: decodeAsset(rawOp.buying),
        amount: rawOp.amount != null ? String(rawOp.amount) : undefined,
        details: {
          price: rawOp.price != null ? String(rawOp.price) : undefined,
          offerId: rawOp.offerId != null ? String(rawOp.offerId) : undefined,
        },
      };
    }

    case "create_claimable_balance": {
      return {
        ...base,
        from: sourceAccount,
        asset: decodeAsset(rawOp.asset),
        amount: rawOp.amount != null ? String(rawOp.amount) : undefined,
      };
    }

    case "claim_claimable_balance": {
      return {
        ...base,
        to: sourceAccount,
        details: {
          balanceId: rawOp.balanceId != null ? String(rawOp.balanceId) : undefined,
        },
      };
    }

    default:
      return base;
  }
}
