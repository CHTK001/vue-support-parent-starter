import ScLayer from './ScLayer';

// 导出组件
export {
  ScLayer
};

// 导出所有组件
export default {
  install(app) {
    app.use(ScLayer);
  }
};
