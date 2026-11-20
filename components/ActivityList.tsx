"use client";

import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, RefreshCw, AlertCircle } from "lucide-react";
import type { TransferRecord } from "@/lib/stellar/providers/types";
import type { StellarNetwork } from "@/lib/stellar/validation";
import {
  formatAmount,
  formatDateTime,
  shortenAddress,
} from "@/lib/stellar/utils/format";

interface ActivityListProps {
  transfers: TransferRecord[];
  network: StellarNetwork;
  emptyMessage?: string;
}

export function ActivityList({
  transfers,
  network,
  emptyMessage = "No recent transfer activity found in the fetched window.",
}: ActivityListProps) {
  if (transfers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-[#0b101d]/60 p-8 text-center text-sm text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-[#0d1324]/85 shadow-xl shadow-black/30 backdrop-blur-md">
      {transfers.map((t) => {
        const isIncoming = t.direction === "incoming";
        const isSelf = t.direction === "self";
        const counterparty = isIncoming ? t.from : t.to;

        return (
          <div
            key={t.id}
            className="group flex flex-col gap-2.5 p-4 transition-all duration-150 hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 transition-transform duration-150 group-hover:scale-105 ${
                  !t.successful
                    ? "bg-rose-500/15 text-rose-400 ring-rose-500/30"
                    : isIncoming
                    ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30"
                    : isSelf
                    ? "bg-cyan-500/15 text-cyan-300 ring-cyan-500/30"
                    : "bg-amber-500/15 text-amber-300 ring-amber-500/30"
                }`}
              >
                {!t.successful ? (
                  <AlertCircle className="h-4 w-4" />
                ) : isIncoming ? (
                  <ArrowDownLeft className="h-4 w-4" />
                ) : isSelf ? (
                  <RefreshCw className="h-4 w-4" />
                ) : (
                  <ArrowUpRight className="h-4 w-4" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-100">
                  <span>
                    {!t.successful
                      ? "Failed transfer"
                      : isIncoming
                      ? "Received"
                      : isSelf
                      ? "Self transfer"
                      : "Sent"}{" "}
                    <span className="font-heading font-semibold text-white">
                      {formatAmount(t.amount)} {t.asset.code}
                    </span>
                  </span>
                  {counterparty && (
                    <span className="text-slate-400">
                      {isIncoming ? "from" : "to"}{" "}
                      <Link
                        href={`/account/${counterparty}?network=${network}`}
                        className="rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-xs text-cyan-300 transition hover:bg-cyan-500/15 hover:text-cyan-200"
                      >
                        {shortenAddress(counterparty)}
                      </Link>
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                  <span>{formatDateTime(t.timestamp)}</span>
                  <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-300">
                    {t.operationType.replace(/_/g, " ")}
                  </span>
                  {t.txHash && (
                    <Link
                      href={`/transaction/${t.txHash}?network=${network}`}
                      className="font-mono text-indigo-300 transition hover:text-cyan-300 hover:underline"
                    >
                      Tx {shortenAddress(t.txHash, 5)}
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div
              className={`font-heading text-base font-bold tabular-nums sm:text-right ${
                !t.successful
                  ? "text-slate-500 line-through"
                  : isIncoming
                  ? "text-emerald-400"
                  : "text-slate-100"
              }`}
            >
              {isIncoming ? "+" : isSelf ? "" : "-"}
              {formatAmount(t.amount)}{" "}
              <span className="text-xs font-semibold text-slate-400">
                {t.asset.code}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
