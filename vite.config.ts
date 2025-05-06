import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig(({ mode }) =>({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
  ],
  server: {
    headers: {
      "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' https://apis.google.com https://accounts.google.com https://www.gstatic.com https://www.googleapis.com; connect-src 'self' https://sheets.googleapis.com https://www.googleapis.com https://accounts.google.com; frame-src 'self' https://accounts.google.com https://content-sheets.googleapis.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://www.google.com;",
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  base: mode === "production" ? "/StudyPlannerPro/" : "/"
}));
