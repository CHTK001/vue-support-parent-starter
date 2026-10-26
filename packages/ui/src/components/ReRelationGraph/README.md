# ReRelationGraph

基于 **G6 5.1.1 原生**的关系图谱组件（AntV G6 官方示例为地基，不做二次封装）。
主打「按分组聚簇 + 轮廓包裹」的关系可视化：节点用 `group`（势力 / 部门 / 集群）字段
驱动配色与分组轮廓，默认使用**分组布局**让每组自动占据画布上一块独立区域。

- 主题：`default` / `koi`（主题层只挂类名，能力全在核心 `G6Graph`）
- 内置工具栏：`internals/GraphToolbar.vue`（图标 + Popover，可折叠、可停靠四角、三种外观）
- 布局参数的「可感知字段」表：`internals/layoutSettings.ts`

---

## 一、数据契约

```ts
interface RelationNode {
  id: string | number;
  label?: string;        // 显示名，缺省用 id
  group?: string;        // 分组（势力 / 部门…），驱动配色 + 分组轮廓
  type?: string;         // 形状：G6 内置白名单之外的名字自动回落 circle
  size?: number;         // 节点直径，缺省 40
  image?: string;        // 头像 / 图标（http(s) 或 data URI），给了就按图片节点画
  imageRadius?: number;  // 图片圆角，缺省 size/2（= 圆形裁剪）
  badge?: string;        // 右上角徽标文字（如「主公」「军师」）
  badgeColor?: string;   // 徽标背景色，缺省跟随分组色
}

interface RelationEdge {
  id?: string;           // 边 id，缺省 `${source}-${target}`；同一对节点有多条边时必须显式给
  source: string | number;
  target: string | number;
  label?: string;        // 关系名：边标签 + tooltip
  width?: number;        // 线宽，缺省取 edgeWidth
  dashed?: boolean;      // 虚线，缺省取 edgeDashed
  arrow?: boolean | "both"; // 箭头，缺省取 edgeArrow
  color?: string;        // 线色
}
```

> `id` 只在「同一对节点之间有多条边」时才需要显式给（例如数据库的复合外键：
> 同一对表之间会有多条 FK）。G6 的边 id 必须唯一，缺省会退化成
> `${source}-${target}`，重复的会被静默丢弃（控制台报 `Edge already exists`）。
> 给了 `id` 之后，事件回参、选择、最短路径、`removeEdges` / `updateEdge` 全部按它记账。

---

## 二、画布（Canvas）能力

| 能力 | 配置 | 状态 |
| --- | --- | --- |
| 画布高度 | `height`（数字 = px，字符串 = css 长度，默认 `100%`） | ✅ |
| 缩放 | `zoom-canvas` 行为（滚轮 / 双指） | ✅ |
| 拖拽平移 | `drag-canvas` 行为 | ✅ |
| 拖拽节点 | `drag-element` 行为 | ✅ |
| 自动适配 | `autoFit: "view"` + `padding: 28`，布局结束后 `fitView({ when: "overflow" })` 补一次 | ✅ |
| 命令式适配 | `fitView()`；工具栏「适应画布」按钮 | ✅ |
| 空数据占位 | `emptyText`：节点为空时在画布中央显示这段文案 | ✅ |
| 聚焦节点集 | `focus(ids: string[])` —— 先 `zoomTo` 再 `focusElement`（G6 只平移不缩放） | ✅ |
| 分组配色 | 按 `group` 从调色板取色（`CLUSTER_COLORS`），节点 fill/stroke 同色 | ✅ |
| 深色/主题 | `theme` 主题包（`default` / `koi`），类名 `rrg-theme-*` | ✅ |
| 小地图 | `minimap` 开关（G6 `minimap` 插件，右下角缩略图） | ✅ |
| 右键菜单 | G6 `contextmenu` 插件 | ⏳ 规划 |
| 网格背景 / 水印 | G6 `grid-line` / `watermark` 插件 | ⏳ 规划 |
| 框选 | `brushSelect` 开关（自研覆盖层 + 包含判定，不依赖 `brush-select`） | ✅ |
| 套索选择 | G6 `lasso-select` 行为 | ⏳ 规划 |
| 悬浮提示 | `tooltip` 开关（G6 `tooltip` 插件，内容可自定义） | ✅ |

## 三、节点（Node）能力

| 能力 | 配置 | 状态 |
| --- | --- | --- |
| 形状 | `node.type`：只认 G6 内置类型（`circle` / `rect` / `ellipse` / `diamond` / `hexagon` / `star` / `triangle` / `donut` / `image` / `html`），其余业务类型名（`person` / `location`…）自动回落 `circle`，不会因为类型名不对而不画 | ✅ |
| 半径 | `node.size`；数据里没写时用组件级 `nodeSize`（缺省 40） | ✅ |
| 标签 | `label`，白字 + 半透明底（`labelPlacement: bottom`） | ✅ |
| 自定义内容 | `#node-content="{ node, selected, id }"` 插槽 → 渲染成 G6 `html` 节点（卡片 / 头像 + 文字 / 进度条都行）；不给插槽时回落 `circle` | ✅ |
| 配色 | 按 `group` 自动上色（与轮廓 / combo 同一个调色板，见 `groupColorOf`） | ✅ |
| 悬浮提示 | `nodeTooltip` 独立开关（还受总开关 `tooltip` 约束），内容可用 `#node-tooltip` 插槽或 `tooltipOptions.getContent` 换掉 | ✅ |
| hover 事件 | `@node-mouseover` / `@node-mouseout`（`{ id, data }`） | ✅ |
| 增删改查 | `addNode` / `addNodes` / `removeNode` / `removeNodes` / `updateNode` / `getNode` / `getNodes` / `setNodes` | ✅ |
| 高亮相邻节点 | `highlight`（默认开）：悬停高亮 1 度邻居与相连边、其余淡化（自研，无状态残留） | ✅ |
| 头像 / 图片 | `node.image`（http(s) 或 **data URI** 都行）+ `imageRadius`（缺省取 size 的一半 = 圆形裁剪），可和普通圆形节点混排 | ✅ |
| 徽标 / 角标 | `node.badge`（如「主公」）+ `node.badgeColor`，画在节点右上角；`nodeBadge`（默认开）可整体关掉 | ✅ |
| 选中态 / 多选 | `clickSelect` 开关 + `select()` / `getSelection()` / `clearSelection()` API | ✅ |

## 四、边（Edge）能力

| 能力 | 配置 | 状态 |
| --- | --- | --- |
| 连线 | `source` / `target` 自动生成，G6 默认曲线 | ✅ |
| 关系名 | `edge.label` → 边上标签（`edgeLabel` 默认开，标签带白底避免压线） | ✅ |
| 悬浮提示 | `edgeTooltip` 独立开关（与节点提示互不影响），内容可用 `#edge-tooltip` 插槽换掉 | ✅ |
| hover 事件 | `@edge-mouseover` / `@edge-mouseout`（`{ id, source, target, data }`） | ✅ |
| 增删改查 | `addEdge` / `addEdges` / `removeEdge` / `removeEdges` / `updateEdge` / `getEdges` / `setEdges` | ✅ |
| 线宽 / 虚线 | `edge.width`、`edge.dashed`；组件级默认 `edgeWidth`（1.4）/ `edgeDashed`（false） | ✅ |
| 箭头 | `edge.arrow`：`true` 终点箭头、`"both"` 双向；组件级默认 `edgeArrow`（false） | ✅ |
| 线色 | `edge.color`（缺省跟随交互态配色） | ✅ |
| 高亮 / 聚焦子图 | 与节点高亮联动（悬停边高亮两端）；最短路径改为「只显示路径」，不靠高亮态 | ✅ |

> **边数据逐条优先于组件级开关**：`{ source, target, width: 3, dashed: true, arrow: "both" }` 会覆盖
> `edgeWidth` / `edgeDashed` / `edgeArrow`，所以「整体一种风格 + 个别边强调」不用拆两套。
> 树类布局会把边重定向来保证只有一个根，此时箭头会自动改画在 start 端，**箭头方向仍是业务的 source → target**
> （实测 44 节点图里 9 条被重定向的边箭头都落在正确的那一端）。

## 五、分组轮廓（Group）

| 能力 | 配置 | 状态 |
| --- | --- | --- |
| 轮廓类型 | `groupType: "bubble" \| "hull" \| "none"` | ✅ |
| 轮廓显隐 | `groupVisible`（关掉只留配色） | ✅ |
| 散布局自动隐藏 | `groupAutoHide`（默认 true）：非分组布局下各组互相穿插，轮廓必然重叠，自动不画 | ✅ |
| 轮廓参数 | `groupOptions`：bubble `nodeR1`；hull `padding` / `concavity`；共用 `fillOpacity` / `lineWidth` / `strokeOpacity` | ✅ |
| 分组名标签 | 轮廓顶部固定显示（不随轮廓旋转） | ✅ |
| 布局落定后重算轮廓 | 内部在 `afterlayout` 调 `plugin.updateMember()`，修掉动画布局下轮廓留在原位的错位 | ✅ |
| 点选轮廓 | 开启 `combo` 后点击 combo 可折叠 / 展开整组；`collapseGroup()` / `expandGroup()` 命令式控制 | ✅ |

## 六、布局（Layout）

`layout` 接受字符串或 `{ type, ...options }`；`layoutOptions` 同名键优先。

| 能力 | 配置 | 状态 |
| --- | --- | --- |
| 分组布局 `group` | 每组自动占据画布一块区域，组内黄金角螺旋、组间 `gap` 留白（确定性，不抖动） | ✅ 默认 |
| G6 内置布局 | `force` / `d3-force` / `force-atlas2` / `fruchterman` / `circular` / `concentric` / `radial` / `grid` / `mds` / `dagre` / `antv-dagre` / `random` / `combo-combined` | ✅ |
| 树类布局 | `mindmap`（脑图）/ `compact-box`（生态树）/ `dendrogram`（树图）/ `indented`（缩进树） | ✅ |
| 鱼骨布局 `fishbone` | **本组件自研**：BFS 生成树 → 鱼头在左、一级节点沿脊柱上下交替、二级挂 45° 肋骨；`hGap` / `vGap` 可调 | ✅ |
| 关键参数面板 | `layoutSettings.ts`：每个布局只暴露几个直觉字段（滑杆 / 下拉 / 开关三种控件），工具栏「布局设置」按布局动态出面板 + 重置 | ✅ |
| 防重叠 | ①给支持 `preventOverlap` 的布局打开它；②布局落定后统一跑 `relaxOverlaps`（只沿圆心连线推开重叠对，不拉边不吸引，保留环/层/辐射的形状）；③树类用 `nodeSize / nodeSep / getHGap` 保证间距 | ✅ 18 个布局实测 0 重叠 |
| 多根 / 多分量 / 重合修复 | 树类布局按 BFS 层数重定向边（保证只有一个根）、连通分量摊开、精确重合节点绕圈错开 | ✅ |
| 边交叉计数 | `g.countEdgeCrossings()` 返回当前布局的边-边交叉数，用来横向比较「谁更不交叉」 | ✅ |

> **布局动画已关闭**。开着动画时 G6 是「边算边推」：`afterlayout` 在模拟还没收敛时就发了，
> 之后节点继续飘 —— 实测 ForceAtlas2 在 `afterlayout` 那一刻只有 7 对重叠，5 秒后涨到 222 对，
> 而「布局落定后的收尾」（去重叠 / fitView / 轮廓重算）早就跑完了，全对着中间态在算。
> 关掉后布局一次算到终态，`afterlayout` 就是真正的终态。

> **参数面板按布局各管一摊**，切布局时字段整体替换（实测 18 个布局 18 套面板，无重复）：

| 布局 | 可调字段 |
| --- | --- |
| 分组布局 `group` | 组内间距 / 组间留白 / 最小半径（+ 轮廓外扩 / 填充透明度 / 描边粗细，仅轮廓开着时显示） |
| 力导向 `force` | 节点斥力 / 连线长度 / 向心引力 |
| `d3-force` | 连线长度 / 节点斥力 / 防撞强度 |
| `force-atlas2` | 斥力系数 / 向心系数 / 移动速度 / 聚类模式（下拉） |
| `fruchterman` | 向心引力 / 收敛速度 |
| 环形 `circular` | 圆半径（0=自动）/ 环上间距 / 起始角度 / 环上排序（下拉）/ 顺时针（开关） |
| 同心圆 `concentric` | 节点间距 / 等距分环（开关）/ 顺时针（开关）/ 分环依据（下拉） |
| 网格 `grid` | 行数（0=自动）/ 列数（0=自动）/ 节点间距 / 紧凑排列（开关） |
| 辐射 `radial` | 环间距 / 连线长度 / 中心节点（下拉，选项取自图上节点）/ 严格同环（开关） |
| `mds` | 连线长度 |
| `dagre` / `antv-dagre` | 布局方向（下拉）/ 同层间距 / 层间距（antv-dagre 多一个节点对齐） |
| 鱼骨 `fishbone` | 骨头间距 / 肋骨长度 / 鱼头节点（下拉，选项取自图上节点） |
| 树类四种 | 展开方向（下拉）/ 节点占位 / 层间距 / 兄弟间距；树图是 横向展开（开关）/ 节点占位 / 叶子间距 / 层间距 |
| 随机 `random` | 无可调参数 |

> 面板显示的默认值就是**实际生效值**：`buildLayout` 会先把面板默认值铺成布局参数，再让
> `layoutOptions` 覆盖。例外是 `zeroAsAuto` 的 0（面板显示「自动」，不传下去）。
>
> 树类的 `getWidth / getHeight / getHGap / getVGap` 在 `@antv/hierarchy` 里必须是**函数**，
> 面板给的是数字，组件在 `treeLayoutOptions` 里统一包成常量闭包 —— 直接透传数字会
> `TypeError: e.getHGap is not a function`。默认尺寸取 56px 而不是 hierarchy 自带的
> 「标签字数 × 18 / 高 36」：后者对中文名只有 36px 宽，而实际节点是 30~64px 的圆，
> 叶子必然叠在一起（实测 dendrogram 44 个节点里 24 对重叠）。
>
> 环形的 `radius` 和 `nodeSpacing` 在 G6 里**互斥**：只要 `nodeSpacing > 0`，
> 半径就按「所有节点直径之和 ÷ 2π」反推，面板上填的半径会被直接忽略。
> 组件因此在「手填半径」时把 `nodeSpacing` 归零。

> **能不能做到边完全不交叉？** 只有当图是**平面图**（可以在平面上画出且任意两边只在公共端点相交）时才可能。
> 三国这种「多个枢纽连接各势力」的图是非平面的，几何上不可能零交叉；能做的只是「尽量少」。
> 实测（44 节点 / 45 边）：`force-atlas2` 0~6、`fishbone` 3、`d3-force` 9、`dagre` 11、树类 14~27、
> `group` 38、`circular` 76、`concentric` 179。要最少交叉选 **ForceAtlas2 / 鱼骨 / 分层**。


## 六之二、场景预设与配色

### 场景预设（`GRAPH_PRESETS` / `applyPreset`）

「一套调好的 props 组合」直接 v-bind，省掉每换一个场景就重抄十几个开关：

```ts
import { GRAPH_PRESETS, applyPreset, suggestPreset } from "@repo/ui/re-relation-graph";

const preset = ref(GRAPH_PRESETS[0]);
<ReRelationGraph :nodes="nodes" :edges="edges" v-bind="applyPreset(preset)" />

// 首次接入：让组件从数据猜一个（有 ≥3 个分组 → 知识图谱；有唯一枢纽且平均度数低 → 组织架构；否则流程拓扑）
const first = suggestPreset(nodes, edges);
```

| 预设 | 布局 | 特点 |
| --- | --- | --- |
| `knowledge` 知识图谱 | `group` + 气泡轮廓 | 分组聚块、节点/边提示全开、无箭头（默认值） |
| `org` 组织架构 | `dagre`（`rankdir: TB`） | 自上而下分层、单向箭头、边标签、不画轮廓 |
| `topology` 流程拓扑 | `antv-dagre`（宽幅分层） | 单向箭头 + 小地图 + 框选 + 卡片式工具栏 |
| `social` 社交关系 | `d3-force` | 细虚线、只开节点提示、无徽标 |
| `hierarchy` 家族谱系 | `fishbone`（自研） | 双向箭头（婚姻/血缘是双向的）、边标签、小地图 |

> 预设只是参数包：`v-bind="applyPreset(p)"` 之后还可以继续写自己的 prop 覆盖单项
> （同名属性后者生效）。`applyPreset` 会拷贝 `layoutOptions` / `groupOptions`，改预设不会污染内置常量。

### 分组配色（`GROUP_PALETTE` / `groupColorOf`）

节点填充、分组轮廓、combo 描边都用同一份调色板。业务画**图例、列表色点、头像底色**时也用这两个导出，
不要再抄一套色值（抄了就会和图上颜色对不上）：

```ts
import { GROUP_PALETTE, groupColorOf } from "@repo/ui/re-relation-graph";
groupColorOf("蜀汉"); // → 稳定的 6 位 hex（同组同色、跨渲染不变、与数据顺序无关）
```

## 七、内置工具栏（GraphToolbar）

| 能力 | 配置 | 状态 |
| --- | --- | --- |
| 开关 | `toolbar` | ✅ |
| 外观变体 | `toolbarVariant: "pill" \| "card" \| "rail"` | ✅ |
| 停靠位置 | `toolbarPosition: "top-left" \| "top-right" \| "bottom-left" \| "bottom-right" \| "left" \| "right"` | ✅ |
| 紧贴边框 | 按钮 21px（原 30px）、图标 12px、内边距 / 间距收紧，停靠偏移 4px | ✅ |
| 折叠 | `toolbarCollapsible`（默认开），折叠后只留一个展开按钮；**停靠左侧时折叠按钮自动排到最左**，停靠右侧时排最右 | ✅ |
| 内置按钮 | 布局（图标网格）/ 分组轮廓 / 分组开关 / 布局设置 / **视图与交互** / **分组折叠** / **最短路径** / 适应画布 / 折叠 | ✅ |
| 视图与交互面板 | `[data-tool="view"]`：点选、框选、悬停高亮、**节点提示**、**边提示**、小地图、分组折叠 7 个开关（改完自动重建画布） | ✅ |
| 分组折叠面板 | `[data-tool="groups"]`：逐个分组显示折叠状态 + 开关（仅在 `combo` 开启时出现） | ✅ |
| 最短路径 | 一个按钮 `[data-tool="path"]`：端点由**右键菜单**指定（右键节点 →「设为起点 / 终点」），两端齐了自动算；算完**只显示路径上的节点与边**，其余全部隐藏；按钮再次点击退出 | ✅ |
| 业务自定义工具 | `<template #toolbar-extra>` | ✅ |
| 与外部参数双向同步 | 工具栏改动 emit `update:layout` / `update:layoutOptions` / `update:groupType` / `update:groupVisible` / `update:groupOptions` / `update:clickSelect` … / `toggle-group` / `path-toggle` / `path-run` / `path-clear`，支持 `v-model:xxx` | ✅ |

## 七之一、交互（点选 / 框选 / 高亮 / 折叠）

| 能力 | 配置 | 默认 | 说明 |
| --- | --- | --- | --- |
| 点选 | `clickSelect` | 关 | 单击节点 / 边加入选择（再点取消，点空白清空）；最短路径走右键，不占用选中状态 |
| 框选 | `brushSelect` | 关 | 空白处拖拽拉框，框内节点 + 两端都在框内的边被选中；开启后拖拽=框选（不挂 `drag-canvas`，滚轮缩放仍在） |
| 悬停高亮 | `highlight` | **开** | 悬停节点高亮其 1 度邻居与相连边、其余淡化；移出立即还原 |
| 悬浮提示（总） | `tooltip` | **开** | 总开关：关掉则节点 / 边都不出 tooltip |
| 节点悬浮提示 | `nodeTooltip` | 开 | 只控制节点 tooltip；内容可用 `#node-tooltip` 插槽换掉 |
| 边悬浮提示 | `edgeTooltip` | 开 | 只控制边 tooltip；内容可用 `#edge-tooltip` 插槽换掉 |
| 小地图 | `minimap` | 关 | 右下角缩略图，点击可定位 |
| 分组折叠 | `combo` / `collapsedGroups` | 关 / `[]` | 每个 group 画成 combo，单击折叠 / 展开；`collapsedGroups` 指定**初始就折叠**的分组 |
| 右键菜单 | `rightClickSelect` + `#context-menu` | 开 | 右键回传命中元素 + 选中集合；给了插槽就在光标处浮出业务菜单 |
| 撤销 / 重做 | `history` / `historyLimit` | 开 / 50 | 所有命令式增删改都压一份快照，`undo()` / `redo()` 或 Ctrl+Z / Ctrl+Shift+Z |
| 键盘快捷键 | `keyboard` / `shortcuts` | 开 / 内置 6 条 | 容器聚焦时生效，见下表；输入框内一律不拦 |

> 这四项（高亮 / 点选 / 框选 / 折叠）**没有用 G6 的 behavior**，都是组件自研的事件 + 状态实现：
> `hover-activate` 的状态是增量叠加的，第一个悬停过的节点会一直留着 active 光晕（就是「蒙版没删掉」）；
> `brush-select` / `click-select` 的 `trigger: []` 依赖内部 Shortcut 按键记录，真实鼠标下时灵时不灵。
> 自研实现每次整图重设状态、只碰「悬停 / 选中」两个维度；最短路径走的是可见性而不是状态，
> 与它们互不干扰。

## 八、对外方法（实例 expose）

```ts
const g = graphRef.value;
// 布局 / 分组 / 视口
g.setLayout("force", { linkDistance: 150 });
g.setGroupType("hull");           // "bubble" | "hull" | "none"
g.setGroupVisible(false);
g.fitView();
await g.focus(["刘备", "关羽"]);   // 缩放 + 居中到子集

// 交互开关（等价于工具栏「视图与交互」里的 7 个开关）
g.setClickSelect(true); g.setBrushSelect(true); g.setHighlight(true);
g.setMinimap(true); g.setCombo(true);
g.setTooltip(false);              // 总开关：节点 + 边全部关掉
g.setNodeTooltip(true);           // 只开关节点提示
g.setEdgeTooltip(false);          // 只开关边提示
g.tooltip; g.nodeTooltip; g.edgeTooltip;

// 右键菜单（浮层由 #context-menu 插槽渲染，这里是命令式收口）
g.contextMenu;                    // 当前右键回参（未打开为 null）
g.closeContextMenu();

// 分组折叠（group = 业务分组名，如「蜀汉」）
await g.collapseGroup("蜀汉");
await g.expandGroup("蜀汉");
await g.toggleGroupCollapsed("蜀汉");
g.isGroupCollapsed("蜀汉");        // boolean
g.getCollapsedGroups();            // ["蜀汉", ...]

// 选择 / 高亮 / 居中
g.select(["刘备", "关羽"]);          // 命令式给一组元素上状态
g.getSelection();                  // { nodes, edges, combos }
g.clearSelection();                // 只清选择
g.highlightElements(["刘备"]);      // 只给这批元素上 active 态（不动选择集合）
g.centerOn("刘备");                 // 平移到该元素（不缩放；要缩放用 focus）
g.clearStates();                   // 清空所有状态（选择 + 高亮 + 淡化），路径模式也会退出

// 最短路径（BFS，按边数最少）—— 算完只显示这条链路，其余节点 / 边隐藏
g.shortestPath("刘备", "曹操", { directed: false });  // → { found, nodes, edges }
g.setPathEndpoint("刘备", "from");                    // 右键菜单用：设起点，两端齐了自动算
g.setPathEndpoint("曹操", "to");
g.shortestPathFromSelection();                        // 兜底：用当前选中的两个节点
g.clearPath();                                        // 退出「只显示路径」，恢复全部元素
g.pathActive;                                         // 是否正在只看路径
g.pathFrom; g.pathTo;                                 // 当前端点
g.pathInfo;                                           // 最近一次结果的文字

// 边交叉数（选布局时横向比较用）
g.countEdgeCrossings();            // 38 = 当前布局下有 38 处边-边交叉

// 读
g.getNodes(); g.getEdges(); g.getNode("刘备");
g.layout; g.groupType; g.groupVisible; g.groupAutoHidden; g.graph; // 底层 G6 实例
g.clickSelect; g.brushSelect; g.highlight; g.minimap; g.combo; g.tooltip;

// 整体替换
g.setNodes(nodes); g.setEdges(edges); g.setData({ nodes, edges });

// 节点 CRUD
g.addNode({ id: "客串", label: "客串", group: "蜀汉", size: 28 });
g.addNodes([...]);
g.updateNode("客串", { label: "改名", size: 44 });
g.removeNode("客串");            // 连带删除相连的边
g.removeNodes(["a", "b"]);
g.clear();

// 撤销 / 重做（所有上面的增删改都记历史，包括 setNodes / setData / clear）
g.undo();                        // → true / false（没得撤时为 false）
g.redo();
g.canUndo; g.canRedo;
g.history;                       // { canUndo, canRedo, undoCount, redoCount, lastAction }
g.clearHistory();                // 父组件整体换数据后调一次，别让撤销跳回上一份
g.deleteSelection();             // 删除当前选中（一条历史记录，不是 N 条）
g.selectAll();                   // 全选节点 + 边
g.shortcuts;                     // 当前生效的快捷键表（内置 + props.shortcuts 覆盖）
```

命令式改动落在组件内部数据副本上并立即重绘，同时 emit `nodes-change` / `edges-change`，
父组件可用这两个事件把自己的数据源同步过去（不强制受控）。

> 分组布局下任何数据改动都会重算全部坐标后整体重推；其他布局走 G6 增量接口
> （`addNodeData` / `updateNodeData` / `removeNodeData`），不重跑布局、不挪动已有节点。

## 八之一、编辑历史与键盘快捷键

### 撤销 / 重做

`history`（默认开）会把每次**命令式增删改**压一份快照（改动前的节点 + 边），
`undo()` / `redo()` 把快照灌回去并整体重推。工具栏上会出现撤销 / 重做两个按钮，
无历史时置灰。

| 项 | 说明 |
| --- | --- |
| 记录范围 | `addNode(s)` / `removeNode(s)` / `updateNode` / `addEdge(s)` / `removeEdge(s)` / `updateEdge` / `setNodes` / `setEdges` / `setData` / `clear` / `deleteSelection` |
| 不记录 | 布局 / 分组 / 视图开关、选中态、视口缩放 —— 撤销一次「删节点」不该把用户的缩放和选中一起回退 |
| 快照内容 | 只存 `nodes` + `edges`（深拷贝一层，改数据不会污染历史） |
| 深度 | `historyLimit`（默认 50），超出丢最老的 |
| 分支 | 撤销后再做新改动 → 重做栈作废（标准编辑器语义） |
| 关闭 | `:history="false"`，此时不压栈、`undo()` 直接返回 `false`、工具栏不显示撤销按钮 |
| 整体换数据 | 父组件切数据源后建议 `g.clearHistory()`，否则撤销会跳回上一份数据 |

> **为什么只存数据不存状态**：状态（选中 / 高亮）是按元素 id 记账的，
> 撤销掉一个节点后那些 id 在数据里已不存在，恢复旧状态只会得到悬空 id。
> 所以撤销时选择记账会被裁剪到「当前数据里真实存在的元素」，画布不额外刷状态。

### 键盘快捷键

容器带 `tabindex="0"`，**点一下画布**（或组件内任意位置）后即可用：

| 动作 | 默认键 | 说明 |
| --- | --- | --- |
| `undo` | `Ctrl/⌘ + Z` | 撤销 |
| `redo` | `Ctrl/⌘ + Shift + Z` | 重做 |
| `redo-alt` | `Ctrl/⌘ + Y` | 重做的另一个写法（Windows 习惯） |
| `select-all` | `Ctrl/⌘ + A` | 全选节点 + 边 |
| `delete` | `Delete` / `Backspace` | 删除选中（节点连带其边，一条历史） |
| `clear-selection` | `Esc` | 清空选择 + 关掉右键浮层 |

```ts
// 改键：只覆盖想改的那几条，其余保持内置
:shortcuts="{ undo: 'alt+z', delete: false }"   // false = 关掉该动作
:keyboard="false"                                // 整体关掉
```

设计约束（都是踩过的坑）：

1. **绑在组件根节点，不用 window**：同页多个图谱不会互相抢 Ctrl+Z；只有点过这个图才响应。
2. **输入框 / textarea / select / contentEditable 内一律不拦**：否则在搜索框里按退格会删掉图上的节点。
3. **`mod` = Ctrl 或 ⌘**，写了 `ctrl` / `meta` 就精确匹配那一个（Windows 上按 ⌘ 不该触发）。
4. **没事可做时不 `preventDefault`**：撤销栈空着时 Ctrl+Z 仍交给浏览器（别把页面的撤销吃掉）。
5. **命中后 emit `shortcut`**（`{ action, combo, native }`），业务可做埋点或额外联动。

## 九、事件

| 事件 | 载荷 |
| --- | --- |
| `node-mouseover` / `node-mouseout` | `{ id, data }` |
| `node-click` | `{ id, data }`（单击节点；不受 `click-select` 开关影响，`data` 是业务节点对象） |
| `node-dblclick` | `{ id, data }`（双击节点，常用来打开详情 / 下钻） |
| `edge-click` | `{ id, source, target, data }`（单击边） |
| `edge-mouseover` / `edge-mouseout` | `{ id, source, target, data }` |
| `ready` | `{ nodes, edges }`（画布渲染就绪；每次重建都会发一次，要首帧 fitView 或取坐标用这个） |
| `selection-change` | `{ nodes, edges, combos }`（点选 / 框选 / 命令式都会发） |
| `combo-collapse-change` | `{ group, collapsed }` |
| `path-change` | `{ from, to, found, nodes, edges }`（`edges` 是边 id：`RelationEdge.id`，缺省 `"source-target"`） |
| `contextmenu` | `{ targetType, id, source?, target?, group?, data, selection, client, page, canvas, native }`（右键节点的完整回参见下） |
| `context-menu-close` | 无载荷（点空白 / Esc / 插槽里调 `close()` 都会发） |
| `nodes-change` / `edges-change` | 变更后的完整数组 |
| `history-change` | `{ canUndo, canRedo, undoCount, redoCount, lastAction }`（每次压栈 / 撤销 / 重做 / 清空都会发） |
| `shortcut` | `{ action, combo, native }`（命中并执行了一条内置快捷键） |
| `update:layout` / `update:layoutOptions` / `update:groupType` / `update:groupVisible` / `update:groupOptions` / `update:clickSelect` / `update:brushSelect` / `update:highlight` / `update:minimap` / `update:tooltip` / `update:nodeTooltip` / `update:edgeTooltip` / `update:combo` | 新值（`v-model:xxx` 用） |

## 十、插槽

| 插槽 | 回参 | 说明 |
| --- | --- | --- |
| `#toolbar-extra` | — | 往内置工具栏右侧塞业务自己的按钮 |
| `#node-content` | `{ node, id }` | 自定义节点内容（节点 `type: "html"` 时渲染成 G6 `html` 节点）；不给就画 `circle` |
| `#node-tooltip` | `{ node, id, data }` | 节点悬浮提示的内容（完全替换默认模板） |
| `#edge-tooltip` | `{ edge, id, source, target, data }` | 边悬浮提示的内容 |
| `#context-menu` | `{ menu, close }` | 右键浮层内容；`menu` 就是 `contextmenu` 事件的载荷，`close()` 关掉浮层 |

```vue
<ReRelationGraph :nodes="nodes" :edges="edges" :click-select="true">
  <!-- 节点提示：回参 node 是业务节点对象（RelationNode），随便排 -->
  <template #node-tooltip="{ node }">
    <div style="min-width: 104px; font-size: 12px">
      <div style="font-weight: 700">{{ node.label ?? node.id }}</div>
      <div>势力：{{ node.group }}</div>
    </div>
  </template>

  <!-- 边提示：单独一份模板，两端都给了 -->
  <template #edge-tooltip="{ edge, source, target }">
    <div style="font-size: 12px">{{ source }} → {{ target }}（{{ edge.label }}）</div>
  </template>

  <!-- 右键菜单：menu 里带着命中元素 + 选中集合，close() 关浮层 -->
  <template #context-menu="{ menu, close }">
    <div style="display: flex; flex-direction: column">
      <b style="padding: 4px 8px">{{ menu.id || "空白处" }}</b>
      <button @click="graph.focus([menu.id]); close()">聚焦</button>
      <button @click="graph.removeNode(menu.id); close()">删除</button>
    </div>
  </template>
</ReRelationGraph>
```

> 提示内容的 HTML 是注入到**画布容器**里的，父组件的 `scoped` 样式不一定命中，
> 样式请用行内 `style` 或全局 class（示例页 `ReRelationGraphLab.vue` 就是这么做的）。
> 只用默认模板时什么都不用配；想改文字但不想写模板，也可以传
> `tooltipOptions.getContent(data, "node" | "edge") => string`（优先级低于插槽）。

### 右键回参（`contextmenu` 事件 / `#context-menu` 的 `menu`）

| 字段 | 说明 |
| --- | --- |
| `targetType` | `"node" \| "edge" \| "combo" \| "canvas"`（右键空白处是 `canvas`） |
| `id` | 元素 id；边是 `RelationEdge.id`（缺省 `"source-target"`）；`canvas` 时为 `""` |
| `source` / `target` | 仅边：两端节点 id |
| `group` | 仅 combo：分组名（如 `"蜀汉"`） |
| `data` | 业务对象：节点 → `RelationNode`，边 → `RelationEdge`，combo → `{ group }` |
| `selection` | 右键瞬间的选中集合 `{ nodes, edges, combos }`（右键元素默认已补进去） |
| `client` | 光标相对**组件根元素**的坐标（浮层按它定位，靠近边会自动翻转） |
| `page` | 光标相对视口的 `clientX / clientY` |
| `canvas` | 光标在**画布坐标系**里的坐标 |
| `native` | 原始 `MouseEvent`（要读 `shiftKey` 等修饰键时用） |

---

## 已知取舍

1. **切布局 / 切分组类型 / 改分组参数 = 整图重建**：G6 5 没有「清空插件 + 换算法」的干净入口，
   重建最稳；重建请求会合并到同一帧（`scheduleRecreate` + rAF），并用 `graphAlive` 守卫
   旧实例的异步回调。
2. **分组轮廓依赖分组布局**：轮廓按 group 圈节点，散布局下各组必然互相穿插、轮廓互相重叠，
   因此默认用 `groupAutoHide` 在非分组布局下自动隐藏（可关）。
3. **轮廓只在 `afterlayout` 后重算一次**：拖拽节点时 hull 走 G6 的 `AFTER_ELEMENT_UPDATE`
   自然更新，bubble-sets 亦然；但持续动画的布局（`force` 迭代过程）中间态不保证实时贴合。
4. **画布内的浏览器原生右键菜单被拦掉**：不拦的话会盖在我们的右键浮层上。组件外（页面其它地方）
   的右键不受影响；业务若想彻底用浏览器默认菜单，不传 `#context-menu` 也不监听事件即可
   （此时仍会 `preventDefault`，需要原生菜单请提需求加开关）。
5. **tooltip / 右键浮层的 HTML 注入在画布容器里**：父组件的 `scoped` 样式对插槽内容不一定命中，
   请用行内 style 或全局 class（示例页 `ReRelationGraphLab.vue` 用全局前缀类演示）。
6. **`node.type` 必须是 G6 形状名**（`circle` / `rect` / `image` …）。业务里常见的 `person` /
   `location` 这类「业务类型名」如果直接透给 G6，元素会被静默跳过（不报错、节点不画），
   连带分组轮廓在算成员包围盒时抛 `getRenderBounds` 异常。所以组件用白名单兜底：不认识的一律画
   `circle`，业务类型仍完整保留在 `data.type` 里供 tooltip / 插槽使用。
7. **图片节点用 `image` 字段，不要自己塞 `style.src`**：组件要按 `image` 把 `type` 改成 `image`
   并补圆角 / 描边，直塞 style 会画成方图且丢失分组描边环。
8. **状态样式不会自动回滚（G6 5.1.1 的坑）**：`state` 里写的属性是「叠加合并」的，摘掉状态
   只是让它不再参与合并，元素身上那份旧值仍在。所以 `inactive: { opacity: 0.14 }` 一旦生效，
   之后无论变成 `active` 还是清空状态，节点都会永远停在 0.14 —— 表现就是「悬停过一次的节点
   移开后一直是灰的、再悬停也不亮」。组件在 `node.style` / `edge.style` / `combo.style` 里
   给 `opacity`（节点另有 `labelOpacity`）补了可复位的基线（回调读节点自己的数据，不覆盖业务
   自定义值）。**给状态加新属性时，必须同时在默认样式里给这个属性一个基线值**，否则会留下残影。
9. **悬停事件顺序不保证**：快速从 A 划到 B 时，`pointerleave(A)` 可能晚于 `pointerenter(B)`，
   无条件清高亮会把刚点亮的 B 抹掉（表现为「悬停没反应」）。所以 `clearHoverHighlight(id)`
   只在「离开的正是当前悬停对象」时才清，迟到的离开事件直接丢弃。
10. **JS 动态创建的覆盖层必须用 `:deep()` 写样式**：框选选框 `.rrg__brush` 是
    `document.createElement` 出来的，拿不到 Vue 的 `data-v-xxx` scoped 属性，
    普通 `scoped` 选择器对它完全不生效 —— 实测 computed `position` 仍是 `static`，
    选框被排到画布底边外面（鼠标在 y≈481 拖，框画在 y≈932）。
11. **框选结束要吃掉 G6 补发的 click**：`click` 在 `pointerup` 之后触发，且
   `targetType` 取决于松开瞬间指针落在哪 —— 落在空白是 `canvas:click`（直接清空选择），
    落在节点上是 `node:click`（`toggleSelect` 把节点取消掉）。两种情况都会把刚框中的结果
    冲掉，表现为「框选时灵时不灵」。`onBrushUp` 里置 `brushClickGuard`，
    四个 click 处理器开头统一 `consumeBrushClick()` 丢弃这一次。
12. **「只显示路径」不能靠调透明度，也不能只清状态**：`inactive` 只是把 opacity 压到 0.14，
    元素仍占画布、仍能被鼠标命中，视觉上也还是一片东西。路径模式改用
    `graph.setElementVisibility(..., 'hidden')` 真正隐藏，并且：
    - 分组轮廓插件（bubble-sets / hull）按 group 圈**全部**成员，成员被隐藏后它仍会圈出空壳，
      成员缺失时还会在算包围盒时抛错 —— 所以路径模式下 `buildGroupPlugins()` 返回空，
      进出路径模式各重建一次画布；
    - 重建是异步的，`clearPath()` 之后立刻 `setElementState` 会打在新画布尚未 draw 的元素上，
      抛 `Cannot read properties of undefined (reading 'draw')` —— 所以 `clearStates()` 先退出
      路径模式，重建过就直接收尾；
    - `setData` 会按数据 style 重建元素、把 visibility 抹回默认，`pushFullData()` 的
      `render()` 回调里要按当前模式补一次可见性。
13. **端点为什么走右键、不走多选**：选中是**无序集合**，从里面取两个当起点终点得靠额外规则
    （谁先点的？），而且「选中」还要给删除、信息面板等业务用，拿它兼职会把两件事绑死。
    右键天然携带目标 —— 点的是谁谁就是端点，方向也明确。所以主入口是右键菜单的
    「设为起点 / 设为终点」（两端齐了自动算），工具栏那颗按钮只负责「算 / 退出」；
    `shortestPathFromSelection()` 保留给「已经框选好两个节点」的场景兜底。
