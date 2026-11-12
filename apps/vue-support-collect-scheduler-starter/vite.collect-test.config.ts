import { createVite } from "../../turbo/vite/createVite.ts";

const apiTarget = "http://127.0.0.1:18090";
const stripOriginHeaders = (proxyServer: any) => {
  proxyServer.on("proxyReq", (proxyReq: any) => {
    proxyReq.removeHeader("origin");
    proxyReq.removeHeader("referer");
  });
};

export default createVite({
  appName: "vue-support-collect-scheduler-starter",
  title: "采集调度一体化平台",
  alias: {
    "@pages/collect": "pages/collect",
    "@pages/job": "pages/job",
    "@pages/datasource": "pages/datasource",
    "@pages/osgi": "pages/osgi",
  },
  server: {
    host: "127.0.0.1",
    port: 19096,
    strictPort: true,
    watch: {
      ignored: (p: string) =>
        /[\\/]public[\\/]/i.test(p) ||
        /[\\/]pp[-\w\s]*(\.otf|\.ttf|\.woff2?)$/i.test(p) ||
        p.includes("ppt-font-cjk") ||
        /\.(wasm|ttf|otf|woff2?)$/i.test(p),
    },
    proxy: {
      "/collect/api": {
        target: apiTarget,
        changeOrigin: true,
        configure: stripOriginHeaders,
      },
    },
  },
});
