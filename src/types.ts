export interface Minia2aApiEndpoint {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  url: string;
  trialsUsed: number;
  tags?: string[];
}

export interface Minia2aSearchResult {
  services: Minia2aApiEndpoint[];
  total: number;
  query: string;
}

export interface Minia2aStats {
  services: number;
  totalRequests: number;
  totalTransactions: number;
  walletUsers: number;
  trialsUsed: number;
  uniqueUsers: number;
}

export interface Minia2aApiResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  receipt?: string;
}

export interface Minia2aPluginConfig {
  /** Base URL of the minia2a marketplace (default: https://minia2a.uk) */
  baseUrl?: string;
  /**
   * Reserved. Accepted and ignored: this version has no signed-trial path, so
   * there is no auto-trial to toggle. It previously set an `x402-trial` request
   * header the gateway ignores.
   */
  autoTrial?: boolean;
  /**
   * Accepted and NOT enforced. This version never settles a payment, so there
   * is nothing to cap; the value is not read anywhere.
   */
  maxPricePerCall?: number;
  /**
   * Accepted and NOT used. No x402 signer is wired to it — nothing is signed
   * and no USDC is sent, whether or not this is set.
   */
  paymentPrivateKey?: string;
  /** Maximum total spend in USD cents allowed per agent session (0 = unlimited) */
  maxSpendPerSession?: number;
}
