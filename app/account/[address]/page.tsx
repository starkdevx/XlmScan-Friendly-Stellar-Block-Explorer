"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { AccountOverview } from "@/components/AccountOverview";
import type {
  AccountBalance,
  CoverageInfo,
  TransferRecord,
} from "@/lib/stellar/providers/types";
import { normalizeNetwork } from "@/lib/stellar/validation";

interface AccountApiResponse {
  network: "mainnet" | "testnet";
  address: string;
  label?: string;
  summary: string;
  balances: AccountBalance[];
  asOfLedger?: number;
  balanceCoverage: CoverageInfo;
  balanceCached?: boolean;
  transfers: TransferRecord[];
  transferCoverage: CoverageInfo;
  error?: string;
}

export default function AccountPage() {
  const params = useParams<{ address: string }>();
  const searchParams = useSearchParams();
  const address = decodeURIComponent(params.address ?? "");
  const network = normalizeNetwork(searchParams.get("network"));

  const [data, setData] = useState<AccountApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetch(
      `/api/account?address=${encodeURIComponent(address)}&network=${network}`
    )
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error ?? "Failed to load account");
        }
        return json as AccountApiResponse;
      })
      .then((json) => {
        if (active) setData(json);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load account");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [address, network]);

  return (
    <div className="relative space-y-6">
      <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[560px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-500/20 via-cyan-400/15 to-purple-500/20 blur-3xl opacity-60" />

      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-cyan-400/40 hover:bg-white/10 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to search
      </Link>

      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-white/10 bg-[#0d1324]/85 p-16 backdrop-blur-xl">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
          <span className="font-heading text-sm font-medium text-slate-300">
            Fetching account balances and recent transfers...
          </span>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-200 backdrop-blur-md">
          <div className="font-heading font-bold">Unable to load account</div>
          <p className="mt-1 text-rose-300/90">{error}</p>
        </div>
      )}

      {data && !loading && (
        <AccountOverview
          address={data.address}
          network={data.network}
          label={data.label}
          summary={data.summary}
          balances={data.balances}
          asOfLedger={data.asOfLedger}
          balanceCoverage={data.balanceCoverage}
          balanceCached={data.balanceCached}
          transfers={data.transfers}
          transferCoverage={data.transferCoverage}
        />
      )}
    </div>
  );
}
