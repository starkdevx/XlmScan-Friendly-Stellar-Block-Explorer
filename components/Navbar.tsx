"use client";

import Link from "next/link";
import { useNetwork } from "./NetworkContext";

function XlmScanLogo() {
  return (
    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-cyan-600 p-1.5 shadow-md shadow-indigo-500/25 ring-1 ring-white/20 dark:shadow-indigo-950/50">
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
      >
        <defs>
          <linearGradient
            id="xlm-orbit-grad"
            x1="2"
            y1="2"
            x2="30"
            y2="30"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#A5F3FC" />
            <stop offset="0.5" stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#C7D2FE" />
          </linearGradient>
        </defs>

        {/* Orbit Rings representing blockchain scanning & celestial orbit */}
        <ellipse
          cx="16"
          cy="16"
          rx="12"
          ry="5.5"
          transform="rotate(-28 16 16)"
          stroke="url(#xlm-orbit-grad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="50 15"
        />
        <ellipse
          cx="16"
          cy="16"
          rx="12"
          ry="5.5"
          transform="rotate(32 16 16)"
          stroke="url(#xlm-orbit-grad)"
          strokeWidth="1.6"
          strokeOpacity="0.8"
          strokeDasharray="40 20"
        />

        {/* Radiant Core Star */}
        <circle cx="16" cy="16" r="3" fill="#FFFFFF" />
        <circle
          cx="16"
          cy="16"
          r="4.5"
          stroke="#FFFFFF"
          strokeOpacity="0.4"
          strokeWidth="1"
        />

        {/* 4-point constellation sparkles */}
        <path
          d="M16 6.5V9.5M16 22.5V25.5M6.5 16H9.5M22.5 16H25.5"
          stroke="#E0E7FF"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function Navbar() {
  const { network, setNetwork } = useNetwork();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/90">
      {/* Full width container: heading at start, network selection at right */}
      <div className="flex h-14 w-full items-center justify-between px-4 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition hover:opacity-95"
        >
          <XlmScanLogo />
          <div className="flex items-center gap-0.5 tracking-tight font-heading">
            <span className="text-xl font-bold text-zinc-950 dark:text-zinc-50">
              XLM
            </span>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-cyan-400">
              SCAN
            </span>
          </div>
        </Link>

        {/* Network switch at top bar end */}
        <div className="flex items-center gap-3">
          <div className="relative inline-flex items-center rounded-xl border border-zinc-200/90 bg-zinc-100/80 p-0.5 text-xs shadow-2xs backdrop-blur-xs dark:border-zinc-800 dark:bg-zinc-900/80">
            <button
              type="button"
              onClick={() => setNetwork("mainnet")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                network === "mainnet"
                  ? "bg-white text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <span className="relative flex h-2 w-2">
                {network === "mainnet" && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    network === "mainnet" ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
                  }`}
                />
              </span>
              Mainnet
            </button>

            <button
              type="button"
              onClick={() => setNetwork("testnet")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                network === "testnet"
                  ? "bg-white text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <span className="relative flex h-2 w-2">
                {network === "testnet" && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    network === "testnet" ? "bg-amber-500" : "bg-zinc-300 dark:bg-zinc-600"
                  }`}
                />
              </span>
              Testnet
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
