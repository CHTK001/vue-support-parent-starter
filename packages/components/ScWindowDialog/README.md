# ScWindowDialog 组件

## 概述

ScWindowDialog 是一个基于 draggable-resizable-vue3 的增强对话框组件，提供了拖拽、调整大小、多主题样式、图标支持等丰富功能。

## 功能特性

- 🖱️ **拖拽功能**：支持拖拽移动对话框位置
- 📏 **调整大小**：支持拖拽边缘调整对话框尺寸
- 🎨 **多主题支持**：内置 6 种主题样式（default、primary、success、warning、danger、info）
- 🎯 **图标支持**：标题支持显示图标，使用 IconifyIconOnline 组件
- 🌈 **现代化设计**：优雅的边框、阴影效果、动画过渡
- 📱 **响应式设计**：适配移动端和桌面端
- 🌙 **暗色主题**：自动适配系统暗色主题
- ⚡ **高性能**：优化的样式和动画效果
- 🆔 **全局ID管理**：支持多个对话框同时存在，每个对话框都有唯一标识
- 🔝 **智能激活**：点击对话框自动置顶，优化多窗口交互体验
- 📦 **自动收缩**：拖拽到边缘时自动收缩为小方块，节省屏幕空间
- 🚫 **事件隔离**：解决多弹框点击穿透问题

## 安装使用

### 基础用法

```vue
<template>
  <div>
    <el-button @click="dialogVisible = true">打开对话框</el-button>
    
    <ScWindowDialog
      v-model="dialogVisible"
      title="基础对话框"
      :width="500"
      :height="400"
    >
      <p>这是对话框的内容</p>
    </ScWindowDialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const dialogVisible = ref(false)
</script>
```

### 带图标的对话框

```vue
<template>
  <ScWindowDialog
    v-model="dialogVisible"
    title="成功提示"
    icon="mdi:check-circle"
    theme="success"
    :width="400"
    :height="300"
  >
    <p>操作已成功完成！</p>
    
    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </ScWindowDialog>
</template>
```

### 不同主题样式

```vue
<template>
  <div>
    <!-- 默认主题 -->
    <ScWindowDialog
      v-model="defaultVisible"
      title="默认主题"
      theme="default"
    >
      <p>默认主题对话框</p>
    </ScWindowDialog>
    
    <!-- 主要主题 -->
    <ScWindowDialog
      v-model="primaryVisible"
      title="主要主题"
      icon="mdi:information"
      theme="primary"
    >
      <p>主要主题对话框</p>
    </ScWindowDialog>
    
    <!-- 成功主题 -->
    <ScWindowDialog
      v-model="successVisible"
      title="成功主题"
      icon="mdi:check-circle"
      theme="success"
    >
      <p>成功主题对话框</p>
    </ScWindowDialog>
    
    <!-- 警告主题 -->
    <ScWindowDialog
      v-model="warningVisible"
      title="警告主题"
      icon="mdi:alert"
      theme="warning"
    >
      <p>警告主题对话框</p>
    </ScWindowDialog>
    
    <!-- 错误主题 -->
    <ScWindowDialog
      v-model="errorVisible"
      title="错误主题"
      icon="mdi:close-circle"
      theme="error"
    >
      <p>错误主题对话框</p>
    </ScWindowDialog>
    
    <!-- 信息主题 -->
    <ScWindowDialog
      v-model="infoVisible"
      title="信息主题"
      icon="mdi:information-outline"
      theme="info"
    >
      <p>信息主题对话框</p>
    </ScWindowDialog>
  </div>
</template>
```

### 自定义头部和底部

```vue
<template>
  <ScWindowDialog
    v-model="dialogVisible"
    width="600px"
  >
    <!-- 自定义头部 -->
    <template #header="{ close }">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <IconifyIconOnline icon="mdi:cog" style="color: #409eff;" />
          <span>自定义标题</span>
        </div>
        <el-button type="text" @click="close">×</el-button>
      </div>
    </template>
    
    <p>自定义头部的对话框内容</p>
    
    <!-- 自定义底部 -->
    <template #footer>
      <div style="text-align: right;">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确认</el-button>
      </div>
    </template>
  </ScWindowDialog>
</template>
```

### 多弹框管理

```vue
<template>
  <div>
    <el-button @click="showMultipleDialogs">打开多个对话框</el-button>
    
    <!-- 对话框1 -->
    <ScWindowDialog
      v-model="dialog1Visible"
      title="对话框 1"
      dialog-id="dialog-1"
      draggable
      width="400px"
    >
      <p>这是第一个对话框</p>
    </ScWindowDialog>
    
    <!-- 对话框2 -->
    <ScWindowDialog
      v-model="dialog2Visible"
      title="对话框 2"
      dialog-id="dialog-2"
      draggable
      width="400px"
    >
      <p>这是第二个对话框</p>
    </ScWindowDialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const dialog1Visible = ref(false)
const dialog2Visible = ref(false)

const showMultipleDialogs = () => {
  dialog1Visible.value = true
  dialog2Visible.value = true
}
</script>
```

### 自动收缩功能

```vue
<template>
  <ScWindowDialog
    v-model="dialogVisible"
    title="自动收缩对话框"
    id="shrink-dialog"
    :draggable="true"
    :auto-shrink="true"
    :shrink-size="64"
    :width="500"
    :height="400"
  >
    <p>拖拽此对话框到浏览器边缘，它会自动收缩为64x64px的小方块</p>
    <p>点击小方块可以恢复到原始大小</p>
  </ScWindowDialog>
</template>
```

### 激活功能演示

```vue
<template>
  <div>
    <!-- 多个对话框，点击任意一个都会自动置顶 -->
    <ScWindowDialog
      v-for="dialog in dialogs"
      :key="dialog.id"
      v-model="dialog.visible"
      :title="dialog.title"
      :id="dialog.id"
      :draggable="true"
      :width="400"
      :height="300"
    >
      <p>{{ dialog.content }}</p>
      <p>点击此对话框会自动置顶</p>
    </ScWindowDialog>
  </div>
</template>
```

## API 参考

### Props

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| modelValue | boolean | false | 是否显示对话框 |
| theme | ThemeType | 'default' | 主题类型 |
| icon | string | - | 标题图标（Iconify 图标名称） |
| title | string | - | 对话框标题 |
| width | number | 500 | 对话框宽度（像素） |
| height | number | 400 | 对话框高度（像素） |
| top | number | 100 | 对话框距离顶部的距离（像素） |
| left | number | 100 | 对话框距离左侧的距离（像素） |
| fullscreen | boolean | false | 是否全屏显示 |
| modal | boolean | false | 是否显示遮罩层 |
| customClass | string | - | 对话框的自定义类名 |
| closeOnClickModal | boolean | false | 是否可以通过点击 modal 关闭对话框 |
| closeOnPressEscape | boolean | true | 是否可以通过按下 ESC 关闭对话框 |
| showClose | boolean | true | 是否显示关闭按钮 |
| beforeClose | Function | - | 关闭前的回调 |
| draggable | boolean | true | 是否可拖拽 |
| resizable | boolean | true | 是否可调整大小 |
| minWidth | number | 200 | 最小宽度（像素） |
| minHeight | number | 150 | 最小高度（像素） |
| maxWidth | number | 9999 | 最大宽度（像素） |
| maxHeight | number | 9999 | 最大高度（像素） |
| zIndex | number | 2000 | 设置 z-index |
| bodyClass | string | - | 内容区的自定义类名 |
| footerClass | string | - | 底部的自定义类名 |
| **id** | string | - | **对话框唯一标识，用于全局管理多个对话框** |
| **autoShrink** | boolean | true | **是否启用自动收缩功能** |
| **shrinkSize** | number | 64 | **收缩后的尺寸（像素）** |

### 主题类型 (ThemeType)

```typescript
type ThemeType = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
```

### Events

| 事件名 | 说明 | 参数 |
|--------|------|------|
| update:modelValue | 更新 modelValue | (value: boolean) |
| open | 对话框打开的回调 | - |
| close | 对话框关闭的回调 | - |
| dragStart | 开始拖拽时的回调 | (event: DragEvent) |
| dragging | 拖拽过程中的回调 | (event: DragEvent) |
| dragEnd | 拖拽结束时的回调 | (event: DragEvent) |
| resizeStart | 开始调整大小时的回调 | (event: ResizeEvent) |
| resizing | 调整大小过程中的回调 | (event: ResizeEvent) |
| resizeEnd | 调整大小结束时的回调 | (event: ResizeEvent) |
| activated | 对话框被激活时的回调 | - |
| shrink | 对话框收缩时的回调 | - |
| restore | 对话框恢复时的回调 | - |

### Slots

| 插槽名 | 说明 | 参数 |
|--------|------|------|
| default | 对话框的内容 | - |
| header | 对话框标题区的内容 | { close: Function, titleId: string, titleClass: string } |
| header-extra | 标题区额外内容 | { close: Function } |
| footer | 对话框按钮操作区的内容 | - |

## 样式定制

### CSS 变量

组件使用 Element Plus 的 CSS 变量，你可以通过覆盖这些变量来自定义样式：

```css
:root {
  --el-color-primary: #409eff;
  --el-color-success: #67c23a;
  --el-color-warning: #e6a23c;
  --el-color-danger: #f56c6c;
  --el-color-info: #909399;
}
```

### 自定义主题

你可以通过 CSS 类名来自定义主题样式：

```css
.sc-window-dialog--custom {
  .sc-window-dialog__header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-bottom: 1px solid #9f7aea;
  }
  
  .sc-window-dialog__icon {
    color: #9f7aea;
  }
  
  .sc-window-dialog__title {
    color: #ffffff;
  }
}
```

## 新功能详解

### 全局ID管理

- **自动生成ID**：如果未提供 `dialogId`，组件会自动生成唯一标识
- **多弹框支持**：支持同时打开多个对话框，每个都有独立的状态管理
- **ID复用**：相同ID的对话框会复用状态，避免重复创建

### 激活功能

- **自动置顶**：点击任意对话框会自动调整其z-index到最高层
- **智能管理**：其他对话框的z-index保持不变，只提升被点击的对话框
- **无缝体验**：激活过程平滑无感知，提供更好的多窗口交互体验

### 自动收缩功能

- **边缘检测**：拖拽对话框到距离浏览器边缘20px以内时自动触发收缩
- **智能收缩**：收缩为指定尺寸的圆形小方块，默认64x64px
- **一键恢复**：点击收缩后的小方块或拖拽离开边缘即可恢复原始大小
- **状态保持**：收缩状态下仍保持对话框的所有功能和数据

## 注意事项

1. **图标依赖**：组件使用 `IconifyIconOnline` 组件显示图标，请确保项目中已正确配置
2. **主题样式**：主题样式会影响头部背景和图标颜色，选择合适的主题以匹配内容类型
3. **响应式**：组件在移动端会自动调整样式，在小屏幕设备上会占满全屏
4. **性能**：组件包含动画效果，在低性能设备上可能需要适当调整
5. **插件依赖**：组件基于 `draggable-resizable-vue3` 插件实现拖拽和缩放功能
6. **ID唯一性**：使用多个对话框时，建议为每个对话框设置唯一的 `dialogId`
7. **拖拽功能**：自动收缩功能需要配合 `draggable` 属性使用
8. **边缘检测**：自动收缩的边缘检测基于浏览器窗口，不包括滚动条区域
9. **数值类型**：width、height、top、left 等属性现在只接受 number 类型

## 更新日志

### v2.0.0 (2024-01-XX)

- 🔥 **重大更新**：移除 el-dialog 依赖，使用 draggable-resizable-vue3 重新实现
- ✨ 新增拖拽功能，支持自由拖拽对话框
- ✨ 新增调整大小功能，支持八个方向的缩放
- ✨ 新增最小/最大尺寸限制
- ✨ 新增网格吸附功能
- ✨ 新增比例锁定功能
- ✨ 优化自动收缩功能，更加智能和流畅
- ✨ 新增多种拖拽和缩放事件
- 🔧 属性类型调整：width、height、top、left 等改为 number 类型
- 🔧 移除部分 el-dialog 特有属性，专注于拖拽缩放功能

### v1.0.0 (2024-01-XX)

- ✨ 初始版本发布
- ✨ 支持 el-dialog 所有功能
- ✨ 新增 theme 属性支持
- ✨ 新增 icon 属性支持
- ✨ 新增多种主题样式
- ✨ 新增响应式设计
- ✨ 新增暗色主题支持
- ✨ 新增动画效果