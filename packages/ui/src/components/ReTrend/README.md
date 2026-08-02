# ReTrend 趋势标记

紧凑的趋势标签组件，根据数值正负与零自动选择图标与颜色。常用于统计卡片、监控看板、表格变化率列。

## 基础用法

```vue
<script setup lang="ts">
import ReTrend from "@repo/ui/re-trend";
</script>

<template>
  <!-- 上涨（红色） -->
  <ReTrend :model-value="12.5" suffix="%" />
  <!-- 下跌（绿色） -->
  <ReTrend :model-value="-3.2" suffix="%" />
  <!-- 持平（次级文字色） -->
  <ReTrend :model-value="0" />

  <!-- 带前缀 -->
  <ReTrend :model-value="128" prefix="同比 " suffix=" 万" />

  <!-- 反转语义：成本下降是好事 -->
  <ReTrend :model-value="-5" reverse suffix="%" />
</template>
```

## 语义规则

| `modelValue` | 语义       | 图标       | 默认颜色         |
| ------------ | ---------- | ---------- | ---------------- |
| `> 0`        | 上涨 (P)   | Top ▲      | danger（红）     |
| `< 0`        | 下跌 (N)   | Bottom ▼   | success（绿）    |
| `=== 0`      | 持平 (Z)   | Right ▶    | secondary        |

`reverse=true` 时颜色反转：上涨变绿、下跌变红（适用于「越低越好」场景，如成本、错误率）。

## Props

| 字段         | 类型      | 默认值 | 说明                         |
| ------------ | --------- | ------ | ---------------------------- |
| `modelValue` | `number`  | `0`    | 趋势数值（正/负/零）          |
| `prefix`     | `string`  | `""`   | 前缀文本                     |
| `suffix`     | `string`  | `""`   | 后缀文本                     |
| `reverse`    | `boolean` | `false`| 反转颜色语义                 |

> 图标使用 `ReIcon` 组件，依赖 Element Plus Icons。如需替换为业务图标，可直接在 `ReIcon` 传入其他 name。