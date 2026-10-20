/**
 * 验收专用构建配置。
 *
 * <p><b>只做一件事：剥离 rollup-plugin-visualizer</b>（产物分析，验收构建不需要，
 * 还能省一点产物阶段的峰值内存）。</p>
 *
 * <p><b>manualChunks 必须完全沿用 vite.config.ts</b>。基础配置里的分组是为
 * {@code @file-viewer} 的源码级循环引用（ofd ⇄ word）专门修的：把两侧合进同一个块，
 * 恢复与 dev 一致的 DFS 求值顺序。任何「再追加分组」都会把相互依赖的模块拆到不同块，
 * 浏览器按入口顺序求值时先跑的块会读到仍在 TDZ 的导出，启动即抛
 * {@code Cannot access 'require$$4' before initialization} → 全站白屏
 * （2026-10-19 实测：带 HEAVY_GROUPS 的版本构建成功但 /login 一屏空白）。</p>
 *
 * 用法（工作目录 apps/vue-support-ai-guada）：
 * <pre>
 *   node --max-old-space-size=10240 node_modules/vite/bin/vite.js build \
 *     --minify false -c vite.accept.config.ts
 * </pre>
 */
import { defineConfig } from 'vite'
import base from './vite.config'

const baseObj: any = typeof base === 'function' ? undefined : base

if (!baseObj) {
  throw new Error('vite.accept.config: 基础配置不是对象形态，拒绝猜测展开')
}

/** 去掉 visualizer：按插件名过滤（插件数组里可能有 falsy 项与嵌套数组） */
const stripVisualizer = (plugins: any): any[] =>
  (Array.isArray(plugins) ? plugins : [])
    .flat(Infinity)
    .filter((p: any) => !p || !String(p?.name || '').toLowerCase().includes('visualizer'))

export default defineConfig({
  ...baseObj,
  plugins: stripVisualizer(baseObj.plugins),
})
