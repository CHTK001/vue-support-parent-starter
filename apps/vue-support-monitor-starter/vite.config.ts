import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createVendorManualChunks, createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

const appRoot = dirname(fileURLToPath(import.meta.url));
const proxyPagesRoot = resolve(appRoot, "../../pages/proxy");

const monitorManualChunks = createVendorManualChunks([
  {
    name: "vendor-mermaid",
    matchers: ["/node_modules/mermaid/"],
  },
  {
    name: "vendor-codemirror",
    matchers: ["/node_modules/codemirror/"],
  },
  {
    name: "vendor-xterm",
    matchers: ["/node_modules/xterm", "/node_modules/@xterm/"],
  },
  {
    name: "vendor-cytoscape",
    matchers: ["/node_modules/cytoscape/"],
  },
]);

export default createViteConfig(import.meta.url, pkg)
  .proxy("/monitor/api", "http://172.16.2.226:19170", true, {
    ws: true,
    timeout: 60000,
    proxyTimeout: 60000,
  })
  .alias("@pages/proxy", resolve(proxyPagesRoot, "src/index.ts"))
  .fsAllow(proxyPagesRoot)
  .target("esnext")
  .filterWarnings("color-adjust")
  .packageAlias("@mlc-ai/web-llm", "@mlc-ai/web-llm/lib/index.js")
  .conditions("development", "import", "module", "browser", "default")
  .defines({
    "process.env": {},
    global: "globalThis",
  })
  .cssPreprocessor("less", {
    javascriptEnabled: true,
  })
  .cssPreprocessor("scss", {
    additionalData: `
      @use "@repo/assets/style/layout/default/variables.scss" as *;
      @use "@repo/assets/style/layout/default/mixin.scss";
    `,
  })
  .removeConsole(false)
  .manualChunks(monitorManualChunks)
  .build();
