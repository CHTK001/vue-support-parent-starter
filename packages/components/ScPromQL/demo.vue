<template>
  <div class="demo-container">
    <h2>PromQL 示例组件演示</h2>
    
    <div class="demo-section">
      <h3>基本用法</h3>
      <div class="component-container">
        <ScPromQL @select-query="handleSelectQuery" />
      </div>
    </div>
    
    <div class="demo-section">
      <h3>带自定义示例</h3>
      <div class="component-container">
        <ScPromQL 
          :customExamples="customExamples"
          @select-query="handleSelectQuery" 
        />
      </div>
    </div>
    
    <div class="demo-section">
      <h3>选中的查询</h3>
      <el-card v-if="selectedQuery" class="selected-query">
        <template #header>
          <div class="card-header">
            <span>已选择的 PromQL 查询</span>
            <el-button type="primary" size="small" @click="executeQuery">执行查询</el-button>
          </div>
        </template>
        <pre>{{ selectedQuery }}</pre>
      </el-card>
      <el-empty v-else description="尚未选择查询" />
    </div>

    <div class="demo-section">
      <h3>查询示例分类</h3>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="系统监控">
          CPU、内存、磁盘、网络、系统
        </el-descriptions-item>
        <el-descriptions-item label="容器与编排">
          容器、Kubernetes
        </el-descriptions-item>
        <el-descriptions-item label="应用监控">
          HTTP、JVM
        </el-descriptions-item>
        <el-descriptions-item label="数据库监控">
          MySQL、PostgreSQL、Redis、MongoDB
        </el-descriptions-item>
        <el-descriptions-item label="告警规则">
          高 CPU/内存使用率、磁盘空间不足、实例宕机等
        </el-descriptions-item>
        <el-descriptions-item label="自定义查询">
          用户自定义的查询示例
        </el-descriptions-item>
      </el-descriptions>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import ScPromQL from './index.vue';
import { ElMessage } from 'element-plus';

// 自定义 PromQL 示例
const customExamples = [
  {
    name: '自定义 API 请求延迟',
    category: 'http',
    description: '显示 API 请求的 95 百分位延迟（毫秒）',
    query: 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))'
  },
  {
    name: '自定义错误率',
    category: 'http',
    description: '显示 HTTP 请求的错误率百分比',
    query: 'sum(rate(http_requests_total{status=~"5.."}[5m])) by (service) / sum(rate(http_requests_total[5m])) by (service) * 100'
  },
  {
    name: '自定义应用内存使用',
    category: 'jvm',
    description: '显示特定应用的内存使用量（MB）',
    query: 'sum(jvm_memory_used_bytes{application="my-app"}) by (instance) / 1024 / 1024'
  },
  {
    name: '自定义数据库连接池监控',
    category: 'database',
    description: '显示数据库连接池使用率',
    query: 'hikaricp_connections_active / hikaricp_connections_max * 100'
  },
  {
    name: '自定义服务可用性告警',
    category: 'alert',
    description: '服务实例可用性低于 80%',
    query: 'sum(up{job="my-service"}) / count(up{job="my-service"}) * 100 < 80'
  }
];

// 选中的查询
const selectedQuery = ref('');

// 处理选择查询的事件
const handleSelectQuery = (query) => {
  selectedQuery.value = query;
  ElMessage({
    message: '已选择查询，可以点击执行按钮来模拟执行',
    type: 'success'
  });
};

// 模拟执行查询
const executeQuery = () => {
  ElMessage({
    message: '正在执行查询: ' + selectedQuery.value,
    type: 'info'
  });
  
  // 这里可以添加实际的查询执行逻辑，例如调用 Prometheus API
  setTimeout(() => {
    ElMessage({
      message: '查询执行完成！',
      type: 'success'
    });
  }, 1500);
};
</script>

<style scoped>
.demo-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.demo-section {
  margin-bottom: 40px;
}

.component-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  height: 500px;
  overflow: hidden;
}

.selected-query {
  margin-top: 20px;
}

.selected-query pre {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style> 