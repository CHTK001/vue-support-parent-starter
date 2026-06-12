import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  root: resolve(__dirname),
  server: {
    port: 8853,
    host: '0.0.0.0',
  },
  resolve: {
    alias: {
      '@pages': resolve(__dirname, '../../pages'),
      '@repo/core': resolve(__dirname, '../../packages/core/src'),
      '@repo/components': resolve(__dirname, '../../packages/components'),
    },
  },
});
