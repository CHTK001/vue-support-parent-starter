import { defineConfig, mergeConfig } from "vite";
import base from "./vite.config.ts";

export default mergeConfig(
  base as Parameters<typeof mergeConfig>[0],
  defineConfig({
    build: {
      outDir: "dist-rdp-accept",
      emptyOutDir: true,
      minify: true,
      cssMinify: true,
    },
  }),
);