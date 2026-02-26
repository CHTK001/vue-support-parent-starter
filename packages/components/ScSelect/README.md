# ScSelect 选择器

基于 Element Plus Select 封装，支持 PixelUI 主题切换。

## 基础用法

```vue
<template>
  <sc-select v-model="value" placeholder="Select">
    <el-option
      v-for="item in options"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    />
  </sc-select>
</template>

<script setup>
import { ref } from 'vue'

const value = ref('')
const options = [
  { value: 'Option1', label: 'Option1' },
  { value: 'Option2', label: 'Option2' },
  { value: 'Option3', label: 'Option3' },
  { value: 'Option4', label: 'Option4' },
  { value: 'Option5', label: 'Option5' },
]
</script>
```

## 属性

支持 Element Plus Select 的所有属性。

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| model-value / v-model | 绑定值 | string / number / boolean / object / array | - |
| multiple | 是否多选 | boolean | false |
| disabled | 是否禁用 | boolean | false |
| size | 输入框尺寸 | string | default |
| clearable | 是否可以清空选项 | boolean | false |
| placeholder | 占位符 | string | Select |
| ... | 其他 Element Plus Select 属性 | - | - |

## 事件

支持 Element Plus Select 的所有事件。

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| change | 选中值发生变化时触发 | val |
| visible-change | 下拉框出现/隐藏时触发 | visible |
| remove-tag | 多选模式下移除tag时触发 | tag |
| clear | 可清空的单选模式下用户点击清空按钮时触发 | - |
| blur | 当 input 失去焦点时触发 | (event: Event) |
| focus | 当 input 获得焦点时触发 | (event: Event) |

## 插槽

支持 Element Plus Select 的所有插槽。

| 插槽名 | 说明 |
| --- | --- |
| default | Option 组件列表 |
| prefix | Select 组件头部内容 |
| empty | 无选项时的列表内容 |
| tag | 多选模式下自定义标签内容 |
| loading | 远程加载时的内容 |
| label | 自定义选中项的显示内容 |
| header | 下拉列表头部内容 |
| footer | 下拉列表底部内容 |
