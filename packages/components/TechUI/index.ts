/**
 * TechUI - 科幻风格组件库封装
 * 基于 @techui/scifi 组件库
 * @author CH
 * @version 1.0.0
 * @since 2025-12-06
 */

import { App } from "vue";
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

// 默认导出，用于全局注册
export default {
  install(app: App): void {
    app.component("TechButton", TechButton);
    app.component("TechPanel", TechPanel);
    app.component("TechHeader", TechHeader);
    app.component("TechDeco", TechDeco);
    app.component("TechGeometry", TechGeometry);
    app.component("TechPanelTitle", TechPanelTitle);
  }
};
