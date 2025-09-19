# ScMessageDialog 消息对话框组件

## 概述

ScMessageDialog 是一个功能丰富的消息对话框组件，支持实时消息显示、Markdown 渲染、进度条显示、自动滚动等功能。

## 功能特性

- 📝 **消息显示**: 支持纯文本和 Markdown 格式的消息显示
- 📊 **进度条**: 内置进度条显示，支持实时更新
- 🔄 **自动滚动**: 新消息自动滚动到底部
- 📱 **响应式**: 支持拖拽、调整大小、折叠等交互
- 🎨 **自定义样式**: 支持自定义位置、大小、样式
- 🧹 **清除功能**: 支持一键清除所有消息内容

## Props

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| visible | boolean | false | 对话框是否可见 |
| title | string | '消息' | 对话框标题 |
| data | DataItem[] | [] | 消息数据数组 |
| content | string | '' | 纯文本内容 |
| markdownContent | string | '' | Markdown 格式内容 |
| progress | number | 0 | 进度值 (0-100) |
| position | Position | { x: 100, y: 100 } | 对话框位置 |
| width | number | 600 | 对话框宽度 |
| height | number | 400 | 对话框高度 |
| autoScroll | boolean | true | 是否自动滚动到底部 |

## Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| update:visible | boolean | 对话框显示状态变化 |
| close | - | 对话框关闭事件 |
| clear | - | 清除内容事件 |

## 方法

通过 ref 可以调用以下方法：

| 方法名 | 参数 | 说明 |
|--------|------|------|
| clear | - | 清除所有消息内容 |
| close | - | 关闭对话框 |
| toggleCollapse | - | 切换折叠状态 |
| scrollToBottom | - | 滚动到底部 |

## 数据类型

### DataItem

```typescript
interface DataItem {
  id: string;          // 消息唯一标识
  content: string;     // 消息内容
  timestamp: number;   // 时间戳
  type?: string;       // 消息类型
}
```

### Position

```typescript
interface Position {
  x: number;  // X 坐标
  y: number;  // Y 坐标
}
```

## 使用示例

### 基础用法

```vue
<template>
  <ScMessageDialog
    v-model:visible="dialogVisible"
    title="系统消息"
    :data="messages"
    :progress="currentProgress"
    @close="handleClose"
    @clear="handleClear"
  />
</template>

<script setup>
import { ref } from 'vue'
import { ScMessageDialog } from '@vue-support/components'

const dialogVisible = ref(false)
const currentProgress = ref(0)
const messages = ref([
  {
    id: '1',
    content: '系统启动中...',
    timestamp: Date.now(),
    type: 'info'
  }
])

const handleClose = () => {
  console.log('对话框已关闭')
}

const handleClear = () => {
  messages.value = []
  console.log('消息已清除')
}
</script>
```

### 使用 Markdown 内容

```vue
<template>
  <ScMessageDialog
    v-model:visible="dialogVisible"
    title="Markdown 消息"
    :markdown-content="markdownText"
  />
</template>

<script setup>
const markdownText = ref(`
# 标题

这是一段 **粗体** 文本和 *斜体* 文本。

- 列表项 1
- 列表项 2

\`\`\`javascript
console.log('代码块');
\`\`\`
`)
</script>
```

### 通过 ref 调用方法

```vue
<template>
  <ScMessageDialog
    ref="messageDialogRef"
    v-model:visible="dialogVisible"
    title="消息对话框"
    :data="messages"
  />
  
  <button @click="clearMessages">清除消息</button>
  <button @click="scrollToBottom">滚动到底部</button>
</template>

<script setup>
import { ref } from 'vue'

const messageDialogRef = ref()

const clearMessages = () => {
  messageDialogRef.value?.clear()
}

const scrollToBottom = () => {
  messageDialogRef.value?.scrollToBottom()
}
</script>
```

## 样式定制

组件支持通过 CSS 变量进行样式定制：

```css
.sc-message-dialog {
  --dialog-bg-color: rgba(255, 255, 255, 0.95);
  --dialog-border-color: #e4e7ed;
  --dialog-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  --header-bg-color: #f5f7fa;
  --content-bg-color: #ffffff;
}
```

## 注意事项

1. 组件内部使用了 `marked` 库来渲染 Markdown 内容
2. 自动滚动功能在有新消息时会自动触发
3. 清除功能会触发 `clear` 事件，但不会自动清空 `data` 数组，需要在父组件中处理
4. 组件支持拖拽和调整大小，基于 `draggable-resizable-vue3` 实现