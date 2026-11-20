"use client";

import { Info, Database } from "lucide-react";
import type { CoverageInfo } from "@/lib/stellar/providers/types";
import { formatDateShort } from "@/lib/stellar/utils/format";

interface HistoryWarningProps {
  coverage?: CoverageInfo;
  asOfLedger?: number;
  cached?: boolean;
}

export function HistoryWarning({
  coverage,
  asOfLedger,
  cached,
}: HistoryWarningProps) {
  if (!coverage) return null;

  const providerLabel =
    coverage.provider === "alchemy"
      ? "Alchemy"
      : coverage.provider === "quicknode"
      ? "QuickNode"
      : coverage.provider === "horizon_public"
      ? "Public Stellar Horizon / RPC"
      : "Cache";

  return (
    <div className="animate-fade-up-delay-3 rounded-2xl border border-white/10 bg-[#0c1120]/80 p-4 text-xs text-slate-400 backdrop-blur-md">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20">
          {cached ? <Database className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5" />}
        </div>
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-medium text-slate-200">
            <span>
              Source:{" "}
              <span className="font-semibold text-cyan-300">{providerLabel}</span>
            </span>
            {asOfLedger != null && (
              <span className="font-mono text-[11px] text-slate-300">
                Ledger #{asOfLedger.toLocaleString("en-US")}
              </span>
            )}
            {coverage.oldestLedger != null && coverage.latestLedger != null && (
              <span className="font-mono text-[11px] text-slate-400">
                Ledgers {coverage.oldestLedger.toLocaleString("en-US")} –{" "}
                {coverage.latestLedger.toLocaleString("en-US")}
              </span>
            )}
            {coverage.oldestTimestamp && coverage.latestTimestamp && (
              <span>
                Window: {formatDateShort(coverage.oldestTimestamp)} –{" "}
                {formatDateShort(coverage.latestTimestamp)}
              </span>
            )}
            {cached && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Cached
              </span>
            )}
          </div>
          <p className="leading-relaxed text-slate-400">
            {coverage.note ??
              "This provider retrieves data within its current retention window. Older records may require another data source."}
          </p>
        </div>
      </div>
    </div>
  );
}
