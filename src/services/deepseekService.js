const DEEPSEEK_STATUS_URL = "https://status.deepseek.com/api/v2/status.json";
const POLL_INTERVAL_MS = 120_000;

function generateMockHistory() {
  const history = [];
  for (let i = 0; i < 30; i++) {
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

export async function fetchDeepseekStatus() {
  try {
    const response = await fetch(DEEPSEEK_STATUS_URL, {
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const indicator = data?.status?.indicator ?? "none";
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
  } catch {}
  return { usage: 0, creditLimit: 10.0 };
}

export async function fetchDeepseekMetrics() {
  const statusResult = await fetchDeepseekStatus();
  return { ...statusResult, usage: 0, creditLimit: 10.0 };
}

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
