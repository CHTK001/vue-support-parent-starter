import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const src = resolve(__dirname, 'src');
const packagesRoot = resolve(__dirname, '../../packages');

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
  plugins: [react()],
  // jsdom 环境下 vitest 会把 import.meta.url 解析为 http://，导致
  // `new URL('./xxx.tsx', import.meta.url)` 报 "URL must be of scheme file"。
  // 在测试里把 import.meta.url 强制为构建时的绝对 file:// URL，让源码读文件
  // 类的辅助测试正常进行。
  define: {
    'import.meta.url': JSON.stringify(`file://${__dirname.replace(/\\/g, '/')}/`),
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
