/**
 * Electron Builder configuration.
 * Run `npm run package` to produce a Windows installer in /release.
 *
 * Icons: drop a 256×256 icon.ico into assets/ to get a custom app icon.
 * Until then, Electron Builder uses its built-in default icon.
 */
module.exports = {
  appId: "com.footballwidget.app",
  productName: "Football Widget",
  copyright: "Copyright © 2025",

  directories: {
    output: "release",
    buildResources: "assets",
  },

  files: ["app-dist/**/*", "electron/**/*", "package.json"],

  win: {
    target: [{ target: "nsis", arch: ["x64"] }],
    // icon: 'assets/icon.ico',  // uncomment once you drop an icon in assets/
  },

  mac: {
    target: [{ target: "dmg", arch: ["x64", "arm64"] }],
    category: "public.app-category.utilities",
    // icon: 'assets/icon.icns',
  },

  nsis: {
    oneClick: true,
    perMachine: false,
    allowToChangeInstallationDirectory: false,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "Football Widget",
    // Kill any running instance before writing new files
    include: "installer.nsh",
    runAfterFinish: true,
  },
};
