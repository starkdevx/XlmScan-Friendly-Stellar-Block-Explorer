"use client";

import Link from "next/link";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
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
  return (
    <div className="space-y-6">
      {/* Top Plain-English Summary */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {humanized.successful ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {humanized.statusLabel}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800 dark:bg-red-950 dark:text-red-300">
                <XCircle className="h-3.5 w-3.5" />
                {humanized.statusLabel}
              </span>
            )}
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium uppercase text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {transaction.network}
            </span>
          </div>

          <span className="font-mono text-xs text-zinc-500">
            {shortenAddress(transaction.hash, 8)}
          </span>
        </div>

        <h1 className="mt-4 text-xl font-semibold leading-snug text-zinc-950 dark:text-zinc-50">
          {humanized.summary}
        </h1>

        <div className="mt-5 grid gap-3 border-t border-zinc-100 pt-4 text-xs sm:grid-cols-3 dark:border-zinc-800">
          <div>
            <div className="text-zinc-500 dark:text-zinc-400">Sender</div>
            {humanized.sender ? (
              <Link
                href={`/account/${humanized.sender}?network=${transaction.network}`}
                className="mt-0.5 inline-block font-mono font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                {shortenAddress(humanized.sender, 6)}
              </Link>
            ) : (
              <div className="mt-0.5 text-zinc-700 dark:text-zinc-300">
                Unknown
              </div>
            )}
          </div>

          <div>
            <div className="text-zinc-500 dark:text-zinc-400">Transaction fee</div>
            <div className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">
              {humanized.feeDescription}
            </div>
          </div>

          <div>
            <div className="text-zinc-500 dark:text-zinc-400">Ledger & time</div>
            <div className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">
              {humanized.ledgerDescription}
            </div>
          </div>
        </div>

        {humanized.memoDescription && (
          <div className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
            <span className="font-semibold">Memo:</span>{" "}
            <span className="font-mono">{humanized.memoDescription}</span>
          </div>
        )}
      </div>

      {/* Main Asset Movements */}
      {humanized.assetMovements.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Asset movements
          </h3>
          <div className="mt-3 space-y-2.5">
            {humanized.assetMovements.map((m, idx) => (
              <div
                key={idx}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                  {m.from && (
                    <Link
                      href={`/account/${m.from}?network=${transaction.network}`}
                      className="text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      {shortenAddress(m.from)}
                    </Link>
                  )}
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
                  {m.to && (
                    <Link
                      href={`/account/${m.to}?network=${transaction.network}`}
                      className="text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      {shortenAddress(m.to)}
                    </Link>
                  )}
                </div>

                <div className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {formatAmount(m.amount)} {m.assetCode}
                  {m.destAssetCode && (
                    <span className="text-zinc-500">
                      {" "}
                      → {m.destAmount ? formatAmount(m.destAmount) : ""}{" "}
                      {m.destAssetCode}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <OperationDetails operations={humanized.operations} transaction={transaction} />

      <HistoryWarning coverage={transaction.coverage} cached={cached} />
    </div>
  );
}
