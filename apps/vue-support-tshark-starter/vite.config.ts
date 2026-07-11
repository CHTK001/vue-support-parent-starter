import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 8891,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:18090',
        changeOrigin: true,
      },

    },
  },
})
