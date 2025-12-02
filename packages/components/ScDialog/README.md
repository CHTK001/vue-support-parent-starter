# ScDialog 对话框组件

支持两种模式的对话框组件，使用 interact.js 实现拖拽和缩放功能。

## 特性

- **ElementPlus 模式**：使用 `el-dialog` 原生功能
- **自定义模式**：使用 interact.js 实现拖拽和缩放
- 支持多种类型样式（default/info/success/warning/error）
- 完整的插槽支持

## 安装

```typescript
import { ScDialog } from "@repo/components";
```

## 基础用法

### ElementPlus 模式（默认）

```vue
<template>
  <el-button @click="visible = true">打开对话框</el-button>

  <ScDialog v-model="visible" title="对话框标题" mode="element">
    <p>这是对话框内容</p>
  </ScDialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ScDialog } from "@repo/components";

const visible = ref(false);
</script>
```

### 自定义模式（拖拽/缩放）

```vue
<template>
  <el-button @click="visible = true">打开可拖拽对话框</el-button>

  <ScDialog v-model="visible" title="可拖拽对话框" mode="custom" :draggable="true" :resizable="true">
    <p>拖动头部移动，拖动边缘缩放</p>
  </ScDialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ScDialog } from "@repo/components";

const visible = ref(false);
</script>
```

### 带类型的对话框

```vue
<template>
  <ScDialog v-model="visible" title="成功" type="success" mode="element">
    <p>操作成功！</p>
  </ScDialog>

  <ScDialog v-model="visible2" title="警告" type="warning" mode="element">
    <p>请注意！</p>
  </ScDialog>
</template>
```

### 自定义底部按钮

```vue
<template>
  <ScDialog v-model="visible" title="确认操作" mode="element" confirm-text="确定提交" cancel-text="取消操作" :loading="submitting" @confirm="handleConfirm" @cancel="handleCancel">
    <p>确定要执行此操作吗？</p>
  </ScDialog>
</template>

<script setup lang="ts">
import { ref } from "vue";

const visible = ref(false);
const submitting = ref(false);

const handleConfirm = async () => {
  submitting.value = true;
  // 执行操作...
  submitting.value = false;
  visible.value = false;
};

const handleCancel = () => {
  visible.value = false;
};
</script>
```

### 使用插槽

```vue
<template>
  <ScDialog v-model="visible" mode="element">
    <template #header>
      <div class="custom-header">
        <IconifyIconOnline icon="ri:settings-line" />
        <span>自定义头部</span>
      </div>
    </template>

    <p>对话框内容</p>

    <template #footer>
      <el-button @click="visible = false">自定义按钮</el-button>
    </template>
  </ScDialog>
</template>
```

## Props

| 属性               | 说明                         | 类型                                                     | 默认值                                |
| ------------------ | ---------------------------- | -------------------------------------------------------- | ------------------------------------- |
| modelValue         | 是否显示                     | boolean                                                  | false                                 |
| mode               | 模式                         | 'element' \| 'custom'                                    | 'element'                             |
| title              | 标题                         | string                                                   | ''                                    |
| type               | 类型                         | 'default' \| 'info' \| 'success' \| 'warning' \| 'error' | 'default'                             |
| width              | 宽度                         | string \| number                                         | '500px'                               |
| top                | 距离顶部                     | string                                                   | '15vh'                                |
| modal              | 是否显示遮罩                 | boolean                                                  | true                                  |
| draggable          | 是否可拖拽                   | boolean                                                  | true                                  |
| resizable          | 是否可缩放（仅 custom 模式） | boolean                                                  | false                                 |
| showClose          | 显示关闭按钮                 | boolean                                                  | true                                  |
| closeOnClickModal  | 点击遮罩关闭                 | boolean                                                  | false                                 |
| closeOnPressEscape | ESC 关闭                     | boolean                                                  | true                                  |
| showFooter         | 显示底部                     | boolean                                                  | true                                  |
| showCancelButton   | 显示取消按钮                 | boolean                                                  | true                                  |
| showConfirmButton  | 显示确认按钮                 | boolean                                                  | true                                  |
| cancelText         | 取消按钮文本                 | string                                                   | '取消'                                |
| confirmText        | 确认按钮文本                 | string                                                   | '确定'                                |
| loading            | 确认按钮加载状态             | boolean                                                  | false                                 |
| minSize            | 最小尺寸（仅 custom 模式）   | { width: number; height: number }                        | { width: 300, height: 200 }           |
| maxSize            | 最大尺寸（仅 custom 模式）   | { width: number; height: number }                        | { width: Infinity, height: Infinity } |

## Events

| 事件名            | 说明                       | 参数                                      |
| ----------------- | -------------------------- | ----------------------------------------- |
| update:modelValue | 显示状态变更               | (value: boolean)                          |
| open              | 对话框打开                 | -                                         |
| opened            | 对话框打开动画结束         | -                                         |
| close             | 对话框关闭                 | -                                         |
| closed            | 对话框关闭动画结束         | -                                         |
| cancel            | 点击取消按钮               | -                                         |
| confirm           | 点击确认按钮               | -                                         |
| resize            | 尺寸变化（仅 custom 模式） | (size: { width: number; height: number }) |

## Slots

| 插槽名  | 说明       |
| ------- | ---------- |
| default | 对话框内容 |
| header  | 自定义头部 |
| footer  | 自定义底部 |

## Exposes

| 方法    | 说明       |
| ------- | ---------- |
| open()  | 打开对话框 |
| close() | 关闭对话框 |
