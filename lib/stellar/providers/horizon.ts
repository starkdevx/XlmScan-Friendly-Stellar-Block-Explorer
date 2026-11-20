import type { StellarNetwork } from "../validation";
import { QuickNodeProvider } from "./quicknode";

/**
 * Public Stellar Horizon + Soroban RPC fallback provider.
 * Used when Alchemy/QuickNode credentials are not configured or as last-resort fallback.
 */
export class PublicHorizonProvider extends QuickNodeProvider {
  override readonly name = "horizon_public" as const;

  protected override getRpcUrl(network: StellarNetwork): string | undefined {
    return network === "testnet"
      ? "https://soroban-testnet.stellar.org"
      : "https://mainnet.sorobanrpc.com";
  }

  protected override getHorizonUrl(network: StellarNetwork): string | undefined {
    return network === "testnet"
      ? "https://horizon-testnet.stellar.org"
      : "https://horizon.stellar.org";
  }

  override isConfigured(_network: StellarNetwork): boolean {
    return true;
  }
}
