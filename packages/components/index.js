import ScTree from './ScTree';
import ScMap from './ScMap';

// 导出组件
export {
  ScTree,
  ScMap,
};

// 导出所有组件
export default {
  install(app) {
    app.use(ScTree);
    app.use(ScMap);
  }
};
