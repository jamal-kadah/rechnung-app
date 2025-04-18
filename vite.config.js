// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      // stell sicher, dass React & ReactDOM aus deinem node_modules kommen
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
  },
  plugins: [
    react({
      // Classic‑Runtime verhindert den automatisch import von react/jsx-runtime
      jsxRuntime: "classic",
    }),
  ],
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
});
