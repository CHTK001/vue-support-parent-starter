// 主布局导出
import { default as ExampleLayout } from "./index.vue";

// 示例页面：TechUI 独立页面
import TechUIPage from "./views/TechUIPage.vue";

// 示例页面：ReteEditor 可视化编辑器
import ReteEditorPage from "./views/rete-editor/index.vue";

// 默认导出主布局
export default ExampleLayout;

// 导出示例页面组件，供主应用按需引用
export {
  TechUIPage,
  ReteEditorPage,
}; 