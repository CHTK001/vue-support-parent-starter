import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createViteConfig } from "../../packages/build-config/src/index.ts";
import pkg from "./package.json";

const appRoot = dirname(fileURLToPath(import.meta.url));
const jobPagesRoot = resolve(appRoot, "../../pages/job");
const payPagesRoot = resolve(appRoot, "../../pages/pay");
const proxyPagesRoot = resolve(appRoot, "../../pages/proxy");
const springPagesRoot = resolve(appRoot, "../../pages/spring");
const syncPagesRoot = resolve(appRoot, "../../pages/sync");
const strategyPagesRoot = resolve(appRoot, "../../pages/strategy");
const spiderPagesRoot = resolve(appRoot, "../../pages/spider");
const serverPagesRoot = resolve(appRoot, "../../pages/server");
const springPageKey = process.env.VITE_SPRING_PAGE_KEY || "job-console";
const springPageEntryMap = {
  "job-console": resolve(appRoot, "src/page-entries/job-console.ts"),
  "payment-console": resolve(appRoot, "src/page-entries/payment-console.ts"),
  "proxy-console": resolve(appRoot, "src/page-entries/proxy-console.ts"),
  "spider-console": resolve(appRoot, "src/page-entries/spider-console.ts"),
  "strategy-console": resolve(appRoot, "src/page-entries/strategy-console.ts"),
  "sync-data-console": resolve(appRoot, "src/page-entries/sync-data-console.ts"),
} as const;
const springPageEntry =
  springPageEntryMap[springPageKey as keyof typeof springPageEntryMap]
  || springPageEntryMap["job-console"];

export default createViteConfig(import.meta.url, pkg)
  .alias("@pages/job", resolve(jobPagesRoot, "src/simple.ts"))
  .alias("@pages/pay", resolve(payPagesRoot, "src/simple.ts"))
  .alias("@pages/proxy", resolve(proxyPagesRoot, "src/index.ts"))
  .alias("@pages/server", resolve(serverPagesRoot, "src/index.ts"))
  .alias("@pages/spring", resolve(springPagesRoot, "src/index.ts"))
  .alias("@pages/sync", resolve(syncPagesRoot, "src/index.ts"))
  .alias("@pages/strategy", resolve(strategyPagesRoot, "src/simple.ts"))
  .alias("@spring-page-entry", springPageEntry)
  .fsAllow(jobPagesRoot)
  .fsAllow(payPagesRoot)
  .fsAllow(proxyPagesRoot)
  .fsAllow(springPagesRoot)
  .fsAllow(syncPagesRoot)
  .fsAllow(strategyPagesRoot)
  .fsAllow(spiderPagesRoot)
  .fsAllow(serverPagesRoot)
  .target("es2020")
  .removeConsole(false)
  .merge({
    base: "./",
    publicDir: false,
    server: {
      proxy: {
        "/spider-api": {
          target: process.env.VITE_SPIDER_PROXY_TARGET || "http://127.0.0.1:58082",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/spider-api/, ""),
        },
        "/system/api": {
          target: process.env.VITE_SYSTEM_API_PROXY_TARGET || "http://127.0.0.1:18170",
          changeOrigin: true,
        },
        "/server": {
          target: process.env.VITE_SYSTEM_API_PROXY_TARGET || "http://127.0.0.1:18170",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/server/, "/system/api/server"),
        },
      },
    },
    build: {
      emptyOutDir: true,
    },
  })
  .rollup({
    external: [],
    input: {
      index: resolve(appRoot, "index.html"),
      login: resolve(appRoot, "login.html"),
    },
  })
  .build();
