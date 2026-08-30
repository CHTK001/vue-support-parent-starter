/**
 * pages/ai 专用 Vite 插件集合 —— 由 apps/vue-support-ai-starter 与
 * pages/ai 自身的 vite.config.ts 共同引用，避免重复实现。
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { createUiBuildManifest } from '../scripts/ui-build-manifest.ts';

/** 读取 ui-api-contract-version.txt（pages/ai 根目录）。 */
function readApiContractVersion(root: string): string {
  return readFileSync(resolve(root, 'ui-api-contract-version.txt'), 'utf8').trim();
}

/** 在 build 期注入 nomifun-build.json 到产物。 */
export function uiBuildManifestPlugin(root: string): Plugin {
  return {
    name: 'nomifun-ui-build-manifest',
    apply: 'build' as const,
    generateBundle() {
      const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as { version: string };
      const manifest = createUiBuildManifest(pkg.version, readApiContractVersion(root));
      this.emitFile({
        type: 'asset',
        fileName: 'nomifun-build.json',
        source: `${JSON.stringify(manifest, null, 2)}\n`,
      });
    },
  };
}

/**
 * 把 `@icon-park/react` 的具名导入改写为 HOC 包装（替代原 webpack loader）。
 * 仅扫描 .tsx 文件，避免污染 node_modules。
 */
export function iconParkPlugin(): Plugin {
  return {
    name: 'vite-plugin-icon-park',
    enforce: 'pre' as const,
    transform(source: string, id: string) {
      if (!id.endsWith('.tsx') || id.includes('node_modules')) return null;
      if (!source.includes('@icon-park/react')) return null;
      const transformed = source.replace(
        /import\s+\{\s*([a-zA-Z, ]*)\s*\}\s+from\s+['"]@icon-park\/react['"](;?)/g,
        (str, match) => {
          if (!match) return str;
          const components = match.split(',');
          const importComponent = str.replace(match, components.map((k: string) => `${k} as _${k.trim()}`).join(', '));
          const hoc = `import IconParkHOC from '@renderer/components/IconParkHOC';
${components.map((k: string) => `const ${k.trim()} = IconParkHOC(_${k.trim()})`).join(';\n')}`;
          return importComponent + ';' + hoc;
        }
      );
      return transformed !== source ? { code: transformed, map: null } : null;
    },
  };
}

/**
 * 阻止 koi 主题 / 页面包被生产构建拉入。
 *
 * 1) @repo/core 的 router/themeBridge.ts 在运行时才动态 import @repo/theme 与
 *    @repo/pages（仅 createAppRouter 使用，本应用从不调用）。vite 生产构建会把
 *    这些动态 import 打包成 chunk，进而递归解析 koi 主题全量（header/layout/地图/
 *    公告等），连带拉出 echarts/ol/leaflet/@pages/* 等重依赖。本插件把这两个
 *    动态 import 替换为恒 resolve 空对象的占位，使构建图完全不包含 koi 主题。
 * 2) @repo/theme 的 loadTheme.ts 动态 import @repo/theme/koi/framework（koi
 *    框架：installKoi/KoiLayout 等），同样会被 vite 打包成 chunk 并递归解析
 *    koi layout 全量。登录页不消费 installKoi，替换为占位。
 */
export function repoThemeShimPlugin(): Plugin {
  return {
    name: 'nomifun-repo-theme-shim',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      // 仅处理 core 的 router 模块与 theme 的 loadTheme 模块
      const isCoreRouter = id.includes('packages/core/src/router');
      const isThemeLoadTheme = id.includes('packages/theme/src/loadTheme');
      if (!isCoreRouter && !isThemeLoadTheme) return null;
      if (!code.includes('@repo/theme') && !code.includes('@repo/pages')) return null;
      const replaced = code
        .replace(/await\s+import\("@repo\/theme"\)/g, 'await Promise.resolve({ getThemeRoutes: undefined })')
        .replace(/await\s+import\("@repo\/pages"\)/g, 'await Promise.resolve({ error403: undefined, error404: undefined, error500: undefined })')
        .replace(/import\("@repo\/theme\/koi\/framework"\)/g, 'Promise.resolve({ installKoi: undefined, koiRouter: undefined, KoiLayout: undefined })');
      return replaced !== code ? { code: replaced, map: null } : null;
    },
  };
}
