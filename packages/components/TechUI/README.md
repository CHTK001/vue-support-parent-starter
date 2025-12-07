# TechUI 科幻风格组件封装

基于 [@techui/scifi](https://github.com/aYin86cn/techui-scifi) 组件库的二次封装。

## 安装依赖

在项目的 `package.json` 中添加 TechUI 及其依赖：

```json
{
  "dependencies": {
    "@repo/components": "workspace:^",
    "@techui/scifi": "catalog:",
    "@techui/colors": "catalog:",
    "@techui/lessmixins": "catalog:",
    "@techui/locales": "catalog:",
    "@techui/themes": "catalog:",
    "@techui/libs": "catalog:",
    "@techui/utils": "catalog:",
    "@techui/icons": "catalog:"
  }
}
```

然后运行 `pnpm install`。

## 初始化

**重要**: `@techui/scifi` 需要异步初始化，必须在应用挂载前完成。

```typescript
import { createApp } from "vue";
import App from "./App.vue";
import { initTechUI } from "@repo/components/TechUI";

// 手动导入 CSS 样式
import "@techui/scifi/dist/index.css";

const app = createApp(App);

// 异步初始化 TechUI
initTechUI(app, {
  license: null, // 可选，商业授权 license
  features: {
    echarts: false, // 是否启用 ECharts 相关组件
    advanced: false // 是否启用高级组件
  },
  debug: true // 开启调试模式查看日志
}).then(() => {
  console.log("TechUI 初始化成功");
  app.mount("#app");
}).catch((err) => {
  console.error("TechUI 初始化失败:", err);
  app.mount("#app");
});
```

## 组件列表

| 组件 | 对应原组件 | 描述 |
|------|-----------|------|
| TechButton | scifiButtonA1-A5 | 科幻风格按钮 |
| TechPanel | scifiPanelA1-B5 | 科幻风格面板 |
| TechHeader | scifiHeaderA1-A5 | 科幻风格头部 |
| TechDeco | scifiDecoA1-D5 | 科幻风格装饰 |
| TechGeometry | scifiGeomeA1-B5 | 科幻风格几何图形 |
| TechPanelTitle | scifiPanelTitleA1-A5 | 科幻风格面板标题 |

## 使用方式

### 全局注册

```typescript
import { createApp } from 'vue';
import TechUI from '@repo/components/TechUI';

const app = createApp(App);
app.use(TechUI);
```

### 按需引入

```vue
<script setup>
import { TechButton, TechPanel } from '@repo/components/TechUI';
</script>

<template>
  <TechPanel variant="A1" title="科幻面板">
    <TechButton variant="A1">科幻按钮</TechButton>
  </TechPanel>
</template>
```

## 属性说明

### TechButton

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| variant | `A1`-`A5` | `A1` | 按钮变体 |
| appearance | `A`/`B`/`C` | `A` | 外观变体 |
| size | `small`/`default`/`large` | `default` | 尺寸 |
| disabled | boolean | false | 是否禁用 |
| glow | boolean | true | 是否显示发光效果 |
| glowOpacity | number | 0.5 | 发光透明度 |
| backgroundOpacity | number | 0.5 | 背景透明度 |
| decorationColorAlt | boolean | false | 装饰颜色替换 |
| scaleAction | boolean | true | 缩放动作 |
| directionAlt | boolean | false | 方向替换 |

### TechPanel

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| variant | `A1`-`B5` | `A1` | 面板变体 |
| title | string | - | 标题 |
| width | string/number | `100%` | 宽度 |
| height | string/number | `auto` | 高度 |
| glow | boolean | true | 是否显示发光效果 |
| glowOpacity | number | 0.5 | 发光透明度 |
| backgroundOpacity | number | 0.5 | 背景透明度 |
| decorationColorAlt | boolean | false | 装饰颜色替换 |

### TechHeader

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| variant | `A1`-`A5` | `A1` | 头部变体 |
| title | string | - | 主标题 |
| subTitle | string | - | 副标题 |
| glow | boolean | true | 是否显示发光效果 |
| glowOpacity | number | 0.5 | 发光透明度 |
| backgroundOpacity | number | 0.5 | 背景透明度 |
| decorationColorAlt | boolean | false | 装饰颜色替换 |

### TechDeco

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| variant | `A1`-`D5` | `A1` | 装饰变体 |
| width | string/number | `100%` | 宽度 |
| height | string/number | `auto` | 高度 |
| glow | boolean | true | 是否显示发光效果 |
| glowOpacity | number | 0.5 | 发光透明度 |
| decorationColorAlt | boolean | false | 装饰颜色替换 |
| animation | boolean | true | 是否启用动画 |

### TechGeometry

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| variant | `A1`-`B5` | `A1` | 几何变体 |
| width | string/number | `100%` | 宽度 |
| height | string/number | `auto` | 高度 |
| glow | boolean | true | 是否显示发光效果 |
| glowOpacity | number | 0.5 | 发光透明度 |
| decorationColorAlt | boolean | false | 装饰颜色替换 |
| animation | boolean | true | 是否启用动画 |

### TechPanelTitle

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| variant | `A1`-`A5` | `A1` | 标题变体 |
| title | string | - | 标题文本 |
| glow | boolean | true | 是否显示发光效果 |
| glowOpacity | number | 0.5 | 发光透明度 |
| decorationColorAlt | boolean | false | 装饰颜色替换 |

## 主题定制

TechUI 支持通过 CSS 变量自定义主题：

```css
:root {
  --sf-button-bg_def: rgba(0, 100, 200, 0.5);
  --sf-button-bd_def: #00f6ff;
  --sf-button-fc_def: #00f6ff;
  --sf-button-hlite: #00f6ff;
  --sf-button-glow: #00f6ff;
}
```

## 许可证

基于 @techui/scifi 的许可证。
