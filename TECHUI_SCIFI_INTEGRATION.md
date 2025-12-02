# TechUI Scifi 集成指南

## 安装

### 1. 安装 @techui/scifi 及其依赖

```bash
pnpm add @techui/scifi @techui/colors @techui/lessmixins @techui/locales @techui/themes @techui/libs @techui/utils
```

### 2. 在项目中引入

在 `main.ts` 或应用入口文件中：

```typescript
import { createApp } from "vue";
import App from "./App.vue";

// 引入 techui-scifi
import TechUIScifi from "@techui/scifi";
import "@techui/scifi/dist/style.css";

const app = createApp(App);

// 注册 techui-scifi
app.use(TechUIScifi);

app.mount("#app");
```

## 组件映射

我们的组件库将基于 techui-scifi 进行封装：

| 我们的组件   | techui-scifi 组件 | 说明                   |
| ------------ | ----------------- | ---------------------- |
| ScButton     | scifiButton       | 科技按钮               |
| ScPanel      | scifiPanel        | 科技面板               |
| ScPanelTitle | scifiPanelTitle   | 面板标题               |
| ScDeco       | scifiDeco         | 装饰元素               |
| ScHeader     | scifiHeader       | 头部组件               |
| ScDialog     | scifiPanel        | 对话框（使用面板实现） |

## 使用示例

### ScButton

```vue
<template>
  <!-- 默认模式：使用 el-button -->
  <ScButton type="primary">默认按钮</ScButton>

  <!-- Tech 模式：使用 scifiButton -->
  <ScButton theme="tech">科技按钮</ScButton>
</template>
```

### ScPanel

```vue
<template>
  <!-- 默认模式：使用 el-collapse -->
  <ScPanelGroup v-model="activeNames">
    <ScPanel name="1" title="面板">内容</ScPanel>
  </ScPanelGroup>

  <!-- Tech 模式：使用 scifiPanel -->
  <ScPanel theme="tech" title="科技面板"> 内容 </ScPanel>
</template>
```

### ScPanelTitle

```vue
<template>
  <ScPanelTitle>面板标题</ScPanelTitle>
</template>
```

### ScDeco

```vue
<template>
  <div style="position: relative;">
    <ScDeco type="corner" />
    内容
  </div>
</template>
```

### ScHeader

```vue
<template>
  <ScHeader theme="tech" title="系统平台">
    <template #right>
      <ScButton theme="tech">退出</ScButton>
    </template>
  </ScHeader>
</template>
```

### ScDialog

```vue
<template>
  <ScDialog v-model="visible" theme="tech" title="对话框"> 内容 </ScDialog>
</template>
```

## 注意事项

1. **样式引入**: 确保引入了 techui-scifi 的样式文件
2. **依赖完整**: 需要安装所有 techui 生态的依赖包
3. **主题系统**: techui-scifi 有自己的主题系统，可以全局配置
4. **国际化**: 支持多语言切换

## 主题配置

```typescript
import { setTheme } from "@techui/themes";

// 设置主题
setTheme("dark"); // 或 'light'
```

## 国际化配置

```typescript
import { setLocale } from "@techui/locales";

// 设置语言
setLocale("zh-CN"); // 或 'en-US'
```

---

**更新时间**: 2025-12-03  
**开发者**: CH
