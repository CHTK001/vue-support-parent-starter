# Layout 主题皮肤系统

## 概述

Layout 主题皮肤系统提供了完整的主题切换功能，允许用户在系统设置中选择不同的节日主题皮肤。每个主题都有独立的样式文件，可以改变整个 layout 的外观。

## 架构设计

### 核心文件

- `index.ts` - 主题配置和加载逻辑
- `ThemeSkinProvider.vue` - 主题皮肤提供者组件
- `*.scss` - 各个主题的样式文件
- `README.md` - 本文档

### 工作流程

1. **主题选择** - 用户在系统设置中点击主题卡片
2. **主题提供者更新** - ThemeSkinProvider 监听存储变化
3. **类名切换** - 在 `<html>` 元素上添加 `theme-{themeKey}` 类名
4. **样式应用** - SCSS 文件中的样式自动应用到相应的类名下
5. **状态保存** - 将选择保存到本地存储

## 添加新主题

### 步骤 1: 更新 `index.ts`

在 `layoutThemes` 数组中添加新主题：

```typescript
{
  name: "主题名称",
  key: "theme-key",
  description: "主题描述",
  stylesheet: "theme-key.css",
}
```

### 步骤 2: 创建主题样式文件

创建 `{theme-key}.css` 文件，参考现有的主题文件结构：

```css
/* 主题颜色定义 */
:root.theme-{theme-key} {
  --el-color-primary: #xxxxx;
  --el-color-primary-light-3: #xxxxx;
  /* ... 其他颜色变量 ... */
  
  --theme-primary: #xxxxx;
  --theme-secondary: #xxxxx;
  --theme-accent: #xxxxx;
  --theme-background: #xxxxx;
}

/* 导航栏样式 */
.theme-{theme-key} :deep(.lay-navbar) {
  background: linear-gradient(135deg, #xxxxx 0%, #xxxxx 100%);
  box-shadow: 0 4px 12px rgba(xxx, xxx, xxx, 0.3);
}

/* 其他组件样式 */
.theme-{theme-key} :deep(.nav-vertical) {
  background: linear-gradient(180deg, #xxxxx 0%, #xxxxx 100%);
}

/* ... 更多样式定义 ... */
```

### 步骤 3: 更新 lay-setting 组件

在 `lay-setting/index.vue` 中的 `festivalThemesList` 中添加新主题：

```typescript
{
  color: "#xxxxx",
  themeColor: "theme-key",
  name: "主题名称",
  description: "主题描述",
  icon: "icon-name",
}
```

## 主题样式文件模板

每个主题样式文件应包含以下部分：

### 1. 颜色定义

```css
:root.theme-{key} {
  --el-color-primary: #primary-color;
  --el-color-primary-light-3: #light-3;
  --el-color-primary-light-5: #light-5;
  --el-color-primary-light-7: #light-7;
  --el-color-primary-light-8: #light-8;
  --el-color-primary-light-9: #light-9;
}
```

### 2. 导航栏样式

```css
.theme-{key} :deep(.lay-navbar) {
  background: linear-gradient(...);
  box-shadow: ...;
}
```

### 3. 侧边栏样式

```css
.theme-{key} :deep(.nav-vertical),
.theme-{key} :deep(.nav-horizontal),
.theme-{key} :deep(.nav-hover),
.theme-{key} :deep(.nav-double) {
  background: linear-gradient(...);
}
```

### 4. 菜单项样式

```css
.theme-{key} :deep(.nav-vertical .el-menu-item:hover),
.theme-{key} :deep(.nav-vertical .el-sub-menu__title:hover) {
  background-color: rgba(...);
  color: #color;
}

.theme-{key} :deep(.nav-vertical .el-menu-item.is-active),
.theme-{key} :deep(.nav-vertical .el-sub-menu__title.is-active) {
  background-color: rgba(...);
  color: #color;
  border-left: 3px solid #color;
}
```

### 5. 按钮样式

```css
.theme-{key} :deep(.el-button--primary) {
  background-color: #color;
  border-color: #color;
}

.theme-{key} :deep(.el-button--primary:hover) {
  background-color: #hover-color;
  border-color: #hover-color;
}
```

### 6. 其他组件样式

- 标签页 (`.el-tabs__*`)
- 卡片 (`.el-card`)
- 输入框 (`.el-input__*`)
- 进度条 (`.el-progress__*`)
- 加载条 (`.el-loading-mask`)

### 7. 装饰元素（可选）

```css
.theme-{key}::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(...);
  z-index: 9999;
  pointer-events: none;
}
```

## 现有主题

- **默认** (default) - 系统默认主题，不加载额外样式
- **圣诞** (christmas) - 红色和绿色的圣诞主题
- **春节** (spring-festival) - 红色和金色的春节主题

## 扩展性

该系统设计具有高度的灵活性：

1. **易于添加新主题** - 只需创建新的 CSS 文件和更新配置
2. **独立的样式文件** - 每个主题都有独立的 CSS 文件，不会相互干扰
3. **动态加载** - 样式表动态加载，不会增加初始加载时间
4. **本地存储** - 用户的主题选择会被保存，刷新后保留

## 最佳实践

1. **颜色一致性** - 确保主题中的颜色搭配和谐
2. **对比度** - 确保文字和背景的对比度足够高
3. **渐变效果** - 使用渐变来增强视觉效果
4. **阴影效果** - 适当使用阴影来增加深度感
5. **过渡效果** - 保持原有的过渡效果，确保平滑的交互体验

## 调试

在开发新主题时，可以在浏览器控制台中手动添加类名来预览效果：

```javascript
document.documentElement.classList.add('theme-{key}');
```

移除类名：

```javascript
document.documentElement.classList.remove('theme-{key}');
```
