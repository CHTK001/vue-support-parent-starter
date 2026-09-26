/**
 * ReSearch —— 搜索区折叠组件（按主题加载）
 *
 * 只有一份实现：default 与 koi 两个键指向同一文件。
 * 曾经的两份副本同源分叉，「隐藏过滤区后无法还原」的修复只能在被渲染的那份上验证，
 * 另一份静默腐烂 —— 重建第二套视觉时再拆目录。
 */
import { defineThemeComponent } from "../../theme";

const singleImpl = () => import("./theme/koi/ReSearch.vue");

const themed = defineThemeComponent("ReSearch", {
  default: singleImpl,
  koi: singleImpl,
});

export const component = themed.component;
export { themed as install };
export default component;
