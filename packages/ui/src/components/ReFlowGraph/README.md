# ReFlowGraph 流程设计器组件（基于 AntV X6）

面向"设计器"而非"查看器"的流程编排组件，交互对齐 spider-flow 的编辑器：
小图标节点 + 下方标签 + 正交彩色连线，节点/连线的业务参数全部由页面通过插槽提供，
组件本身不认识任何业务字段。

- 内核：`FlowGraphEngine`（`internals/engine.ts`），封装 `@antv/x6` 及其 snapline / selection /
  keyboard / clipboard / history / minimap / export 插件。
- 图形：`internals/shapes.ts` 只注册两个通用图形（`flow-node` / `flow-edge`），
  业务类型差异只体现在 attrs（图标 path、主色、虚实）与 data 上，**新增节点类型无需注册新图形**。
- 图标：`internals/icons.ts` 收录采集/调度平台常用语义图标，未命中的 type 走 `DEFAULT_FLOW_ICON`。

## 主题

| 主题        | 子路径                     | 形态                                                       |
| ----------- | -------------------------- | ---------------------------------------------------------- |
| `default`   | `@repo/ui/re-flow-graph`   | 完整设计器（调色板 + 画布 + 停靠属性面板）                 |
| `koi`       | 同上，按 `themeId` 自动解析 | `editable=false` 时是只读视图；打开后事件/插槽/实例方法全量透传给 default 外壳 |

## 安装

```ts
// 直接按子路径使用（推荐，按主题懒加载）
import ReFlowGraph from "@repo/ui/re-flow-graph";

// 或全局注册
import { installUi } from "@repo/ui";
await installUi(app, { components: ["ReFlowGraph"] });
```

## 数据契约

```ts
interface FlowGraphData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

interface FlowNode {
  id: string;
  type: string; // 对应 FlowNodeTypeDef.type，决定图标/主色
  label: string;
  x: number;
  y: number;
  data?: Record<string, unknown>; // 业务参数，组件不读
}

interface FlowEdge {
  id: string;
  from: string;
  to: string;
  fromPort?: "top" | "right" | "bottom" | "left";
  toPort?: "top" | "right" | "bottom" | "left";
  kind?: FlowEdgeKind; // normal 绿 / exception 红 / condition 蓝 / else 灰
  label?: string;
  transfer?: boolean; // false 时连线转虚线
  data?: Record<string, unknown>;
}

interface FlowNodeTypeDef {
  type: string;
  label: string;
  group?: string; // 调色板分组标题
  path?: string; // 自带 24×24 描边 path，覆盖内置图标
  color?: string; // 主色，缺省按 type 稳定取色
  tips?: string; // 悬浮提示
  fixed?: boolean; // true 时禁止删除
}
```

> `label` 只做显示。业务上需要持久化、但 X6 没有对应概念的字段（如流转条件、异常流向），
> 请放进 `data`，取数据时以 `data` 为准。

## Props

| 字段               | 类型                | 默认值        | 说明                                     |
| ------------------ | ------------------- | ------------- | ---------------------------------------- |
| `data`             | `FlowGraphData`     | 空图          | 整图数据；结构签名变化时才回灌，避免自激 |
| `nodeTypes`        | `FlowNodeTypeDef[]` | `[]`          | 调色板节点类型，一般由后端 metas 驱动     |
| `readonly`         | `boolean`           | `false`       | 只读（禁拖拽、禁连线、禁编辑）           |
| `height` / `width` | `string \| number`  | `"100%"`      | 容器尺寸，数字按 px                      |
| `showToolbar`      | `boolean`           | `true`        | 顶部工具条                               |
| `showPalette`      | `boolean`           | `true`        | 左侧调色板                               |
| `showProperties`   | `boolean`           | `true`        | 底部属性停靠区，只读视图可关掉           |
| `startType`        | `string`            | `"start"`     | 结构预检用的开始类型名                   |
| `endType`          | `string`            | `"end"`       | 结构预检用的结束类型名                   |
| `propertiesTitle`  | `string`            | `"属性"`      | 停靠区标题                               |

## Events

| 事件                | 载荷                                  | 触发时机                         |
| ------------------- | ------------------------------------- | -------------------------------- |
| `ready`             | `engine: FlowGraphEngine`             | 内核创建并灌入初始 `data` 之后   |
| `change`            | `data: FlowGraphData`                 | 任何图元增删改、移动、setData 后 |
| `select`            | `selection: FlowSelection \| null`    | 选中节点/连线/清空               |
| `node-click`        | `(node, MouseEvent)`                  | 单击节点                         |
| `node-dblclick`     | `(node, MouseEvent)`                  | 双击节点（外壳默认转成就地改名） |
| `node-contextmenu`  | `(node, MouseEvent)`                  | 右键节点，外壳自带菜单           |
| `edge-click`        | `(edge, MouseEvent)`                  | 单击连线并挂出端点工具           |
| `edge-connected`    | `edge: FlowEdge`                      | 新连线建立后（此处做环路拦截）   |
| `history-change`    | `{ canUndo, canRedo }`                | 撤销栈状态变化                   |

## Slots

| 插槽           | 作用域                                                                | 说明                             |
| -------------- | --------------------------------------------------------------------- | -------------------------------- |
| `properties`   | `{ selection, node, edge, nodeTypes, engine }`                        | 停靠区内容，表单由页面自己渲染   |
| `toolbar`      | `{ engine }`                                                          | 追加在工具条右侧统计信息之后     |

## 实例方法（defineExpose）

`engine` / `addNode(type)` / `check()` / `getData()` / `exportPNG(name?)` / `focus(id)` / `issues`。
`check()` 返回 `FlowStructureIssue[]` 并同步渲染画布底部的问题条。

## FlowGraphEngine API

```ts
graph                      // 原生 X6 Graph，需要精细控制时直接用
setData(data) addNode(type, x?, y?) getData()
updateNode(id, { label?, data?, color?, iconPath? })
updateEdge(id, { kind?, label?, transfer?, data? })
removeNodes(ids) removeEdges(ids) removeSelected()
copySelected(cut) paste() selectNode(id) focusNode(id) nodeClientRect(id)
toLocalPoint(clientX, clientY)
zoomBy(delta) resetZoom() getScale() fit() fitCenter()
undo() redo() canUndo() canRedo()
toJSON() fromJSON(json) exportPNG(filename?)
checkStructure(startType?, endType?)   // 前端预检，后端仍是最终裁判
dispose()
```

## 结构预检规则

`checkStructure` 只给提示、不阻断编辑：空图、缺开始（`NO_START`）、多个开始（`MULTI_START`）、
缺结束（`NO_END`）、多个结束（`MULTI_END`，warning）、自环（`SELF_LOOP`）、
非结束节点无出边（`DANGLING`）、非开始节点无入边（`ISOLATED`）。
**保存/执行前必须以后端 `CollectGraph` 的校验结果为准。**

## 用法示例（节选自采集平台设计器）

```vue
<script setup lang="ts">
import ReFlowGraph from "@repo/ui/re-flow-graph";
import type { FlowGraphData, FlowGraphEngine } from "@repo/ui/re-flow-graph";

const engine = shallowRef<FlowGraphEngine | null>(null);
const nodeTypes = metas.map(m => ({ type: m.shape, label: m.label, group: m.group }));

function onReady(instance: FlowGraphEngine) {
  engine.value = instance;
}
// 后端 DSL ↔ FlowGraphData：业务字段挂 data，label 只做显示
function onSelect(sel: FlowSelection | null) {
  if (sel?.kind === "node") form.value = sel.node.data;
}
</script>

<template>
  <ReFlowGraph :data="graphData" :node-types="nodeTypes" @ready="onReady" @select="onSelect">
    <template #properties="{ selection }">
      <!-- 页面按元数据渲染表单，改完调用 engine.updateNode / updateEdge 写回 -->
    </template>
  </ReFlowGraph>
</template>
```

写入内核后必然伴随一次 `change`，用它区分"程序灌图"与"用户编辑"（例如加载后首个 change
只清标记、不置脏），可避免刚打开就被标记为未保存。轮询刷新状态这类非用户操作，
用 `graph.disableHistory()` + `setAttrs` + `enableHistory()` 包住，别污染撤销栈。
