import {fileURLToPath, URL} from 'node:url'

import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [vue()],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url))
		}
	},
	optimizeDeps: {
		exclude:['codemirror']
	},
	server: {
		host: "0.0.0.0" ,
		proxy: {
			"/api/system": {
				target: "http://localhost:18170",
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
		},
	},
})
