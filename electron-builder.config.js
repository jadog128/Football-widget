module.exports = {
  appId: "com.pitchview.app",
  productName: "PitchView",
  copyright: "Copyright © 2025",

  directories: {
    output: "release",
    buildResources: "assets",
  },

  files: ["app-dist/**/*", "electron/**/*", "package.json"],

  win: {
    target: [{ target: "nsis", arch: ["x64"] }],
  },

  mac: {
    target: [{ target: "dmg", arch: ["x64", "arm64"] }],
    category: "public.app-category.utilities",
  },

  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "PitchView",
    include: "installer.nsh",
    runAfterFinish: true,
  },
};
