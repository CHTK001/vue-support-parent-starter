# 主题系统

Vue Support 项目的主题系统，支持多种节日和风格主题。

## 已实现主题

### 1. 默认主题 (default)

标准的应用主题，适用于日常使用。

### 2. 8bit 像素风格主题 (8bit)

复古像素风格主题，带有怀旧游戏感。

### 3. 万圣节主题 (halloween)

**配色方案:**

- 南瓜橙 (#ff6b35)
- 深夜黑 (#1a1a2e)
- 神秘紫 (#8b5cf6)
- 幽灵白 (#f8f9fa)

**特色元素:**

- 飘落蝙蝠动画
- 闪烁南瓜灯
- 漂浮幽灵
- 蜘蛛网装饰

**使用方式:**

```html
<html data-theme="halloween"></html>
```

### 4. 圣诞节主题 (christmas)

**配色方案:**

- 圣诞红 (#dc143c)
- 常青绿 (#2d5016)
- 金色 (#ffd700)
- 雪白 (#ffffff)

**特色元素:**

- 飘雪动画
- 闪烁彩灯
- 圣诞树装饰
- 礼物盒动画

**使用方式:**

```html
<html data-theme="christmas"></html>
```

## 主题结构

每个主题包含以下文件：

```
themes/
├── [theme-name]/
│   ├── design.md          # 设计文档
│   ├── variables.scss     # CSS 变量定义
│   ├── animations.scss    # 动画效果
│   └── components/        # 组件样式覆盖
│       ├── button.scss
│       ├── card.scss
│       └── ...
└── [theme-name].scss      # 主题入口文件
```

## 使用主题

### 方法 1: 使用主题切换器组件

```vue
<template>
  <div>
    <!-- 万圣节主题切换器 -->
    <HalloweenThemeSwitcher />

    <!-- 圣诞节主题切换器 -->
    <ChristmasThemeSwitcher />
  </div>
</template>

<script setup>
import { HalloweenThemeSwitcher } from "@repo/components/theme-halloween";
import { ChristmasThemeSwitcher } from "@repo/components/theme-christmas";
</script>
```

### 方法 2: 编程方式切换

```typescript
// 激活主题
document.documentElement.setAttribute("data-theme", "halloween");

// 移除主题
document.documentElement.removeAttribute("data-theme");

// 保存到本地存储
localStorage.setItem("theme", "halloween");
```

### 方法 3: 在 Vue 应用中使用

```typescript
import { ref, watch } from "vue";

const currentTheme = ref("default");

watch(currentTheme, (newTheme) => {
  if (newTheme === "default") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", newTheme);
  }
});
```

## 暗黑模式支持

主题支持暗黑模式，通过 `data-mode` 属性控制：

```html
<html data-theme="christmas" data-mode="dark"></html>
```

## 响应式设计

所有主题动画支持 `prefers-reduced-motion` 媒体查询：

```scss
@media (prefers-reduced-motion: reduce) {
  .animation-class {
    animation: none;
  }
}
```

## 创建新主题

1. 在 `themes/` 目录下创建新主题文件夹
2. 创建必要的 SCSS 文件（variables, animations, components）
3. 创建主题入口文件 `[theme-name].scss`
4. 在 `index.scss` 中导入新主题
5. 创建对应的 Vue 组件（可选）

## 主题变量规范

每个主题应定义以下 CSS 变量：

```scss
:root[data-theme="theme-name"] {
  // 主色调
  --primary-color: ...;
  --secondary-color: ...;
  --accent-color: ...;

  // 背景和文字
  --bg-color: ...;
  --text-color: ...;
  --border-color: ...;

  // 交互状态
  --hover-color: ...;

  // 阴影
  --shadow-sm: ...;
  --shadow-md: ...;
  --shadow-lg: ...;

  // 动画时长
  --transition-fast: 0.2s;
  --transition-normal: 0.3s;
  --transition-slow: 0.5s;
}
```

## 性能优化

- 动画使用 CSS transforms 和 opacity 以获得最佳性能
- 大量动画元素使用 `will-change` 属性
- 支持动画降级，尊重用户的可访问性设置
- 移动端自动减少动画复杂度
