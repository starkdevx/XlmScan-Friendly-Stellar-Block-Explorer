"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { StellarNetwork } from "@/lib/stellar/validation";

interface NetworkContextValue {
  network: StellarNetwork;
  setNetwork: (net: StellarNetwork) => void;
}

const NetworkContext = createContext<NetworkContextValue>({
  network: "mainnet",
  setNetwork: () => {},
});

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const urlNetwork =
    searchParams.get("network") === "testnet" ? "testnet" : "mainnet";
  const [network, setNetworkState] = useState<StellarNetwork>(urlNetwork);

  useEffect(() => {
    const netFromUrl =
      searchParams.get("network") === "testnet" ? "testnet" : "mainnet";
    setNetworkState(netFromUrl);
  }, [searchParams]);

  const setNetwork = (newNetwork: StellarNetwork) => {
    setNetworkState(newNetwork);
    const params = new URLSearchParams(searchParams.toString());
    if (newNetwork === "mainnet") {
      params.delete("network");
    } else {
      params.set("network", newNetwork);
    }
    const queryString = params.toString();
    startTransition(() => {
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
    });
  };

  return (
    <NetworkContext.Provider value={{ network, setNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
