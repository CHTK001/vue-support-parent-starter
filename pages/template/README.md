# Vue 页面美化模板

## 模板说明

本目录包含用于统一美化 Vue 页面的模板组件和样式。

## 模板类型

### 1. PageHeader - 页面头部模板

用于统一的页面标题、副标题和统计信息展示。

### 2. TablePage - 表格页面模板

用于数据表格展示页面的统一布局。

### 3. MonitorPage - 监控页面模板

用于实时监控数据展示页面。

### 4. FormPage - 表单页面模板

用于表单编辑和新增页面。

## 使用方式

```vue
<script setup>
import { PageHeader } from "@/template/components";
</script>

<template>
  <PageHeader
    title="页面标题"
    subtitle="页面描述"
    icon="ri:icon-name"
    :stats="[{ label: '统计项', value: 100 }]"
  />
</template>
```

## 样式规范

- 使用 CSS 变量保持主题一致性
- 响应式布局适配不同屏幕
- 统一的间距和圆角规范
- 现代化的阴影和过渡效果
