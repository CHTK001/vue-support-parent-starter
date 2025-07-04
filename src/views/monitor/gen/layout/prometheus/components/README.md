# 图表配置功能说明

## 概述

本功能为布局页面中的每个ECharts图表提供独立的参数调整功能，并将这些设置保存到服务器的布局组件设置表中。

## 功能特性

### 1. 图表配置对话框 (ChartConfigDialog.vue)

提供了一个通用的图表配置对话框，支持以下配置选项：

#### 基础配置
- **图表标题**: 自定义图表显示标题
- **图表类型**: 支持折线图、柱状图、面积图、仪表盘、饼图、散点图
- **数据单位**: 设置数据的单位（如：MB、%、个等）

#### 样式配置
- **主要颜色**: 图表的主色调
- **背景颜色**: 图表背景色（支持透明度）
- **显示图例**: 控制是否显示图例
- **平滑曲线**: 折线图是否使用平滑曲线
- **填充区域**: 是否填充图表区域
- **堆叠显示**: 柱状图和面积图的堆叠模式

#### 坐标轴配置
- **Y轴最小值/最大值**: 自定义Y轴范围
- **显示网格**: 控制网格线显示
- **显示标签**: 控制数据标签显示

#### 阈值配置
- **动态阈值**: 支持添加多个阈值线
- **阈值颜色**: 每个阈值的颜色设置
- **阈值标签**: 阈值的文字说明

#### 动画配置
- **启用动画**: 控制图表动画开关
- **动画时长**: 设置动画持续时间
- **动画延迟**: 设置动画开始延迟

### 2. 图表组件更新

已更新以下图表组件以支持新的配置选项：

- **LineChart.vue**: 折线图组件
- **BarChart.vue**: 柱状图组件  
- **GaugeChart.vue**: 仪表盘组件

每个组件都支持：
- 动画配置应用
- 网格显示控制
- 数据标签显示
- 阈值线显示

### 3. PrometheusLayout 集成

在 PrometheusLayout 组件中集成了新的图表配置功能：

- 每个图表组件都有配置按钮
- 点击配置按钮打开图表配置对话框
- 配置保存后立即应用到图表
- 配置数据保存到服务器（需要后端API支持）

## 使用方法

### 1. 在布局页面中使用

```vue
<template>
  <!-- 图表组件 -->
  <LineChart 
    :chart-data="chartData" 
    :chart-config="chartConfig"
    :height="300"
  />
  
  <!-- 配置按钮 -->
  <el-button @click="editChartConfig(chartItem)">
    <IconifyIconOnline icon="ri:settings-line" />
    配置
  </el-button>
  
  <!-- 配置对话框 -->
  <ChartConfigDialog 
    ref="chartConfigDialogRef" 
    @confirm="handleChartConfigConfirm"
    @cancel="handleChartConfigCancel"
  />
</template>

<script setup>
import ChartConfigDialog from "./ChartConfigDialog.vue";

const chartConfigDialogRef = ref();

// 编辑图表配置
const editChartConfig = (item) => {
  const config = {
    title: item.title,
    type: item.type,
    // ... 其他配置
  };
  chartConfigDialogRef.value?.open(config);
};

// 处理配置确认
const handleChartConfigConfirm = (config) => {
  // 应用配置到图表
  // 保存配置到服务器
};
</script>
```

### 2. 演示页面

访问 `/example/chart-config` 可以查看图表配置功能的演示。

## API 接口

### 前端API (layout.ts)

- `saveComponentChartConfig`: 保存单个组件的图表配置
- `fetchComponentChartConfig`: 获取组件的图表配置
- `batchSaveComponentChartConfig`: 批量保存组件图表配置

### 后端API (需要实现)

- `POST /v1/gen/server/layout/component/config/{serverId}`: 保存组件配置
- `GET /v1/gen/server/layout/component/config/{serverId}/{componentId}`: 获取组件配置
- `POST /v1/gen/server/layout/component/config/batch/{serverId}`: 批量保存配置

## 数据结构

### ChartConfig 接口

```typescript
interface ChartConfig {
  title?: string;
  type?: string;
  unit?: string;
  mainColor?: string;
  bgColor?: string;
  showLegend?: boolean;
  smooth?: boolean;
  fill?: boolean;
  stacked?: boolean;
  yAxisMin?: number | null;
  yAxisMax?: number | null;
  showGrid?: boolean;
  showLabel?: boolean;
  thresholds?: Array<{
    value: number;
    color: string;
    label: string;
  }>;
  animation?: boolean;
  animationDuration?: number;
  animationDelay?: number;
}
```

## 注意事项

1. 后端API接口需要根据实际项目结构进行实现
2. 图表配置保存到数据库需要对应的表结构支持
3. 不同类型的图表支持的配置选项可能有所不同
4. 建议在生产环境中添加配置验证和错误处理

## 扩展建议

1. 添加更多图表类型支持
2. 支持图表模板功能
3. 添加配置导入/导出功能
4. 支持图表配置的版本管理
5. 添加配置预览功能
