/**
 * TechUI - 科幻风格组件库封装
 * 基于 @techui/scifi 组件库
 * @author CH
 * @version 1.0.0
 * @since 2025-12-06
 */

import { App } from "vue";
// 导入 @techui/scifi 组件库和样式
import TechuiScifi from "@techui/scifi";
import "@techui/scifi/dist/index.css";

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

// 导出原始 @techui/scifi
export { TechuiScifi };

// 默认导出，用于全局注册
export default {
  install(app: App): void {
    // 注册 @techui/scifi 原生组件
    app.use(TechuiScifi);
    
    // 注册封装组件
    app.component("TechButton", TechButton);
    app.component("TechPanel", TechPanel);
    app.component("TechHeader", TechHeader);
    app.component("TechDeco", TechDeco);
    app.component("TechGeometry", TechGeometry);
    app.component("TechPanelTitle", TechPanelTitle);
  }
};
