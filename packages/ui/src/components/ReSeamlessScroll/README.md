# ReSeamlessScroll 无缝滚动组件

支持上下左右四向无缝滚动，支持 hover 暂停、touch 拖动、滚轮滚动、单击步进。

整合自 [pureadmin ReSeamlessScroll](https://github.com/pure-admin/vue-pure-admin)，已按本仓库规范重写。

## 特性

- 四向无缝滚动：`top` / `bottom` / `left` / `right`
- 鼠标悬停暂停滚动
- 移动端 touch 拖动
- 鼠标滚轮滚动（垂直方向）
- 单行/单列步进（`singleHeight` / `singleWidth`）
- 左右切换按钮（`navigation: true`）
- 自动播放开关、单步延迟、rem 度量等细粒度配置
- 支持 `data` 长度判断：达到 `limitMoveNum` 才启动无缝滚动

## 安装

```ts
// 子路径引入
import ReSeamlessScroll from "@repo/ui/re-seamless-scroll";

// 或全局注册
import { installUi } from "@repo/ui";
await installUi(app, { components: ["ReSeamlessScroll"] });
```

## 基础用法

### 垂直向上滚动（默认）

```vue
<script setup lang="ts">
import { ref } from "vue";
import ReSeamlessScroll from "@repo/ui/re-seamless-scroll";

const list = ref(
  Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    title: `滚动条目 ${i + 1}`,
    desc: "无缝滚动测试数据",
  })),
);
</script>

<template>
  <div style="height: 300px; width: 300px;">
    <ReSeamlessScroll :data="list" :class-option="{ direction: 'top', limitMoveNum: 5 }">
      <div v-for="item in list" :key="item.id" class="scroll-item">
        <h4>{{ item.title }}</h4>
        <p>{{ item.desc }}</p>
      </div>
    </ReSeamlessScroll>
  </div>
</template>
```

### 水平向左滚动

```vue
<ReSeamlessScroll
  :data="list"
  :class-option="{ direction: 'left', step: 1, hoverStop: true }"
>
  <div class="scroll-item-inline" v-for="item in list" :key="item.id">
    {{ item.title }}
  </div>
</ReSeamlessScroll>
```

### 单行暂停滚动

```vue
<ReSeamlessScroll
  :data="list"
  :class-option="{
    direction: 'top',
    singleHeight: 36,
    waitTime: 1500,
    step: 1,
  }"
>
  <div v-for="item in list" :key="item.id" class="scroll-row">
    {{ item.title }}
  </div>
</ReSeamlessScroll>
```

### 手动分步切换（navigation）

```vue
<ReSeamlessScroll
  :data="list"
  :class-option="{
    direction: 'left',
    navigation: true,
    autoPlay: false,
    switchSingleStep: 120,
  }"
>
  <template #left-switch>
    <el-button circle>&lt;</el-button>
  </template>
  <template #right-switch>
    <el-button circle>&gt;</el-button>
  </template>

  <div v-for="item in list" :key="item.id" class="scroll-card">
    {{ item.title }}
  </div>
</ReSeamlessScroll>
```

## API

### Props

| 字段          | 类型                            | 默认值      | 说明                                       |
| ------------- | ------------------------------- | ----------- | ------------------------------------------ |
| `data`        | `unknown[]`                     | `[]`        | 列表数据；长度 ≥ `limitMoveNum` 才启动滚动 |
| `classOption` | `ReSeamlessScrollOptions`       | `{}`        | 滚动配置（与默认配置合并）                 |

#### ReSeamlessScrollOptions

| 字段                 | 类型                        | 默认值       | 说明                                       |
| -------------------- | --------------------------- | ------------ | ------------------------------------------ |
| `step`               | `number`                    | `1`          | 步长（每帧移动像素）                       |
| `limitMoveNum`       | `number`                    | `5`          | 启动无缝滚动的最小数据条数                 |
| `hoverStop`          | `boolean`                   | `true`       | hover 时是否暂停                           |
| `direction`          | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | 滚动方向                                   |
| `openTouch`          | `boolean`                   | `true`       | 是否开启移动端 touch                       |
| `singleHeight`       | `number`                    | `0`          | 单条数据高度（开启单步滚动）               |
| `singleWidth`        | `number`                    | `0`          | 单条数据宽度（开启单步滚动）               |
| `waitTime`           | `number`                    | `1000`       | 单步停止等待时间（ms）                     |
| `switchOffset`       | `number`                    | `30`         | 左右切换按钮偏移量                         |
| `autoPlay`           | `boolean`                   | `true`       | 是否自动播放                               |
| `navigation`         | `boolean`                   | `false`      | 是否显示左右切换按钮                       |
| `switchSingleStep`   | `number`                    | `134`        | 左右单步距离（px）                         |
| `switchDelay`        | `number`                    | `400`        | 切换动画时长（autoPlay=false 时）          |
| `switchDisabledClass`| `string`                    | `'disabled'` | 左右按钮不可用时的 class                   |
| `isSingleRemUnit`    | `boolean`                   | `false`      | `singleWidth`/`singleHeight` 是否使用 rem  |
| `key`                | `number \| string`          | `0`          | 多实例防冲突 key                           |

### Events

| 事件名       | 参数 | 说明                 |
| ------------ | ---- | -------------------- |
| `scrollEnd`  | —    | 滚动一圈结束时触发   |

### Slots

| 插槽名         | 说明                       |
| -------------- | -------------------------- |
| `default`      | 列表内容                   |
| `left-switch`  | 左侧切换按钮（`navigation: true`） |
| `right-switch` | 右侧切换按钮（`navigation: true`） |

### Expose

| 方法     | 说明                         |
| -------- | ---------------------------- |
| `reset`  | 重置位置并重新启动滚动       |

## 注意事项

1. `singleHeight` 与 `singleWidth` 必须有且仅有一个非零，作用是启用单步滚动
2. 启用单步滚动时，`step` 必须能整除 `singleHeight` 或 `singleWidth`，否则会抛错
3. `data` 长度小于 `limitMoveNum` 时不会启动无缝滚动，会显示原始列表
4. 同一页面多个实例时，务必设置不同的 `classOption.key`，避免 DOM ref 冲突
5. 切换 `direction` 后建议调用 `reset()` 重新初始化位置

## 样式建议

组件本身只设置结构与定位，列表项的样式由使用者控制。常见做法：

```vue
<style scoped>
.scroll-item {
  height: 40px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.scroll-item-inline {
  display: inline-block;
  width: 200px;
  height: 100px;
  margin-right: 12px;
}
</style>
```