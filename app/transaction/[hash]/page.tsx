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
            Decoding transaction from Stellar...
          </span>
        </div>
      )}

      {error && !loading && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-200 backdrop-blur-md">
            <div className="font-heading font-bold">Transaction unavailable</div>
            <p className="mt-1 text-amber-300/90">{error}</p>
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
