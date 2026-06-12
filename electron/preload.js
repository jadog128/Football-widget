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
  setShortcut: (shortcutString) => ipcRenderer.invoke("set-shortcut", shortcutString),
  snapWindow: (preset) => ipcRenderer.send("snap-window", preset),
  setAutoHideSlide: (action, mode) => ipcRenderer.send("auto-hide-slide", { action, mode }),
  getSystemInfo: () => ipcRenderer.invoke("get-system-info"),
  askAiAboutGame: (params) => ipcRenderer.invoke("ask-ai-about-game", params),

  // ── Listeners (main → renderer) ───────────────────────────────────────────
  onWindowModeChanged: (callback) =>
    ipcRenderer.on("window-mode-changed", (_event, mode) => callback(mode)),

  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
