# ReGraph 关系图组件（基于 AntV X6）

基于 [`@antv/x6`](https://x6.antv.antgroup.com/) 封装的关系图系列组件，参考官方
[agent-flow 实践示例](https://x6.antv.antgroup.com/examples/showcase/practices/#agentFlow)
实现节点调色板、端口连线与工具栏能力。

支持力导向图、思维导图、关系图、组织架构、股权结构、网络拓扑、业务流程、图编辑器、3D 关系图等场景。

> 注意：2D 组件（`ReGraph` 及 `ReGraph*` 系列）已全部从 `@relation-graph/vue3` 迁移到 `@antv/x6`。
> 数据契约与 API 做了对齐简化：`lines` 兼容为 `edges` 的别名；`node-click` 等事件改为原生 `MouseEvent`。

## 组件清单

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
| `ReGraph3D`       | `@repo/ui/re-graph-3d`          | 3D 力导向  | 知识图谱 / 网络拓扑的 3D 可视化（独立技术栈：three.js + d3-force） |

> 7 个 2D 模式组件共享 props / events / slots API，区别仅在默认布局与节点样式调优。
> `ReGraph3D` 不依赖 `@antv/x6`。

## 安装

```ts
// 直接按子路径使用
import ReGraphForce from "@repo/ui/re-graph-force";
import ReGraph3D from "@repo/ui/re-graph-3d";

// 或全局注册
import { installUi } from "@repo/ui";
await installUi(app, { components: ["ReGraphForce", "ReGraph3D"] });
```

## API 概览

所有 `ReGraph*` 组件共享同一套接口：

### Props

| 字段          | 类型                          | 默认值   | 说明                                           |
| ------------- | ----------------------------- | -------- | ---------------------------------------------- |
| `data`        | `ReGraphData`                 | —        | 节点/连线数据（与 `nodes`/`edges` 二选一）     |
| `nodes`       | `ReGraphNode[]`               | —        | 节点列表（简化用法）                           |
| `edges`       | `ReGraphEdge[]`               | —        | 连线列表（简化用法）                           |
| `lines`       | `ReGraphEdge[]`               | —        | 连线列表别名（兼容旧 API，等价于 `edges`）     |
| `options`     | `Record<string, unknown>`     | —        | 预留配置（当前透传，不影响布局）               |
| `height`      | `string \| number`            | `"100%"` | 容器高度                                       |
| `width`       | `string \| number`            | `"100%"` | 容器宽度                                       |
| `editable`    | `boolean`                     | `false`  | 是否启用编辑模式（显示调色板、允许连线）       |
| `palette`     | `boolean`                     | `false`  | 强制显示节点调色板（与 editable 独立）         |
| `debug`       | `boolean`                     | `false`  | 是否输出调试信息                               |

`ReGraph`（通用组件）额外提供 `mode` / `showToolbar` / `showMiniView`(`showMinimap`) / `showSearch` / `toolbar` / `fetchExpand` / `enableHistory` / `nodeTypes` 等高级 props。

### 数据契约

```ts
interface ReGraphNode {
  id: string;
  text?: string;
  type?: string;      // 节点类型：start/end/llm/knowledge/tool/condition/code/http/input/output/...
  x?: number; y?: number;
  width?: number; height?: number;
  locked?: boolean; hidden?: boolean;
  data?: Record<string, unknown>;
}
interface ReGraphEdge {
  id?: string;
  from: string;       // 起点节点 id
  to: string;         // 终点节点 id
  text?: string;      // 连线标签
  fromPort?: string;  // 起点锚点：top/right/bottom/left
  toPort?: string;    // 终点锚点
  data?: Record<string, unknown>;
}
interface ReGraphData {
  rootId?: string;
  nodes: ReGraphNode[];
  edges: ReGraphEdge[];
}
```

### Events

| 事件名            | 参数                                  | 说明                 |
| ----------------- | ------------------------------------- | -------------------- |
| `ready`           | `(instance: X6GraphEngine)`           | 图实例初始化完成     |
| `node-click`      | `(node, ev: MouseEvent)`              | 节点点击             |
| `node-dblclick`   | `(node, ev: MouseEvent)`              | 节点双击（触发扩线） |
| `node-contextmenu`| `(node, ev: MouseEvent)`              | 节点右键             |
| `edge-click`      | `(edge, ev: MouseEvent)`              | 连线点击             |
| `layout-change`   | `(mode)`                              | 布局切换（`ReGraph` 专属） |
| `search-change`   | `(keyword, matched)`                  | 搜索关键词变化       |
| `expand`          | `(node, payload)`                     | 右键扩线完成         |
| `node-menu`       | `(action, node)`                      | 右键菜单动作         |

### Slots

| 插槽名     | 作用域                       | 说明             |
| ---------- | ---------------------------- | ---------------- |
| `toolbar`  | `{ engine }`                 | 工具栏自定义扩展 |
| `status`   | `{ data, engine }`           | 底部信息栏扩展   |

> 原 relation-graph 的 `#node` / `#view` 插槽由 X6 自定义节点形状取代：
> 节点外观通过 `type` + `nodeTypes` prop 配置；如需完全自定义渲染节点，可后续接入 `@antv/x6-vue-shape`。

## 主题

通过 `@repo/config` 的 `themeId` 切换：

- `default`（默认）：完整功能封装，提供工具栏 / 小地图 / 右键菜单
- `koi`：精简视图，仅搜索栏 + 轻交互，适合仪表盘

组件内部使用 `defineThemeComponent` 动态加载对应主题实现，未选中的主题不进产物。

## 完整功能说明（`ReGraph` default 主题）

`ReGraph` default 主题在 X6 基础上内置了完整业务功能：

| 功能                | 实现方式                                                 |
| ------------------- | -------------------------------------------------------- |
| 多模式布局          | `mode` prop（force / mind / tree / circle / center / fixed / relation） |
| 节点调色板          | 左侧 Stencil，拖拽生成节点（editable 模式）             |
| 端口连线            | 从节点锚点拖拽到另一节点生成有向边                       |
| 搜索框（高亮模式）  | 顶部工具栏输入框，模糊匹配 + 大小写不敏感 + 多关键词     |
| 搜索框（路径模式）  | 工具栏切换「高亮 / 路径」按钮，两两计算最短路径并高亮   |
| 节点锁定 / 解锁     | 右键菜单 + 锁定节点不可拖拽                              |
| 节点隐藏 / 显示     | 右键菜单                                                 |
| 节点删除            | 右键菜单 + 二次确认                                      |
| 历史回溯            | 工具栏「撤销 / 重做」按钮（基于 History 插件）           |
| 导入 / 导出 JSON    | 工具栏「导入 / 导出」按钮                                |
| PNG 导出            | 工具栏「PNG」按钮（基于 Export 插件）                    |
| 缩放 / 适配 / 重排  | 工具栏按钮                                               |
| 缩略图              | 右下角 Minimap（showMinimap）                            |
| 底部信息栏          | 显示节点数 / 连线数 / 匹配数 / 加载数                    |

### `fetchExpand` 用法（agent-flow 懒加载扩线）

```ts
import ReGraph from "@repo/ui/re-graph";

const fetchExpand: import("@repo/ui/re-graph").ReGraphExpandFetcher = async (nodeId) => {
  const resp = await fetch(`/api/node/${nodeId}/expand`);
  const data = await resp.json();
  return { nodes: data.nodes, edges: data.edges };
};
```

### 工具栏开关

通过 `toolbar` prop 关闭不需要的工具栏项：

```vue
<ReGraph :data="data" :toolbar="{ search: true, history: false, importExport: false }" />
```

## 实战示例

### 示例 1：基础力导向图 + 工具栏

```vue
<script setup lang="ts">
import { ref } from "vue";
import ReGraphForce from "@repo/ui/re-graph-force";

const data = ref({
  nodes: [
    { id: "1", text: "Alice", type: "llm" },
    { id: "2", text: "Bob", type: "tool" },
    { id: "3", text: "Carol", type: "knowledge" },
  ],
  edges: [
    { from: "1", to: "2", text: "调用" },
    { from: "1", to: "3", text: "检索" },
  ],
});
</script>

<template>
  <div style="width: 100%; height: 600px;">
    <ReGraphForce :data="data" :show-toolbar="true" />
  </div>
</template>
```

### 示例 2：agent-flow 编排（可编辑 + 调色板）

```vue
<script setup lang="ts">
import { ref } from "vue";
import ReGraph from "@repo/ui/re-graph";

const data = ref({
  nodes: [{ id: "start", text: "开始", type: "start", x: 80, y: 40 }],
  edges: [],
});
</script>

<template>
  <div style="width: 100%; height: 700px;">
    <ReGraph mode="fixed" :data="data" :editable="true" :show-minimap="true" />
  </div>
</template>
```

从左侧调色板拖拽「大模型 / 工具 / 条件」等节点到画布，再从节点锚点拖出连线即可编排流程。

### 示例 3：组织架构树

```vue
<script setup lang="ts">
import { ref } from "vue";
import ReGraphTree from "@repo/ui/re-graph-tree";

const data = ref({
  rootId: "0",
  nodes: [
    { id: "0", text: "总公司" },
    { id: "1", text: "技术部" },
    { id: "2", text: "销售部" },
    { id: "3", text: "前端组" },
    { id: "4", text: "后端组" },
  ],
  edges: [
    { from: "0", to: "1" },
    { from: "0", to: "2" },
    { from: "1", to: "3" },
    { from: "1", to: "4" },
  ],
});
</script>

<template>
  <ReGraphTree :data="data" />
</template>
```

### 示例 4：固定坐标画板（数据库外键关系图等）

```vue
<script setup lang="ts">
import ReGraphFixed from "@repo/ui/re-graph-fixed";

const data = {
  nodes: [
    { id: "user", text: "SYS_USER", x: 0, y: 0, width: 200, height: 120 },
    { id: "dept", text: "SYS_DEPT", x: 360, y: 0, width: 200, height: 100 },
  ],
  edges: [{ from: "user", to: "dept", fromPort: "right", toPort: "left", text: "dept_id" }],
};
</script>

<template>
  <ReGraphFixed :data="data" />
</template>
```

### 示例 5：通过 @ready 获取引擎实例操作图

```vue
<script setup lang="ts">
import { ref } from "vue";
import type { X6GraphEngine } from "@repo/ui/re-graph";
import ReGraph from "@repo/ui/re-graph";

const engine = ref<X6GraphEngine | null>(null);
function onReady(e: X6GraphEngine) {
  engine.value = e;
}
function addNode() {
  engine.value?.addNode({ id: `n-${Date.now()}`, text: "新节点", type: "tool" });
}
function fit() {
  engine.value?.zoomToFit();
  engine.value?.centerContent();
}
</script>

<template>
  <div class="toolbar">
    <button @click="addNode">新增节点</button>
    <button @click="fit">适配画布</button>
  </div>
  <ReGraph :editable="true" @ready="onReady" />
</template>
```

## 依赖

- `@antv/x6` ^2.18.x（2D 组件内核）
- `@antv/x6-plugin-stencil` / `-snapline` / `-selection` / `-keyboard` / `-clipboard` / `-history` / `-minimap` / `-export`
- `d3-force` ^3.0.x（force 布局）
- `three` ^0.185.x + `d3-force`（仅 `ReGraph3D`）
- `vue` ^3.5.x

## 更多信息

- X6 官方文档：https://x6.antv.antgroup.com/
- agent-flow 示例：https://x6.antv.antgroup.com/examples/showcase/practices/#agentFlow
- X6 API：https://x6.antv.antgroup.com/api
