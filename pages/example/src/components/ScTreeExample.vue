<template>
  <div class="sc-tree-example">
    <el-tabs type="border-card">
      <el-tab-pane label="基础用法">
        <h3>基础树形控件</h3>
        <p class="example-desc">ScTree 组件基于 Element Plus 的树形组件封装，提供了更便捷的树形数据展示能力</p>

        <el-card class="example-card">
          <template #header>
            <div class="card-header">
              <span>基础树形控件</span>
            </div>
          </template>

          <div class="tree-container">
            <ScTree ref="treeRef" :data="treeData" default-expand-all node-key="id" highlight-current @node-click="handleNodeClick"></ScTree>
          </div>
        </el-card>

        <el-divider content-position="left">代码示例</el-divider>

        <pre><code>
&lt;ScTree
  :data="treeData"
  default-expand-all
  node-key="id"
  highlight-current
  @node-click="handleNodeClick"
&gt;&lt;/ScTree&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="选择功能">
        <h3>可选择的树形控件</h3>
        <p class="example-desc">支持节点的选择功能，可以单选或多选</p>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-card class="example-card">
              <template #header>
                <div class="card-header">
                  <span>多选树</span>
                  <el-button type="primary" size="small" @click="getCheckedNodes">获取选中节点</el-button>
                </div>
              </template>

              <div class="tree-container">
                <ScTree ref="multiTreeRef" :data="treeData" show-checkbox node-key="id" default-expand-all @check="handleCheckChange"></ScTree>
              </div>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card class="example-card">
              <template #header>
                <div class="card-header">
                  <span>选中结果</span>
                </div>
              </template>

              <div class="result-container">
                <div v-if="checkedNodes.length > 0">
                  <el-tag v-for="node in checkedNodes" :key="node.id" class="tag-item">
                    {{ node.label }}
                  </el-tag>
                </div>
                <el-empty v-else description="暂无选中节点"></el-empty>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="自定义节点">
        <h3>自定义节点内容</h3>
        <p class="example-desc">通过插槽自定义节点内容和样式</p>

        <el-card class="example-card">
          <template #header>
            <div class="card-header">
              <span>自定义节点</span>
            </div>
          </template>

          <div class="tree-container">
            <ScTree :data="customTreeData" node-key="id" default-expand-all>
              <template #default="{ node, data }">
                <div class="custom-node">
                  <div class="node-icon">
                    <IconifyIconOnline :icon="data.icon" />
                  </div>
                  <div class="node-content">
                    <div class="node-label">{{ node.label }}</div>
                    <div v-if="data.description" class="node-desc">{{ data.description }}</div>
                  </div>
                  <div class="node-actions">
                    <el-button size="small" @click.stop="handleEdit(data)">编辑</el-button>
                    <el-button type="danger" size="small" @click.stop="handleDelete(data)">删除</el-button>
                  </div>
                </div>
              </template>
            </ScTree>
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="可拖拽树">
        <h3>可拖拽树形控件</h3>
        <p class="example-desc">支持节点拖拽功能，可以调整节点顺序和层级</p>

        <el-card class="example-card">
          <template #header>
            <div class="card-header">
              <span>可拖拽树</span>
            </div>
          </template>

          <div class="tree-container">
            <ScTree ref="dragTreeRef" :data="draggableTreeData" node-key="id" default-expand-all draggable @node-drag-start="handleDragStart" @node-drag-enter="handleDragEnter" @node-drag-leave="handleDragLeave" @node-drag-end="handleDragEnd" @node-drop="handleDrop"></ScTree>
          </div>

          <div class="drag-tips">
            <el-alert title="拖拽提示" type="info" :closable="false" description="可以通过拖拽节点调整顺序或层级，拖到其他节点上变为其子节点，拖到节点之间则改变顺序" show-icon></el-alert>
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="懒加载">
        <h3>懒加载树</h3>
        <p class="example-desc">节点数据异步加载，适用于大数据量的场景</p>

        <el-card class="example-card">
          <template #header>
            <div class="card-header">
              <span>懒加载树</span>
            </div>
          </template>

          <div class="tree-container">
            <ScTree ref="lazyTreeRef" :props="lazyTreeProps" :load="loadNode" lazy show-checkbox></ScTree>
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="API说明">
        <h3>ScTree 组件 API</h3>

        <el-descriptions title="属性" :column="1" border>
          <el-descriptions-item label="data">展示数据，类型: Array</el-descriptions-item>
          <el-descriptions-item label="node-key">每个树节点用来作为唯一标识的属性，整棵树应该是唯一的，类型: String</el-descriptions-item>
          <el-descriptions-item label="props">配置选项，类型: Object，默认: { children: 'children', label: 'label', disabled: 'disabled' }</el-descriptions-item>
          <el-descriptions-item label="show-checkbox">节点是否可被选择，类型: Boolean，默认: false</el-descriptions-item>
          <el-descriptions-item label="check-strictly">在显示复选框的情况下，是否严格的遵循父子不互相关联的做法，类型: Boolean，默认: false</el-descriptions-item>
          <el-descriptions-item label="default-expand-all">是否默认展开所有节点，类型: Boolean，默认: false</el-descriptions-item>
          <el-descriptions-item label="default-expanded-keys">默认展开的节点的 key 的数组，类型: Array</el-descriptions-item>
          <el-descriptions-item label="default-checked-keys">默认勾选的节点的 key 的数组，类型: Array</el-descriptions-item>
          <el-descriptions-item label="highlight-current">是否高亮当前选中节点，类型: Boolean，默认: false</el-descriptions-item>
          <el-descriptions-item label="draggable">是否开启拖拽节点功能，类型: Boolean，默认: false</el-descriptions-item>
          <el-descriptions-item label="lazy">是否懒加载子节点，类型: Boolean，默认: false</el-descriptions-item>
          <el-descriptions-item label="load">加载子节点数据的方法，仅当 lazy 为 true 时生效，类型: Function</el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-4">方法</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="filter(value)">对树节点进行筛选</el-descriptions-item>
          <el-descriptions-item label="getCheckedNodes(leafOnly, includeHalfChecked)">若节点可用被选择，则返回目前被选中的节点组成的数组</el-descriptions-item>
          <el-descriptions-item label="getCheckedKeys(leafOnly)">若节点可被选择，则返回目前被选中的节点的 key 所组成的数组</el-descriptions-item>
          <el-descriptions-item label="setCheckedKeys(keys)">通过 keys 设置目前勾选的节点</el-descriptions-item>
          <el-descriptions-item label="setChecked(key, checked, deep)">通过 key 设置某个节点的勾选状态</el-descriptions-item>
          <el-descriptions-item label="getHalfCheckedNodes()">若节点可被选择，则返回目前半选中的节点所组成的数组</el-descriptions-item>
          <el-descriptions-item label="getHalfCheckedKeys()">若节点可被选择，则返回目前半选中的节点的 key 所组成的数组</el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-4">事件</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="node-click">当节点被点击时的回调，参数: nodeData, node, event</el-descriptions-item>
          <el-descriptions-item label="check-change">节点选中状态发生变化时的回调，参数: data, checked, indeterminate</el-descriptions-item>
          <el-descriptions-item label="current-change">当前选中节点变化时触发的事件，参数: data, node</el-descriptions-item>
          <el-descriptions-item label="node-expand">节点被展开时触发的事件，参数: nodeData, node, event</el-descriptions-item>
          <el-descriptions-item label="node-collapse">节点被关闭时触发的事件，参数: nodeData, node, event</el-descriptions-item>
          <el-descriptions-item label="node-drag-start">节点开始拖拽时触发的事件，参数: node, event</el-descriptions-item>
          <el-descriptions-item label="node-drag-enter">拖拽进入其他节点时触发的事件，参数: draggingNode, dropNode, event</el-descriptions-item>
          <el-descriptions-item label="node-drag-leave">拖拽离开某个节点时触发的事件，参数: draggingNode, dropNode, event</el-descriptions-item>
          <el-descriptions-item label="node-drop">拖拽成功完成时触发的事件，参数: draggingNode, dropNode, dropType, event</el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-4">插槽</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="default">自定义树节点的内容，参数为 { node, data }</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";

// 基础树形数据
const treeData = [
  {
    id: 1,
    label: "一级节点 1",
    children: [
      {
        id: 11,
        label: "二级节点 1-1",
        children: [
          {
            id: 111,
            label: "三级节点 1-1-1",
          },
        ],
      },
      {
        id: 12,
        label: "二级节点 1-2",
      },
    ],
  },
  {
    id: 2,
    label: "一级节点 2",
    children: [
      {
        id: 21,
        label: "二级节点 2-1",
      },
      {
        id: 22,
        label: "二级节点 2-2",
      },
    ],
  },
  {
    id: 3,
    label: "一级节点 3",
    children: [
      {
        id: 31,
        label: "二级节点 3-1",
      },
      {
        id: 32,
        label: "二级节点 3-2",
      },
    ],
  },
];

// 多选树相关
const multiTreeRef = ref(null);
const checkedNodes = ref([]);

// 自定义树节点数据
const customTreeData = [
  {
    id: 1,
    label: "组织架构",
    icon: "ri:building-line",
    description: "公司组织架构",
    children: [
      {
        id: 11,
        label: "技术部",
        icon: "ri:code-s-slash-line",
        description: "负责产品研发和技术支持",
        children: [
          {
            id: 111,
            label: "研发组",
            icon: "ri:braces-line",
            description: "负责核心产品开发",
          },
          {
            id: 112,
            label: "测试组",
            icon: "ri:bug-line",
            description: "负责产品质量保障",
          },
          {
            id: 113,
            label: "运维组",
            icon: "ri:server-line",
            description: "负责系统运维和稳定性",
          },
        ],
      },
      {
        id: 12,
        label: "产品部",
        icon: "ri:product-hunt-line",
        description: "负责产品设计和需求管理",
        children: [
          {
            id: 121,
            label: "产品设计组",
            icon: "ri:ruler-line",
            description: "负责产品界面和交互设计",
          },
          {
            id: 122,
            label: "需求管理组",
            icon: "ri:file-list-line",
            description: "负责需求收集和分析",
          },
        ],
      },
      {
        id: 13,
        label: "市场部",
        icon: "ri:advertisement-line",
        description: "负责市场推广和品牌建设",
      },
    ],
  },
  {
    id: 2,
    label: "人员管理",
    icon: "ri:team-line",
    description: "公司人员管理",
    children: [
      {
        id: 21,
        label: "行政人事",
        icon: "ri:contacts-line",
        description: "负责人事行政工作",
      },
      {
        id: 22,
        label: "财务",
        icon: "ri:money-cny-box-line",
        description: "负责公司财务管理",
      },
    ],
  },
];

// 可拖拽树数据
const draggableTreeData = ref(JSON.parse(JSON.stringify(treeData)));

// 懒加载树属性
const lazyTreeProps = {
  label: "name",
  children: "zones",
  isLeaf: "leaf",
};

// 懒加载方法
const loadNode = (node, resolve) => {
  if (node.level === 0) {
    setTimeout(() => {
      resolve([
        { name: "区域一", id: 1 },
        { name: "区域二", id: 2 },
      ]);
    }, 1000);
  } else if (node.level === 1) {
    setTimeout(() => {
      const data = [
        { name: `${node.data.name}-分类1`, id: `${node.data.id}-1` },
        { name: `${node.data.name}-分类2`, id: `${node.data.id}-2` },
      ];
      resolve(data);
    }, 500);
  } else if (node.level === 2) {
    setTimeout(() => {
      const data = [
        { name: `${node.data.name}-选项1`, id: `${node.data.id}-1`, leaf: true },
        { name: `${node.data.name}-选项2`, id: `${node.data.id}-2`, leaf: true },
      ];
      resolve(data);
    }, 500);
  }
};

// 基础树节点点击事件
const handleNodeClick = (data) => {
  ElMessage.info(`当前点击: ${data.label}`);
};

// 多选树选择变化事件
const handleCheckChange = () => {
  // 获取选中的节点
  checkedNodes.value = multiTreeRef.value.getCheckedNodes();
};

// 获取选中节点
const getCheckedNodes = () => {
  checkedNodes.value = multiTreeRef.value.getCheckedNodes();
  ElMessage.success(`已选中 ${checkedNodes.value.length} 个节点`);
};

// 编辑节点
const handleEdit = (data) => {
  ElMessage.info(`编辑节点: ${data.label}`);
};

// 删除节点
const handleDelete = (data) => {
  ElMessage.warning(`删除节点: ${data.label}`);
};

// 拖拽相关方法
const handleDragStart = () => {
  // 拖拽开始
};

const handleDragEnter = () => {
  // 拖拽进入目标节点
};

const handleDragLeave = () => {
  // 拖拽离开目标节点
};

const handleDragEnd = () => {
  // 拖拽结束
};

const handleDrop = (draggingNode, dropNode, dropType) => {
  ElMessage.success(`成功拖拽 ${draggingNode.label} 到 ${dropNode.label} ${dropType === "inner" ? "内部" : dropType === "before" ? "之前" : "之后"}`);
};
</script>

<style lang="scss" scoped>
.sc-tree-example {
  padding: 16px;

  .example-desc {
    color: #666;
    margin-bottom: 16px;
  }

  .example-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .tree-container {
    min-height: 300px;
    max-height: 500px;
    overflow: auto;
  }

  .result-container {
    min-height: 300px;
    padding: 10px;

    .tag-item {
      margin: 5px;
    }
  }

  .custom-node {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 4px 0;

    .node-icon {
      font-size: 18px;
      margin-right: 8px;
      color: var(--el-color-primary);
    }

    .node-content {
      flex: 1;

      .node-label {
        font-weight: bold;
      }

      .node-desc {
        font-size: 12px;
        color: #999;
      }
    }

    .node-actions {
      display: flex;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.3s;
    }

    &:hover .node-actions {
      opacity: 1;
    }
  }

  .drag-tips {
    margin-top: 16px;
  }

  .mt-4 {
    margin-top: 16px;
  }

  pre {
    background-color: #f5f7fa;
    border-radius: 4px;
    padding: 16px;
    overflow-x: auto;

    code {
      font-family: Consolas, Monaco, "Andale Mono", monospace;
      font-size: 14px;
      color: #333;
    }
  }
}
</style>
