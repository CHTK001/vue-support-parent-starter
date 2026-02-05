import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/__tests__/*.spec.ts'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@layout/default': path.resolve(__dirname, './src'),
      '@repo/core': path.resolve(__dirname, '../../packages/core/index.ts'),
      '@repo/config': path.resolve(__dirname, '../../packages/config/index.ts'),
      '@repo/utils': path.resolve(__dirname, '../../packages/utils/index.ts'),
      '@repo/assets': path.resolve(__dirname, '../../packages/assets'),
      '@pureadmin/utils': path.resolve(__dirname, '../../node_modules/@pureadmin/utils'), // Fallback if not resolved
    }
  },
});
