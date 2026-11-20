"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Copy,
  Check,
  Clock,
  Coins,
  User,
  FileCode2,
} from "lucide-react";
import type {
  CanonicalTransaction,
  HumanizedTransaction,
} from "@/lib/stellar/providers/types";
import { formatAmount, shortenAddress } from "@/lib/stellar/utils/format";
import { HistoryWarning } from "./HistoryWarning";
import { OperationDetails } from "./OperationDetails";

interface TransactionOverviewProps {
  transaction: CanonicalTransaction;
  humanized: HumanizedTransaction;
  cached?: boolean;
}

export function TransactionOverview({
  transaction,
  humanized,
  cached,
}: TransactionOverviewProps) {
  const [copiedHash, setCopiedHash] = useState(false);

  function copyHash() {
    navigator.clipboard.writeText(transaction.hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 1800);
  }

  return (
    <div className="space-y-6">
      {/* Top Plain-English Summary Hero Card */}
      <div className="animate-fade-up relative overflow-hidden rounded-3xl border border-white/10 bg-[#0d1324]/90 p-6 sm:p-7 shadow-2xl shadow-black/40 backdrop-blur-xl">
        {/* Top Luminous Accent Strip */}
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${
            humanized.successful
              ? "from-emerald-400 via-cyan-400 to-indigo-500"
              : "from-rose-500 via-amber-500 to-rose-400"
          }`}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {humanized.successful ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3.5 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {humanized.statusLabel}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3.5 py-1 text-xs font-semibold text-rose-300 ring-1 ring-rose-500/30">
                <XCircle className="h-3.5 w-3.5" />
                {humanized.statusLabel}
              </span>
            )}
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-300 ring-1 ring-white/10">
              {transaction.network}
            </span>
          </div>

          <button
            type="button"
            onClick={copyHash}
            title="Copy full transaction hash"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-slate-300 transition hover:border-cyan-400/40 hover:bg-white/10 hover:text-white"
          >
            <span>{shortenAddress(transaction.hash, 8)}</span>
            {copiedHash ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-slate-400" />
            )}
          </button>
        </div>

        <h1 className="mt-5 font-heading text-xl sm:text-2xl font-bold leading-snug text-white">
          {humanized.summary}
        </h1>

        <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 text-xs sm:grid-cols-3">
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3.5">
            <div className="flex items-center gap-1.5 text-slate-400">
              <User className="h-3.5 w-3.5 text-indigo-400" />
              <span>Sender</span>
            </div>
            {humanized.sender ? (
              <Link
                href={`/account/${humanized.sender}?network=${transaction.network}`}
                className="mt-1.5 inline-block font-mono text-xs font-semibold text-cyan-300 transition hover:text-cyan-200 hover:underline"
              >
                {shortenAddress(humanized.sender, 6)}
              </Link>
            ) : (
              <div className="mt-1.5 font-medium text-slate-300">Unknown</div>
            )}
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3.5">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Coins className="h-3.5 w-3.5 text-cyan-400" />
              <span>Transaction fee</span>
            </div>
            <div className="mt-1.5 font-heading text-sm font-bold text-white">
              {humanized.feeDescription}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3.5">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="h-3.5 w-3.5 text-purple-400" />
              <span>Ledger & time</span>
            </div>
            <div className="mt-1.5 font-medium text-slate-100">
              {humanized.ledgerDescription}
            </div>
          </div>
        </div>

        {humanized.memoDescription && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-2.5 text-xs text-indigo-200">
            <FileCode2 className="h-4 w-4 shrink-0 text-indigo-400" />
            <span className="font-semibold">Memo:</span>
            <span className="font-mono text-white">
              {humanized.memoDescription}
            </span>
          </div>
        )}
      </div>

      {/* Main Asset Movements */}
      {humanized.assetMovements.length > 0 && (
        <div className="animate-fade-up-delay-1 rounded-2xl border border-white/10 bg-[#0d1324]/85 p-5 shadow-xl shadow-black/30 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-300">
              Asset movements ({humanized.assetMovements.length})
            </h3>
          </div>
          <div className="mt-3.5 space-y-2.5">
            {humanized.assetMovements.map((m, idx) => (
              <div
                key={idx}
                className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm transition-all duration-150 hover:border-cyan-400/35 hover:bg-white/[0.06]"
              >
                <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs text-slate-400">
                  {m.from && (
                    <Link
                      href={`/account/${m.from}?network=${transaction.network}`}
                      className="rounded-lg bg-white/5 px-2.5 py-1 text-cyan-300 ring-1 ring-white/10 transition hover:bg-cyan-500/15 hover:text-cyan-200"
                    >
                      {shortenAddress(m.from)}
                    </Link>
                  )}
                  <ArrowRight className="h-4 w-4 text-indigo-400 transition-transform duration-200 group-hover:translate-x-0.5" />
                  {m.to && (
                    <Link
                      href={`/account/${m.to}?network=${transaction.network}`}
                      className="rounded-lg bg-white/5 px-2.5 py-1 text-cyan-300 ring-1 ring-white/10 transition hover:bg-cyan-500/15 hover:text-cyan-200"
                    >
                      {shortenAddress(m.to)}
                    </Link>
                  )}
                </div>

                <div className="font-heading text-base font-bold text-white tabular-nums">
                  {formatAmount(m.amount)}{" "}
                  <span className="text-cyan-300">{m.assetCode}</span>
                  {m.destAssetCode && (
                    <span className="text-slate-400">
                      {" "}
                      → {m.destAmount ? formatAmount(m.destAmount) : ""}{" "}
                      <span className="text-emerald-300">{m.destAssetCode}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <OperationDetails
        operations={humanized.operations}
        transaction={transaction}
      />

      <HistoryWarning coverage={transaction.coverage} cached={cached} />
    </div>
  );
}
