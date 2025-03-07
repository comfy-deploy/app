import path from "node:path";
import { defineConfig, rspack } from "@rsbuild/core";
// import { pluginBabel } from "@rsbuild/plugin-babel";
import { pluginReact } from "@rsbuild/plugin-react";
import { RsdoctorRspackPlugin } from "@rsdoctor/rspack-plugin";
import { TanStackRouterRspack } from "@tanstack/router-plugin/rspack";

const ReactCompilerConfig = {
  /* ... */
};

export default defineConfig({
  mode: process.env.VERCEL_ENV === "production" ? "production" : "development",
  plugins: [
    pluginReact(),
    // pluginBabel({
    //   include: /\.(?:jsx|tsx)$/,
    //   babelLoaderOptions(opts) {
    //     opts.plugins?.unshift([
    //       "babel-plugin-react-compiler",
    //       ReactCompilerConfig,
    //     ]);
    //   },
    // }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@repo": path.resolve(__dirname, "./src/repo"),
    },
  },
  source: {
    entry: { index: "./src/main.tsx" },
  },
  html: {
    template: "./index.html",
  },
  tools: {
    rspack: {
      cache: true,
      experiments: {
        cache: {
          type: "persistent",
        },
      },
      optimization: {
        minimizer: [
          new rspack.SwcJsMinimizerRspackPlugin({
            // JS minimizer configuration
          }),
          new rspack.LightningCssMinimizerRspackPlugin({
            // CSS minimizer configuration
          }),
        ],
      },
      // experiments: {
      //   css: true,
      // },
      module: {
        rules: [
          {
            test: /\.css$/,
            use: [
              {
                loader: "postcss-loader",
                options: {
                  postcssOptions: {
                    plugins: {
                      tailwindcss: {},
                      autoprefixer: {},
                    },
                  },
                },
              },
            ],
            type: "javascript/auto",
          },
        ],
      },
      plugins: [
        // Required for the app to work
        new rspack.EnvironmentPlugin(["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"]),
        // Optional for the app to work locally
        new rspack.EnvironmentPlugin({
          COMFY_DEPLOY_SHARED_MACHINE_API_URL: null,
          NEXT_PUBLIC_POSTHOG_KEY: null,
          NEXT_PUBLIC_CD_API_URL: "http://localhost:3011",
          NEXT_PUBLIC_NGROK_CD_API_URL: null,
          NEXT_PUBLIC_POSTHOG_HOST: "https://app.posthog.com",
          COMFYUI_FRONTEND_URL: "https://comfyui.comfydeploy.com",
        }),
        TanStackRouterRspack(),
        process.env.RSDOCTOR &&
          new RsdoctorRspackPlugin({
            // plugin options
          }),
      ].filter(Boolean),
    },
  },
});
