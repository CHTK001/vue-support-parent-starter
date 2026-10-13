/**
 * 验收专用构建配置（兜底）：在基础配置之上扩展 manualChunks，
 * 把重供应商分组切块，压低 rollup 产出阶段的峰值内存。
 *
 * 为什么单独一个文件而不是改 vite.config.ts：
 *   vite.config.ts 是共享文件（并发 agent 也在用），且其中 manualChunks
 *   是为修 file-viewer 循环引用白屏而存在的，语义不能动。
 *   本文件只做「在原有 manualChunks 之后追加分组」，其余全部继承基础配置。
 *
 * 用法（工作目录 apps/vue-support-ai-guada）：
 *   node --max-old-space-size=8192 node_modules/vite/bin/vite.js build \
 *     --minify false -c vite.accept.config.ts
 */
import { defineConfig } from 'vite'
import base from './vite.config'

/** 重供应商分组：按 node_modules 路径片段切块（顺序即优先级，命中即返回） */
const HEAVY_GROUPS: Array<[string, string]> = [
  ['node_modules/element-plus/', 'vendor-element-plus'],
  ['node_modules/@element-plus/', 'vendor-element-plus'],
  ['node_modules/echarts/', 'vendor-echarts'],
  ['node_modules/@cornerstonejs/', 'vendor-medical'],
  ['node_modules/three/', 'vendor-three'],
  ['node_modules/ol/', 'vendor-map'],
  ['node_modules/@turf/', 'vendor-map'],
  ['node_modules/monaco-editor/', 'vendor-editor'],
  ['node_modules/konva/', 'vendor-canvas'],
  ['node_modules/pdfjs-dist/', 'vendor-pdf'],
  ['node_modules/xlsx/', 'vendor-xlsx'],
  ['node_modules/@vue/', 'vendor-vue-ecosystem'],
  ['node_modules/vue/', 'vendor-vue'],
  ['node_modules/vue-i18n/', 'vendor-vue'],
  ['node_modules/pinia/', 'vendor-vue'],
  ['node_modules/vue-router/', 'vendor-vue'],
]

const baseObj: any = typeof base === 'function' ? undefined : base

if (!baseObj) {
  throw new Error('vite.accept.config: 基础配置不是对象形态，拒绝猜测展开')
}

const origManualChunks = baseObj.build?.rollupOptions?.output?.manualChunks

export default defineConfig({
  ...baseObj,
  build: {
    ...baseObj.build,
    rollupOptions: {
      ...baseObj.build?.rollupOptions,
      output: {
        ...baseObj.build?.rollupOptions?.output,
        manualChunks(id: string) {
          // 基础配置的分组优先（file-viewer 循环引用修复不能被绕过）
          const first = typeof origManualChunks === 'function' ? origManualChunks(id) : undefined
          if (first) return first
          for (const [needle, name] of HEAVY_GROUPS) {
            if (id.includes(needle)) return name
          }
          return undefined
        },
      },
    },
  },
})
