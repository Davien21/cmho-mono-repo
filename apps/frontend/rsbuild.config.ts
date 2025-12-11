import { defineConfig, loadEnv } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// Load environment variables - use PUBLIC_ prefix for client-side variables
const { publicVars } = loadEnv({
  prefixes: ["PUBLIC_"],
  mode: process.env.NODE_ENV || "production",
});

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    define: publicVars,
    entry: {
      index: "./src/main.tsx",
    },
  },
  resolve: {
    alias: {
      "@": "./src",
    },
  },
  html: {
    template: "./index.html",
  },
  server: {
    // History API fallback for react-router
    historyApiFallback: true,
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
  },
});
