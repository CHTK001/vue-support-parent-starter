/**
 * vue-support-filestorage-starter 应用入口
 *
 * Element Plus 按需化（性能清单 G1）：模板 <el-*> 组件与样式由 vite.config.ts
 * 的 ElementPlusResolver 编译期按需注入；入口只保留命令式 API 的样式基线、
 * v-loading 指令与 el-config-provider（中文 locale），不再全量
 * app.use(ElementPlus) + dist/index.css。
 */
import { createContextApp } from "@repo/app";
import { defineComponent, h } from "vue";
import type { App as VueApp } from "vue";
import { ElConfigProvider, ElLoadingDirective } from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
// 反馈类命令式 API（ElMessage / ElMessageBox / ElLoading.service）不经模板编译，
// unplugin-vue-components 无法注入其样式 → 必须显式引入
import "element-plus/es/components/message/style/css";
import "element-plus/es/components/message-box/style/css";
import "element-plus/es/components/loading/style/css";
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
// 未携带时沿用 localStorage "user-roles"（核心权限模块默认回退读取）。
// 仅开发模式生效：生产构建不响应 URL 角色参数，避免前端权限门控被 URL 直接解锁。
if (import.meta.env.DEV) {
  const urlRole = params.get("role");
  if (urlRole) {
    setUserRoles(urlRole.split(",").map((r) => r.trim()).filter(Boolean));
  }
}

/** 最小主题安装器：文件管理页保留权限指令 + v-loading，Re* 组件交给 .ui() 链 */
async function installFileStorage(app: VueApp): Promise<void> {
  // v-loading 指令：unplugin-vue-components 不解析指令，必须在应用上显式注册
  app.directive("loading", ElLoadingDirective);
  // 注册 vue 体系权限指令（v-admin / v-role / v-perm 等）
  setupPermissionDirectives(app);
}

/** 中文 locale 由 el-config-provider 提供（替代原 app.use(ElementPlus, { locale })） */
const FileStorageRoot = defineComponent({
  name: "FileStorageRoot",
  render: () => h(ElConfigProvider, { locale: zhCn }, { default: () => h(FileStorageManage) }),
});

await createContextApp({
  appName: "vue-support-filestorage-starter",
  title: "文件管理",
  mode: "single",
  install: installFileStorage,
})
  .app(FileStorageRoot)
  // 文件管理页使用 ReDialog（既有 deep import 不受影响）；交给 .ui() 注册，
  // 与其它 app 的 Re* 组件清单收敛口径一致。
  .ui({ components: ["ReDialog"] })
  .mount("#app");
