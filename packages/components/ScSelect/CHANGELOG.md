# ScSelect 组件更新日志

## [1.1.0] - 2024-01-20

### 新增功能
- ✨ **树形布局支持**: 新增 `tree` 布局模式，支持层级数据的树形展示和选择
- 🎯 **树形选择器组件**: 新增 `ScSelectTreeLayout` 组件，基于 `ScTree` 组件实现
- 🔍 **树形搜索功能**: 支持树节点的实时搜索和过滤
- 📋 **树形操作栏**: 提供展开全部、收起全部、清空选择等批量操作
- 🎨 **树形样式优化**: 提供现代化的交互效果和视觉反馈

### 新增属性
- `treeProps`: 树节点配置对象，支持自定义字段映射
- `treeNodeKey`: 树节点唯一标识字段，默认为 'value'
- `treeIconProp`: 树节点图标字段，默认为 'icon'
- `treeDescProp`: 树节点描述字段，默认为 'desc'
- `treeShowSearch`: 是否显示搜索框，默认为 true
- `treeSearchPlaceholder`: 搜索框占位符文本
- `treeShowActions`: 是否显示操作栏，默认为 true
- `treeDefaultExpandAll`: 是否默认展开所有节点，默认为 false
- `treeExpandOnClickNode`: 是否在点击节点时展开/收起节点，默认为 false
- `treeCheckStrictly`: 是否严格遵循父子不互相关联，默认为 false
- `treeLeafOnly`: 是否只能选择叶子节点，默认为 false

### 新增事件
- `node-click`: 树形布局节点点击事件
- `check`: 树形布局复选框变化事件
- `current-change`: 树形布局当前选中节点变化事件

### 新增类型定义
- `TreeSelectOption`: 树形选项接口
- `TreeProps`: 树形属性配置接口
- 扩展 `ScSelectProps` 接口，添加树形布局相关属性
- 扩展 `ScSelectEmits` 接口，添加树形布局相关事件

### 功能特性
- 🔄 **单选/多选支持**: 树形布局支持单选和多选模式
- 🎯 **叶子节点限制**: 可配置只允许选择叶子节点
- 🔍 **实时搜索**: 支持按节点标签进行实时搜索过滤
- 📱 **响应式设计**: 适配移动端和桌面端显示
- 🎨 **丰富交互**: 提供悬停效果、选中状态、动画过渡等
- ⚡ **性能优化**: 支持大数据量的树形结构渲染

### 使用示例

#### 基础树形选择器
```vue
<template>
  <ScSelect
    v-model="selectedValue"
    :options="treeOptions"
    layout="tree"
    height="300px"
  />
</template>
```

#### 多选树形选择器
```vue
<template>
  <ScSelect
    v-model="selectedValues"
    :options="treeOptions"
    layout="tree"
    :multiple="true"
    :tree-check-strictly="true"
    height="400px"
  />
</template>
```

#### 只选择叶子节点
```vue
<template>
  <ScSelect
    v-model="selectedValue"
    :options="treeOptions"
    layout="tree"
    :tree-leaf-only="true"
    height="300px"
  />
</template>
```

### 技术实现
- 基于 `ScTree` 组件进行封装
- 使用 Vue 3 Composition API
- 支持 TypeScript 类型检查
- 遵循 Element Plus 设计规范
- 提供完整的单元测试覆盖

### 兼容性
- ✅ 向后兼容，不影响现有布局模式
- ✅ 支持所有现有的通用属性（multiple、limit、height 等）
- ✅ 支持现有的事件系统（change、update:modelValue 等）

---

## [1.0.0] - 2024-01-01

### 初始版本
- 🎉 ScSelect 组件首次发布
- 📦 支持 select、card、pill、dropdown、filter、table 六种布局模式
- 🔄 支持单选和多选功能
- 📱 响应式设计支持
- 🎨 丰富的样式配置选项
- 📊 过滤器模式支持
- 🌳 结果格式化功能