"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import type { NaturalLanguageQueryResult } from "@/lib/ai/schemas";
import type { StellarNetwork } from "@/lib/stellar/validation";
import { useNetwork } from "./NetworkContext";

const DEFAULT_QUESTIONS = [
  "Tell me all tokens for this wallet address?",
  "How much USDC did this wallet receive this week?",
  "Explain what happened in my last transaction?",
];

interface SearchBarProps {
  initialValue?: string;
  network?: StellarNetwork;
  context?: { address?: string; txHash?: string };
  placeholder?: string;
  questions?: string[];
  onQueryResult?: (result: NaturalLanguageQueryResult) => void;
  onContractNotice?: (message: string, contractId: string) => void;
}

export function SearchBar({
  initialValue = "",
  network: networkProp,
  context,
  placeholder,
  questions = DEFAULT_QUESTIONS,
  onQueryResult,
  onContractNotice,
}: SearchBarProps) {
  const router = useRouter();
  const contextNetwork = useNetwork().network;
  const activeNetwork = networkProp ?? contextNetwork;

  const [input, setInput] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Word-by-word animation states
  const [questionIdx, setQuestionIdx] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const currentQuestion = questions[questionIdx] || questions[0] || "";
  const words = currentQuestion.split(" ").filter(Boolean);

  useEffect(() => {
    // If input is non-empty, don't run animation timer
    if (input.trim() || questions.length === 0) return;

    // Phase 1: Typing words left-to-right
    if (!isFadingOut && wordCount < words.length) {
      const timer = setTimeout(() => {
        setWordCount((prev) => prev + 1);
      }, 160);
      return () => clearTimeout(timer);
    }

    // Phase 2: Full question displayed, pause to let user read
    if (!isFadingOut && wordCount >= words.length) {
      const pauseTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, 2400);
      return () => clearTimeout(pauseTimer);
    }

    // Phase 3: Fade out and advance to next question
    if (isFadingOut) {
      const fadeTimer = setTimeout(() => {
        setQuestionIdx((prev) => (prev + 1) % questions.length);
        setWordCount(0);
        setIsFadingOut(false);
      }, 350);
      return () => clearTimeout(fadeTimer);
    }
  }, [input, wordCount, isFadingOut, words.length, questions.length]);

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

  const displayedWords = words.slice(0, wordCount);

  return (
    <div className="space-y-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400" />

          {/* Animated word-by-word placeholder overlay */}
          {!input && (
            <div
              className={`pointer-events-none absolute top-1/2 left-10 -translate-y-1/2 flex items-center pr-4 text-sm select-none transition-all duration-300 ${
                isFadingOut ? "opacity-0 -translate-y-2/3" : isFocused ? "opacity-40" : "opacity-100"
              }`}
            >
              <span className="flex flex-wrap items-center gap-x-1.5 text-zinc-400 dark:text-zinc-500">
                {displayedWords.map((word, idx) => (
                  <span
                    key={`${word}-${idx}`}
                    className="inline-block transition-all duration-150 transform translate-x-0 opacity-100"
                  >
                    {word}
                  </span>
                ))}
                {/* Subtle blinking cursor while typing question */}
                {wordCount < words.length && (
                  <span className="inline-block h-3.5 w-0.5 rounded-xs bg-indigo-500 animate-pulse align-middle" />
                )}
              </span>
            </div>
          )}

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder && input ? placeholder : ""}
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
