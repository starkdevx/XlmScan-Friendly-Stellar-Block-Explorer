"use client";

import { Info } from "lucide-react";
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
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
      <div className="flex items-start gap-2.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-medium text-zinc-800 dark:text-zinc-200">
            <span>Data source: {providerLabel}</span>
            {asOfLedger != null && (
              <span>As of ledger {asOfLedger.toLocaleString("en-US")}</span>
            )}
            {coverage.oldestLedger != null && coverage.latestLedger != null && (
              <span>
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
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Cached
              </span>
            )}
          </div>
          <p className="leading-relaxed">
            {coverage.note ??
              "This provider retrieves data within its current retention window. Older records may require another data source."}
          </p>
        </div>
      </div>
    </div>
  );
}
