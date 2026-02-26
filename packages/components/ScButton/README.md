# ScButton 按钮组件

ScButton 是对 Element Plus Button 组件的封装，支持 data-skin 主题切换功能。

## 功能特性

- ✅ 完全兼容 Element Plus Button 的所有属性和事件
- ✅ 支持 data-skin="8bit" 自动切换为像素风格按钮（PxButton）
- ✅ 支持所有按钮类型：primary、success、warning、danger、info、text
- ✅ 支持多种尺寸：large、default、small
- ✅ 支持朴素按钮、文字按钮、链接按钮
- ✅ 支持圆角、圆形按钮
- ✅ 支持加载状态和禁用状态
- ✅ 支持自定义图标和颜色

## 基础用法

```vue
<template>
  <ScButton>默认按钮</ScButton>
  <ScButton type="primary">主要按钮</ScButton>
  <ScButton type="success">成功按钮</ScButton>
  <ScButton type="warning">警告按钮</ScButton>
  <ScButton type="danger">危险按钮</ScButton>
  <ScButton type="info">信息按钮</ScButton>
</template>

<script setup>
import { ScButton } from "@repo/components";
</script>
```

## 不同尺寸

```vue
<template>
  <ScButton size="large">大型按钮</ScButton>
  <ScButton>默认按钮</ScButton>
  <ScButton size="small">小型按钮</ScButton>
</template>
```

## 朴素按钮

```vue
<template>
  <ScButton plain>朴素按钮</ScButton>
  <ScButton type="primary" plain>主要按钮</ScButton>
  <ScButton type="success" plain>成功按钮</ScButton>
</template>
```

## 圆角和圆形按钮

```vue
<template>
  <ScButton round>圆角按钮</ScButton>
  <ScButton circle icon="Search" />
</template>
```

## 加载状态

```vue
<template>
  <ScButton loading>加载中</ScButton>
  <ScButton type="primary" :loading="isLoading" @click="handleClick">提交</ScButton>
</template>

<script setup>
import { ref } from "vue";

const isLoading = ref(false);

const handleClick = () => {
  isLoading.value = true;
  setTimeout(() => {
    isLoading.value = false;
  }, 2000);
};
</script>
```

## 禁用状态

```vue
<template>
  <ScButton disabled>禁用按钮</ScButton>
  <ScButton type="primary" disabled>主要按钮</ScButton>
</template>
```

## 文字按钮和链接按钮

```vue
<template>
  <ScButton text>文字按钮</ScButton>
  <ScButton text type="primary">主要文字按钮</ScButton>
  <ScButton link>链接按钮</ScButton>
  <ScButton link type="primary">主要链接按钮</ScButton>
</template>
```

## 图标按钮

```vue
<template>
  <ScButton icon="Edit" />
  <ScButton type="primary" icon="Search">搜索</ScButton>
  <ScButton type="success" icon="Check" circle />
</template>
```

## data-skin 主题切换

当全局设置 `data-skin="8bit"` 时，ScButton 会自动切换为像素风格的 PxButton 组件。

```vue
<template>
  <div data-skin="8bit">
    <!-- 这些按钮会自动使用像素风格 -->
    <ScButton>像素按钮</ScButton>
    <ScButton type="primary">像素主要按钮</ScButton>
  </div>
</template>
```

## Props

| 参数              | 说明                           | 类型               | 可选值                                             | 默认值 |
| ----------------- | ------------------------------ | ------------------ | -------------------------------------------------- | ------ |
| size              | 尺寸                           | string             | large / default / small                            | —      |
| type              | 类型                           | string             | primary / success / warning / danger / info / text | —      |
| plain             | 是否朴素按钮                   | boolean            | —                                                  | false  |
| text              | 是否文字按钮                   | boolean            | —                                                  | false  |
| bg                | 是否显示文字按钮背景颜色       | boolean            | —                                                  | false  |
| link              | 是否链接按钮                   | boolean            | —                                                  | false  |
| round             | 是否圆角按钮                   | boolean            | —                                                  | false  |
| circle            | 是否圆形按钮                   | boolean            | —                                                  | false  |
| loading           | 是否加载中状态                 | boolean            | —                                                  | false  |
| loading-icon      | 自定义加载图标                 | string / Component | —                                                  | —      |
| disabled          | 是否禁用                       | boolean            | —                                                  | false  |
| icon              | 图标组件                       | string / Component | —                                                  | —      |
| autofocus         | 是否默认聚焦                   | boolean            | —                                                  | false  |
| native-type       | 原生 type 属性                 | string             | button / submit / reset                            | button |
| auto-insert-space | 自动在两个中文字符之间插入空格 | boolean            | —                                                  | —      |
| color             | 自定义按钮颜色                 | string             | —                                                  | —      |
| dark              | dark 模式                      | boolean            | —                                                  | false  |
| tag               | 自定义元素标签                 | string / Component | —                                                  | button |

## Events

| 事件名 | 说明           | 回调参数            |
| ------ | -------------- | ------------------- |
| click  | 点击按钮时触发 | (event: MouseEvent) |

## Slots

| 插槽名  | 说明           |
| ------- | -------------- |
| default | 按钮内容       |
| loading | 自定义加载图标 |
| icon    | 自定义图标     |

## 实现原理

ScButton 使用 `usePixelUI` hook 来实现主题切换：

```typescript
const { isPixelTheme, pixelComponent } = usePixelUI("PxButton");

const currentComponent = computed(() => {
  if (isPixelTheme.value && pixelComponent?.value) {
    return pixelComponent.value;
  }
  return ElButton;
});
```

当检测到 `data-skin="8bit"` 时，组件会自动切换为 PxButton，否则使用 Element Plus 的 ElButton。

## 版本历史

- v1.0.0 (2026-02-26)
  - 初始版本
  - 支持 Element Plus Button 的所有功能
  - 支持 data-skin 主题切换
