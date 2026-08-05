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
  /** Whether to auto-use free trials when available */
  autoTrial?: boolean;
  /** Maximum price in USD the agent is authorized to pay per call (0 = trials only) */
  maxPricePerCall?: number;
  /** Wallet private key for signing x402 payments on Base */
  paymentPrivateKey?: string;
}
