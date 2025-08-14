# Default Layout 组件

这是一个现代化的Vue 3布局组件，提供了完整的系统配置面板和多种导航模式。

## 特性

### 🎨 现代化设计
- 玻璃态效果和模糊背景
- 动态渐变装饰
- 流畅的过渡动画
- 响应式设计

### 🔧 丰富的配置选项
- 多种导航模式（纵向、横向、混合、悬停、卡片）
- 主题色自定义
- 界面元素显示控制
- 性能优化设置

### 📱 完美适配
- 支持亮色/暗色主题
- 移动端友好
- 多语言支持
- 现代浏览器兼容

## 导航模式

### 纵向布局 (Vertical)
- 经典侧边栏导航
- 适合功能丰富的管理系统
- 菜单层级清晰，操作便捷

### 横向布局 (Horizontal)
- 顶部导航栏设计
- 充分利用屏幕宽度
- 适合内容展示型应用

### 混合布局 (Mix)
- 结合顶部和侧边导航优势
- 一级菜单在顶部，子菜单在侧边
- 平衡功能性和美观性

### 悬停导航 (Hover)
- 极简设计，只显示图标
- 鼠标悬停展开子菜单
- 节省空间，适合简洁界面

### 卡片导航 (Card)
- 以卡片形式展示所有功能模块
- 直观易用，适合功能较少的应用
- 现代化的交互体验

## 配置管理

### 导出配置
```javascript
// 导出当前所有配置为JSON文件
exportSettings()
```

### 导入配置
```javascript
// 从JSON文件导入配置
importSettings()
```

### 重置设置
```javascript
// 重置所有设置到默认状态
resetToDefault()
```

## 使用方法

### 基础使用
```vue
<template>
  <DefaultLayout>
    <!-- 你的页面内容 -->
  </DefaultLayout>
</template>

<script setup>
import DefaultLayout from '@layout/default'
</script>
```

### 配置系统设置
1. 点击页面右上角的设置图标
2. 在弹出的配置面板中调整各项设置
3. 设置会自动保存并实时生效

## 组件结构

```
src/
├── components/
│   ├── lay-navbar/          # 导航栏组件
│   ├── lay-sidebar/         # 侧边栏组件
│   ├── lay-setting/         # 设置面板组件
│   ├── lay-panel/           # 面板容器组件
│   └── lay-tool/            # 工具栏组件
├── hooks/
│   ├── useNav.ts           # 导航相关逻辑
│   └── useDataThemeChange.ts # 主题切换逻辑
└── index.vue               # 主布局组件
```

## 技术栈

- **Vue 3** - 渐进式JavaScript框架
- **TypeScript** - 类型安全的JavaScript
- **Element Plus** - Vue 3组件库
- **Pinia** - Vue状态管理
- **Tailwind CSS** - 实用优先的CSS框架
- **Iconify** - 图标解决方案

## 开发

### 安装依赖
```bash
pnpm install
```

### 开发模式
```bash
pnpm dev
```

### 构建
```bash
pnpm build
```

## 贡献

欢迎提交Issue和Pull Request来改进这个组件。

## 许可证

MIT License
