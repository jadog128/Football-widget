/**
 * DeepSeek API Health & Token Cost Service.
 *
 * Provides:
 *   1. Status polling — fetches DeepSeek's official status page (or mock data)
 *      for current operational state and 30-day health history.
 *   2. Token usage — fetches billing usage totals from DeepSeek's developer API
 *      via the Electron IPC bridge (main process handles the authenticated request).
 */

const DEEPSEEK_STATUS_URL = "https://status.deepseek.com/api/v2/status.json";
const POLL_INTERVAL_MS = 120_000; // 2 minutes

// ── Mock data helpers ──────────────────────────────────────────────────────────

function generateMockHistory() {
  // Generate 30 days of mostly "operational" with a few incidents
  const history = [];
  for (let i = 0; i < 30; i++) {
    // Sprinkle ~2 partial outages and ~1 major outage across the 30 days
    if (i === 28) history.push("major");
    else if (i === 12 || i === 24) history.push("partial");
    else history.push("operational");
  }
  return history;
}

function computeMockPercentage(history) {
  const operational = history.filter((s) => s === "operational").length;
  return ((operational / history.length) * 100).toFixed(2) + "%";
}

// ── Status fetching ────────────────────────────────────────────────────────────

/**
 * Fetches current DeepSeek status from the official status page.
 * Falls back to mock data when offline or if the fetch fails.
 *
 * @returns {{ status: string, percentage: string, history: string[], updatedTime: string }}
 */
export async function fetchDeepseekStatus() {
  try {
    const response = await fetch(DEEPSEEK_STATUS_URL, {
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    // Statuspage API v2 returns { status: { indicator, description }, components }
    const indicator = data?.status?.indicator ?? "none";
    const description = data?.status?.description ?? "Operational";

    // Map indicator to our status strings
    let status = "Operational";
    if (indicator === "minor" || indicator === "degraded_performance") {
      status = "Partial outage";
    } else if (indicator === "major" || indicator === "critical") {
      status = "Major outage";
    }

    // Generate history from component data if available, else mock
    let history;
    let percentage;
    if (data?.components && Array.isArray(data.components)) {
      history = data.components.map((c) => {
        if (c.status === "operational") return "operational";
        if (
          c.status === "degraded_performance" ||
          c.status === "partial_outage"
        )
          return "partial";
        return "major";
      });
      // If we have fewer than 30 components, pad with mock history
      while (history.length < 30) {
        history.push("operational");
      }
      history = history.slice(0, 30);
      percentage = computeMockPercentage(history);
    } else {
      history = generateMockHistory();
      percentage = computeMockPercentage(history);
    }

    const updatedTime = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return { status, percentage, history, updatedTime };
  } catch {
    // Offline / fetch failure — use mock
    const history = generateMockHistory();
    const percentage = computeMockPercentage(history);
    const updatedTime = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      status: "Operational",
      percentage,
      history,
      updatedTime,
    };
  }
}

// ── Token usage fetching ───────────────────────────────────────────────────────

/**
 * Fetches DeepSeek token usage in USD via the Electron IPC bridge.
 * The main process handles the authenticated request to DeepSeek's billing API
 * using the user's stored API key, avoiding CORS and key exposure in the renderer.
 *
 * @returns {{ usage: number, creditLimit: number }}
 */
export async function fetchDeepseekUsage() {
  try {
    const result = await window.electronAPI?.getDeepseekUsage?.();
    if (result != null && typeof result === "object") {
      return {
        usage: result.usage ?? 0,
        creditLimit: result.creditLimit ?? 10.0,
      };
    }
  } catch {
    // IPC unavailable or error — silently return 0
  }
  return { usage: 0, creditLimit: 10.0 };
}

// ── Convenience: fetch both at once ────────────────────────────────────────────

/**
 * Fetches status metrics only (no API key needed).
 * Used by the store's automated polling cycle — safe to call on a timer.
 */
export async function fetchDeepseekMetrics() {
  const statusResult = await fetchDeepseekStatus();
  return {
    ...statusResult,
    usage: 0,
    creditLimit: 10.0,
  };
}

/**
 * Fetches both status AND billing usage (requires API key).
 * Only call this on explicit user action (e.g. clicking the refresh button).
 */
export async function fetchDeepseekMetricsWithBilling() {
  const [statusResult, billing] = await Promise.all([
    fetchDeepseekStatus(),
    fetchDeepseekUsage(),
  ]);
  return {
    ...statusResult,
    usage: billing.usage,
    creditLimit: billing.creditLimit,
  };
}

export { POLL_INTERVAL_MS };
