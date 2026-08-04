import { createVite } from "../../turbo/vite/createVite.ts";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const rsocketStub = path.join(dirname, "src/stubs/rsocket-stub.ts");

export default createVite({
  appName: "vue-support-ai-starter",
  title: "Vue Support AI",
  // rsocket-* 为 Flow 语法老库（0.0.28 alpha），浏览器/rolldown 无法解析。
  // 本应用不使用 rsocket 协议，通过 alias 指向 stub，保证 @repo/core socket 模块可加载
  alias: {
    "rsocket-core": rsocketStub,
    "rsocket-websocket-client": rsocketStub,
    "rsocket-flowable": rsocketStub,
  },
  server: {
    port: 8088,
    strictPort: true,
    host: "0.0.0.0",
    proxy: {
      // AI 后端 (spring-support-ai-starter: 8080)
      "/v2/ai": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      // 兜底代理
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
