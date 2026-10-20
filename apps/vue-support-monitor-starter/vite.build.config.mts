import { defineConfig, mergeConfig } from "vite";
import base from "./vite.config";

export default mergeConfig(
  base as Parameters<typeof mergeConfig>[0],
  defineConfig({
    build: {
      minify: false,
      cssMinify: false,
    },
  }),
);