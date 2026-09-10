import { createApp } from "vue";
import ElementPlus from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
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

const app = createApp(FileStorageManage);
app.use(ElementPlus, { locale: zhCn });
app.mount("#app");
