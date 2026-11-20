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
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to search
      </Link>

      {loading && (
        <div className="flex items-center justify-center rounded-2xl border border-zinc-200 bg-white p-12 dark:border-zinc-800 dark:bg-zinc-900">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          <span className="ml-2.5 text-sm text-zinc-600 dark:text-zinc-400">
            Fetching account balances and recent transfers...
          </span>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          <div className="font-semibold">Unable to load account</div>
          <p className="mt-1">{error}</p>
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
