import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  // Use relative paths for Electron's file:// protocol
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "app-dist",
    emptyOutDir: true,
    rollupOptions: {
      // Exclude electron from the renderer bundle
      external: ["electron"],
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
