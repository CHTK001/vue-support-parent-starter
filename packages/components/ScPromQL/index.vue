<template>
  <div class="sc-promql-container">
    <div class="sc-promql-header">
      <h3 class="sc-promql-title">{{ t('promql.title') }}</h3>
      <el-input
        v-model="searchQuery"
        :placeholder="t('promql.search')"
        clearable
        prefix-icon="Search"
        @input="handleSearch"
      />
    </div>

    <div class="sc-promql-categories">
      <el-tabs v-model="activeCategory" @tab-click="handleCategoryChange">
        <el-tab-pane 
          v-for="category in categories" 
          :key="category.value" 
          :label="t(`promql.categories.${category.value}`)" 
          :name="category.value"
        />
      </el-tabs>
    </div>

    <div class="sc-promql-examples">
      <el-collapse v-model="activeExamples">
        <el-collapse-item 
          v-for="(example, index) in filteredExamples" 
          :key="index" 
          :name="index"
        >
          <template #title>
            <div class="example-title">
              <span>{{ example.name }}</span>
              <el-tag size="small" effect="light">{{ example.category }}</el-tag>
            </div>
          </template>
          <div class="example-content">
            <div class="example-description">{{ example.description }}</div>
            <div class="example-query">
              <el-input
                type="textarea"
                v-model="example.query"
                :rows="example.query.split('\n').length + 1"
                readonly
              />
              <div class="example-actions">
                <el-tooltip :content="t('promql.copy')" placement="top">
                  <el-button 
                    type="primary" 
                    size="small" 
                    circle 
                    @click="copyToClipboard(example.query)"
                  >
                    <el-icon><CopyDocument /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip :content="t('promql.use')" placement="top">
                  <el-button 
                    type="success" 
                    size="small" 
                    circle 
                    @click="useQuery(example.query)"
                  >
                    <el-icon><Check /></el-icon>
                  </el-button>
                </el-tooltip>
              </div>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>

      <el-empty 
        v-if="filteredExamples.length === 0" 
        :description="t('promql.noResults')" 
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { CopyDocument, Check, Search } from '@element-plus/icons-vue';

const props = defineProps({
  // 可以传入自定义的 PromQL 示例
  customExamples: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['select-query']);

// 国际化
const { t } = useI18n({
  messages: {
    'zh-CN': {
      promql: {
        title: 'PromQL 查询示例',
        search: '搜索查询示例',
        copy: '复制到剪贴板',
        use: '使用此查询',
        copied: '已复制到剪贴板',
        noResults: '没有找到匹配的查询示例',
        categories: {
          all: '全部',
          cpu: 'CPU',
          memory: '内存',
          disk: '磁盘',
          network: '网络',
          system: '系统',
          container: '容器',
          kubernetes: 'Kubernetes',
          database: '数据库',
          http: 'HTTP',
          jvm: 'JVM',
          alert: '告警规则',
          custom: '自定义'
        }
      }
    },
    'en-US': {
      promql: {
        title: 'PromQL Query Examples',
        search: 'Search query examples',
        copy: 'Copy to clipboard',
        use: 'Use this query',
        copied: 'Copied to clipboard',
        noResults: 'No matching query examples found',
        categories: {
          all: 'All',
          cpu: 'CPU',
          memory: 'Memory',
          disk: 'Disk',
          network: 'Network',
          system: 'System',
          container: 'Container',
          kubernetes: 'Kubernetes',
          database: 'Database',
          http: 'HTTP',
          jvm: 'JVM',
          alert: 'Alert Rules',
          custom: 'Custom'
        }
      }
    }
  }
});

// 分类列表
const categories = [
  { value: 'all', label: t('promql.categories.all') },
  { value: 'cpu', label: t('promql.categories.cpu') },
  { value: 'memory', label: t('promql.categories.memory') },
  { value: 'disk', label: t('promql.categories.disk') },
  { value: 'network', label: t('promql.categories.network') },
  { value: 'system', label: t('promql.categories.system') },
  { value: 'container', label: t('promql.categories.container') },
  { value: 'kubernetes', label: t('promql.categories.kubernetes') },
  { value: 'database', label: t('promql.categories.database') },
  { value: 'http', label: t('promql.categories.http') },
  { value: 'jvm', label: t('promql.categories.jvm') },
  { value: 'alert', label: t('promql.categories.alert') },
  { value: 'custom', label: t('promql.categories.custom') }
];

// 默认的 PromQL 示例
const defaultExamples = [
  // CPU 相关查询
  {
    name: 'CPU 使用率',
    category: 'cpu',
    description: '显示所有实例的 CPU 使用率',
    query: '100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)'
  },
  {
    name: 'CPU 负载',
    category: 'cpu',
    description: '显示系统负载（1分钟平均值）',
    query: 'node_load1'
  },
  {
    name: 'CPU 使用率（按核心）',
    category: 'cpu',
    description: '显示每个 CPU 核心的使用率',
    query: '100 - (avg by (instance, cpu) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)'
  },
  {
    name: 'CPU 使用率（按模式）',
    category: 'cpu',
    description: '按不同模式（user, system, iowait等）显示 CPU 使用率',
    query: 'sum by (mode) (irate(node_cpu_seconds_total[5m]))'
  },
  {
    name: 'CPU 饱和度',
    category: 'cpu',
    description: '显示 CPU 运行队列长度（表示 CPU 饱和度）',
    query: 'node_load1 / count without(cpu, mode) (node_cpu_seconds_total{mode="idle"})'
  },
  {
    name: 'CPU 上下文切换率',
    category: 'cpu',
    description: '显示每秒 CPU 上下文切换次数',
    query: 'rate(node_context_switches_total[1m])'
  },
  
  // 内存相关查询
  {
    name: '内存使用率',
    category: 'memory',
    description: '显示内存使用百分比',
    query: '(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100'
  },
  {
    name: '可用内存',
    category: 'memory',
    description: '显示可用内存（GB）',
    query: 'node_memory_MemAvailable_bytes / 1024 / 1024 / 1024'
  },
  {
    name: '总内存',
    category: 'memory',
    description: '显示总内存（GB）',
    query: 'node_memory_MemTotal_bytes / 1024 / 1024 / 1024'
  },
  {
    name: '交换空间使用率',
    category: 'memory',
    description: '显示交换空间使用百分比',
    query: '(1 - (node_memory_SwapFree_bytes / node_memory_SwapTotal_bytes)) * 100'
  },
  {
    name: '内存详细使用情况',
    category: 'memory',
    description: '显示内存详细使用情况（按类型）',
    query: 'node_memory_MemTotal_bytes - node_memory_MemFree_bytes - node_memory_Buffers_bytes - node_memory_Cached_bytes'
  },
  {
    name: '内存页面交换率',
    category: 'memory',
    description: '显示内存页面交换率（每秒）',
    query: 'rate(node_vmstat_pgpgin[1m]) + rate(node_vmstat_pgpgout[1m])'
  },
  
  // 磁盘相关查询
  {
    name: '磁盘使用率',
    category: 'disk',
    description: '显示每个挂载点的磁盘使用百分比',
    query: '(1 - node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100'
  },
  {
    name: '磁盘 I/O 操作',
    category: 'disk',
    description: '显示磁盘 I/O 操作速率（每秒）',
    query: 'sum by (instance) (rate(node_disk_io_time_seconds_total[5m]))'
  },
  {
    name: '磁盘读取速率',
    category: 'disk',
    description: '显示磁盘读取速率（MB/s）',
    query: 'sum by (instance) (rate(node_disk_read_bytes_total[5m])) / 1024 / 1024'
  },
  {
    name: '磁盘写入速率',
    category: 'disk',
    description: '显示磁盘写入速率（MB/s）',
    query: 'sum by (instance) (rate(node_disk_written_bytes_total[5m])) / 1024 / 1024'
  },
  {
    name: '磁盘 IOPS',
    category: 'disk',
    description: '显示磁盘 IOPS（每秒 I/O 操作数）',
    query: 'sum by (instance) (rate(node_disk_reads_completed_total[5m]) + rate(node_disk_writes_completed_total[5m]))'
  },
  {
    name: '磁盘读写延迟',
    category: 'disk',
    description: '显示磁盘读写延迟（毫秒）',
    query: '(rate(node_disk_read_time_seconds_total[5m]) / rate(node_disk_reads_completed_total[5m]) + rate(node_disk_write_time_seconds_total[5m]) / rate(node_disk_writes_completed_total[5m])) * 1000'
  },
  {
    name: '磁盘空间预测',
    category: 'disk',
    description: '预测磁盘空间何时耗尽（基于过去 24 小时的增长率）',
    query: 'node_filesystem_avail_bytes / predict_linear(node_filesystem_avail_bytes[24h], 7*24*3600) < 0'
  },
  
  // 网络相关查询
  {
    name: '网络接收速率',
    category: 'network',
    description: '显示网络接收速率（MB/s）',
    query: 'sum by (instance) (rate(node_network_receive_bytes_total[5m])) / 1024 / 1024'
  },
  {
    name: '网络发送速率',
    category: 'network',
    description: '显示网络发送速率（MB/s）',
    query: 'sum by (instance) (rate(node_network_transmit_bytes_total[5m])) / 1024 / 1024'
  },
  {
    name: '网络错误率',
    category: 'network',
    description: '显示网络错误率（每秒）',
    query: 'sum by (instance) (rate(node_network_receive_errs_total[5m]) + rate(node_network_transmit_errs_total[5m]))'
  },
  {
    name: 'TCP 连接状态',
    category: 'network',
    description: '显示各种状态的 TCP 连接数',
    query: 'node_netstat_Tcp_CurrEstab'
  },
  {
    name: '网络带宽使用率',
    category: 'network',
    description: '显示网络带宽使用率（假设 1Gbps 带宽）',
    query: '(sum by (instance) (rate(node_network_receive_bytes_total[5m]) + rate(node_network_transmit_bytes_total[5m])) / 125000000) * 100'
  },
  {
    name: 'TCP 重传率',
    category: 'network',
    description: '显示 TCP 重传率（百分比）',
    query: 'rate(node_netstat_Tcp_RetransSegs[5m]) / rate(node_netstat_Tcp_OutSegs[5m]) * 100'
  },
  {
    name: '网络接口饱和度',
    category: 'network',
    description: '显示网络接口饱和度（丢包率）',
    query: 'sum by (instance) (rate(node_network_receive_drop_total[5m]) + rate(node_network_transmit_drop_total[5m]))'
  },
  
  // 系统相关查询
  {
    name: '系统启动时间',
    category: 'system',
    description: '显示系统已运行的时间（天）',
    query: '(time() - node_boot_time_seconds) / 86400'
  },
  {
    name: '进程数',
    category: 'system',
    description: '显示系统中的进程数',
    query: 'node_procs_running'
  },
  {
    name: '文件描述符使用率',
    category: 'system',
    description: '显示文件描述符使用百分比',
    query: '(node_filefd_allocated / node_filefd_maximum) * 100'
  },
  {
    name: '系统平均负载',
    category: 'system',
    description: '显示系统 1分钟、5分钟和15分钟的平均负载',
    query: 'node_load1, node_load5, node_load15'
  },
  {
    name: '系统中断率',
    category: 'system',
    description: '显示系统中断率（每秒）',
    query: 'rate(node_intr_total[5m])'
  },
  {
    name: '僵尸进程数',
    category: 'system',
    description: '显示僵尸进程数量',
    query: 'node_processes_state{state="Z"}'
  },
  {
    name: '系统时间偏差',
    category: 'system',
    description: '显示系统时钟与 NTP 服务器的时间偏差（秒）',
    query: 'abs(node_timex_offset_seconds)'
  },
  
  // 容器相关查询
  {
    name: '容器 CPU 使用率',
    category: 'container',
    description: '显示每个容器的 CPU 使用率',
    query: 'sum by (name) (rate(container_cpu_usage_seconds_total[5m])) * 100'
  },
  {
    name: '容器内存使用量',
    category: 'container',
    description: '显示每个容器的内存使用量（MB）',
    query: 'sum by (name) (container_memory_usage_bytes) / 1024 / 1024'
  },
  {
    name: '容器网络接收速率',
    category: 'container',
    description: '显示每个容器的网络接收速率（MB/s）',
    query: 'sum by (name) (rate(container_network_receive_bytes_total[5m])) / 1024 / 1024'
  },
  {
    name: '容器网络发送速率',
    category: 'container',
    description: '显示每个容器的网络发送速率（MB/s）',
    query: 'sum by (name) (rate(container_network_transmit_bytes_total[5m])) / 1024 / 1024'
  },
  {
    name: '容器文件系统使用率',
    category: 'container',
    description: '显示容器文件系统使用率（百分比）',
    query: '(container_fs_usage_bytes / container_fs_limit_bytes) * 100'
  },
  {
    name: '容器重启次数',
    category: 'container',
    description: '显示容器重启次数',
    query: 'changes(container_start_time_seconds[1h])'
  },
  {
    name: '容器 CPU 节流',
    category: 'container',
    description: '显示容器 CPU 节流时间比例（百分比）',
    query: 'rate(container_cpu_cfs_throttled_seconds_total[5m]) / rate(container_cpu_cfs_periods_total[5m]) * 100'
  },
  
  // Kubernetes 相关查询
  {
    name: 'Pod CPU 使用率',
    category: 'kubernetes',
    description: '显示每个 Pod 的 CPU 使用率',
    query: 'sum by (pod) (rate(container_cpu_usage_seconds_total{container!="POD",container!=""}[5m])) * 100'
  },
  {
    name: 'Pod 内存使用量',
    category: 'kubernetes',
    description: '显示每个 Pod 的内存使用量（MB）',
    query: 'sum by (pod) (container_memory_usage_bytes{container!="POD",container!=""}) / 1024 / 1024'
  },
  {
    name: '节点状态',
    category: 'kubernetes',
    description: '显示 Kubernetes 节点的状态（1=就绪，0=未就绪）',
    query: 'kube_node_status_condition{condition="Ready",status="true"}'
  },
  {
    name: 'Pod 重启次数',
    category: 'kubernetes',
    description: '显示 Pod 中容器的重启次数',
    query: 'sum by (pod) (kube_pod_container_status_restarts_total)'
  },
  {
    name: 'Pod 就绪状态',
    category: 'kubernetes',
    description: '显示 Pod 就绪状态（1=就绪，0=未就绪）',
    query: 'sum by (pod) (kube_pod_status_ready{condition="true"})'
  },
  {
    name: '命名空间 Pod 数量',
    category: 'kubernetes',
    description: '显示每个命名空间的 Pod 数量',
    query: 'sum by (namespace) (kube_pod_info)'
  },
  {
    name: '部署副本状态',
    category: 'kubernetes',
    description: '显示部署的可用副本与期望副本的比率',
    query: 'kube_deployment_status_replicas_available / kube_deployment_spec_replicas'
  },
  {
    name: 'HPA 扩缩状态',
    category: 'kubernetes',
    description: '显示 HPA 当前副本数与目标副本数',
    query: 'kube_hpa_status_current_replicas / kube_hpa_spec_max_replicas'
  },
  {
    name: '节点资源使用率',
    category: 'kubernetes',
    description: '显示节点资源（CPU/内存）使用率',
    query: 'sum by (node) (kube_pod_container_resource_requests{resource="cpu"}) / kube_node_status_allocatable{resource="cpu"}'
  },
  {
    name: '容器 OOM 终止次数',
    category: 'kubernetes',
    description: '显示容器因 OOM 被终止的次数',
    query: 'kube_pod_container_status_terminated_reason{reason="OOMKilled"}'
  },

  // 数据库相关查询（MySQL, PostgreSQL, Redis 等）
  {
    name: 'MySQL 连接数',
    category: 'database',
    description: '显示 MySQL 当前连接数与最大连接数的比率',
    query: 'mysql_global_status_threads_connected / mysql_global_variables_max_connections'
  },
  {
    name: 'MySQL 查询率',
    category: 'database',
    description: '显示 MySQL 每秒查询数',
    query: 'rate(mysql_global_status_queries[5m])'
  },
  {
    name: 'MySQL 慢查询率',
    category: 'database',
    description: '显示 MySQL 慢查询率（每秒）',
    query: 'rate(mysql_global_status_slow_queries[5m])'
  },
  {
    name: 'PostgreSQL 连接数',
    category: 'database',
    description: '显示 PostgreSQL 当前连接数与最大连接数的比率',
    query: 'pg_stat_activity_count / pg_settings_max_connections'
  },
  {
    name: 'PostgreSQL 事务率',
    category: 'database',
    description: '显示 PostgreSQL 每秒事务数',
    query: 'rate(pg_stat_database_xact_commit[5m]) + rate(pg_stat_database_xact_rollback[5m])'
  },
  {
    name: 'Redis 内存使用率',
    category: 'database',
    description: '显示 Redis 内存使用率',
    query: 'redis_memory_used_bytes / redis_memory_max_bytes * 100'
  },
  {
    name: 'Redis 命令处理率',
    category: 'database',
    description: '显示 Redis 每秒处理的命令数',
    query: 'rate(redis_commands_processed_total[5m])'
  },
  {
    name: 'Redis 键过期率',
    category: 'database',
    description: '显示 Redis 每秒过期的键数',
    query: 'rate(redis_expired_keys_total[5m])'
  },
  {
    name: 'MongoDB 操作率',
    category: 'database',
    description: '显示 MongoDB 每秒操作数',
    query: 'sum(rate(mongodb_op_counters_total[5m]))'
  },
  {
    name: 'MongoDB 连接数',
    category: 'database',
    description: '显示 MongoDB 当前连接数',
    query: 'mongodb_connections{state="current"}'
  },

  // HTTP 相关查询
  {
    name: 'HTTP 请求率',
    category: 'http',
    description: '显示每秒 HTTP 请求数',
    query: 'sum(rate(http_requests_total[5m]))'
  },
  {
    name: 'HTTP 错误率',
    category: 'http',
    description: '显示 HTTP 错误率（百分比）',
    query: 'sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100'
  },
  {
    name: 'HTTP 请求延迟',
    category: 'http',
    description: '显示 HTTP 请求的 95 百分位延迟（秒）',
    query: 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))'
  },
  {
    name: 'HTTP 状态码分布',
    category: 'http',
    description: '显示 HTTP 状态码分布',
    query: 'sum by (status) (rate(http_requests_total[5m]))'
  },
  {
    name: 'HTTP 请求大小',
    category: 'http',
    description: '显示 HTTP 请求的平均大小（字节）',
    query: 'sum(rate(http_request_size_bytes_sum[5m])) / sum(rate(http_request_size_bytes_count[5m]))'
  },
  {
    name: 'HTTP 响应大小',
    category: 'http',
    description: '显示 HTTP 响应的平均大小（字节）',
    query: 'sum(rate(http_response_size_bytes_sum[5m])) / sum(rate(http_response_size_bytes_count[5m]))'
  },
  {
    name: '每个路径的 HTTP 请求率',
    category: 'http',
    description: '显示每个路径的 HTTP 请求率',
    query: 'sum by (path) (rate(http_requests_total[5m]))'
  },

  // JVM 相关查询
  {
    name: 'JVM 堆内存使用率',
    category: 'jvm',
    description: '显示 JVM 堆内存使用率',
    query: 'sum by (instance) (jvm_memory_used_bytes{area="heap"}) / sum by (instance) (jvm_memory_max_bytes{area="heap"}) * 100'
  },
  {
    name: 'JVM 非堆内存使用量',
    category: 'jvm',
    description: '显示 JVM 非堆内存使用量（MB）',
    query: 'sum by (instance) (jvm_memory_used_bytes{area="nonheap"}) / 1024 / 1024'
  },
  {
    name: 'JVM GC 暂停时间',
    category: 'jvm',
    description: '显示 JVM GC 暂停时间（毫秒）',
    query: 'sum by (gc) (increase(jvm_gc_pause_seconds_sum[5m]) / increase(jvm_gc_pause_seconds_count[5m]) * 1000)'
  },
  {
    name: 'JVM 线程数',
    category: 'jvm',
    description: '显示 JVM 线程数',
    query: 'jvm_threads_current'
  },
  {
    name: 'JVM 类加载数',
    category: 'jvm',
    description: '显示 JVM 已加载的类数量',
    query: 'jvm_classes_loaded'
  },
  {
    name: 'JVM GC 收集次数',
    category: 'jvm',
    description: '显示 JVM GC 收集次数（每分钟）',
    query: 'increase(jvm_gc_collection_seconds_count[1m])'
  },
  {
    name: 'JVM 内存池使用率',
    category: 'jvm',
    description: '显示 JVM 各内存池使用率',
    query: 'sum by (pool) (jvm_memory_used_bytes) / sum by (pool) (jvm_memory_max_bytes) * 100'
  },

  // 告警规则示例
  {
    name: '高 CPU 使用率告警',
    category: 'alert',
    description: 'CPU 使用率超过 80% 持续 5 分钟',
    query: 'avg by(instance) (rate(node_cpu_seconds_total{mode!="idle"}[5m])) * 100 > 80'
  },
  {
    name: '高内存使用率告警',
    category: 'alert',
    description: '内存使用率超过 90% 持续 5 分钟',
    query: '(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 90'
  },
  {
    name: '磁盘空间不足告警',
    category: 'alert',
    description: '磁盘空间使用率超过 85%',
    query: '(node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes * 100 > 85'
  },
  {
    name: '实例宕机告警',
    category: 'alert',
    description: '实例已宕机超过 1 分钟',
    query: 'up == 0'
  },
  {
    name: '高错误率告警',
    category: 'alert',
    description: 'HTTP 错误率超过 5%',
    query: 'sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100 > 5'
  },
  {
    name: '高延迟告警',
    category: 'alert',
    description: '95 百分位请求延迟超过 1 秒',
    query: 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 1'
  },
  {
    name: '节点高负载告警',
    category: 'alert',
    description: '节点负载超过 CPU 核心数',
    query: 'node_load1 > count without(cpu, mode) (node_cpu_seconds_total{mode="idle"})'
  },
  {
    name: 'Pod 崩溃循环告警',
    category: 'alert',
    description: 'Pod 在 1 小时内重启超过 5 次',
    query: 'increase(kube_pod_container_status_restarts_total[1h]) > 5'
  }
];

// 合并自定义示例和默认示例
const allExamples = computed(() => {
  const customExamplesWithCategory = props.customExamples.map(example => ({
    ...example,
    category: example.category || 'custom'
  }));
  return [...defaultExamples, ...customExamplesWithCategory];
});

// 响应式状态
const searchQuery = ref('');
const activeCategory = ref('all');
const activeExamples = ref([]);

// 根据搜索和分类过滤示例
const filteredExamples = computed(() => {
  let result = allExamples.value;
  
  // 按分类过滤
  if (activeCategory.value !== 'all') {
    result = result.filter(example => example.category === activeCategory.value);
  }
  
  // 按搜索词过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(example => 
      example.name.toLowerCase().includes(query) || 
      example.description.toLowerCase().includes(query) || 
      example.query.toLowerCase().includes(query)
    );
  }
  
  return result;
});

// 处理分类变化
const handleCategoryChange = () => {
  // 重置活动的示例
  activeExamples.value = [];
};

// 处理搜索
const handleSearch = () => {
  // 可以添加额外的搜索逻辑
};

// 复制到剪贴板
const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage({
      message: t('promql.copied'),
      type: 'success',
      duration: 2000
    });
  }).catch(err => {
    console.error('无法复制到剪贴板:', err);
  });
};

// 使用查询
const useQuery = (query) => {
  emit('select-query', query);
};

// 监听自定义示例变化
watch(() => props.customExamples, () => {
  // 可以添加额外的处理逻辑
}, { deep: true });
</script>

<style lang="scss" scoped>
.sc-promql-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
  border-radius: 4px;
  padding: 16px;
  box-sizing: border-box;
}

.sc-promql-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  .sc-promql-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .el-input {
    width: 240px;
  }
}

.sc-promql-categories {
  margin-bottom: 16px;
}

.sc-promql-examples {
  flex: 1;
  overflow-y: auto;
  
  .example-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    
    .el-tag {
      margin-left: 8px;
    }
  }
  
  .example-content {
    padding: 8px 0;
    
    .example-description {
      margin-bottom: 8px;
      color: var(--el-text-color-secondary);
      font-size: 14px;
    }
    
    .example-query {
      position: relative;
      
      .el-input {
        font-family: monospace;
        background-color: var(--el-fill-color-light);
        border-radius: 4px;
      }
      
      .example-actions {
        position: absolute;
        top: 8px;
        right: 8px;
        display: flex;
        gap: 8px;
      }
    }
  }
}

// 暗黑模式适配
html.dark {
  .sc-promql-container {
    background-color: var(--el-bg-color-overlay);
  }
  
  .example-query .el-input {
    background-color: var(--el-fill-color);
  }
}
</style> 