"use client";

import type { AccountBalance } from "@/lib/stellar/providers/types";
import { formatAmount, shortenAddress } from "@/lib/stellar/utils/format";

interface BalanceListProps {
  balances: AccountBalance[];
}

export function BalanceList({ balances }: BalanceListProps) {
  if (balances.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-[#0b101d]/60 p-8 text-center text-sm text-slate-400">
        No active asset balances found on this account.
      </div>
    );
  }

  return (
    <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {balances.map((item, idx) => {
        const isNative = item.asset.type === "native";
        const isSoroban = item.asset.type === "soroban";

        return (
          <div
            key={`${item.asset.code}-${item.asset.issuer ?? item.asset.contractId ?? idx}`}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d1324]/85 p-5 shadow-lg shadow-black/30 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/40 hover:shadow-cyan-500/10"
          >
            <div
              className={`pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r opacity-75 transition-opacity group-hover:opacity-100 ${
                isNative
                  ? "from-indigo-500 via-cyan-400 to-teal-400"
                  : isSoroban
                  ? "from-cyan-400 to-purple-500"
                  : "from-violet-500 to-indigo-500"
              }`}
            />

            <div className="flex items-center justify-between">
              <span className="font-heading text-base font-bold tracking-tight text-white">
                {item.asset.code}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${
                  isNative
                    ? "bg-cyan-500/10 text-cyan-300 ring-cyan-400/30"
                    : isSoroban
                    ? "bg-purple-500/10 text-purple-300 ring-purple-400/30"
                    : "bg-indigo-500/10 text-indigo-300 ring-indigo-400/30"
                }`}
              >
                {isNative ? "Native" : isSoroban ? "Soroban" : "Classic"}
              </span>
            </div>

            <div className="mt-3 font-heading text-2xl font-bold tracking-tight text-slate-50 tabular-nums">
              {formatAmount(item.balance)}
            </div>

            {(item.asset.issuer || item.asset.contractId) && (
              <div className="mt-2 font-mono text-[11px] text-slate-400">
                {item.asset.issuer
                  ? `Issuer: ${shortenAddress(item.asset.issuer)}`
                  : `Contract: ${shortenAddress(item.asset.contractId)}`}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
