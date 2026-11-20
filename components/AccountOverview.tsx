"use client";

import { useState } from "react";
import { Copy, Check, Wallet, Coins, Activity } from "lucide-react";
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
      {/* Account Hero Card */}
      <div className="animate-fade-up relative overflow-hidden rounded-3xl border border-white/10 bg-[#0d1324]/90 p-6 sm:p-7 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-indigo-500 via-cyan-400 to-purple-500" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/30">
              <Wallet className="h-4 w-4" />
            </div>
            <span className="font-heading text-xs font-bold uppercase tracking-wider text-slate-300">
              Stellar Account ·{" "}
              <span className="text-cyan-300">{network}</span>
            </span>
            {label && (
              <span className="rounded-full bg-indigo-500/20 px-3 py-0.5 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400/30">
                {label}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={copyAddress}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-slate-300 transition hover:border-cyan-400/40 hover:bg-white/10 hover:text-white"
          >
            <span className="max-w-[200px] truncate sm:max-w-none">
              {address}
            </span>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-slate-400" />
            )}
          </button>
        </div>

        <p className="mt-5 font-heading text-lg sm:text-xl font-semibold leading-relaxed text-white">
          {summary}
        </p>

        {/* Contextual Follow-up Question Input */}
        <div className="mt-6 border-t border-white/10 pt-5">
          <div className="mb-2.5 text-xs font-semibold text-slate-400">
            Ask this wallet anything (no need to paste the address again)
          </div>
          <SearchBar
            network={network}
            context={{ address }}
            questions={[
              "How much USDC did this wallet receive this week?",
              "Tell me all tokens for this wallet address?",
              "Show the last 5 transfers for this wallet?",
            ]}
            onQueryResult={(res) => setNlResult(res)}
          />
        </div>
      </div>

      {nlResult && (
        <div className="animate-fade-up space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-cyan-300">
              Answer for this wallet
            </h2>
            <button
              type="button"
              onClick={() => setNlResult(null)}
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              Clear
            </button>
          </div>
          <NaturalLanguageResult result={nlResult} />
        </div>
      )}

      {/* Balances */}
      <section className="animate-fade-up-delay-1 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-cyan-400" />
            <h2 className="font-heading text-base font-bold text-white">
              Current balances
            </h2>
          </div>
          {asOfLedger != null && (
            <span className="font-mono text-xs text-slate-400">
              As of ledger {asOfLedger.toLocaleString("en-US")}
            </span>
          )}
        </div>
        <BalanceList balances={balances} />
      </section>

      {/* Recent Transfers */}
      <section className="animate-fade-up-delay-2 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-400" />
            <h2 className="font-heading text-base font-bold text-white">
              Recent transfer activity
            </h2>
          </div>
          <span className="text-xs text-slate-400">
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
