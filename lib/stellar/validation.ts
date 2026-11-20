import { StrKey } from "@stellar/stellar-sdk";

export type StellarNetwork = "mainnet" | "testnet";

export type InputClassification =
  | { type: "account"; address: string }
  | { type: "transaction"; hash: string }
  | { type: "contract"; contractId: string }
  | { type: "natural_language"; query: string };

const TX_HASH_REGEX = /^[0-9a-fA-F]{64}$/;

export function isValidAccountAddress(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed.startsWith("G") || trimmed.length !== 56) {
    return false;
  }
  try {
    return StrKey.isValidEd25519PublicKey(trimmed);
  } catch {
    return false;
  }
}

export function isValidContractId(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed.startsWith("C") || trimmed.length !== 56) {
    return false;
  }
  try {
    return StrKey.isValidContract(trimmed);
  } catch {
    return false;
  }
}

export function isValidTxHash(value: string): boolean {
  return TX_HASH_REGEX.test(value.trim());
}

export function normalizeNetwork(network?: string | null): StellarNetwork {
  return network === "testnet" ? "testnet" : "mainnet";
}

export function classifyInput(rawInput: string): InputClassification {
  const trimmed = rawInput.trim();

  if (isValidAccountAddress(trimmed)) {
    return { type: "account", address: trimmed };
  }

  if (isValidTxHash(trimmed)) {
    return { type: "transaction", hash: trimmed.toLowerCase() };
  }

  if (isValidContractId(trimmed)) {
    return { type: "contract", contractId: trimmed };
  }

  return { type: "natural_language", query: trimmed };
}

/**
 * Extract the first valid Stellar account address or transaction hash
 * embedded inside a natural-language question.
 */
export function extractStellarEntities(text: string): {
  addresses: string[];
  txHashes: string[];
  contractIds: string[];
} {
  const tokens = text.split(/[\s,;:!?()"'`]+/).filter(Boolean);
  const addresses: string[] = [];
  const txHashes: string[] = [];
  const contractIds: string[] = [];

  for (const token of tokens) {
    if (isValidAccountAddress(token) && !addresses.includes(token)) {
      addresses.push(token);
    } else if (isValidTxHash(token)) {
      const normalized = token.toLowerCase();
      if (!txHashes.includes(normalized)) {
        txHashes.push(normalized);
      }
    } else if (isValidContractId(token) && !contractIds.includes(token)) {
      contractIds.push(token);
    }
  }

  return { addresses, txHashes, contractIds };
}
