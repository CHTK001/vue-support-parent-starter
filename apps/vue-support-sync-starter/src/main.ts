import { createApp } from "vue";
import AppRoot from "@repo/app-root";
import { createAppBootstrap } from "@repo/core";
import router from "./router";
import { createPinia } from "pinia";
import { useElementPlus } from "@repo/plugins";

// 样式导入
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import "@repo/assets/style/layout/default/reset.scss";
import "@repo/assets/style/layout/default/tailwind.css";
import "@repo/assets/style/layout/default/index.scss";

async function bootstrap() {
  const app = createApp(AppRoot);
  const pinia = createPinia();

  await createAppBootstrap(app)
    .use(() => app.use(pinia))
    .registerRouter(router)
    .registerPlugins([useElementPlus])
    .mount("#app");
}

bootstrap();
