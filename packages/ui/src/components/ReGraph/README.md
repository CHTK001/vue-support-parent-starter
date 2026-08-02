# ReGraph 关系图组件

基于 [`@relation-graph/vue3`](https://www.relation-graph.com/zh) 封装的关系图系列组件。

支持力导向图、思维导图、关系图、组织架构、股权结构、网络拓扑、业务流程、图编辑器等场景。

## 组件清单

每个布局模式都是一个独立子组件，按需引入、按需打包：

| 组件              | 子路径                          | 布局模式   | 典型场景                                |
| ----------------- | ------------------------------- | ---------- | --------------------------------------- |
| `ReGraph`         | `@repo/ui/re-graph`             | 通用 + `mode` 参数 | 任意场景（用 mode 切换布局）        |
| `ReGraphForce`    | `@repo/ui/re-graph-force`       | `force`    | 力导向图 / 社交网络 / 知识图谱          |
| `ReGraphMind`     | `@repo/ui/re-graph-mind`        | `mind`     | 思维导图 / 发散式结构                   |
| `ReGraphTree`     | `@repo/ui/re-graph-tree`        | `tree`     | 组织架构 / 分类树                       |
| `ReGraphCircle`   | `@repo/ui/re-graph-circle`      | `circle`   | 环形布局 / 放射状展示                   |
| `ReGraphCenter`   | `@repo/ui/re-graph-center`      | `center`   | 中心布局 / 关系图                       |
| `ReGraphFixed`    | `@repo/ui/re-graph-fixed`       | `fixed`    | 固定坐标布局 / 自由画板                 |
| `ReGraphRelation` | `@repo/ui/re-graph-relation`    | `relation` | 通用关系图（默认 = center 布局）        |

> 7 个模式组件共享 props / events / slots API，区别仅在默认的 layout 配置与节点样式调优（force 节点更大、tree 用直角线、mind 用 mindmap 布局等）。

## 安装

```ts
// 直接按子路径使用
import ReGraphForce from "@repo/ui/re-graph-force";

// 或全局注册
import { installUi } from "@repo/ui";
await installUi(app, { components: ["ReGraphForce", "ReGraphMind"] });
```

## API 概览

所有 `ReGraph*` 组件共享同一套接口：

### Props

| 字段       | 类型                          | 默认值   | 说明                                         |
| ---------- | ----------------------------- | -------- | -------------------------------------------- |
| `data`     | `RGJsonData`                  | —        | 节点/连线数据（与 `nodes`/`lines` 二选一）   |
| `nodes`    | `JsonNode[]`                  | —        | 节点列表（简化用法）                         |
| `lines`    | `JsonLine[]`                  | —        | 连线列表（简化用法）                         |
| `options`  | `RGOptions`                   | —        | 图配置（与组件默认 options 合并）            |
| `height`   | `string \| number`            | `"100%"` | 容器高度                                     |
| `width`    | `string \| number`            | `"100%"` | 容器宽度                                     |
| `editable` | `boolean`                     | `false`  | 是否启用编辑模式                             |
| `debug`    | `boolean`                     | `false`  | 是否输出调试信息                             |

`ReGraph`（通用组件）额外提供 `mode` 与 `showToolbar` / `showMiniView` props。

### Events

| 事件名       | 参数                         | 说明                 |
| ------------ | ---------------------------- | -------------------- |
| `ready`      | `(instance)`                 | 图实例初始化完成     |
| `node-click` | `(node, event)`              | 节点点击             |
| `line-click` | `(line, link, event)`        | 连线点击             |

### Slots

| 插槽名     | 作用域                          | 说明             |
| ---------- | ------------------------------- | ---------------- |
| `node`     | `{ node, checked, dragging }`   | 自定义节点渲染   |
| `view`     | —                               | 视图层自定义     |
| `toolbar`  | `{ instance }`                  | 工具栏自定义     |

## 主题

通过 `@repo/config` 的 `themeId` 切换：

- `default`（默认）：完整功能封装，提供工具栏/视图插槽
- `koi`：精简视图，专注核心渲染，适合仪表盘场景

组件内部使用 `defineThemeComponent` 动态加载对应主题实现，未选中的主题不进产物。

## 依赖

- `@relation-graph/vue3` ^3.0.x
- `vue` ^3.5.x

## 更多信息

- 官方文档：https://www.relation-graph.com/zh/docs
- 在线示例：https://www.relation-graph.com/zh/examples
- API 参考：https://www.relation-graph.com/zh/docs/api

---

## 实战示例（来自官方示例库，适配到 ReGraph 组件）

下面这些示例都来自 [relation-graph 官方示例库](https://www.relation-graph.com/zh/examples)，展示了使用 `ReGraph*` 组件时的常见模式。所有示例都使用 `useGraphInstance` / `@ready` 等钩子获取 `instance`，再调用 `instance` 上的方法。

> 以下代码片段省略了 `import`、样式等样板，聚焦最关键的差异点。

### 示例 1：基础自定义节点与缩略图（中心布局 + 小地图）

源自 [基础自定义节点与缩略图](https://www.relation-graph.com/zh/examples/basic-custom-node-and-minimap)。使用 `ReGraphCenter`，搭配 `RGMiniView` 实现常驻总览。

```vue
<script setup lang="ts">
import { ref } from "vue";
import { RGMiniView } from "@relation-graph/vue3";
import ReGraphCenter from "@repo/ui/re-graph-center";

const graphData = ref<RGJsonData>({
  rootId: "2",
  nodes: [
    { id: "2", text: "Initrode", width: 100, height: 100, data: { myicon: "delivery_truck" } },
    { id: "1", text: "Paper Street Soap Co.", data: { myicon: "fries" } },
    { id: "3", text: "Cyberdyne Systems", data: { myicon: "football" } },
    // ...省略其他节点
  ],
  lines: [
    { from: "7", to: "71", text: "Invest" },
    { from: "1", to: "2", text: "Invest" },
    // ...省略其他连线
  ],
});

function onReady(instance: any) {
  instance.setJsonData(graphData.value);
  instance.moveToCenter();
  instance.zoomToFit();
}
</script>

<template>
  <div style="width: 100%; height: 600px;">
    <ReGraphCenter :data="graphData" @ready="onReady">
      <template #node="{ node }">
        <div class="my-node h-full w-full rounded-full flex items-center justify-center shadow-md">
          <strong>{{ node.text }}</strong>
        </div>
      </template>

      <template #view>
        <RGMiniView />
      </template>
    </ReGraphCenter>
  </div>
</template>
```

### 示例 2：思维导图（mindmap 布局）

源自 [节点样式实现方式](https://www.relation-graph.com/zh/examples/node-styling-techniques) 系列。

```vue
<script setup lang="ts">
import { ref } from "vue";
import ReGraphMind from "@repo/ui/re-graph-mind";

const mindData = ref({
  rootId: "root",
  nodes: [
    { id: "root", text: "中心主题", width: 120, height: 40 },
    { id: "a", text: "分支 A" },
    { id: "b", text: "分支 B" },
    { id: "c", text: "分支 C" },
    { id: "a1", text: "子 A1" },
    { id: "a2", text: "子 A2" },
  ],
  lines: [
    { from: "root", to: "a", text: "" },
    { from: "root", to: "b", text: "" },
    { from: "root", to: "c", text: "" },
    { from: "a", to: "a1", text: "" },
    { from: "a", to: "a2", text: "" },
  ],
});
</script>

<template>
  <ReGraphMind :data="mindData" :options="{ defaultNodeShape: 1 }" />
</template>
```

### 示例 3：组织架构树（树布局 + 层级卡片）

源自 [产业链层级图谱](https://www.relation-graph.com/zh/examples/industry-chain-hierarchy-map)。核心技巧：用 `node.lot.level` 派生样式。

```vue
<script setup lang="ts">
import { ref } from "vue";
import ReGraphTree from "@repo/ui/re-graph-tree";

const treeData = ref({
  rootId: "0",
  nodes: [
    { id: "0", text: "总公司" },
    { id: "1", text: "技术部" },
    { id: "2", text: "销售部" },
    { id: "3", text: "前端组" },
    { id: "4", text: "后端组" },
    { id: "5", text: "国内销售" },
    { id: "6", text: "海外销售" },
  ],
  lines: [
    { id: "l0", text: "", from: "0", to: "1" },
    { id: "l1", text: "", from: "0", to: "2" },
    { id: "l2", text: "", from: "1", to: "3" },
    { id: "l3", text: "", from: "1", to: "4" },
    { id: "l4", text: "", from: "2", to: "5" },
    { id: "l5", text: "", from: "2", to: "6" },
  ],
});

const levelColors = ["#5b05f1", "#FD8B37", "#9b9903", "#247c02"];

async function onReady(instance: any) {
  instance.loading();
  await instance.setJsonData(treeData.value);
  await instance.openByLevel(2);
  // 给节点染色
  const nodes = instance.getNodes();
  nodes.forEach((node: any) => {
    const level = Math.abs(node.lot?.level || 0);
    instance.updateNode(node, {
      color: levelColors[level] || "#247c02",
      className: `org-node-level-${level}`,
    });
  });
  await instance.doLayout();
  instance.moveToCenter();
  instance.zoomToFit();
  instance.clearLoading();
}
</script>

<template>
  <div style="width: 100%; height: 700px;">
    <ReGraphTree
      :data="treeData"
      :options="{
        layout: { layoutName: 'tree', from: 'top' },
        defaultLineShape: 2,
        reLayoutWhenExpandedOrCollapsed: true,
      }"
      @ready="onReady"
    >
      <template #node="{ node }">
        <div :class="`org-node org-node-level-${Math.abs(node.lot?.level || 0)}`">
          <div class="org-node__header">
            {{ levelLabels[Math.abs(node.lot?.level || 0)] }}
          </div>
          <div class="org-node__body">{{ node.text }}</div>
        </div>
      </template>
    </ReGraphTree>
  </div>
</template>

<style scoped>
.org-node {
  width: 160px;
  border-radius: 5px;
  background-color: #fff;
  border: var(--rg-node-color) solid 1px;
}
.org-node__header {
  padding: 4px 8px;
  background-color: var(--rg-node-color);
  color: #fff;
  font-size: 11px;
}
.org-node__body {
  padding: 6px 8px;
  color: var(--rg-node-color);
}
</style>
```

### 示例 4：力导向图运行时调参

源自 [力导向布局运行时参数控制](https://www.relation-graph.com/zh/examples/force-layout-runtime-parameter-controls)。核心技巧：**不要重建实例**，而是直接拿到 layoutor 实例调用 `updateOptions` 实时修改。

```vue
<script setup lang="ts">
import { ref } from "vue";
import { RGLayouts } from "@relation-graph/vue3";
import ReGraphForce from "@repo/ui/re-graph-force";

const data = ref(/* ...节点和连线... */);

// 力参数
const nodeRepulsion = ref(1);
const lineElastic = ref(1);
const friction = ref(0.6);

function onReady(instance: any) {
  instance.setJsonData(data.value);
  instance.moveToCenter();
  instance.zoomToFit();
}

// 实时调参：直接修改当前 ForceLayout 实例
async function updateForceOptions(instance: any) {
  const forceLayout = instance.layoutor as InstanceType<typeof RGLayouts.ForceLayout>;
  if (!forceLayout) return;
  forceLayout.updateOptions({
    force_node_repulsion: nodeRepulsion.value,
    force_line_elastic: lineElastic.value,
    force_friction: friction.value,
  });
}
</script>

<template>
  <div class="controls">
    <label>节点斥力 <input type="range" min="0.2" max="3" step="0.1"
      v-model.number="nodeRepulsion"
      @input="updateForceOptions(instanceRef)" /></label>
    <label>连线弹性 <input type="range" min="0.2" max="3" step="0.1"
      v-model.number="lineElastic"
      @input="updateForceOptions(instanceRef)" /></label>
    <label>摩擦 <input type="range" min="0.1" max="1" step="0.05"
      v-model.number="friction"
      @input="updateForceOptions(instanceRef)" /></label>
  </div>

  <ReGraphForce :data="data" :options="{ layout: { layoutName: 'force' } }" @ready="onReady" />
</template>
```

### 示例 5：环形 / 放射布局

源自 [中心布局样式控制](https://www.relation-graph.com/zh/examples/center-layout-style-controls)。`ReGraphCircle` 默认是环形布局，可通过 `options.layout` 切换为中心布局。

```vue
<template>
  <ReGraphCircle
    :data="data"
    :options="{
      layout: { layoutName: 'circle' },
      defaultNodeShape: 0,
      defaultLineShape: 6,
      defaultLineTextOnPath: true,
    }"
  />
</template>
```

### 示例 6：固定坐标 / 自由画板

源自 [企业关系四象限固定布局](https://www.relation-graph.com/zh/examples/enterprise-quadrant-fixed-layout)。使用 `fixed` 布局，每个节点在数据中指定 `x`、`y`。

```vue
<script setup lang="ts">
import ReGraphFixed from "@repo/ui/re-graph-fixed";

const data = {
  rootId: "",
  nodes: [
    { id: "q1", text: "战略合作", x: -300, y: -200, width: 120, height: 60 },
    { id: "q2", text: "控股", x: 300, y: -200, width: 120, height: 60 },
    { id: "q3", text: "参股", x: -300, y: 200, width: 120, height: 60 },
    { id: "q4", text: "拟合作", x: 300, y: 200, width: 120, height: 60 },
    { id: "center", text: "本公司", x: 0, y: 0, width: 140, height: 70 },
  ],
  lines: [
    { from: "center", to: "q1" },
    { from: "center", to: "q2" },
    { from: "center", to: "q3" },
    { from: "center", to: "q4" },
  ],
};
</script>

<template>
  <ReGraphFixed :data="data" />
</template>
```

### 示例 7：图编辑器模式

源自 [PCB 元件连线编辑器](https://www.relation-graph.com/zh/examples/pcb-component-wiring-editor) / [系统架构图编辑器](https://www.relation-graph.com/zh/examples/system-architecture-diagram-editor)。将 `editable` 设为 `true`，并通过 `useRelationGraph` 暴露的编辑 API 操作图谱。

```vue
<script setup lang="ts">
import { ref } from "vue";
import ReGraphRelation from "@repo/ui/re-graph-relation";

const data = ref({ rootId: "n1", nodes: [{ id: "n1", text: "开始" }], lines: [] });
let graphInstance: any = null;

async function onReady(instance: any) {
  graphInstance = instance;
  await instance.setJsonData(data.value);
}

function addNode() {
  if (!graphInstance) return;
  graphInstance.addNodes([{ id: `n-${Date.now()}`, text: "新节点" }]);
}

function addLine(fromId: string, toId: string) {
  graphInstance?.addLines([{ from: fromId, to: toId }]);
}

function fitView() {
  graphInstance?.zoomToFit();
  graphInstance?.moveToCenter();
}
</script>

<template>
  <div class="toolbar">
    <el-button @click="addNode">新增节点</el-button>
    <el-button @click="fitView">适配画布</el-button>
  </div>

  <ReGraphRelation
    :data="data"
    :editable="true"
    @ready="onReady"
  />
</template>
```

### 示例 8：截图导出

源自 [导出完整图谱图片](https://www.relation-graph.com/zh/examples/export-full-graph-image)。通过 `instance.prepareForImageGeneration()` → `domToImage` → `restoreAfterImageGeneration()` 完成。

```ts
import { domToImage } from "@repo/utils"; // 适配的工具方法

async function exportImage(instance: any) {
  const canvasDom = await instance.prepareForImageGeneration();
  const bg = instance.getOptions().backgroundColor || "#ffffff";
  const blob = await domToImage(canvasDom, { backgroundColor: bg });
  if (blob) downloadBlob(blob, "graph.png");
  await instance.restoreAfterImageGeneration();
}
```

> 完整的 `domToImage` / `downloadBlob` 实现见官方示例 `simples-common-components/domToImageByModernScreenshot.ts`。

### 示例 9：数据库表外键关系图（固定布局 + 列级端点连线）

源自 [数据库表外键关系图](https://www.relation-graph.com/zh/examples/database-foreign-key-diagram)。**关键技术：把关系连到字段行，而不是整个节点。** 实现路径：

1. 用固定坐标（`x` / `y`）摆放表卡片
2. 把每张表的列数据挂到 `node.data.columns`
3. 用 `RGConnectTarget` 把每个列名注册成连线端点
4. 用 `fakeLines` + 列级端点 id 画外键关系曲线

```vue
<script setup lang="ts">
import { computed, ref } from "vue";
import {
  RGConnectTarget,
  RGJunctionPoint,
  RGLineShape,
  RGNodeShape,
} from "@relation-graph/vue3";
import ReGraphFixed from "@repo/ui/re-graph-fixed";

interface Column {
  tableName: string;
  columnName: string;
  dataType: string;
  comment?: string;
  primaryKey?: boolean;
}
interface Relation {
  sourceTableName: string;
  sourceColumnName: string;
  targetTableName: string;
  targetColumnName: string;
  type: "ONE_TO_ONE" | "ONE_TO_MANY";
}

// 1. 表元数据（实际可来自 DB schema / ORM / API）
const tables = ref([
  { tableName: "SYS_USER", tableComents: "用户", x: 0,    y: 0   },
  { tableName: "SYS_DEPT", tableComents: "部门", x: 500,  y: 0   },
  { tableName: "SYS_ROLE", tableComents: "角色", x: 0,    y: 500 },
  { tableName: "SYS_USER_ROLE", tableComents: "用户角色", x: 500, y: 500 },
]);

const tableCols = ref<Column[]>([
  { tableName: "SYS_USER", columnName: "id",       dataType: "bigint", primaryKey: true },
  { tableName: "SYS_USER", columnName: "name",     dataType: "varchar(50)" },
  { tableName: "SYS_USER", columnName: "dept_id",  dataType: "bigint",  comment: "所属部门" },
  { tableName: "SYS_DEPT", columnName: "id",       dataType: "bigint", primaryKey: true },
  { tableName: "SYS_DEPT", columnName: "name",     dataType: "varchar(50)" },
  { tableName: "SYS_ROLE", columnName: "id",       dataType: "bigint", primaryKey: true },
  { tableName: "SYS_ROLE", columnName: "code",     dataType: "varchar(50)" },
  { tableName: "SYS_USER_ROLE", columnName: "user_id", dataType: "bigint", comment: "用户" },
  { tableName: "SYS_USER_ROLE", columnName: "role_id", dataType: "bigint", comment: "角色" },
]);

const columnRelations = ref<Relation[]>([
  { sourceTableName: "SYS_USER", sourceColumnName: "dept_id",
    targetTableName: "SYS_DEPT", targetColumnName: "id", type: "ONE_TO_MANY" },
  { sourceTableName: "SYS_USER_ROLE", sourceColumnName: "user_id",
    targetTableName: "SYS_USER",   targetColumnName: "id",    type: "ONE_TO_MANY" },
  { sourceTableName: "SYS_USER_ROLE", sourceColumnName: "role_id",
    targetTableName: "SYS_ROLE",   targetColumnName: "id",    type: "ONE_TO_MANY" },
]);

// 2. 把表 → 图节点，挂载 columns
const graphNodes = computed(() =>
  tables.value.map((t) => ({
    id: t.tableName,
    text: t.tableComents,
    x: t.x,
    y: t.y,
    nodeShape: RGNodeShape.rect,
    data: { columns: tableCols.value.filter((c) => c.tableName === t.tableName) },
  })),
);

// 3. 把关系 → fakeLines，端点指向列级 target
const fakeLines = computed(() =>
  columnRelations.value.map((rel, i) => ({
    id: `rel-${i}`,
    from: `col-${rel.sourceTableName}-${rel.sourceColumnName}`,
    to:   `col-${rel.targetTableName}-${rel.targetColumnName}`,
    color: rel.type === "ONE_TO_ONE" ? "rgba(29,169,245,0.76)" : "rgba(159,23,227,0.65)",
    fromJunctionPoint: RGJunctionPoint.left,
    toJunctionPoint:   RGJunctionPoint.lr,
    lineShape: RGLineShape.StandardCurve,
    lineWidth: 3,
  })),
);

const graphData = computed(() => ({
  nodes: graphNodes.value,
  lines: [],
  fakeLines: fakeLines.value,
}));

// 4. 固定布局 + 橙色卡片
const graphOptions = {
  defaultJunctionPoint: RGJunctionPoint.border,
  defaultNodeColor: "#f39930",
  defaultNodeBorderWidth: 0,
  defaultLineMarker: {
    markerWidth: 20,
    markerHeight: 20,
    refX: 3,
    refY: 3,
    viewBox: "0 0 6 6",
    data: "M 0 0, V 6, L 4 3, Z",
  },
  layout: { layoutName: "fixed" },
};

async function onReady(instance: any) {
  await instance.setJsonData(graphData.value);
  instance.moveToCenter();
  instance.zoomToFit();
}
</script>

<template>
  <div style="width: 100%; height: 800px;">
    <ReGraphFixed :data="graphData" :options="graphOptions" @ready="onReady">
      <!-- 5. 自定义节点：表卡片 + 列级端点 -->
      <template #node="{ node }">
        <div class="db-table">
          <div class="db-table__header">{{ node.text }}（{{ node.id }}）</div>
          <table class="db-table__cols">
            <tbody>
              <tr v-for="col in node.data.columns" :key="col.columnName">
                <td class="db-table__pk">{{ col.primaryKey ? "🔑" : "" }}</td>
                <td class="db-table__name">
                  <!-- 列名注册为连线端点，外键会精准连到这里 -->
                  <RGConnectTarget
                    :target-id="`col-${node.id}-${col.columnName}`"
                    :junction-point="RGJunctionPoint.lr"
                  >
                    <span>{{ col.columnName }}</span>
                  </RGConnectTarget>
                </td>
                <td class="db-table__type">{{ col.dataType }}</td>
                <td class="db-table__comment">{{ col.comment ?? "" }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </ReGraphFixed>
  </div>
</template>

<style scoped>
.db-table {
  width: 300px;
  background-color: #f39930;
  color: #fff;
  border-radius: 4px;
  overflow: hidden;
  font-size: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}
.db-table__header {
  padding: 6px 10px;
  font-weight: 600;
  background-color: rgba(0, 0, 0, 0.12);
}
.db-table__cols {
  width: 100%;
  background-color: #fff;
  color: #333;
  border-collapse: collapse;
}
.db-table__cols td {
  padding: 3px 6px;
  border-bottom: 1px solid #f0f0f0;
}
.db-table__pk { width: 18px; text-align: center; }
.db-table__name { font-weight: 500; }
.db-table__type { color: #888; font-family: monospace; font-size: 11px; }
.db-table__comment { color: #999; font-size: 11px; }
</style>
```

**关键点：**

- `ReGraphFixed` + `layout.layoutName = 'fixed'`，表位置由 `x` / `y` 决定
- 不使用普通 `lines`，改为 `fakeLines`，让外键曲线绕过卡片外缘
- 每个列名用 `RGConnectTarget` 暴露为端点，`targetId` 格式：`col-<table>-<column>`
- 节点 `data.columns` 用于渲染列表；不要把字段塞进 `node.text`，会和 `RGConnectTarget` 干扰

> 这套结构同样适用于：ORM 模型图、API schema 比对、ETL 字段映射、权限资源矩阵、数据血缘可视化等。

## 常见模式速查

| 模式             | 用法                                                                       |
| ---------------- | -------------------------------------------------------------------------- |
| 加载数据         | `instance.setJsonData(data)`                                               |
| 数据更新重绘     | `instance.refresh()` 或重新 `setJsonData`                                  |
| 添加节点/连线    | `instance.addNodes()` / `instance.addLines()`                              |
| 删除节点/连线    | `instance.removeNode()` / `instance.removeLine()`                          |
| 居中             | `instance.moveToCenter()`                                                  |
| 适配视图         | `instance.zoomToFit()`                                                     |
| 设置缩放         | `instance.setZoom(100)`                                                    |
| 加载占位         | `instance.loading()` ... `instance.clearLoading()`                         |
| 重新布局         | `instance.doLayout()`                                                      |
| 按层级展开       | `instance.openByLevel(level)`                                              |
| 折叠全部         | `instance.collapseAll()`                                                   |
| 展开全部         | `instance.expandAll()`                                                     |
| 截图导出         | `instance.prepareForImageGeneration()` + `restoreAfterImageGeneration()`   |
| 修改节点样式     | `instance.updateNode(node, { color, className })`                          |
| 强制重算布局     | `forceLayout.updateOptions(...)` （强类型 layoutor）                      |
| 获取所有节点     | `instance.getNodes()`                                                      |
| 搜索并定位       | `instance.focusNodeById(nodeId)`                                           |

## 更多信息

- 官方文档中心：https://www.relation-graph.com/zh/docs
- 完整 Vue3 示例项目：https://github.com/relation-graph/relation-graph-vue3-demo
- 全部 200+ 示例：https://www.relation-graph.com/zh/examples
- 配合 AI 自动生成代码：https://graph-pilot.com/zh/graphpilot
