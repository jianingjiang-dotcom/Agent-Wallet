import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { anthropicProxy } from "./server/ai-proxy";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load ALL env vars (including non-VITE_ prefixed) from .env
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      mode === "development" && anthropicProxy({ apiKey: env.ANTHROPIC_API_KEY }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
