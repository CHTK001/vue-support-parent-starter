# ScSelect 组件

ScSelect 是一个功能强大的多布局选择器组件，支持多种显示模式和交互方式，适用于各种选择场景。

## 功能特性

- 🎨 **多种布局模式**：支持 select、card、pill、dropdown、filter 五种布局
- 🔄 **单选/多选**：灵活的选择模式，支持选择数量限制
- 📱 **响应式设计**：自适应不同屏幕尺寸
- 🎯 **批量操作**：支持全选、反选、清空等批量操作
- 🎪 **丰富样式**：支持图标、自定义样式和主题
- 📊 **过滤器模式**：支持分类筛选和条件组合
- 🌳 **结果格式化**：支持多种输出格式，包括二叉树结构

## 安装

```bash
npm install @repo/components
```

## 基础用法

### 基本选择器

```vue
<template>
  <ScSelect
    v-model="selectedValue"
    :options="options"
    placeholder="请选择"
  />
</template>

<script setup>
import { ref } from 'vue'
import ScSelect from '@repo/components/ScSelect'

const selectedValue = ref('')
const options = [
  { label: '选项1', value: 'option1' },
  { label: '选项2', value: 'option2' },
  { label: '选项3', value: 'option3' }
]
</script>
```

### 多选模式

```vue
<template>
  <ScSelect
    v-model="selectedValues"
    :options="options"
    multiple
    :limit="3"
    placeholder="请选择多个选项"
  />
</template>

<script setup>
const selectedValues = ref([])
</script>
```

## 布局模式

### 1. 卡片布局 (card)

```vue
<template>
  <ScSelect
    v-model="selectedValue"
    :options="options"
    layout="card"
    :columns="3"
    :gap="16"
  />
</template>
```

### 2. 药丸布局 (pill)

```vue
<template>
  <ScSelect
    v-model="selectedValue"
    :options="options"
    layout="pill"
    :gap="8"
  />
</template>
```

### 3. 下拉布局 (dropdown)

```vue
<template>
  <ScSelect
    v-model="selectedValue"
    :options="options"
    layout="dropdown"
    dropdown-title="选择选项"
    dropdown-placeholder="请选择"
  />
</template>
```

### 4. 过滤器布局 (filter)

```vue
<template>
  <ScSelect
    v-model="filterValues"
    :options="filterOptions"
    layout="filter"
    :label-width="100"
    output-format="default"
    filter-output-format="sql"
    filter-operator="gt"
    filter-field="createTime"
  />
</template>

<script setup>
const filterValues = ref({})
const filterOptions = [
  {
    key: 'category',
    title: '分类',
    multiple: true,
    options: [
      { label: '全部', value: 'all' },
      { label: '电子产品', value: 'electronics' },
      { label: '服装', value: 'clothing' }
    ]
  },
  {
    key: 'brand',
    title: '品牌',
    multiple: false,
    options: [
      { label: '全部', value: 'all' },
      { label: '苹果', value: 'apple' },
      { label: '华为', value: 'huawei' }
    ]
  }
]
</script>
```

## API

### Props

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| modelValue | String/Array/Object | - | 绑定值 |
| options | Array | [] | 选项数据 |

| layout | String | 'select' | 布局模式：select/card/pill/dropdown/filter |
| multiple | Boolean | false | 是否多选 |
| limit | Number | 0 | 多选时的最大选择数量，0表示无限制 |
| columns | Number | 3 | 卡片布局的列数 |
| gap | Number | 8 | 选项间距 |
| width | Number | 120 | 选项宽度 |
| height | Number | - | 选项高度 |
| iconPosition | String | 'center' | 图标位置：left/center/right |
| dropdownIcon | String | 'ep:arrow-down' | 下拉图标 |
| dropdownTitle | String | '请选择' | 下拉标题 |
| dropdownPlaceholder | String | '请选择选项' | 下拉占位符 |
| shape | String | 'default' | 形状：default/round |
| dropdownDirection | String | 'vertical' | 下拉方向：vertical/horizontal |
| dropdownCol | Number | 1 | 下拉列数 |
| displayMode | String | 'default' | 显示模式：default/large |
| showBatchActions | Boolean | true | 是否显示批量操作 |
| maxCollapseTags | Number | 1 | 多选时最多显示的标签数 |
| labelWidth | Number | 80 | 过滤器模式的标签宽度 |
| outputFormat | String | 'default' | 输出格式：default(原始格式)/array(数组格式)/sql(SQL格式)/lucene(Lucene格式) |
| filterOutputFormat | String | 'default' | 过滤器模式输出格式：default/array/sql/lucene |
| filterOperator | String | 'in' | 过滤器模式操作符：in/eq/ne/gt/gte/lt/lte/like/between |
| filterField | String | 'field' | 过滤器模式字段名 |
| outputValueTypeToArray | Boolean | false | 是否将输出值转为数组格式 |

### Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| change | value | 选中值变化时触发 |
| update:modelValue | value | 更新绑定值 |

### Slots

| 插槽名 | 参数 | 说明 |
|--------|------|------|
| default | { option, selected } | 自定义选项内容 |
| icon | { option } | 自定义图标 |
| label | { option } | 自定义标签 |

## 输出格式

### Default格式（默认）
```javascript
// 过滤器模式 - 单选示例
{
  category: ['electronics'],
  brand: ['apple']
}

// 过滤器模式 - 多选示例
{
  category: ['electronics', 'clothing'],
  brand: ['apple']
}

// 普通选择器模式
// 单选: "option1"
// 多选: ["option1", "option2"]
```

### Array格式
```javascript
// 转换为数组格式
['electronics', 'apple']
```

### SQL格式
```javascript
// 转换为SQL WHERE条件
"category IN ('electronics', 'clothing') AND brand = 'apple'"
```

### Lucene格式 (lucene)

```javascript
// 等于
"category:electronics AND brand:apple"

// 大于
"createTime:{2023-01-01 TO *}"

// 多选
"category:(electronics OR clothing) AND brand:apple"

// 范围
"createTime:[2023-01-01 TO 2023-12-31]"
```

## 样式定制

### CSS 变量

```css
:root {
  --sc-select-border-radius: 4px;
  --sc-select-border-color: var(--el-border-color);
  --sc-select-hover-color: var(--el-color-primary-light-7);
  --sc-select-active-color: var(--el-color-primary);
  --sc-select-active-bg: var(--el-color-primary-light-9);
}
```

### 自定义样式类

```vue
<template>
  <ScSelect
    v-model="selectedValue"
    :options="options"
    class="custom-select"
  />
</template>

<style>
.custom-select .card-selector-item {
  border-radius: 16px;
  background-color: #f0f9ff;
}

.custom-select .card-selector-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.custom-select .card-selector-item.active {
  background-color: #0ea5e9;
  color: white;
}
</style>
```

## 高级用法

### 带图标的选项

```vue
<template>
  <ScSelect
    v-model="selectedValue"
    :options="iconOptions"
    layout="card"
    icon-position="left"
  />
</template>

<script setup>
const iconOptions = [
  { label: '首页', value: 'home', icon: 'ep:home-filled' },
  { label: '用户', value: 'user', icon: 'ep:user' },
  { label: '设置', value: 'setting', icon: 'ep:setting' }
]
</script>
```

### 远程图标

```vue
<script setup>
const remoteIconOptions = [
  { 
    label: 'GitHub', 
    value: 'github', 
    icon: 'https://github.com/favicon.ico' 
  }
]
</script>
```

### 复杂过滤器

```vue
<template>
  <ScSelect
    v-model="complexFilter"
    :options="complexFilterOptions"
    layout="filter"
    output-format="default"
    @change="handleFilterChange"
  />
</template>

<script setup>
const complexFilter = ref({})

const complexFilterOptions = [
  {
    key: 'status',
    title: '状态',
    multiple: true,
    options: [
      { label: '全部', value: 'all' },
      { label: '启用', value: 'active', icon: 'ep:check' },
      { label: '禁用', value: 'inactive', icon: 'ep:close' }
    ]
  },
  {
    key: 'type',
    title: '类型',
    multiple: false,
    options: [
      { label: '全部', value: 'all' },
      { label: '管理员', value: 'admin' },
      { label: '普通用户', value: 'user' }
    ]
  }
]

const handleFilterChange = (value) => {
  console.log('过滤条件变化:', value)
  // 可以直接用于构建 SQL 查询
}
</script>
```

## 注意事项

1. **性能优化**：大量选项时建议使用虚拟滚动或分页加载
2. **响应式**：组件会自动适应容器宽度，建议设置合适的 `columns` 值
3. **图标加载**：远程图标可能存在加载延迟，建议使用本地图标库
4. **输出格式**：二叉树格式适用于复杂查询条件的构建
5. **样式覆盖**：使用 `:deep()` 选择器来覆盖组件内部样式

## 更新日志

### v2.1.0
- 新增过滤器布局模式
- 新增二叉树输出格式
- 新增批量操作功能
- 优化响应式布局

### v2.0.0
- 重构组件架构
- 新增多种布局模式
- 新增图标支持
- 优化性能和用户体验

### v1.x.x
- 基础选择器功能
- 单选/多选支持
- 基本样式定制

## 许可证

MIT License