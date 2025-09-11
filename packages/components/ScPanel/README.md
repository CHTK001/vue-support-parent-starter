# ScPanel 面板组件

一个基于 Element Plus Popover 的高级面板组件，提供美观的弹出面板功能，支持多种定位方式和自定义样式。

## 特性

- 🎨 **美观设计**: 现代化的毛玻璃效果和阴影
- 📍 **灵活定位**: 支持四个方向的定位
- 🎛️ **可配置**: 支持自定义宽度、高度和行为
- 🌙 **主题适配**: 自动适配明暗主题
- 🔧 **易于使用**: 简单的 API 设计

## 基础用法

```vue
<template>
  <ScPanel v-model:visible="panelVisible">
    <template #reference>
      <el-button @click="panelVisible = true">打开面板</el-button>
    </template>
    
    <div class="p-4">
      <h3>面板内容</h3>
      <p>这里是面板的内容区域</p>
    </div>
  </ScPanel>
</template>

<script setup>
import { ref } from 'vue'

const panelVisible = ref(false)
</script>
```

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `visible` | 面板显示状态 | `boolean` | `false` |
| `position` | 面板定位方向 | `'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left'` | `'bottom-right'` |
| `width` | 面板宽度 | `string \| number` | `'320px'` |
| `maxHeight` | 面板最大高度 | `string \| number` | `'460px'` |
| `closeOnClickOutside` | 点击外部是否关闭面板 | `boolean` | `true` |

### Events

| 事件名 | 说明 | 参数 |
| --- | --- | --- |
| `update:visible` | 面板显示状态改变时触发 | `(value: boolean)` |
| `close` | 面板关闭时触发 | `()` |

### Slots

| 插槽名 | 说明 |
| --- | --- |
| `reference` | 触发面板显示的元素 |
| `default` | 面板内容 |

## 使用示例

### 不同定位方向

```vue
<template>
  <div class="demo-container">
    <!-- 右下角 -->
    <ScPanel v-model:visible="visible1" position="bottom-right">
      <template #reference>
        <el-button>右下角</el-button>
      </template>
      <div class="panel-content">右下角面板内容</div>
    </ScPanel>
    
    <!-- 左下角 -->
    <ScPanel v-model:visible="visible2" position="bottom-left">
      <template #reference>
        <el-button>左下角</el-button>
      </template>
      <div class="panel-content">左下角面板内容</div>
    </ScPanel>
    
    <!-- 右上角 -->
    <ScPanel v-model:visible="visible3" position="top-right">
      <template #reference>
        <el-button>右上角</el-button>
      </template>
      <div class="panel-content">右上角面板内容</div>
    </ScPanel>
    
    <!-- 左上角 -->
    <ScPanel v-model:visible="visible4" position="top-left">
      <template #reference>
        <el-button>左上角</el-button>
      </template>
      <div class="panel-content">左上角面板内容</div>
    </ScPanel>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const visible1 = ref(false)
const visible2 = ref(false)
const visible3 = ref(false)
const visible4 = ref(false)
</script>
```

### 自定义尺寸

```vue
<template>
  <ScPanel 
    v-model:visible="visible" 
    width="500px" 
    max-height="300px"
  >
    <template #reference>
      <el-button>自定义尺寸面板</el-button>
    </template>
    
    <div class="p-6">
      <h3>自定义尺寸面板</h3>
      <p>这个面板的宽度是 500px，最大高度是 300px</p>
      <div class="mt-4">
        <el-button @click="visible = false">关闭</el-button>
      </div>
    </div>
  </ScPanel>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)
</script>
```

### 禁用外部点击关闭

```vue
<template>
  <ScPanel 
    v-model:visible="visible" 
    :close-on-click-outside="false"
  >
    <template #reference>
      <el-button>手动关闭面板</el-button>
    </template>
    
    <div class="p-4">
      <h3>手动关闭面板</h3>
      <p>这个面板不会在点击外部时自动关闭</p>
      <el-button @click="visible = false" type="primary">手动关闭</el-button>
    </div>
  </ScPanel>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)
</script>
```

## 样式定制

组件使用了现代化的毛玻璃效果和阴影，自动适配明暗主题。如需自定义样式，可以通过以下方式：

```css
/* 自定义面板内容样式 */
.sc-panel-content {
  /* 你的自定义样式 */
}

/* 暗色主题下的自定义样式 */
.dark .sc-panel-content {
  /* 暗色主题下的自定义样式 */
}
```

## 注意事项

1. 组件基于 Element Plus 的 Popover 组件实现
2. 面板内容会自动应用毛玻璃效果和阴影
3. 支持明暗主题自动切换
4. 建议在面板内容中添加适当的内边距

## 更新日志

### v1.0.0
- 初始版本发布
- 支持四个方向的面板定位
- 支持自定义宽度和高度
- 支持明暗主题适配
- 支持毛玻璃效果和现代化阴影