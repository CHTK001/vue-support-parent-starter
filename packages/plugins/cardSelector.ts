import type { App } from "vue";
import CardSelector from "../components/CardSelector/index.vue";

// 导出组件
export { CardSelector };

// 默认导出插件安装函数
export default {
  install: (app: App) => {
    app.component("CardSelector", CardSelector);
  }
};