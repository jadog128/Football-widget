
const {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  Tray,
  Menu,
  nativeImage,
  shell,
  globalShortcut,
  Notification,
} = require("electron");
const path = require("path");
const fs = require("fs");
const zlib = require("zlib");
const axios = require("axios");

const isDev = process.env.NODE_ENV === "development";
const DEV_URL = "http://localhost:5173";

const SIZES = {
  wide: { width: 540, height: 200 },
  compact: { width: 210, height: 220 },
  mini: { width: 90, height: 95 },
};
const PANEL_EXTRA_H = 390;

let mainWindow = null;
let customizerWindow = null;
let deepseekWindow = null;
let creditsWindow = null;
let toastWindow = null;
let tray = null;
let currentOpacity = 100; // 40–100

// ── Logging ───────────────────────────────────────────────────────────────────

const LOG_PATH = path.join(app.getPath("userData"), "log.txt");
function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.join(" ")}\n`;
  try {
    fs.appendFileSync(LOG_PATH, line);
  } catch (_) {}
}

// ── Prefs (persisted across upgrades) ────────────────────────────────────────

const PREFS_PATH = path.join(app.getPath("userData"), "prefs.json");

function loadPrefs() {
  try {
    return JSON.parse(fs.readFileSync(PREFS_PATH, "utf8"));
  } catch {
    return {};
  }
}
function savePrefs(update) {
  try {
    const current = loadPrefs();
    fs.writeFileSync(
      PREFS_PATH,
      JSON.stringify({ ...current, ...update }, null, 2),
    );
  } catch (e) {
    log("savePrefs error:", e.message);
  }
}

// ── PNG tray icon generator ───────────────────────────────────────────────────

function makePNG(width, height, r, g, b) {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++)
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    return (crc ^ 0xffffffff) >>> 0;
  }
  function chunk(type, data) {
    const t = Buffer.from(type, "ascii");
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
    return Buffer.concat([len, t, data, crc]);
  }
  const row = Buffer.alloc(1 + width * 3);
  row[0] = 0;
  for (let x = 0; x < width; x++) {
    row[1 + x * 3] = r;
    row[2 + x * 3] = g;
    row[3 + x * 3] = b;
  }
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  const compressed = zlib.deflateSync(raw);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function makeTrayIcon() {
  try {
    return nativeImage.createFromBuffer(makePNG(16, 16, 0xe8, 0x74, 0x4a));
  } catch (e) {
    log("makeTrayIcon error:", e.message);
    return nativeImage.createEmpty();
  }
}

// ── Startup helpers ───────────────────────────────────────────────────────────

function applyLoginItem(enable) {
  try {
    app.setLoginItemSettings({ openAtLogin: enable, path: process.execPath });
    savePrefs({ startWithWindows: enable });
    log("startup set to", enable);
  } catch (e) {
    log("applyLoginItem error:", e.message);
  }
}

function getLoginItemEnabled() {
  // Read from our own prefs first (survives upgrades where old path ≠ current)
  const prefs = loadPrefs();
  if (prefs.startWithWindows === false) return false;
  // Default: enabled
  return true;
}

// ── Opacity helpers ───────────────────────────────────────────────────────────

function applyOpacity(pct) {
  currentOpacity = pct;
  if (mainWindow) mainWindow.setOpacity(pct / 100);
  savePrefs({ opacity: pct });
  if (tray) tray.setContextMenu(buildTrayMenu());
  log("opacity set to", pct);
}

// ── Window ────────────────────────────────────────────────────────────────────

function clampToScreen(win) {
  // Ensure the window is fully inside the primary work area
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  const b = win.getBounds();
  const nx = Math.max(0, Math.min(b.x, sw - b.width));
  const ny = Math.max(0, Math.min(b.y, sh - b.height));
  if (nx !== b.x || ny !== b.y) {
    win.setPosition(nx, ny);
    log("window clamped back on-screen to", nx, ny);
  }
}

function showWidget() {
  if (!mainWindow) {
    createWindow();
    return;
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
  clampToScreen(mainWindow);
}

function createWindow() {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  const prefs = loadPrefs();
  currentOpacity = prefs.opacity ?? 100;

  const pinnedPos = prefs.pinnedPosition;
  const initialX =
    pinnedPos?.x != null
      ? pinnedPos.x
      : Math.max(0, sw - SIZES.wide.width - 20);
  const initialY =
    pinnedPos?.y != null
      ? pinnedPos.y
      : Math.max(0, sh - SIZES.wide.height - 20);

  mainWindow = new BrowserWindow({
    ...SIZES.wide,
    x: initialX,
    y: initialY,

    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    skipTaskbar: true,
    // show:true from the start — avoids the Windows compositor bug where
    // transparent frameless windows created with show:false flash then vanish.
    show: true,
    // Use transparent background colour so there is no rectangle shape behind rounded corners
    backgroundColor: "#00000000",
    opacity: currentOpacity / 100,

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  });

  // macOS: float above wallpaper but below all app windows
  if (process.platform === "darwin") {
    mainWindow.setAlwaysOnTop(true, "below-floating", 1);
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });
  }

  mainWindow.webContents.on("did-finish-load", () => log("page loaded OK"));
  mainWindow.webContents.on("did-fail-load", (_e, c, d, u) =>
    log("did-fail-load", c, d, u),
  );

  if (isDev) {
    mainWindow.loadURL(DEV_URL);
  } else {
    const idx = path.join(__dirname, "..", "app-dist", "index.html");
    log("load file:", idx, "| exists:", fs.existsSync(idx));
    mainWindow.loadFile(idx);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ── DeepSeek standalone window ───────────────────────────────────────────────

function openDeepseekWindow() {
  if (deepseekWindow) {
    deepseekWindow.show();
    deepseekWindow.focus();
    return;
  }

  const prefs = loadPrefs();
  const savedPos = prefs.deepseekPos || null;

  deepseekWindow = new BrowserWindow({
    width: 410,
    height: 185,
    x: savedPos?.x,
    y: savedPos?.y,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    skipTaskbar: false,
    alwaysOnTop: false,
    show: false,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  if (isDev) {
    deepseekWindow.loadURL(DEV_URL + "/#deepseek");
  } else {
    const idx = path.join(__dirname, "..", "app-dist", "index.html");
    deepseekWindow.loadURL(`file://${idx}#deepseek`);
  }

  deepseekWindow.once("ready-to-show", () => {
    deepseekWindow.show();
  });

  // Save position on move
  deepseekWindow.on("moved", () => {
    if (deepseekWindow && !deepseekWindow.isDestroyed()) {
      const b = deepseekWindow.getBounds();
      savePrefs({ deepseekPos: { x: b.x, y: b.y } });
    }
  });

  deepseekWindow.on("closed", () => {
    deepseekWindow = null;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("deepseek-window-closed");
    }
  });
}

function closeDeepseekWindow() {
  if (deepseekWindow) {
    deepseekWindow.close();
    deepseekWindow = null;
  }
}

// ── Credits standalone window ────────────────────────────────────────────────

function openCreditsWindow() {
  if (creditsWindow) {
    creditsWindow.show();
    creditsWindow.focus();
    return;
  }

  const prefs = loadPrefs();
  const savedPos = prefs.creditsPos || null;

  creditsWindow = new BrowserWindow({
    width: 185,
    height: 185,
    x: savedPos?.x,
    y: savedPos?.y,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    skipTaskbar: false,
    alwaysOnTop: false,
    show: false,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  if (isDev) {
    creditsWindow.loadURL(DEV_URL + "/#credits");
  } else {
    const idx = path.join(__dirname, "..", "app-dist", "index.html");
    creditsWindow.loadURL(`file://${idx}#credits`);
  }

  creditsWindow.once("ready-to-show", () => {
    creditsWindow.show();
  });

  // Save position on move
  creditsWindow.on("moved", () => {
    if (creditsWindow && !creditsWindow.isDestroyed()) {
      const b = creditsWindow.getBounds();
      savePrefs({ creditsPos: { x: b.x, y: b.y } });
    }
  });

  creditsWindow.on("closed", () => {
    creditsWindow = null;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("credits-window-closed");
    }
  });
}

function closeCreditsWindow() {
  if (creditsWindow) {
    creditsWindow.close();
    creditsWindow = null;
  }
}

// ── Toast notification window ─────────────────────────────────────────────────

function openToastWindow() {
  if (toastWindow && !toastWindow.isDestroyed()) {
    toastWindow.show();
    toastWindow.focus();
    return;
  }

  const { width: sw } = screen.getPrimaryDisplay().workAreaSize;

  toastWindow = new BrowserWindow({
    width: 360,
    height: 160,
    x: sw - 380,
    y: 10,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    focusable: false,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  // Don't show in taskbar, don't steal focus
  toastWindow.setSkipTaskbar(true);

  if (isDev) {
    toastWindow.loadURL(DEV_URL + "/#toast");
  } else {
    const idx = path.join(__dirname, "..", "app-dist", "index.html");
    toastWindow.loadURL(`file://${idx}#toast`);
  }

  toastWindow.once("ready-to-show", () => {
    toastWindow.setAlwaysOnTop(true, "pop-up-menu"); // highest on-top level
    toastWindow.setIgnoreMouseEvents(true, { forward: true }); // clicks pass through
    toastWindow.showInactive(); // show without stealing focus
  });

  toastWindow.on("closed", () => {
    toastWindow = null;
  });
}

function closeToastWindow() {
  if (toastWindow && !toastWindow.isDestroyed()) {
    toastWindow.close();
    toastWindow = null;
  }
}

// ── Tray ──────────────────────────────────────────────────────────────────────

function openCustomizerWindow() {
  if (customizerWindow) {
    customizerWindow.show();
    customizerWindow.focus();
    return;
  }

  customizerWindow = new BrowserWindow({
    width: 600,
    height: 700,
    title: "Football Widget Customizer",
    frame: true,
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  if (isDev) {
    customizerWindow.loadURL(DEV_URL + "/#customizer");
  } else {
    const idx = path.join(__dirname, "..", "app-dist", "index.html");
    customizerWindow.loadURL(`file://${idx}#customizer`);
  }

  customizerWindow.on("closed", () => {
    customizerWindow = null;
  });
}

function buildTrayMenu() {
  const opacityItems = [100, 90, 80, 70, 60, 50].map((pct) => ({
    label: `${pct}%`,
    type: "radio",
    checked: currentOpacity === pct,
    click: () => applyOpacity(pct),
  }));

  return Menu.buildFromTemplate([
    { label: "Show Widget", click: showWidget },
    { label: "Wide View", click: () => resizeWindow("wide") },
    { label: "Compact View", click: () => resizeWindow("compact") },
    { label: "Customize Widget...", click: openCustomizerWindow },
    { type: "separator" },
    {
      label: "Always on Top",
      type: "checkbox",
      checked: false,
      click: (item) => {
        if (mainWindow) mainWindow.setAlwaysOnTop(item.checked);
      },
    },
    {
      label: "Start with Windows",
      type: "checkbox",
      checked: getLoginItemEnabled(),
      click: (item) => applyLoginItem(item.checked),
    },
    {
      label: "Opacity",
      submenu: opacityItems,
    },
    { type: "separator" },
    {
      label: "Reset Position",
      click: () => {
        if (!mainWindow) return;
        const { width: sw, height: sh } =
          screen.getPrimaryDisplay().workAreaSize;
        const base = SIZES.wide;
        mainWindow.setBounds({
          x: sw - base.width - 20,
          y: sh - base.height - 20,
          width: base.width,
          height: base.height,
        });
        mainWindow.show();
        log("position reset");
      },
    },
    { label: "Show / Hide  (Ctrl+Shift+F)", enabled: false },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        globalShortcut.unregisterAll();
        app.quit();
      },
    },
  ]);
}

function createTray() {
  try {
    const icon = makeTrayIcon();
    tray = new Tray(icon);
    tray.setToolTip(
      "Football Widget  •  Right-click for menu\nCtrl+Shift+F to show/hide",
    );
    tray.setContextMenu(buildTrayMenu());
    tray.on("click", () => tray.popUpContextMenu());
    tray.on("double-click", () => {
      if (mainWindow) mainWindow.isVisible() ? mainWindow.hide() : showWidget();
    });
    log("Tray OK");
  } catch (e) {
    log("createTray error (non-fatal):", e.message);
  }
}

// ── Global shortcut ───────────────────────────────────────────────────────────

// ── Global shortcut ───────────────────────────────────────────────────────────

function registerShortcuts() {
  try {
    const prefs = loadPrefs();
    const shortcut =
      prefs.customTheme?.globalShortcut || "CommandOrControl+Shift+F";

    globalShortcut.unregisterAll();

    // Default Ghost Mode toggle hotkey (Ctrl+Shift+G)
    globalShortcut.register("CommandOrControl+Shift+G", () => {
      const currentPrefs = loadPrefs();
      const theme = currentPrefs.customTheme || {};
      const ghost = !theme.ghostModeEnabled;
      const updatedTheme = { ...theme, ghostModeEnabled: ghost };
      savePrefs({ customTheme: updatedTheme });

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("prefs-updated", {
          customTheme: updatedTheme,
        });
        mainWindow.setIgnoreMouseEvents(ghost, { forward: true });
      }
      if (customizerWindow && !customizerWindow.isDestroyed()) {
        customizerWindow.webContents.send("prefs-updated", {
          customTheme: updatedTheme,
        });
      }
      log("Ghost Mode toggled via shortcut to:", ghost);
    });

    const ok = globalShortcut.register(shortcut, () => {
      if (mainWindow && mainWindow.isVisible()) mainWindow.hide();
      else showWidget();
    });
    log("shortcut registered:", shortcut, ok);
  } catch (e) {
    log("shortcut error:", e.message);
  }
}

// ── Resize ────────────────────────────────────────────────────────────────────

function resizeWindow(mode) {
  if (!mainWindow) return;
  const size = SIZES[mode] || SIZES.wide;
  mainWindow.setSize(size.width, size.height);
  mainWindow.webContents.send("window-mode-changed", mode);
}

// ── IPC ───────────────────────────────────────────────────────────────────────

function registerIpcHandlers() {
  ipcMain.on("set-view-mode", (_e, mode) => resizeWindow(mode));
  ipcMain.on("set-always-on-top", (_e, value) => {
    if (mainWindow) mainWindow.setAlwaysOnTop(value);
  });
  ipcMain.on("hide-widget", () => {
    if (mainWindow) mainWindow.hide();
  });
  ipcMain.on("set-window-position", (_e, { x, y }) => {
    if (mainWindow) mainWindow.setPosition(Math.round(x), Math.round(y));
  });
  ipcMain.handle("get-window-bounds", () =>
    mainWindow ? mainWindow.getBounds() : null,
  );

  // Pin widget to current position
  ipcMain.on("pin-widget", () => {
    if (!mainWindow) return;
    const b = mainWindow.getBounds();
    savePrefs({ pinnedPosition: { x: b.x, y: b.y } });
    mainWindow.webContents.send("pinned-status-changed", true);
  });
  ipcMain.on("unpin-widget", () => {
    savePrefs({ pinnedPosition: null });
    if (mainWindow) mainWindow.webContents.send("pinned-status-changed", false);
  });
  ipcMain.handle("get-pinned-status", () => {
    const prefs = loadPrefs();
    return prefs.pinnedPosition != null;
  });

  // Panel expand/collapse — window grows downward, widget stays anchored top
  ipcMain.on("set-panel-open", (_e, { open, mode }) => {
    if (!mainWindow) return;
    const base = SIZES[mode] || SIZES.wide;
    const bounds = mainWindow.getBounds();
    if (open) {
      const newH = base.height + PANEL_EXTRA_H;
      mainWindow.setBounds(
        { x: bounds.x, y: bounds.y, width: base.width, height: newH },
        true,
      );
    } else {
      mainWindow.setBounds(
        {
          x: bounds.x,
          y: bounds.y,
          width: base.width,
          height: base.height,
        },
        true,
      );
    }
  });

  // Native system notification (fired by renderer on goal / kick-off)
  ipcMain.on("show-notification", (_e, { title, body }) => {
    try {
      const n = new Notification({
        title: title || "Football Widget",
        body: body || "",
        silent: false,
      });
      n.show();
    } catch (e) {
      log("notification error:", e.message);
    }
  });

  // Opacity control from renderer (if needed)
  ipcMain.on("set-opacity", (_e, pct) =>
    applyOpacity(Math.max(40, Math.min(100, pct))),
  );

  // Open external URL (for update download links)
  ipcMain.on("open-external", (_e, url) => {
    if (url && typeof url === "string") {
      shell
        .openExternal(url)
        .catch((err) => log("open-external error:", err.message));
    }
  });

  // DeepSeek standalone window
  ipcMain.on("open-deepseek-widget", () => openDeepseekWindow());
  ipcMain.on("close-deepseek-widget", () => closeDeepseekWindow());
  ipcMain.handle("get-deepseek-widget-open", () => deepseekWindow !== null);

  // Credits standalone window
  ipcMain.on("open-credits-widget", () => openCreditsWindow());
  ipcMain.on("close-credits-widget", () => closeCreditsWindow());
  ipcMain.handle("get-credits-widget-open", () => creditsWindow !== null);

  // Toast notification window IPC
  ipcMain.on("open-toast-widget", () => openToastWindow());
  ipcMain.on("close-toast-widget", () => closeToastWindow());
  ipcMain.on("resize-toast-widget", (_e, height) => {
    if (toastWindow && !toastWindow.isDestroyed()) {
      const b = toastWindow.getBounds();
      toastWindow.setBounds({ ...b, height: Math.max(120, height) }, true);
    }
  });
  // Let clicks pass through empty areas of the toast window
  ipcMain.on("toast-set-ignore-mouse", (_e, ignore) => {
    if (toastWindow && !toastWindow.isDestroyed()) {
      toastWindow.setIgnoreMouseEvents(ignore, { forward: true });
    }
  });

  // Store pending toast data for the toast window to pick up
  let pendingToastData = null;

  // Broadcast toast + open floating toast window
  ipcMain.on("show-toast", (_e, toastData) => {
    pendingToastData = toastData;
    openToastWindow();
  });

  // Toast window calls this after mounting to grab pending toast
  ipcMain.handle("get-pending-toast", () => {
    const data = pendingToastData;
    pendingToastData = null;
    return data;
  });

  // Customizer preferences IPC
  ipcMain.handle("get-prefs", () => {
    return loadPrefs();
  });

  ipcMain.on("save-prefs", (_e, prefs) => {
    savePrefs(prefs);

    // If globalShortcut or ghostMode changed, apply it immediately
    if (prefs.customTheme) {
      if (prefs.customTheme.globalShortcut) {
        registerShortcuts();
      }
      if (mainWindow && prefs.customTheme.ghostModeEnabled !== undefined) {
        mainWindow.setIgnoreMouseEvents(prefs.customTheme.ghostModeEnabled, {
          forward: true,
        });
      }
    }

    // Broadcast preferences updates to all windows
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("prefs-updated", prefs);
    }
    if (customizerWindow && !customizerWindow.isDestroyed()) {
      customizerWindow.webContents.send("prefs-updated", prefs);
    }
    if (creditsWindow && !creditsWindow.isDestroyed()) {
      creditsWindow.webContents.send("prefs-updated", prefs);
    }
    if (deepseekWindow && !deepseekWindow.isDestroyed()) {
      deepseekWindow.webContents.send("prefs-updated", prefs);
    }
  });

  ipcMain.on("open-customizer", () => {
    openCustomizerWindow();
  });

  // New features IPC
  ipcMain.on("set-ghost-mode", (_e, ghost) => {
    if (mainWindow) {
      mainWindow.setIgnoreMouseEvents(ghost, { forward: true });
    }
  });

  ipcMain.handle("set-shortcut", (_e, shortcutString) => {
    try {
      const prefs = loadPrefs();
      const customTheme = prefs.customTheme || {};
      customTheme.globalShortcut = shortcutString;
      savePrefs({ customTheme });
      registerShortcuts();
      return true;
    } catch (err) {
      log("set-shortcut error:", err.message);
      return false;
    }
  });

  ipcMain.on("snap-window", (_e, preset) => {
    if (!mainWindow) return;
    const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
    const bounds = mainWindow.getBounds();
    let x = bounds.x;
    let y = bounds.y;

    if (preset === "top-left") {
      x = 20;
      y = 20;
    } else if (preset === "top-right") {
      x = sw - bounds.width - 20;
      y = 20;
    } else if (preset === "bottom-left") {
      x = 20;
      y = sh - bounds.height - 20;
    } else if (preset === "bottom-right") {
      x = sw - bounds.width - 20;
      y = sh - bounds.height - 20;
    }
    mainWindow.setPosition(Math.round(x), Math.round(y));
  });

  ipcMain.on("auto-hide-slide", (_e, { action, mode }) => {
    if (!mainWindow) return;
    const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
    const bounds = mainWindow.getBounds();
    const size = SIZES[mode] || SIZES.wide;
    const isPanelOpen = bounds.height > size.height;

    // Avoid sliding out when detailed panel is open
    if (isPanelOpen && action === "hide") return;

    const threshold = 50;
    const distLeft = bounds.x;
    const distRight = sw - (bounds.x + bounds.width);
    const distTop = bounds.y;
    const distBottom = sh - (bounds.y + bounds.height);

    let edge = null;
    let minVal = Math.min(distLeft, distRight, distTop, distBottom);
    if (minVal < threshold) {
      if (minVal === distLeft) edge = "left";
      else if (minVal === distRight) edge = "right";
      else if (minVal === distTop) edge = "top";
      else edge = "bottom";
    }

    if (!edge) return;

    if (action === "hide" && !mainWindow.__originalBounds) {
      mainWindow.__originalBounds = { x: bounds.x, y: bounds.y };
    }

    if (action === "hide") {
      let nx = bounds.x;
      let ny = bounds.y;
      if (edge === "left") nx = -bounds.width + 8;
      else if (edge === "right") nx = sw - 8;
      else if (edge === "top") ny = -bounds.height + 8;
      else if (edge === "bottom") ny = sh - 8;

      mainWindow.setBounds(
        {
          x: Math.round(nx),
          y: Math.round(ny),
          width: bounds.width,
          height: bounds.height,
        },
        true,
      );
    } else if (action === "show" && mainWindow.__originalBounds) {
      mainWindow.setBounds(
        {
          x: Math.round(mainWindow.__originalBounds.x),
          y: Math.round(mainWindow.__originalBounds.y),
          width: bounds.width,
          height: bounds.height,
        },
        true,
      );
      mainWindow.__originalBounds = null;
    }
  });

  ipcMain.handle("get-system-info", () => {
    const os = require("os");
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const ramUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);

    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }

    const lastIdle = global.__lastCpuIdle || 0;
    const lastTotal = global.__lastCpuTotal || 0;

    global.__lastCpuIdle = totalIdle;
    global.__lastCpuTotal = totalTick;

    const idleDiff = totalIdle - lastIdle;
    const totalDiff = totalTick - lastTotal;

    const cpuUsage =
      totalDiff > 0 ? Math.round((1 - idleDiff / totalDiff) * 100) : 0;

    return {
      cpu: Math.max(0, Math.min(100, cpuUsage)),
      ram: ramUsage,
    };
  });

  ipcMain.handle(
    "ask-ai-about-game",
    async (_e, { home, away, comp, status, score, scorers, userPrompt }) => {
      const prefs = loadPrefs();
      const customTheme = prefs.customTheme || {};
      const geminiKey = customTheme.geminiKey;
      const openrouterKey = customTheme.openrouterKey;

      if (!geminiKey && !openrouterKey) {
        return "No API key found. Please configure your Gemini or OpenRouter key in the Settings Dashboard!";
      }

      const systemPrompt =
        "You are a helpful and knowledgeable AI assistant. Provide quick, direct, and clear answers. Do not use any commentary or game persona. Keep answers brief (under 80 words).";
      const matchContextStr = `${home} vs ${away} (${comp}, Status: ${status}, Score: ${score?.home ?? 0}-${score?.away ?? 0})`;
      const prompt = userPrompt
        ? `The user is looking at ${matchContextStr} and is asking this question: ${userPrompt}`
        : `Provide a quick match analysis/prediction for:
Match: ${home} vs ${away} (${comp})
Status: ${status}, Score: ${score?.home ?? 0} - ${score?.away ?? 0}
Scorers: ${JSON.stringify(scorers || [])}
Keep it short and hyper-focused!`;

      try {
        if (geminiKey) {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
          const response = await axios.post(url, {
            contents: [{ parts: [{ text: systemPrompt + "\n" + prompt }] }],
          });
          return (
            response.data?.candidates?.[0]?.content?.parts?.[0]?.text ??
            "API Error: No response data."
          );
        } else if (openrouterKey) {
          const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
              model: "google/gemini-2.5-flash",
              max_tokens: 150,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt },
              ],
            },
            {
              headers: {
                Authorization: `Bearer ${openrouterKey}`,
                "Content-Type": "application/json",
              },
            },
          );
          return (
            response.data?.choices?.[0]?.message?.content ??
            "API Error: No response data."
          );
        }
      } catch (err) {
        log("AI API Call Error:", err.message);
        return `Failed to fetch AI analysis: ${err.response?.data?.error?.message || err.message}`;
      }
    },
  );

  // ── DeepSeek Token Usage ───────────────────────────────────────────────────────

  /**
   * Fetches DeepSeek developer billing usage from the DeepSeek API.
   * The user's DeepSeek API key is stored in prefs.customTheme.deepseekApiKey.
   *
   * Endpoint: GET https://api.deepseek.com/dashboard/billing/usage
   * Calculates total cost in USD from the returned token usage data.
   */
  ipcMain.handle("get-deepseek-usage", async () => {
    const prefs = loadPrefs();
    const customTheme = prefs?.customTheme || {};
    const apiKey = customTheme.deepseekApiKey;
    const creditLimit = customTheme.deepseekCreditLimit ?? 10.0;

    if (!apiKey) {
      return { usage: 0, creditLimit };
    }

    try {
      // Fetch current month usage from DeepSeek billing API
      const usageResponse = await axios.get(
        "https://api.deepseek.com/dashboard/billing/usage",
        {
          params: {
            start_date: new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1,
            )
              .toISOString()
              .split("T")[0],
            end_date: new Date().toISOString().split("T")[0],
          },
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: "application/json",
          },
          timeout: 10_000,
        },
      );

      let totalUsd = 0;
      if (
        usageResponse.data &&
        typeof usageResponse.data.total_usage === "number"
      ) {
        // DeepSeek returns total_usage as a decimal — it's already in the API's
        // token-cost unit. Divide by 1,000,000 to get approximate USD.
        totalUsd = Math.max(0, usageResponse.data.total_usage / 1_000_000);
      }

      return { usage: totalUsd, creditLimit };
    } catch (err) {
      log("get-deepseek-usage error:", err.message);
      return { usage: 0, creditLimit };
    }
  });
}

// ── App lifecycle ─────────────────────────────────────────────────────────────

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  // Another instance is running.  Tell it to show itself, then quit.
  app.quit();
} else {
  app.on("second-instance", () => showWidget());
}

app
  .whenReady()
  .then(() => {
    log(`app ready | v${app.getVersion()} | packaged:${app.isPackaged}`);

    // Required for native Windows notifications to work
    if (process.platform === "win32") {
      app.setAppUserModelId("PitchView");
    }

    createWindow();
    createTray();
    registerIpcHandlers();
    registerShortcuts();

    // ── Startup registration ──────────────────────────────────────────────
    // Always re-register with process.execPath so upgrades never point to
    // a stale old-version exe.  We read the user's preference from our own
    // prefs.json rather than querying the OS (which would return false after
    // an upgrade because the path changed).
    if (app.isPackaged) {
      const shouldStart = getLoginItemEnabled(); // respects user's saved pref
      applyLoginItem(shouldStart); // updates the OS registry path
      if (tray) tray.setContextMenu(buildTrayMenu());
    }

    app.on("activate", () => {
      if (!BrowserWindow.getAllWindows().length) createWindow();
    });
  })
  .catch((err) => log("whenReady error:", err.message));

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => globalShortcut.unregisterAll());
