# ScSearch 搜索组件

一个功能强大、高度可定制的Vue 3搜索表单组件，支持多种表单控件类型、防抖搜索、表单验证等功能。

## 特性

- 🚀 **Vue 3 + TypeScript**: 使用Composition API重构，提供完整的类型支持
- 🎨 **多种控件类型**: 支持输入框、选择器、日期选择器、时间选择器、级联选择器、开关等
- ⚡ **性能优化**: 内置防抖搜索、响应式布局优化
- 🔧 **高度可定制**: 支持自定义验证规则、样式配置
- 📱 **响应式设计**: 完美适配移动端和桌面端
- ♿ **无障碍访问**: 支持键盘导航和屏幕阅读器
- 🎯 **易于使用**: 简洁的API设计，开箱即用

## 安装

```bash
npm install @repo/components
```

## 基础用法

```vue
<template>
  <!-- 默认模式：只显示图标，只有搜索和重置按钮 -->
  <ScSearch :columns="searchColumns" :model-value="searchForm" @update:model-value="handleFormChange" @search="handleSearch" @reset="handleReset" />

  <!-- 显示图标+文字 -->
  <ScSearch :columns="searchColumns" :model-value="searchForm" button-mode="text" @update:model-value="handleFormChange" @search="handleSearch" @reset="handleReset" />

  <!-- 显示编辑按钮 -->
  <ScSearch :columns="searchColumns" :model-value="searchForm" :show-edit="true" @update:model-value="handleFormChange" @search="handleSearch" @reset="handleReset" @edit="handleEdit" />
</template>

<script setup lang="ts">
import { ref } from "vue";
import ScSearch, { type SearchFormItem } from "@repo/components/ScSearch";

// 搜索表单数据
const searchForm = ref({
  name: "",
  status: "",
  dateRange: []
});

// 搜索表单配置
const searchColumns: SearchFormItem[] = [
  {
    prop: "name",
    label: "用户名",
    type: "input",
    placeholder: "请输入用户名",
    clearable: true
  },
  {
    prop: "status",
    label: "状态",
    type: "select",
    placeholder: "请选择状态",
    clearable: true,
    children: [
      { label: "启用", value: 1 },
      { label: "禁用", value: 0 }
    ]
  },
  {
    prop: "dateRange",
    label: "创建时间",
    type: "daterange",
    placeholder: "请选择时间范围",
    clearable: true,
    valueFormat: "YYYY-MM-DD"
  }
];

// 处理表单变化
const handleFormChange = (form: Record<string, any>) => {
  searchForm.value = form;
};

// 处理搜索
const handleSearch = (form: Record<string, any>) => {
  console.log("搜索参数:", form);
  // 执行搜索逻辑
};

// 处理重置
const handleReset = (form: Record<string, any>) => {
  console.log("重置后的表单:", form);
};
</script>
```

## API

### Props

| 参数             | 说明                  | 类型                                                | 默认值   |
| ---------------- | --------------------- | --------------------------------------------------- | -------- |
| `showNumber`     | 默认显示的表单项数量  | `number`                                            | `4`      |
| `columns`        | 表单项配置            | `SearchFormItem[]`                                  | `[]`     |
| `enableDebounce` | 是否启用防抖搜索      | `boolean`                                           | `true`   |
| `debounceDelay`  | 防抖延迟时间(ms)      | `number`                                            | `300`    |
| `showReset`      | 是否显示重置按钮      | `boolean`                                           | `true`   |
| `showEdit`       | 是否显示编辑按钮      | `boolean`                                           | `false`  |
| `buttonMode`     | 按钮显示模式          | `'icon' \| 'text'`                                  | `'icon'` |
| `alignMode`      | 按钮和条件对齐方式    | `'space-between' \| 'flex-end' \| 'flex-start' \| 'center'` | `'space-between'` |
| `autoSearch`     | 值改变时是否自动触发搜索 | `boolean`                                        | `false`  |
| `rules`          | 表单验证规则          | `Record<string, any[]>`                             | `{}`     |
| `modelValue`     | 表单数据(支持v-model) | `Record<string, any>`                               | `{}`     |

### Events

| 事件名              | 说明               | 参数                                        |
| ------------------- | ------------------ | ------------------------------------------- |
| `update:modelValue` | 表单数据更新时触发 | `(value: Record<string, any>)`              |
| `search`            | 点击搜索按钮时触发 | `(form: Record<string, any>)`               |
| `reset`             | 点击重置按钮时触发 | `(form: Record<string, any>)`               |
| `edit`              | 点击编辑按钮时触发 | `(form: Record<string, any>, type: string)` |

### 暴露的方法

| 方法名         | 说明         | 参数                          | 返回值                |
| -------------- | ------------ | ----------------------------- | --------------------- |
| `validateForm` | 验证表单     | -                             | `Promise<boolean>`    |
| `clearForm`    | 清空表单     | -                             | `void`                |
| `setFormData`  | 设置表单数据 | `(data: Record<string, any>)` | `void`                |
| `getFormData`  | 获取表单数据 | -                             | `Record<string, any>` |
| `resetForm`    | 重置表单     | -                             | `void`                |

### SearchFormItem 类型定义

```typescript
interface SearchFormItem {
  /** 字段名 */
  prop: string;
  /** 标签 */
  label: string;
  /** 表单项类型 */
  type?: "input" | "textarea" | "select" | "datepicker" | "daterange" | "radio" | "checkbox" | "number" | "segmented" | "switch" | "cascader" | "time" | "timerange";
  /** 占位符 */
  placeholder?: string;
  /** 是否可清空 */
  clearable?: boolean;
  /** 表单项宽度（如：'200px', '50%'） */
  width?: string;
  /** 提示信息 */
  tooltip?: string;
  /** 是否需要管理员权限 */
  isAdmin?: boolean;
  /** 日期格式 */
  valueFormat?: string;
  /** 数字输入最小值 */
  min?: number;
  /** 数字输入最大值 */
  max?: number;
  /** 选项列表 */
  children?: Array<{ label: string; value: any }>;
  /** 是否必填 */
  required?: boolean;
  /** 验证规则 */
  rules?: any[];
  /** 是否禁用 */
  disabled?: boolean;
  /** 级联选择器配置 */
  cascaderProps?: any;
}
```

## 支持的表单控件类型

### 1. 输入框 (input)

```javascript
{
  prop: 'username',
  label: '用户名',
  type: 'input',
  placeholder: '请输入用户名',
  clearable: true
}
```

### 2. 文本域 (textarea)

```javascript
{
  prop: 'description',
  label: '描述',
  type: 'textarea',
  placeholder: '请输入描述信息'
}
```

### 3. 下拉选择器 (select)

```javascript
{
  prop: 'status',
  label: '状态',
  type: 'select',
  placeholder: '请选择状态',
  children: [
    { label: '启用', value: 1 },
    { label: '禁用', value: 0 }
  ]
}
```

### 4. 日期选择器 (datepicker)

```javascript
{
  prop: 'createDate',
  label: '创建日期',
  type: 'datepicker',
  placeholder: '请选择日期',
  valueFormat: 'YYYY-MM-DD'
}
```

### 5. 日期范围选择器 (daterange)

```javascript
{
  prop: 'dateRange',
  label: '时间范围',
  type: 'daterange',
  placeholder: '请选择时间范围',
  valueFormat: 'YYYY-MM-DD'
}
```

### 6. 时间选择器 (time)

```javascript
{
  prop: 'time',
  label: '时间',
  type: 'time',
  placeholder: '请选择时间',
  valueFormat: 'HH:mm:ss'
}
```

### 7. 时间范围选择器 (timerange)

```javascript
{
  prop: 'timeRange',
  label: '时间范围',
  type: 'timerange',
  placeholder: '请选择时间范围',
  valueFormat: 'HH:mm:ss'
}
```

### 8. 单选按钮组 (radio)

```javascript
{
  prop: 'gender',
  label: '性别',
  type: 'radio',
  children: [
    { label: '男', value: 'male' },
    { label: '女', value: 'female' }
  ]
}
```

### 9. 复选框组 (checkbox)

```javascript
{
  prop: 'hobbies',
  label: '爱好',
  type: 'checkbox',
  children: [
    { label: '读书', value: 'reading' },
    { label: '运动', value: 'sports' },
    { label: '音乐', value: 'music' }
  ]
}
```

### 10. 数字输入框 (number)

```javascript
{
  prop: 'age',
  label: '年龄',
  type: 'number',
  placeholder: '请输入年龄',
  min: 0,
  max: 120
}
```

### 11. 分段控制器 (segmented)

```javascript
{
  prop: 'type',
  label: '类型',
  type: 'segmented',
  children: [
    { label: '全部', value: 'all' },
    { label: '已完成', value: 'completed' },
    { label: '进行中', value: 'pending' }
  ]
}
```

### 12. 开关 (switch)

```javascript
{
  prop: 'enabled',
  label: '启用状态',
  type: 'switch'
}
```

### 13. 级联选择器 (cascader)

```javascript
{
  prop: 'region',
  label: '地区',
  type: 'cascader',
  placeholder: '请选择地区',
  children: [
    {
      value: 'beijing',
      label: '北京',
      children: [
        { value: 'chaoyang', label: '朝阳区' },
        { value: 'haidian', label: '海淀区' }
      ]
    }
  ],
  cascaderProps: {
    expandTrigger: 'hover'
  }
}
```

## 高级用法

### 按钮显示模式

```vue
<template>
  <!-- 只显示图标（默认） -->
  <ScSearch :columns="searchColumns" button-mode="icon" @search="handleSearch" />

  <!-- 显示图标+文字 -->
  <ScSearch :columns="searchColumns" button-mode="text" @search="handleSearch" />
</template>
```

### 表单验证

```vue
<template>
  <ScSearch ref="searchRef" :columns="searchColumns" :rules="validationRules" :model-value="searchForm" @search="handleSearch" />
</template>

<script setup lang="ts">
import { ref } from "vue";

const searchRef = ref();

const validationRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, max: 20, message: "用户名长度在3到20个字符", trigger: "blur" }
  ],
  email: [
    { required: true, message: "请输入邮箱地址", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱地址", trigger: "blur" }
  ]
};

const handleSearch = async (form: Record<string, any>) => {
  // 验证表单
  const isValid = await searchRef.value.validateForm();
  if (isValid) {
    console.log("搜索参数:", form);
    // 执行搜索逻辑
  }
};
</script>
```

### 自定义宽度

```vue
<script setup>
const searchColumns = [
  {
    prop: 'shortField',
    label: '短字段',
    type: 'input',
    width: '120px' // 固定宽度
  },
  {
    prop: 'longField',
    label: '长字段',
    type: 'input',
    width: '300px' // 较宽的字段
  },
  {
    prop: 'percentField',
    label: '百分比字段',
    type: 'input',
    width: '50%' // 百分比宽度
  }
]
</script>

<template>
  <ScSearch :columns="searchColumns" @search="handleSearch" />
</template>
```

### 自动搜索

```vue
<template>
  <!-- 启用自动搜索：值改变时自动触发搜索 -->
  <ScSearch
    :columns="columns"
    :model-value="form"
    :auto-search="true"
    @update:model-value="handleFormChange"
    @search="handleSearch"
  />
  
  <!-- 禁用自动搜索（默认）：只有点击搜索按钮才触发搜索 -->
  <ScSearch
    :columns="columns"
    :model-value="form"
    :auto-search="false"
    @update:model-value="handleFormChange"
    @search="handleSearch"
  />
</template>
```

### 对齐方式

```vue
<template>
  <!-- 两端对齐（默认）：条件在左，按钮在右 -->
  <ScSearch
    :columns="columns"
    align-mode="space-between"
    @search="handleSearch"
  />
  
  <!-- 右对齐：条件和按钮都在右侧 -->
  <ScSearch
    :columns="columns"
    align-mode="flex-end"
    @search="handleSearch"
  />
  
  <!-- 左对齐：条件和按钮都在左侧 -->
  <ScSearch
    :columns="columns"
    align-mode="flex-start"
    @search="handleSearch"
  />
  
  <!-- 居中对齐：条件和按钮都居中显示 -->
  <ScSearch
    :columns="columns"
    align-mode="center"
    @search="handleSearch"
  />
</template>

<script setup>
const handleSearch = (form) => {
  console.log('搜索参数:', form)
  // 执行搜索逻辑
}
</script>
```

## 迁移指南

### 从 v2.0.4 升级到 v2.0.5

**重大变更：移除了 `onSearch` 和 `onEdit` 属性**

**旧版本写法：**
```vue
<template>
  <ScSearch
    :columns="columns"
    :on-search="handleSearch"
    :on-edit="handleEdit"
  />
</template>
```

**新版本写法：**
```vue
<template>
  <ScSearch
    :columns="columns"
    @search="handleSearch"
    @edit="handleEdit"
  />
</template>
```

**变更原因：**
- 修复了点击搜索按钮触发两次事件的问题
- 统一使用 Vue 标准的事件机制
- 简化组件 API，提升代码可维护性

### 自定义插槽

```vue
<template>
  <ScSearch :columns="searchColumns">
    <!-- 自定义表单项 -->
    <template #customField="{ item, form }">
      <el-input v-model="form[item.prop]" placeholder="自定义输入框" prefix-icon="Search" />
    </template>
  </ScSearch>
</template>

<script setup lang="ts">
const searchColumns = [
  {
    prop: "customField",
    label: "自定义字段",
    type: "input" // 这个类型会被插槽覆盖
  }
];
</script>
```

### 管理员权限控制

```javascript
const searchColumns = [
  {
    prop: "publicField",
    label: "公开字段",
    type: "input"
  },
  {
    prop: "adminField",
    label: "管理员字段",
    type: "select",
    isAdmin: true, // 只有管理员可见
    children: [
      { label: "选项1", value: 1 },
      { label: "选项2", value: 2 }
    ]
  }
];
```

### 禁用防抖搜索

```vue
<template>
  <ScSearch :columns="searchColumns" :enable-debounce="false" @search="handleSearch" />
</template>
```

### 自定义防抖延迟

```vue
<template>
  <ScSearch :columns="searchColumns" :debounce-delay="500" @search="handleSearch" />
</template>
```

## 样式定制

组件支持通过CSS变量进行样式定制：

```css
.search-form {
  --el-color-primary: #409eff;
  --el-text-color-regular: #606266;
  --el-border-radius-base: 4px;
}
```

## 更新日志

### v2.0.6 (2024-01-XX)
- ✨ 新增alignMode属性，支持控制按钮和条件的对齐方式
- 🎨 支持四种对齐模式：两端对齐(space-between)、右对齐(flex-end)、左对齐(flex-start)、居中对齐(center)
- 🔧 默认使用两端对齐模式，保持向下兼容
- 🎨 优化按钮区域布局逻辑，提升界面灵活性

### v2.0.5 (2024-01-XX)
- 🐛 修复点击搜索按钮触发两次搜索事件的问题
- 🔧 移除废弃的onSearch和onEdit属性，统一使用emit事件
- 🎨 优化组件事件处理逻辑，避免重复触发

### v2.0.4 (2024-01-XX)
- ✨ 新增autoSearch属性，控制值改变时是否自动触发搜索（默认false）
- 🐛 修复select选择时多次触发onSearch事件的问题
- 🎨 优化表单数据监听逻辑，提升组件性能

### v2.0.3
- 修复组件垂直居中对齐问题
- 优化表单项和按钮区域的垂直对齐
- 改进组件在容器中的布局表现

### v2.0.2
- 修复 `width` 属性不生效的问题
- 优化表单项样式绑定逻辑
- 完善width属性文档说明和使用示例

### v2.0.1
- 新增 `buttonMode` 参数，支持控制按钮显示模式
- 优化默认配置，默认只显示搜索和重置按钮
- 改进按钮显示逻辑，支持灵活的按钮配置

### v2.0.0 (2025-01-17)

- 🚀 **重大更新**: 从Options API重构为Composition API + TypeScript
- ✨ **新增功能**:
  - 支持时间选择器和时间范围选择器
  - 支持级联选择器
  - 支持开关控件
  - 支持复选框组
  - 添加防抖搜索功能
  - 添加表单验证支持
  - 添加v-model支持
  - 暴露组件方法供外部调用
- 🎨 **界面优化**:
  - 改进响应式布局
  - 优化移动端适配
  - 增强无障碍访问支持
- 🐛 **问题修复**:
  - 修复表单重置问题
  - 修复展开/收起状态管理
  - 修复图标显示问题

### v1.x.x

- 基础功能实现
- 支持基本表单控件类型
- Options API实现

## 贡献指南

欢迎提交Issue和Pull Request来帮助改进这个组件。

## 许可证

MIT License
