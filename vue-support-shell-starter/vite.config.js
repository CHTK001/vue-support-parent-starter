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
			"/api/shell": {
				target: "http://localhost:28271",
				changeOrigin: true,
				rewrite: (path) => path,
			},
			"/socket": {
				target: 'ws://127.0.0.1:28271',
				changeOrigin: true,
				ws: true,
				rewrite: (path)=> {
					return path.replace('/socket',"")
				}, //拦截路径去除
			},
		},
	},
})