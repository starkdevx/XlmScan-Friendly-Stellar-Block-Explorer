"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import { useNetwork } from "./NetworkContext";
import type { StellarNetwork } from "@/lib/stellar/validation";

export function Navbar() {
  const { network, setNetwork } = useNetwork();

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/85">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-sm font-bold tracking-tight text-zinc-900 transition hover:opacity-90 dark:text-zinc-100"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 font-mono text-xs font-black text-white shadow-xs">
            X
          </span>
          <span className="text-base font-black tracking-tighter">XLMSCAN</span>
        </Link>

        {/* Network switch in the top bar */}
        <div className="flex items-center gap-2">
          <div className="relative inline-flex items-center rounded-xl border border-zinc-200 bg-zinc-50/80 p-0.5 text-xs shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/80">
            <button
              type="button"
              onClick={() => setNetwork("mainnet")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                network === "mainnet"
                  ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  network === "mainnet" ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
                }`}
              />
              Mainnet
            </button>
            <button
              type="button"
              onClick={() => setNetwork("testnet")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                network === "testnet"
                  ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  network === "testnet" ? "bg-amber-500" : "bg-zinc-300 dark:bg-zinc-600"
                }`}
              />
              Testnet
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
