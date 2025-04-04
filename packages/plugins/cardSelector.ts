import type { App, Component } from "vue";
import CardSelector from "../components/CardSelector/index.vue";

// 导出组件
export { CardSelector };

// 创建一个插件对象，包含组件和安装方法
const CardSelectorPlugin = {
  install: (app: App) => {
    app.component("CardSelector", CardSelector as Component);
  }
};

// 提供一个使用函数，方便在组件中直接使用
export function useCardSelector() {
  return {
    CardSelector
  };
}

// 默认导出插件安装函数
export default CardSelectorPlugin;