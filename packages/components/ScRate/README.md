# ScRate 评分

基于 Element Plus Rate 封装，支持 PixelUI 主题切换。

## 基础用法

```vue
<template>
  <sc-rate v-model="value" />
</template>

<script setup>
import { ref } from 'vue'

const value = ref(3)
</script>
```

## 属性

支持 Element Plus Rate 的所有属性。

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| model-value / v-model | 绑定值 | number | 0 |
| max | 最大分值 | number | 5 |
| disabled | 是否为只读 | boolean | false |
| allow-half | 是否允许半选 | boolean | false |
| low-threshold | 低分和中等分数的界限值，值本身被划分在低分中 | number | 2 |
| high-threshold | 高分和中等分数的界限值，值本身被划分在高分中 | number | 4 |
| colors | icon 的颜色 | array / object | ['#F7BA2A', '#F7BA2A', '#F7BA2A'] |
| void-color | 未选中 icon 的颜色 | string | #C6D1DE |
| disabled-void-color | 只读时未选中 icon 的颜色 | string | #EFF2F7 |
| icons | icon 的图标 | array / object | [StarFilled, StarFilled, StarFilled] |
| void-icon | 未选中 icon 的图标 | string / component | StarFilled |
| disabled-void-icon | 只读时未选中 icon 的图标 | string / component | StarFilled |
| show-text | 是否显示辅助文字，若为真，则会从 texts 数组中选取当前分数对应的文字内容 | boolean | false |
| show-score | 是否显示当前分数，show-score 和 show-text 不能同时为真 | boolean | false |
| text-color | 辅助文字的颜色 | string | #1F2D3D |
| texts | 辅助文字数组 | array | ['Extremely bad', 'Disappointed', 'Fair', 'Satisfied', 'Surprise'] |
| score-template | 分数显示模板 | string | {value} |
| size | 评分组件尺寸 | string | default |
| clearable | 是否可以重置值为 0 | boolean | false |
| id | 原生 id 属性 | string | - |
| label | 评分组件的 label | string | - |

## 事件

支持 Element Plus Rate 的所有事件。

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| change | 分值改变时触发 | value |
