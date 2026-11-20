import type {
  AssetMovement,
  CanonicalTransaction,
  DecodedEvent,
  DecodedOperation,
  HumanizedOperation,
  HumanizedTransaction,
} from "./providers/types";
import { formatAmount, formatDateTime, shortenAddress } from "./utils/format";

export const HUMANIZER_VERSION = 1;

function humanizeOperation(
  op: DecodedOperation,
  successful: boolean
): HumanizedOperation {
  const verbPrefix = successful ? "" : "Attempted to ";
  const fromLabel = shortenAddress(op.from ?? op.sourceAccount);
  const toLabel = shortenAddress(op.to);
  const assetCode = op.asset?.code ?? "XLM";
  const amountFormatted = op.amount ? formatAmount(op.amount) : "an unknown amount";

  switch (op.type) {
    case "payment":
      return {
        index: op.index,
        title: "Payment",
        category: "transfer",
        sentence: successful
          ? `Sent ${amountFormatted} ${assetCode} from ${fromLabel} to ${toLabel}.`
          : `${verbPrefix}send ${amountFormatted} ${assetCode} from ${fromLabel} to ${toLabel}.`,
      };

    case "create_account":
      return {
        index: op.index,
        title: "Create Account",
        category: "account",
        sentence: successful
          ? `Created a new Stellar account ${toLabel} with a starting balance of ${amountFormatted} XLM from ${fromLabel}.`
          : `${verbPrefix}create account ${toLabel} with ${amountFormatted} XLM from ${fromLabel}.`,
      };

    case "change_trust": {
      const isRemoving = op.limit === "0" || op.limit === "0.0000000";
      return {
        index: op.index,
        title: isRemoving ? "Remove Trustline" : "Add or Update Trustline",
        category: "trustline",
        sentence: successful
          ? isRemoving
            ? `Removed the trustline for ${assetCode}.`
            : `Added or updated a trustline for ${assetCode}${op.limit ? ` (limit: ${formatAmount(op.limit)})` : ""}.`
          : `${verbPrefix}${isRemoving ? "remove" : "add/update"} a trustline for ${assetCode}.`,
      };
    }

    case "path_payment_strict_send":
    case "path_payment_strict_receive": {
      const destCode = op.destAsset?.code ?? "asset";
      const destAmt = op.destAmount ? formatAmount(op.destAmount) : "an amount";
      const verb =
        op.type === "path_payment_strict_send"
          ? `Exchanged ${amountFormatted} ${assetCode} for at least ${destAmt} ${destCode}`
          : `Exchanged up to ${amountFormatted} ${assetCode} for ${destAmt} ${destCode}`;
      return {
        index: op.index,
        title: "Path Payment (Swap)",
        category: "swap",
        sentence: successful
          ? `${verb} and sent to ${toLabel}.`
          : `${verbPrefix}exchange ${assetCode} for ${destCode} to ${toLabel}.`,
      };
    }

    case "account_merge":
      return {
        index: op.index,
        title: "Account Merge",
        category: "account",
        sentence: successful
          ? `Closed account ${fromLabel} and transferred its remaining XLM balance to ${toLabel}.`
          : `${verbPrefix}merge account ${fromLabel} into ${toLabel}.`,
      };

    case "manage_data":
      return {
        index: op.index,
        title: "Manage Account Data",
        category: "data",
        sentence: successful
          ? op.dataValuePresent
            ? `Added or updated account metadata key "${op.dataName ?? "unknown"}".`
            : `Deleted account metadata key "${op.dataName ?? "unknown"}".`
          : `${verbPrefix}update account metadata key "${op.dataName ?? "unknown"}".`,
      };

    case "invoke_host_function": {
      const target = op.contractId
        ? `contract ${shortenAddress(op.contractId)}`
        : "a Soroban smart contract";
      const fn = op.functionName ? ` (function: ${op.functionName})` : "";
      return {
        index: op.index,
        title: "Soroban Contract Interaction",
        category: "contract",
        sentence: successful
          ? `Interacted with ${target}${fn}.`
          : `${verbPrefix}interact with ${target}${fn}.`,
      };
    }

    case "set_trust_line_flags":
    case "allow_trust": {
      const action =
        op.trustlineAuthorized === false ? "Revoked" : "Authorized";
      return {
        index: op.index,
        title: "Trustline Authorization",
        category: "trustline",
        sentence: successful
          ? `${action} trustline for ${assetCode} on account ${toLabel}.`
          : `${verbPrefix}${action.toLowerCase()} trustline for ${assetCode} on ${toLabel}.`,
      };
    }

    case "manage_sell_offer":
    case "manage_buy_offer":
      return {
        index: op.index,
        title: "DEX Order",
        category: "swap",
        sentence: successful
          ? `Placed or updated a DEX offer involving ${assetCode} and ${op.destAsset?.code ?? "another asset"}.`
          : `${verbPrefix}place or update a DEX offer for ${assetCode}.`,
      };

    case "create_claimable_balance":
      return {
        index: op.index,
        title: "Create Claimable Balance",
        category: "transfer",
        sentence: successful
          ? `Created a claimable balance of ${amountFormatted} ${assetCode}.`
          : `${verbPrefix}create a claimable balance of ${amountFormatted} ${assetCode}.`,
      };

    case "claim_claimable_balance":
      return {
        index: op.index,
        title: "Claim Balance",
        category: "transfer",
        sentence: successful
          ? `Claimed a pending claimable balance into ${toLabel}.`
          : `${verbPrefix}claim a claimable balance.`,
      };

    default:
      return {
        index: op.index,
        title: op.rawType || "Operation",
        category: "other",
        sentence: successful
          ? `Executed ${op.rawType || "an"} operation.`
          : `${verbPrefix}execute ${op.rawType || "an"} operation.`,
      };
  }
}

function extractAssetMovements(
  operations: DecodedOperation[],
  events: DecodedEvent[],
  successful: boolean
): AssetMovement[] {
  if (!successful) return [];

  const movements: AssetMovement[] = [];

  for (const op of operations) {
    if (op.type === "payment" || op.type === "create_account") {
      if (op.amount && op.asset) {
        movements.push({
          direction: "transfer",
          from: op.from ?? op.sourceAccount,
          to: op.to,
          assetCode: op.asset.code,
          assetIssuer: op.asset.issuer,
          amount: op.amount,
        });
      }
    } else if (
      op.type === "path_payment_strict_send" ||
      op.type === "path_payment_strict_receive"
    ) {
      if (op.asset && op.destAsset) {
        movements.push({
          direction: "swap",
          from: op.from ?? op.sourceAccount,
          to: op.to,
          assetCode: op.asset.code,
          assetIssuer: op.asset.issuer,
          amount: op.amount ?? "0",
          destAssetCode: op.destAsset.code,
          destAmount: op.destAmount,
        });
      }
    }
  }

  for (const ev of events) {
    if (ev.type === "sep41_transfer" && ev.amount) {
      movements.push({
        direction: "transfer",
        from: ev.from,
        to: ev.to,
        assetCode: ev.assetCode ?? `Token(${shortenAddress(ev.contractId)})`,
        amount: ev.amount,
      });
    } else if (ev.type === "sep41_mint" && ev.amount) {
      movements.push({
        direction: "mint",
        to: ev.to,
        assetCode: ev.assetCode ?? `Token(${shortenAddress(ev.contractId)})`,
        amount: ev.amount,
      });
    } else if (ev.type === "sep41_burn" && ev.amount) {
      movements.push({
        direction: "burn",
        from: ev.from,
        assetCode: ev.assetCode ?? `Token(${shortenAddress(ev.contractId)})`,
        amount: ev.amount,
      });
    }
  }

  return movements;
}

export function humanizeTransaction(
  tx: CanonicalTransaction
): HumanizedTransaction {
  const successful = tx.status === "SUCCESS";
  const humanizedOps = tx.operations.map((op) =>
    humanizeOperation(op, successful)
  );
  const assetMovements = extractAssetMovements(
    tx.operations,
    tx.events,
    successful
  );

  const receiversSet = new Set<string>();
  for (const op of tx.operations) {
    if (op.to) receiversSet.add(op.to);
  }
  for (const m of assetMovements) {
    if (m.to) receiversSet.add(m.to);
  }

  const feeDescription = tx.feeChargedXlm
    ? `${tx.feeChargedXlm} XLM`
    : "unknown fee";

  const ledgerDescription = tx.ledger
    ? `Ledger ${tx.ledger.toLocaleString("en-US")}${tx.closedAt ? ` (${formatDateTime(tx.closedAt)})` : ""}`
    : tx.closedAt
    ? formatDateTime(tx.closedAt)
    : "Ledger unavailable";

  const memoDescription = tx.memo
    ? `${tx.memo.type}: ${tx.memo.value}`
    : undefined;

  let summary: string;

  if (tx.status === "NOT_FOUND") {
    summary =
      "This transaction could not be found in the current provider's available history window.";
  } else if (!successful) {
    const firstOp = humanizedOps[0]?.sentence ?? "execute an operation.";
    const cleaned = firstOp.replace(/^Attempted to /, "");
    summary = `This transaction failed on Stellar while attempting to ${cleaned} It was included in ${ledgerDescription} and charged a fee of ${feeDescription}.`;
  } else if (humanizedOps.length === 0) {
    summary = `This transaction succeeded in ${ledgerDescription} and charged a fee of ${feeDescription}.`;
  } else if (humanizedOps.length === 1) {
    const op = tx.operations[0];
    if (
      (op.type === "payment" || op.type === "create_account") &&
      op.amount &&
      op.asset
    ) {
      summary = `This transaction successfully transferred ${formatAmount(op.amount)} ${op.asset.code} from wallet ${shortenAddress(op.from ?? tx.sourceAccount)} to wallet ${shortenAddress(op.to)}. It was included in ${ledgerDescription} and charged a fee of ${feeDescription}.`;
    } else if (
      op.type === "invoke_host_function" &&
      assetMovements.length > 0
    ) {
      const firstMove = assetMovements[0];
      summary = `This transaction successfully executed a Soroban contract call that ${firstMove.direction === "mint" ? "minted" : firstMove.direction === "burn" ? "burned" : "transferred"} ${formatAmount(firstMove.amount)} ${firstMove.assetCode}${firstMove.to ? ` to ${shortenAddress(firstMove.to)}` : ""}. It was included in ${ledgerDescription} and charged a fee of ${feeDescription}.`;
    } else {
      summary = `This transaction succeeded: ${humanizedOps[0].sentence} Included in ${ledgerDescription} with a fee of ${feeDescription}.`;
    }
  } else {
    const opSummaryList = humanizedOps
      .slice(0, 3)
      .map((o) => o.title.toLowerCase())
      .join(", ");
    const extraCount =
      humanizedOps.length > 3 ? ` and ${humanizedOps.length - 3} more` : "";
    summary = `This transaction successfully executed ${humanizedOps.length} operations (${opSummaryList}${extraCount}) from ${shortenAddress(tx.sourceAccount)}. Included in ${ledgerDescription} with a fee of ${feeDescription}.`;
  }

  return {
    summary,
    statusLabel:
      tx.status === "SUCCESS"
        ? "Succeeded"
        : tx.status === "FAILED"
        ? "Failed"
        : "Not Found",
    successful,
    sender: tx.sourceAccount,
    receivers: Array.from(receiversSet),
    assetMovements,
    feeDescription,
    ledgerDescription,
    memoDescription,
    operations: humanizedOps,
    humanizerVersion: HUMANIZER_VERSION,
  };
}
