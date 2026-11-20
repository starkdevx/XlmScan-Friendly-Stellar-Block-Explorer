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
      <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {transfers.map((t) => {
        const isIncoming = t.direction === "incoming";
        const isSelf = t.direction === "self";
        const counterparty = isIncoming ? t.from : t.to;

        return (
          <div
            key={t.id}
            className="flex flex-col gap-2 p-4 transition-colors hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-zinc-800/50"
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  !t.successful
                    ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                    : isIncoming
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                    : isSelf
                    ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
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
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  <span>
                    {!t.successful
                      ? "Failed transfer"
                      : isIncoming
                      ? "Received"
                      : isSelf
                      ? "Self transfer"
                      : "Sent"}{" "}
                    {formatAmount(t.amount)} {t.asset.code}
                  </span>
                  {counterparty && (
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {isIncoming ? "from" : "to"}{" "}
                      <Link
                        href={`/account/${counterparty}?network=${network}`}
                        className="font-mono text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        {shortenAddress(counterparty)}
                      </Link>
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{formatDateTime(t.timestamp)}</span>
                  <span className="capitalize">
                    {t.operationType.replace(/_/g, " ")}
                  </span>
                  {t.txHash && (
                    <Link
                      href={`/transaction/${t.txHash}?network=${network}`}
                      className="font-mono text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Tx {shortenAddress(t.txHash, 5)}
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div
              className={`text-sm font-semibold tabular-nums sm:text-right ${
                !t.successful
                  ? "text-zinc-400 line-through"
                  : isIncoming
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-zinc-900 dark:text-zinc-100"
              }`}
            >
              {isIncoming ? "+" : isSelf ? "" : "-"}
              {formatAmount(t.amount)} {t.asset.code}
            </div>
          </div>
        );
      })}
    </div>
  );
}
