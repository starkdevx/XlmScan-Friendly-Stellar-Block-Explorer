"use client";

import Link from "next/link";
import { Sparkles, HelpCircle, ArrowRight } from "lucide-react";
import type { NaturalLanguageQueryResult } from "@/lib/ai/schemas";
import { ActivityList } from "./ActivityList";
import { BalanceList } from "./BalanceList";
import { HistoryWarning } from "./HistoryWarning";

interface NaturalLanguageResultProps {
  result: NaturalLanguageQueryResult;
}

export function NaturalLanguageResult({ result }: NaturalLanguageResultProps) {
  return (
    <div className="animate-fade-up space-y-5">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0d1324]/90 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500" />

        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
          {result.needsClarification ? (
            <HelpCircle className="h-4 w-4 text-amber-400" />
          ) : (
            <Sparkles className="h-4 w-4 text-cyan-400" />
          )}
          <span>
            {result.needsClarification ? "Clarification needed" : "Query completed"}
          </span>
          <span className="text-slate-600">·</span>
          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-slate-300">
            {result.network}
          </span>
        </div>

        <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-white">
          {result.headline}
        </h2>
        <p className="mt-1 text-sm font-medium text-cyan-200/80">
          {result.subheadline}
        </p>

        <p className="mt-4 text-base leading-relaxed text-slate-200">
          {result.answer}
        </p>

        {result.evidence.transactionHash && (
          <div className="mt-5">
            <Link
              href={`/transaction/${result.evidence.transactionHash}?network=${result.network}`}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:from-indigo-500 hover:to-cyan-500"
            >
              <span>Open full transaction explanation</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>

      {result.evidence.balances && result.evidence.balances.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-300">
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
        <div className="space-y-3">
          <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-300">
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
