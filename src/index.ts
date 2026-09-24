import { Plugin } from "@elizaos/core";
import { searchApisAction } from "./actions/searchApis";
import { callApiAction } from "./actions/callApi";
import { listPopularAction } from "./actions/listPopular";
import { viewSpendingAction } from "./actions/viewSpending";
import { marketplaceStatsProvider } from "./providers/marketplaceStats";
import { Minia2aPluginConfig } from "./types";

export { Minia2aPluginConfig } from "./types";
export { searchApisAction } from "./actions/searchApis";
export { callApiAction } from "./actions/callApi";
export { listPopularAction } from "./actions/listPopular";
export { viewSpendingAction } from "./actions/viewSpending";
export { marketplaceStatsProvider } from "./providers/marketplaceStats";
export { initSpendingTracker, getSpending, getSpendSummary, canAfford, recordSpend, resetSpending } from "./spending";

/**
 * minia2a.uk plugin for ElizaOS
 *
 * Gives your ElizaOS agent the ability to:
 * - Search 1,680+ x402 pay-per-call APIs (SEARCH_APIS)
 * - Call any endpoint and, on 402, get its price + the signed-trial recipe (CALL_API)
 * - Browse trending/popular services (LIST_POPULAR_APIS)
 * - Track API spending per session (VIEW_SPENDING)
 * - Get marketplace stats injected into agent context (MINIA2A_MARKETPLACE provider)
 *
 * What this version does NOT do: it does not sign trials and does not settle
 * payments. A 402 is reported to you, never paid.
 *
 * Configuration via character.json settings.MINIA2A_CONFIG:
 * - baseUrl: minia2a marketplace URL (default: https://minia2a.uk)
 * - maxSpendPerSession: total USD cents budget cap per session (0 = unlimited)
 * - autoTrial, maxPricePerCall, paymentPrivateKey: accepted but not used —
 *   there is no signed-trial path and no x402 signer behind them.
 *
 * @example
 * ```json
 * // In your character.json:
 * {
 *   "plugins": ["@minia2a/elizaos-plugin-minia2a"],
 *   "settings": {
 *     "MINIA2A_CONFIG": {
 *       "autoTrial": true,
 *       "maxPricePerCall": 0.10,
 *       "maxSpendPerSession": 500
 *     }
 *   }
 * }
 * ```
 */
export const minia2aPlugin: Plugin = {
  name: "@minia2a/elizaos-plugin-minia2a",
  npmName: "@minia2a/elizaos-plugin-minia2a",
  description:
    "Discover and call 1,680+ x402 pay-per-call APIs from minia2a.uk. Live marketplace search, spending tracking, and the signed-trial recipe on HTTP 402. This version does not sign trials and does not settle payments.",

  config: {
    baseUrl: "https://minia2a.uk",
    autoTrial: true,
    maxPricePerCall: 0,
    maxSpendPerSession: 0,
  },

  actions: [searchApisAction, callApiAction, listPopularAction, viewSpendingAction],
  providers: [marketplaceStatsProvider],
};

export default minia2aPlugin;
