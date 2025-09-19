# ScSelect 组件

ScSelect 是一个功能强大的多布局选择器组件，支持多种显示模式和交互方式，适用于各种选择场景。

## 功能特性

- 🎨 **多种布局模式**：支持 select、card、pill、dropdown、filter、table、tree 七种布局
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

### 5. 表格布局 (table)

```vue
<template>
  <ScSelect
    v-model="selectedValue"
    :options="tableOptions"
    layout="table"
    :table-columns="tableColumns"
    :table-page-size="10"
    :table-remote-search="true"
    height="400px"
  />
</template>

<script setup>
const selectedValue = ref('')
const tableOptions = [
  { label: '用户1', value: 'user1', email: 'user1@example.com', status: '活跃' },
  { label: '用户2', value: 'user2', email: 'user2@example.com', status: '禁用' }
]
const tableColumns = [
  { prop: 'label', label: '用户名', minWidth: '120px' },
  { prop: 'email', label: '邮箱', minWidth: '180px' },
  { prop: 'status', label: '状态', minWidth: '80px' }
]
</script>
```

### 6. 树形布局 (tree)

```vue
<template>
  <ScSelect
    v-model="selectedValue"
    :options="treeOptions"
    layout="tree"
    :multiple="false"
    :tree-props="{ children: 'children', label: 'label' }"
    tree-node-key="value"
    tree-icon-prop="icon"
    tree-desc-prop="desc"
    :tree-show-search="true"
    tree-search-placeholder="搜索节点"
    :tree-show-actions="true"
    :tree-default-expand-all="false"
    :tree-expand-on-click-node="false"
    :tree-check-strictly="false"
    :tree-leaf-only="false"
    height="300px"
  />
</template>

<script setup>
const selectedValue = ref('')
const treeOptions = [
  {
    label: '一级节点1',
    value: 'level1-1',
    icon: 'ep:folder',
    desc: '这是一级节点',
    children: [
      {
        label: '二级节点1-1',
        value: 'level2-1-1',
        icon: 'ep:document',
        desc: '这是二级节点'
      },
      {
        label: '二级节点1-2',
        value: 'level2-1-2',
        icon: 'ep:document',
        desc: '这是二级节点',
        children: [
          {
            label: '三级节点1-2-1',
            value: 'level3-1-2-1',
            icon: 'ep:document',
            desc: '这是三级节点'
          }
        ]
      }
    ]
  },
  {
    label: '一级节点2',
    value: 'level1-2',
    icon: 'ep:folder',
    desc: '这是一级节点',
    children: [
      {
        label: '二级节点2-1',
        value: 'level2-2-1',
        icon: 'ep:document',
        desc: '这是二级节点'
      }
    ]
  }
]
</script>
```

#### 树形布局多选模式

```vue
<template>
  <ScSelect
    v-model="selectedValues"
    :options="treeOptions"
    layout="tree"
    :multiple="true"
    :tree-check-strictly="true"
    :tree-leaf-only="true"
    height="400px"
  />
</template>

<script setup>
const selectedValues = ref([])
</script>
```

## API

### Props

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| modelValue | String/Array/Object | - | 绑定值 |
| options | Array | [] | 选项数据 |

| layout | String | 'select' | 布局模式：select/card/pill/dropdown/filter/table/tree |
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
| customOperators | Array | [] | 自定义运算符列表，格式：[{label: '显示名', value: '值'}] |
| fieldMapping | Object | {} | 字段映射配置，用于将显示字段映射为实际字段名 |
| strictMode | Boolean | false | 严格模式，为true时过滤空值条件 |
| sqlTablePrefix | String | '' | SQL输出时的表名前缀 |
| showOperator | Boolean | true | 是否显示运算符选择 |
| tableColumns | Array | [] | 表格布局的列配置 |
| tablePageSize | Number | 10 | 表格布局的页大小 |
| tableRemoteSearch | Boolean | false | 表格布局是否启用远程搜索 |
| treeProps | Object | {children: 'children', label: 'label', disabled: 'disabled'} | 树节点配置 |
| treeNodeKey | String | 'value' | 树节点唯一标识字段 |
| treeIconProp | String | 'icon' | 树节点图标字段 |
| treeDescProp | String | 'desc' | 树节点描述字段 |
| treeShowSearch | Boolean | true | 是否显示搜索框 |
| treeSearchPlaceholder | String | '请输入关键词搜索' | 搜索框占位符 |
| treeShowActions | Boolean | true | 是否显示操作栏 |
| treeDefaultExpandAll | Boolean | false | 是否默认展开所有节点 |
| treeExpandOnClickNode | Boolean | false | 是否在点击节点时展开/收起节点 |
| treeCheckStrictly | Boolean | false | 在显示复选框的情况下，是否严格的遵循父子不互相关联的做法 |
| treeLeafOnly | Boolean | false | 是否只能选择叶子节点 |

### Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| change | value | 选中值变化时触发 |
| update:modelValue | value | 更新绑定值 |
| filterChange | output | 过滤条件变化时触发，返回格式化后的输出 |
| formatChange | {format, data, originalData} | 输出格式变化时触发，包含格式类型和数据 |
| node-click | (data, node) | 树形布局节点点击时触发 |
| check | (data, checked, indeterminate) | 树形布局复选框变化时触发 |
| current-change | (data, node) | 树形布局当前选中节点变化时触发 |

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

## FilterLayout 组件高级配置

### 父组件参数配置

```vue
<template>
  <FilterLayout
    v-model="filterData"
    :options="filterOptions"
    :output-format="'sql'"
    :custom-operators="customOps"
    :field-mapping="fieldMap"
    :strict-mode="true"
    :sql-table-prefix="'t1'"
    @filter-change="handleFilterChange"
    @format-change="handleFormatChange"
  />
</template>

<script setup>
const filterData = ref([])
const customOps = [
  { label: '正则匹配', value: 'regex' },
  { label: '模糊查询', value: 'fuzzy' }
]
const fieldMap = {
  '用户名': 'username',
  '创建时间': 'create_time'
}

const handleFilterChange = (output) => {
  console.log('过滤输出:', output)
}

const handleFormatChange = ({ format, data, originalData }) => {
  console.log('格式:', format, '数据:', data, '原始:', originalData)
}
</script>
```

### 多种数据格式输出示例

#### SQL格式输出
```javascript
// 输入条件：用户名包含"admin"，状态等于"active"
// SQL输出：
"t1.username LIKE '%admin%' AND t1.status = 'active'"
```

#### Lucene格式输出
```javascript
// 相同条件的Lucene输出：
"username:*admin* AND status:\"active\""
```

#### 数组格式输出
```javascript
// 相同条件的数组输出：
[
  {
    field: "username",
    operator: "include",
    value: "admin",
    originalField: "用户名",
    fieldType: "text",
    fieldLabel: "用户名"
  },
  {
    field: "status",
    operator: "=",
    value: "active",
    originalField: "状态",
    fieldType: "text",
    fieldLabel: "状态"
  }
]
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

### v2.2.0
- 新增FilterLayout组件父组件参数配置功能
- 新增SQL、Lucene、Array多种数据格式输出支持
- 新增自定义运算符配置
- 新增字段映射功能
- 新增严格模式和表前缀配置
- 完善formatChange事件，提供更丰富的输出信息

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