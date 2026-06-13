/**
 * Electron Preload Script
 * Exposes a safe, typed bridge between the renderer (React) and the main process.
 * All window interactions MUST go through this bridge — never expose full Node APIs.
 */

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // ── View / window ────────────────────────────────────────────────────────
  setViewMode: (mode) => ipcRenderer.send("set-view-mode", mode),
  setAlwaysOnTop: (value) => ipcRenderer.send("set-always-on-top", value),
  hideWidget: () => ipcRenderer.send("hide-widget"),
  getWindowBounds: () => ipcRenderer.invoke("get-window-bounds"),
  setWindowPosition: (x, y) =>
    ipcRenderer.send("set-window-position", { x, y }),

  // ── Panel open/close ─────────────────────────────────────────────────────
  setPanelOpen: (open, mode) =>
    ipcRenderer.send("set-panel-open", { open, mode }),

  // ── Notifications & opacity ───────────────────────────────────────────────
  showNotification: (title, body) =>
    ipcRenderer.send("show-notification", { title, body }),
  setOpacity: (pct) => ipcRenderer.send("set-opacity", pct),

  // ── Customizer ────────────────────────────────────────────────────────────
  getPrefs: () => ipcRenderer.invoke("get-prefs"),
  savePrefs: (prefs) => ipcRenderer.send("save-prefs", prefs),
  openCustomizer: () => ipcRenderer.send("open-customizer"),
  onPrefsUpdated: (callback) => {
    const fn = (_event, prefs) => callback(prefs);
    ipcRenderer.on("prefs-updated", fn);
    return () => ipcRenderer.removeListener("prefs-updated", fn);
  },

  // ── New Features IPC ──────────────────────────────────────────────────────
  setGhostMode: (ghost) => ipcRenderer.send("set-ghost-mode", ghost),
  setShortcut: (shortcutString) =>
    ipcRenderer.invoke("set-shortcut", shortcutString),
  snapWindow: (preset) => ipcRenderer.send("snap-window", preset),
  setAutoHideSlide: (action, mode) =>
    ipcRenderer.send("auto-hide-slide", { action, mode }),
  getSystemInfo: () => ipcRenderer.invoke("get-system-info"),
  askAiAboutGame: (params) => ipcRenderer.invoke("ask-ai-about-game", params),
  getDeepseekUsage: () => ipcRenderer.invoke("get-deepseek-usage"),

  // ── DeepSeek standalone window ───────────────────────────────────────────────
  openDeepseekWidget: () => ipcRenderer.send("open-deepseek-widget"),
  closeDeepseekWidget: () => ipcRenderer.send("close-deepseek-widget"),
  getDeepseekWidgetOpen: () => ipcRenderer.invoke("get-deepseek-widget-open"),
  onDeepseekWidgetClosed: (callback) => {
    const fn = () => callback();
    ipcRenderer.on("deepseek-window-closed", fn);
    return () => ipcRenderer.removeListener("deepseek-window-closed", fn);
  },

  // ── Credits standalone window ────────────────────────────────────────────────
  openCreditsWidget: () => ipcRenderer.send("open-credits-widget"),
  closeCreditsWidget: () => ipcRenderer.send("close-credits-widget"),
  getCreditsWidgetOpen: () => ipcRenderer.invoke("get-credits-widget-open"),
  onCreditsWidgetClosed: (callback) => {
    const fn = () => callback();
    ipcRenderer.on("credits-window-closed", fn);
    return () => ipcRenderer.removeListener("credits-window-closed", fn);
  },

  // ── Pin widget ────────────────────────────────────────────────────────────
  pinWidget: () => ipcRenderer.send("pin-widget"),
  unpinWidget: () => ipcRenderer.send("unpin-widget"),
  getPinnedStatus: () => ipcRenderer.invoke("get-pinned-status"),
  onPinnedStatusChanged: (callback) => {
    const fn = (_event, pinned) => callback(pinned);
    ipcRenderer.on("pinned-status-changed", fn);
    return () => ipcRenderer.removeListener("pinned-status-changed", fn);
  },

  // ── Toast notification listener (broadcast from any window) ─────────────
  onToastShow: (callback) => {
    const fn = (_event, toastData) => callback(toastData);
    ipcRenderer.on("toast-show", fn);
    return () => ipcRenderer.removeListener("toast-show", fn);
  },

  // ── Show toast (from any window) ─────────────────────────────────────────
  showToast: (toastData) => ipcRenderer.send("show-toast", toastData),

  // ── Toast window fetches pending toast on mount ──────────────────────────
  getPendingToast: () => ipcRenderer.invoke("get-pending-toast"),

  // ── Toast standalone window ────────────────────────────────────────────────
  closeToastWidget: () => ipcRenderer.send("close-toast-widget"),
  resizeToastWidget: (height) =>
    ipcRenderer.send("resize-toast-widget", height),
  setToastIgnoreMouse: (ignore) =>
    ipcRenderer.send("toast-set-ignore-mouse", ignore),

  // ── Listeners (main → renderer) ───────────────────────────────────────────
  onWindowModeChanged: (callback) =>
    ipcRenderer.on("window-mode-changed", (_event, mode) => callback(mode)),

  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
