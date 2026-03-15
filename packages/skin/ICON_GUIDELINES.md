# 图标系统规范 / Icon System Guidelines

## 概述 / Overview

本文档定义了项目中图标使用的标准和最佳实践。

This document defines the standards and best practices for icon usage in the project.

## 图标尺寸 / Icon Sizes

### 标准尺寸 / Standard Sizes

| 尺寸 / Size | 像素 / Pixels | 使用场景 / Use Case                                 |
| ----------- | ------------- | --------------------------------------------------- |
| xs          | 12px          | 表格图标、内联图标 / Table icons, inline icons      |
| sm          | 16px          | 按钮图标、导航图标 / Button icons, navigation icons |
| md          | 20px          | 默认图标尺寸 / Default icon size                    |
| lg          | 24px          | 标题图标、卡片图标 / Header icons, card icons       |
| xl          | 32px          | 大型按钮、特色图标 / Large buttons, feature icons   |
| 2xl         | 48px          | 空状态、占位符 / Empty states, placeholders         |
| 3xl         | 64px          | 启动页、引导页 / Splash screens, onboarding         |

### 使用示例 / Usage Examples

```vue
<!-- 小图标 -->
<i class="icon icon--sm icon--primary">icon_name</i>

<!-- 中等图标 -->
<i class="icon icon--md">icon_name</i>

<!-- 大图标 -->
<i class="icon icon--lg icon--success">icon_name</i>
```

## 图标颜色 / Icon Colors

### 语义颜色 / Semantic Colors

- **Primary**: 主要操作和强调 / Primary actions and emphasis
- **Success**: 成功状态 / Success states
- **Warning**: 警告信息 / Warning messages
- **Error**: 错误状态 / Error states
- **Info**: 信息提示 / Information
- **Muted**: 次要信息 / Secondary information

### 使用示例 / Usage Examples

```vue
<!-- 主色图标 -->
<i class="icon icon--md icon--primary">check</i>

<!-- 成功图标 -->
<i class="icon icon--md icon--success">check_circle</i>

<!-- 错误图标 -->
<i class="icon icon--md icon--error">error</i>
```

## 图标按钮 / Icon Buttons

### 尺寸规范 / Size Specifications

```vue
<!-- 小按钮 -->
<button class="icon-btn icon-btn--sm">
  <i class="icon">edit</i>
</button>

<!-- 中等按钮 -->
<button class="icon-btn icon-btn--md">
  <i class="icon">edit</i>
</button>

<!-- 大按钮 -->
<button class="icon-btn icon-btn--lg">
  <i class="icon">edit</i>
</button>
```

## 图标与文本组合 / Icon with Text

### 水平布局 / Horizontal Layout

```vue
<!-- 图标在左 -->
<div class="icon-text">
  <i class="icon icon--sm">info</i>
  <span>信息文本</span>
</div>

<!-- 图标在右 -->
<div class="icon-text icon-text--reverse">
  <i class="icon icon--sm">arrow_forward</i>
  <span>下一步</span>
</div>
```

### 垂直布局 / Vertical Layout

```vue
<div class="icon-text icon-text--vertical">
  <i class="icon icon--lg">folder</i>
  <span>文件夹</span>
</div>
```

## 图标徽章 / Icon Badges

### 数字徽章 / Number Badge

```vue
<div class="icon-badge">
  <i class="icon icon--md">notifications</i>
  <span class="badge">5</span>
</div>
```

### 状态点 / Status Dot

```vue
<div class="icon-badge">
  <i class="icon icon--md">account_circle</i>
  <span class="dot"></span>
</div>
```

## 动画图标 / Animated Icons

### 旋转动画 / Spin Animation

```vue
<!-- 加载图标 -->
<i class="icon icon--md icon--spin">refresh</i>
```

### 脉冲动画 / Pulse Animation

```vue
<!-- 通知图标 -->
<i class="icon icon--md icon--pulse icon--error">notifications</i>
```

## 可访问性 / Accessibility

### ARIA 标签 / ARIA Labels

```vue
<!-- 装饰性图标 -->
<i class="icon" aria-hidden="true">star</i>

<!-- 功能性图标 -->
<button aria-label="删除">
  <i class="icon">delete</i>
</button>
```

### 屏幕阅读器文本 / Screen Reader Text

```vue
<button>
  <i class="icon" aria-hidden="true">search</i>
  <span class="sr-only">搜索</span>
</button>
```

## 性能优化 / Performance Optimization

### 图标加载策略 / Icon Loading Strategy

1. **按需加载**: 只加载使用的图标 / Load only used icons
2. **SVG Sprite**: 使用 SVG sprite 减少请求 / Use SVG sprite to reduce requests
3. **图标字体**: 对于简单图标使用图标字体 / Use icon fonts for simple icons
4. **懒加载**: 非关键图标延迟加载 / Lazy load non-critical icons

### 最佳实践 / Best Practices

```vue
<!-- ✅ 推荐：使用语义化类名 -->
<i class="icon icon--md icon--primary">check</i>

<!-- ❌ 不推荐：内联样式 -->
<i class="icon" style="width: 20px; color: blue;">check</i>

<!-- ✅ 推荐：使用 CSS 变量 -->
<i class="icon" style="--icon-color: var(--primary-color);">check</i>
```

## 图标库集成 / Icon Library Integration

### 支持的图标库 / Supported Icon Libraries

1. **Iconify**: 推荐使用，支持多个图标集 / Recommended, supports multiple icon sets
2. **Element Plus Icons**: Element Plus 官方图标 / Element Plus official icons
3. **Material Icons**: Google Material Design 图标 / Google Material Design icons
4. **Font Awesome**: 流行的图标字体库 / Popular icon font library

### 使用示例 / Usage Example

```vue
<script setup>
import { Icon } from "@iconify/vue";
</script>

<template>
  <Icon icon="mdi:home" class="icon icon--md" />
</template>
```

## 自定义图标 / Custom Icons

### SVG 图标 / SVG Icons

```vue
<template>
  <svg class="icon icon--md" viewBox="0 0 24 24">
    <path d="M..." fill="currentColor" />
  </svg>
</template>
```

### 图标组件 / Icon Component

```vue
<script setup lang="ts">
interface Props {
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: "md",
});
</script>

<template>
  <i :class="['icon', `icon--${size}`]" :style="{ color }">
    {{ name }}
  </i>
</template>
```

## 常见问题 / FAQ

### Q: 如何选择合适的图标尺寸？

A: 根据使用场景选择：

- 按钮和导航：sm (16px)
- 内容区域：md (20px)
- 标题和卡片：lg (24px)
- 空状态：2xl (48px) 或 3xl (64px)

### Q: 图标颜色如何与主题配合？

A: 使用语义化颜色类（primary, success, error 等）或 CSS 变量，确保在不同主题下都能正确显示。

### Q: 如何确保图标的可访问性？

A:

1. 装饰性图标使用 `aria-hidden="true"`
2. 功能性图标提供 `aria-label`
3. 确保足够的颜色对比度
4. 提供屏幕阅读器文本

## 更新日志 / Changelog

- 2024-03-15: 初始版本 / Initial version
