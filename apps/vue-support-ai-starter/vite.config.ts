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
import vue from '@vitejs/plugin-vue';
import VueComponents from 'unplugin-vue-components/vite';
import AutoImport from 'unplugin-auto-import/vite';
import ElementPlus from 'unplugin-element-plus/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import { createVite } from '../../turbo/vite/createVite.ts';
import { unoColors, unoRules } from '../../pages/ai/uno.shared.ts';
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

/**
 * 把 pages/ai 内部使用的正则别名（@pages/*、@repo/* 子路径）合并到 createVite 的 alias。
 *
 * createVite 内置 alias 仅支持字符串 key 映射；pages/ai 的源代码使用了
 *  /@pages\/system\/(.*)$/ 之类的子路径正则形式，所以在这里加一个 resolve 钩子，
 *  避免把 options.config.resolve.alias 整个覆盖（覆盖会丢失 @repo/pinia 等内置 alias）。
 */
function pagesAiSubpathAliasPlugin(): Plugin {
  const rules: Array<{ find: RegExp; replacement: string }> = [
    { find: /^@pages\/ai$/, replacement: resolve(aiRoot, 'src', 'renderer', 'App') },
    { find: /^@pages\/system\/(.*)$/, replacement: resolve(aiRoot, '..', 'system', 'src') + '/$1' },
    { find: /^@pages\/system$/, replacement: resolve(aiRoot, '..', 'system', 'src') },
    { find: /^@pages\/account\/(.*)$/, replacement: resolve(aiRoot, '..', 'account', 'src') + '/$1' },
    { find: /^@pages\/account$/, replacement: resolve(aiRoot, '..', 'account', 'src') },
    { find: /^@repo\/theme\/koi\/(.*)$/, replacement: resolve(packagesRoot, 'theme/src/themes/koi') + '/$1' },
    { find: /^@repo\/theme\/koi$/, replacement: resolve(packagesRoot, 'theme/src/themes/koi') },
    { find: /^@repo\/re-map\/(.*)$/, replacement: resolve(packagesRoot, 'ui/re-map') + '/$1' },
    { find: /^@repo\/re-map$/, replacement: resolve(packagesRoot, 'ui/re-map') },
  ];
  return {
    name: 'nomifun-pages-ai-subpath-alias',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer) return null;
      for (const r of rules) {
        if (r.find.test(source)) {
          const replaced = source.replace(r.find, r.replacement);
          // 已知子路径：直接返回绝对路径，跳过目录扫描（防止权限错误）。
          return replaced;
        }
      }
      return null;
    },
  };
}

const baseConfig = createVite({
  appName: 'vue-support-ai-starter',
  title: 'NomiFun AI',
  framework: 'react',
  alias: {
    // 把 @pages/ai 直接指向 renderer/App 入口（不再让 createVite 默认解析到
    // pages/ai/src 后被当作目录扫描）。其它子路径（@pages/system/* 等）由
    // pagesAiSubpathAliasPlugin 在 enforce:'pre' 阶段接管。
    '@pages/ai': resolve(aiRoot, 'src', 'renderer', 'App'),
    // pages/ai 内部所有源码以 src 作为「项目根」：@ 指向 pages/ai/src，
    // @/common → pages/ai/src/common/*，@/renderer/* → 同包相对路径。
    '@': resolve(aiRoot, 'src'),
    '@common': resolve(aiRoot, 'src', 'common'),
    '@renderer': resolve(aiRoot, 'src', 'renderer'),
  },
  server: {
    port: 5173,
    strictPort: true,
    host: '127.0.0.1',
    // 与 pages/ai/vite.config.ts 一致：webdev 模式下把后端面（/api、/v2、/login、
    // /ws 等）代理到 ai-starter 网关 8787，否则浏览器侧 POST /v2/user/login 会
    // 落在 vite 静态服务器上返回 404。
    proxy: {
      '/api': { target: 'http://127.0.0.1:8787', changeOrigin: false },
      '/v2': { target: 'http://127.0.0.1:8787', changeOrigin: false },
      '/login': { target: 'http://127.0.0.1:8787', changeOrigin: false },
      '/logout': { target: 'http://127.0.0.1:8787', changeOrigin: false },
      '/qr-login': { target: 'http://127.0.0.1:8787', changeOrigin: false },
      '/health': { target: 'http://127.0.0.1:8787', changeOrigin: false },
      '/ws': { target: 'ws://127.0.0.1:8787', ws: true, changeOrigin: false },
    },
  },
  plugins: [
    pagesAiSubpathAliasPlugin(),
    iconParkPlugin(),
    repoThemeShimPlugin(),
    vue(),
    // Element Plus 按需：模板 el-* 组件由 VueComponents 注入，
    // ElMessage 等 JS 服务由 unplugin-element-plus 转换（与 pages/ai 一致）。
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    VueComponents({
      resolvers: [ElementPlusResolver()],
      dirs: [],
      dts: false,
    }),
    ElementPlus({}),
    backendPortInjectPlugin(),
    uiBuildManifestPlugin(aiRoot),
    fileViewerAssetsPluginFor(__dirname),
  ],
  config: {
    optimizeDeps: {
      exclude: ['ol-echarts', 'echarts'],
    },
  },
});

// pages/ai 源码（common/config/constants.ts 等）在浏览器端读取 process.env.NODE_ENV，
// dev 模式浏览器无 process 全局，这里静态替换避免 "process is not defined"。
export default defineConfig({
  ...baseConfig,
  define: {
    ...(baseConfig.define ?? {}),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
  },
});
