# ScCard 卡片组件

ScCard 是一个多功能、高可定制的卡片组件，集成了多种常用布局模式，支持 Stitch Design System 的主题系统。

## 特性

- **多布局支持**：内置 Default, Compact, Media, Header-Content, Panel-3D, Tech, Stats, Stats-Simple 等 8 种布局
- **主题自适应**：全面适配 Stitch Design System，支持浅色/暗黑模式自动切换
- **3D 拟态**：Panel-3D 布局提供现代化的微 3D 效果
- **统计面板**：专门针对数据展示优化的 Stats 布局
- **科技风格**：Tech 布局提供数据大屏风格的边框和动效

## 安装

```bash
npm install @repo/components
```

## 基础用法

### 默认卡片

```vue
<template>
  <ScCard title="卡片标题" shadow="hover">
    这是卡片内容
  </ScCard>
</template>
```

### 3D 面板 (Panel-3D)

适用于控制面板或强强调区域。

```vue
<template>
  <ScCard 
    layout="panel-3d" 
    title="空调控制" 
    icon="ri:snowflake-line"
    active 
    theme="primary"
  >
    <div class="content">26°C</div>
  </ScCard>
</template>
```

### 统计卡片 (Stats)

适用于仪表盘数据展示。

```vue
<template>
  <ScCard 
    layout="stats" 
    title="总访问量" 
    value="1,234,567" 
    trend-text="+12%" 
    trend-icon="ri:arrow-up-line"
    icon="ri:eye-line"
    theme="success"
  />
</template>
```

### 媒体卡片 (Media)

适用于图文混排。

```vue
<template>
  <ScCard 
    layout="media" 
    title="风景图片" 
    media-height="200px"
    media-bg-color="var(--stitch-lay-bg-group)"
  >
    <template #media>
      <img src="..." />
    </template>
    卡片描述内容...
  </ScCard>
</template>
```

## 属性 (Props)

| 属性名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| title | string | - | 卡片标题 |
| layout | string | 'default' | 布局类型: default, compact, media, header-content, panel-3d, tech, stats, stats-simple |
| shadow | string | 'always' | 阴影显示时机: always, hover, never |
| hoverable | boolean | false | 是否开启悬浮效果（部分布局默认开启） |
| theme | string | 'default' | 主题色: primary, success, warning, error, info 或自定义 |
| icon | string | - | 图标名称 (Iconify) |
| active | boolean | false | 是否处于激活状态 (Panel-3D, Tech) |
| padding | string | - | 内容区域内边距 |

## 主题系统

组件内部全面使用 Stitch Layout Tokens (`--stitch-lay-*`)，确保在不同主题皮肤和暗黑模式下表现一致。

- 背景色: `var(--stitch-lay-bg-panel)`
- 边框色: `var(--stitch-lay-border)`
- 文字色: `var(--stitch-lay-text-main)` / `var(--stitch-lay-text-sub)`
- 主色调: `var(--stitch-lay-primary)` 等语义变量
