"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type {
  CanonicalTransaction,
  HumanizedOperation,
} from "@/lib/stellar/providers/types";

interface OperationDetailsProps {
  operations: HumanizedOperation[];
  transaction: CanonicalTransaction;
}

export function OperationDetails({
  operations,
  transaction,
}: OperationDetailsProps) {
  const [showTechnical, setShowTechnical] = useState(false);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Timeline of operations ({operations.length})
        </h3>

        {operations.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            No decoded operations available.
          </p>
        ) : (
          <ol className="mt-4 space-y-4">
            {operations.map((op) => (
              <li key={op.index} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {op.index + 1}
                </span>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {op.title}
                  </div>
                  <p className="mt-0.5 text-sm text-zinc-800 dark:text-zinc-200">
                    {op.sentence}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {transaction.events.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Soroban contract events ({transaction.events.length})
          </h3>
          <div className="mt-3 space-y-2.5">
            {transaction.events.map((ev) => (
              <div
                key={ev.index}
                className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="font-mono text-zinc-700 dark:text-zinc-300">
                  Contract: {ev.contractId}
                </div>
                <div className="mt-1 text-zinc-600 dark:text-zinc-400">
                  Type: <span className="font-medium">{ev.type}</span> · Topics:{" "}
                  {ev.topics.join(" / ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => setShowTechnical((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-3.5 text-left text-xs font-semibold text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          <span>Technical details (Raw decoded fields & XDR)</span>
          {showTechnical ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {showTechnical && (
          <div className="border-t border-zinc-200 p-5 dark:border-zinc-800">
            <pre className="max-h-96 overflow-auto rounded-lg bg-zinc-950 p-4 font-mono text-[11px] text-zinc-200">
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
