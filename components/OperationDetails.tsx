"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Layers, Terminal, Cpu } from "lucide-react";
import type {
  CanonicalTransaction,
  HumanizedOperation,
} from "@/lib/stellar/providers/types";

interface OperationDetailsProps {
  operations: HumanizedOperation[];
  transaction: CanonicalTransaction;
}

const CATEGORY_STYLES: Record<HumanizedOperation["category"], string> = {
  transfer: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  account: "bg-indigo-500/15 text-indigo-300 ring-indigo-500/30",
  trustline: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  swap: "bg-cyan-500/15 text-cyan-300 ring-cyan-500/30",
  contract: "bg-purple-500/15 text-purple-300 ring-purple-500/30",
  data: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  other: "bg-slate-500/15 text-slate-300 ring-slate-500/30",
};

export function OperationDetails({
  operations,
  transaction,
}: OperationDetailsProps) {
  const [showTechnical, setShowTechnical] = useState(false);

  return (
    <div className="animate-fade-up-delay-2 space-y-4">
      <div className="rounded-2xl border border-white/10 bg-[#0d1324]/85 p-5 sm:p-6 shadow-xl shadow-black/30 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-cyan-400" />
          <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-200">
            Timeline of operations ({operations.length})
          </h3>
        </div>

        {operations.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">
            No decoded operations available.
          </p>
        ) : (
          <ol className="relative mt-5 space-y-5 before:absolute before:top-3 before:bottom-3 before:left-3.5 before:w-px before:bg-gradient-to-b before:from-cyan-500/50 before:via-indigo-500/40 before:to-transparent">
            {operations.map((op) => (
              <li
                key={op.index}
                className="group relative flex items-start gap-4 pl-1"
              >
                <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#06080f] font-mono text-xs font-bold text-cyan-300 ring-2 ring-cyan-500/40 transition group-hover:ring-cyan-400">
                  {op.index + 1}
                </span>
                <div className="flex-1 rounded-xl border border-white/5 bg-white/[0.02] p-3.5 transition-colors group-hover:border-white/15 group-hover:bg-white/[0.04]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
                        CATEGORY_STYLES[op.category]
                      }`}
                    >
                      {op.title}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-200">
                    {op.sentence}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {transaction.events.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0d1324]/85 p-5 sm:p-6 shadow-xl shadow-black/30 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-purple-400" />
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-200">
              Soroban contract events ({transaction.events.length})
            </h3>
          </div>
          <div className="mt-4 space-y-2.5">
            {transaction.events.map((ev) => (
              <div
                key={ev.index}
                className="rounded-xl border border-purple-500/20 bg-purple-500/[0.05] p-3.5 text-xs transition hover:border-purple-400/40"
              >
                <div className="font-mono text-purple-200">
                  Contract: {ev.contractId}
                </div>
                <div className="mt-1.5 text-slate-300">
                  Type:{" "}
                  <span className="rounded bg-purple-500/20 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-purple-200">
                    {ev.type}
                  </span>{" "}
                  · Topics:{" "}
                  <span className="font-mono text-slate-400">
                    {ev.topics.join(" / ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1324]/85 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setShowTechnical((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-4 text-left text-xs font-semibold text-slate-300 transition hover:bg-white/[0.03] hover:text-white"
        >
          <span className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-indigo-400" />
            Technical details (Raw decoded fields & XDR)
          </span>
          {showTechnical ? (
            <ChevronDown className="h-4 w-4 text-cyan-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
        </button>

        {showTechnical && (
          <div className="border-t border-white/10 p-5">
            <pre className="max-h-96 overflow-auto rounded-xl border border-white/10 bg-[#05070d] p-4 font-mono text-[11px] leading-relaxed text-cyan-100/90">
              {JSON.stringify(
                {
                  hash: transaction.hash,
                  network: transaction.network,
                  ledger: transaction.ledger,
                  status: transaction.status,
                  sourceAccount: transaction.sourceAccount,
                  feeChargedStroops: transaction.feeChargedStroops,
                  operations: transaction.operations,
                  events: transaction.events,
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
