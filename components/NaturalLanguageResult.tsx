"use client";

import Link from "next/link";
import { Sparkles, HelpCircle } from "lucide-react";
import type { NaturalLanguageQueryResult } from "@/lib/ai/schemas";
import { ActivityList } from "./ActivityList";
import { BalanceList } from "./BalanceList";
import { HistoryWarning } from "./HistoryWarning";

interface NaturalLanguageResultProps {
  result: NaturalLanguageQueryResult;
}

export function NaturalLanguageResult({ result }: NaturalLanguageResultProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">
          {result.needsClarification ? (
            <HelpCircle className="h-4 w-4" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          <span>
            {result.needsClarification ? "Clarification needed" : "Query completed"}
          </span>
          <span className="text-zinc-400">·</span>
          <span className="uppercase text-zinc-500">{result.network}</span>
        </div>

        <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          {result.headline}
        </h2>
        <p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {result.subheadline}
        </p>

        <p className="mt-4 text-base leading-relaxed text-zinc-800 dark:text-zinc-200">
          {result.answer}
        </p>

        {result.evidence.transactionHash && (
          <div className="mt-4">
            <Link
              href={`/transaction/${result.evidence.transactionHash}?network=${result.network}`}
              className="inline-flex items-center rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-indigo-500"
            >
              Open full transaction explanation →
            </Link>
          </div>
        )}
      </div>

      {result.evidence.balances && result.evidence.balances.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Account balances
          </h3>
          <BalanceList
            balances={result.evidence.balances.map((b) => ({
              asset: {
                type: b.code === "XLM" && !b.issuer ? "native" : "credit_alphanum4",
                code: b.code,
                issuer: b.issuer,
              },
              balance: b.balance,
            }))}
          />
        </div>
      )}

      {result.evidence.transfers && (
        <div className="space-y-2.5">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Supporting transfers
          </h3>
          <ActivityList
            transfers={result.evidence.transfers}
            network={result.network}
            emptyMessage="No matching transfers found for this query."
          />
        </div>
      )}

      <HistoryWarning coverage={result.coverage} cached={result.cached} />
    </div>
  );
}
