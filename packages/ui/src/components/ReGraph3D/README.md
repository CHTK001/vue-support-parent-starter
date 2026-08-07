# ReGraph3D —— 3D 力导向关系图

基于 [three.js](https://threejs.org/) + [d3-force](https://github.com/d3/d3-force) 实现的 3D 力导向关系图，算法与 [3d-force-graph](https://github.com/vasturiano/3d-force-graph) 一致，但作为内嵌实现无需额外安装 npm 包，减少依赖。

## 适用场景

- 知识图谱的 3D 可视化
- 网络拓扑展示
- 大规模社交关系图（千节点级仍可流畅）
- 仪表盘背景动态图

## 安装

```ts
import ReGraph3D from "@repo/ui/re-graph-3d";
```

## Props

| 字段                | 类型                       | 默认值                                          | 说明 |
| ------------------- | -------------------------- | ----------------------------------------------- | ---- |
| `data`              | `Graph3DData`              | —                                               | `{ nodes, links }` |
| `nodes`             | `Graph3DNode[]`            | —                                               | 节点列表（与 data 二选一）|
| `links`             | `Graph3DLink[]`            | —                                               | 连线列表（与 data 二选一）|
| `height`            | `string \| number`         | `"100%"`                                        | 容器高度 |
| `width`             | `string \| number`         | `"100%"`                                        | 容器宽度 |
| `nodeColors`        | `Record<string, string>`   | 见下方                                          | 按 group 配色 |
| `nodeRelSize`       | `number`                   | 4                                               | 节点尺寸基数（实际尺寸 = √(val) × nodeRelSize）|
| `backgroundColor`   | `string`                   | `"transparent"`                                 | CSS 颜色 |
| `showNodeLabel`     | `boolean`                  | true                                            | 是否显示节点文本 |
| `showLinkLabel`     | `boolean`                  | false                                           | 是否显示连线文本 |
| `linkWidth`         | `number`                   | 1                                               | 连线宽度 |
| `linkArrowLength`   | `number`                   | 6                                               | 方向箭头长度（0 = 不显示）|
| `forceChargeStrength` | `number`                 | -90                                             | 节点斥力（负值 = 排斥）|
| `forceLinkDistance` | `number`                   | 60                                              | 连线弹簧长度 |
| `forceCenterStrength` | `number`                 | 0.05                                            | 中心引力 |
| `cameraDistance`    | `number`                   | 800                                             | 相机距离 |
| `autoRotate`        | `boolean`                  | false                                           | 自动旋转 |
| `interactive`       | `boolean`                  | true                                            | 启用拖拽旋转 / 滚轮缩放 |
| `debug`             | `boolean`                  | false                                           | 调试信息 |

### 默认 nodeColors

```js
{
  default: '#5b8def',
  A: '#5b8def',
  B: '#22c55e',
  C: '#f59e0b',
  D: '#ef4444',
  E: '#a855f7',
}
```

## 数据契约

```ts
import type { Graph3DData, Graph3DNode, Graph3DLink } from "@repo/ui/re-graph-3d";

interface Graph3DNode {
  id: string;
  text?: string;
  group?: string;          // 用于按组配色
  val?: number;            // 决定节点大小（默认按度数计算）
  color?: string;          // 覆盖 group 默认色
  data?: Record<string, unknown>;
}
interface Graph3DLink {
  source: string;
  target: string;
  text?: string;
  color?: string;
  width?: number;
}
```

## Events

| 事件名        | 参数              | 说明 |
| ------------- | ----------------- | ---- |
| `ready`       | `(instance)`      | three.js 实例就绪 |
| `node-click`  | `(node)`          | 节点点击（default 主题） |
| `node-hover`  | `(node \| null)`  | 鼠标悬停进入/离开（default 主题） |

## Slots

| 插槽名     | 作用域                          | 说明 |
| ---------- | ------------------------------- | ---- |
| `toolbar`  | `{ instance }`                  | 工具栏扩展（default 主题）|
| `status`   | `{ data, instance }`            | 底部信息栏扩展（default 主题）|
| `overlay`  | `{ data, instance }`            | 画布叠加层（koi 主题）|

## 实例 API（`@ready` 事件）

```ts
const ins = ref<{
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  simulation: d3.Simulation<...>;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  zoomTo: (distance: number) => void;
  focusNode: (id: string) => void;
  fitView: () => void;
} | null>(null);

function onReady(ins: any) {
  ins.pause();      // 暂停力学模拟
  ins.resume();     // 恢复
  ins.restart();    // 重启（alpha 重置）
  ins.zoomTo(400);  // 设置相机距离
  ins.focusNode('1'); // 定位到节点
  ins.fitView();    // 重置相机
}
```

## 主题

| themeId   | 说明 |
| --------- | ---- |
| `default` | 完整功能（搜索框 / 工具栏 / 节点交互 / 底部信息栏）|
| `koi`     | 精简视图（无工具栏、无文本标签、自动旋转、适合仪表盘背景）|

通过 `@repo/config` 的 `themeId` 切换：

```ts
// config.ts
export default {
  other: { themeId: 'koi' } // 切换为精简 3D 背景
};
```

## 示例

### 1. 基础 3D 关系图

```vue
<script setup lang="ts">
import { ref } from "vue";
import ReGraph3D from "@repo/ui/re-graph-3d";

const data = ref({
  nodes: [
    { id: "1", text: "Alice", group: "A" },
    { id: "2", text: "Bob", group: "B" },
    { id: "3", text: "Charlie", group: "C" },
    { id: "4", text: "Diana", group: "A" },
    { id: "5", text: "Eve", group: "B" },
  ],
  links: [
    { source: "1", target: "2" },
    { source: "1", target: "3" },
    { source: "2", target: "3" },
    { source: "3", target: "4" },
    { source: "4", target: "5" },
    { source: "5", target: "1" },
  ],
});
</script>

<template>
  <div style="width: 100%; height: 600px;">
    <ReGraph3D :data="data" :auto-rotate="true" />
  </div>
</template>
```

### 2. 节点大小按度数自适应

```vue
<script setup lang="ts">
import { computed, ref } from "vue";
import ReGraph3D from "@repo/ui/re-graph-3d";

const raw = ref({
  nodes: [{ id: "1", text: "Hub" }, /* ... 100+ nodes ... */],
  links: [{ source: "1", target: "2" }, /* ... */],
});

// 按度数计算 val
const data = computed(() => {
  const degree: Record<string, number> = {};
  raw.value.links.forEach((l) => {
    degree[l.source] = (degree[l.source] || 0) + 1;
    degree[l.target] = (degree[l.target] || 0) + 1;
  });
  return {
    nodes: raw.value.nodes.map((n) => ({ ...n, val: degree[n.id] || 1 })),
    links: raw.value.links,
  };
});
</script>

<template>
  <ReGraph3D :data="data" :node-rel-size="3" />
</template>
```

### 3. 仪表盘背景（koi 主题）

```vue
<template>
  <div style="position: relative; width: 100%; height: 300px;">
    <ReGraph3D :data="data" :auto-rotate="true" :interactive="false" />
    <div style="position: absolute; inset: 0; pointer-events: none;">
      <!-- 叠加内容 -->
    </div>
  </div>
</template>
```

### 4. 与 2D ReGraph 共存

```vue
<el-row :gutter="16">
  <el-col :span="12">
    <ReGraph :data="data" mode="force" :height="500" />
  </el-col>
  <el-col :span="12">
    <ReGraph3D :data="data3d" :height="500" />
  </el-col>
</el-row>
```

## 性能建议

| 节点数 | 策略 |
| ------ | ---- |
| < 200  | 全量渲染，自动旋转无压力 |
| 200 ~ 1000 | 关闭 `showNodeLabel`，降低 `nodeRelSize` |
| 1000 ~ 5000 | 后端聚合数据，使用 koi 主题（无标签），降帧 |
| > 5000 | 服务端预计算初始坐标，关闭力导向 |

## 与 3d-force-graph 的差异

| 维度       | 3d-force-graph (npm)         | ReGraph3D (本组件)               |
| ---------- | ---------------------------- | -------------------------------- |
| 依赖       | 单独 npm 包，~150KB          | 内嵌实现，依赖 three + d3-force  |
| 主题切换   | 不支持                       | 支持 default / koi               |
| 工具栏     | 无                           | 内置缩放/旋转/重启/搜索          |
| 节点拾取   | 支持                         | 支持（default 主题）             |
| 方向箭头   | 需自行扩展                   | 内置                              |

## 依赖

- `three` ^0.185.x
- `d3-force` ^3.0.x
- `vue` ^3.5.x
