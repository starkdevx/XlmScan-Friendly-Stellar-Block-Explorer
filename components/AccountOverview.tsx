"use client";

import { useState } from "react";
import { Copy, Check, Wallet } from "lucide-react";
import type { NaturalLanguageQueryResult } from "@/lib/ai/schemas";
import type {
  AccountBalance,
  CoverageInfo,
  TransferRecord,
} from "@/lib/stellar/providers/types";
import type { StellarNetwork } from "@/lib/stellar/validation";
import { ActivityList } from "./ActivityList";
import { BalanceList } from "./BalanceList";
import { HistoryWarning } from "./HistoryWarning";
import { NaturalLanguageResult } from "./NaturalLanguageResult";
import { SearchBar } from "./SearchBar";

interface AccountOverviewProps {
  address: string;
  network: StellarNetwork;
  label?: string;
  summary: string;
  balances: AccountBalance[];
  asOfLedger?: number;
  balanceCoverage: CoverageInfo;
  balanceCached?: boolean;
  transfers: TransferRecord[];
  transferCoverage: CoverageInfo;
}

export function AccountOverview({
  address,
  network,
  label,
  summary,
  balances,
  asOfLedger,
  balanceCoverage,
  balanceCached,
  transfers,
  transferCoverage,
}: AccountOverviewProps) {
  const [copied, setCopied] = useState(false);
  const [nlResult, setNlResult] = useState<NaturalLanguageQueryResult | null>(
    null
  );

  function copyAddress() {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="space-y-8">
      {/* Account Header */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Stellar Account · {network}
            </span>
            {label && (
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                {label}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={copyAddress}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1 font-mono text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <span className="max-w-[200px] truncate sm:max-w-none">
              {address}
            </span>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        <p className="mt-4 text-lg font-medium leading-relaxed text-zinc-900 dark:text-zinc-100">
          {summary}
        </p>

        {/* Contextual Follow-up Question Input */}
        <div className="mt-6 border-t border-zinc-100 pt-5 dark:border-zinc-800">
          <div className="mb-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            Ask this wallet anything (no need to paste the address again)
          </div>
          <SearchBar
            network={network}
            context={{ address }}
            placeholder='e.g. "How much USDC did this wallet receive this week?" or "Show its last 5 transfers"'
            onQueryResult={(res) => setNlResult(res)}
          />
        </div>
      </div>

      {nlResult && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Answer for this wallet
            </h2>
            <button
              type="button"
              onClick={() => setNlResult(null)}
              className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Clear
            </button>
          </div>
          <NaturalLanguageResult result={nlResult} />
        </div>
      )}

      {/* Balances */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Current balances
          </h2>
          {asOfLedger != null && (
            <span className="text-xs text-zinc-500">
              As of ledger {asOfLedger.toLocaleString("en-US")}
            </span>
          )}
        </div>
        <BalanceList balances={balances} />
      </section>

      {/* Recent Transfers */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Recent transfer activity
          </h2>
          <span className="text-xs text-zinc-500">
            Showing verified transfer records
          </span>
        </div>
        <ActivityList transfers={transfers} network={network} />
      </section>

      <HistoryWarning
        coverage={transferCoverage ?? balanceCoverage}
        asOfLedger={asOfLedger}
        cached={balanceCached}
      />
    </div>
  );
}
