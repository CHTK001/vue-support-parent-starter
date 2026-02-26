# ScColorPicker 颜色选择器

基于 Element Plus ColorPicker 封装，支持 PixelUI 主题切换。

## 基础用法

```vue
<template>
  <sc-color-picker v-model="color" />
</template>

<script setup>
import { ref } from 'vue'

const color = ref('#409EFF')
</script>
```

## 属性

支持 Element Plus ColorPicker 的所有属性。

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| model-value / v-model | 绑定值 | string | - |
| disabled | 是否禁用 | boolean | false |
| size | 尺寸 | string | - |
| show-alpha | 是否支持透明度选择 | boolean | false |
| color-format | 写入 v-model 的颜色格式 | string | hex (show-alpha 为 false) / rgb (show-alpha 为 true) |
| popper-class | ColorPicker 下拉框的类名 | string | - |
| predefine | 预定义颜色 | array | - |
| validate-event | 输入时是否触发表单验证 | boolean | true |
| tabindex | ColorPicker 的 tabindex | string / number | - |
| id | 原生 id 属性 | string | - |
| label | ColorPicker 的 aria-label 属性 | string | - |
| title | ColorPicker 的 title 属性 | string | - |

## 事件

支持 Element Plus ColorPicker 的所有事件。

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| change | 当绑定值变化时触发 | value |
| active-change | 面板中当前显示的颜色发生改变时触发 | value |
| focus | 当 input 获得焦点时触发 | (event: FocusEvent) |
| blur | 当 input 失去焦点时触发 | (event: FocusEvent) |
