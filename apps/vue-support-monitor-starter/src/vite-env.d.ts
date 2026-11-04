/// <reference types="vite/client" />

/**
 * vxe-pc-ui 深导入的类型兜底。
 *
 * <p>ReTable（packages/ui）为只引入 tooltip 组件而深导入
 * `vxe-pc-ui/es/tooltip`，该子路径没有随包发布类型声明
 * （vxe-pc-ui 只把全量类型放在 `types/` 下，`typings` 指到 index.d.ts）。
 * packages/ui 自己的 env.d.ts 里有同一份声明，但本应用的 vue-tsc 程序
 * 不含 packages/ui 的 .d.ts，故这里补一份，避免 TS7016。</p>
 */
declare module "vxe-pc-ui/es/tooltip";