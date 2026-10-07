import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import clean from 'vite-plugin-clean'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import type { PluginOption } from 'vite'

const APP_NAME = 'vue-support-ai-guada'
const WORKSPACE_ROOT = path.resolve(__dirname, '../..')
const SHARED_PUBLIC_DIR = path.join(WORKSPACE_ROOT, 'public')
// 后端地址。
//
// 默认值必须是**远端**，不能是 localhost —— 本项目的约定是后端只部署在
// 192.168.50.198、本机不跑后台（「不要再我本机运行后台」）。此前默认
// `http://localhost:8787`，于是任何人在本机 `pnpm dev` 后打开页面，
// 登录都会走 vite 代理打到 192.168.50.198 之外的 localhost:8787，
// 得到 HTTP 500（代理无处可转），表现为「登录一直失败、停在 /login」，
// 而真正原因（代理指向一个不存在的本机后端）完全看不出来。
//
// 需要指向别处时用 AI_API_TARGET 覆盖，例如本机临时起了后端：
//   AI_API_TARGET=http://localhost:8787 pnpm dev
const AI_API_TARGET = process.env.AI_API_TARGET ?? 'http://192.168.50.198:8787'

/** 精确映射：框架 createApp 约定按这些 URL 拉取配置与 wasm 产物 */
const EXACT_ASSETS: Record<string, string> = {
  '/app.example.yaml': path.join(WORKSPACE_ROOT, 'app.example.yaml'),
  [`/apps/${APP_NAME}/app.yaml`]: path.join(__dirname, 'app.yaml'),
}

/** 前缀映射：共享 public 目录下的资源（本应用 publicDir 是自己目录，故单独挂载） */
const PREFIX_ASSETS: Array<[string, string]> = [['/wasm/', path.join(SHARED_PUBLIC_DIR, 'wasm')]]

/**
 * `@repo/ui/re-xxx` → 组件 index.ts 的显式别名（kebab / compact / PascalCase 三种写法）。
 *
 * <p>与 turbo/vite/createVite.ts 的 uiExplicitAliases() 同源同逻辑：packages/ui 的
 * package.json exports 只覆盖 kebab 与 compact 两种小写写法，而 koi 主题里存在
 * PascalCase 引用（如 ReAiCharacter.vue 里的 `@repo/ui/ReAvatar3D`），既不在 exports
 * 里、也无法靠 node 解析，只能在此按目录扫描生成——扫描而非硬编码，新增组件自动生效。</p>
 */
function uiComponentAliases(): Record<string, string> {
  const compDir = path.join(WORKSPACE_ROOT, 'packages/ui/src/components')
  if (!fs.existsSync(compDir)) return {}
  const alias: Record<string, string> = {}
  for (const entry of fs.readdirSync(compDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const dir = entry.name
    if (!/^Re[A-Z]/.test(dir)) continue
    const indexTs = path.join(compDir, dir, 'index.ts')
    if (!fs.existsSync(indexTs)) continue
    const stripped = dir.replace(/^Re/, '')
    // 驼峰边界：小写后接大写插连字符（Graph→Gr-aph）、小写后接数字插连字符（Graph3D→Graph-3D）；
    // 数字后接字母不插（Graph3D 的 3D 视为整体）
    const kebab =
      're-' +
      stripped
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/([a-z])([0-9])/g, '$1-$2')
        .toLowerCase()
    alias[`@repo/ui/${kebab}`] = indexTs
    alias[`@repo/ui/${('re-' + stripped).toLowerCase()}`] = indexTs
    alias[`@repo/ui/${dir}`] = indexTs
  }
  return alias
}

function contentType(file: string): string {
  if (file.endsWith('.yaml')) return 'text/yaml; charset=utf-8'
  if (file.endsWith('.js')) return 'text/javascript'
  if (file.endsWith('.wasm')) return 'application/wasm'
  return 'application/octet-stream'
}

function resolveSharedAsset(url: string): string | null {
  const pathname = url.split('?')[0]
  const exact = EXACT_ASSETS[pathname]
  if (exact && fs.existsSync(exact)) return exact
  for (const [prefix, dir] of PREFIX_ASSETS) {
    if (pathname.startsWith(prefix)) {
      const target = path.join(dir, pathname.slice(prefix.length))
      // 防目录穿越：拼接结果必须仍在共享目录内
      if (target.startsWith(dir + path.sep) && fs.existsSync(target)) return target
    }
  }
  return null
}

/**
 * 本应用使用独立 vite 配置（未走 createVite 的共享 publicDir），
 * 这里补齐框架 createApp 启动所需的两类共享资源：
 * dev 由中间件按 URL 直接读取工作区文件；build 在 closeBundle 同步进 dist，
 * 保证部署后 `/apps/{appName}/app.yaml`、`/wasm/crypto-wasm.*` 约定仍然可用。
 */
function frameworkSharedAssets(): PluginOption {
  return {
    name: 'framework-shared-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const file = req.url ? resolveSharedAsset(req.url) : null
        if (!file) return next()
        res.setHeader('Content-Type', contentType(file))
        fs.createReadStream(file).pipe(res)
      })
    },
    closeBundle() {
      for (const [url, source] of Object.entries(EXACT_ASSETS)) {
        if (!fs.existsSync(source)) continue
        const dest = path.join(__dirname, 'dist', url)
        fs.mkdirSync(path.dirname(dest), { recursive: true })
        fs.copyFileSync(source, dest)
      }
      for (const [prefix, dir] of PREFIX_ASSETS) {
        if (!fs.existsSync(dir)) continue
        const destDir = path.join(__dirname, 'dist', prefix)
        fs.mkdirSync(destDir, { recursive: true })
        for (const entry of fs.readdirSync(dir)) {
          fs.copyFileSync(path.join(dir, entry), path.join(destDir, entry))
        }
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // Electron 环境使用相对路径，Web 环境使用根路径
  base: process.env.ELECTRON === 'true' ? './' : '/',
  plugins: [
    frameworkSharedAssets(),
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag: string) => tag === 'webview',
        },
      },
    }),
    tailwindcss(),
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
      filename: 'stats.html'
    }) as PluginOption,
    clean({ cleanOnceBeforeBuildPatterns: ['**/*', '!some-important-file.txt'] }) as PluginOption,
    AutoImport({
      resolvers: [ElementPlusResolver()],
      dts: 'src/types/auto-imports.d.ts',
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/types/components.d.ts',
    }),
  ],
  optimizeDeps: {
    // 与 createVite 一致：ol-echarts 走默认导入 echarts，交给预打包会在
    // esbuild 阶段抛 "No matching export ... for import default" 并直接终止 dev server
    exclude: ['ol-echarts'],
    // 预声明按需路由才会用到的依赖：否则 dev 期间首次访问该路由时 vite 才发现新依赖，
    // 重新优化后**强制整页 reload**，页面在 reload 期间是空白（浏览器验收时会误判为页面异常）。
    // 这里把已知的「首访才被发现」的依赖提前纳入预打包，把这些 reload 收敛到启动阶段。
    include: [
      '@vicons/ionicons5',
      'element-plus/es/components/collapse/style/css',
      'element-plus/es/components/collapse-item/style/css',
      'element-plus/es/components/drawer/style/css',
    ],
  },
  resolve: {
    /**
     * element-plus 去重（2026-10-07 dist 实测修复）。
     *
     * pnpm 把它装成了两个 peer 变体物理拷贝：app → typescript@6.0.3、
     * packages/ui → typescript@5.9.3。两者各有一份 `Symbol("ElSelect")` token，
     * 打包后主包（ElSelect 的 provide 端）与 select chunk（ElOption 的 inject 端）
     * 拿到的是**不同 symbol**，`inject(selectKey)` 恒 undefined → 打开「编辑供应商」
     * 即抛 `[ElOption] usage: <el-select><el-option /></el-select>`。
     * dev 不炸只因 optimizeDeps 预打包把两份合并了，属构建态独有缺陷。
     * dedupe 强制全仓解析到同一份，token 恢复单例。
     */
    dedupe: ['element-plus'],
    // 用数组而非对象：echarts 必须用锚定正则 /^echarts$/（与 createVite 一致）。
    // 若写成字符串别名，Vite 的前缀匹配会把兼容层内部的 `echarts/index.js`
    // 也一起改写成兼容层自身，形成 self-alias，导致它的具名导出（init 等）全部丢失，
    // 表现为构建告警 "init is not exported by echarts-compat" 且图表运行时不可用。
    alias: [
      // echarts 指向共享兼容层：ol-echarts 等三方包用 `import echarts from 'echarts'`
      // 默认导入，而 echarts 5 的 ESM 产物没有 default 导出；兼容层同时提供
      // `export *` 与 default namespace，两种写法都成立。
      { find: /^echarts$/, replacement: path.resolve(WORKSPACE_ROOT, 'packages/ui/src/shared/echarts-compat') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
      // ── 跨包入口（取值同 turbo/vite/createVite.ts 的 REPO_ALIAS）────────────
      // 本应用用独立 vite 配置（不走 createVite），被 koi 组件间接引用到、且无法
      // 走 pnpm workspace 解析的入口必须在此显式声明，否则 vite build 报
      // "Rollup failed to resolve import"。
      // 注意：不要给 @repo/ui / @repo/config / @repo/core / @repo/utils 加前缀别名——
      // 它们是本应用的 workspace 依赖，靠 packages/*/package.json 的 exports 解析
      // （如 @repo/ui/re-echarts → src/components/ReEcharts/index.ts）。Vite 的字符串
      // 别名是前缀匹配，一旦别名化就会把子路径改写成不存在的 packages/ui/src/re-echarts。
      // @repo/core 运行时动态 import 的两个包（core 不静态依赖它们）
      { find: '@repo/pages', replacement: path.resolve(WORKSPACE_ROOT, 'packages/pages/src') },
      { find: '@repo/pinia', replacement: path.resolve(WORKSPACE_ROOT, 'packages/pinia/src') },
      // themeBridge 的动态 import("@repo/theme") 同理：theme → core 构成环，core 无法声明。
      // 顺序要紧：@repo/theme/koi 必须排在 @repo/theme 之前，否则 @repo/theme/koi/framework
      // 会被前缀匹配改写成不存在的 packages/theme/src/koi/framework。
      { find: '@repo/theme/koi', replacement: path.resolve(WORKSPACE_ROOT, 'packages/theme/src/themes/koi') },
      { find: '@repo/theme', replacement: path.resolve(WORKSPACE_ROOT, 'packages/theme/src') },
      // @repo/ui 的 exports 里没有 re-map，且它不在本应用依赖里，只能显式指到真实目录
      { find: '@repo/re-map', replacement: path.resolve(WORKSPACE_ROOT, 'packages/ui/re-map') },
      // koi layouts/components/{AnnouncementBar,Main} 内是动态 import，编译期才解析；
      // 缺失时构建报 Rollup failed to resolve import "@pages/system/api/announcementApi"
      { find: '@pages/system', replacement: path.resolve(WORKSPACE_ROOT, 'pages/system/src') },
      // SystemSettings.vue 的「文件存储」页直接复用 @repo/filesystem 的 FileStorageManage。
      // 少这一行会让 dev server 报 Failed to resolve import "@pages/filesystem"，
      // 整个 SystemSettings.vue 编译 500 —— 连带着系统设置页内的所有面板
      // （含以图搜图的图片库）一并无法渲染。
      { find: '@pages/filesystem', replacement: path.resolve(WORKSPACE_ROOT, 'pages/filesystem/src') },
      // PascalCase 的组件入口（@repo/ui 的 exports 未收录）由目录扫描生成
      ...Object.entries(uiComponentAliases()).map(([find, replacement]) => ({ find, replacement })),
    ],
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 与 turbo/vite/createVite.ts 的默认值保持一致：给每个 SCSS 块注入 koi 全局变量。
        // 本应用用独立 vite 配置（不走 createVite），必须自己补上这段，否则
        // packages/theme 的 koi layouts 里直接书写 $aside-* 变量会编译报
        // "[sass] Error: Undefined variable."（koi layouts 本身不逐个 @use，属预期约定）。
        additionalData: `@use "${path
          .join(WORKSPACE_ROOT, 'packages/theme/src/themes/koi/styles/variable.scss')
          .replace(/\\/g, '/')}" as *;`,
      },
    },
  },
  server: {
    port: 15689,
    watch: {
      // agent 写文件时会产生 .agent_infra_tmp_* 临时文件，监听它偶发 EBUSY 会导致 watcher 整体崩溃
      ignored: ['**/*.agent_infra_tmp_*', '**/agent_infra_tmp_*'],
    },
    proxy: {
      '/api/v1': {
        target: AI_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1/, '/v2'),
      },
      '/v2': {
        target: AI_API_TARGET,
        changeOrigin: true,
      },
      '/api': {
        target: AI_API_TARGET,
        changeOrigin: true,
      },
      '/static': {
        target: AI_API_TARGET,
        changeOrigin: true
      },
      '/ws/chat': {
        target: AI_API_TARGET,
        changeOrigin: true,
        ws: true,
      }
    }
  }
})