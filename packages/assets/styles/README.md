# 样式系统

统一的样式管理系统，提供模块化、可维护的样式架构。

## 目录结构

```
styles/
├── base/              # 基础样式
│   ├── _variables.scss  # SCSS 变量定义
│   ├── _mixins.scss     # 混入函数
│   ├── _reset.scss      # 重置样式
│   ├── _transitions.scss # 过渡动画
│   └── index.scss       # 基础入口
│
├── themes/            # 主题样式
│   └── index.scss       # 整合颜色和皮肤
│
├── components/        # 组件样式
│   ├── _map-icons.scss  # 地图图标
│   └── index.scss       # 组件入口
│
├── layout/            # 布局样式
│   └── index.scss       # 布局入口
│
├── pages/             # 页面样式
│   └── index.scss       # 页面入口
│
├── utilities/         # 工具类
│   └── index.scss       # 原子化 CSS
│
├── index.scss         # 主入口
└── README.md          # 说明文档
```

## 使用方式

### 导入完整样式

```scss
@use "@repo/assets/styles";
```

### 仅导入变量和混入

```scss
@use "@repo/assets/styles/base/variables" as vars;
@use "@repo/assets/styles/base/mixins" as mix;

.my-class {
  color: vars.$color-primary;
  @include mix.flex-center;
}
```

### 使用工具类

```vue
<template>
  <div class="d-flex items-center gap-4 p-3 rounded-lg">
    <span class="text-sm font-medium truncate">内容</span>
  </div>
</template>
```

## 命名规范

- **变量**: 使用 `$` 前缀，kebab-case 命名，如 `$color-primary`
- **混入**: 使用 `@mixin`，kebab-case 命名，如 `flex-center`
- **类名**: 使用 kebab-case，如 `.text-primary`
- **私有文件**: 使用 `_` 前缀，如 `_variables.scss`

## 兼容性说明

新的 `styles/` 目录与原有的 `style/`、`css/`、`scss/` 目录并存，通过引用方式保持向后兼容。建议新项目使用 `styles/` 目录。
