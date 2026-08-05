import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import { Minia2aPluginConfig } from "../types";

const DEFAULT_BASE_URL = "https://minia2a.uk";

export const marketplaceStatsProvider: Provider = {
  get: async (runtime: IAgentRuntime, _message: Memory, _state?: State) => {
    const pluginConfig = runtime.getSetting("MINIA2A_CONFIG") as Minia2aPluginConfig | undefined;
    const config = pluginConfig || {};
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL;

    try {
      const res = await fetch(`${baseUrl}/api/stats`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        return { text: "", values: {} };
      }

      const stats = await res.json() as Record<string, any>;

      // Build top-10 endpoints summary
      const byEndpoint = stats.trials?.byEndpoint || {};
      const top10 = Object.entries(byEndpoint)
        .sort(([, a]: any, [, b]: any) => b.used - a.used)
        .slice(0, 10)
        .map(([id, data]: [string, any]) => `${id} (${data.used} trials)`)
        .join(", ");

      const serviceCount = stats.services || 299;
      const totalRequests = stats.totalRequests?.toLocaleString() || "0";
      const totalTrials = stats.trials?.totalUsed?.toLocaleString() || "0";
      const uniqueUsers = stats.trials?.totalUniqueUsers || 0;
      const walletCount = stats.trials?.walletUsers || 0;

      const text = [
        `minia2a.uk marketplace: ${serviceCount} services, ${totalRequests} total requests, ${totalTrials} trials used, ${uniqueUsers} developers, ${walletCount} wallets.`,
        `Top APIs: ${top10}.`,
        `Every endpoint has 15 free trial calls. Agents can discover services via SEARCH_APIS and call them via CALL_API with auto-trial support.`,
      ].join(" ");

      return {
        text,
        values: {
          minia2aServices: serviceCount,
          minia2aTrials: stats.trials?.totalUsed || 0,
          minia2aDevelopers: uniqueUsers,
          minia2aWallets: walletCount,
          minia2aTransactions: stats.totalTransactions || 0,
          minia2aTopApis: top10,
        },
      };
    } catch {
      // Graceful degradation — provider failing shouldn't break the agent
      return {
        text: "minia2a.uk marketplace is available with 299+ pay-per-call x402 APIs. Use SEARCH_APIS to discover services.",
        values: {
          minia2aServices: 299,
          minia2aTrials: 0,
          minia2aDevelopers: 0,
        },
      };
    }
  },
};
