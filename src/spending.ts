/**
 * Session-level spending tracker for budget controls.
 *
 * Tracks cumulative spend within a single agent session.
 * When maxSpendPerSession is configured, CALL_API reports the budget as
 * exhausted once it is spent, instead of returning the 402 challenge.
 *
 * Note: this version never settles a payment, so `totalCents` stays at 0 and
 * the cap cannot bind in practice. It is wired, not meaningful yet.
 */

interface SessionSpend {
  totalCents: number;
  callCount: number;
  maxBudgetCents: number; // 0 = unlimited
  startTime: number;
}

const sessions = new Map<string, SessionSpend>();

function getSessionId(runtimeId: string): string {
  return `minia2a-spend-${runtimeId}`;
}

export function initSpendingTracker(
  runtimeId: string,
  maxSpendPerSession: number
): void {
  const sessionId = getSessionId(runtimeId);
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      totalCents: 0,
      callCount: 0,
      maxBudgetCents: maxSpendPerSession,
      startTime: Date.now(),
    });
  }
}

export function getSpending(runtimeId: string): SessionSpend | undefined {
  return sessions.get(getSessionId(runtimeId));
}

export function canAfford(
  runtimeId: string,
  priceCents: number
): { allowed: boolean; reason?: string } {
  const session = sessions.get(getSessionId(runtimeId));
  if (!session) return { allowed: true }; // No tracker = no limit

  if (session.maxBudgetCents === 0) return { allowed: true }; // Unlimited

  const projected = session.totalCents + priceCents;
  if (projected > session.maxBudgetCents) {
    return {
      allowed: false,
      reason: `Budget exceeded: $${(session.totalCents / 100).toFixed(2)} spent + $${(priceCents / 100).toFixed(2)} would exceed $${(session.maxBudgetCents / 100).toFixed(2)} session limit`,
    };
  }

  return { allowed: true };
}

export function recordSpend(
  runtimeId: string,
  priceCents: number
): void {
  const session = sessions.get(getSessionId(runtimeId));
  if (session) {
    session.totalCents += priceCents;
    session.callCount++;
  }
}

export function getSpendSummary(runtimeId: string): string {
  const session = sessions.get(getSessionId(runtimeId));
  if (!session) return "No spending tracker active.";

  const elapsed = Math.round((Date.now() - session.startTime) / 1000);
  const budgetStatus =
    session.maxBudgetCents === 0
      ? "unlimited"
      : `$${(session.maxBudgetCents / 100).toFixed(2)} (${((session.totalCents / session.maxBudgetCents) * 100).toFixed(0)}% used)`;

  return [
    `💰 **Session Spending** (${elapsed}s elapsed)`,
    `  Total spent: $${(session.totalCents / 100).toFixed(2)} across ${session.callCount} paid call(s)`,
    `  Budget: ${budgetStatus}`,
    session.maxBudgetCents > 0
      ? `  Remaining: $${((session.maxBudgetCents - session.totalCents) / 100).toFixed(2)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function resetSpending(runtimeId: string): void {
  sessions.delete(getSessionId(runtimeId));
}
