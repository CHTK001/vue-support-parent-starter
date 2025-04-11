import ScTree from './ScTree';

// 导出组件
export {
  ScTree,
};

// 导出所有组件
export default {
  install(app) {
    app.use(ScTree);
  }
};
