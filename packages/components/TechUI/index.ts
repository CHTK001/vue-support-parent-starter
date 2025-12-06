/**
 * TechUI - 科幻风格组件库封装
 * 基于 @techui/scifi 组件库
 * @author CH
 * @version 1.0.0
 * @since 2025-12-06
 */

import { App } from "vue";
// 导入 @techui/scifi 组件库
import techuiScifiInit from "@techui/scifi";

// 导入封装组件
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

// 导出原始 @techui/scifi 初始化函数
export { techuiScifiInit };

/**
 * 初始化 TechUI (包括 @techui/scifi)
 * @param app Vue 应用实例
 * @param options 配置选项
 */
export async function initTechUI(app: App, options?: {
  license?: string | null;
  features?: {
    echarts?: boolean;
    advanced?: boolean;
  };
  debug?: boolean;
}): Promise<void> {
  const { license = null, features = {}, debug = false } = options || {};
  
  // 初始化 @techui/scifi
  await techuiScifiInit({
    app,
    license,
    features,
    debug
  });
  
  // 注册封装组件
  app.component("TechButton", TechButton);
  app.component("TechPanel", TechPanel);
  app.component("TechHeader", TechHeader);
  app.component("TechDeco", TechDeco);
  app.component("TechGeometry", TechGeometry);
  app.component("TechPanelTitle", TechPanelTitle);
}

// 默认导出，用于同步注册（仅注册封装组件，不初始化 @techui/scifi）
export default {
  install(app: App): void {
    // 注册封装组件（需要先调用 initTechUI 初始化 @techui/scifi）
    app.component("TechButton", TechButton);
    app.component("TechPanel", TechPanel);
    app.component("TechHeader", TechHeader);
    app.component("TechDeco", TechDeco);
    app.component("TechGeometry", TechGeometry);
    app.component("TechPanelTitle", TechPanelTitle);
  }
};
