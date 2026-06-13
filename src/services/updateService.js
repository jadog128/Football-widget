/**
 * Update Check Service
 *
 * Periodically checks a hosted version.json for newer releases.
 * When a newer version is detected, fires a toast notification with
 * a download link to the Vercel landing page.
 *
 * How to publish an update:
 *   1. Bump the "version" field in /version.json at the repo root
 *   2. Push to GitHub
 *   3. The app will detect the change on its next poll (every 6 hours)
 */

// ── Config ────────────────────────────────────────────────────────────────────

// URL to the hosted version manifest. Update this to your Vercel/GitHub URL.
const VERSION_URL =
  "https://raw.githubusercontent.com/jadog128/Football-widget/main/version.json";

// How often to check for updates (milliseconds) — 6 hours
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

// Minimum interval between notifications for the same version (1 day)
const NOTIFY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

// Current app version — injected at build time or falls back to package.json
const APP_VERSION = "__APP_VERSION__";

// ── Update check ──────────────────────────────────────────────────────────────

/**
 * Compares two semver strings. Returns true if version a is newer than b.
 */
function isNewerVersion(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return true;
    if (na < nb) return false;
  }
  return false;
}

/**
 * Fetches the remote version manifest and returns it.
 * Returns null on failure (offline, network error, etc.)
 */
async function fetchVersionManifest() {
  try {
    const res = await fetch(VERSION_URL, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Checks for updates and returns update info if available.
 * @returns {{ available: boolean, version: string, downloadUrl: string, releaseNotes: string } | null}
 */
export async function checkForUpdate() {
  const manifest = await fetchVersionManifest();
  if (!manifest || !manifest.version) return null;

  const remoteVersion = manifest.version;
  // Use a build-time injected version or fallback
  const currentVersion = APP_VERSION.startsWith("__APP_")
    ? "7.9.4"
    : APP_VERSION;

  if (isNewerVersion(remoteVersion, currentVersion)) {
    return {
      available: true,
      version: remoteVersion,
      downloadUrl: manifest.downloadUrl || "https://football-widget.vercel.app",
      releaseNotes: manifest.releaseNotes || "",
    };
  }

  return { available: false };
}

/**
 * Starts background update polling. Returns a cleanup function.
 * Fires a toast notification when an update is found.
 */
export function startUpdatePolling(addNotification) {
  let active = true;
  let lastNotifiedVersion = null;

  // Read last notified version from localStorage to avoid spam across restarts
  try {
    lastNotifiedVersion = localStorage.getItem("updateNotifiedVersion");
  } catch {}

  const poll = async () => {
    if (!active) return;

    try {
      const update = await checkForUpdate();
      if (!active) return;

      if (update?.available) {
        // Only notify once per version
        if (update.version !== lastNotifiedVersion) {
          lastNotifiedVersion = update.version;
          try {
            localStorage.setItem("updateNotifiedVersion", update.version);
          } catch {}

          addNotification({
            id: Date.now(),
            type: "update",
            scoringTeam: `Update v${update.version} Available`,
            opponent: update.releaseNotes
              ? update.releaseNotes
              : "Click to download the latest version.",
            homeScore: "⬇ Download",
            awayScore: "",
            competition: "Update",
            status: "finished",
            teamColor: "#E9A84A",
            downloadUrl: update.downloadUrl,
          });
        }
      }
    } catch {
      // Silently retry next cycle
    }

    if (active) {
      setTimeout(poll, CHECK_INTERVAL_MS);
    }
  };

  // First check after a short delay so the app is fully loaded
  const initialTimer = setTimeout(poll, 30_000);

  return () => {
    active = false;
    clearTimeout(initialTimer);
  };
}
