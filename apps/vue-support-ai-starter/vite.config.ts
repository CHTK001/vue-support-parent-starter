import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'
import path from 'path'
import { createRequire } from 'node:module'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import clean from 'vite-plugin-clean'
import { fileViewerRenderers } from '@file-viewer/vite-plugin'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import UnoCSS from 'unocss/vite'
import {
  presetWind3,
  presetAttributify,
  presetIcons,
  presetTypography,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'
import type { PluginOption } from 'vite'

const APP_NAME = 'vue-support-ai-starter'
const WORKSPACE_ROOT = path.resolve(__dirname, '../..')

/**
 * 第一方豁免标记（与 packages/utils/src/http.ts 的 FIRST_PARTY_MARKER 保持一致）。
 *
 * 后端 ApiRequestDecodeBodyAdvice 会把 HeadlessChrome / 自动化 UA 判为爬虫并回 403
 * 「检测到爬虫或自动化客户端访问」，豁免条件是 X-Trace-Id 与 X-Requested-With
 * 两个字段的取值都以该标记结尾（见 UserAgent.isSpider 的判定口径）。
 * dev 代理在此补齐这两个头，令被代理请求与真实浏览器发起的请求等价。
 * 仅 dev 生效，生产不经此代理。
 */
const FIRST_PARTY_MARKER = '-7f3a'

/**
 * dev 代理出口补齐第一方豁免头，并剥掉 Origin / Referer。
 *
 * 两件事必须一起做，缺一不可：
 *
 * 1) 剥掉 Origin / Referer —— 后端 plugin.oauth.cors.allowed-origins 是白名单
 *    （只含 8848 系地址）。浏览器同源 POST 会带 `Origin: http://<本机端口>`，
 *    本应用 dev 端口不在白名单里，Spring 直接回 403 `Invalid CORS request`
 *    （GET 不带 Origin 不受影响，于是表现为「读全绿、登录进不去」）。
 *    dev 下页面与代理同源，浏览器根本不校验 ACAO 响应头，所以在 proxyReq 前
 *    把 Origin / Referer 摘掉即可。这与 system / monitor 应用的代理插件同口径。
 *
 * 2) 补第一方标记 —— 无头浏览器无法改写 UA（Fetch 规范把 User-Agent 列为
 *    forbidden header，JS 写入被静默丢弃），而 /v2/setting/default 这类登录前的
 *    配置拉取不走带第一方头的 http 封装，于是被 UA 规则判成爬虫回 403。
 */
function aiProxyHeaders(): PluginOption {
  return {
    name: 'ai-api-proxy-headers',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url?.startsWith('/api/v1') || req.url?.startsWith('/api') || req.url?.startsWith('/v2')) {
          delete req.headers.origin
          delete req.headers.referer
          req.headers['x-trace-id'] = `e2e-${Date.now().toString(16)}${FIRST_PARTY_MARKER}`
          req.headers['x-requested-with'] = `XMLHttpRequest${FIRST_PARTY_MARKER}`
        }
        next()
      })
    },
  }
}

/**
 * 把 esbuild 的临时目录改到工作区内（仅 Windows）。
 *
 * <p><b>为什么需要它。</b>生产构建会在 `[vite:worker-import-meta-url]` 阶段失败：</p>
 * <pre>
 * [vite:worker-import-meta-url] remove C:\Users\...\AppData\Local\Temp\esbuild-xxxx: Access is denied.
 * file: packages/ui/web-llm/src/index.ts
 * </pre>
 * <p>触发点是 {@code packages/ui/web-llm/src/index.ts} 里的
 * {@code new Worker(new URL("./worker.ts", import.meta.url))} —— Vite 用 esbuild 打包
 * worker，并在结束时删除其临时文件；该临时文件位于系统 TEMP 时删除被拒（实测：同一用户
 * 下用 node 手写/删除 TEMP 文件正常，普通 {@code esbuild.transform} 也正常，唯独
 * worker 打包产出的那个临时文件删不掉，属系统 TEMP 目录层面的句柄/扫描干扰）。</p>
 *
 * <p>把 TEMP 指到工作区内的目录后构建可稳定通过（实测 3m5s 成功）。
 * 只在 Windows 且未显式指定时才覆盖，避免影响 Linux/CI 的既有行为。</p>
 */
function redirectEsbuildTempOnWindows(): void {
  if (process.platform !== 'win32') return
  const localTemp = path.join(WORKSPACE_ROOT, '.tmp', 'esbuild-tmp')
  try {
    fs.mkdirSync(localTemp, { recursive: true })
    // 清理上一轮被打断的构建残留：残留的 esbuild-* 临时文件会触发同样的 Access is denied
    for (const name of fs.readdirSync(localTemp)) {
      if (!name.startsWith('esbuild-')) continue
      try {
        fs.rmSync(path.join(localTemp, name), { recursive: true, force: true, maxRetries: 3 })
      } catch {
        /* 被占用的残留跳过即可，不阻断构建 */
      }
    }
  } catch {
    return
  }
  // esbuild 子进程继承父进程环境变量：这里设置后，其 Go 进程即在工作区内建/删临时文件
  process.env.TEMP = localTemp
  process.env.TMP = localTemp
}

redirectEsbuildTempOnWindows()

/**
 * Node 内置 `events` 的浏览器垫片绝对路径，供下面 resolve.alias 使用。
 *
 * 两个坑，都实测过：
 * ① 不能只写裸包名 `events` —— pnpm 严格布局下，Vite 会从真正的引用方
 *    （.pnpm 里的 xmlbuilder2）向上找 node_modules，那一侧没有 events，构建直接报
 *    `Could not resolve "events"`，所以必须解析成绝对路径。
 * ② `require.resolve('events')` **返回的就是字符串 `'events'`** —— Node 对内置模块
 *    短路，直接回显裸名，别名会退化成 self-alias（等于没改），故障照旧。
 *    改用子路径 `events/events.js` 绕开内置短路（该包无 exports 字段，子路径可解析）。
 */
const EVENTS_POLYFILL = createRequire(path.join(__dirname, 'package.json')).resolve('events/events.js')
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
const AI_API_TARGET = process.env.AI_API_TARGET ?? 'https://8787-agqwzohzg2gmh5l2nuiqybemja.instabox.tech'

/** 精确映射：框架 createApp 约定按这些 URL 拉取配置与 wasm 产物 */
const EXACT_ASSETS: Record<string, string> = {
  '/app.example.yaml': path.join(WORKSPACE_ROOT, 'app.example.yaml'),
  [`/apps/${APP_NAME}/app.yaml`]: path.join(__dirname, 'app.yaml'),
  // 首屏 loader（共享 index.html 模板里两个 <script> 指向它们）：本应用 publicDir
  // 是自己的 public，不挂共享 public，缺了就是两条 404 且首屏失去防白屏遮罩。
  '/loader.js': path.join(SHARED_PUBLIC_DIR, 'loader.js'),
  '/loader-config.js': path.join(SHARED_PUBLIC_DIR, 'loader-config.js'),
}

/** 前缀映射：共享 public 目录下的资源（本应用 publicDir 是自己目录，故单独挂载） */
const PREFIX_ASSETS: Array<[string, string]> = [
  ['/wasm/', path.join(SHARED_PUBLIC_DIR, 'wasm')],
  // 图片不再在此回源：`/images/**` 的唯一源就是本应用自己的 public/images
  // （models / providers / bots / 二维码全在里面），由 Vite 的 publicDir 直接服务。
  // 2026-11-11 去掉 `['/images/', 根 public/images]` 这条映射：此前根目录与 app 目录
  // 各存一份、同名文件内容还不一致（同一张 provider 图标两个版本），
  // 谁是权威取决于两个中间件的注册顺序，属于隐患而非功能。
]

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

/**
 * UnoCSS 配置（与 turbo/vite/createVite.ts 的基线同源）。
 *
 * 本应用主体用 Tailwind v4，唯一需要 UnoCSS 的是「koi 登录页」——
 * packages/theme 的 koi 登录模板用 flex-items-center / pos-absolute /
 * m-b-32px 这类 Uno 原子类，Tailwind 不认。只补原子类、不引入 Uno 的
 * preflight：虚拟样式在 tailwind.css 之前引入，基础重置与同名工具类
 * 仍由 Tailwind 决定，避免两套 reset 互相覆盖。
 */
function unoConfig() {
  return {
    presets: [
      presetWind3(),
      presetAttributify(),
      presetIcons({ scale: 1.2, warn: true }),
      presetTypography(),
    ],
    transformers: [
      // 与仓库根 unocss.config.ts 同口径：分隔符收敛成 ":"，
      // 避免把 Tailwind 的 `bg-(--color-x)` 当成 "-" 变体组拆坏。
      transformerVariantGroup({ separators: [':'] }),
      transformerDirectives(),
    ],
    content: {
      // 只扫框架包：登录页模板与它依赖的 Re* 组件都在 packages 下。
      // 不扫 apps/pages，避免把 AI 自己的 Tailwind 类再生成一份 Uno 工具类。
      filesystem: [
        path.resolve(WORKSPACE_ROOT, 'packages/**/*.{vue,ts,tsx,js,jsx,html}'),
      ],
    },
    // 与 koi 一致：暗色挂在 html.dark（AI 的 useTheme 就是这么切的）
    dark: 'class',
  }
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
 * 这里补齐框架 createApp 启动所需的共享资源：
 * dev 由中间件按 URL 直接读取工作区文件；build 在 closeBundle 同步进 dist，
 * 保证部署后 `/apps/{appName}/app.yaml`、`/wasm/crypto-wasm.*` 约定仍然可用。
 * （`/images/**` 不走这里：它是本应用 publicDir 的原生内容。）
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
          const source = path.join(dir, entry)
          const dest = path.join(destDir, entry)
          // 共享目录可能含子目录（如 wasm/cad 预览资源）：copyFileSync 对目录会抛
          // EPERM，这里统一用递归复制兼容文件与子目录两种形态。
          fs.cpSync(source, dest, { recursive: true })
        }
      }
    },
  }
}

/**
 * 应用 index.html：本应用走**独立 vite 配置**（未用 createVite），而
 * `apps/<app>/index.html` 在 .gitignore 里属于生成物 —— 于是干净检出后：
 *   - `pnpm dev`：root 下没有 index.html，`/` 与任何路由都 404/白屏；
 *   - `pnpm build`：rollup 直接报 `Could not resolve entry module "index.html"`。
 * 2026-11-05 实测：手工补一份 index.html 后 `vite build` 由失败转成功，故把
 * 「补文件」这件事固化成插件，与 turbo/vite/createVite.ts 的
 * devIndexTemplate / buildIndexTemplate 同口径（读同一份 turbo/template 模板，
 * 只替换 %APP_TITLE% 与入口脚本）；构建结束删掉临时文件，不落盘污染工作树。
 */
function appIndexHtml(): PluginOption {
  const templatePath = path.join(WORKSPACE_ROOT, 'turbo/template/index.html')
  const tmpPath = path.join(__dirname, 'index.html')
  const title = 'AI 控制台'
  /** 共享模板默认入口是 /src/main.ts，本应用真实入口为 /src/main.js */
  const loadHtml = (): string => {
    if (!fs.existsSync(templatePath)) {
      throw new Error(`[app-index-html] 缺少共享模板：${templatePath}`)
    }
    return fs
      .readFileSync(templatePath, 'utf-8')
      .replace(/%APP_TITLE%/g, title)
      .replace(/\/src\/main\.ts/g, '/src/main.js')
  }
  return {
    name: 'app-index-html',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = (req.url ?? '/').split('?')[0]
        // vite 内部模块与静态资源交给默认中间件
        if (url.startsWith('/@')) return next()
        if (url !== '/' && url !== '/index.html' && path.extname(url)) return next()
        // 后端代理前缀先放行，否则 SPA 兜底会把 /api、/v2 的请求吞成 html
        const proxyPrefixes = Object.keys(server.config.server?.proxy ?? {})
        if (proxyPrefixes.some((p) => url === p || url.startsWith(p + '/'))) return next()
        // 只有浏览器导航（Accept 含 text/html）才回 SPA 兜底，XHR/fetch 照旧透传
        const accept = String(req.headers.accept ?? '')
        const isRoot = url === '/' || url === '/index.html'
        if (!isRoot && !/text\/html/.test(accept)) return next()
        try {
          const html = await server.transformIndexHtml(url, loadHtml())
          res.statusCode = 200
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.end(html)
        } catch (e) {
          next(e)
        }
      })
    },
    // 必须晚于 clean()：clean 先跑，我们再落临时入口，避免被一起清掉
    buildStart() {
      fs.writeFileSync(tmpPath, loadHtml(), 'utf-8')
    },
    closeBundle() {
      try {
        fs.rmSync(tmpPath, { force: true })
      } catch {
        /* 清理失败不影响产物 */
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // Electron 环境使用相对路径，Web 环境使用根路径
  base: process.env.ELECTRON === 'true' ? './' : '/',
  /**
   * 生产构建必须用 ES 格式的 worker。
   *
   * <p>`@cornerstonejs/dicom-image-loader` 的 worker 会做代码分割，而 Rollup
   * 不接受 `"iife"`（vite 默认）用于 code-splitting 构建，报
   * `[commonjs--resolver] Invalid value "iife" for option "worker.format"`，
   * 直接让 `vite build` 失败 —— 即 DICOM 预览接入后**整个生产构建不可用**。
   * 实测 2026-10-08：加这一行后 `vite build` 由 exit 1 变为 exit 0。</p>
   */
  worker: {
    format: 'es',
  },
  /**
   * 修复 dist 全站白屏（2026-10-09 实测）：`@file-viewer` 的 ofd / word 渲染器
   * 存在**源码级循环引用**（ofd ⇄ word，两侧分别 `import{e}from` 对方）。
   * Rollup 默认把它们拆成两个块后，浏览器按「入口 → word → ofd」求值：
   * word 先执行时 ofd 尚未跑过，其导出的 `_c`（共享渲染器定义数组）还在
   * TDZ，word 顶层的 `_c.filter(...)` 即抛
   * `ReferenceError: Cannot access '_c' before initialization` → boot 即死、
   * 页面 body 全空。dev 逐模块 DFS 求值无此问题，故仅构建态暴露（132 个块
   * 静态引用该共享块，任何路由都会崩）。
   *
   * manualChunks 把两侧合进同一个块，恢复与 dev 一致的 DFS 求值顺序，
   * 跨块环消失（docx-preview 一并并入，避免它经 word/ofd 再次成环）。
   * 验证：合并重建后 boot sanity 无 pageerror、聊天页正常渲染。
   */
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('@file-viewer') || id.includes('docx-preview')) return 'file-viewer'
        },
      },
    },
  },
  plugins: [
    frameworkSharedAssets(),
    // dev 代理补第一方豁免头 + 剥 Origin/Referer（仅 serve 生效，见 aiProxyHeaders 注释）
    aiProxyHeaders(),
    // koi 登录页依赖 Uno 原子类；配置与 createVite 基线一致（见 unoConfig 注释）
    UnoCSS(unoConfig()) as PluginOption,
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
    // 入口 index.html（dev 由中间件直出、build 落临时文件后删除）：必须排在上面的 clean 之后
    appIndexHtml(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      dts: path.resolve(WORKSPACE_ROOT, 'pages/ai/src/types/auto-imports.d.ts'),
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: path.resolve(WORKSPACE_ROOT, 'pages/ai/src/types/components.d.ts'),
    }),
    // 文件预览（@file-viewer）渲染器资源复制；注册由组件显式 preset 完成，见 PreviewOfficePanel
    fileViewerRenderers({ inject: false, preset: 'office', copyAssets: true }) as PluginOption,
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
    dedupe: ['element-plus', 'pinia'],
    // 用数组而非对象：echarts 必须用锚定正则 /^echarts$/（与 createVite 一致）。
    // 若写成字符串别名，Vite 的前缀匹配会把兼容层内部的 `echarts/index.js`
    // 也一起改写成兼容层自身，形成 self-alias，导致它的具名导出（init 等）全部丢失，
    // 表现为构建告警 "init is not exported by echarts-compat" 且图表运行时不可用。
    alias: [
      // echarts 指向共享兼容层：ol-echarts 等三方包用 `import echarts from 'echarts'`
      // 默认导入，而 echarts 5 的 ESM 产物没有 default 导出；兼容层同时提供
      // `export *` 与 default namespace，两种写法都成立。
      { find: /^echarts$/, replacement: path.resolve(WORKSPACE_ROOT, 'packages/ui/src/shared/echarts-compat') },
      /**
       * Node 内置 `events` 的浏览器垫片（2026-10-10 dist 实测修复：整站白屏）。
       *
       * `xmlbuilder2` 由 `@kitware/vtk.js` → `@cornerstonejs/core` 经两条路传递引入
       * （`@pages/filesystem` 与 `@file-viewer/renderer-dicom`），它在**模块顶层**写
       * `require("events")` + `class XMLBuilderCBImpl extends EventEmitter`。`events`
       * 是 Node 内置且工作区未装垫片，Vite 构建期把它换成 browser-external **空模块**
       * → `EventEmitter` 为 undefined → 类定义那一行即抛
       * `Class extends value undefined is not a constructor or null`。
       *
       * 这段代码被 manualChunks 并进 file-viewer 单块，而该块由入口静态引入
       * （index.html 里 modulepreload + entry 静态 import），于是 **boot 即死、
       * dist 整站白屏**；dev 是逐模块求值、不走这条路径，故缺陷只在构建态暴露。
       *
       * 用锚定正则（与 /^echarts$/ 同理）而非字符串别名，避免前缀匹配误伤
       * `events/*` 子路径；`node:events` 同根因一并指过去。
       */
      { find: /^events$/, replacement: EVENTS_POLYFILL },
      { find: /^node:events$/, replacement: EVENTS_POLYFILL },
      { find: '@', replacement: path.resolve(WORKSPACE_ROOT, 'pages/ai/src') },
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
      { find: '@pages/ai', replacement: path.resolve(WORKSPACE_ROOT, 'pages/ai/src') },
      { find: '@pages/system', replacement: path.resolve(WORKSPACE_ROOT, 'pages/system/src') },
      // SystemSettings.vue 的「渠道管理」页已抽离到独立包 @pages/channel。
      // 少这一行 dev server 报 Failed to resolve import "@pages/channel"，
      // 整个系统设置页（含渠道管理）都打不出来。
      { find: '@pages/channel', replacement: path.resolve(WORKSPACE_ROOT, 'pages/channel/src') },
      // SystemSettings.vue 的「文件存储」页直接复用 @repo/filesystem 的 FileStorageManage。
      // 少这一行会让 dev server 报 Failed to resolve import "@pages/filesystem"，
      // 整个 SystemSettings.vue 编译 500 —— 连带着系统设置页内的所有面板
      // （含以图搜图的图片库）一并无法渲染。
      { find: '@pages/filesystem', replacement: path.resolve(WORKSPACE_ROOT, 'pages/filesystem/src') },
      // PascalCase 的组件入口（@repo/ui 的 exports 未收录）由目录扫描生成
      ...Object.entries(uiComponentAliases()).map(([find, replacement]) => ({ find, replacement })),
      // 还存在 `@repo/ui/components/ReXxx` 这种「目录直引」写法（如 koi 的 ReNoteEntry.vue）。
      // 它不是 exports 里的键，node 解析不到；指到真实目录即可按文件路径解析。
      // 必须排在组件别名之后：更长的键先于 `@repo/ui/...` 短键匹配不到的风险由精确目录承担。
      { find: '@repo/ui/components', replacement: path.resolve(WORKSPACE_ROOT, 'packages/ui/src/components') },
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
    host: '0.0.0.0',
    port: 15689,
    watch: {
      // agent 写文件时会产生 .agent_infra_tmp_* 临时文件，监听它偶发 EBUSY 会导致 watcher 整体崩溃
      ignored: [
        '**/*.agent_infra_tmp_*',
        '**/agent_infra_tmp_*',
        // @file-viewer 插件每次 dev 启动 rm+cp 重写 public/vendor（约 27MB，含 17MB ppt 字体）、
        // public/wasm/cad（含 9.5MB libredwg-web.wasm CAD 渲染器），
        // Windows 下 chokidar 对仍在写入/被读取的大文件建 fs.watch → EBUSY → dev 进程崩溃；
        // 这些是插件生成的只读资产，监听无意义，故排除。
        // 同理：public/images 是随包图片资产（含模型图标），运行时只读，监听无意义；
        // dist* 是构建产物，其它进程正在写入时建 watch 同样会 EBUSY。
        (p: string) =>
          /(^|[/\\])public[/\\]vendor([/\\]|$)/.test(p) ||
          /(^|[/\\])public[/\\]flyfish-viewer-assets\.json$/.test(p) ||
          /(^|[/\\])public[/\\]wasm([/\\]|$)/.test(p) ||
          /(^|[/\\])public[/\\]images([/\\]|$)/.test(p) ||
          /(^|[/\\])dist(-[^/\\]*)?([/\\]|$)/.test(p) ||
          /(^|[/\\])stats\.html$/.test(p),
      ],
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
      },
      // 天气/定位三方数据源代理（与 vue-support-system-starter 同口径）：
      // packages/core 的 weather.ts 候选表里 /weather-api、/geo-api 等前缀排在直连域名之前，
      // dev 期配了就走代理（免跨域、可走内网），请求失败自动降级直连；
      // 不配则组件每次挂载都先 404 一次再降级，控制台长期留噪音。
      '/weather-api': {
        target: 'https://api.open-meteo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/weather-api/, ''),
      },
      '/geo-api': {
        target: 'https://api.bigdatacloud.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/geo-api/, ''),
      },
      '/freeip-api': {
        target: 'http://freeipapi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/freeip-api/, ''),
      },
      '/ip-api': {
        target: 'http://ip-api.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ip-api/, ''),
      }
    }
  }
})