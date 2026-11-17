# ReChart —— 聚合图表组件

聚合图表面板，把「图类型 + 渲染引擎」统一成一句话语法。支持三种渲染后端：

| `type` | 引擎 | 说明 |
|--------|------|------|
| `bar` / `line` | `echarts`（默认） | 柱状 / 折线，传 `categories` + `series` 即可 |
| `sankey` | `echarts` 或 `d3` | 桑基/流线图，传 `sankey.nodes` + `sankey.links` |
| `pie` / `scatter` / `gauge` / `custom` | `echarts` | 需直接传完整 `option` |
| `flow` | `@antv/g6`（固定） | 资金流/决策流线图，传 `data` 树结构 |
| `topology` | 自绘 SVG | 链路拓扑：连线流动 + 在用线路高亮 + 小鸟搬运 |
| `context` | 自绘 | 上下文窗口：面积 / 点阵 / 水位三种画法 |
| `atlas` | 自绘 | 关系星图：分组聚簇 + 连线，节点大小 = 权重 |
| `orbit` | 自绘 SVG | 权限轨道：同心弧量表，弧长 = 覆盖率 |
| `matrix` | 自绘 | 热力矩阵：行 × 列 的强度分档网格 |
| `race` | echarts（官方 bar-race） | 动态竞速条形：多帧快照逐帧推进，条长插值 + 名次换位 |

> 自绘类型（topology / context / atlas / orbit / matrix / race）的配色全部取 koi 令牌
> （`--brand-*` / `--bg-*` / `--text-*` / `--status-*`），亮暗主题自动跟随，不写死色值。
> canvas 不认 `var(--x)`，race 会先用 `normalizeColor` 解析成 sRGB 再交给 ECharts。

## 快速上手

```vue
<!-- 折线/柱状（echarts 引擎，传简单数据） -->
<ReChart type="bar" height="320px"
         :categories="['周一','周二','周三']"
         :series="[{ name:'交易量', data:[120,200,150,80] }]" />

<!-- 桑基（echarts 引擎） -->
<ReChart type="sankey" height="320px"
         :sankey="{ nodes:[{name:'A'},{name:'B'},{name:'C'}],
                    links:[{source:'A',target:'B',value:10},{source:'A',target:'C',value:6}] }" />

<!-- 桑基（d3 引擎，通过 engine 切换） -->
<ReChart type="sankey" engine="d3" height="320px" :sankey="sankeyData" />

<!-- 资金流线图（G6，复用官方 fund-flow 示例） -->
<ReChart type="flow" height="480px" :data="flowTree" />

<!-- 关系星图：同 kind 聚成一簇，weight 决定节点直径 -->
<ReChart type="atlas" height="420px" :atlas="{
  groups: [{ key: 'core', label: '管理核心' }, { key: 'biz', label: '业务角色' }],
  nodes: [
    { id: 'r1', label: '超级管理员', detail: 'SUPER_ADMIN', kind: 'core', weight: 91, state: 'active' },
    { id: 'r2', label: '内容管理员', detail: 'CONTENT_ADMIN', kind: 'biz', weight: 42 },
  ],
  edges: [{ from: 'r1', to: 'r2', label: '派生', dashed: true }],
}" />

<!-- 权限轨道：一圈一个维度，弧长 = 覆盖率 -->
<ReChart type="orbit" height="420px" :orbit="{
  center: { label: '内容管理员', detail: 'CONTENT_ADMIN', caption: '03 / 10' },
  rings: [
    { key: 'menu', label: '菜单权限', percent: 46, value: '42 / 91' },
    { key: 'data', label: '数据范围', percent: 75 },
  ],
}" />

<!-- 热力矩阵：values[row][col] 取 0~levels，null = 不适用 -->
<ReChart type="matrix" height="420px" :matrix="{
  rows: [{ key: 'r1', label: '内容管理员', detail: 'CONTENT_ADMIN' }],
  columns: [{ key: 'c1', label: '监控中心' }, { key: 'c2', label: '内容中心' }],
  values: [[2, 4]],
  levels: 4,
  activeColumn: 'c1',
}" />

<!-- 动态竞速条形：items 定条目，frames 是多帧快照（帧里按 id 取数） -->
<ReChart type="race" height="420px" :race="{
  title: '模型调用量',
  items: [
    { id: 'gpt', label: 'GPT-4o' },
    { id: 'claude', label: 'Claude 3.7' },
    { id: 'qwen', label: 'Qwen2.5-72B', color: 'var(--metric-db)' },
  ],
  frames: [
    { label: '2026-01', values: { gpt: 8200, claude: 4200, qwen: 1500 } },
    { label: '2026-02', values: { gpt: 9600, claude: 6100, qwen: 3400 } },
    { label: '2026-03', values: { gpt: 11200, claude: 8900, qwen: 7200 } },
  ],
  top: 10,
  unit: ' 次',
}" />
```

### 动态竞速条形（type="race"）

数据是**多帧快照**，不是单帧：每条只需要一个稳定 `id`，帧里按 `id` 给数值（缺项按 0）。

| 字段 | 说明 |
|------|------|
| `items[].id` | 稳定 id，颜色与名次跟着它走 |
| `items[].label` | 轴标签（条左端的名字） |
| `items[].color` | 可选，hex / rgb / `var(--token)`；不填按序取 koi 令牌 |
| `items[].detail` | 可选，悬停提示里的补充说明 |
| `frames[].label` | 帧标签（年份 / 期数），显示在左上角 |
| `frames[].values` | `id → 数值` |
| `top` | 显示前 N 名，默认 10 |
| `duration` / `hold` | 单帧动画 ms（默认 900）/ 帧末停留 ms（默认 300） |
| `loop` | 播完是否回第一帧重播，默认 `true` |
| `valueFormat` / `unit` | 读数的格式化函数 / 单位后缀 |

名次换位交给 ECharts 官方的 `series.realtimeSort`：数据**保持 items 原始顺序**，
只由 `yAxis.max` 控制露出前 N 名；自己先排好序再喂进去会让换位动画变成瞬移。

`chrome`（默认 `true`）渲染自带头部（帧标签 + 播放/暂停 + 帧计数 + 进度条）；
宿主已有抬头时置 `false`。面板暴露 `seek(frame)` / `play()` / `pause()` / `isPlaying()`，
点条时抛 `@select="{ type: 'race', id, label, value }"`。
系统开启「减少动态效果」时自动不插值，直接跳帧。

## 引擎切换

- 默认 `engine="echarts"`，传 `engine="d3"` 走 d3-sankey；
- `type="flow"` 固定走 G6（`@antv/g6` 官方「资金流向图」实现），此时 `engine` 被忽略；
- 可选开 `engine-selector`，渲染一个前台引擎切换条。

## 流线图（type="flow"）数据模型

树结构，节点字段对应官方示例：

```ts
{
  id: 'root',
  name: '资金中心',
  label: '100000000',        // 金额
  currency: '元',
  variableName: '占比',      // 变量名
  variableValue: 0.35,       // 涨跌值 (0~1) → 百分比
  variableUp: true,          // 涨/跌 → 三角朝向
  status: 'G',               // B/R/Y/G/DI → 涨跌配色
  rate: 0.62,                // 进度条比例
  children: [
    { id:'c1', name:'地产', label:'35000000', currency:'元',
      variableName:'较上季度', variableValue:-0.12, variableUp:false, status:'R', rate:0.3 }
  ]
}
```

## 异步加载

ECharts 是同步轻量路径；d3 与 G6 引擎经 `ReAsync` 异步按需 `import()`（源码见
`engines/D3Chart.vue` / `flow/ReChartFlow.vue`），带统一 loading 骨架与错误重试，
可在 `#loading` / `#error` 插槽中自定义。

## 组件目录

```text
components/ReChart/
├── index.ts                 # 主题化导出 + 类型再导出
├── ReChart.vue              # 聚合面板（echarts 同步；d3/g6 走 ReAsync）
├── types.ts                 # 通用 props / 各数据结构的契约类型
├── contract.ts              # 形状校验 + 公共几何 / 配色
├── TopologyChart.vue        # 内置：链路拓扑
├── ContextWindowChart.vue   # 内置：上下文窗口
├── AtlasChart.vue           # 内置：关系星图
├── OrbitChart.vue           # 内置：权限轨道
├── MatrixChart.vue          # 内置：热力矩阵
├── RaceChart.vue            # 内置：动态竞速条形（官方 realtimeSort）
├── engines/
│   ├── echarts.ts           # 通用 type → EChartsOption 构建
│   └── D3Chart.vue          # d3-sankey 渲染引擎
└── flow/
    ├── ReChartFlow.vue      # G6 流线图组件
    └── treeNode.ts          # 复刻官方 fund-flow 自定义节点（tree-node）
```

## 事件

- `@ready="{ engine, instance }"`（echarts 引擎就绪）
- `@click` / `@mouseover` / `@mouseout`（echarts 引擎转发）
- `@select="{ type, id?, rowKey?, columnKey? }"`（星图节点 / 轨道环 / 矩阵行·列·单元格 / 竞速条目）

## 安装与验证

组件已注册到 `install.ts`（`ReChart`），并新增 `@repo/ui/re-chart` 子路径。
新增的直接依赖：`@antv/g`、`d3-sankey`（含本地类型声明 `d3-sankey.d.ts`）。

需在仓库根目录执行 `pnpm install` 让新依赖落盘，然后：

```bash
pnpm --filter @repo/ui typecheck   # 或 vue-tsc --noEmit
```