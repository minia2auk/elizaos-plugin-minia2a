import { Plugin } from "@elizaos/core";
import { searchApisAction } from "./actions/searchApis";
import { callApiAction } from "./actions/callApi";
import { listPopularAction } from "./actions/listPopular";
import { marketplaceStatsProvider } from "./providers/marketplaceStats";
import { Minia2aPluginConfig } from "./types";

export { Minia2aPluginConfig } from "./types";
export { searchApisAction } from "./actions/searchApis";
export { callApiAction } from "./actions/callApi";
export { listPopularAction } from "./actions/listPopular";
export { marketplaceStatsProvider } from "./providers/marketplaceStats";

/**
 * minia2a.uk plugin for ElizaOS
 *
 * Gives your ElizaOS agent the ability to:
 * - Search 299+ x402 pay-per-call APIs (SEARCH_APIS)
 * - Call any endpoint with auto-trial support (CALL_API)
 * - Browse trending/popular services (LIST_POPULAR_APIS)
 * - Get marketplace stats injected into agent context (MINIA2A_MARKETPLACE provider)
 *
 * Configuration via character.json settings.MINIA2A_CONFIG:
 * - baseUrl: minia2a marketplace URL (default: https://minia2a.uk)
 * - autoTrial: use free trials automatically (default: true)
 * - maxPricePerCall: max USD per paid call (default: 0, trials only)
 *
 * @example
 * ```json
 * // In your character.json:
 * {
 *   "plugins": ["@minia2a/elizaos-plugin-minia2a"],
 *   "settings": {
 *     "MINIA2A_CONFIG": {
 *       "autoTrial": true,
 *       "maxPricePerCall": 0.10
 *     }
 *   }
 * }
 * ```
 */
export const minia2aPlugin: Plugin = {
  name: "@minia2a/elizaos-plugin-minia2a",
  npmName: "@minia2a/elizaos-plugin-minia2a",
  description:
    "Discover and call 299+ x402 pay-per-call APIs from minia2a.uk. Search, free trials, and USDC payments on Base.",

  config: {
    baseUrl: "https://minia2a.uk",
    autoTrial: true,
    maxPricePerCall: 0,
  },

  actions: [searchApisAction, callApiAction, listPopularAction],
  providers: [marketplaceStatsProvider],
};

export default minia2aPlugin;
