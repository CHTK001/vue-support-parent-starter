# ScNumber 数字组件

现代化的数字输入组件，支持多种布局模式：数字输入框、滑块、评分、步进器、进度条、圆形进度。

## 特性

- 🎨 **多种布局模式** - 支持 default、slider、rate、stepper、progress、circle 六种布局
- 🎯 **Element Plus 集成** - 基于 el-input-number、el-slider、el-rate、el-progress 封装
- 🔄 **双向绑定** - 完整的 v-model 支持
- 📱 **响应式设计** - 支持 large、default、small 三种尺寸
- 🎭 **现代化样式** - 精心设计的动画和视觉效果

## 基础用法

```vue
<template>
  <!-- 默认数字输入框 -->
  <ScNumber v-model="value1" />

  <!-- 滑块模式 -->
  <ScNumber v-model="value2" layout="slider" :min="0" :max="100" />

  <!-- 评分模式 -->
  <ScNumber v-model="value3" layout="rate" :rate-max="5" />

  <!-- 步进器模式 -->
  <ScNumber v-model="value4" layout="stepper" :min="0" :max="10" />

  <!-- 进度条模式 -->
  <ScNumber v-model="value5" layout="progress" :min="0" :max="100" />

  <!-- 圆形进度模式 -->
  <ScNumber v-model="value6" layout="circle" :min="0" :max="100" />
</template>

<script setup>
import { ref } from "vue";

const value1 = ref(0);
const value2 = ref(50);
const value3 = ref(3);
const value4 = ref(5);
const value5 = ref(60);
const value6 = ref(75);
</script>
```

## 布局模式

### default - 默认数字输入框

基于 `el-input-number` 封装，支持所有原生属性。

```vue
<ScNumber
  v-model="value"
  layout="default"
  :min="0"
  :max="100"
  :step="1"
  :precision="2"
  :controls="true"
  controls-position="right"
/>
```

### slider - 滑块模式

基于 `el-slider` 封装，支持范围选择、标记点等。

```vue
<ScNumber
  v-model="value"
  layout="slider"
  :min="0"
  :max="100"
  :step="10"
  :show-input="true"
  :show-stops="true"
  :marks="{ 0: '0°C', 50: '50°C', 100: '100°C' }"
/>
```

### rate - 评分模式

基于 `el-rate` 封装，支持半星、自定义图标等。

```vue
<ScNumber
  v-model="value"
  layout="rate"
  :rate-max="5"
  :allow-half="true"
  :show-rate-text="true"
  :texts="['极差', '失望', '一般', '满意', '惊喜']"
  :colors="['#F56C6C', '#E6A23C', '#409EFF']"
/>
```

### stepper - 步进器模式

现代化的加减按钮设计，适合数量选择场景。

```vue
<ScNumber
  v-model="value"
  layout="stepper"
  :min="1"
  :max="99"
  :step="1"
  size="large"
/>
```

### progress - 进度条模式

结合进度条显示的数字输入。

```vue
<ScNumber
  v-model="value"
  layout="progress"
  :min="0"
  :max="100"
  :stroke-width="10"
  :show-percentage="true"
  status="success"
/>
```

### circle - 圆形进度模式

圆形进度条显示，适合仪表盘场景。

```vue
<ScNumber
  v-model="value"
  layout="circle"
  :min="0"
  :max="100"
  :circle-size="150"
  :stroke-width="10"
  progress-color="#67C23A"
/>
```

## API

### 通用属性

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| v-model | 绑定值 | `number \| number[]` | `0` |
| layout | 布局模式 | `'default' \| 'slider' \| 'rate' \| 'stepper' \| 'progress' \| 'circle'` | `'default'` |
| size | 尺寸 | `'large' \| 'default' \| 'small'` | `'default'` |
| disabled | 是否禁用 | `boolean` | `false` |
| min | 最小值 | `number` | `-Infinity` |
| max | 最大值 | `number` | `Infinity` |
| step | 步长 | `number` | `1` |
| precision | 数值精度 | `number` | - |

### default 布局属性

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| step-strictly | 是否只能输入步长的倍数 | `boolean` | `false` |
| controls | 是否使用控制按钮 | `boolean` | `true` |
| controls-position | 控制按钮位置 | `'' \| 'right'` | `''` |
| placeholder | 占位文本 | `string` | `''` |

### slider 布局属性

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| show-input | 是否显示输入框 | `boolean` | `false` |
| show-input-controls | 是否显示输入框控制按钮 | `boolean` | `true` |
| show-stops | 是否显示间断点 | `boolean` | `false` |
| show-tooltip | 是否显示提示信息 | `boolean` | `true` |
| format-tooltip | 格式化提示信息 | `(val: number) => string` | - |
| range | 是否为范围选择 | `boolean` | `false` |
| vertical | 是否垂直模式 | `boolean` | `false` |
| height | 垂直模式高度 | `string` | `''` |
| marks | 标记点 | `Record<number, string \| object>` | - |

### rate 布局属性

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| rate-max | 最大分值 | `number` | `5` |
| allow-half | 是否允许半选 | `boolean` | `false` |
| low-threshold | 低分和中等分数的界限值 | `number` | `2` |
| high-threshold | 高分和中等分数的界限值 | `number` | `4` |
| colors | 图标颜色数组 | `string[] \| Record<number, string>` | - |
| void-color | 未选中时图标颜色 | `string` | `'#C6D1DE'` |
| show-rate-text | 是否显示文本 | `boolean` | `false` |
| show-score | 是否显示分数 | `boolean` | `false` |
| texts | 辅助文字数组 | `string[]` | - |
| clearable | 是否可以重置 | `boolean` | `false` |

### stepper 布局属性

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| show-value | 是否显示数值 | `boolean` | `true` |
| value-format | 数值格式化函数 | `(val: number) => string` | - |
| readonly | 是否只读 | `boolean` | `false` |

### progress 布局属性

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| show-percentage | 是否显示百分比 | `boolean` | `true` |
| percentage-format | 百分比格式化函数 | `(val: number) => string` | - |
| stroke-width | 进度条宽度 | `number` | `6` |
| text-inside | 百分比是否在进度条内 | `boolean` | `false` |
| status | 进度条状态 | `'' \| 'success' \| 'exception' \| 'warning'` | `''` |
| progress-color | 进度条颜色 | `string \| string[] \| function` | `''` |
| editable | 是否可编辑 | `boolean` | `true` |

### circle 布局属性

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| circle-size | 圆形大小 | `number` | `126` |
| stroke-width | 进度条宽度 | `number` | `6` |
| progress-color | 进度条颜色 | `string \| string[] \| function` | `''` |
| show-input | 是否显示控制按钮 | `boolean` | `true` |
| editable | 是否可编辑 | `boolean` | `true` |

### 事件

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| change | 值改变时触发 | `(value: number \| number[]) => void` |
| focus | 获得焦点时触发 | `(event: FocusEvent) => void` |
| blur | 失去焦点时触发 | `(event: FocusEvent) => void` |

## 更新日志

### v1.0.0

- 初始版本
- 支持六种布局模式
- 完整的 Element Plus 集成
