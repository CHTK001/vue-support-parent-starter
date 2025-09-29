// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: '/test/browser-test.html'
  },
  build: {
    target: 'esnext'
  }
});