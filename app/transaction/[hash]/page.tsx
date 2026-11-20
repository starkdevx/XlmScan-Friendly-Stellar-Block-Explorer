"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { HistoryWarning } from "@/components/HistoryWarning";
import { TransactionOverview } from "@/components/TransactionOverview";
import type {
  CanonicalTransaction,
  CoverageInfo,
  HumanizedTransaction,
} from "@/lib/stellar/providers/types";
import { normalizeNetwork } from "@/lib/stellar/validation";

interface TransactionApiResponse {
  transaction?: CanonicalTransaction;
  humanized?: HumanizedTransaction;
  cached?: boolean;
  error?: string;
  coverage?: CoverageInfo;
}

export default function TransactionPage() {
  const params = useParams<{ hash: string }>();
  const searchParams = useSearchParams();
  const hash = decodeURIComponent(params.hash ?? "");
  const network = normalizeNetwork(searchParams.get("network"));

  const [data, setData] = useState<TransactionApiResponse | null>(null);
  const [errorCoverage, setErrorCoverage] = useState<CoverageInfo | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetch(
      `/api/transaction?hash=${encodeURIComponent(hash)}&network=${network}`
    )
      .then(async (res) => {
        const json = (await res.json()) as TransactionApiResponse;
        if (!res.ok) {
          setErrorCoverage(json.coverage);
          throw new Error(json.error ?? "Failed to load transaction");
        }
        return json;
      })
      .then((json) => {
        if (active) setData(json);
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load transaction"
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [hash, network]);

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
            Decoding transaction from Stellar...
          </span>
        </div>
      )}

      {error && !loading && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
            <div className="font-semibold">Transaction unavailable</div>
            <p className="mt-1">{error}</p>
          </div>
          {errorCoverage && <HistoryWarning coverage={errorCoverage} />}
        </div>
      )}

      {data?.transaction && data?.humanized && !loading && (
        <TransactionOverview
          transaction={data.transaction}
          humanized={data.humanized}
          cached={data.cached}
        />
      )}
    </div>
  );
}
