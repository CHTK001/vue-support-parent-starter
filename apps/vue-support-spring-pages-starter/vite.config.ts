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

export default createViteConfig(import.meta.url, pkg)
  .alias("@pages/job", resolve(jobPagesRoot, "src/simple.ts"))
  .alias("@pages/pay", resolve(payPagesRoot, "src/simple.ts"))
  .alias("@pages/proxy", resolve(proxyPagesRoot, "src/index.ts"))
  .alias("@pages/spring", resolve(springPagesRoot, "src/index.ts"))
  .alias("@pages/sync", resolve(syncPagesRoot, "src/index.ts"))
  .alias("@pages/strategy", resolve(strategyPagesRoot, "src/simple.ts"))
  .fsAllow(jobPagesRoot)
  .fsAllow(payPagesRoot)
  .fsAllow(proxyPagesRoot)
  .fsAllow(springPagesRoot)
  .fsAllow(syncPagesRoot)
  .fsAllow(strategyPagesRoot)
  .target("es2020")
  .removeConsole(false)
  .merge({
    base: "./",
    publicDir: false,
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
