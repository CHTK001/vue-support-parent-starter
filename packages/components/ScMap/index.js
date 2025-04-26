import ScMap from './index.vue';

// 导出组件
export { ScMap };

// 支持按需导入和全局注册
export default {
  install: (app) => {
    app.component(ScMap.name, ScMap);
  }
}; 