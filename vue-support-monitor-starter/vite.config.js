import {fileURLToPath, URL} from 'node:url'
import path from 'path'

import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
// https://vitejs.dev/config/
export default defineConfig({
	base: './',
	minify: 'terser',
	plugins: [vue()],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url))
		}
	},
	chunkSizeWarningLimit: 5000,
	terserOptions: {
		// 生产环境移除console
		compress: {
		  drop_console: true,
		  drop_debugger: true,
		},
	  },
	optimizeDeps: {
		exclude:[]
	},
	rollupOptions: {
		output: {
		  manualChunks(id) {
			if (id.includes('node_modules')) {
			  return id.toString().split('node_modules/')[1].split('/')[0].toString();
			}
		  },
		  chunkFileNames: (chunkInfo) => {
			const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/') : [];
			const fileName = facadeModuleId[facadeModuleId.length - 2] || '[name]';
			return `js/${fileName}/[name].[hash].js`;
		  },
		  input: {
			index: path.resolve(__dirname, 'index.html'),
			monitor: path.resolve(__dirname, 'monitor.html'),
		  },
		}
	  },
	server: {
		host: "0.0.0.0" ,
		proxy: {
			"/socket": {
				target: "http://localhost:31257",
				changeOrigin: true,
				rewrite: (path) => path.replace("/socket", ""),
			},
			"/monitor/api": {
				target: "http://localhost:31111",
				changeOrigin: true,
				rewrite: (path) => path,
			},
		},
	},
})