import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const rootDir = process.cwd();

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
      "@tiny-inventory/shared": path.resolve(rootDir, "../shared/src"),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      "/api": {
        target: process.env.DOCKER === "true" ? "http://server:4000" : "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
