/**
 * TechUI - 科幻风格组件库封装
 * 基于 @techui/scifi 组件库
 * @author CH
 * @version 1.0.0
 * @since 2025-12-06
 */

import { App } from "vue";

// 导入封装组件 (组件内部直接导入 @techui/scifi 的原生组件)
import TechButton from "./TechButton/index.vue";
import TechPanel from "./TechPanel/index.vue";
import TechHeader from "./TechHeader/index.vue";
import TechDeco from "./TechDeco/index.vue";
import TechGeometry from "./TechGeometry/index.vue";
import TechPanelTitle from "./TechPanelTitle/index.vue";

// 导出组件
export { 
  TechButton, 
  TechPanel, 
  TechHeader, 
  TechDeco, 
  TechGeometry,
  TechPanelTitle 
};

/**
 * 初始化 TechUI
 * 注册封装组件为全局组件
 * @param app Vue 应用实例
 * @param options 配置选项
 */
export function initTechUI(app: App, options?: {
  debug?: boolean;
}): void {
  const { debug = false } = options || {};
  
  if (debug) {
    console.log("[TechUI] 开始注册组件...");
  }
  
  // 注册封装组件
  app.component("TechButton", TechButton);
  app.component("TechPanel", TechPanel);
  app.component("TechHeader", TechHeader);
  app.component("TechDeco", TechDeco);
  app.component("TechGeometry", TechGeometry);
  app.component("TechPanelTitle", TechPanelTitle);
  
  if (debug) {
    console.log("[TechUI] 组件注册完成");
  }
}

// 默认导出，Vue 插件格式
export default {
  install(app: App, options?: { debug?: boolean }): void {
    initTechUI(app, options);
  }
};
