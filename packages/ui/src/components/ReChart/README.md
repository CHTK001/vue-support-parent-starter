# ReChart —— 聚合图表组件

聚合图表面板，把「图类型 + 渲染引擎」统一成一句话语法。支持三种渲染后端：

| `type` | 引擎 | 说明 |
|--------|------|------|
| `bar` / `line` | `echarts`（默认） | 柱状 / 折线，传 `categories` + `series` 即可 |
| `sankey` | `echarts` 或 `d3` | 桑基/流线图，传 `sankey.nodes` + `sankey.links` |
| `pie` / `scatter` / `gauge` / `custom` | `echarts` | 需直接传完整 `option` |
| `flow` | `@antv/g6`（固定） | 资金流/决策流线图，传 `data` 树结构 |

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
```

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
├── types.ts                 # 通用 props / 数据结构
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

## 安装与验证

组件已注册到 `install.ts`（`ReChart`），并新增 `@repo/ui/re-chart` 子路径。
新增的直接依赖：`@antv/g`、`d3-sankey`（含本地类型声明 `d3-sankey.d.ts`）。

需在仓库根目录执行 `pnpm install` 让新依赖落盘，然后：

```bash
pnpm --filter @repo/ui typecheck   # 或 vue-tsc --noEmit
```