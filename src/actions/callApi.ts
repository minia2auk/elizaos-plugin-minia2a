import { Action, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import { Minia2aPluginConfig } from "../types";
import { initSpendingTracker, canAfford, recordSpend } from "../spending";

const DEFAULT_BASE_URL = "https://minia2a.uk";

/**
 * A 402 from the gateway carries the canonical challenge in the
 * `payment-required` response header: base64(JSON) with an `accepts[]` array.
 * `WWW-Authenticate` / `X-Payment-Required` are legacy shapes this gateway does
 * not send; reading only those (as an earlier version did) left the price blank.
 */
function readChallenge(res: Response): {
  price?: string;
  error?: string;
  nextSteps: string[];
} {
  const raw = res.headers.get("payment-required") || res.headers.get("PAYMENT-REQUIRED");
  if (!raw) return { nextSteps: [] };
  try {
    const json = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    const accept = Array.isArray(json.accepts) ? json.accepts[0] : undefined;
    const amount = accept?.amount;
    const usd = amount != null ? Number(amount) / 1e6 : NaN;
    return {
      price: Number.isFinite(usd) ? `${usd} USDC on ${accept?.network || "?"}` : undefined,
      error: typeof json.message === "string" ? json.message : undefined,
      nextSteps: Array.isArray(json.nextSteps)
        ? json.nextSteps.filter((s: unknown): s is string => typeof s === "string")
        : [],
    };
  } catch {
    return { nextSteps: [] };
  }
}

const TRIAL_HOW_TO =
  "\n\n**Free trials are wallet-based.** Sign `minia2a trial:<wallet>:<service-id>:<unixSeconds>`" +
  " (EIP-191), then send `?wallet=` together with the `X-Wallet-Signature` and `X-Trial-Timestamp`" +
  " headers to draw 5 free calls — no registration. This plugin does not sign that message for you." +
  " A bare `?trial=1` draws nothing; the gateway says so in its own AGENTS.md.";

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
    "Call an x402 API endpoint on minia2a.uk and return its response. On HTTP 402 it reports the price and the exact signed-trial recipe. It does not sign trials and does not settle payments.",

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
    const maxSpend = config.maxSpendPerSession || 0;

    // Initialize session spending tracker if budget is configured
    if (maxSpend > 0) {
      initSpendingTracker(runtime.agentId, maxSpend);
    }

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

      // Step 1: Send the request.
      // There is no request header that grants a trial. Older versions set
      // `x402-trial: true`, which the gateway ignores — it returned a 402
      // byte-identical to the unheadered baseline, under a "with free trial"
      // message. Trials are drawn by a signed wallet (see TRIAL_HOW_TO).
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (callback) {
        callback({ text: `📡 Calling ${endpoint}...` });
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
        const challenge = readChallenge(res);
        const head =
          `💳 **Payment Required**\n\nEndpoint: ${endpoint}` +
          (challenge.price ? `\nPrice: ${challenge.price}` : "") +
          (challenge.error ? `\nGateway: ${challenge.error}` : "") +
          (challenge.nextSteps.length
            ? `\n\nGateway next steps:\n${challenge.nextSteps.map((s) => `- ${s}`).join("\n")}`
            : "");

        if (!config.paymentPrivateKey) {
          return {
            text: head + TRIAL_HOW_TO,
            success: false,
            paymentRequired: true,
            paymentDetails: challenge.price,
          };
        }

        // Budget check before payment
        if (maxSpend > 0) {
          const budgetCheck = canAfford(runtime.agentId, 1); // approximate 1¢ minimum check
          if (!budgetCheck.allowed) {
            return {
              text: `🛑 ${budgetCheck.reason}\n\nUse a signed wallet trial (see below) or increase maxSpendPerSession in config.` + TRIAL_HOW_TO,
              success: false,
              budgetExceeded: true,
            };
          }
        }

        // `paymentPrivateKey` is accepted by this plugin but had no payment
        // signer behind it: an earlier version printed "auto-signing USDC on
        // Base..." and then returned instructions without signing anything.
        // Report that plainly instead of implying a settlement.
        return {
          text:
            head +
            "\n\n**No payment was made.** `paymentPrivateKey` is configured, but this version has no" +
            " x402 signer wired to it — nothing was signed and no USDC was sent." +
            TRIAL_HOW_TO,
          success: false,
          paymentRequired: true,
          paymentDetails: challenge.price,
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

      // The gateway names this `x-minia2a-receipt` (not `X-Receipt`).
      const receipt = res.headers.get("x-minia2a-receipt");

      return {
        text: `✅ **${endpoint}** response:\n\n\`\`\`json\n${resultText.slice(0, 2000)}\n\`\`\`${resultText.length > 2000 ? "\n\n...(truncated)" : ""}${receipt ? `\n\nReceipt: \`${receipt}\`` : ""}`,
        success: true,
        data,
        receipt: receipt || undefined,
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
          text: "💳 /x402/gas returned HTTP 402 — 0.5 USDC on eip155:8453. To draw a free trial, sign \"minia2a trial:<wallet>:x402-gas:<unixSeconds>\" and send it with ?wallet= and the X-Wallet-Signature / X-Trial-Timestamp headers.",
          action: "CALL_API",
        },
      },
    ],
  ],
};
