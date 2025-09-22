# 自定义颜色系统使用指南

## 概述

本项目已建立了一套统一的颜色管理系统，旨在：
- 替换所有硬编码的颜色值
- 支持明暗主题自动切换
- 提供一致的设计体验
- 简化颜色变量管理

## 目录结构

```
packages/assets/style/
├── colors/
│   ├── index.scss          # 颜色系统入口文件
│   ├── default.scss        # 默认（浅色）主题
│   └── dark.scss          # 深色主题
├── element-plus/
│   └── theme-override.scss # Element Plus 主题覆盖
└── layout/default/
    ├── default.scss        # 更新后的默认样式
    ├── dark.scss          # 更新后的深色样式  
    └── variables.scss      # 更新后的变量文件
```

## 使用方法

### 1. 导入颜色系统

在 Vue 组件的 style 标签中导入：

```scss
<style lang="scss" scoped>
// 导入自定义颜色系统
@import 'path/to/packages/assets/style/colors/index.scss';

.my-component {
  color: var(--app-text-primary);
  background-color: var(--app-bg-primary);
  border: 1px solid var(--app-border-primary);
}
</style>
```

### 2. 在全局样式中导入

在项目的主样式文件中：

```scss
// main.scss 或 app.scss
@import '@/packages/assets/style/colors/index.scss';
```

## 可用的颜色变量

### 主题颜色
- `--app-primary`：主色调
- `--app-primary-light`：主色调（浅）
- `--app-primary-lighter`：主色调（更浅）
- `--app-primary-dark`：主色调（深）
- `--app-primary-darker`：主色调（更深）

### 语义化颜色
- `--app-success`：成功色
- `--app-warning`：警告色
- `--app-danger`：危险色
- `--app-info`：信息色

### 背景颜色
- `--app-bg-primary`：主要背景色
- `--app-bg-secondary`：次要背景色
- `--app-bg-tertiary`：第三级背景色
- `--app-bg-overlay`：遮罩背景色

### 文本颜色
- `--app-text-primary`：主要文本色
- `--app-text-secondary`：次要文本色
- `--app-text-tertiary`：第三级文本色
- `--app-text-disabled`：禁用文本色
- `--app-text-inverse`：反色文本

### 边框颜色
- `--app-border-primary`：主要边框色
- `--app-border-secondary`：次要边框色
- `--app-border-focus`：聚焦边框色
- `--app-border-error`：错误边框色

### 状态颜色
- `--app-status-online`：在线状态色
- `--app-status-offline`：离线状态色
- `--app-status-idle`：空闲状态色
- `--app-status-busy`：忙碌状态色

### 扩展颜色
提供完整的颜色梯度，如：
- `--app-blue-50` 到 `--app-blue-900`
- `--app-green-50` 到 `--app-green-900`
- `--app-red-50` 到 `--app-red-900`
- 等等...

## 实用类

系统还提供了一系列 CSS 实用类：

### 文本颜色类
```html
<p class="app-text-primary">主要文本</p>
<p class="app-text-secondary">次要文本</p>
<p class="app-text-success">成功文本</p>
<p class="app-text-danger">错误文本</p>
```

### 背景颜色类
```html
<div class="app-bg-primary">主要背景</div>
<div class="app-bg-secondary">次要背景</div>
<div class="app-bg-success">成功背景</div>
```

### 边框颜色类
```html
<div class="app-border-primary">主要边框</div>
<div class="app-border-focus">聚焦边框</div>
```

### 状态颜色类
```html
<span class="app-status-online">在线</span>
<span class="app-status-offline">离线</span>
```

## 主题切换

系统会自动根据 HTML 元素的类名切换主题：

```html
<!-- 浅色主题 -->
<html class="light">

<!-- 深色主题 -->
<html class="dark">
```

## Element Plus 集成

系统已经自动将 Element Plus 的所有颜色变量映射到自定义变量，无需额外配置。

## 迁移指南

### 从硬编码颜色迁移

**之前：**
```scss
.component {
  color: #1f2937;
  background: #ffffff;
  border: 1px solid #e5e7eb;
}
```

**之后：**
```scss
.component {
  color: var(--app-text-primary);
  background: var(--app-bg-primary);
  border: 1px solid var(--app-border-primary);
}
```

### 从 Tailwind 类迁移

**之前：**
```html
<div class="text-gray-800 bg-white border-gray-200">
```

**之后：**
```html
<div class="app-text-primary app-bg-primary app-border-primary">
```

### 从 Element Plus 变量迁移

**之前：**
```scss
.component {
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
}
```

**之后：**
```scss
.component {
  color: var(--app-text-primary);
  background: var(--app-bg-primary);
}
```

## 最佳实践

1. **优先使用语义化变量**：使用 `--app-text-primary` 而不是 `--app-gray-800`
2. **保持一致性**：在整个项目中使用统一的颜色变量
3. **测试主题切换**：确保在明暗主题下都有良好的视觉效果
4. **避免硬编码**：不要使用任何硬编码的颜色值
5. **合理使用实用类**：对于简单的样式，使用实用类；对于复杂组件，使用 SCSS 变量

## 扩展颜色系统

如需添加新的颜色变量，在相应的文件中添加：

```scss
// packages/assets/style/colors/default.scss
:root {
  --app-custom-color: #your-color;
}

// packages/assets/style/colors/dark.scss
html.dark {
  --app-custom-color: #your-dark-color;
}
```

## 注意事项

- 确保在使用前正确导入颜色系统
- 避免在同一组件中混用新旧颜色变量
- 定期检查和更新颜色值以保持设计一致性
- 在添加新的颜色变量时，确保同时定义明暗主题版本