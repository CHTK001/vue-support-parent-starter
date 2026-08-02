# ReStatusIndicator 状态指示器

一个小巧的状态点组件，支持 5 种主题色与脉冲动画。常用于监控看板、表格行状态、列表激活态标记。

## 基础用法

```vue
<script setup lang="ts">
import ReStatusIndicator from "@repo/ui/re-status-indicator";
</script>

<template>
  <!-- 普通状态点 -->
  <ReStatusIndicator type="success" />
  <ReStatusIndicator type="warning" />
  <ReStatusIndicator type="danger" />
  <ReStatusIndicator type="info" />

  <!-- 脉冲动画：常用于「运行中」「加载中」 -->
  <ReStatusIndicator type="success" pulse />
  <ReStatusIndicator type="warning" pulse />
</template>
```

## 配合文本

```vue
<el-row align="middle" :gutter="8">
  <el-col><ReStatusIndicator type="success" pulse /></el-col>
  <el-col>服务运行中</el-col>
</el-row>
```

## Props

| 字段   | 类型                                                     | 默认值      | 说明             |
| ------ | -------------------------------------------------------- | ----------- | ---------------- |
| `type` | `'primary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'primary'` | 颜色类型         |
| `pulse`| `boolean`                                                | `false`     | 是否开启脉冲动画 |

颜色直接引用 Element Plus 主题色（`--el-color-*`），跟随主题切换。