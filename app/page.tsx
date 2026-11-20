"use client";

import { useState } from "react";
import type { NaturalLanguageQueryResult } from "@/lib/ai/schemas";
import { NaturalLanguageResult } from "@/components/NaturalLanguageResult";
import { SearchBar } from "@/components/SearchBar";
import { useNetwork } from "@/components/NetworkContext";

const SAMPLE_PROMPTS = [
  {
    label: "Check Circle USDC issuer",
    value: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  },
  {
    label: "What did this wallet receive this week?",
    value:
      "What did GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN receive this week?",
  },
  {
    label: "Show recent XLM transfers",
    value:
      "Show the last 5 XLM transfers for GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  },
];

export default function HomePage() {
  const { network } = useNetwork();
  const [queryResult, setQueryResult] =
    useState<NaturalLanguageQueryResult | null>(null);
  const [contractNotice, setContractNotice] = useState<{
    message: string;
    contractId: string;
  } | null>(null);
  const [seedInput, setSeedInput] = useState("");

  return (
    <div className="mx-auto max-w-3xl py-10 sm:py-16">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/60 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
          <span>Stellar Plain-English Explorer</span>
        </div>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl dark:text-zinc-50">
          XLMSCAN
        </h1>
        <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
          Understand what is happening on Stellar, simply. Paste any wallet
          address, transaction hash, or ask a question.
        </p>
      </div>

      <div className="mt-8">
        <SearchBar
          key={`${seedInput}-${network}`}
          initialValue={seedInput}
          network={network}
          onQueryResult={(res) => {
            setContractNotice(null);
            setQueryResult(res);
          }}
          onContractNotice={(message, contractId) => {
            setQueryResult(null);
            setContractNotice({ message, contractId });
          }}
        />
      </div>

      {!queryResult && !contractNotice && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {SAMPLE_PROMPTS.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => setSeedInput(sample.value)}
              className="rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-indigo-700 dark:hover:text-indigo-300"
            >
              {sample.label}
            </button>
          ))}
        </div>
      )}

      {contractNotice && (
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="font-semibold">
            Soroban Contract Recognized ({contractNotice.contractId})
          </div>
          <p className="mt-1">{contractNotice.message}</p>
        </div>
      )}

      {queryResult && (
        <div className="mt-8">
          <NaturalLanguageResult result={queryResult} />
        </div>
      )}
    </div>
  );
}
