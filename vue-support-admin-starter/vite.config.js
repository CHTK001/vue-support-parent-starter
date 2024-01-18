import {fileURLToPath, URL} from 'node:url'

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
		  }
		}
	  },
	server: {
		host: "0.0.0.0" ,
		proxy: {
			"/admin/api": {
				target: "http://localhost:18170",
				changeOrigin: true,
				rewrite: (path) => path,
			},
			"/socket.io": {
				target: "http://localhost:31256",
				changeOrigin: true,
				rewrite: (path) => path,
			},
			"/api/learning": {
				target: "http://localhost:18171",
				changeOrigin: true,
				rewrite: (path) => path,
			},
			"/api/scheduler": {
				target: "http://localhost:18172",
				changeOrigin: true,
				rewrite: (path) => path,
			},
			"/api/config": {
				target: "http://localhost:18173",
				changeOrigin: true,
				rewrite: (path) => path,
			},
			"/api/spider": {
				target: "http://localhost:18175",
				changeOrigin: true,
				rewrite: (path) => path,
			},
		},
	},
})
