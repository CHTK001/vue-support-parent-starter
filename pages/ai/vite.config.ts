import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import UnoCSS from 'unocss/vite';
import unoConfig from './uno.config.ts';
import VueComponents from 'unplugin-vue-components/vite';
import AutoImport from 'unplugin-auto-import/vite';
import ElementPlus from 'unplugin-element-plus/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import { fileViewerAssetsPlugin } from './vite-file-viewer-plugin.ts';
import { iconParkPlugin, repoThemeShimPlugin, uiBuildManifestPlugin } from './src/vite-plugins.ts';

const src = resolve(__dirname, 'src');
const packagesRoot = resolve(__dirname, '../../packages');

export default defineConfig(({ mode }) => {
  // Local gateway backend port (desktop-shell mode). Overridable at build/dev
  // time via VITE_BACKEND_PORT; defaults to the AI starter gateway port 8787.
  const backendPort = process.env.VITE_BACKEND_PORT ?? '8787';
  // WebUI dev mode (`vite --mode webdev`, driven by the UI `dev:web` script and
  // the root `dev:webui` one-click). The SPA is served by Vite (with HMR) but the
  // auth backend + API + WebSocket live in the separate `nomifun-web` host. The
  // browser SPA makes *same-origin relative* calls in WebUI mode (`/api/*`,
  // `/login`, `/logout`, `/ws` — see ui/src/common/adapter/httpBridge.ts), so we
  // proxy that backend surface to nomifun-web. Without this, those calls hit the
  // static dev server and fail at the network layer ("连接失败").
  //
  // Gated on `mode === 'webdev'` so plain `ui:dev` and the Tauri desktop dev
  // server (mode 'development', which talks to the embedded backend via an
  // absolute `window.__backendPort` URL) are completely unaffected.
  const webdev = mode === 'webdev';
  const apiPort = process.env.NOMIFUN_WEB_PORT ?? '8787';
  const apiTarget = `http://127.0.0.1:${apiPort}`;
  const wsTarget = `ws://127.0.0.1:${apiPort}`;
  // Same loopback host on both sides — keep the original Host header so the
  // backend's host-only session cookie maps cleanly back onto 127.0.0.1:5173.
  const httpProxy = { target: apiTarget, changeOrigin: false };
  const proxy = webdev
    ? {
        '/api': httpProxy,
        // Spring AI starter 管理端契约（/v2/v1/chat/completions、/v2/ai/bot-binding 等）。
        // 与 /api 同目标：本地开发即 8787 网关本身；部署态由 nomifun-web 反代。
        '/v2': httpProxy,
        '/login': httpProxy,
        '/logout': httpProxy,
        '/qr-login': httpProxy,
        '/health': httpProxy,
        '/ws': { target: wsTarget, ws: true, changeOrigin: false },
      }
    : undefined;

  return {
    root: __dirname,
    // Pin the dev server so it always matches the Tauri `devUrl` (5173).
    server: {
      port: 5173,
      strictPort: true,
      host: '127.0.0.1',
      proxy,
    },
    plugins: [
      iconParkPlugin(),
      repoThemeShimPlugin(),
      react(),
      vue(),
      // Element Plus 按需引入：模板中 el-* 组件自动按需注册 + 样式按需加载
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      VueComponents({
        resolvers: [ElementPlusResolver()],
        dirs: [],
        dts: false,
      }),
      // 把源码中 `import { ElMessage } from "element-plus"` 等具名导入
      // 转换为按需子路径导入 + 样式（作用于 @repo/core、koi 主题源码等）
      ElementPlus({}),
      UnoCSS({ ...unoConfig }),
      uiBuildManifestPlugin(__dirname),
      fileViewerAssetsPlugin(),
      {
        name: 'nomifun-backend-port-inject',
        transformIndexHtml(html: string): string {
          // In webdev mode the SPA is served by Vite with a reverse proxy;
          // injecting __backendPort would bypass the proxy and hit CORS.
          if (webdev) {
            return html.replaceAll('__NOMIFUN_BACKEND_PORT__', 'undefined');
          }
          return html.replaceAll('__NOMIFUN_BACKEND_PORT__', backendPort);
        },
      },
    ],
    resolve: {
      alias: [
        { find: '@', replacement: src },
        { find: '@common', replacement: resolve(src, 'common') },
        { find: '@renderer', replacement: resolve(src, 'renderer') },
        { find: /^@repo\/config\/(.*)$/, replacement: resolve(packagesRoot, 'config/src') + '/$1' },
        { find: /^@repo\/config$/, replacement: resolve(packagesRoot, 'config/src') },
        { find: /^@repo\/core\/(.*)$/, replacement: resolve(packagesRoot, 'core/src') + '/$1' },
        { find: /^@repo\/core$/, replacement: resolve(packagesRoot, 'core/src') },
        { find: /^@repo\/utils\/(.*)$/, replacement: resolve(packagesRoot, 'utils/src') + '/$1' },
        { find: /^@repo\/utils$/, replacement: resolve(packagesRoot, 'utils/src') },
        { find: /^@repo\/pinia\/(.*)$/, replacement: resolve(packagesRoot, 'pinia/src') + '/$1' },
        { find: /^@repo\/pinia$/, replacement: resolve(packagesRoot, 'pinia/src') },
        { find: /^@repo\/languages$/, replacement: resolve(packagesRoot, 'languages/src') },
        { find: /^@repo\/assets\/(.*)$/, replacement: resolve(packagesRoot, 'assets/src') + '/$1' },
        { find: /^@repo\/assets$/, replacement: resolve(packagesRoot, 'assets/src') },
        { find: /^@repo\/pages\/(.*)$/, replacement: resolve(packagesRoot, 'pages/src') + '/$1' },
        { find: /^@repo\/pages$/, replacement: resolve(packagesRoot, 'pages/src') },
        { find: /^@repo\/theme\/koi\/(.*)$/, replacement: resolve(packagesRoot, 'theme/src/themes/koi') + '/$1' },
        { find: /^@repo\/theme\/koi$/, replacement: resolve(packagesRoot, 'theme/src/themes/koi') },
        { find: /^@repo\/theme\/(.*)$/, replacement: resolve(packagesRoot, 'theme/src') + '/$1' },
        { find: /^@repo\/theme$/, replacement: resolve(packagesRoot, 'theme/src') },
        { find: /^@repo\/work\/(.*)$/, replacement: resolve(packagesRoot, 'work/src') + '/$1' },
        { find: /^@repo\/work$/, replacement: resolve(packagesRoot, 'work/src') },
        { find: /^@repo\/re-map\/(.*)$/, replacement: resolve(packagesRoot, 'ui/re-map') + '/$1' },
        { find: /^@repo\/re-map$/, replacement: resolve(packagesRoot, 'ui/re-map') },
        { find: /^@pages\/system\/(.*)$/, replacement: resolve(__dirname, '../system/src') + '/$1' },
        { find: /^@pages\/system$/, replacement: resolve(__dirname, '../system/src') },
        { find: /^@pages\/account\/(.*)$/, replacement: resolve(__dirname, '../account/src') + '/$1' },
        { find: /^@pages\/account$/, replacement: resolve(__dirname, '../account/src') },
      ],
      extensions: ['.ts', '.tsx', '.js', '.json', '.vue'],
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      reportCompressedSize: false,
    },
    optimizeDeps: {
      exclude: ['ol-echarts', 'echarts', '@repo/ui', '@repo/theme'],
      // 动态导入（Lazy）模块引用的依赖，显式声明让 Vite 预构建，
      // 否则冷启动首次访问会因未预构建而报 "Failed to fetch dynamically imported module"。
      include: [
        'react-markdown',
        'rehype-katex',
        'rehype-raw',
        'remark-breaks',
        'remark-gfm',
        'remark-math',
        'katex',
      ],
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "${resolve(packagesRoot, 'theme/src/themes/koi/styles/variable.scss').replace(/\\/g, '/')}" as *;`,
        },
      },
    },
  };
});
