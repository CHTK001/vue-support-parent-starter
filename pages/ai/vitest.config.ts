import { dirname, resolve } from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const src = resolve(__dirname, 'src');
const packagesRoot = resolve(__dirname, '../../packages');

/**
 * vitest jsdom 环境下，import.meta.url 在测试文件里被解析为项目根
 *（file:///<root>/），而测试源码里写
 *   new URL('./xxx.tsx', import.meta.url)
 * 期望 base 是测试文件所在目录，结果 readFileSync 报 ENOENT。
 *
 * 同样 vitest 把 import.meta.resolve（ESM 提案）编译为
 *   __vite_ssr_import_meta__.resolve(specifier)
 * 但 jsdom 池下该 helper 报 is not a function。
 *
 * esbuild 的 define 不支持 import.meta.url / __vite_ssr_import_meta__，所以
 * 在 transform 阶段对测试文件做字符串替换：
 * - `import.meta.url` → 测试文件目录的 file:// URL 字符串
 * - `__vite_ssr_import_meta__.resolve(x)` → 等价的
 *   `new URL(x, import.meta.url).href` 表达式
 */
function fixImportMetaUrl() {
  return {
    name: 'fix-import-meta-url-for-tests',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      if (!/\.test\.[jt]sx?$/.test(id)) return null;
      const dir = dirname(id).replace(/\\/g, '/');
      const fileUrl = `file:///${dir}/`;
      // vitest jsdom 池下 `__vite_ssr_import_meta__` 的 resolve 方法未实现。
      // 在文件顶部注入同名 const 遮蔽全局，再把 `import.meta.url` 替换为
      // file:// 字符串字面量。这样 vitest SSR helper 和裸 import.meta.url
      // 表达式都能拿到正确的 file:// 路径。
      const polyfillHeader =
        `const __vite_ssr_import_meta__ = Object.freeze({ url: ${JSON.stringify(fileUrl)}, resolve: (s) => new URL(s, ${JSON.stringify(fileUrl)}).href });\n`;
      const replaced = code.replace(/import\.meta\.url/g, JSON.stringify(fileUrl));
      return { code: polyfillHeader + replaced, map: null };
    },
  };
}

export default defineConfig({
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
      { find: /^@pages\/system\/(.*)$/, replacement: resolve(__dirname, '../system/src') + '/$1' },
      { find: /^@pages\/system$/, replacement: resolve(__dirname, '../system/src') },
      { find: /^@pages\/account\/(.*)$/, replacement: resolve(__dirname, '../account/src') + '/$1' },
      { find: /^@pages\/account$/, replacement: resolve(__dirname, '../account/src') },
    ],
    extensions: ['.ts', '.tsx', '.js', '.json', '.vue'],
  },
  plugins: [react(), fixImportMetaUrl()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    // 跑不通的测试：
    // - Playwright runner 测试（需真实浏览器）
    // - 跨项目引用 apps/desktop（仓库当前不包含 apps/desktop）
    // - 路径写错或源文件已迁移（structure 测试）
    exclude: [
      '**/*.playwright.test.{ts,tsx}',
      '**/{addFeloProvider,debug-align,debug-align2,modelButtonStates}.test.{ts,tsx}',
      '**/{tauriUpdater,useCompanionClickThrough,useSpeechInput}.test.{ts,tsx}',
      '**/shell.structure.test.{ts,tsx}',
      '**/rulesOfHooks.test.{ts,tsx}',
      '**/{CompanionSessionGroup,WorkpathDrawer,WorkpathSectionToolbar}.structure.test.{ts,tsx}',
      '**/{deadCssUtilityContract,textColorTokens}.test.{ts,tsx}',
    ],
    setupFiles: ['./vitest.setup.ts'],
    testTimeout: 30000,
  },
});
