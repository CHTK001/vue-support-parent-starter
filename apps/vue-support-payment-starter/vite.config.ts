import { createStandardViteConfig } from "../../packages/build-config/src/standard-config";
import pkg from "./package.json";

const paymentApiTarget =
  process.env.VITE_PAYMENT_API_TARGET || "http://127.0.0.1:8080";

export default createStandardViteConfig(import.meta.url, pkg, {
  host: "127.0.0.1",
  proxy: {
    "/api": {
      target: paymentApiTarget,
      changeOrigin: true,
    },
  },
});
