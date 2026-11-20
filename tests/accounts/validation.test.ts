import { describe, expect, it } from "vitest";
import { Keypair } from "@stellar/stellar-sdk";
import {
  classifyInput,
  extractStellarEntities,
  isValidAccountAddress,
  isValidContractId,
  isValidTxHash,
} from "@/lib/stellar/validation";

describe("Stellar input validation", () => {
  const validPubKey = Keypair.random().publicKey();
  const validHash = "a".repeat(64);
  const validContractId = "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM";

  it("validates G... account addresses", () => {
    expect(isValidAccountAddress(validPubKey)).toBe(true);
    expect(isValidAccountAddress("GINVALID")).toBe(false);
    expect(isValidAccountAddress("")).toBe(false);
  });

  it("validates 64-char hex transaction hashes", () => {
    expect(isValidTxHash(validHash)).toBe(true);
    expect(isValidTxHash("0123456789abcdef".repeat(4))).toBe(true);
    expect(isValidTxHash("z".repeat(64))).toBe(false);
    expect(isValidTxHash("abc")).toBe(false);
  });

  it("validates C... contract IDs", () => {
    expect(isValidContractId(validContractId)).toBe(true);
    expect(isValidContractId(validPubKey)).toBe(false);
  });

  it("classifies search input accurately", () => {
    expect(classifyInput(validPubKey)).toEqual({
      type: "account",
      address: validPubKey,
    });
    expect(classifyInput(validHash.toUpperCase())).toEqual({
      type: "transaction",
      hash: validHash,
    });
    expect(classifyInput(validContractId)).toEqual({
      type: "contract",
      contractId: validContractId,
    });
    expect(classifyInput("What did this wallet receive today?")).toEqual({
      type: "natural_language",
      query: "What did this wallet receive today?",
    });
  });

  it("extracts Stellar entities from natural language", () => {
    const text = `How much USDC did ${validPubKey} send in tx ${validHash}?`;
    const entities = extractStellarEntities(text);
    expect(entities.addresses).toEqual([validPubKey]);
    expect(entities.txHashes).toEqual([validHash]);
  });
});
