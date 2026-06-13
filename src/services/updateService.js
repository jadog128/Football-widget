/**
 * Update Check Service
 *
 * Compares a remote update token against the local known token.
 * When the remote token changes, an update is available.
 *
 * How to publish an update:
 *   1. Change the token in /update-token.txt at the repo root to a new random string
 *   2. Bump the version in /version.json
 *   3. Build and push
 *   4. The app will detect the token mismatch on its next poll
 *
 * The token is a long random string that NEVER changes unless we publish
 * an actual update. Random edits to other files won't trigger false alarms.
 */

const VERSION_URL =
  "https://raw.githubusercontent.com/jadog128/Football-widget/main/version.json";

const TOKEN_URL =
  "https://raw.githubusercontent.com/jadog128/Football-widget/main/update-token.txt";

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

// The current known token — matches update-token.txt in the repo root.
// Only change this when publishing a real update.
const CURRENT_TOKEN =
  "e1b7f6a0c5d4h9i8e3f2j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8f9";

async function fetchText(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function fetchVersionManifest() {
  try {
    const res = await fetch(VERSION_URL, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Checks for an update by comparing the remote token against the local one.
 * Returns update info if available, or { available: false }.
 */
export async function checkForUpdate() {
  const remoteToken = await fetchText(TOKEN_URL);
  if (!remoteToken) return null;

  const trimmed = remoteToken.trim();
  const updateAvailable = trimmed !== CURRENT_TOKEN;

  if (updateAvailable) {
    const manifest = await fetchVersionManifest();
    return {
      available: true,
      version: manifest?.version || "new",
      downloadUrl:
        manifest?.downloadUrl || "https://football-widget.vercel.app",
      releaseNotes: manifest?.releaseNotes || "",
    };
  }

  return { available: false };
}

/**
 * Manually check and show a notification. Returns the update result or null.
 */
export async function checkForUpdatesAndNotify(addNotification) {
  try {
    const update = await checkForUpdate();
    if (update?.available) {
      addNotification({
        id: Date.now(),
        type: "update",
        scoringTeam: `Update v${update.version} Available`,
        opponent:
          update.releaseNotes || "Click to download the latest version.",
        homeScore: "⬇ Download",
        awayScore: "",
        competition: "Update",
        status: "finished",
        teamColor: "#E9A84A",
        downloadUrl: update.downloadUrl,
      });
      return update;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Starts background polling. Returns a cleanup function.
 */
/** Cooldown between update notifications (24 hours) */
const NOTIFY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/**
 * Starts background polling. Returns a cleanup function.
 * Uses a 24-hour cooldown: if multiple versions release in a day,
 * only the first triggers a notification. The user sees whichever
 * version was latest at that moment.
 */
export function startUpdatePolling(addNotification) {
  let active = true;

  const poll = async () => {
    if (!active) return;

    try {
      const update = await checkForUpdate();
      if (!active) return;

      if (update?.available) {
        // Check cooldown — only notify once per 24 hours
        let lastNotifiedTime = 0;
        try {
          lastNotifiedTime = parseInt(
            localStorage.getItem("updateNotifiedTime") || "0",
            10,
          );
        } catch {}

        const now = Date.now();
        if (now - lastNotifiedTime > NOTIFY_COOLDOWN_MS) {
          try {
            localStorage.setItem("updateNotifiedTime", String(now));
          } catch {}

          addNotification({
            id: Date.now(),
            type: "update",
            scoringTeam: `Update v${update.version} Available`,
            opponent:
              update.releaseNotes || "Click to download the latest version.",
            homeScore: "⬇ Download",
            awayScore: "",
            competition: "Update",
            status: "finished",
            teamColor: "#E9A84A",
            downloadUrl: update.downloadUrl,
          });
        }
      }
    } catch {}

    if (active) {
      setTimeout(poll, CHECK_INTERVAL_MS);
    }
  };

  const initialTimer = setTimeout(poll, 30_000);

  return () => {
    active = false;
    clearTimeout(initialTimer);
  };
}
