# Stellar Plain-English Explorer (v0)

An on-demand, natural-language Stellar block explorer that translates Stellar accounts, transactions, and wallet questions into clear, verified plain-English explanations.

## Architecture

- **Data Layer (`lib/stellar/`)**: On-demand retrieval with no continuous blockchain indexing. Supports **Alchemy Stellar RPC & Data API** (primary when `ALCHEMY_API_KEY` is set), **QuickNode Stellar RPC & Horizon** (secondary fallback), and **Public Stellar Horizon / Soroban RPC** (out-of-the-box fallback).
- **Interpretation Layer (`lib/stellar/transaction-decoder.ts`, `operation-decoder.ts`, `event-decoder.ts`, `humanizer.ts`)**: Uses `@stellar/stellar-sdk` for XDR decoding and deterministic templates for human-readable explanations (including multi-operation transactions, failed transactions, and SEP-41 Soroban token events).
- **Natural-Language Query Pipeline (`lib/ai/`)**: Uses structured-output LLM intent parsing via **Groq** (`llama-3.1-8b-instant` + optional `meta-llama/llama-prompt-guard-2-86m` safety guard) and **Google Gemini** (`gemini-3.5-flash-lite`) with 2:1 weighted round-robin routing, automatic 429 failover, and a deterministic rule-based fallback. Zod validates every intent, and amounts/counts are always computed deterministically from on-chain records.
- **Caching & Persistence (`lib/db/`, `lib/cache/`)**: MongoDB Atlas + Mongoose (`transactions`, `accounts`, `queryCache`, `rateLimits`, `labels`) with an automatic in-memory fallback when `MONGODB_URI` is not set.

## Getting Started

1. Copy `.env.example` to `.env.local` and optionally add your provider/database/LLM keys:
   ```bash
   cp .env.example .env.local
   ```
   *(Works out of the box without API keys using public Stellar Horizon/RPC, deterministic NL intent parsing, and in-memory caching.)*

2. Install dependencies and run the dev server:
   ```bash
   npm install
   npm run dev
   ```

3. Run typecheck, tests, and production build:
   ```bash
   npm run typecheck
   npm test
   npm run build
   ```
