/**
 * 账号管理独立应用入口。
 *
 * 直接挂载 AccountManage.vue，不依赖 @repo/app 完整外壳，
 * 后端只需提供 /api/account/* 接口（account-boot）。
 */
import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import AccountManage from "@pages/account/src/views/AccountManage.vue";
import "@pages/account/styles/index.css";

createApp(AccountManage)
  .use(ElementPlus)
  .mount("#app");
