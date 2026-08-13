/**
 * ReIpText —— IP 地址展示组件
 *
 * 显示 IP + 归属地，支持缓存和三方查询补全。
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReIpText", {
  default: () => import("./ReIpText.vue"),
  koi: () => import("./ReIpText.vue"),
});

export const component = themed.component;
export { themed as install };
export default component;