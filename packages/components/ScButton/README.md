# ScButton 按钮组件

支持多种主题风格的按钮组件，特别支持科技风格（Tech）主题。

## 功能特性

- 支持多种按钮类型：default、primary、success、warning、danger、info
- 支持多种尺寸：large、default、small
- 支持科技风格主题（Tech Theme）
- 支持图标按钮
- 支持加载状态
- 支持禁用状态
- 支持朴素、圆角、圆形、文字、链接等多种样式

## 基础用法

```vue
<template>
  <sc-button>默认按钮</sc-button>
  <sc-button type="primary">主要按钮</sc-button>
  <sc-button type="success">成功按钮</sc-button>
  <sc-button type="warning">警告按钮</sc-button>
  <sc-button type="danger">危险按钮</sc-button>
</template>
```

## Tech 科技风格

```vue
<template>
  <sc-button theme="tech">科技按钮</sc-button>
  <sc-button theme="tech" type="primary">科技主要</sc-button>
  <sc-button theme="tech" type="success">科技成功</sc-button>
  <sc-button theme="tech" type="warning">科技警告</sc-button>
  <sc-button theme="tech" type="danger">科技危险</sc-button>
</template>
```

## 图标按钮

```vue
<template>
  <sc-button icon="ep:search">搜索</sc-button>
  <sc-button theme="tech" icon="ep:upload">上传</sc-button>
  <sc-button circle icon="ep:plus" />
</template>
```

## 加载状态

```vue
<template>
  <sc-button loading>加载中</sc-button>
  <sc-button theme="tech" loading type="primary">加载中</sc-button>
</template>
```

## Props

| 参数       | 说明           | 类型    | 可选值                                                | 默认值  |
| ---------- | -------------- | ------- | ----------------------------------------------------- | ------- |
| type       | 按钮类型       | string  | default / primary / success / warning / danger / info | default |
| size       | 按钮尺寸       | string  | large / default / small                               | default |
| theme      | 主题风格       | string  | default / tech                                        | default |
| disabled   | 是否禁用       | boolean | —                                                     | false   |
| loading    | 是否加载中     | boolean | —                                                     | false   |
| plain      | 是否朴素按钮   | boolean | —                                                     | false   |
| round      | 是否圆角按钮   | boolean | —                                                     | false   |
| circle     | 是否圆形按钮   | boolean | —                                                     | false   |
| text       | 是否文字按钮   | boolean | —                                                     | false   |
| link       | 是否链接按钮   | boolean | —                                                     | false   |
| icon       | 图标           | string  | —                                                     | —       |
| suffixIcon | 后置图标       | string  | —                                                     | —       |
| nativeType | 原生 type 属性 | string  | button / submit / reset                               | button  |

## Events

| 事件名 | 说明           | 回调参数            |
| ------ | -------------- | ------------------- |
| click  | 点击按钮时触发 | (event: MouseEvent) |

## 作者

- **作者**: CH
- **创建时间**: 2025-12-03
- **版本**: 1.0.0
