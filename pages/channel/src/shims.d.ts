/**
 * `@pages/channel` 的类型补充声明。
 *
 * <p>本包是<b>独立页面包</b>：`tsc --noEmit` 直接读本目录的 tsconfig，
 * 不会加载 `pages/ai/src/vite-env.d.ts` 里那套全局声明（它属于另一个包的作用域），
 * 因此 `*.vue` / 图片资源的模块声明必须在本包各自写一份，否则
 * `import ChannelManagementPage from './components/ChannelManagementPage.vue'`
 * 会报 TS2307。运行期由 Vite 的 vue 插件与资源管线处理，与这里无关。</p>
 */

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '*.svg' {
  const src: string
  export default src
}

declare module '*.ico' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}
