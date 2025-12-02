# 组件库更新 - 快速参考

## 📦 更新的组件

### 1. ScButton - 完整封装 el-button

```vue
<!-- Tech 主题 -->
<ScButton theme="tech" type="primary">科技按钮</ScButton>

<!-- 默认主题（原生 el-button） -->
<ScButton type="primary">默认按钮</ScButton>
```

### 2. ScPanel - 重构封装 el-collapse

```vue
<ScPanelGroup v-model="activeNames" theme="tech">
  <ScPanel name="1" title="面板" theme="tech" tech-theme="cyan">
    内容
  </ScPanel>
</ScPanelGroup>
```

### 3. ScDeco - 科技装饰组件（新增）

```vue
<div style="position: relative;">
  <ScDeco type="corner" theme="cyan" />
  <ScDeco type="combo" theme="blue" />
  内容
</div>
```

### 4. ScHeader - 头部组件（新增）

```vue
<ScHeader
  theme="tech"
  tech-theme="cyan"
  title="系统平台"
  icon="ri:dashboard-line"
  :fixed="true"
>
  <template #right>
    <ScButton theme="tech">退出</ScButton>
  </template>
</ScHeader>
```

## 🎨 主题颜色

- **cyan** (青色) - 数据监控
- **blue** (蓝色) - 数据分析
- **green** (绿色) - 健康状态
- **purple** (紫色) - 安全防护
- **orange** (橙色) - 警告提示
- **red** (红色) - 错误提示

## 🚀 装饰类型（ScDeco）

- **corner** - 边角装饰
- **scan** - 扫描线
- **grid** - 网格背景
- **glow-border** - 发光边框
- **data-flow** - 数据流
- **particle** - 粒子效果
- **pulse** - 脉冲效果
- **combo** - 组合效果

## 📝 重要变更

### ScPanel 迁移

**旧版本**:

```vue
<ScPanel title="面板">内容</ScPanel>
```

**新版本**:

```vue
<ScPanelGroup v-model="activeNames">
  <ScPanel name="1" title="面板">内容</ScPanel>
</ScPanelGroup>
```

## 📚 详细文档

- [完整更新文档](./doc/组件库更新-科技风格扩展.md)
- [科技风格组件](./doc/科技风格组件.md)

---

**版本**: 2.0.0  
**日期**: 2025-12-03  
**开发者**: CH
