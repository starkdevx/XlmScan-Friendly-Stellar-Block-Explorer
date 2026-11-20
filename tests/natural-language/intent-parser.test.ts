import { describe, expect, it, beforeEach } from "vitest";
import { Keypair } from "@stellar/stellar-sdk";
import {
  parseIntentDeterministic,
  resetAiRouterState,
  selectProviderOrder,
} from "@/lib/ai/intent-parser";
import { buildQueryCacheKey } from "@/lib/ai/query-executor";

describe("Natural-language intent parser", () => {
  const wallet = Keypair.random().publicKey();
  const txHash = "e".repeat(64);
  const fixedNow = new Date("2026-11-19T12:00:00Z");

  it("parses incoming USDC sum question with time range", () => {
    const intent = parseIntentDeterministic(
      `How much USDC did ${wallet} receive this week?`,
      undefined,
      fixedNow
    );
    expect(intent.intent).toBe("account_transfers");
    expect(intent.address).toBe(wallet);
    expect(intent.direction).toBe("incoming");
    expect(intent.asset?.code).toBe("USDC");
    expect(intent.aggregation).toBe("sum");
    expect(intent.time_range?.label).toBe("during the last 7 days");
  });

  it("reuses wallet page context for follow-up questions", () => {
    const intent = parseIntentDeterministic(
      "Show the last 5 transfers",
      { address: wallet },
      fixedNow
    );
    expect(intent.intent).toBe("account_transfers");
    expect(intent.address).toBe(wallet);
    expect(intent.limit).toBe(5);
  });

  it("returns ambiguous when no wallet context is provided", () => {
    const intent = parseIntentDeterministic(
      "How much did it receive?",
      undefined,
      fixedNow
    );
    expect(intent.intent).toBe("ambiguous");
    expect(intent.clarification_needed).toBeTruthy();
  });

  it("parses transaction questions", () => {
    const intent = parseIntentDeterministic(
      `Did transaction ${txHash} succeed?`,
      undefined,
      fixedNow
    );
    expect(intent.intent).toBe("transaction_details");
    expect(intent.txHash).toBe(txHash);
  });

  it("builds identical cache keys for equivalent resolved filters", () => {
    const a = parseIntentDeterministic(
      `How much USDC did ${wallet} receive in the last 7 days?`,
      undefined,
      fixedNow
    );
    const b = parseIntentDeterministic(
      `Show total USDC received by ${wallet} this week`,
      undefined,
      fixedNow
    );
    expect(buildQueryCacheKey("mainnet", a)).toBe(
      buildQueryCacheKey("mainnet", b)
    );
  });

  it("routes requests 2:1 between Groq and Gemini in weighted_round_robin", () => {
    resetAiRouterState();
    expect(selectProviderOrder(true, true, "weighted_round_robin")).toEqual([
      "groq",
      "gemini",
    ]);
    expect(selectProviderOrder(true, true, "weighted_round_robin")).toEqual([
      "groq",
      "gemini",
    ]);
    expect(selectProviderOrder(true, true, "weighted_round_robin")).toEqual([
      "gemini",
      "groq",
    ]);
  });

  it("alternates 1:1 in round_robin mode", () => {
    resetAiRouterState();
    expect(selectProviderOrder(true, true, "round_robin")).toEqual([
      "groq",
      "gemini",
    ]);
    expect(selectProviderOrder(true, true, "round_robin")).toEqual([
      "gemini",
      "groq",
    ]);
  });
});
