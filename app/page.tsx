"use client";

import { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Coins,
  FileText,
  Search,
} from "lucide-react";
import type { NaturalLanguageQueryResult } from "@/lib/ai/schemas";
import { NaturalLanguageResult } from "@/components/NaturalLanguageResult";
import { SearchBar } from "@/components/SearchBar";
import { useNetwork } from "@/components/NetworkContext";

const SAMPLE_PROMPTS = [
  {
    icon: Coins,
    label: "Check Circle USDC Issuer",
    value: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    tag: "Wallet",
  },
  {
    icon: Sparkles,
    label: "What did this wallet receive this week?",
    value:
      "What did GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN receive this week?",
    tag: "Query",
  },
  {
    icon: Zap,
    label: "Show recent XLM transfers",
    value:
      "Show the last 5 XLM transfers for GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    tag: "Transfers",
  },
];

const CAPABILITIES = [
  {
    icon: FileText,
    title: "Plain-English Decoders",
    desc: "Translates raw Stellar XDR, operations, and SEP-41 Soroban events into human-readable sentences without blockchain jargon.",
    badge: "Deterministic",
    gradient: "from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: Coins,
    title: "Smart Wallet Timelines",
    desc: "Inspect XLM, classic asset trustlines, and Soroban token balances with counterparty-grouped activity and ledger timestamps.",
    badge: "Real-time",
    gradient: "from-cyan-500/10 to-teal-500/10 dark:from-cyan-500/20 dark:to-teal-500/20",
    iconColor: "text-cyan-600 dark:text-cyan-400",
  },
  {
    icon: ShieldCheck,
    title: "Zero-Hallucination AI",
    desc: "AI only extracts the structured intent. All balances, sums, counts, and transaction statuses are computed strictly from on-chain facts.",
    badge: "Verified Data",
    gradient: "from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20",
    iconColor: "text-indigo-600 dark:text-indigo-400",
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
    <div className="relative mx-auto max-w-5xl py-10 sm:py-16">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-20 left-1/2 -z-10 h-80 w-[620px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-500/25 via-cyan-400/20 to-purple-500/25 blur-3xl opacity-75 dark:opacity-40" />

      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-5xl mx-auto px-2">
        {/* Modern Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-xs backdrop-blur-md dark:border-indigo-800/60 dark:bg-zinc-900/80 dark:text-indigo-300">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          <span>Ask Stellar Anything</span>
          <span className="h-1 w-1 rounded-full bg-indigo-400" />
          <span className="font-normal text-zinc-500 dark:text-zinc-400">
            Natural-Language Blockchain Explorer
          </span>
        </div>

        {/* Hero Headline (Appears in 1 line on desktop) */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:whitespace-nowrap">
          Stellar, explained{" "}
          <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent dark:from-indigo-400 dark:via-cyan-300 dark:to-cyan-400">
            in plain English.
          </span>
        </h1>

        {/* Hero Subtitle (Wider width to appear in 1 line on desktop) */}
        <p className="mx-auto max-w-4xl text-base sm:text-lg font-normal leading-relaxed text-zinc-600 dark:text-zinc-400 md:whitespace-nowrap">
          Understand what is happening on Stellar, simply. Paste any wallet address, transaction hash, or ask a question.
        </p>
      </div>

      {/* Main Search Component (Constrained to max-w-3xl) */}
      <div className="mt-10 max-w-3xl mx-auto">
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

      {/* Sample Query Chips */}
      {!queryResult && !contractNotice && (
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>Try asking or pasting:</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {SAMPLE_PROMPTS.map((sample) => {
              const Icon = sample.icon;
              return (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => setSeedInput(sample.value)}
                  className="group inline-flex items-center gap-2 rounded-xl border border-zinc-200/90 bg-white/80 px-3.5 py-2 text-xs font-medium text-zinc-700 shadow-2xs backdrop-blur-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white hover:text-indigo-600 hover:shadow-xs active:translate-y-0 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:border-indigo-700 dark:hover:bg-zinc-800 dark:hover:text-indigo-300"
                >
                  <Icon className="h-3.5 w-3.5 text-zinc-400 transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                  <span>{sample.label}</span>
                  <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider dark:bg-zinc-800 dark:text-zinc-400">
                    {sample.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Contract Notice Box */}
      {contractNotice && (
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/90 p-5 text-sm text-amber-900 backdrop-blur-sm dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="font-semibold flex items-center gap-2">
            <span>Soroban Smart Contract Recognized</span>
            <span className="font-mono text-xs text-amber-700 dark:text-amber-300">
              ({contractNotice.contractId})
            </span>
          </div>
          <p className="mt-1 leading-relaxed">{contractNotice.message}</p>
        </div>
      )}

      {/* Natural Language Query Result View */}
      {queryResult && (
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Query Result
            </h2>
            <button
              type="button"
              onClick={() => setQueryResult(null)}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            >
              Clear result
            </button>
          </div>
          <NaturalLanguageResult result={queryResult} />
        </div>
      )}

      {/* Feature Capabilities Grid */}
      {!queryResult && !contractNotice && (
        <div className="mt-16 sm:mt-20">
          <div className="mb-6 flex items-center justify-between border-b border-zinc-200/80 pb-3 dark:border-zinc-800/80">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Explorer Capabilities
            </div>
            <div className="text-xs text-zinc-400">
              Powered by Alchemy, QuickNode & Stellar RPC
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {CAPABILITIES.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.title}
                  className="group relative rounded-2xl border border-zinc-200/80 bg-white/70 p-5 shadow-2xs backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/5 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-indigo-800"
                >
                  <div
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${cap.gradient} ${cap.iconColor} mb-4 ring-1 ring-black/5 dark:ring-white/10`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {cap.title}
                    </h3>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {cap.badge}
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {cap.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
