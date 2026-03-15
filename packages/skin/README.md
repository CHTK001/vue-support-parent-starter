# Skin Package / 皮肤包

## 概述 / Overview

这是项目的样式系统包，包含了所有的主题、样式和动画。

This is the project's style system package, containing all themes, styles, and animations.

## 目录结构 / Directory Structure

```
packages/skin/
├── src/
│   ├── index.scss                          # 主样式入口
│   ├── index.ts                            # TypeScript 入口
│   ├── spacing.scss                        # 间距系统
│   ├── responsive.scss                     # 响应式布局
│   ├── accessibility.scss                  # 可访问性样式
│   ├── forms.scss                          # 表单样式
│   ├── icons.scss                          # 图标系统
│   ├── dark-mode.scss                      # 暗黑模式
│   ├── animations/
│   │   └── micro-interactions.scss         # 微交互动画
│   └── themes/                             # 主题目录
├── ICON_GUIDELINES.md                      # 图标使用指南
├── package.json
└── README.md                               # 本文件
```

## 安装 / Installation

```bash
# 在项目根目录
pnpm install
```

## 使用方法 / Usage

### 1. 导入所有样式 / Import All Styles

在你的主样式文件或入口文件中：

```scss
// main.scss
@import "@/packages/skin/src/index.scss";
```

或者在 Vue 组件中：

```vue
<style lang="scss">
@import "@/packages/skin/src/index.scss";
</style>
```

### 2. 按需导入 / Import on Demand

如果只需要特定的样式模块：

```scss
// 只导入间距系统
@import "@/packages/skin/src/spacing.scss";

// 只导入响应式布局
@import "@/packages/skin/src/responsive.scss";

// 只导入表单样式
@import "@/packages/skin/src/forms.scss";
```

### 3. 在 Vite 中配置 / Configure in Vite

```typescript
// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/packages/skin/src/index.scss";`,
      },
    },
  },
});
```

## 功能模块 / Feature Modules

### 1. 间距系统 / Spacing System

提供统一的间距变量和工具类。

```scss
// 使用 SCSS 变量
.my-component {
  padding: $spacing-md;
  margin-bottom: $spacing-lg;
}

// 使用 CSS 变量
.my-component {
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}
```

```html
<!-- 使用工具类 -->
<div class="spacing-p-md spacing-m-lg">内容</div>
```

### 2. 响应式布局 / Responsive Layout

提供响应式断点和布局工具。

```scss
// 使用响应式混合
.my-component {
  @include respond-to("sm") {
    font-size: 14px;
  }

  @include respond-above("lg") {
    font-size: 18px;
  }
}
```

```html
<!-- 使用响应式容器 -->
<div class="container-responsive">内容</div>

<!-- 使用响应式网格 -->
<div class="grid-responsive">
  <div>项目 1</div>
  <div>项目 2</div>
  <div>项目 3</div>
</div>
```

### 3. 可访问性 / Accessibility

提供符合 WCAG AA 标准的样式。

```html
<!-- 跳过导航链接 -->
<a href="#main-content" class="skip-to-content">跳到主内容</a>

<!-- 屏幕阅读器专用文本 -->
<span class="sr-only">这段文字只对屏幕阅读器可见</span>

<!-- 可访问的按钮 -->
<button class="btn-accessible">点击我</button>

<!-- 可访问的表单控件 -->
<input type="text" class="form-control-accessible" />
```

### 4. 表单样式 / Form Styles

统一的表单组件样式。

```html
<!-- 基础表单 -->
<div class="form-group">
  <label class="form-label is-required">用户名</label>
  <input type="text" class="form-input" placeholder="请输入用户名" />
  <span class="form-help">用户名长度为 3-20 个字符</span>
</div>

<!-- 带图标的输入框 -->
<div class="form-input-group form-input-group--prefix">
  <span class="input-icon input-icon--prefix">🔍</span>
  <input type="text" class="form-input" placeholder="搜索..." />
</div>

<!-- 内联表单 -->
<form class="form-inline">
  <div class="form-group">
    <input type="text" class="form-input" />
  </div>
  <button type="submit">提交</button>
</form>
```

### 5. 图标系统 / Icon System

统一的图标样式和规范。

```html
<!-- 基础图标 -->
<i class="icon icon--md">home</i>

<!-- 彩色图标 -->
<i class="icon icon--lg icon--primary">star</i>

<!-- 图标按钮 -->
<button class="icon-btn icon-btn--md">
  <i class="icon">edit</i>
</button>

<!-- 图标与文本 -->
<div class="icon-text">
  <i class="icon icon--sm">info</i>
  <span>信息</span>
</div>

<!-- 图标徽章 -->
<div class="icon-badge">
  <i class="icon icon--md">notifications</i>
  <span class="badge">5</span>
</div>
```

详细使用指南请参考 [ICON_GUIDELINES.md](./ICON_GUIDELINES.md)

### 6. 微交互动画 / Micro-interactions

为组件添加细腻的交互动画。

```html
<!-- 交互式按钮 -->
<button class="btn-interactive">点击我</button>

<!-- 交互式卡片 -->
<div class="card card-interactive">卡片内容</div>

<!-- 交互式图标 -->
<i class="icon icon-interactive">star</i>

<!-- 使用动画工具类 -->
<div class="animate-fade-in">淡入内容</div>
<div class="animate-slide-in-up">向上滑入</div>
<div class="animate-bounce">弹跳动画</div>
```

```scss
// 使用动画混合
.my-button {
  @include hover-lift(4px);
}

.my-icon {
  @include hover-scale(1.2);
}
```

### 7. 暗黑模式 / Dark Mode

优化的暗黑模式支持。

```html
<!-- 设置暗黑模式 -->
<html data-theme="dark">
  <!-- 内容 -->
</html>

<!-- 暗黑模式专用内容 -->
<div class="dark-only">只在暗黑模式显示</div>

<!-- 亮色模式专用内容 -->
<div class="light-only">只在亮色模式显示</div>
```

```typescript
// 切换主题
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute("data-theme");
  html.setAttribute("data-theme", currentTheme === "dark" ? "light" : "dark");
}
```

## CSS 变量 / CSS Variables

### 间距变量 / Spacing Variables

```css
--spacing-xs: 4px --spacing-sm: 8px --spacing-md: 16px --spacing-lg: 24px
  --spacing-xl: 32px --spacing-2xl: 48px --spacing-3xl: 64px;
```

### 颜色变量 / Color Variables

```css
/* 文本颜色 */
--text-primary: #1a1a1a --text-secondary: #4a4a4a --text-tertiary: #6a6a6a
  --text-disabled: #9a9a9a /* 背景颜色 */ --bg-primary: #ffffff
  --bg-secondary: #f5f5f5 --bg-tertiary: #e5e5e5 /* 状态颜色 */
  --color-success: #0f7b0f --color-warning: #b35900 --color-error: #c41e3a
  --color-info: #0066cc;
```

### 动画变量 / Animation Variables

```css
--animation-duration-fast: 150ms --animation-duration-base: 250ms
  --animation-duration-slow: 350ms
  --animation-easing: cubic-bezier(0.4, 0, 0.2, 1);
```

## 断点 / Breakpoints

```scss
$breakpoints: (
  "xs": 480px,
  "sm": 768px,
  "md": 1024px,
  "lg": 1280px,
  "xl": 1536px,
  "2xl": 1920px,
);
```

## 最佳实践 / Best Practices

### 1. 使用语义化类名 / Use Semantic Class Names

```html
<!-- ✅ 推荐 -->
<button class="btn-primary">提交</button>

<!-- ❌ 不推荐 -->
<button style="background: blue; color: white;">提交</button>
```

### 2. 使用 CSS 变量 / Use CSS Variables

```scss
/* ✅ 推荐 */
.my-component {
  color: var(--text-primary);
  padding: var(--spacing-md);
}

/* ❌ 不推荐 */
.my-component {
  color: #1a1a1a;
  padding: 16px;
}
```

### 3. 使用响应式混合 / Use Responsive Mixins

```scss
/* ✅ 推荐 */
.my-component {
  @include respond-to("sm") {
    font-size: 14px;
  }
}

/* ❌ 不推荐 */
.my-component {
  @media (max-width: 768px) {
    font-size: 14px;
  }
}
```

### 4. 考虑可访问性 / Consider Accessibility

```html
<!-- ✅ 推荐 -->
<button aria-label="关闭">
  <i class="icon" aria-hidden="true">close</i>
</button>

<!-- ❌ 不推荐 -->
<button>
  <i class="icon">close</i>
</button>
```

### 5. 优化性能 / Optimize Performance

```scss
/* ✅ 推荐：使用 transform 和 opacity */
.my-component {
  transition:
    transform 0.3s,
    opacity 0.3s;

  &:hover {
    transform: translateY(-2px);
  }
}

/* ❌ 不推荐：使用 top/left */
.my-component {
  transition: top 0.3s;

  &:hover {
    top: -2px;
  }
}
```

## 浏览器支持 / Browser Support

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 贡献指南 / Contributing

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证 / License

MIT

## 相关文档 / Related Documentation

- [图标使用指南](./ICON_GUIDELINES.md)
- [性能优化指南](../../PERFORMANCE_OPTIMIZATION.md)
- [项目完成总结](../../REFACTOR_COMPLETE.md)

## 更新日志 / Changelog

### v1.0.0 (2024-03-15)

- ✨ 初始版本发布
- ✨ 添加间距系统
- ✨ 添加响应式布局
- ✨ 添加可访问性样式
- ✨ 添加表单样式
- ✨ 添加图标系统
- ✨ 添加微交互动画
- ✨ 添加暗黑模式支持

---

**维护者 / Maintainer**: Frontend Team

**最后更新 / Last Updated**: 2024-03-15
