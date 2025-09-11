# ScSwitch 开关组件

一个功能丰富、样式多样的Vue 3开关组件，支持多种布局样式和高度自定义配置。

## 特性

- 🎨 **多种布局**: 支持 `default`、`card`、`slider`、`modern` 四种布局样式
- 🚀 **Vue 3 + TypeScript**: 使用Composition API，提供完整的类型支持
- 🎯 **高度可定制**: 支持自定义颜色、图标、文本、尺寸等
- ⚡ **流畅动画**: 内置平滑过渡动画和视觉反馈
- 📱 **响应式设计**: 完美适配各种屏幕尺寸
- ♿ **无障碍访问**: 支持键盘操作和屏幕阅读器

## 安装

```bash
# 组件已集成在项目中，直接导入使用
import ScSwitch from '@repo/components/ScSwitch'
```

## 基础用法

### 默认布局

```vue
<template>
  <ScSwitch v-model="switchValue" />
</template>

<script setup>
import { ref } from 'vue'
import ScSwitch from '@repo/components/ScSwitch'

const switchValue = ref(false)
</script>
```

### 卡片布局

```vue
<template>
  <ScSwitch 
    v-model="switchValue" 
    layout="card" 
    active-text="开启" 
    inactive-text="关闭" 
  />
</template>
```

### 滑块布局

```vue
<template>
  <ScSwitch 
    v-model="switchValue" 
    layout="slider" 
    active-icon="ep:check" 
    inactive-icon="ep:close" 
    active-text="开启"
    inactive-text="关闭"
  />
</template>
```

### 现代布局

```vue
<template>
  <ScSwitch 
    v-model="switchValue" 
    layout="modern" 
    active-text="ON" 
    inactive-text="OFF" 
    active-icon="ep:check"
    inactive-icon="ep:close"
  />
</template>
```

## 布局样式说明

### Default 默认布局
- 基于Element Plus的el-switch组件
- 简洁的开关样式
- 适合大多数场景

### Card 卡片布局
- 卡片式的容器设计
- 适合表单和设置页面
- 提供更好的视觉分组

### Slider 滑块布局
- 自定义滑块设计
- 支持图标和文本显示
- 提供丰富的视觉反馈
- 支持三种尺寸：small、default、large

### Modern 现代布局
- 现代化的设计风格
- 渐变背景和阴影效果
- 平滑的动画过渡
- 适合现代化的界面设计

## API

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| modelValue | `boolean` | `false` | 开关状态，支持v-model |
| layout | `'default' \| 'card' \| 'slider' \| 'modern'` | `'default'` | 布局类型 |
| size | `'small' \| 'default' \| 'large'` | `'default'` | 尺寸大小（仅slider和modern布局支持） |
| disabled | `boolean` | `false` | 是否禁用 |
| loading | `boolean` | `false` | 是否加载中 |
| activeText | `string` | `''` | 开启时的文字描述 |
| inactiveText | `string` | `''` | 关闭时的文字描述 |
| activeIcon | `string` | `''` | 开启时的图标（支持Element Plus图标） |
| inactiveIcon | `string` | `''` | 关闭时的图标（支持Element Plus图标） |
| activeColor | `string` | `''` | 开启时的背景色 |
| inactiveColor | `string` | `''` | 关闭时的背景色 |
| name | `string` | `''` | 表单项名称 |

### Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| update:modelValue | `(value: boolean)` | 开关状态改变时触发 |
| change | `(value: boolean)` | 开关状态改变时触发 |

## 样式定制

### CSS 变量

组件支持通过CSS变量进行样式定制：

```css
.sc-switch {
  /* 默认布局变量 */
  --el-switch-on-color: #409eff;
  --el-switch-off-color: #dcdfe6;
  
  /* 滑块布局变量 */
  --sc-switch-slider-height: 24px;
  --sc-switch-slider-width: 48px;
  --sc-switch-slider-border-radius: 12px;
  
  /* 现代布局变量 */
  --sc-switch-modern-gradient-start: #667eea;
  --sc-switch-modern-gradient-end: #764ba2;
  --sc-switch-modern-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}
```

### 尺寸定制

```css
/* 自定义小尺寸 */
.sc-switch.is-small {
  --sc-switch-slider-height: 20px;
  --sc-switch-slider-width: 40px;
}

/* 自定义大尺寸 */
.sc-switch.is-large {
  --sc-switch-slider-height: 28px;
  --sc-switch-slider-width: 56px;
}
```

## 完整示例

```vue
<template>
  <div class="switch-demo">
    <!-- 基础用法 -->
    <div class="demo-section">
      <h3>基础用法</h3>
      <ScSwitch v-model="basicValue" />
    </div>

    <!-- 不同布局 -->
    <div class="demo-section">
      <h3>不同布局</h3>
      <ScSwitch v-model="defaultValue" layout="default" active-text="默认" />
      <ScSwitch v-model="cardValue" layout="card" active-text="卡片" />
      <ScSwitch v-model="sliderValue" layout="slider" active-text="滑块" />
      <ScSwitch v-model="modernValue" layout="modern" active-text="现代" />
    </div>

    <!-- 自定义样式 -->
    <div class="demo-section">
      <h3>自定义样式</h3>
      <ScSwitch 
        v-model="customValue" 
        layout="modern"
        size="large"
        active-text="开启"
        inactive-text="关闭"
        active-icon="ep:check"
        inactive-icon="ep:close"
        active-color="#67c23a"
        inactive-color="#f56c6c"
      />
    </div>

    <!-- 禁用状态 -->
    <div class="demo-section">
      <h3>禁用状态</h3>
      <ScSwitch v-model="disabledValue" disabled />
    </div>

    <!-- 加载状态 -->
    <div class="demo-section">
      <h3>加载状态</h3>
      <ScSwitch v-model="loadingValue" loading />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ScSwitch from '@repo/components/ScSwitch'

const basicValue = ref(false)
const defaultValue = ref(false)
const cardValue = ref(true)
const sliderValue = ref(false)
const modernValue = ref(true)
const customValue = ref(false)
const disabledValue = ref(true)
const loadingValue = ref(false)
</script>

<style scoped>
.switch-demo {
  padding: 20px;
}

.demo-section {
  margin-bottom: 30px;
}

.demo-section h3 {
  margin-bottom: 15px;
  color: #303133;
}

.demo-section .sc-switch {
  margin-right: 20px;
  margin-bottom: 10px;
}
</style>
```

## 注意事项

1. **布局兼容性**: 不同布局支持的属性可能有所差异，请参考具体布局的文档说明
2. **图标支持**: 图标属性支持Element Plus图标库，格式为 `ep:icon-name`
3. **样式覆盖**: 如需深度定制样式，建议使用CSS变量而非直接覆盖类名
4. **无障碍访问**: 组件已内置无障碍访问支持，建议保持默认的键盘导航功能

## 更新日志

### v2.0.4 (2025-01-17)
- ✨ 新增现代化布局样式 (`modern`)
- 🎨 添加渐变背景和阴影效果
- ⚡ 优化动画过渡效果
- 📚 完善文档和示例

### v2.0.0 (2025-01-17)
- 🚀 重构为Vue 3 Composition API
- ✨ 新增多种布局支持
- 🎯 增强类型定义
- 📱 优化响应式设计