<template>
  <el-dialog
    v-model="visible"
    title="表达式帮助"
    width="800px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div class="expression-help">
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="Prometheus PromQL" name="prometheus">
          <div class="help-content">
            <h3>Prometheus PromQL 语法</h3>
            <div class="syntax-section">
              <h4>基本查询</h4>
              <div class="code-example">
                <code>cpu_usage_percent</code>
                <span class="description">查询指标名为 cpu_usage_percent 的所有时间序列</span>
              </div>
              <div class="code-example">
                <code>cpu_usage_percent{instance="localhost:9090"}</code>
                <span class="description">查询特定实例的 CPU 使用率</span>
              </div>
            </div>

            <div class="syntax-section">
              <h4>聚合函数</h4>
              <div class="code-example">
                <code>avg(cpu_usage_percent)</code>
                <span class="description">计算所有实例的平均 CPU 使用率</span>
              </div>
              <div class="code-example">
                <code>sum(memory_usage_bytes) by (instance)</code>
                <span class="description">按实例分组计算内存使用总量</span>
              </div>
              <div class="code-example">
                <code>max(disk_usage_percent)</code>
                <span class="description">获取最大磁盘使用率</span>
              </div>
            </div>

            <div class="syntax-section">
              <h4>时间范围查询</h4>
              <div class="code-example">
                <code>rate(cpu_usage_total[5m])</code>
                <span class="description">计算过去 5 分钟的 CPU 使用率变化率</span>
              </div>
              <div class="code-example">
                <code>avg_over_time(memory_usage_percent[1h])</code>
                <span class="description">计算过去 1 小时的平均内存使用率</span>
              </div>
            </div>

            <div class="syntax-section">
              <h4>数学运算</h4>
              <div class="code-example">
                <code>cpu_usage_percent * 100</code>
                <span class="description">将 CPU 使用率转换为百分比</span>
              </div>
              <div class="code-example">
                <code>(memory_used_bytes / memory_total_bytes) * 100</code>
                <span class="description">计算内存使用百分比</span>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="SQL 查询" name="sql">
          <div class="help-content">
            <h3>SQL 查询语法</h3>
            <div class="syntax-section">
              <h4>基本查询</h4>
              <div class="code-example">
                <code>SELECT cpu_percent FROM system_metrics WHERE timestamp > NOW() - INTERVAL 5 MINUTE</code>
                <span class="description">查询最近 5 分钟的 CPU 使用率</span>
              </div>
            </div>

            <div class="syntax-section">
              <h4>聚合查询</h4>
              <div class="code-example">
                <code>SELECT AVG(cpu_percent) as avg_cpu FROM system_metrics WHERE timestamp > NOW() - INTERVAL 1 HOUR</code>
                <span class="description">计算过去 1 小时的平均 CPU 使用率</span>
              </div>
              <div class="code-example">
                <code>SELECT MAX(memory_percent) as max_memory FROM system_metrics WHERE timestamp > NOW() - INTERVAL 1 DAY</code>
                <span class="description">获取过去 24 小时的最大内存使用率</span>
              </div>
            </div>

            <div class="syntax-section">
              <h4>分组查询</h4>
              <div class="code-example">
                <code>SELECT server_id, AVG(cpu_percent) FROM system_metrics GROUP BY server_id</code>
                <span class="description">按服务器分组计算平均 CPU 使用率</span>
              </div>
            </div>

            <div class="syntax-section">
              <h4>时间窗口查询</h4>
              <div class="code-example">
                <code>SELECT DATE_FORMAT(timestamp, '%H:%i') as time, AVG(cpu_percent) FROM system_metrics WHERE timestamp > NOW() - INTERVAL 1 HOUR GROUP BY DATE_FORMAT(timestamp, '%H:%i')</code>
                <span class="description">按分钟分组查询过去 1 小时的 CPU 使用率趋势</span>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="常用示例" name="examples">
          <div class="help-content">
            <h3>常用监控指标示例</h3>
            
            <div class="example-section">
              <h4>系统资源监控</h4>
              <el-collapse>
                <el-collapse-item title="CPU 使用率" name="cpu">
                  <div class="example-item">
                    <strong>Prometheus:</strong>
                    <code>100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)</code>
                  </div>
                  <div class="example-item">
                    <strong>SQL:</strong>
                    <code>SELECT AVG(cpu_percent) FROM system_metrics WHERE timestamp > NOW() - INTERVAL 5 MINUTE</code>
                  </div>
                </el-collapse-item>

                <el-collapse-item title="内存使用率" name="memory">
                  <div class="example-item">
                    <strong>Prometheus:</strong>
                    <code>(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100</code>
                  </div>
                  <div class="example-item">
                    <strong>SQL:</strong>
                    <code>SELECT (used_memory / total_memory) * 100 as memory_percent FROM system_metrics ORDER BY timestamp DESC LIMIT 1</code>
                  </div>
                </el-collapse-item>

                <el-collapse-item title="磁盘使用率" name="disk">
                  <div class="example-item">
                    <strong>Prometheus:</strong>
                    <code>(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100</code>
                  </div>
                  <div class="example-item">
                    <strong>SQL:</strong>
                    <code>SELECT (used_space / total_space) * 100 as disk_percent FROM disk_metrics ORDER BY timestamp DESC LIMIT 1</code>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>

            <div class="example-section">
              <h4>网络监控</h4>
              <el-collapse>
                <el-collapse-item title="网络流量" name="network">
                  <div class="example-item">
                    <strong>Prometheus:</strong>
                    <code>rate(node_network_receive_bytes_total[5m]) + rate(node_network_transmit_bytes_total[5m])</code>
                  </div>
                  <div class="example-item">
                    <strong>SQL:</strong>
                    <code>SELECT SUM(bytes_in + bytes_out) as total_traffic FROM network_metrics WHERE timestamp > NOW() - INTERVAL 5 MINUTE</code>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";

// 响应式状态
const visible = ref(false);
const activeTab = ref("prometheus");

/**
 * 打开对话框
 */
const open = (expressionType?: string) => {
  visible.value = true;
  if (expressionType === "SQL") {
    activeTab.value = "sql";
  } else {
    activeTab.value = "prometheus";
  }
};

/**
 * 关闭对话框
 */
const handleClose = () => {
  visible.value = false;
};

// 暴露方法
defineExpose({
  open
});
</script>

<style lang="scss" scoped>
.expression-help {
  .help-content {
    h3 {
      margin-bottom: 20px;
      color: var(--el-text-color-primary);
      border-bottom: 2px solid var(--el-color-primary);
      padding-bottom: 8px;
    }

    h4 {
      margin: 16px 0 12px 0;
      color: var(--el-text-color-regular);
      font-size: 16px;
    }

    .syntax-section {
      margin-bottom: 24px;

      .code-example {
        margin-bottom: 12px;
        padding: 12px;
        background: var(--el-bg-color-page);
        border-radius: 6px;
        border-left: 4px solid var(--el-color-primary);

        code {
          display: block;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 14px;
          color: var(--el-color-primary);
          margin-bottom: 4px;
          word-break: break-all;
        }

        .description {
          font-size: 12px;
          color: var(--el-text-color-regular);
        }
      }
    }

    .example-section {
      margin-bottom: 24px;

      .example-item {
        margin-bottom: 12px;
        padding: 8px 12px;
        background: var(--el-bg-color-page);
        border-radius: 4px;

        strong {
          color: var(--el-text-color-primary);
          margin-right: 8px;
        }

        code {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 12px;
          color: var(--el-color-success);
          word-break: break-all;
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
