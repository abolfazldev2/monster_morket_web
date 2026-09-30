import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("/node_modules/")) return;
          if (id.includes("/recharts/")) return "charts";
          if (id.includes("/framer-motion/")) return "motion";
          if (/\/(react|react-dom|scheduler)\//.test(id)) return "react-vendor";
          if (id.includes("/react-router")) return "router";
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
