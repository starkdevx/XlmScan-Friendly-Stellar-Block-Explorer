"use client";

import type { AccountBalance } from "@/lib/stellar/providers/types";
import { formatAmount, shortenAddress } from "@/lib/stellar/utils/format";

interface BalanceListProps {
  balances: AccountBalance[];
}

export function BalanceList({ balances }: BalanceListProps) {
  if (balances.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        No active asset balances found on this account.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {balances.map((item, idx) => (
        <div
          key={`${item.asset.code}-${item.asset.issuer ?? item.asset.contractId ?? idx}`}
          className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {item.asset.code}
            </span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {item.asset.type === "native"
                ? "Native"
                : item.asset.type === "soroban"
                ? "Soroban"
                : "Classic"}
            </span>
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {formatAmount(item.balance)}
          </div>
          {(item.asset.issuer || item.asset.contractId) && (
            <div className="mt-1.5 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
              {item.asset.issuer
                ? `Issuer: ${shortenAddress(item.asset.issuer)}`
                : `Contract: ${shortenAddress(item.asset.contractId)}`}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
