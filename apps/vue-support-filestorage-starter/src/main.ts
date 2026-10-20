import { createApp } from "vue";
import ElementPlus from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import { setupPermissionDirectives } from "@repo/core/directives/permission";
import { setUserRoles } from "@repo/core/permission";
import FileStorageManage from "@pages/filesystem/views/FileStorageManage.vue";

// 从 URL 读取 bucket/dir（FileStorageServerFilter SYSTEM 布局重定向而来）
const params = new URLSearchParams(window.location.search);
const urlBucket = params.get("bucket");
const urlServer = params.get("server");
if (urlBucket) {
  localStorage.setItem("filestorage.bucket", urlBucket);
}
if (urlServer) {
  localStorage.setItem("filestorage.server", urlServer);
}

// 角色种子（standalone 无登录体系）：?role=admin 写入并持久化，供 v-admin 指令判断；
// 未携带时沿用 localStorage "user-roles"（核心权限模块默认回退读取）
const urlRole = params.get("role");
if (urlRole) {
  setUserRoles(urlRole.split(",").map((r) => r.trim()).filter(Boolean));
}

const app = createApp(FileStorageManage);
app.use(ElementPlus, { locale: zhCn });
// 注册 vue 体系权限指令（v-admin / v-role / v-perm 等）
setupPermissionDirectives(app);
app.mount("#app");
