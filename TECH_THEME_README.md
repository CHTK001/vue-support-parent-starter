# Tech 科技风格组件 - 快速开始

## 简介

为组件库新增了科技风格（Tech Theme）支持，采用赛博朋克/未来科技的视觉设计风格。

## 新增组件

### 1. ScButton - 科技按钮

```vue
<ScButton theme="tech" type="primary">科技按钮</ScButton>
```

### 2. ScCard - Tech 布局

```vue
<ScCard layout="tech" title="系统监控" icon="ri:dashboard-line" theme="cyan">
  卡片内容
</ScCard>
```

### 3. ScDialog - Tech 主题

```vue
<ScDialog v-model="visible" title="系统配置" theme="tech" mode="custom">
  对话框内容
</ScDialog>
```

## 主题颜色

- **cyan** (青色) - 默认，适合数据监控
- **blue** (蓝色) - 适合数据分析
- **green** (绿色) - 适合健康状态
- **purple** (紫色) - 适合安全防护
- **orange** (橙色) - 适合警告提示
- **red** (红色) - 适合错误提示

## 视觉特效

- ✨ 发光边框
- 🌐 网格背景
- 📡 扫描线动画
- 🔷 SVG 边角装饰
- 💫 数据流动画
- 🎯 悬停发光效果

## 示例页面

查看完整示例: `pages/example/src/components/ScTechExample.vue`

## 详细文档

完整文档请查看: [科技风格组件文档](./doc/科技风格组件.md)

## 文件位置

- ScCard Tech 布局: `packages/components/ScCard/layouts/Tech.vue`
- ScDialog Tech 主题: `packages/components/ScDialog/src/index.vue`
- ScButton 组件: `packages/components/ScButton/index.vue`

## 快速体验

```bash
# 启动开发服务器
pnpm dev

# 访问示例页面查看效果
```

---

**开发者**: CH  
**版本**: 1.0.0  
**日期**: 2025-12-03
