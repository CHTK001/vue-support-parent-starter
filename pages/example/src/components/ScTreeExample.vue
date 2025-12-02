<template>
  <div class="sc-tree-example">
    <!-- 预览区域 -->
    <div class="preview-area">
      <h4>组件预览</h4>
      <div
        class="preview-container"
        :class="{ fullscreen: isFullscreen }"
        :style="customContainerStyle"
      >
        <el-button
          class="fullscreen-btn"
          type="primary"
          circle
          size="small"
          @click="toggleFullscreen"
        >
          <el-icon v-if="isFullscreen"><i class="el-icon-close" /></el-icon>
          <el-icon v-else><i class="el-icon-full-screen" /></el-icon>
        </el-button>

        <div class="panel-preview">
          <ScTree
            ref="treeRef"
            v-model:data="treeData"
            :props="treeProps"
            :node-key="nodeKey"
            :highlight-current="highlightCurrent"
            :default-expand-all="defaultExpandAll"
            :expand-on-click-node="expandOnClickNode"
            :check-on-click-node="checkOnClickNode"
            :auto-expand-parent="autoExpandParent"
            :show-checkbox="showCheckbox"
            :check-strictly="checkStrictly"
            :draggable="draggable"
            :accordion="accordion"
            :indent="indent"
            @node-click="handleNodeClick"
            @check="handleCheck"
            @node-drag-end="handleDragEnd"
            @node-drop="handleNodeDrop"
          />
        </div>
      </div>
    </div>

    <!-- 操作按钮区域 -->
    <div class="action-bar">
      <el-button @click="expandAll" type="primary" size="small" plain
        >展开所有</el-button
      >
      <el-button @click="collapseAll" type="info" size="small" plain
        >折叠所有</el-button
      >
      <el-button @click="getSelectedData" type="success" size="small" plain
        >获取选中节点</el-button
      >
      <el-button @click="getAllData" type="warning" size="small" plain
        >获取所有数据</el-button
      >
      <el-button @click="resetData" type="danger" size="small" plain
        >重置数据</el-button
      >
      <el-button @click="addNode" size="small" plain>添加节点</el-button>
    </div>

    <!-- 配置面板 -->
    <div class="config-panel mt-4">
      <h4>配置选项</h4>
      <el-row :gutter="20">
        <!-- 基本配置 -->
        <el-col :xs="24" :sm="12">
          <h5>基础配置</h5>
          <el-form label-position="top" size="default">
            <el-form-item label="节点键名">
              <el-input v-model="nodeKey" placeholder="节点唯一标识的属性名" />
            </el-form-item>

            <el-form-item label="缩进大小">
              <el-slider
                v-model="indent"
                :min="8"
                :max="32"
                :step="4"
                show-stops
              />
            </el-form-item>

            <el-divider content-position="center">树节点属性</el-divider>

            <el-form-item label="子节点属性名">
              <el-input
                v-model="treeProps.children"
                placeholder="子节点属性名"
              />
            </el-form-item>

            <el-form-item label="标签属性名">
              <el-input v-model="treeProps.label" placeholder="标签属性名" />
            </el-form-item>

            <el-form-item label="禁用属性名">
              <el-input v-model="treeProps.disabled" placeholder="禁用属性名" />
            </el-form-item>
          </el-form>
        </el-col>

        <!-- 功能配置 -->
        <el-col :xs="24" :sm="12">
          <h5>功能配置</h5>
          <el-form label-position="top" size="default">
            <el-form-item label="基本功能">
              <div class="option-switches">
                <el-switch
                  v-model="highlightCurrent"
                  active-text="高亮当前节点"
                />
                <el-switch
                  v-model="defaultExpandAll"
                  active-text="默认展开所有"
                />
                <el-switch
                  v-model="autoExpandParent"
                  active-text="自动展开父节点"
                />
                <el-switch
                  v-model="expandOnClickNode"
                  active-text="点击节点展开"
                />
              </div>
            </el-form-item>

            <el-form-item label="选择功能">
              <div class="option-switches">
                <el-switch v-model="showCheckbox" active-text="显示复选框" />
                <el-switch
                  v-model="checkStrictly"
                  :disabled="!showCheckbox"
                  active-text="严格选择模式"
                />
                <el-switch
                  v-model="checkOnClickNode"
                  active-text="点击节点选中"
                />
              </div>
            </el-form-item>

            <el-form-item label="高级功能">
              <div class="option-switches">
                <el-switch v-model="draggable" active-text="启用拖拽功能" />
                <el-switch v-model="accordion" active-text="手风琴模式" />
              </div>
            </el-form-item>
          </el-form>
        </el-col>
      </el-row>
    </div>

    <!-- 操作结果 -->
    <div v-if="operationResult" class="operation-result">
      <h4>操作结果</h4>
      <div class="result-container">
        <div class="result-header">
          <span>{{ operationResultTitle }}</span>
          <el-button type="text" @click="operationResult = null"
            >关闭</el-button
          >
        </div>
        <pre class="result-content">{{ operationResult }}</pre>
      </div>
    </div>

    <!-- 代码示例 -->
    <div class="code-example mt-4">
      <CodeDisplay
        :code="generatedCode"
        language="html"
        title="代码示例"
        description="根据当前配置生成的代码示例"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ScTree from "@repo/components/ScTree/index.vue";
import CodeDisplay from "./CodeDisplay.vue";
import type {
  TreeNode,
  TreeNodeData,
  TreeProps,
} from "@repo/components/ScTree/types";
import { computed, reactive, ref } from "vue";

// 初始树形数据
const initialTreeData: TreeNodeData[] = [
  {
    id: 1,
    label: "一级节点 1",
    children: [
      {
        id: 4,
        label: "二级节点 1-1",
        children: [
          {
            id: 9,
            label: "三级节点 1-1-1",
          },
          {
            id: 10,
            label: "三级节点 1-1-2",
          },
        ],
      },
    ],
  },
  {
    id: 2,
    label: "一级节点 2",
    children: [
      {
        id: 5,
        label: "二级节点 2-1",
      },
      {
        id: 6,
        label: "二级节点 2-2",
      },
    ],
  },
  {
    id: 3,
    label: "一级节点 3",
    children: [
      {
        id: 7,
        label: "二级节点 3-1",
      },
      {
        id: 8,
        label: "二级节点 3-2",
      },
    ],
  },
];

// 树形数据
const treeData = ref<TreeNodeData[]>(
  JSON.parse(JSON.stringify(initialTreeData))
);

// 树形组件引用
const treeRef = ref<InstanceType<typeof ScTree> | null>(null);

// 树形组件属性配置
const nodeKey = ref<string>("id");
const indent = ref<number>(16);
const treeProps = reactive<TreeProps>({
  children: "children",
  label: "label",
  disabled: "disabled",
});

// 功能配置
const highlightCurrent = ref<boolean>(true);
const defaultExpandAll = ref<boolean>(true);
const expandOnClickNode = ref<boolean>(true);
const checkOnClickNode = ref<boolean>(false);
const autoExpandParent = ref<boolean>(true);
const showCheckbox = ref<boolean>(false);
const checkStrictly = ref<boolean>(false);
const draggable = ref<boolean>(false);
const accordion = ref<boolean>(false);

// 全屏控制
const isFullscreen = ref<boolean>(false);

// 操作结果
const operationResult = ref<string | null>(null);
const operationResultTitle = ref<string>("操作结果");

// 下一个节点ID计数
let nextNodeId = 11;

// 全屏切换
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

// 自定义容器样式
const customContainerStyle = computed(() => {
  const style: Record<string, string> = {};

  if (isFullscreen.value) {
    style.backgroundColor = "#f5f7fa";
  }

  return style;
});

// 操作方法
const expandAll = () => {
  if (treeRef.value) {
    treeRef.value.expandAll();
  }
};

const collapseAll = () => {
  if (treeRef.value) {
    treeRef.value.collapseAll();
  }
};

const getSelectedData = () => {
  if (!treeRef.value) return;

  if (showCheckbox.value) {
    // 获取复选框选中的节点
    const nodes = treeRef.value.getCheckedNodes();
    operationResultTitle.value = "选中节点数据";
    operationResult.value = JSON.stringify(nodes, null, 2);
  } else {
    // 获取当前高亮的节点
    const node = treeRef.value.getCurrentNode();
    operationResultTitle.value = "当前选中节点";
    operationResult.value = node ? JSON.stringify(node, null, 2) : "无选中节点";
  }
};

const getAllData = () => {
  if (treeRef.value) {
    const allData = treeRef.value.getAllData();
    operationResultTitle.value = "所有树形数据";
    operationResult.value = JSON.stringify(allData, null, 2);
  }
};

const resetData = () => {
  treeData.value = JSON.parse(JSON.stringify(initialTreeData));
  nextNodeId = 11;
  operationResultTitle.value = "数据已重置";
  operationResult.value = "树形数据已还原为初始状态";
};

const addNode = () => {
  if (!treeRef.value) return;

  const currentNode = treeRef.value.getCurrentNode();
  const newNode: TreeNodeData = {
    id: nextNodeId++,
    label: `新节点 ${nextNodeId - 1}`,
  };

  if (currentNode) {
    // 向选中节点添加子节点
    treeRef.value.append(newNode, currentNode);
    operationResultTitle.value = "添加子节点";
    operationResult.value = `已向节点 "${currentNode.label}" 添加子节点 "${newNode.label}"`;
  } else {
    // 添加根节点
    treeData.value.push(newNode);
    operationResultTitle.value = "添加根节点";
    operationResult.value = `已添加根节点 "${newNode.label}"`;
  }
};

// 事件处理
const handleNodeClick = (data: TreeNodeData, node: TreeNode) => {
  operationResultTitle.value = "节点点击事件";
  operationResult.value = JSON.stringify(
    {
      data,
      node: {
        label: node.label,
        level: node.level,
        isLeaf: node.isLeaf,
        expanded: node.expanded,
      },
    },
    null,
    2
  );
};

const handleCheck = (data: TreeNodeData, params: any) => {
  operationResultTitle.value = "节点选中事件";
  operationResult.value = JSON.stringify(
    {
      checkedNode: data,
      checkedCount: params.checkedNodes.length,
    },
    null,
    2
  );
};

const handleDragEnd = (
  draggingNode: TreeNode,
  dropNode: TreeNode | null,
  dropType: "before" | "after" | "inner" | undefined,
  event: DragEvent
) => {
  operationResultTitle.value = "拖拽结束事件";
  operationResult.value = JSON.stringify(
    {
      draggingNode: {
        label: draggingNode.label,
        level: draggingNode.level,
      },
      dropNode: dropNode
        ? {
            label: dropNode.label,
            level: dropNode.level,
          }
        : null,
      dropType,
    },
    null,
    2
  );
};

const handleNodeDrop = (
  draggingNode: TreeNode,
  dropNode: TreeNode | null,
  dropType: "before" | "after" | "inner" | undefined,
  event: DragEvent
) => {
  // 拖拽完成时获取新的完整数据
  getAllData();
};

// 代码示例生成函数
function generateCode() {
  let template = "<template>\n";
  template += "  <ScTree\n";
  template += '    :data="treeData"\n';
  template +=
    nodeKey.value !== "id"
      ? `    :node-key="${nodeKey.value}"\n`
      : '    node-key="id"\n';
  template += !defaultExpandAll.value
    ? '    :default-expand-all="false"\n'
    : "    default-expand-all\n";

  if (!expandOnClickNode.value) {
    template += '    :expand-on-click-node="false"\n';
  }

  if (checkOnClickNode.value) {
    template += '    :check-on-click-node="true"\n';
  }

  if (!autoExpandParent.value) {
    template += '    :auto-expand-parent="false"\n';
  }

  if (highlightCurrent.value) {
    template += "    highlight-current\n";
  }

  if (showCheckbox.value) {
    template += "    show-checkbox\n";
  }

  if (checkStrictly.value) {
    template += "    check-strictly\n";
  }

  if (draggable.value) {
    template += "    draggable\n";
  }

  if (accordion.value) {
    template += "    accordion\n";
  }

  if (indent.value !== 16) {
    template += `    :indent="${indent.value}"\n`;
  }

  const hasCustomProps = Object.keys(treeProps).some(
    (key) =>
      treeProps[key as keyof TreeProps] !==
      (key === "children" ? "children" : key === "label" ? "label" : "disabled")
  );

  if (hasCustomProps) {
    template += `    :props="${JSON.stringify(treeProps)}"\n`;
  }

  template += '    @node-click="handleNodeClick"\n';

  if (showCheckbox.value) {
    template += '    @check="handleCheck"\n';
  }

  if (draggable.value) {
    template += '    @node-drag-end="handleDragEnd"\n';
    template += '    @node-drop="handleNodeDrop"\n';
  }

  template += "  />\n";
  template += "</template>\n\n";

  // script部分
  template += '<script setup lang="ts">\n';
  template += "import { ref } from 'vue';\n";
  template += "import ScTree from '@repo/components/ScTree/index.vue';\n";
  template +=
    "import type { TreeNodeData, TreeNode, TreeProps } from '@repo/components/ScTree/types';\n\n";

  template += "const treeData = ref<TreeNodeData[]>([\n";
  template += "  {\n";
  template += "    id: 1,\n";
  template += "    label: '一级节点 1',\n";
  template += "    children: [\n";
  template += "      {\n";
  template += "        id: 4,\n";
  template += "        label: '二级节点 1-1',\n";
  template += "        children: [/* 子节点 */]\n";
  template += "      }\n";
  template += "    ]\n";
  template += "  },\n";
  template += "  // 更多节点...\n";
  template += "]);\n\n";

  if (hasCustomProps) {
    template += `const treeProps: TreeProps = ${JSON.stringify(treeProps, null, 2)};\n\n`;
  }

  template +=
    "const handleNodeClick = (data: TreeNodeData, node: TreeNode) => {\n";
  template += "  console.log('节点点击:', data, node);\n";
  template += "};\n";

  if (showCheckbox.value) {
    template +=
      "\nconst handleCheck = (data: TreeNodeData, params: any) => {\n";
    template += "  console.log('节点选中:', data, params);\n";
    template += "};\n";
  }

  if (draggable.value) {
    template += "\nconst handleDragEnd = (\n";
    template += "  draggingNode: TreeNode,\n";
    template += "  dropNode: TreeNode | null,\n";
    template += "  dropType: 'before' | 'after' | 'inner' | undefined\n";
    template += ") => {\n";
    template +=
      "  console.log('拖拽结束:', draggingNode, dropNode, dropType);\n";
    template += "};\n\n";

    template += "const handleNodeDrop = (\n";
    template += "  draggingNode: TreeNode,\n";
    template += "  dropNode: TreeNode | null,\n";
    template += "  dropType: 'before' | 'after' | 'inner' | undefined\n";
    template += ") => {\n";
    template += "  console.log('节点已放置，树结构已更新');\n";
    template += "};\n";
  }

  template += "<\/script>";
  return template;
}

// 生成代码示例
const generatedCode = computed(() => generateCode());
</script>

<style lang="scss" scoped>
.sc-tree-example {
  padding: 20px;

  .example-title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 10px;
  }

  .example-description {
    color: var(--el-text-color-primary);
    margin-bottom: 24px;
    line-height: 1.6;
  }

  .card-header h3 {
    margin: 0 0 8px 0;
    font-size: 22px;
  }

  .text-secondary {
    color: var(--el-text-color-primary);
    margin: 0;
  }

  h4 {
    margin-top: 0;
    margin-bottom: 16px;
    font-size: 18px;
    color: var(--el-text-color-primary);
  }

  h5 {
    font-size: 16px;
    color: var(--el-text-color-regular);
    margin-top: 0;
    margin-bottom: 16px;
  }

  .mt-4 {
    margin-top: 24px;
  }

  .mb-3 {
    margin-bottom: 12px;
  }

  .preview-area {
    margin-bottom: 20px;
  }

  .preview-container {
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    padding: 24px;
    min-height: 400px;
    position: relative;
    transition: all 0.3s;

    &.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100vh;
      z-index: 2000;
      border-radius: 0;
      padding: 40px;
      background-color: var(--el-bg-color-page);

      &:before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 6px;
        background: linear-gradient(
          90deg,
          var(--el-color-primary),
          var(--el-color-success)
        );
      }
    }
  }

  .fullscreen-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 10;
    opacity: 0.8;
    transition: all 0.2s ease;

    &:hover {
      opacity: 1;
      transform: scale(1.1);
    }
  }

  .panel-preview {
    width: 100%;
    height: 100%;
  }

  .option-switches {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  .action-bar {
    margin: 20px 0;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .operation-result {
    margin-top: 20px;
    border: 1px solid var(--el-color-primary-light-7);
    border-radius: 8px;
    overflow: hidden;

    .result-header {
      background-color: var(--el-color-primary-light-9);
      padding: 10px 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: bold;
      color: var(--el-text-color-primary);
    }

    .result-container {
      background-color: var(--el-fill-color-lighter);
    }

    .result-content {
      padding: 15px;
      margin: 0;
      max-height: 300px;
      overflow: auto;
      font-family: "SFMono-Regular", Consolas, Monaco, "Andale Mono", monospace;
      font-size: 13px;
      background-color: var(--el-fill-color-light);
      white-space: pre-wrap;
      color: var(--el-text-color-primary);
    }
  }

  .code-example {
    .code-desc {
      margin-bottom: 8px;
    }

    pre {
      background-color: var(--el-fill-color-light);
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 0;
    }

    code {
      font-family:
        "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 14px;
      color: var(--el-text-color-primary);
    }
  }
}

// 深色主题适配
html.dark {
  .sc-tree-example {
    .preview-container.fullscreen {
      background-color: var(--el-bg-color);
    }

    .operation-result {
      border-color: var(--el-border-color);

      .result-header {
        background-color: var(--el-fill-color-dark);
      }

      .result-container {
        background-color: var(--el-fill-color-darker);
      }

      .result-content {
        background-color: var(--el-fill-color-dark);
      }
    }

    .code-example pre {
      background-color: var(--el-fill-color-darker);
    }
  }
}
</style>
