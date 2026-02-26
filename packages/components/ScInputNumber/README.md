# ScInputNumber 计数器

基于 Element Plus InputNumber 封装，支持 PixelUI 主题切换。

## 基础用法

```vue
<template>
  <sc-input-number v-model="num" :min="1" :max="10" />
</template>

<script setup>
import { ref } from 'vue'

const num = ref(1)
</script>
```

## 属性

支持 Element Plus InputNumber 的所有属性。

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| model-value / v-model | 绑定值 | number | 0 |
| min | 设置计数器允许的最小值 | number | -Infinity |
| max | 设置计数器允许的最大值 | number | Infinity |
| step | 计数器步长 | number | 1 |
| step-strictly | 是否只能输入 step 的倍数 | boolean | false |
| precision | 数值精度 | number | - |
| size | 计数器尺寸 | string | - |
| disabled | 是否禁用计数器 | boolean | false |
| controls | 是否使用控制按钮 | boolean | true |
| controls-position | 控制按钮位置 | string | - |
| name | 原生 name 属性 | string | - |
| label | 输入框关联的 label 文字 | string | - |
| placeholder | 输入框默认 placeholder | string | - |

## 事件

支持 Element Plus InputNumber 的所有事件。

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| change | 绑定值被改变时触发 | (currentValue: number | undefined, oldValue: number | undefined) |
| blur | 在组件 Input 失去焦点时触发 | (event: FocusEvent) |
| focus | 在组件 Input 获得焦点时触发 | (event: FocusEvent) |
