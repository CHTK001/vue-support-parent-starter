import { createStandardViteConfig } from "../../packages/build-config/src/standard-config";
import pkg from "./package.json";
import { resolve } from "path";
import { fileURLToPath } from "url";

const paymentApiTarget =
  process.env.VITE_PAYMENT_API_TARGET || "http://127.0.0.1:8090";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default createStandardViteConfig(import.meta.url, pkg, {
  host: "127.0.0.1",
  port: 8848,
  proxy: {
    "/api": {
      target: paymentApiTarget,
      changeOrigin: true,
    },
  },
  customAlias: {
    "@techui/locales": resolve(__dirname, "src/vendor/techui-locales-wrapper.ts"),
  },
  extraPlugins: [
    {
      name: "fix-extension-order",
      configResolved(config) {
        const extensions = config.resolve.extensions;
        const vueIdx = extensions.indexOf(".vue");
        if (vueIdx > -1) {
          extensions.splice(vueIdx, 1);
          extensions.push(".vue");
        }
      },
    },
  ],
  customConfig: {
    optimizeDeps: {
      exclude: [
        "@pages/protocol",
        "@pages/panel",
        "@techui/scifi",
        "@techui/locales",
        "@techui/utils",
        "@techui/colors",
      ],
    },
  },
});
