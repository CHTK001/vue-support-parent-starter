# ScPromQL 组件

ScPromQL 是一个提供常用 PromQL（Prometheus Query Language）查询示例的 Vue 组件。它旨在帮助用户在构建监控仪表板时快速找到并使用常见的 Prometheus 查询。

## 功能特点

- 提供分类整理的常用 PromQL 查询示例
- 支持按类别筛选查询示例
- 支持搜索查询示例
- 支持复制查询到剪贴板
- 支持选择查询并在应用中使用
- 支持添加自定义查询示例
- 完全响应式设计，适配不同屏幕尺寸
- 支持暗黑模式

## 安装

```bash
# 使用 npm
npm install @repo/components/ScPromQL

# 使用 yarn
yarn add @repo/components/ScPromQL

# 使用 pnpm
pnpm add @repo/components/ScPromQL
```

## 基本用法

```vue
<template>
  <div style="height: 500px;">
    <ScPromQL @select-query="handleSelectQuery" />
  </div>
</template>

<script setup>
import ScPromQL from '@repo/components/ScPromQL';

const handleSelectQuery = (query) => {
  console.log('选中的查询:', query);
  // 在这里处理选中的查询
};
</script>
```

## 添加自定义查询示例

```vue
<template>
  <div style="height: 500px;">
    <ScPromQL 
      :customExamples="customExamples"
      @select-query="handleSelectQuery" 
    />
  </div>
</template>

<script setup>
import ScPromQL from '@repo/components/ScPromQL';

// 自定义 PromQL 示例
const customExamples = [
  {
    name: '自定义 API 请求延迟',
    category: 'custom', // 可选，默认为 'custom'
    description: '显示 API 请求的 95 百分位延迟（毫秒）',
    query: 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))'
  },
  {
    name: '自定义错误率',
    category: 'custom',
    description: '显示 HTTP 请求的错误率百分比',
    query: 'sum(rate(http_requests_total{status=~"5.."}[5m])) by (service) / sum(rate(http_requests_total[5m])) by (service) * 100'
  }
];

const handleSelectQuery = (query) => {
  console.log('选中的查询:', query);
  // 在这里处理选中的查询
};
</script>
```

## 属性

| 属性名 | 类型 | 默认值 | 说明 |
|-------|------|-------|------|
| customExamples | Array | [] | 自定义的 PromQL 查询示例 |

## 事件

| 事件名 | 参数 | 说明 |
|-------|------|------|
| select-query | query: string | 当用户选择一个查询时触发 |

## 自定义示例格式

```javascript
{
  name: '查询名称',
  category: 'custom', // 可选类别，见下方列表
  description: '查询描述',
  query: 'PromQL 查询语句'
}
```

## 默认提供的查询示例分类

组件内置了以下分类的查询示例：

- **CPU 相关查询**：CPU 使用率、负载、上下文切换率等
- **内存相关查询**：内存使用率、可用内存、交换空间使用等
- **磁盘相关查询**：磁盘使用率、I/O 操作、读写速率、IOPS 等
- **网络相关查询**：网络收发速率、错误率、TCP 连接状态等
- **系统相关查询**：系统启动时间、进程数、文件描述符使用率等
- **容器相关查询**：容器 CPU/内存使用、网络收发速率等
- **Kubernetes 相关查询**：Pod 资源使用、节点状态、部署状态等
- **数据库相关查询**：MySQL、PostgreSQL、Redis、MongoDB 等数据库监控指标
- **HTTP 相关查询**：请求率、错误率、延迟、状态码分布等
- **JVM 相关查询**：堆内存使用、GC 暂停时间、线程数等
- **告警规则示例**：常用的告警规则模板，如高 CPU 使用率、磁盘空间不足等

## 可用的类别值

在自定义示例中，可以使用以下类别值：

- `cpu` - CPU 相关查询
- `memory` - 内存相关查询
- `disk` - 磁盘相关查询
- `network` - 网络相关查询
- `system` - 系统相关查询
- `container` - 容器相关查询
- `kubernetes` - Kubernetes 相关查询
- `database` - 数据库相关查询
- `http` - HTTP 相关查询
- `jvm` - JVM 相关查询
- `alert` - 告警规则示例
- `custom` - 自定义查询（默认）

## 许可证

MIT 