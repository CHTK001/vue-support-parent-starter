# ScDialog 对话框组件

支持两种模式的对话框组件，使用 interact.js 实现拖拽和缩放功能。

## 特性

- **ElementPlus 模式**：使用 `el-dialog` 原生功能
- **自定义模式**：使用 interact.js 实现拖拽和缩放
- **任务栏模式**：支持类似 Windows 操作系统的任务栏功能
- **主题自适应**：全面适配 Stitch Design System，支持浅色/暗黑模式
- **语义化类型**：支持 default/info/success/warning/error 等语义化类型样式
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
| useTaskbar         | 是否使用任务栏               | boolean                                                  | false                                 |
| group              | 分组标识（用于任务栏分组）   | string                                                   | ''                                    |

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

| 方法                  | 说明               |
| --------------------- | ------------------ |
| open()                | 打开对话框         |
| close()               | 关闭对话框         |
| minimize(position?)   | 最小化对话框       |
| minimizeToTaskbar()   | 最小化到任务栏     |
| restoreFromTaskbar()  | 从任务栏恢复       |
| maximize()            | 最大化对话框       |
| restoreFromMaximize() | 从最大化还原       |
| toggleMaximize()      | 切换最大化状态     |
| activate()            | 激活对话框（置顶） |
| isMinimized()         | 是否最小化         |
| isMaximized()         | 是否最大化         |

---

# ScDialogTaskbar 任务栏组件

独立的任务栏组件，用于展示最小化的对话框，类似 Windows 操作系统任务栏。

## 安装

```typescript
import { ScDialogTaskbar } from "@repo/components";
```

## 基础用法

### 使用任务栏

```vue
<template>
  <!-- 任务栏组件 -->
  <ScDialogTaskbar :enabled="true" position="bottom" :height="48" :always-visible="true" :group-collapse="true" />

  <!-- 对话框 -->
  <el-button @click="visible1 = true">打开对话框 1</el-button>
  <el-button @click="visible2 = true">打开对话框 2</el-button>

  <ScDialog v-model="visible1" title="对话框 1" mode="custom" :use-taskbar="true" group="系统设置">
    <p>这是对话框 1 的内容</p>
  </ScDialog>

  <ScDialog v-model="visible2" title="对话框 2" mode="custom" :use-taskbar="true" group="系统设置">
    <p>这是对话框 2 的内容</p>
  </ScDialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ScDialog, ScDialogTaskbar } from "@repo/components";

const visible1 = ref(false);
const visible2 = ref(false);
</script>
```

## ScDialogTaskbar Props

| 属性          | 说明                                    | 类型                                   | 默认值   |
| ------------- | --------------------------------------- | -------------------------------------- | -------- |
| enabled       | 是否启用任务栏                          | boolean                                | true     |
| position      | 任务栏位置                              | 'top' \| 'bottom' \| 'left' \| 'right' | 'bottom' |
| width         | 任务栏宽度（横向布局时，支持 px 和 %）  | string                                 | '100%'   |
| height        | 任务栏高度（纵向布局时为宽度，单位 px） | number                                 | 48       |
| alwaysVisible | 是否永久显示（false 时自动隐藏）        | boolean                                | true     |
| autoHideDelay | 自动隐藏延迟（毫秒）                    | number                                 | 2000     |
| groupCollapse | 是否启用分组自动合并                    | boolean                                | false    |
| zIndex        | z-index 层级                            | number                                 | 3000     |

## ScDialogTaskbar Events

| 事件名           | 说明               | 参数                |
| ---------------- | ------------------ | ------------------- |
| itemClick        | 点击任务栏项       | (item: TaskbarItem) |
| itemClose        | 关闭任务栏项       | (item: TaskbarItem) |
| visibilityChange | 任务栏显示状态变化 | (visible: boolean)  |

## ScDialogTaskbar Exposes

| 方法          | 说明         |
| ------------- | ------------ |
| addItem()     | 添加任务栏项 |
| removeItem()  | 移除任务栏项 |
| updateItem()  | 更新任务栏项 |
| getItem()     | 获取任务栏项 |
| getAllItems() | 获取所有项   |
| clearItems()  | 清空任务栏   |
| show()        | 显示任务栏   |
| hide()        | 隐藏任务栏   |

---

# useTaskbar Composable

任务栏管理器，用于管理对话框的任务栏状态。

## 使用

```typescript
import { useTaskbar } from "@repo/components";

const taskbar = useTaskbar();

// 更新配置
taskbar.updateConfig({
  enabled: true,
  position: "bottom",
  alwaysVisible: true,
  groupCollapse: true
});

// 获取所有任务栏项
const items = taskbar.items;

// 显示/隐藏任务栏
taskbar.showTaskbar();
taskbar.hideTaskbar();
```

## TaskbarConfig 类型

```typescript
interface TaskbarConfig {
  /** 是否启用任务栏 */
  enabled: boolean;
  /** 任务栏位置 */
  position: "top" | "bottom" | "left" | "right";
  /** 任务栏宽度（横向布局时，支持 px 和百分比） */
  width: string;
  /** 任务栏高度（纵向布局时，单位 px） */
  height: number;
  /** 是否永久显示（false 时自动隐藏） */
  alwaysVisible: boolean;
  /** 自动隐藏延迟（毫秒） */
  autoHideDelay: number;
  /** 是否启用分组自动合并 */
  groupCollapse: boolean;
  /** z-index 层级 */
  zIndex: number;
}
```

## TaskbarItem 类型

```typescript
interface TaskbarItem {
  /** 对话框唯一标识 */
  id: string;
  /** 对话框标题 */
  title: string;
  /** 图标 */
  icon: string;
  /** 类型 */
  type: "default" | "info" | "success" | "warning" | "error";
  /** 分组标识 */
  group?: string;
  /** 是否激活 */
  active: boolean;
  /** 时间戳 */
  timestamp: number;
  /** 恢复对话框的回调 */
  restore: () => void;
  /** 关闭对话框的回调 */
  close: () => void;
}
```
