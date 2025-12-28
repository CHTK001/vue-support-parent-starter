# 样式优化指南

## 目标
减少 `:deep()` 和 `!important` 的使用，提升样式可维护性。

## 原则

### 1. 优先使用 CSS 变量
```scss
// ❌ 避免
:deep(.el-menu-item) {
  background: #f00 !important;
}

// ✅ 推荐
.menu-item {
  background: var(--layout-sidebar-active-bg);
}
```

### 2. 使用 props 传递样式
```vue
<!-- ❌ 避免：通过 :deep 穿透 -->
<el-button />
<style>
:deep(.el-button) { color: red; }
</style>

<!-- ✅ 推荐：使用 props -->
<el-button :style="{ color: 'red' }" />
```

### 3. 使用 class 控制状态
```scss
// ❌ 避免
.item {
  color: blue !important;
  &.active {
    color: red !important;
  }
}

// ✅ 推荐：提高选择器特异性
.sidebar .menu .item {
  color: blue;
}
.sidebar .menu .item.active {
  color: red;
}
```

### 4. CSS Layers 管理优先级
```scss
@layer base, components, themes, utilities;

@layer components {
  .menu-item { ... }
}

@layer themes {
  .theme-christmas .menu-item { ... }
}
```

## 迁移步骤

1. **识别问题样式**
   - 搜索 `:deep(` 使用
   - 搜索 `!important` 使用

2. **分析原因**
   - 是否是覆盖第三方组件？→ 使用 CSS 变量或 props
   - 是否是覆盖父组件？→ 增加选择器特异性
   - 是否是主题覆盖？→ 使用主题变量

3. **渐进迁移**
   - 从新组件开始应用规范
   - 逐步改造现有组件
   - 优先处理核心组件

## 变量使用

导入变量文件：
```scss
@use '../styles/variables.scss' as *;
```

使用布局变量：
```scss
.sidebar {
  width: var(--layout-sidebar-width);
  background: var(--layout-sidebar-bg);
}
```

使用主题 mixin：
```scss
@include theme-vars('christmas') {
  --custom-color: #c41e3a;
}
```

## 优先级策略

| 层级 | 用途 | 特异性 |
|------|------|--------|
| base | 重置样式 | 最低 |
| components | 组件样式 | 中等 |
| themes | 主题覆盖 | 较高 |
| utilities | 工具类 | 最高 |

## 待优化文件清单

### 高优先级（核心组件）
- [ ] `lay-sidebar/themes/Default.vue`
- [ ] `lay-navbar/themes/Default.vue`
- [ ] `lay-tool/themes/Default.vue`
- [ ] `breadcrumb/themes/BaseBreadcrumb.vue`

### 中优先级（主题变体）
- [ ] 各主题 SidebarItem 组件
- [ ] 各主题 Tag 组件

### 低优先级（复杂组件）
- [ ] `NavDouble.vue` (420+ !important)
- [ ] `HoverNavigation.vue` (270+ !important)
- [ ] `lay-message/index.vue` (230+ !important)
