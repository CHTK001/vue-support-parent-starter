import { App } from 'vue';
import ScDialog from './src/ScDialog.vue';

// 导出组件
export { ScDialog };

// 导出类型
export * from './src/types';

// 默认导出，用于全局注册
export default {
  install(app: App) {
    app.component('ScDialog', ScDialog);
  }
}; 