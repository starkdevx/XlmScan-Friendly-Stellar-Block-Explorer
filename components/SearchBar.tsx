"use client";

import { useEffect, useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Sparkles, X, ArrowRight } from "lucide-react";
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
  const inputRef = useRef<HTMLInputElement>(null);

  // Word-by-word animation states
  const [questionIdx, setQuestionIdx] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const currentQuestion = questions[questionIdx] || questions[0] || "";
  const words = currentQuestion.split(" ").filter(Boolean);

  useEffect(() => {
    // If input is non-empty, pause animation
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
      }, 2600);
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
    <div className="space-y-3">
      {/* Spotlight glowing border wrapper */}
      <div className="group relative rounded-2xl p-[1.5px] bg-gradient-to-r from-indigo-500/35 via-cyan-500/30 to-purple-500/35 shadow-xl shadow-indigo-500/5 transition-all duration-300 hover:from-indigo-500/60 hover:via-cyan-500/50 hover:to-purple-500/60 hover:shadow-indigo-500/15 focus-within:from-indigo-600 focus-within:via-cyan-500 focus-within:to-indigo-600 focus-within:shadow-2xl focus-within:shadow-indigo-500/20">
        <form
          onSubmit={handleSubmit}
          className="relative flex h-14 sm:h-16 w-full items-center rounded-[15px] bg-white/95 pr-2 pl-3 sm:pl-4 backdrop-blur-xl dark:bg-zinc-950/95"
        >
          {/* Glowing Search Emblem Icon */}
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 transition-colors group-focus-within:from-indigo-600 group-focus-within:to-cyan-600 group-focus-within:text-white dark:from-indigo-950/70 dark:to-zinc-900 dark:text-indigo-400">
            <Search className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </div>

          {/* Interactive Text & Overlay Container */}
          <div className="relative flex-1 h-full flex items-center px-2 sm:px-3 overflow-hidden">
            {/* Word-by-word animated overlay when input is empty */}
            {!input && (
              <div
                className={`pointer-events-none absolute inset-y-0 left-2 sm:left-3 flex items-center select-none pr-3 text-sm sm:text-base font-medium transition-all duration-300 ${
                  isFadingOut
                    ? "opacity-0 -translate-y-2"
                    : isFocused
                    ? "opacity-35"
                    : "opacity-100"
                }`}
              >
                <div className="flex flex-wrap items-center gap-x-1.5 text-zinc-400 dark:text-zinc-500 truncate">
                  {displayedWords.map((word, idx) => (
                    <span
                      key={`${word}-${idx}`}
                      className="inline-block transition-transform duration-150 transform translate-x-0"
                    >
                      {word}
                    </span>
                  ))}
                  {/* Glowing cursor while typing question */}
                  {wordCount < words.length && (
                    <span className="inline-block h-4 w-0.5 rounded-xs bg-indigo-500 animate-pulse align-middle" />
                  )}
                </div>
              </div>
            )}

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder && input ? placeholder : ""}
              className="h-full w-full bg-transparent text-sm sm:text-base font-medium text-zinc-900 outline-none placeholder:text-transparent dark:text-zinc-50"
            />
          </div>

          {/* Clear button when input has text */}
          {input && (
            <button
              type="button"
              onClick={() => {
                setInput("");
                inputRef.current?.focus();
              }}
              className="mr-1.5 flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              title="Clear input"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Search Button */}
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex h-10 sm:h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-cyan-600 px-5 sm:px-6 text-xs sm:text-sm font-heading font-bold text-white shadow-md shadow-indigo-600/25 transition-all duration-150 hover:from-indigo-500 hover:to-cyan-500 hover:shadow-indigo-600/35 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Checking...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Ask</span>
              </>
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50/80 p-3 text-xs font-medium text-red-600 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
