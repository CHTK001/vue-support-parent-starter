import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      "/maintain": {
        target: "http://localhost:28081/maintain",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/maintain/, ""),
      },
      "/endpoint": {
        target: "ws://localhost:28081/endpoint",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/endpoint/, ""),
      },
    },
  },
})
