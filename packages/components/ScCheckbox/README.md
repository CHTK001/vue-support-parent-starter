# ScCheckbox 复选框

基于 Element Plus Checkbox 封装，支持 PixelUI 主题切换。

## 基础用法

```vue
<template>
  <sc-checkbox v-model="checked1" label="Option 1" />
  <sc-checkbox v-model="checked2" label="Option 2" />
</template>

<script setup>
import { ref } from 'vue'

const checked1 = ref(true)
const checked2 = ref(false)
</script>
```

## 复选框组

```vue
<template>
  <sc-checkbox-group v-model="checkList">
    <sc-checkbox label="Option A" />
    <sc-checkbox label="Option B" />
    <sc-checkbox label="Option C" />
  </sc-checkbox-group>
</template>

<script setup>
import { ref } from 'vue'

const checkList = ref(['Option A', 'Option C'])
</script>
```

## 属性

支持 Element Plus Checkbox 的所有属性。

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| model-value / v-model | 绑定值 | string / number / boolean | - |
| label | Checkbox 的 value | string / number / boolean / object | - |
| true-label | 选中时的值 | string / number | - |
| false-label | 没有选中时的值 | string / number | - |
| disabled | 是否禁用 | boolean | false |
| border | 是否显示边框 | boolean | false |
| size | Checkbox 的尺寸 | string | - |
| checked | 当前是否勾选 | boolean | false |
| indeterminate | 设置不确定状态，仅负责样式控制 | boolean | false |

## 事件

支持 Element Plus Checkbox 的所有事件。

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| change | 绑定值变化时触发的事件 | 更新后的值 |

## ScCheckboxGroup 属性

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| model-value / v-model | 绑定值 | array | [] |
| size | 多选框组尺寸 | string | - |
| disabled | 是否禁用 | boolean | false |
| min | 可被勾选的 checkbox 的最小数量 | number | - |
| max | 可被勾选的 checkbox 的最大数量 | number | - |
| text-color | 按钮形式的 Checkbox 激活时的文本颜色 | string | #ffffff |
| fill | 按钮形式的 Checkbox 激活时的填充色和边框色 | string | #409EFF |

## ScCheckboxGroup 事件

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| change | 绑定值变化时触发的事件 | 更新后的值 |
