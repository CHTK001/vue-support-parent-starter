/**
 * grid-layout-plus 的统一出口
 *
 * <p><b>为什么要有这个文件</b>：{@code grid-layout-plus} 只是 {@code @repo/theme} 的依赖，
 * 业务页面包（{@code pages/xx}）并不直接依赖它 —— 直接 {@code import ... from "grid-layout-plus"}
 * 在 pnpm 的严格 node_modules 结构下解析不到。首页自定义布局与外部消费方（监控大屏、数据源
 * 控制台等）都从这里取组件，既满足「网格只有一套实现」，也不用给每个页面包再挂一份依赖。</p>
 *
 * <p>顺带把该库 {@code cols} 的类型缺陷说明集中在这里（见 {@code gridCompat.ts}）：运行时
 * 接受数字，声明写成了 {@code Breakpoints}，用 {@code as unknown as} 断言一次即可。</p>
 */
export { GridLayout, GridItem } from "grid-layout-plus";
export type { Breakpoints, LayoutItem } from "grid-layout-plus";
