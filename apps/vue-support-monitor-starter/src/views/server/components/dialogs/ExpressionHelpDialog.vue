<template>
  <sc-dialog
    v-model="visible"
    title="表达式语法帮助"
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
            <p>Prometheus 查询语言 (PromQL) 用于查询时间序列数据。</p>
            
            <h4>基本语法</h4>
            <div class="code-block">
              <pre><code># 查询指标
cpu_usage_percent

# 带标签过滤
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
              <li><code>avg()</code> - 平均值</li>
              <li><code>sum()</code> - 求和</li>
              <li><code>max()</code> - 最大值</li>
              <li><code>min()</code> - 最小值</li>
              <li><code>count()</code> - 计数</li>
            </ul>

            <h4>示例表达式</h4>
            <div class="examples">
              <div class="example-item">
                <strong>CPU使用率:</strong>
                <code>100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)</code>
              </div>
              <div class="example-item">
                <strong>内存使用率:</strong>
                <code>(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100</code>
              </div>
              <div class="example-item">
                <strong>磁盘使用率:</strong>
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
            <p>使用标准 SQL 语法查询服务器监控数据。</p>
            
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
                  <li>cpu_usage - CPU使用率</li>
                  <li>memory_usage - 内存使用率</li>
                  <li>disk_usage - 磁盘使用率</li>
                  <li>network_in - 网络入流量</li>
                  <li>network_out - 网络出流量</li>
                  <li>collect_time - 收集时间</li>
                </ul>
              </li>
            </ul>

            <h4>示例查询</h4>
            <div class="examples">
              <div class="example-item">
                <strong>最新CPU使用率:</strong>
                <code>SELECT cpu_usage FROM server_metrics WHERE server_id = ? ORDER BY collect_time DESC LIMIT 1</code>
              </div>
              <div class="example-item">
                <strong>平均内存使用率:</strong>
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
              <li>支持标准SQL函数：AVG, SUM, MAX, MIN, COUNT等</li>
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
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";

// 响应式状态
const visible = ref(false);
const activeTab = ref("prometheus");
const expressionType = ref<"PROMETHEUS" | "SQL">("PROMETHEUS");

/**
 * 打开对话框
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
@use "@/styles/mixins.scss" as *;

.expression-help-dialog {
  :deep(.el-dialog) {
    border-radius: $radius-lg;
    @include glass-effect(0.95, 20px);
    box-shadow: $shadow-xl;
    border: 1px solid $border-light;
    overflow: hidden;

    .el-dialog__header {
      padding: $spacing-lg $spacing-xl;
      background: $gradient-bg-1;
      border-bottom: 1px solid $border-light;
      position: relative;

      &::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: $gradient-line-top;
      }

      .el-dialog__title {
        font-weight: $font-weight-semibold;
        font-size: $font-lg;
        color: var(--el-text-color-primary);
      }
    }

    .el-dialog__body {
      padding: $spacing-xl;
      background: rgba(255, 255, 255, 0.5);
    }

    .el-dialog__footer {
      padding: $spacing-lg $spacing-xl;
      background: rgba(255, 255, 255, 0.6);
      border-top: 1px solid $border-light;
    }
  }

  :deep(.el-tabs) {
    .el-tabs__header {
      margin-bottom: $spacing-xl;
      border-bottom: 2px solid $border-light;

      .el-tabs__item {
        border-radius: $radius-sm $radius-sm 0 0;
        transition: all $duration-fast $ease-standard;
        font-weight: $font-weight-medium;

        &.is-active {
          color: var(--el-color-primary);
        }

        &:hover {
          color: var(--el-color-primary);
        }
      }
    }
  }
}

.help-content {
  .help-section {
    padding: $spacing-xl;

    h3 {
      color: var(--el-color-primary);
      margin-bottom: $spacing-lg;
      font-size: $font-xl;
      font-weight: $font-weight-bold;
    }

    h4 {
      color: var(--el-text-color-primary);
      margin: $spacing-xl 0 $spacing-md;
      font-size: $font-lg;
      font-weight: $font-weight-semibold;
    }

    p {
      color: var(--el-text-color-regular);
      line-height: 1.6;
      margin-bottom: $spacing-lg;
    }

    ul {
      color: var(--el-text-color-regular);
      line-height: 1.6;
      padding-left: $spacing-xl;

      li {
        margin-bottom: $spacing-sm;

        ul {
          margin-top: $spacing-sm;
          padding-left: $spacing-lg;
        }
      }
    }

    .code-block {
      @include glass-effect(0.9, 16px);
      border-radius: $radius-md;
      padding: $spacing-lg;
      margin: $spacing-lg 0;
      border: 1px solid $border-light;
      box-shadow: $shadow-sm;
      transition: all $duration-normal $ease-standard;

      &:hover {
        box-shadow: $shadow-md;
      }

      pre {
        margin: 0;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: $font-sm;
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
        margin-bottom: $spacing-lg;
        padding: $spacing-md;
        @include glass-effect(0.85, 16px);
        border-radius: $radius-sm;
        border-left: 4px solid var(--el-color-primary);
        transition: all $duration-normal $ease-standard;

        &:hover {
          transform: translateX(4px);
          box-shadow: $shadow-sm;
        }

        strong {
          display: block;
          color: var(--el-text-color-primary);
          margin-bottom: $spacing-sm;
          font-weight: $font-weight-semibold;
        }

        code {
          display: block;
          @include glass-effect(0.9, 16px);
          padding: $spacing-sm $spacing-md;
          border-radius: $radius-sm;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: $font-xs;
          color: var(--el-color-primary);
          word-break: break-all;
          white-space: pre-wrap;
          border: 1px solid $border-light;
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;

  .el-button {
    border-radius: $radius-sm;
    padding: $button-padding-md;
    transition: all $duration-fast $ease-standard;
    font-weight: $font-weight-medium;

    &:hover {
      transform: translateY(-1px);
      box-shadow: $shadow-md;
    }

    &:active {
      transform: translateY(0);
    }
  }
}

// 响应式设计
@include respond-to(lg) {
  .help-content .help-section {
    padding: $spacing-lg;
  }
}

@include respond-to(sm) {
  .help-content {
    .help-section {
      padding: $spacing-md;

      .code-block {
        padding: $spacing-md;

        pre {
          font-size: $font-xs;
        }
      }

      .examples {
        .example-item {
          padding: $spacing-sm;

          code {
            font-size: 11px;
            padding: $spacing-xs $spacing-sm;
          }
        }
      }
    }
  }
}
</style>
