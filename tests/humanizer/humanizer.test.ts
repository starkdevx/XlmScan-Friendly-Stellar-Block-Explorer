import { describe, expect, it } from "vitest";
import { humanizeTransaction } from "@/lib/stellar/humanizer";
import type { CanonicalTransaction } from "@/lib/stellar/providers/types";

function makeBaseTx(
  overrides: Partial<CanonicalTransaction> = {}
): CanonicalTransaction {
  return {
    network: "mainnet",
    hash: "d".repeat(64),
    status: "SUCCESS",
    ledger: 65123456,
    closedAt: "2026-11-18T10:00:00Z",
    sourceAccount: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    feeChargedStroops: "100",
    feeChargedXlm: "0.00001",
    operations: [
      {
        index: 0,
        type: "payment",
        rawType: "payment",
        from: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
        to: "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
        asset: { type: "credit_alphanum4", code: "USDC" },
        amount: "150",
        details: {},
      },
    ],
    events: [],
    provider: "alchemy",
    fetchedAt: "2026-11-18T10:00:05Z",
    coverage: { provider: "alchemy", method: "rpc/getTransaction" },
    ...overrides,
  };
}

describe("Deterministic humanizer", () => {
  it("explains a successful single payment in plain English", () => {
    const res = humanizeTransaction(makeBaseTx());
    expect(res.successful).toBe(true);
    expect(res.statusLabel).toBe("Succeeded");
    expect(res.summary).toContain("successfully transferred 150 USDC");
    expect(res.summary).toContain("0.00001 XLM");
    expect(res.assetMovements).toHaveLength(1);
  });

  it("never describes a failed transaction as completed", () => {
    const res = humanizeTransaction(makeBaseTx({ status: "FAILED" }));
    expect(res.successful).toBe(false);
    expect(res.statusLabel).toBe("Failed");
    expect(res.summary.toLowerCase()).toContain("failed");
    expect(res.summary.toLowerCase()).not.toContain("successfully transferred");
    expect(res.assetMovements).toHaveLength(0);
    expect(res.operations[0].sentence).toContain("Attempted to send 150 USDC");
  });

  it("describes multi-operation transactions completely", () => {
    const res = humanizeTransaction(
      makeBaseTx({
        operations: [
          {
            index: 0,
            type: "change_trust",
            rawType: "changeTrust",
            asset: { type: "credit_alphanum4", code: "USDC" },
            limit: "1000",
            details: {},
          },
          {
            index: 1,
            type: "payment",
            rawType: "payment",
            from: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
            to: "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
            asset: { type: "credit_alphanum4", code: "USDC" },
            amount: "25",
            details: {},
          },
        ],
      })
    );
    expect(res.operations).toHaveLength(2);
    expect(res.summary).toContain("executed 2 operations");
  });

  it("extracts SEP-41 token transfers from Soroban events", () => {
    const res = humanizeTransaction(
      makeBaseTx({
        operations: [
          {
            index: 0,
            type: "invoke_host_function",
            rawType: "invokeHostFunction",
            contractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM",
            functionName: "transfer",
            details: {},
          },
        ],
        events: [
          {
            index: 0,
            contractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM",
            type: "sep41_transfer",
            topics: ["transfer", "GFROM", "GTO"],
            from: "GFROM",
            to: "GTO",
            amount: "50",
            assetCode: "USDC",
          },
        ],
      })
    );
    expect(res.summary).toContain("Soroban contract call");
    expect(res.summary).toContain("50 USDC");
    expect(res.assetMovements).toHaveLength(1);
  });
});
