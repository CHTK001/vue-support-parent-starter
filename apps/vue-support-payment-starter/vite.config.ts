import { URL } from "node:url";
import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

const paymentApiTarget =
  process.env.VITE_PAYMENT_API_TARGET || "http://127.0.0.1:8080";

export default createViteConfig(import.meta.url, pkg)
  .host("127.0.0.1")
  .proxy("/api", paymentApiTarget)
  .build();
