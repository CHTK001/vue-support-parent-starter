/**
 * ReThree —— 通用 Three.js 画布组件
 *
 * 提供标准 Three.js 渲染循环，暴露 scene / camera / renderer 供业务自定义渲染。
 *
 * 用法：import ReThree from '@repo/ui/re-three'
 *  在 render 回调中添加对象到 scene。
 *
 * 生命周期：
 *   onMounted → initScene → render 回调 → RAF 循环
 *   onBeforeUnmount → 停止 RAF → 释放 renderer
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReThree", {
  default: () => import("./theme/default/ReThree.vue"),
});

/** 按当前主题异步解析组件实例 */
export const component = themed.component;

export { themed as install };
export default component;

// ReThreeContext 的实际声明在同级 types.ts，此处转发类型供业务回调标注使用
export type { ReThreeContext } from "./types";

