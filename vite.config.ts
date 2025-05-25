import path from "node:path";
// import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Define default values for env variables
  const defaultValues = {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "",
    COMFY_DEPLOY_SHARED_MACHINE_API_URL: null,
    NEXT_PUBLIC_POSTHOG_KEY: null,
    NEXT_PUBLIC_CD_API_URL: "http://localhost:3011",
    NEXT_PUBLIC_NGROK_CD_API_URL: null,
    NEXT_PUBLIC_POSTHOG_HOST: "https://app.posthog.com",
    COMFYUI_FRONTEND_URL: "https://comfyui.comfydeploy.com",
  };

  // Create process.env definitions with defaults
  const processEnvDefinitions = Object.fromEntries(
    Object.entries(defaultValues).map(([key, defaultValue]) => [
      `process.env.${key}`,
      JSON.stringify(env[key] || defaultValue),
    ]),
  );

  return {
    plugins: [TanStackRouterVite(), react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@repo": path.resolve(__dirname, "./src/repo"),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:3011",
          changeOrigin: true,
        },
      },
    },
    define: processEnvDefinitions,
  };
});
