# ScText 文本组件

功能丰富的文本组件，支持 el-text 全部功能，并扩展副文本、提示、编辑、复制等功能。

## 特性

- ✅ 完全兼容 el-text 的全部功能
- ✅ 副文本（subtext）支持
- ✅ 提示（tooltip）功能
- ✅ 可编辑（editable）功能
- ✅ 可复制（copyable）功能
- ✅ 自定义字体
- ✅ 文本装饰（加粗、斜体、下划线、删除线等）
- ✅ 特效（渐变、打字机、发光、阴影）
- ✅ 高亮关键词
- ✅ 前后缀图标/文本
- ✅ 链接模式
- ✅ 徽章
- ✅ 加载状态（骨架屏）

## 安装

```bash
pnpm add @repo/components-sc-text
```

## 基础用法

```vue
<template>
  <!-- 基础用法 -->
  <ScText text="Hello World" />

  <!-- 类型 -->
  <ScText text="Primary" type="primary" />
  <ScText text="Success" type="success" />
  <ScText text="Warning" type="warning" />
  <ScText text="Danger" type="danger" />
  <ScText text="Info" type="info" />

  <!-- 大小 -->
  <ScText text="Large" size="large" />
  <ScText text="Default" size="default" />
  <ScText text="Small" size="small" />
</template>
```

## 副文本

```vue
<template>
  <!-- 底部副文本 -->
  <ScText text="主标题" subtext="这是副文本" subtext-position="bottom" />

  <!-- 右侧副文本 -->
  <ScText text="价格" subtext="¥99.00" subtext-position="right" />

  <!-- 使用插槽 -->
  <ScText text="用户名">
    <template #subtext>
      <span style="color: #67c23a">已认证</span>
    </template>
  </ScText>
</template>
```

## 提示功能

```vue
<template>
  <!-- 基础提示 -->
  <ScText text="鼠标悬停显示提示" tooltip="这是提示内容" />

  <!-- 仅截断时显示提示 -->
  <ScText text="这是一段很长的文本，超出部分会显示省略号..." truncated tooltip="完整的文本内容" :tooltip-only-truncated="true" />
</template>
```

## 可编辑

```vue
<template>
  <ScText v-model:text="editableText" editable edit-placeholder="请输入内容" @edit="handleEdit" @edit-start="handleEditStart" @edit-end="handleEditEnd" />
</template>

<script setup>
import { ref } from "vue";

const editableText = ref("点击编辑");

function handleEdit(value) {
  console.log("编辑内容:", value);
}
</script>
```

## 可复制

```vue
<template>
  <ScText text="点击复制这段文字" copyable copy-success-text="已复制到剪贴板" />

  <!-- 自定义复制内容 -->
  <ScText text="显示的文本" copyable copy-text="实际复制的内容" />
</template>
```

## 字体样式

```vue
<template>
  <!-- 自定义字体 -->
  <ScText text="自定义字体" font-family="Georgia, serif" />

  <!-- 字体大小 -->
  <ScText text="大字体" :font-size="24" />

  <!-- 字体粗细 -->
  <ScText text="粗体" :font-weight="700" />

  <!-- 自定义颜色 -->
  <ScText text="彩色文字" color="#ff6600" />
</template>
```

## 文本装饰

```vue
<template>
  <ScText text="加粗" bold />
  <ScText text="斜体" italic />
  <ScText text="下划线" underline />
  <ScText text="删除线" delete />
  <ScText text="标记/高亮" mark />
  <ScText text="代码样式" code />
  <ScText text="键盘样式" keyboard />
</template>
```

## 特效

```vue
<template>
  <!-- 渐变文字 -->
  <ScText text="渐变文字" effect="gradient" :gradient-colors="['#667eea', '#764ba2']" gradient-direction="to-right" />

  <!-- 打字机效果 -->
  <ScText text="打字机效果演示..." effect="typing" :typing-speed="100" />

  <!-- 发光效果 -->
  <ScText text="发光文字" effect="glow" type="primary" />

  <!-- 阴影效果 -->
  <ScText text="阴影文字" effect="shadow" />
</template>
```

## 高亮关键词

```vue
<template>
  <ScText text="在这段文本中搜索关键词并高亮显示" highlight="关键词" highlight-color="#ffc069" />

  <!-- 多个关键词 -->
  <ScText text="Vue 和 React 都是流行的前端框架" :highlight="['Vue', 'React']" />
</template>
```

## 前后缀

```vue
<template>
  <!-- 图标前缀 -->
  <ScText text="用户名" prefix-icon="ep:user" />

  <!-- 文本后缀 -->
  <ScText text="100" suffix="元" />

  <!-- 使用插槽 -->
  <ScText text="价格">
    <template #prefix>¥</template>
    <template #suffix>.00</template>
  </ScText>
</template>
```

## 链接模式

```vue
<template>
  <ScText text="访问官网" href="https://example.com" target="_blank" />
</template>
```

## 徽章

```vue
<template>
  <ScText text="消息" :badge="99" badge-type="danger" />
  <ScText text="在线" badge-dot badge-type="success" />
</template>
```

## 加载状态

```vue
<template>
  <ScText loading :loading-width="150" />
</template>
```

## 截断

```vue
<template>
  <!-- 单行截断 -->
  <ScText text="很长的文本..." truncated style="max-width: 200px" />

  <!-- 多行截断 -->
  <ScText text="很长的文本..." :line-clamp="2" style="max-width: 200px" />
</template>
```

## API

### Props

| 属性                 | 说明             | 类型                                                                     | 默认值       |
| -------------------- | ---------------- | ------------------------------------------------------------------------ | ------------ |
| type                 | 文本类型         | `'primary' \| 'success' \| 'warning' \| 'danger' \| 'info' \| 'default'` | `'default'`  |
| size                 | 文本大小         | `'large' \| 'default' \| 'small'`                                        | `'default'`  |
| truncated            | 是否单行截断     | `boolean`                                                                | `false`      |
| lineClamp            | 多行截断行数     | `number`                                                                 | -            |
| tag                  | 渲染标签         | `string`                                                                 | `'span'`     |
| text                 | 文本内容         | `string`                                                                 | -            |
| subtext              | 副文本内容       | `string`                                                                 | -            |
| subtextPosition      | 副文本位置       | `'top' \| 'bottom' \| 'left' \| 'right'`                                 | `'bottom'`   |
| tooltip              | 提示内容         | `string`                                                                 | -            |
| tooltipPlacement     | 提示位置         | `string`                                                                 | `'top'`      |
| tooltipOnlyTruncated | 仅截断时显示提示 | `boolean`                                                                | `true`       |
| editable             | 是否可编辑       | `boolean`                                                                | `false`      |
| editPlaceholder      | 编辑占位符       | `string`                                                                 | -            |
| editMaxLength        | 编辑最大长度     | `number`                                                                 | -            |
| copyable             | 是否可复制       | `boolean`                                                                | `false`      |
| copyText             | 复制的文本       | `string`                                                                 | -            |
| copySuccessText      | 复制成功提示     | `string`                                                                 | `'复制成功'` |
| fontFamily           | 字体             | `string`                                                                 | -            |
| fontSize             | 字体大小         | `number \| string`                                                       | -            |
| fontWeight           | 字体粗细         | `number \| string`                                                       | -            |
| color                | 字体颜色         | `string`                                                                 | -            |
| bold                 | 是否加粗         | `boolean`                                                                | `false`      |
| italic               | 是否斜体         | `boolean`                                                                | `false`      |
| underline            | 是否下划线       | `boolean`                                                                | `false`      |
| delete               | 是否删除线       | `boolean`                                                                | `false`      |
| mark                 | 是否标记         | `boolean`                                                                | `false`      |
| markColor            | 标记背景色       | `string`                                                                 | -            |
| code                 | 是否代码样式     | `boolean`                                                                | `false`      |
| keyboard             | 是否键盘样式     | `boolean`                                                                | `false`      |
| effect               | 特效             | `'gradient' \| 'typing' \| 'glow' \| 'shadow' \| 'none'`                 | `'none'`     |
| gradientColors       | 渐变颜色         | `string[]`                                                               | -            |
| gradientDirection    | 渐变方向         | `string`                                                                 | `'to-right'` |
| typingSpeed          | 打字速度(ms)     | `number`                                                                 | `50`         |
| typingLoop           | 打字是否循环     | `boolean`                                                                | `false`      |
| highlight            | 高亮关键词       | `string \| string[]`                                                     | -            |
| highlightColor       | 高亮颜色         | `string`                                                                 | `'#ffc069'`  |
| prefixIcon           | 前缀图标         | `string`                                                                 | -            |
| suffixIcon           | 后缀图标         | `string`                                                                 | -            |
| prefix               | 前缀文本         | `string`                                                                 | -            |
| suffix               | 后缀文本         | `string`                                                                 | -            |
| href                 | 链接地址         | `string`                                                                 | -            |
| target               | 链接打开方式     | `string`                                                                 | `'_blank'`   |
| badge                | 徽章内容         | `string \| number`                                                       | -            |
| badgeType            | 徽章类型         | `string`                                                                 | `'danger'`   |
| badgeDot             | 是否圆点徽章     | `boolean`                                                                | `false`      |
| loading              | 是否加载中       | `boolean`                                                                | `false`      |
| loadingWidth         | 骨架屏宽度       | `number \| string`                                                       | -            |
| disabled             | 是否禁用         | `boolean`                                                                | `false`      |
| selectable           | 是否可选中       | `boolean`                                                                | `true`       |

### Events

| 事件名      | 说明                | 回调参数                      |
| ----------- | ------------------- | ----------------------------- |
| update:text | 文本更新（v-model） | `(value: string) => void`     |
| edit        | 编辑完成            | `(value: string) => void`     |
| edit-start  | 开始编辑            | `() => void`                  |
| edit-end    | 结束编辑            | `(value: string) => void`     |
| copy        | 复制成功            | `(value: string) => void`     |
| click       | 点击事件            | `(event: MouseEvent) => void` |

### Slots

| 插槽名  | 说明                  |
| ------- | --------------------- |
| default | 默认内容（替换 text） |
| subtext | 副文本内容            |
| prefix  | 前缀内容              |
| suffix  | 后缀内容              |
| tooltip | 提示内容              |

### Methods

| 方法名          | 说明         | 参数 |
| --------------- | ------------ | ---- |
| startEdit       | 开始编辑     | -    |
| endEdit         | 结束编辑     | -    |
| cancelEdit      | 取消编辑     | -    |
| copyText        | 复制文本     | -    |
| checkTruncation | 检查是否截断 | -    |
