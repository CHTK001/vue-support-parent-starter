/**
 * TechUI - 科幻风格组件库封装
 * 基于 @techui/scifi 组件库
 * @author CH
 * @version 1.0.0
 * @since 2025-12-06
 */

import { App } from "vue";
// 导入 @techui/scifi 初始化函数 (会初始化 WASM 核心)
import techuiScifiInit from "@techui/scifi";

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

// 导出原始初始化函数
export { techuiScifiInit };

/**
 * 初始化 TechUI (包括 WASM 核心)
 * 必须在应用挂载前调用，因为 @techui/scifi 组件依赖 WASM
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
  
  if (debug) {
    console.log("[TechUI] 开始初始化 WASM 核心...");
  }
  
  // 初始化 @techui/scifi WASM 核心 (必须在使用组件前完成)
  await techuiScifiInit({
    app,
    license,
    features,
    debug
  });
  
  if (debug) {
    console.log("[TechUI] WASM 核心初始化完成");
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

// 默认导出
export default {
  initTechUI
};
