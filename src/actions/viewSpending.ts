import { Action, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import { getSpendSummary } from "../spending";

export const viewSpendingAction: Action = {
  name: "VIEW_SPENDING",
  similes: [
    "CHECK_SPENDING",
    "VIEW_BUDGET",
    "SPENDING_STATUS",
    "CHECK_BUDGET",
    "HOW_MUCH_SPENT",
    "MINIA2A_SPENDING",
  ],
  description:
    "View current session spending on minia2a API calls. Shows total spent, remaining budget, and call count.",

  validate: async (_runtime: IAgentRuntime, message: Memory, _state?: State) => {
    const text = message.content?.text?.toLowerCase() || "";
    const triggers = [
      "view spending",
      "check spending",
      "how much spent",
      "budget status",
      "view budget",
      "check budget",
      "spending status",
      "remaining budget",
    ];
    return triggers.some((t) => text.includes(t));
  },

  handler: async (
    runtime: IAgentRuntime,
    _message: Memory,
    _state?: State,
    _options?: { [key: string]: unknown },
    _callback?: HandlerCallback
  ) => {
    const summary = getSpendSummary(runtime.agentId);
    return {
      text: summary,
      success: true,
    };
  },

  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "How much have I spent on API calls this session?" },
      },
      {
        user: "{{user2}}",
        content: {
          text: "💰 Session Spending: $0.15 across 3 paid calls. Budget: $5.00 (3% used). Remaining: $4.85.",
          action: "VIEW_SPENDING",
        },
      },
    ],
  ],
};
