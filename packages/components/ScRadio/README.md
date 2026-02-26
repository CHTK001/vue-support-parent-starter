# ScRadio 单选框

基于 Element Plus Radio 封装，支持 PixelUI 主题切换。

## 基础用法

```vue
<template>
  <sc-radio v-model="radio" label="1">Option 1</sc-radio>
  <sc-radio v-model="radio" label="2">Option 2</sc-radio>
</template>

<script setup>
import { ref } from 'vue'

const radio = ref('1')
</script>
```

## 单选框组

```vue
<template>
  <sc-radio-group v-model="radio">
    <sc-radio :label="3">Option A</sc-radio>
    <sc-radio :label="6">Option B</sc-radio>
    <sc-radio :label="9">Option C</sc-radio>
  </sc-radio-group>
</template>

<script setup>
import { ref } from 'vue'

const radio = ref(3)
</script>
```

## 属性

支持 Element Plus Radio 的所有属性。

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| model-value / v-model | 绑定值 | string / number / boolean | - |
| label | Radio 的 value | string / number / boolean | - |
| disabled | 是否禁用 | boolean | false |
| border | 是否显示边框 | boolean | false |
| size | Radio 的尺寸 | string | - |
| name | 原生 name 属性 | string | - |

## 事件

支持 Element Plus Radio 的所有事件。

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| change | 绑定值变化时触发的事件 | 选中的 Radio label 值 |

## ScRadioGroup 属性

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| model-value / v-model | 绑定值 | string / number / boolean | - |
| size | 单选框组尺寸 | string | - |
| disabled | 是否禁用 | boolean | false |
| text-color | 按钮形式的 Radio 激活时的文本颜色 | string | #ffffff |
| fill | 按钮形式的 Radio 激活时的填充色和边框色 | string | #409EFF |

## ScRadioGroup 事件

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| change | 绑定值变化时触发的事件 | 选中的 Radio label 值 |
