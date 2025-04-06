import ScPanel from './ScPanel';

// 导出组件
export {
  ScPanel,
};

// 导出所有组件
export default {
  install(app) {
    app.use(ScPanel);
  }
};
