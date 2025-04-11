import { App } from 'vue';
import ScDialog from './src/index.vue';
import DefaultLayout from './src/layouts/DefaultLayout.vue';
import SimpleLayout from './src/layouts/SimpleLayout.vue';
import HeadlessLayout from './src/layouts/HeadlessLayout.vue';

// 导出组件
export { 
  ScDialog,
  DefaultLayout,
  SimpleLayout,
  HeadlessLayout 
};

// 导出类型
export * from './src/types';

// 默认导出，用于全局注册
export default {
  install(app: App) {
    app.component('ScDialog', ScDialog);
    app.component('ScDialogDefault', DefaultLayout);
    app.component('ScDialogSimple', SimpleLayout);
    app.component('ScDialogHeadless', HeadlessLayout);
  }
}; 