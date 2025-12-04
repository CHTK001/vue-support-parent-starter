<template>
  <el-dialog
    v-model="visible"
    title="表达式语法帮�?
    width="800px"
    :close-on-click-modal="false"
    destroy-on-close
    class="expression-help-dialog"
  >
    <div class="help-content">
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="Prometheus" name="prometheus" v-if="expressionType === 'PROMETHEUS'">
          <div class="help-section">
            <h3>Prometheus PromQL 语法</h3>
            <p>Prometheus 查询语言 (PromQL) 用于查询时间序列数据�?/p>
            
            <h4>基本语法</h4>
            <div class="code-block">
              <pre><code># 查询指标
cpu_usage_percent

# 带标签过�?
cpu_usage_percent{instance="localhost:9100"}

# 范围查询
cpu_usage_percent[5m]

# 聚合函数
avg(cpu_usage_percent)
sum(network_bytes_total)
rate(http_requests_total[5m])</code></pre>
            </div>

            <h4>常用函数</h4>
            <ul>
              <li><code>rate()</code> - 计算速率</li>
              <li><code>avg()</code> - 平均�?/li>
              <li><code>sum()</code> - 求和</li>
              <li><code>max()</code> - 最大�?/li>
              <li><code>min()</code> - 最小�?/li>
              <li><code>count()</code> - 计数</li>
            </ul>

            <h4>示例表达�?/h4>
            <div class="examples">
              <div class="example-item">
                <strong>CPU使用�?</strong>
                <code>100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)</code>
              </div>
              <div class="example-item">
                <strong>内存使用�?</strong>
                <code>(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100</code>
              </div>
              <div class="example-item">
                <strong>磁盘使用�?</strong>
                <code>(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100</code>
              </div>
              <div class="example-item">
                <strong>网络流量:</strong>
                <code>rate(node_network_receive_bytes_total[5m])</code>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="SQL" name="sql" v-if="expressionType === 'SQL'">
          <div class="help-section">
            <h3>SQL 查询语法</h3>
            <p>使用标准 SQL 语法查询服务器监控数据�?/p>
            
            <h4>基本语法</h4>
            <div class="code-block">
              <pre><code># 基本查询
SELECT cpu_usage FROM server_metrics WHERE server_id = ?

# 聚合查询
SELECT AVG(cpu_usage) as avg_cpu FROM server_metrics 
WHERE server_id = ? AND collect_time >= NOW() - INTERVAL 1 HOUR

# 时间范围查询
SELECT * FROM server_metrics 
WHERE server_id = ? 
AND collect_time BETWEEN ? AND ?</code></pre>
            </div>

            <h4>可用表和字段</h4>
            <ul>
              <li><strong>server_metrics</strong> - 服务器指标表
                <ul>
                  <li>server_id - 服务器ID</li>
                  <li>cpu_usage - CPU使用�?/li>
                  <li>memory_usage - 内存使用�?/li>
                  <li>disk_usage - 磁盘使用�?/li>
                  <li>network_in - 网络入流�?/li>
                  <li>network_out - 网络出流�?/li>
                  <li>collect_time - 收集时间</li>
                </ul>
              </li>
            </ul>

            <h4>示例查询</h4>
            <div class="examples">
              <div class="example-item">
                <strong>最新CPU使用�?</strong>
                <code>SELECT cpu_usage FROM server_metrics WHERE server_id = ? ORDER BY collect_time DESC LIMIT 1</code>
              </div>
              <div class="example-item">
                <strong>平均内存使用�?</strong>
                <code>SELECT AVG(memory_usage) FROM server_metrics WHERE server_id = ? AND collect_time >= NOW() - INTERVAL 1 HOUR</code>
              </div>
              <div class="example-item">
                <strong>磁盘使用趋势:</strong>
                <code>SELECT collect_time, disk_usage FROM server_metrics WHERE server_id = ? ORDER BY collect_time DESC LIMIT 100</code>
              </div>
              <div class="example-item">
                <strong>网络流量统计:</strong>
                <code>SELECT SUM(network_in) as total_in, SUM(network_out) as total_out FROM server_metrics WHERE server_id = ?</code>
              </div>
            </div>

            <h4>注意事项</h4>
            <ul>
              <li>使用 <code>?</code> 作为服务器ID的占位符</li>
              <li>时间字段使用 <code>collect_time</code></li>
              <li>支持标准SQL函数：AVG, SUM, MAX, MIN, COUNT�?/li>
              <li>时间范围查询建议使用索引字段</li>
            </ul>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";

// 响应式状�?
const visible = ref(false);
const activeTab = ref("prometheus");
const expressionType = ref<"PROMETHEUS" | "SQL">("PROMETHEUS");

/**
 * 打开对话�?
 */
const open = (type: "PROMETHEUS" | "SQL" = "PROMETHEUS") => {
  expressionType.value = type;
  activeTab.value = type.toLowerCase();
  visible.value = true;
};

// 暴露方法
defineExpose({
  open,
});
</script>

<style lang="scss" scoped>
.expression-help-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
  }
}

.help-content {
  .help-section {
    padding: 20px;

    h3 {
      color: var(--el-color-primary);
      margin-bottom: 16px;
      font-size: 18px;
      font-weight: 600;
    }

    h4 {
      color: var(--el-text-color-primary);
      margin: 20px 0 12px;
      font-size: 16px;
      font-weight: 500;
    }

    p {
      color: var(--el-text-color-regular);
      line-height: 1.6;
      margin-bottom: 16px;
    }

    ul {
      color: var(--el-text-color-regular);
      line-height: 1.6;
      padding-left: 20px;

      li {
        margin-bottom: 8px;

        ul {
          margin-top: 8px;
          padding-left: 16px;
        }
      }
    }

    .code-block {
      background: var(--el-fill-color-extra-light);
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
      border: 1px solid var(--el-border-color-lighter);

      pre {
        margin: 0;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 13px;
        line-height: 1.5;
        color: var(--el-text-color-primary);

        code {
          background: none;
          padding: 0;
          border-radius: 0;
          font-size: inherit;
        }
      }
    }

    .examples {
      .example-item {
        margin-bottom: 16px;
        padding: 12px;
        background: var(--el-fill-color-light);
        border-radius: 6px;
        border-left: 4px solid var(--el-color-primary);

        strong {
          display: block;
          color: var(--el-text-color-primary);
          margin-bottom: 8px;
          font-weight: 600;
        }

        code {
          display: block;
          background: var(--el-fill-color-extra-light);
          padding: 8px 12px;
          border-radius: 4px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 12px;
          color: var(--el-color-primary);
          word-break: break-all;
          white-space: pre-wrap;
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

// 响应式设�?
@media (max-width: 768px) {
  .help-content {
    .help-section {
      padding: 12px;

      .code-block {
        padding: 12px;

        pre {
          font-size: 12px;
        }
      }

      .examples {
        .example-item {
          padding: 8px;

          code {
            font-size: 11px;
            padding: 6px 8px;
          }
        }
      }
    }
  }
}
</style>
