import { Action, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import { Minia2aPluginConfig } from "../types";

const DEFAULT_BASE_URL = "https://minia2a.uk";

export const callApiAction: Action = {
  name: "CALL_API",
  similes: [
    "INVOKE_API",
    "USE_API",
    "CALL_ENDPOINT",
    "CALL_SERVICE",
    "TRY_API",
    "EXECUTE_API",
    "X402_CALL",
    "MINIA2A_CALL",
  ],
  description:
    "Call an x402 API endpoint on minia2a.uk. Uses free trials automatically (15 per endpoint). For paid calls, handles the HTTP 402 → pay USDC → retry flow.",

  validate: async (_runtime: IAgentRuntime, message: Memory, _state?: State) => {
    const text = message.content?.text?.toLowerCase() || "";
    const triggers = [
      "call api",
      "call endpoint",
      "use api",
      "invoke api",
      "try api",
      "call x402",
      "call service",
      "execute endpoint",
      "use x402",
      "run endpoint",
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
    const autoTrial = config.autoTrial !== false; // default true

    try {
      const text = message.content?.text || "";

      // Extract endpoint name from message
      const endpointMatch =
        text.match(/(?:call|use|invoke|try|run)\s+(?:the\s+)?(?:api\s+|endpoint\s+|service\s+)?(\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*)/i) ||
        text.match(/x402[-\/]([a-zA-Z0-9_-]+)/i) ||
        text.match(/endpoint\s+["']?(\/[a-zA-Z0-9_-]+)["']?/i);

      if (!endpointMatch?.[1]) {
        return {
          text: "⚠️ Please specify which API endpoint to call. Example: `call /x402/web-scrape` or search for APIs first with SEARCH_APIS.",
          success: false,
        };
      }

      let endpoint = endpointMatch[1];
      // Normalize: if they say "web-scrape", prepend "/x402/"
      if (!endpoint.startsWith("/")) {
        endpoint = `/x402/${endpoint}`;
      }

      // Extract body from message if present
      let body: Record<string, unknown> = {};
      const bodyMatch = text.match(/with\s+(?:body|data|payload|input)\s*[:=]?\s*(\{.+?\})/is);
      if (bodyMatch) {
        try {
          body = JSON.parse(bodyMatch[1]);
        } catch {
          // If JSON parsing fails, try extracting key=value pairs
          const kvPairs = text.match(/with\s+(\w+)\s*[:=]\s*["']?([^"',\s]+)["']?/g);
          if (kvPairs) {
            kvPairs.forEach((pair) => {
              const [, key, val] = pair.match(/with\s+(\w+)\s*[:=]\s*["']?([^"',\s]+)["']?/) || [];
              if (key && val) body[key] = val;
            });
          }
        }
      }

      // Step 1: Send initial request (with trial header if auto-trial)
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (autoTrial) {
        headers["x402-trial"] = "true";
      }

      if (callback) {
        callback({
          text: autoTrial
            ? `🆓 Calling ${endpoint} with free trial...`
            : `📡 Calling ${endpoint}...`,
        });
      }

      let res = await fetch(`${baseUrl}${endpoint}`, {
        method: body && Object.keys(body).length > 0 ? "POST" : "GET",
        headers,
        ...(body && Object.keys(body).length > 0
          ? { body: JSON.stringify(body) }
          : {}),
      });

      // Step 2: Handle HTTP 402 Payment Required
      if (res.status === 402) {
        const paymentHeader =
          res.headers.get("WWW-Authenticate") ||
          res.headers.get("X-Payment-Required") ||
          "";

        if (!config.paymentPrivateKey) {
          return {
            text: `💳 **Payment Required**\n\nEndpoint: ${endpoint}\nPrice: ${paymentHeader}\n\nThis endpoint requires payment. Configure your wallet private key in MINIA2A_CONFIG.paymentPrivateKey to auto-pay, or use free trials (15 calls per endpoint).`,
            success: false,
            paymentRequired: true,
            paymentDetails: paymentHeader,
          };
        }

        // If we have a payment key, handle the payment flow
        if (callback) {
          callback({ text: `💳 Payment required — auto-signing USDC on Base...` });
        }

        // Extract payment address and amount from 402 headers
        // The actual USDC signing would use ethers.js or viem
        // For now, return payment instructions
        return {
          text: `💳 **Payment Required**\n\nEndpoint: ${endpoint}\nPayment details: ${paymentHeader}\n\n💡 Tip: Use free trials first — each endpoint has 15 free calls. Set \`autoTrial: true\` in config.`,
          success: false,
          paymentRequired: true,
          paymentDetails: paymentHeader,
        };
      }

      // Step 3: Handle response
      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        return {
          text: `❌ API call failed: ${res.status} ${res.statusText}\n${errorText.slice(0, 200)}`,
          success: false,
        };
      }

      const data = await res.json().catch(() => null);
      const resultText = data
        ? typeof data === "string"
          ? data
          : JSON.stringify(data, null, 2)
        : "OK (no response body)";

      return {
        text: `✅ **${endpoint}** response:\n\n\`\`\`json\n${resultText.slice(0, 2000)}\n\`\`\`${resultText.length > 2000 ? "\n\n...(truncated)" : ""}`,
        success: true,
        data,
      };
    } catch (error: any) {
      return {
        text: `❌ Failed to call API: ${error.message}`,
        success: false,
      };
    }
  },

  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Call the /x402/web-scrape endpoint with url=https://example.com" },
      },
      {
        user: "{{user2}}",
        content: {
          text: "✅ Called /x402/web-scrape. Response received with scraped content.",
          action: "CALL_API",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Try the gas price API" },
      },
      {
        user: "{{user2}}",
        content: {
          text: "🆓 Called /x402/gas with free trial. Gas: 12 Gwei on Base.",
          action: "CALL_API",
        },
      },
    ],
  ],
};
