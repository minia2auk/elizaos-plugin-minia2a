import { Action, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import { Minia2aPluginConfig, Minia2aSearchResult } from "../types";

const DEFAULT_BASE_URL = "https://minia2a.uk";

async function searchApis(
  query: string,
  category?: string,
  baseUrl: string = DEFAULT_BASE_URL
): Promise<Minia2aSearchResult> {
  const body: Record<string, string> = { query };
  if (category) body.category = category;

  const res = await fetch(`${baseUrl}/x402/find`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`minia2a search failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<Minia2aSearchResult>;
}

export const searchApisAction: Action = {
  name: "SEARCH_APIS",
  similes: [
    "FIND_API",
    "SEARCH_MARKETPLACE",
    "LOOKUP_API",
    "DISCOVER_SERVICES",
    "FIND_ENDPOINT",
    "SEARCH_X402",
    "MINIA2A_SEARCH",
  ],
  description:
    "Search the minia2a.uk marketplace for x402 pay-per-call APIs by keyword or category. Returns matching services with prices, descriptions, and trial usage stats.",

  validate: async (_runtime: IAgentRuntime, message: Memory, _state?: State) => {
    const text = message.content?.text?.toLowerCase() || "";
    // Trigger when agent needs to find an API/service
    const searchTriggers = [
      "search for api",
      "find api",
      "look for service",
      "search marketplace",
      "discover api",
      "find endpoint",
      "what apis",
      "search minia2a",
      "find tool",
      "look up service",
    ];
    return searchTriggers.some((t) => text.includes(t));
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
    _options?: { [key: string]: unknown },
    callback?: HandlerCallback
  ) => {
    const config = (runtime.getSetting("MINIA2A_CONFIG") as Minia2aPluginConfig) || {};
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL;

    try {
      const text = message.content?.text || "";
      // Extract search query from the message
      const queryMatch =
        text.match(/search (?:for |the )?(?:api |service |endpoint )?(?:for |about )?["']?([^"']+)["']?/i) ||
        text.match(/find (?:me |an |a )?(?:api |service |endpoint )?(?:for |about )?["']?([^"']+)["']?/i) ||
        text.match(/(?:what|which) (?:api|service|endpoint)s? (?:can|could) (?:help with |do )?["']?([^"']+)["']?/i);

      const query = queryMatch?.[1]?.trim() || "x402 services";

      if (callback) {
        callback({ text: `🔍 Searching minia2a.uk for "${query}"...` });
      }

      const result = await searchApis(query, undefined, baseUrl);

      if (!result.services || result.services.length === 0) {
        return {
          text: `No APIs found for "${query}" on minia2a.uk. Try a broader search term or browse categories at ${baseUrl}.`,
          success: false,
        };
      }

      const topResults = result.services.slice(0, 10);
      const lines = [
        `📡 **minia2a.uk Search: "${query}"** — ${result.total || result.services.length} results`,
        "",
        ...topResults.map(
          (s, i) =>
            `${i + 1}. **${s.name}** (${s.id}) — ${s.price || 0}¢/call → ${s.description?.slice(0, 80) || "No description"}`
        ),
        "",
        `💡 Each wallet gets **5 free trial calls**. Use CALL_API to try one.`,
        `📋 Full catalog: ${baseUrl}`,
      ];

      return {
        text: lines.join("\n"),
        success: true,
        data: { services: topResults, total: result.total },
      };
    } catch (error: any) {
      return {
        text: `❌ Failed to search minia2a marketplace: ${error.message}`,
        success: false,
      };
    }
  },

  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Search for APIs that can scrape websites" },
      },
      {
        user: "{{user2}}",
        content: {
          text: "📡 **minia2a.uk Search** — found 3 services for web scraping. Top: x402-web-scrape (5¢/call), x402-web-retrieve (3¢/call). Each wallet gets 5 free trials.",
          action: "SEARCH_APIS",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "I need a crypto price API — find one on the marketplace" },
      },
      {
        user: "{{user2}}",
        content: {
          text: "📡 Found crypto APIs: x402-price-oracle (3¢/call), x402-crypto-price (2¢/call). Try any with 5 free trial calls.",
          action: "SEARCH_APIS",
        },
      },
    ],
  ],
};
