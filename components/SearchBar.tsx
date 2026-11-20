"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import type { NaturalLanguageQueryResult } from "@/lib/ai/schemas";
import type { StellarNetwork } from "@/lib/stellar/validation";
import { useNetwork } from "./NetworkContext";

interface SearchBarProps {
  initialValue?: string;
  network?: StellarNetwork;
  context?: { address?: string; txHash?: string };
  placeholder?: string;
  onQueryResult?: (result: NaturalLanguageQueryResult) => void;
  onContractNotice?: (message: string, contractId: string) => void;
}

export function SearchBar({
  initialValue = "",
  network: networkProp,
  context,
  placeholder = "Paste a Stellar wallet (G...), transaction hash, or ask a question...",
  onQueryResult,
  onContractNotice,
}: SearchBarProps) {
  const router = useRouter();
  const contextNetwork = useNetwork().network;
  const activeNetwork = networkProp ?? contextNetwork;

  const [input, setInput] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const searchRes = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: trimmed, network: activeNetwork }),
      });
      const searchData = await searchRes.json();

      if (!searchRes.ok) {
        setError(searchData.error ?? "Search failed");
        return;
      }

      if (searchData.redirectTo) {
        router.push(searchData.redirectTo);
        return;
      }

      if (searchData.type === "contract") {
        if (onContractNotice) {
          onContractNotice(searchData.message, searchData.contractId);
        }
        return;
      }

      const queryRes = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          network: activeNetwork,
          context,
        }),
      });
      const queryData = await queryRes.json();

      if (!queryRes.ok) {
        setError(queryData.error ?? "Query failed");
        return;
      }

      if (onQueryResult) {
        onQueryResult(queryData as NaturalLanguageQueryResult);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Network error while searching"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="h-12 w-full rounded-xl border border-zinc-300 bg-white pr-4 pl-10 text-sm text-zinc-900 shadow-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Checking...</span>
            </>
          ) : (
            <span>Ask</span>
          )}
        </button>
      </form>

      {error && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
