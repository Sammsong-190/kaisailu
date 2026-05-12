import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Without this on `vite preview`, /api hits the preview server → 404 “Not Found”. */
const apiProxy = {
  "/api": {
    target: "http://127.0.0.1:8788",
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: apiProxy,
  },
  preview: {
    port: 4173,
    proxy: apiProxy,
  },
});
