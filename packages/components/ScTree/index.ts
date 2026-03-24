import { App } from 'vue';
import ScTree from './index.vue';
import type { TreeNodeData, TreeKey, TreeNode, TreeProps } from './types';

export { TreeNodeData, TreeKey, TreeNode, TreeProps };

// 为组件提供 install 方法，用于 app.use() 注册
ScTree.install = function(app: App) {
  app.component(ScTree.name || 'ScTree', ScTree);
  return app;
};

export { ScTree };
export default ScTree; 