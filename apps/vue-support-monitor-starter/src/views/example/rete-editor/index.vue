<template>
  <div class="rete-editor-example system-container modern-bg">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>ScReteEditor 可视化节点编辑器示例</h2>
      <p class="description">
        基于 Rete.js 的可视化节点编辑器组件，支持节点拖拽、连接、右键菜单、小地图、自动排列等功能。
      </p>
    </div>

    <!-- 示例切换 -->
    <el-tabs v-model="activeTab" class="example-tabs">
      <!-- 基础用法 -->
      <el-tab-pane label="基础用法" name="basic">
        <div class="example-section">
          <h3>基础编辑器</h3>
          <p>包含完整的工具栏、节点面板、属性面板和状态栏。</p>
          
          <div class="editor-container">
            <ScReteEditor
              ref="basicEditorRef"
              v-model="basicData"
              :show-toolbar="true"
              :show-node-panel="true"
              :show-property-panel="true"
              :show-statusbar="true"
              :minimap="true"
              :context-menu="true"
              :auto-arrange="true"
              @data-changed="handleBasicDataChange"
            />
          </div>

          <div class="example-actions">
            <el-button @click="handleBasicGetData">获取数据</el-button>
            <el-button @click="handleBasicLoadSample">加载示例数据</el-button>
            <el-button @click="handleBasicClear">清空</el-button>
            <el-button @click="handleBasicArrange">自动排列</el-button>
          </div>

          <el-collapse>
            <el-collapse-item title="查看数据 (JSON)" name="data">
              <pre class="json-preview">{{ JSON.stringify(basicData, null, 2) }}</pre>
            </el-collapse-item>
          </el-collapse>
        </div>
      </el-tab-pane>

      <!-- 简洁模式 -->
      <el-tab-pane label="简洁模式" name="minimal">
        <div class="example-section">
          <h3>简洁编辑器</h3>
          <p>隐藏部分面板，只保留画布区域，适合嵌入到其他页面中。</p>
          
          <div class="editor-container" style="height: 400px;">
            <ScReteEditor
              ref="minimalEditorRef"
              v-model="minimalData"
              :show-toolbar="true"
              :show-node-panel="false"
              :show-property-panel="false"
              :show-statusbar="false"
              :minimap="false"
              :context-menu="true"
              :auto-arrange="true"
              background="lines"
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 只读模式 -->
      <el-tab-pane label="只读模式" name="readonly">
        <div class="example-section">
          <h3>只读编辑器</h3>
          <p>禁用所有编辑操作，只能查看节点和连接。</p>
          
          <div class="editor-container" style="height: 400px;">
            <ScReteEditor
              v-model="readonlyData"
              :readonly="true"
              :show-toolbar="false"
              :show-node-panel="false"
              :show-property-panel="false"
              :show-statusbar="true"
              :minimap="true"
              background="dots"
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 自定义节点 -->
      <el-tab-pane label="自定义节点菜单" name="custom">
        <div class="example-section">
          <h3>自定义节点菜单</h3>
          <p>通过 nodeMenuItems 配置自定义节点类型和图标。</p>
          
          <div class="editor-container">
            <ScReteEditor
              ref="customEditorRef"
              v-model="customData"
              :show-toolbar="true"
              :show-node-panel="true"
              :show-property-panel="true"
              :show-statusbar="true"
              :minimap="true"
              :node-menu-items="customNodeMenuItems"
              @node-created="handleNodeCreated"
              @node-selected="handleNodeSelected"
            />
          </div>

          <div class="selected-node-info" v-if="selectedNodeInfo">
            <el-alert type="info" :closable="false">
              <template #title>
                选中节点: {{ selectedNodeInfo.label }} (ID: {{ selectedNodeInfo.id }})
              </template>
            </el-alert>
          </div>
        </div>
      </el-tab-pane>

      <!-- API 方法 -->
      <el-tab-pane label="API 方法" name="api">
        <div class="example-section">
          <h3>编辑器 API</h3>
          <p>通过 ref 调用编辑器的方法进行程序化操作。</p>
          
          <div class="editor-container" style="height: 400px;">
            <ScReteEditor
              ref="apiEditorRef"
              v-model="apiData"
              :show-toolbar="true"
              :show-node-panel="false"
              :show-property-panel="false"
              :show-statusbar="true"
              :minimap="true"
            />
          </div>

          <div class="api-actions">
            <el-space wrap>
              <el-button type="primary" @click="apiAddInputNode">添加输入节点</el-button>
              <el-button type="primary" @click="apiAddProcessNode">添加处理节点</el-button>
              <el-button type="primary" @click="apiAddOutputNode">添加输出节点</el-button>
              <el-divider direction="vertical" />
              <el-button @click="apiArrange">自动排列</el-button>
              <el-button @click="apiZoomToFit">适应画布</el-button>
              <el-button @click="apiSetZoom(0.5)">缩放 50%</el-button>
              <el-button @click="apiSetZoom(1)">缩放 100%</el-button>
              <el-button @click="apiSetZoom(1.5)">缩放 150%</el-button>
              <el-divider direction="vertical" />
              <el-button type="danger" @click="apiClear">清空</el-button>
            </el-space>
          </div>
        </div>
      </el-tab-pane>

      <!-- 代码示例 -->
      <el-tab-pane label="代码示例" name="code">
        <div class="example-section">
          <h3>使用说明</h3>
          
          <el-collapse v-model="activeCodeCollapse">
            <el-collapse-item title="1. 基础用法" name="basic-code">
              <pre class="code-block">{{ basicCodeExample }}</pre>
            </el-collapse-item>
            
            <el-collapse-item title="2. 数据格式 (EditorData)" name="data-code">
              <pre class="code-block">{{ dataFormatExample }}</pre>
            </el-collapse-item>
            
            <el-collapse-item title="3. 调用组件方法" name="api-code">
              <pre class="code-block">{{ apiCodeExample }}</pre>
            </el-collapse-item>
            
            <el-collapse-item title="4. 自定义节点菜单" name="custom-code">
              <pre class="code-block">{{ customNodeCodeExample }}</pre>
            </el-collapse-item>
          </el-collapse>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import { ScReteEditor, type EditorData, type BaseNode, type NodeTypeName } from "@repo/components";

// =============== 基础用法 ===============
const basicEditorRef = ref<InstanceType<typeof ScReteEditor>>();
const basicData = ref<EditorData>({
  nodes: [],
  connections: [],
});

const handleBasicDataChange = (data: EditorData) => {
  console.log("数据变化:", data);
};

const handleBasicGetData = () => {
  const data = basicEditorRef.value?.getData();
  console.log("获取数据:", data);
  ElMessage.success("数据已输出到控制台");
};

const handleBasicLoadSample = async () => {
  const sampleData: EditorData = {
    nodes: [
      { id: "node_1", type: "input", label: "MySQL 数据源", position: { x: 100, y: 150 } },
      { id: "node_2", type: "process", label: "数据转换", position: { x: 350, y: 100 } },
      { id: "node_3", type: "condition", label: "数据校验", position: { x: 350, y: 250 } },
      { id: "node_4", type: "output", label: "Redis 缓存", position: { x: 600, y: 100 } },
      { id: "node_5", type: "output", label: "Elasticsearch", position: { x: 600, y: 250 } },
    ],
    connections: [
      { sourceId: "node_1", sourceOutput: "output", targetId: "node_2", targetInput: "input" },
      { sourceId: "node_1", sourceOutput: "output", targetId: "node_3", targetInput: "input" },
      { sourceId: "node_2", sourceOutput: "output", targetId: "node_4", targetInput: "input" },
      { sourceId: "node_3", sourceOutput: "true", targetId: "node_5", targetInput: "input" },
    ],
  };
  
  await basicEditorRef.value?.loadData(sampleData);
  ElMessage.success("示例数据已加载");
};

const handleBasicClear = async () => {
  await basicEditorRef.value?.clear();
  ElMessage.success("已清空");
};

const handleBasicArrange = async () => {
  await basicEditorRef.value?.arrange();
  ElMessage.success("已自动排列");
};

// =============== 简洁模式 ===============
const minimalEditorRef = ref<InstanceType<typeof ScReteEditor>>();
const minimalData = ref<EditorData>({
  nodes: [
    { id: "m1", type: "input", label: "输入", position: { x: 100, y: 100 } },
    { id: "m2", type: "output", label: "输出", position: { x: 400, y: 100 } },
  ],
  connections: [
    { sourceId: "m1", sourceOutput: "output", targetId: "m2", targetInput: "input" },
  ],
});

// =============== 只读模式 ===============
const readonlyData = ref<EditorData>({
  nodes: [
    { id: "r1", type: "input", label: "数据输入", position: { x: 100, y: 100 } },
    { id: "r2", type: "process", label: "处理节点", position: { x: 350, y: 100 } },
    { id: "r3", type: "output", label: "数据输出", position: { x: 600, y: 100 } },
  ],
  connections: [
    { sourceId: "r1", sourceOutput: "output", targetId: "r2", targetInput: "input" },
    { sourceId: "r2", sourceOutput: "output", targetId: "r3", targetInput: "input" },
  ],
});

// =============== 自定义节点 ===============
const customEditorRef = ref<InstanceType<typeof ScReteEditor>>();
const customData = ref<EditorData>({
  nodes: [],
  connections: [],
});

const customNodeMenuItems = [
  { label: "数据库", type: "input" as NodeTypeName, icon: "ri:database-2-line" },
  { label: "API接口", type: "input" as NodeTypeName, icon: "ri:cloud-line" },
  { label: "文件导入", type: "input" as NodeTypeName, icon: "ri:file-upload-line" },
  { label: "数据清洗", type: "process" as NodeTypeName, icon: "ri:filter-3-line" },
  { label: "数据转换", type: "process" as NodeTypeName, icon: "ri:exchange-line" },
  { label: "条件判断", type: "condition" as NodeTypeName, icon: "ri:git-branch-line" },
  { label: "消息队列", type: "output" as NodeTypeName, icon: "ri:mail-send-line" },
  { label: "存储输出", type: "output" as NodeTypeName, icon: "ri:save-line" },
];

const selectedNodeInfo = ref<{ id: string; label: string } | null>(null);

const handleNodeCreated = (node: BaseNode) => {
  ElMessage.success(`创建节点: ${node.label}`);
};

const handleNodeSelected = (node: BaseNode | null) => {
  if (node) {
    selectedNodeInfo.value = { id: node.id, label: node.label };
  } else {
    selectedNodeInfo.value = null;
  }
};

// =============== API 方法 ===============
const apiEditorRef = ref<InstanceType<typeof ScReteEditor>>();
const apiData = ref<EditorData>({
  nodes: [],
  connections: [],
});

const apiAddInputNode = async () => {
  const node = await apiEditorRef.value?.addNode("input", "输入节点", { 
    x: Math.random() * 300 + 50, 
    y: Math.random() * 200 + 50 
  });
  if (node) {
    ElMessage.success(`添加节点: ${node.label}`);
  }
};

const apiAddProcessNode = async () => {
  const node = await apiEditorRef.value?.addNode("process", "处理节点", { 
    x: Math.random() * 300 + 200, 
    y: Math.random() * 200 + 50 
  });
  if (node) {
    ElMessage.success(`添加节点: ${node.label}`);
  }
};

const apiAddOutputNode = async () => {
  const node = await apiEditorRef.value?.addNode("output", "输出节点", { 
    x: Math.random() * 300 + 400, 
    y: Math.random() * 200 + 50 
  });
  if (node) {
    ElMessage.success(`添加节点: ${node.label}`);
  }
};

const apiArrange = async () => {
  await apiEditorRef.value?.arrange();
};

const apiZoomToFit = () => {
  apiEditorRef.value?.zoomToFit();
};

const apiSetZoom = (zoom: number) => {
  apiEditorRef.value?.setZoom(zoom);
};

const apiClear = async () => {
  await apiEditorRef.value?.clear();
};

// =============== Tab 状态 ===============
const activeTab = ref("basic");
const activeCodeCollapse = ref(["basic-code"]);

// =============== 代码示例 ===============
const basicCodeExample = `<template>
  <ScReteEditor
    v-model="editorData"
    :show-toolbar="true"
    :show-node-panel="true"
    :show-property-panel="true"
    :minimap="true"
    @data-changed="onDataChange"
  />
</template>

<script setup>
import { ref } from 'vue';
import { ScReteEditor, type EditorData } from '@repo/components';

const editorData = ref<EditorData>({
  nodes: [],
  connections: []
});

const onDataChange = (data: EditorData) => {
  console.log('数据变化:', data);
};
<\/script>`;

const dataFormatExample = `// EditorData 数据格式
interface EditorData {
  nodes: Array<{
    id: string;           // 节点唯一 ID
    type: NodeTypeName;   // 'input' | 'output' | 'process' | 'condition' | 'merge' | 'delay'
    label: string;        // 节点显示名称
    position: {           // 节点位置
      x: number;
      y: number;
    };
    controls?: Record<string, any>;  // 节点控件值
  }>;
  connections: Array<{
    sourceId: string;      // 源节点 ID
    sourceOutput: string;  // 源输出端口: 'output' | 'true' | 'false'
    targetId: string;      // 目标节点 ID
    targetInput: string;   // 目标输入端口: 'input' | 'input1' | 'input2'
  }>;
}

// 示例数据
const data: EditorData = {
  nodes: [
    { id: 'node_1', type: 'input', label: '数据源', position: { x: 100, y: 100 } },
    { id: 'node_2', type: 'process', label: '处理', position: { x: 350, y: 100 } },
    { id: 'node_3', type: 'output', label: '输出', position: { x: 600, y: 100 } }
  ],
  connections: [
    { sourceId: 'node_1', sourceOutput: 'output', targetId: 'node_2', targetInput: 'input' },
    { sourceId: 'node_2', sourceOutput: 'output', targetId: 'node_3', targetInput: 'input' }
  ]
};`;

const apiCodeExample = `<template>
  <ScReteEditor ref="editorRef" v-model="data" />
  <button @click="handleAddNode">添加节点</button>
</template>

<script setup>
import { ref } from 'vue';
import { ScReteEditor } from '@repo/components';

const editorRef = ref<InstanceType<typeof ScReteEditor>>();
const data = ref({ nodes: [], connections: [] });

// 添加节点
const handleAddNode = async () => {
  await editorRef.value?.addNode('process', '新节点', { x: 200, y: 100 });
};

// 获取数据
const handleGetData = () => {
  const data = editorRef.value?.getData();
  console.log(data);
};

// 加载数据
const handleLoadData = async () => {
  await editorRef.value?.loadData({
    nodes: [...],
    connections: [...]
  });
};

// 清空
const handleClear = async () => {
  await editorRef.value?.clear();
};

// 自动排列
const handleArrange = async () => {
  await editorRef.value?.arrange();
};

// 缩放
editorRef.value?.setZoom(1.5);  // 150%
editorRef.value?.zoomToFit();    // 适应画布
<\/script>`;

const customNodeCodeExample = `<template>
  <ScReteEditor
    v-model="data"
    :node-menu-items="nodeMenuItems"
  />
</template>

<script setup>
import { ref } from 'vue';
import { ScReteEditor, type NodeTypeName } from '@repo/components';

const data = ref({ nodes: [], connections: [] });

// 自定义节点菜单
const nodeMenuItems = [
  { label: '数据库', type: 'input' as NodeTypeName, icon: 'ri:database-2-line' },
  { label: 'API接口', type: 'input' as NodeTypeName, icon: 'ri:cloud-line' },
  { label: '数据清洗', type: 'process' as NodeTypeName, icon: 'ri:filter-3-line' },
  { label: '条件判断', type: 'condition' as NodeTypeName, icon: 'ri:git-branch-line' },
  { label: '消息队列', type: 'output' as NodeTypeName, icon: 'ri:mail-send-line' },
];
<\/script>`;
</script>

<style scoped lang="scss">

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  }
}



.modern-bg {
  position: relative;
  overflow: hidden;

  // 渐变背景
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}


.rete-editor-example {
  padding: 20px;
  background: var(--el-bg-color);
  min-height: 100vh;

  .page-header {
    margin-bottom: 20px;

    h2 {
      margin: 0 0 8px;
      font-size: 24px;
      font-weight: 600;
    }

    .description {
      color: var(--el-text-color-secondary);
      margin: 0;
    }
  }

  .example-tabs {
    background: var(--el-bg-color);
  }

  .example-section {
    h3 {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 500;
    }

    > p {
      color: var(--el-text-color-secondary);
      margin: 0 0 16px;
    }
  }

  .editor-container {
    height: 500px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 16px;
  }

  .example-actions {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }

  .api-actions {
    margin-top: 16px;
  }

  .json-preview {
    background: var(--el-fill-color-light);
    padding: 12px;
    border-radius: 6px;
    font-size: 12px;
    max-height: 300px;
    overflow: auto;
    margin: 0;
  }

  .code-block {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 16px;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.6;
    overflow-x: auto;
    margin: 0;
  }

  .selected-node-info {
    margin-top: 16px;
  }
}


// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>
