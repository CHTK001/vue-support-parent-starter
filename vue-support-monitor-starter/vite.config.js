import {fileURLToPath, URL} from 'node:url'
import path from 'path'
import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
// https://vitejs.dev/config/
export default defineConfig({
	base: './',
	minify: 'terser',
	plugins: [
		vue(),
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
			"@static": path.resolve(__dirname, "static"),
			"@assets": path.resolve(__dirname, "src/assets"),
			"@mixins": path.resolve(__dirname, "src/mixins"),
			"@comps": path.resolve(__dirname, "src/components"),
			"@views": path.resolve(__dirname, "src/views"),
			"@plugins": path.resolve(__dirname, "src/plugins"),
			"@utils": path.resolve(__dirname, "src/utils"),
			"@api": path.resolve(__dirname, "src/api"),
		}
	},
	css: {
		preprocessorOptions: {
		  less: {
			javascriptEnabled: true,
			additionalData:`
			  @import "${path.resolve(__dirname, './node_modules/ayin-lessmixins/ayin-lessmixins.less')}";
			  @import "${path.resolve(__dirname, './node_modules/ayin-color/ayin-color.less')}";
			  @import "${path.resolve(__dirname, './node_modules/ayin-color/ayin-color-expand.less')}";
			  `
			  //引入的less全局变量，来自于开源组件ayin-color和ayin-lessmixins，访问https://www.npmjs.com/package/ayin-color 查看相关信息
		  }
		}
	},
	build: {
		rollupOptions: {
		  // 配置多页面
		  input: {
			index: './index.html',
			monitor: './monitor.html',
		  },
		},
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
		include:['echarts','ayin-color'],
		exclude: ['techui-vue3-lite']
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
				target: "https://zjedu-ai.com",
				changeOrigin: true,
				rewrite: (path) => path,
			},
			"/scheduler/api": {
				target: "https://zjedu-ai.com",
				changeOrigin: true,
				rewrite: (path) => path,
			},
		},
	},
})
