# Prometheus监控页面

## 最新更新

### 组件优化与仪表盘支持 (2023-XX-XX)

1. **仪表盘支持**：

   - 添加了仪表盘组件类型支持
   - 针对仪表盘组件调用`fetchPrometheusQueryGen`接口获取实时数据
   - 优化了仪表盘数据的展示方式

2. **UI组件升级**：
   - 使用`ScSelect`组件替代原生下拉框，提升用户体验
   - 组件类型选择更加直观和易用

### UI优化与全屏功能 (2023-XX-XX)

1. **全屏功能**：

   - 添加了浏览器全屏按钮，可将整个页面全屏显示
   - 添加了容器全屏按钮，可将监控面板在当前页面中全屏显示
   - 全屏状态下自动调整布局以适应新的显示区域

2. **空数据显示优化**：
   - 使用Element Plus的`el-empty`组件优化了无数据时的显示效果
   - 为空布局和空数据图表提供了更友好的视觉反馈

### 参数类型调整 (2023-XX-XX)

已根据修复后的`prometheus/config.ts`中的返回和请求参数类型，调整了页面相关代码：

1. 使用`MonitorSysGenPrometheusConfig`接口定义替代原先的自定义参数
2. 字段名称调整：
   - `configType` → `monitorSysGenPrometheusConfigType`
   - `configContent` → `monitorSysGenPrometheusConfigQl`
   - 新增了多个必要字段，如`monitorSysGenPrometheusConfigName`、`monitorSysGenPrometheusConfigEnable`等
3. 组件配置存储方式调整：
   - 布局配置和组件配置分开存储
   - 布局配置存储在`monitorSysGenPrometheusConfigType: 'layout'`
   - 组件配置存储在`monitorSysGenPrometheusConfigType: 'component'`
   - 组件位置信息存储在`monitorSysGenPrometheusConfigPostion`字段

### 代码修改日志

1. **PrometheusLayout.vue**:

   - 添加了`MonitorSysGenPrometheusConfig`接口导入
   - 添加了`configId`的定义，用于跟踪布局配置ID
   - 修改了`saveConfigToServer`方法，使用新的字段名称
   - 更新了`loadComponentConfigs`方法，支持加载组件配置
   - 修改了`removeComponent`方法，支持删除组件配置并更新了`fetchPrometheusDeleteConfig`的调用参数
   - 添加了`saveComponentConfig`方法，支持保存组件配置
   - 更新了`saveComponent`方法，使其与新的类型定义兼容

2. **README.md**:
   - 添加了参数类型调整的说明
   - 添加了代码修改日志
   - 更新了功能特性和API接口说明

### 总结

此次更新确保了Prometheus监控页面与后端API接口的兼容性，通过以下方式实现：

1. **类型安全**：使用`MonitorSysGenPrometheusConfig`接口定义替代原有的自定义参数类型，确保前后端数据格式一致
2. **字段映射**：将原有字段名称映射到新的字段名称，确保数据正确传输
3. **配置分离**：实现布局配置和组件配置的分离存储，提高了系统的灵活性和可维护性
4. **错误处理**：为各种操作添加了适当的错误处理机制，提高系统稳定性

这些修改不会影响用户体验，但会显著提高系统的稳定性和可维护性。

## 图表库迁移：从Chart.js到ECharts

本项目最初使用Chart.js实现图表功能，现已迁移至ECharts。以下是主要变更：

### 1. 依赖变更

- 移除了Chart.js依赖
- 添加了ECharts依赖 (echarts ^5.4.3)

### 2. 组件结构变更

- 将`<canvas>`元素替换为`<div>`容器
- 使用ECharts的模块化导入方式，减小打包体积

### 3. API差异

| Chart.js                | ECharts                   |
| ----------------------- | ------------------------- |
| `new Chart(ctx, {...})` | `echarts.init(container)` |
| `chart.data = newData`  | `chart.setOption(option)` |
| `chart.update()`        | `chart.setOption(option)` |
| `chart.destroy()`       | `chart.dispose()`         |

### 4. 数据格式转换

添加了`convertToEChartsOption`函数，将Chart.js的数据格式转换为ECharts所需的选项格式：

```js
const convertToEChartsOption = (chartData) => {
  // 将Chart.js数据格式转换为ECharts选项
  // ...
};
```

### 5. 样式调整

- ECharts提供了更丰富的主题和样式定制选项
- 调整了网格线、轴线、标签等样式，使其更符合项目整体风格

### 6. 性能优化

- 使用ECharts的按需引入，减小打包体积
- 优化了窗口大小变化时的重绘逻辑

## 功能特性

- 基本系统监控指标展示（CPU、内存、磁盘、网络）
- 自定义组件功能（支持添加、编辑、删除自定义监控组件）
- 可拖拽布局管理（支持调整组件位置和大小）
- 配置保存到服务器（布局和组件配置自动保存）
- 时间范围选择（支持不同时间范围查看监控数据）
- 数据刷新机制（手动刷新和自动定时刷新）
- 状态显示（Prometheus服务在线状态和查询执行时间）

## 依赖安装

本项目依赖以下库：

1. **ECharts**：用于图表展示

   ```bash
   npm install echarts@5.4.3
   ```

2. **grid-layout-plus**：用于实现可拖拽布局

   ```bash
   npm install grid-layout-plus
   ```

3. **lodash-es**：用于工具函数
   ```bash
   npm install lodash-es
   ```

## 使用说明

### 基本使用

1. 选择Prometheus数据源
2. 查看默认的系统监控指标（CPU、内存、磁盘、网络）
3. 点击"编辑"按钮进入编辑模式，可以添加、编辑、删除和调整自定义组件

### 自定义组件

在编辑模式下，可以：

1. 点击"添加组件"按钮创建新的监控组件
2. 设置组件标题、类型、PromQL查询语句、宽度、高度和刷新间隔
3. 拖拽组件调整位置
4. 拖拽组件边缘调整大小
5. 编辑或删除已有组件

### 布局保存

布局和组件配置会自动保存到服务器，包括：

- 组件位置和大小
- 组件标题和PromQL查询语句
- 刷新间隔设置

## API接口

本功能使用以下API接口：

- `fetchPrometheusQueryRangeGen`：查询Prometheus时序数据
- `fetchPrometheusOnline`：检查Prometheus服务是否在线
- `fetchPrometheusListConfig`：获取保存的配置
- `fetchPrometheusSaveConfig`：保存新配置
- `fetchPrometheusUpdateConfig`：更新已有配置
- `fetchPrometheusDeleteConfig`：删除配置

## 技术实现

1. **Vue 3 Composition API**：使用Vue 3的组合式API实现组件逻辑
2. **ECharts**：使用ECharts实现图表可视化
3. **grid-layout-plus**：实现可拖拽的网格布局
4. **Element Plus**：使用Element Plus组件库实现UI界面
5. **Prometheus API**：使用Prometheus API查询监控数据
