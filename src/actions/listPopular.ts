import { Action, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import { Minia2aPluginConfig } from "../types";

const DEFAULT_BASE_URL = "https://minia2a.uk";

export const listPopularAction: Action = {
  name: "LIST_POPULAR_APIS",
  similes: [
    "POPULAR_APIS",
    "TRENDING_APIS",
    "TOP_APIS",
    "BROWSE_MARKETPLACE",
    "SHOW_MARKETPLACE",
    "WHAT_APIS_ARE_AVAILABLE",
    "MINIA2A_CATALOG",
    "LIST_SERVICES",
  ],
  description:
    "List popular or trending APIs from the minia2a.uk marketplace. Shows the most-used endpoints with trial counts and categories.",

  validate: async (_runtime: IAgentRuntime, message: Memory, _state?: State) => {
    const text = message.content?.text?.toLowerCase() || "";
    const triggers = [
      "popular api",
      "trending api",
      "top api",
      "browse marketplace",
      "show marketplace",
      "what apis",
      "list api",
      "available api",
      "show catalog",
      "list services",
      "marketplace",
    ];
    return triggers.some((t) => text.includes(t));
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
      if (callback) {
        callback({ text: "📊 Fetching minia2a.uk marketplace stats..." });
      }

      const [statsRes, categoriesRes] = await Promise.all([
        fetch(`${baseUrl}/api/stats`),
        fetch(`${baseUrl}/api/v1/services?limit=20`),
      ]);

      if (!statsRes.ok) {
        throw new Error(`Stats API returned ${statsRes.status}`);
      }

      const stats = await statsRes.json() as Record<string, any>;
      let services: any[] = [];
      if (categoriesRes.ok) {
        const catData = await categoriesRes.json() as Record<string, any>;
        services = catData.services || catData || [];
      }

      // Get top endpoints by trial usage
      const topEndpoints = Object.entries(stats.trials?.byEndpoint || {})
        .sort(([, a]: any, [, b]: any) => b.used - a.used)
        .slice(0, 10);

      const serviceCount = stats.services || 299;
      const totalReqs = stats.totalRequests?.toLocaleString() || "0";
      const totalTrials = stats.trials?.totalUsed?.toLocaleString() || "0";
      const wallets = stats.trials?.walletUsers || 0;
      const devs = stats.trials?.totalUniqueUsers || 0;

      const lines = [
        `📊 **minia2a.uk Marketplace**`,
        "",
        `🔢 **${serviceCount} services** | ${totalReqs} total requests | ${totalTrials} trials`,
        `👛 ${wallets} wallets | ${devs} developers`,
        "",
        `🔥 **Most Popular APIs:**`,
        ...topEndpoints.map(
          ([id, data]: [string, any], i: number) =>
            `${i + 1}. **${id}** — ${data.used?.toLocaleString() || 0} trials, ${data.users || 0} users`
        ),
        "",
        `💡 Each endpoint includes **15 free trial calls**. Use SEARCH_APIS to find specific services, CALL_API to try one.`,
        `🌐 ${baseUrl}`,
      ];

      return {
        text: lines.join("\n"),
        success: true,
        data: { stats, topEndpoints, services },
      };
    } catch (error: any) {
      return {
        text: `❌ Failed to fetch marketplace data: ${error.message}`,
        success: false,
      };
    }
  },

  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "What APIs are available on the marketplace?" },
      },
      {
        user: "{{user2}}",
        content: {
          text: "📊 minia2a.uk: 299 services, 355K requests, 8,144 trials. 42 wallets, 318 developers. Top: CAPTCHA Solve (1,052), Recall (876), Find (659)...",
          action: "LIST_POPULAR_APIS",
        },
      },
    ],
  ],
};
