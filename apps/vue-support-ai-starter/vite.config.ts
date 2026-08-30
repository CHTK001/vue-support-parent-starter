/**
 * vue-support-ai-starter —— NomiFun AI 应用启动器的 Vite 配置。
 *
 * 复用 @pages/ai 提供的：
 *  - 渲染器根组件 NomiFunApp
 *  - Vite 插件：iconParkPlugin / repoThemeShimPlugin / uiBuildManifestPlugin / fileViewerAssetsPlugin
 *
 * 本文件不维护 index.html：createVite 已提供 dev 中间件 + build 临时模板，
 * 应用代码仅关心 src/。
 */
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { createVite } from '../../turbo/vite/createVite.ts';
import {
  iconParkPlugin,
  repoThemeShimPlugin,
  uiBuildManifestPlugin,
} from '../../pages/ai/src/vite-plugins.ts';
import {
  fileViewerAssetsPluginFor,
} from '../../pages/ai/vite-file-viewer-plugin.ts';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const aiRoot = resolve(__dirname, '..', '..', 'pages', 'ai');
const packagesRoot = resolve(__dirname, '..', '..', 'packages');
const srcRoot = resolve(__dirname, 'src');

/** 与 pages/ai/vite.config.ts 行为一致：注入 __NOMIFUN_BACKEND_PORT__。 */
function backendPortInjectPlugin(): Plugin {
  const webdev = process.env.NODE_ENV === 'webdev';
  const backendPort = process.env.VITE_BACKEND_PORT ?? '8787';
  return {
    name: 'nomifun-backend-port-inject',
    transformIndexHtml(html: string): string {
      if (webdev) {
        return html.replaceAll('__NOMIFUN_BACKEND_PORT__', 'undefined');
      }
      return html.replaceAll('__NOMIFUN_BACKEND_PORT__', backendPort);
    },
  };
}

export default createVite({
  appName: 'vue-support-ai-starter',
  title: 'NomiFun AI',
  framework: 'react',
  alias: {
    '@': srcRoot,
    '@common': resolve(srcRoot, 'common'),
    '@renderer': resolve(aiRoot, 'src', 'renderer'),
  },
  server: {
    port: 5173,
    strictPort: true,
    host: '127.0.0.1',
  },
  plugins: [
    iconParkPlugin(),
    repoThemeShimPlugin(),
    react(),
    vue(),
    backendPortInjectPlugin(),
    uiBuildManifestPlugin(aiRoot),
    fileViewerAssetsPluginFor(__dirname),
  ],
  // 让 vite 显式知晓额外别名（含 pages/ai 自身别名）。createVite 内部 alias 会与
  // options.alias 合并，因此这里仅追加 pages/ai 内部使用的别名即可。
  // 但 vite config 类型不直接透传 alias，createVite 已经把 alias 转换到 resolve.alias。
  config: {
    resolve: {
      alias: [
        // createVite 已把 @pages/ai 解析为 pages/ai/src；这里覆盖为 @pages/ai 直接
        // 解析到 renderer/App.tsx（业务入口需要的 NomiFunApp 就在这里）。
        { find: /^@pages\/ai$/, replacement: resolve(aiRoot, 'src', 'renderer', 'App') },
        { find: /^@pages\/system\/(.*)$/, replacement: resolve(aiRoot, '..', 'system', 'src') + '/$1' },
        { find: /^@pages\/system$/, replacement: resolve(aiRoot, '..', 'system', 'src') },
        { find: /^@pages\/account\/(.*)$/, replacement: resolve(aiRoot, '..', 'account', 'src') + '/$1' },
        { find: /^@pages\/account$/, replacement: resolve(aiRoot, '..', 'account', 'src') },
        { find: /^@repo\/theme\/koi\/(.*)$/, replacement: resolve(packagesRoot, 'theme/src/themes/koi') + '/$1' },
        { find: /^@repo\/theme\/koi$/, replacement: resolve(packagesRoot, 'theme/src/themes/koi') },
        { find: /^@repo\/re-map\/(.*)$/, replacement: resolve(packagesRoot, 'ui/re-map') + '/$1' },
        { find: /^@repo\/re-map$/, replacement: resolve(packagesRoot, 'ui/re-map') },
      ],
    },
    optimizeDeps: {
      exclude: ['ol-echarts', 'echarts'],
    },
  },
});
