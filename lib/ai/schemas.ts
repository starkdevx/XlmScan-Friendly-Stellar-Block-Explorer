import { z } from "zod";
import type { CoverageInfo, TransferRecord } from "../stellar/providers/types";

export const IntentTypeSchema = z.enum([
  "account_transfers",
  "account_balances",
  "transaction_details",
  "contract_events",
  "ambiguous",
]);

export const DirectionSchema = z.enum(["incoming", "outgoing", "all"]);

export const AggregationSchema = z.enum([
  "sum",
  "count",
  "list",
  "senders",
  "failed_count",
]);

export const ParsedIntentSchema = z.object({
  intent: IntentTypeSchema,
  address: z.string().optional(),
  txHash: z.string().optional(),
  contractId: z.string().optional(),
  direction: DirectionSchema.default("all"),
  asset: z
    .object({
      code: z.string().min(1).max(12),
    })
    .optional(),
  time_range: z
    .object({
      from: z.string().optional(),
      to: z.string().optional(),
      label: z.string().optional(),
    })
    .optional(),
  aggregation: AggregationSchema.default("list"),
  limit: z.number().int().min(1).max(50).optional(),
  clarification_needed: z.string().optional(),
});

export type ParsedIntent = z.infer<typeof ParsedIntentSchema>;

export interface NaturalLanguageQueryResult {
  question: string;
  network: "mainnet" | "testnet";
  parsedIntent: ParsedIntent;
  headline: string;
  subheadline: string;
  answer: string;
  needsClarification?: boolean;
  clarificationMessage?: string;
  evidence: {
    transfers?: TransferRecord[];
    transactionHash?: string;
    balances?: Array<{ code: string; balance: string; issuer?: string }>;
  };
  coverage: CoverageInfo;
  cached: boolean;
}
