import ScLayer from './ScLayer';
import ScMap from './ScMap';

// 导出组件
export {
  ScLayer,
  ScMap
};

// 导出所有组件
export default {
  install(app) {
    app.use(ScLayer);
    app.component('ScMap', ScMap);
  }
};
