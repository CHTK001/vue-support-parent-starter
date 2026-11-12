# ReFlowGraph 流程设计器组件（基于 AntV X6）

面向"设计器"而非"查看器"的流程编排组件，交互对齐
[X6 官方 DAG 实践](https://x6.antv.antgroup.com/examples/showcase/practices/#dag)：
180×36 横向卡片节点 + 正交彩色连线，节点/连线的业务参数全部由页面通过插槽提供，
组件本身不认识任何业务字段。

- 内核：`FlowGraphEngine`（`internals/engine.ts`），封装 `@antv/x6` 及其 snapline / selection /
  keyboard / clipboard / history / minimap / export 插件。
- 节点：走 `@antv/x6-vue-shape` 的 `register()`，节点体是 Vue 组件 `internals/FlowNodeCard.vue`
  （官方用 React 侧的 `@antv/x6-react-shape`，这里是它对应的 Vue 版）。
  **节点的一切变化都落在 data 上**（`flowLabel` / `flowColor` / `flowIcon` / `flowTypeLabel`），
  往 `attrs.label` / `attrs.badge` / `attrs.icon` 写不报错也不生效 —— 卡片节点没有这几个选择器。
- 连线：`internals/shapes.ts` 注册 `flow-edge` 一个图形，业务差异只体现在 attrs
  （语义色、`6 4` 虚线）与 data 上，**新增连线语义无需注册新图形**。
- 图标：`internals/icons.ts` 收录采集/调度平台常用语义图标，未命中的 type 走 `DEFAULT_FLOW_ICON`。
- 方向规则：`internals/dagRules.ts` 的 `isDagTerminalAllowed` 是零 X6 依赖的纯函数
  （top 只作入边、bottom 只作出边），`engine.ts` 只做接线，便于脱离画布单测。

## 与官方 DAG 实践的差异

对齐的部分：节点走框架组件渲染 + `ports.groups`、180×36 卡片、`mousewheel` 缩放区间
（0.5–1.5）、`connecting.snap`、拖拽中虚线预览边、`magnetAdsorbed` 高亮
（青色 4px 描边 + 补 fill）、`Selection` 的 `rubberNode` / `rubberEdge`。

有一处「行为对齐、实现方式必须改」：官方在 `edge:connected` 里直接清 `strokeDasharray`
抹掉预览虚线。本组件的虚线有第二重语义（`transfer: false` = 不传递变量，本就该虚线），
无脑清会把它们误改成实线，因此改成按语义整体重绘。**这里必须由 `flowEdgeAttrs` 返回
空串 `""` 而不能返回 `undefined`** —— X6 的 `setAttrs` 是深合并，`undefined` 的键删不掉
已有的值，实测后果是每条新连的线都残留一段 `5 5` 预览虚线。

有意偏离的五处及理由：

| 项            | 官方                          | 本组件                       | 理由                                                                                       |
| ------------- | ----------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------ |
| 方向约束      | `validateMagnet` 禁 top 磁吸  | `validateConnection` 调纯函数 | 官方靠 `anchor:'center'` 让连线不落端口，照抄会禁掉 `bottom→top` 的正常落点                 |
| 平移手势      | `panning.eventTypes:左键`     | `modifiers: 'space'`         | 左键已被框选占用，改左键会与 Selection 橡皮筋冲突                                          |
| 框选修饰键    | `rubberband.modifiers:'shift'` | 不加修饰键                   | 左键唯一职责就是框选，再叠一层 shift 等于把基础操作变成隐藏手势                             |
| 连线连接器    | 自定义贝塞尔 `algo-connector`  | `orth` + `rounded`           | 业务流程编排的通行观感是正交折线（对齐 spider-flow / 宜搭 / 云效），多分支时曲线明显更难读 |
| 端口组        | 只有 top / bottom             | 四向                          | 持久化数据里 `fromPort` / `toPort` 可能是 left / right，砍掉会让已存流程端点落空             |

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
  image?: string; // 图片地址（data URI 或 http URL），优先于 path
  color?: string; // 主色，缺省按 type 稳定取色
  tips?: string; // 悬浮提示
  fixed?: boolean; // true 时禁止删除
}
```

> `image` 优先于 `path`：配了 `image` 就渲染 `<img>`，加载失败（`@error`）自动回落到 `path`，
> 不会留下空白节点。`updateNode({ image: "" })` 是「显式去掉图片」的合法意图，不是清空。

> `label` 只做显示。业务上需要持久化、但 X6 没有对应概念的字段（如流转条件、异常流向），
> 请放进 `data`，取数据时以 `data` 为准。

## Props

| 字段               | 类型                | 默认值        | 说明                                     |
| ------------------ | ------------------- | ------------- | ---------------------------------------- |
| `data`             | `FlowGraphData`     | 空图          | 整图数据；结构签名变化时才回灌，避免自激 |
| `nodeTypes`        | `FlowNodeTypeDef[]` | `[]`          | 调色板节点类型，一般由后端 metas 驱动     |
| `readonly`         | `boolean`           | `false`       | 只读（禁拖拽、禁连线、禁编辑），**运行中可切** |
| `height` / `width` | `string \| number`  | `"100%"`      | 容器尺寸，数字按 px                      |
| `showToolbar`      | `boolean`           | `true`        | 顶部工具条                               |
| `showPalette`      | `boolean`           | `true`        | 左侧调色板                               |
| `showProperties`   | `boolean`           | `true`        | 右侧属性停靠区，只读视图可关掉           |
| `showMinimap`      | `boolean`           | `false`       | 缩略图初值；prop 后续变更也会跟随         |
| `panning`          | `boolean`           | `true`        | 空格 + 拖动平移画布                      |
| `zoom`             | `boolean`           | `true`        | ctrl/meta + 滚轮缩放；**不含工具栏缩放按钮** |
| `nodeDraggable`    | `boolean`           | `true`        | 节点能否拖动；`readonly` 仍然一票否决      |
| `activeEdgeIds`    | `string[]`          | `[]`          | 当前推进的连线 id；命中项播放流动虚线，空数组清除 |
| `startType`        | `string`            | `"start"`     | 结构预检用的开始类型名                   |
| `endType`          | `string`            | `"end"`       | 结构预检用的结束类型名                   |
| `propertiesTitle`  | `string`            | `"属性"`      | 停靠区标题                               |
| `menuItems`        | `FlowMenuItem[]`    | 内置四项      | 右键菜单项；`[]` 即关掉右键菜单          |
| `nodeComponent`    | `Component \| null` | `null`        | 自定义节点体组件，替代内置卡片            |

### 交互开关的边界

四个开关（`showMinimap` / `panning` / `zoom` / `nodeDraggable`）都是**响应式**的，
运行中改 prop 即刻生效，不必重建画布。三点需要注意：

1. **`readonly` 优先于 `nodeDraggable`**，但**不**压制 `panning` / `zoom` ——
   「只读但允许挪位置看布局」是常见需求，只读限制的是改内容，不是看内容。
2. **`zoom` 只管滚轮**。工具栏的放大 / 缩小按钮走 `graph.zoom()`，与滚轮是两条路，
   `zoom=false` 时按钮依然可用（想连按钮一起禁就关 `showToolbar`）。
3. **`showMinimap` 是初值 + 变更跟随**，不是受控绑定：用户点工具栏按钮直接改内部状态，
   不回写 prop。宿主要强制覆盖，需在用户点过之后重新设一次 prop。

### 右键菜单（`menuItems`）

```ts
const menuItems: FlowMenuItem[] = [
  { key: "run", label: "执行", onClick: ({ node, event }) => run(node.id) },
  { key: "rename", label: "重命名", action: "rename" },   // 复用内置实现
  { key: "del", label: "删除", action: "delete", danger: true },
  { key: "audit", label: "审计日志", disabled: true },
];
```

- `action` 复用内置实现（`rename` / `locate` / `copy` / `delete`），`onClick` 自己处理；
  两者都给时 `onClick` 优先。
- `onClick` 的上下文是 `{ node, event }`。**没有 `edge`**：引擎只绑了 `node:contextmenu`，
  给一个恒为 `null` 的字段属于投机性接口，不给。
- 传 `[]` 等于关掉右键菜单（`<ul>` 根本不渲染，而不是留个空壳浮层吃掉点击）。

### 自定义节点体（`nodeComponent`）

```vue
<script setup lang="ts">
import type { Node as X6Node } from "@antv/x6";
const props = defineProps<{ node: X6Node; graph: any }>();
const kind = computed(() => props.node.getData()?.kind ?? "");
</script>

<template>
  <div class="my-node">{{ kind }}</div>
</template>
```

`x6-vue-shape` 会自己 `createApp` 挂载这个组件，因此**拿不到宿主作用域的插槽、
provide / inject 都不跨应用**。需要内容就靠 `node.getData()` 读业务数据自己渲染。
组件被按实例分配独占 shape 名（`WeakMap`），同一页面开两个画布、各用不同组件不会互相污染。

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
