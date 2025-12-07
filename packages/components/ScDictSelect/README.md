# ScDictSelect 字典选择组件

基于后台 `SysDictItem` 的字典下拉选择组件，支持通过字典ID或字典编码加载字典项。

## 基本用法

```vue
<template>
  <!-- 通过字典ID加载 -->
  <ScDictSelect v-model="value" :dict-id="1" />
  
  <!-- 通过字典编码加载 -->
  <ScDictSelect v-model="value" dict-code="user_status" />
  
  <!-- 多选模式 -->
  <ScDictSelect v-model="values" :dict-id="1" multiple />
  
  <!-- 显示字典编码 -->
  <ScDictSelect v-model="value" :dict-id="1" show-code />
  
  <!-- 带刷新按钮 -->
  <ScDictSelect v-model="value" :dict-id="1" show-refresh />
  
  <!-- 自定义请求 -->
  <ScDictSelect v-model="value" :request="fetchCustomDict" />
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `v-model` | `string \| number \| array` | - | 绑定值 |
| `dictId` | `string \| number` | - | 字典ID |
| `dictCode` | `string` | - | 字典编码 |
| `placeholder` | `string` | `'请选择'` | 占位文本 |
| `disabled` | `boolean` | `false` | 禁用状态 |
| `size` | `'large' \| 'default' \| 'small'` | `'default'` | 尺寸 |
| `clearable` | `boolean` | `true` | 是否可清空 |
| `multiple` | `boolean` | `false` | 是否多选 |
| `collapseTags` | `boolean` | `true` | 多选时是否折叠标签 |
| `filterable` | `boolean` | `true` | 是否可搜索 |
| `remote` | `boolean` | `false` | 是否远程搜索 |
| `showCode` | `boolean` | `false` | 是否显示字典编码 |
| `showIcon` | `boolean` | `true` | 是否显示前缀图标 |
| `showRefresh` | `boolean` | `false` | 是否显示刷新按钮 |
| `immediate` | `boolean` | `true` | 是否立即加载 |
| `labelField` | `string` | `'sysDictItemName'` | 标签字段名 |
| `valueField` | `string` | `'sysDictItemCode'` | 值字段名 |
| `request` | `Function` | - | 自定义请求函数 |
| `options` | `Array` | - | 静态选项数据 |

## Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `change` | `(value, item)` | 选中值变化 |
| `visible-change` | `(visible)` | 下拉框显示状态变化 |
| `focus` | `(event)` | 获取焦点 |
| `blur` | `(event)` | 失去焦点 |
| `clear` | - | 清空 |
| `loaded` | `(options)` | 数据加载完成 |

## Methods

| 方法名 | 参数 | 说明 |
|--------|------|------|
| `refresh` | - | 刷新字典数据 |
| `loadDictData` | `(keyword?)` | 加载字典数据 |
| `getLabel` | `(value)` | 根据值获取标签 |
| `getItem` | `(value)` | 根据值获取完整字典项 |

## 自定义请求示例

```vue
<script setup>
const fetchCustomDict = async (params) => {
  const { keyword } = params;
  const res = await api.getCustomDict({ name: keyword });
  return res.data.map(item => ({
    sysDictItemName: item.label,
    sysDictItemCode: item.value
  }));
};
</script>

<template>
  <ScDictSelect v-model="value" :request="fetchCustomDict" />
</template>
```

## 静态数据示例

```vue
<script setup>
const staticOptions = [
  { sysDictItemName: '启用', sysDictItemCode: '1' },
  { sysDictItemName: '禁用', sysDictItemCode: '0' }
];
</script>

<template>
  <ScDictSelect v-model="value" :options="staticOptions" />
</template>
```
