/**
 * ReIp —— IP 地址输入组件
 *
 * 支持 IPv4 / IPv6 双模式：
 *   <ReIp v-model="ip" />
 *   <ReIp v-model="ip" version="ipv6" />
 *   <ReIp :model-value="raw" @update:model-value="onChange" />
 *
 * 暴露 validate() 方法可由父组件调用校验。
 */
import type { App, Plugin } from "vue";
import ReIp from "./ReIp.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReIp", ReIp);
  },
};

export { plugin as install };
export default ReIp;