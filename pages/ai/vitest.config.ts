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
 * esbuild 的 define 不支持 import.meta.url（属性访问不是标识符），所以在
 * transform 阶段对测试文件做字符串替换：用 id（文件绝对路径）的 dirname
 * 构造 file:// URL，作为 import.meta.url 的运行时值。
 */
function fixImportMetaUrl() {
  return {
    name: 'fix-import-meta-url-for-tests',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      if (!/\.test\.[jt]sx?$/.test(id)) return null;
      const dir = dirname(id).replace(/\\/g, '/');
      const fileUrl = `file:///${dir}/`;
      const replaced = code.replace(/import\.meta\.url/g, JSON.stringify(fileUrl));
      if (replaced === code) return null;
      return { code: replaced, map: null };
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
    setupFiles: ['./vitest.setup.ts'],
  },
});
