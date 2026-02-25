import { getPlatformConfig, injectResponsiveStorage, useI18n } from "@repo/config";
import { router, setupStore } from "@repo/core";
import App from "./App.vue";
import { useElementPlus } from "@repo/plugins";
import { createApp } from "vue";
// 字体加密指令
import { vFontEncryption } from "@layout/default";
// 字体加密：随机注册两个加密字体（对外名称保持固定且普通）
import { registerEncryptedFonts } from "@repo/font-encryption";

// 引入重置样式
import "@repo/assets/style/layout/default/reset.scss";
import "@repo/assets/style/layout/default/tailwind.css";
import "element-plus/dist/index.css";
// 导入公共样式
import "@repo/assets/style/layout/default/index.scss";

const app = createApp(App);

// 注册字体加密指令
app.directive("font-encryption", vFontEncryption);

void registerEncryptedFonts();

getPlatformConfig(app).then(async config => {
  setupStore(app);
  app.use(router);
  await router.isReady();
  injectResponsiveStorage(app, config);
  app.use(useI18n).use(useElementPlus);
  app.mount("#app");
});

