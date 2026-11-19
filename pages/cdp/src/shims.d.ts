/**
 * `@pages/cdp` 的类型补充声明。
 *
 * <p>本包是<b>独立页面包</b>：`tsc --noEmit` 直接读本目录的 tsconfig，
 * 不会加载 `pages/ai/src/vite-env.d.ts` 里那套全局声明（它属于另一个包的作用域），
 * 因此 `*.vue` 的模块声明必须在本包写一份，否则
 * `import CdpWorkbench from './components/CdpWorkbench.vue'`
 * 会报 TS2307。运行期由 Vite 的 vue 插件处理，与这里无关。</p>
 */

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

/** 本包未依赖 vite（无 vite/client 类型），CSS 侧导入在此补一个模块声明 */
declare module '*.css' {
  const css: string
  export default css
}
