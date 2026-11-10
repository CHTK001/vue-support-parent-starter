import { t as defineThemeComponent } from "./theme-DY5ftAcm.js";
//#region ../../packages/ui/src/components/ReThree/index.ts
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
var themed = defineThemeComponent("ReThree", { default: () => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReThree/theme/default/ReThree.vue") });
/** 按当前主题异步解析组件实例 */
var component = themed.component;
//#endregion
export { component, component as default, themed as install };
