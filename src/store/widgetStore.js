import { create } from "zustand";
import {
  fetchDeepseekMetrics,
  POLL_INTERVAL_MS,
} from "../services/deepseekService";

function computeMascotState(match) {
  if (!match) return "sleep";
  if (match.status === "live") return "alert";
  const minsUntil = (new Date(match.kickoff) - Date.now()) / 60_000;
  if (minsUntil >= 0 && minsUntil <= 120) return "hype";
  return "idle";
}

export const useWidgetStore = create((set, get) => ({
  // ── View ──────────────────────────────────────────────────────────────────
  viewMode: "wide",
  alwaysOnTop: false,
  panelOpen: false,
  widgetAiOpen: false,
  expandedMatchId: null,
  activeSubTab: "stats",

  // ── Notifications ─────────────────────────────────────────────────────────
  notifications: [],
  showFollowedOnly: false,
  followedOnlyActive: false,

  // ── Favourite team goal match cache ───────────────────────────────────────
  _prevFavScores: {}, // { matchId: { home, away } }

  // ── DeepSeek Status ────────────────────────────────────────────────────────
  deepseekStatus: "Operational",
  deepseekPercentage: "99.94%",
  deepseekUsage: 0,
  deepseekCreditLimit: 10.0,
  deepseekHistory: Array.from({ length: 30 }, (_, i) => {
    if (i === 28) return "major";
    if (i === 12 || i === 24) return "partial";
    return "operational";
  }),
  deepseekUpdatedTime: "--:--",
  deepseekError: null,

  // ── Data ──────────────────────────────────────────────────────────────────
  rawMatches: [], // unfiltered original matches list
  matches: [], // filtered + sorted upcoming + live (widget carousel)
  recentMatches: [], // last 3 finished (panel only)
  currentMatchIndex: 0,
  currentMatch: null,
  mascotState: "sleep",
  widgetAiMatchId: null,
  widgetAiMessages: [],
  widgetAiLoading: false,

  isLoading: false,
  error: null,
  lastUpdated: null,

  // ── Actions ───────────────────────────────────────────────────────────────

  setViewMode: (mode) => {
    set({ viewMode: mode });
    window.electronAPI?.setViewMode(mode);
  },

  cycleViewMode: () => {
    const { viewMode } = get();
    let next = "wide";
    if (viewMode === "wide") next = "compact";
    else if (viewMode === "compact") next = "mini";
    else next = "wide";
    get().setViewMode(next);
  },

  setAlwaysOnTop: (value) => {
    set({ alwaysOnTop: value });
    window.electronAPI?.setAlwaysOnTop(value);
  },

  togglePanel: () => {
    const { panelOpen, viewMode } = get();
    const next = !panelOpen;
    set({ panelOpen: next, widgetAiOpen: false, expandedMatchId: null });
    window.electronAPI?.setPanelOpen(next, viewMode);
  },

  closePanel: () => {
    const { viewMode } = get();
    set({ panelOpen: false, widgetAiOpen: false, expandedMatchId: null });
    window.electronAPI?.setPanelOpen(false, viewMode);
  },

  toggleWidgetAi: (matchId) => {
    const { widgetAiOpen, viewMode } = get();
    const next = !widgetAiOpen;

    if (next) {
      const match =
        get().matches.find((m) => m.id === matchId) || get().currentMatch;
      set({
        panelOpen: false,
        widgetAiOpen: next,
        widgetAiMatchId: matchId,
        widgetAiMessages: match
          ? [
              {
                sender: "ai",
                text: `Football AI Assistant online. Ask me anything about the matchup between ${match.homeTeam.name} and ${match.awayTeam.name}!`,
              },
            ]
          : [],
      });
    } else {
      set({ widgetAiOpen: next });
    }

    window.electronAPI?.setPanelOpen(next, viewMode);
  },

  // ── Notification Actions ───────────────────────────────────────────────────

  addNotification: (notification) => {
    const { notifications } = get();
    // Keep max 5 toasts at a time, drop oldest if necessary
    const updated =
      notifications.length >= 5
        ? [...notifications.slice(-4), { ...notification, id: Date.now() }]
        : [...notifications, { ...notification, id: Date.now() }];
    set({ notifications: updated });
  },

  dismissNotification: (id) => {
    const { notifications } = get();
    set({ notifications: notifications.filter((n) => n.id !== id) });
  },

  clearAllNotifications: () => set({ notifications: [] }),

  // ── Followed-only Filter ───────────────────────────────────────────────────

  toggleShowFollowedOnly: () => {
    const { showFollowedOnly, rawMatches, customTheme } = get();
    const next = !showFollowedOnly;
    const filtered = applyFiltersAndSorting(rawMatches, customTheme, next);
    const match = filtered[0] ?? null;
    set({
      showFollowedOnly: next,
      matches: filtered,
      currentMatchIndex: 0,
      currentMatch: match,
      mascotState: computeMascotState(match),
    });
  },

  sendWidgetAiMessage: async (text) => {
    const { widgetAiMatchId, widgetAiMessages } = get();
    if (!text.trim()) return;

    const userMsg = { sender: "user", text };
    const updatedMsgs = [...widgetAiMessages, userMsg];
    set({ widgetAiMessages: updatedMsgs, widgetAiLoading: true });

    try {
      const match =
        get().matches.find((m) => m.id === widgetAiMatchId) ||
        get().currentMatch;
      const response = await window.electronAPI?.askAiAboutGame({
        home: match?.homeTeam?.name || "Home Team",
        away: match?.awayTeam?.name || "Away Team",
        comp: match?.competition?.name || "League",
        status: match?.status || "scheduled",
        score: match?.score || { home: 0, away: 0 },
        scorers: match?.scorers || [],
        userPrompt: text,
      });

      set({
        widgetAiMessages: [
          ...updatedMsgs,
          { sender: "ai", text: response || "BEEP BOOP! CONNECTIVITY ERROR." },
        ],
        widgetAiLoading: false,
      });
    } catch (err) {
      set({
        widgetAiMessages: [
          ...updatedMsgs,
          { sender: "ai", text: `ERROR: ${err.message}` },
        ],
        widgetAiLoading: false,
      });
    }
  },

  setExpandedMatchId: (id) => set({ expandedMatchId: id }),
  setActiveSubTab: (tab) => set({ activeSubTab: tab }),

  openAiCommentary: (matchId) => {
    set({
      panelOpen: true,
      widgetAiOpen: false,
      expandedMatchId: matchId,
      activeSubTab: "ai",
    });
    window.electronAPI?.setPanelOpen(true, get().viewMode);
  },

  setMatches: (matches) => {
    const { customTheme, showFollowedOnly } = get();
    const filtered = applyFiltersAndSorting(
      matches,
      customTheme,
      showFollowedOnly,
    );
    const currentMatch = filtered[0] ?? null;
    set({
      rawMatches: matches,
      matches: filtered,
      currentMatchIndex: 0,
      currentMatch,
      mascotState: computeMascotState(currentMatch),
      error: null,
      lastUpdated: new Date(),
    });
  },

  setRecentMatches: (recent) => set({ recentMatches: recent }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  nextMatch: () => {
    const { matches, currentMatchIndex } = get();
    if (!matches.length) return;
    let safeIndex =
      typeof currentMatchIndex === "number" && !isNaN(currentMatchIndex)
        ? currentMatchIndex
        : 0;
    if (safeIndex < 0 || safeIndex >= matches.length) safeIndex = 0;
    const idx = (safeIndex + 1) % matches.length;
    const currentMatch = matches[idx] ?? null;
    set({
      currentMatchIndex: idx,
      currentMatch,
      mascotState: computeMascotState(currentMatch),
    });
  },

  prevMatch: () => {
    const { matches, currentMatchIndex } = get();
    if (!matches.length) return;
    let safeIndex =
      typeof currentMatchIndex === "number" && !isNaN(currentMatchIndex)
        ? currentMatchIndex
        : 0;
    if (safeIndex < 0 || safeIndex >= matches.length) safeIndex = 0;
    const idx = (safeIndex - 1 + matches.length) % matches.length;
    const currentMatch = matches[idx] ?? null;
    set({
      currentMatchIndex: idx,
      currentMatch,
      mascotState: computeMascotState(currentMatch),
    });
  },

  // Jump directly to a match by its index or match ID
  goToMatch: (idOrIdx) => {
    const { matches } = get();
    if (!matches.length) return;

    let idx = -1;
    if (typeof idOrIdx === "number") {
      idx = idOrIdx;
    } else if (typeof idOrIdx === "string") {
      idx = matches.findIndex((m) => m.id === idOrIdx);
    }

    if (idx < 0 || idx >= matches.length) {
      // Fallback: try to find the current match's index in the matches array to keep it in sync, or default to 0
      const currentMatch = get().currentMatch;
      const foundIdx = currentMatch
        ? matches.findIndex((m) => m.id === currentMatch.id)
        : 0;
      idx = foundIdx >= 0 ? foundIdx : 0;
    }

    const targetMatch = matches[idx] ?? null;
    set({
      currentMatchIndex: idx,
      currentMatch: targetMatch,
      mascotState: computeMascotState(targetMatch),
    });
  },

  // ── Customizer / Theme State ──────────────────────────────────────────────
  customTheme: {
    borderRadius: "24px",
    defaultBgStart: "#2D2520",
    defaultBgEnd: "#171311",
    alertBgStart: "#7E492F",
    alertBgEnd: "#3D2114",
    textColor: "#F5E6D3",
    accentColor: "#E9A84A",
    customMascot: null,

    // Audio preferences
    soundEnabled: true,
    volume: 0.5,
    speechEnabled: false,

    // Team and League filters
    favoriteTeams: [],
    followedLeagues: [],

    // Hotkeys & snaps
    globalShortcut: "CommandOrControl+Shift+F",
    dockingPreset: "bottom-right",
    autoHideEnabled: false,
    ghostModeEnabled: false,

    // Gamification
    predictions: {}, // { [matchId]: 'home'|'draw'|'away' }
    predictionScore: 0,
    gameHighScore: 0,
    activeSkin: "default",

    // Custom Sprite Canvas (12x14 grid)
    customGrid: null,

    // Utility dashboard configuration
    utilityMode: "none", // 'none' | 'cpu' | 'weather'
    weatherCity: "London",
    weatherCoords: { lat: 51.5074, lon: -0.1278 },

    // DeepSeek Status Widget
    deepseekWidgetEnabled: false,
    deepseekApiKey: "",
    deepseekCreditLimit: 10.0,
  },

  setCustomTheme: (theme) => {
    const { showFollowedOnly } = get();
    const updated = { ...get().customTheme, ...theme };
    const filtered = applyFiltersAndSorting(
      get().rawMatches,
      updated,
      showFollowedOnly,
    );
    // Preserve the current match by ID across sort order changes
    const prevId = get().currentMatch?.id;
    const newIndex = prevId ? filtered.findIndex((m) => m.id === prevId) : -1;
    const safeIndex = newIndex >= 0 ? newIndex : 0;
    const currentMatch = filtered[safeIndex] ?? null;
    set({
      customTheme: updated,
      matches: filtered,
      currentMatchIndex: safeIndex,
      currentMatch,
      mascotState: computeMascotState(currentMatch),
    });
    window.electronAPI?.savePrefs({ customTheme: updated });
  },

  updateCustomThemeFromIpc: (theme) => {
    if (theme) {
      const { showFollowedOnly } = get();
      const updated = { ...get().customTheme, ...theme };
      const filtered = applyFiltersAndSorting(
        get().rawMatches,
        updated,
        showFollowedOnly,
      );
      const prevId = get().currentMatch?.id;
      const newIndex = prevId ? filtered.findIndex((m) => m.id === prevId) : -1;
      const safeIndex = newIndex >= 0 ? newIndex : 0;
      const currentMatch = filtered[safeIndex] ?? null;
      set({
        customTheme: updated,
        matches: filtered,
        currentMatchIndex: safeIndex,
        currentMatch,
        mascotState: computeMascotState(currentMatch),
      });
    }
  },

  loadCustomTheme: async () => {
    const prefs = await window.electronAPI?.getPrefs?.();
    const { showFollowedOnly } = get();
    if (prefs?.customTheme) {
      const updated = { ...get().customTheme, ...prefs.customTheme };
      const filtered = applyFiltersAndSorting(
        get().rawMatches,
        updated,
        showFollowedOnly,
      );
      const prevId = get().currentMatch?.id;
      const newIndex = prevId ? filtered.findIndex((m) => m.id === prevId) : -1;
      const safeIndex = newIndex >= 0 ? newIndex : 0;
      const currentMatch = filtered[safeIndex] ?? null;
      set({
        customTheme: updated,
        matches: filtered,
        currentMatchIndex: safeIndex,
        currentMatch,
        mascotState: computeMascotState(currentMatch),
      });
    }
  },

  syncViewMode: (mode) => set({ viewMode: mode }),

  // ── DeepSeek Actions ───────────────────────────────────────────────────────

  /**
   * Sets the current DeepSeek API status string (e.g. "Operational").
   */
  setDeepseekStatus: (status) => set({ deepseekStatus: status }),

  /**
   * Sets the 30-day uptime percentage string (e.g. "99.94%").
   */
  setDeepseekPercentage: (percentage) =>
    set({ deepseekPercentage: percentage }),

  /**
   * Sets the current DeepSeek token usage in USD.
   */
  setDeepseekUsage: (usage) => set({ deepseekUsage: usage }),
  setDeepseekCreditLimit: (limit) => set({ deepseekCreditLimit: limit }),

  /**
   * Sets the 30-day history array of status strings.
   */
  setDeepseekHistory: (history) => set({ deepseekHistory: history }),

  /**
   * Sets the "last updated" timestamp string.
   */
  setDeepseekUpdatedTime: (time) => set({ deepseekUpdatedTime: time }),

  /**
   * Background polling loader that fetches DeepSeek metrics and updates the
   * store. Call this once (e.g. from App.jsx) to start the polling cycle.
   * Returns an unsubscribe function to stop polling.
   */
  loadDeepseekMetrics: () => {
    let active = true;

    const poll = async () => {
      if (!active) return;
      try {
        const metrics = await fetchDeepseekMetrics();
        if (!active) return;
        set({
          deepseekStatus: metrics.status,
          deepseekPercentage: metrics.percentage,
          deepseekUsage: metrics.usage,
          deepseekHistory: metrics.history,
          deepseekUpdatedTime: metrics.updatedTime,
        });
      } catch {
        // Silently retry on next poll
      }
      if (active) {
        setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    // Immediate first fetch
    poll();

    // Return cleanup function
    return () => {
      active = false;
    };
  },
}));

// ── Helper to filter and sort matches based on user custom preference ───────
function applyFiltersAndSorting(matches, theme, showFollowedOnly = false) {
  if (!matches) return [];
  let filtered = [...matches];

  // 1. Filter by followed leagues
  if (theme?.followedLeagues && theme.followedLeagues.length > 0) {
    filtered = filtered.filter((m) => {
      const compName = m.competition?.name?.toLowerCase() || "";
      const compShort = m.competition?.shortName?.toLowerCase() || "";
      return theme.followedLeagues.some((league) => {
        const l = league.toLowerCase();
        return compName.includes(l) || compShort.includes(l);
      });
    });
  }

  // 2. When "showFollowedOnly" is active, filter to only matches
  //    where at least one team is in favoriteTeams
  if (
    showFollowedOnly &&
    theme?.favoriteTeams &&
    theme.favoriteTeams.length > 0
  ) {
    filtered = filtered.filter((m) => {
      return theme.favoriteTeams.some((team) => {
        const t = team.toLowerCase();
        return (
          m.homeTeam.name.toLowerCase().includes(t) ||
          m.awayTeam.name.toLowerCase().includes(t)
        );
      });
    });
  }

  // 3. ONLY sort favorites first when showFollowedOnly is active.
  //    Otherwise keep pure chronological order.
  if (
    showFollowedOnly &&
    theme?.favoriteTeams &&
    theme.favoriteTeams.length > 0
  ) {
    filtered.sort((a, b) => {
      const aFav = theme.favoriteTeams.some((team) => {
        const t = team.toLowerCase();
        return (
          a.homeTeam.name.toLowerCase().includes(t) ||
          a.awayTeam.name.toLowerCase().includes(t)
        );
      });
      const bFav = theme.favoriteTeams.some((team) => {
        const t = team.toLowerCase();
        return (
          b.homeTeam.name.toLowerCase().includes(t) ||
          b.awayTeam.name.toLowerCase().includes(t)
        );
      });

      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return new Date(a.kickoff) - new Date(b.kickoff);
    });
  }

  return filtered;
}
