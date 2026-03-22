import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 5013, // New unique port for Workspace Access
    allowedHosts: true,
    watch: {
      ignored: ["**/node_modules/**", "**/.git/**", "**/.agent/**"],
    },
  },
  plugins: [
    react(),
    federation({
      name: "workspaceAccess",
      filename: "remoteEntry.js",
      exposes: {
        "./App": "./src/App.tsx",
        "./Navigation": "./src/navigation.ts",
      },
      shared: ["react", "react-dom", "react-router-dom", "@tanstack/react-query", "@vagility/design-system"],
    }),
  ].filter(Boolean),
  build: {
    modulePreload: false,
    target: "esnext",
    minify: false,
    cssCodeSplit: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 5013,
    cors: true,
    allowedHosts: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
