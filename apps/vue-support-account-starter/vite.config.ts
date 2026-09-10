import { createVite } from "../../turbo/vite/createVite.ts";

export default createVite({
  appName: "vue-support-account-starter",
  title: "账号管理",
  // 账号管理页复用主机资产登录身份（@pages/server 的 /ms/server/identity CRUD）
  alias: {
    "@pages/server": "pages/server",
  },
  server: {
    port: 8097,
    strictPort: true,
    proxy: {
      // crypto wasm（shared 默认 wasmUrl 为根路径 /wasm/...，dev 下转到自身 base 路径 /account/wasm/...）
      "/wasm": {
        target: "http://127.0.0.1:8097",
        changeOrigin: false,
        rewrite: (path: string) => "/account" + path,
      },
      // 主机资产登录身份 API（MsServerIdentity）
      "/ms/server": {
        target: "http://124.221.230.112:8080",
        changeOrigin: true,
      },
      // 账号管理 API（旧自动注册接口，后续复用）
      "/api/account": {
        target: "http://124.221.230.112:8080",
        changeOrigin: true,
      },
    },
  },
  config: {
    // 部署在 nginx /account/ 路径下，资源使用相对路径
    base: "/account/",
  },
});