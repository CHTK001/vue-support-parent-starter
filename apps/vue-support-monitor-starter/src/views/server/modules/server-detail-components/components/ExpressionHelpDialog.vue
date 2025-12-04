<template>
  <el-dialog
    v-model="visible"
    title="表达式帮助"
    width="1000px"
    :close-on-click-modal="false"
    destroy-on-close
    class="expression-help-dialog"
    align-center
    top="5vh"
  >
    <!-- 自定义头部 -->
    <template #header="{ titleId, titleClass }">
      <div class="dialog-header">
        <div class="header-left">
          <IconifyIconOnline icon="ri:question-line" class="header-icon" />
          <span :id="titleId" :class="titleClass" class="dialog-title">
            {{
              serverReportType === "prometheus"
                ? "PromQL 表达式帮助"
                : "组件选择帮助"
            }}
          </span>
        </div>
        <div class="header-right">
          <el-tag
            v-if="serverReportType === 'prometheus'"
            type="success"
            size="small"
          >
            <IconifyIconOnline icon="logos:prometheus" class="mr-1" />
            Prometheus
          </el-tag>
          <el-tag
            v-else-if="serverReportType === 'api'"
            type="primary"
            size="small"
          >
            <IconifyIconOnline icon="ri:api-line" class="mr-1" />
            API 上报
          </el-tag>
          <el-tag v-else type="info" size="small">
            <IconifyIconOnline icon="ri:server-line" class="mr-1" />
            本地收集
          </el-tag>
        </div>
      </div>
    </template>

    <div class="help-content modern-scrollbar">
      <!-- Prometheus 表达式帮助 -->
      <div v-if="serverReportType === 'prometheus'" class="prometheus-help">
        <div class="help-section">
          <h3>
            <IconifyIconOnline icon="logos:prometheus" class="mr-2" />
            Prometheus PromQL 语法
          </h3>
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
sum(rate(http_requests_total[5m]))</code></pre>
          </div>

          <h4>常用函数</h4>
          <div class="function-list">
            <div class="function-item">
              <strong>rate()</strong> - 计算每秒平均增长率
            </div>
            <div class="function-item">
              <strong>irate()</strong> - 计算瞬时增长率
            </div>
            <div class="function-item"><strong>avg()</strong> - 平均值</div>
            <div class="function-item"><strong>sum()</strong> - 求和</div>
            <div class="function-item"><strong>max()</strong> - 最大值</div>
            <div class="function-item"><strong>min()</strong> - 最小值</div>
          </div>

          <h4>示例表达式</h4>
          <div class="examples">
            <div
              class="example-item"
              @click="
                selectExpression(
                  '100 - (avg(irate(node_cpu_seconds_total{mode=&quot;idle&quot;}[5m])) * 100)'
                )
              "
            >
              <div class="example-header">
                <strong>CPU使用率</strong>
                <el-button type="primary" text size="small">
                  <IconifyIconOnline icon="ri:add-line" />
                  选择
                </el-button>
              </div>
              <code
                >100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) *
                100)</code
              >
            </div>
            <div
              class="example-item"
              @click="
                selectExpression(
                  '(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100'
                )
              "
            >
              <div class="example-header">
                <strong>内存使用率</strong>
                <el-button type="primary" text size="small">
                  <IconifyIconOnline icon="ri:add-line" />
                  选择
                </el-button>
              </div>
              <code
                >(1 - (node_memory_MemAvailable_bytes /
                node_memory_MemTotal_bytes)) * 100</code
              >
            </div>
            <div
              class="example-item"
              @click="
                selectExpression(
                  '(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100'
                )
              "
            >
              <div class="example-header">
                <strong>磁盘使用率</strong>
                <el-button type="primary" text size="small">
                  <IconifyIconOnline icon="ri:add-line" />
                  选择
                </el-button>
              </div>
              <code
                >(1 - (node_filesystem_avail_bytes /
                node_filesystem_size_bytes)) * 100</code
              >
            </div>
            <div
              class="example-item"
              @click="
                selectExpression('rate(node_network_receive_bytes_total[5m])')
              "
            >
              <div class="example-header">
                <strong>网络接收流量</strong>
                <el-button type="primary" text size="small">
                  <IconifyIconOnline icon="ri:add-line" />
                  选择
                </el-button>
              </div>
              <code>rate(node_network_receive_bytes_total[5m])</code>
            </div>
          </div>
        </div>
      </div>

      <!-- 非 Prometheus 组件选择帮助 -->
      <div v-else class="component-help">
        <div class="help-section">
          <h3>
            <IconifyIconOnline icon="ri:dashboard-line" class="mr-2" />
            可用组件类型
          </h3>
          <p>选择要监控的系统组件，系统将自动收集相应的监控数据。</p>

          <div class="component-grid">
            <div class="component-category">
              <h4>
                <IconifyIconOnline icon="ri:cpu-line" class="mr-1" />
                系统资源
              </h4>
              <div class="component-list">
                <div
                  class="component-item"
                  @click="selectComponent('cpu_usage')"
                >
                  <div class="component-info">
                    <strong>CPU使用率</strong>
                    <span>监控CPU使用百分比</span>
                  </div>
                  <el-button type="primary" text size="small">选择</el-button>
                </div>
                <div
                  class="component-item"
                  @click="selectComponent('memory_usage')"
                >
                  <div class="component-info">
                    <strong>内存使用率</strong>
                    <span>监控内存使用百分比</span>
                  </div>
                  <el-button type="primary" text size="small">选择</el-button>
                </div>
                <div
                  class="component-item"
                  @click="selectComponent('load_average')"
                >
                  <div class="component-info">
                    <strong>系统负载</strong>
                    <span>监控系统平均负载</span>
                  </div>
                  <el-button type="primary" text size="small">选择</el-button>
                </div>
              </div>
            </div>

            <div class="component-category">
              <h4>
                <IconifyIconOnline icon="ri:hard-drive-line" class="mr-1" />
                存储监控
              </h4>
              <div class="component-list">
                <div
                  class="component-item"
                  @click="selectComponent('disk_usage')"
                >
                  <div class="component-info">
                    <strong>磁盘使用率</strong>
                    <span>监控磁盘空间使用情况</span>
                  </div>
                  <el-button type="primary" text size="small">选择</el-button>
                </div>
                <div
                  class="component-item"
                  @click="selectComponent('disk_list')"
                >
                  <div class="component-info">
                    <strong>磁盘列表</strong>
                    <span>显示所有磁盘信息</span>
                  </div>
                  <el-button type="primary" text size="small">选择</el-button>
                </div>
                <div class="component-item" @click="selectComponent('disk_io')">
                  <div class="component-info">
                    <strong>磁盘IO统计</strong>
                    <span>监控磁盘读写性能</span>
                  </div>
                  <el-button type="primary" text size="small">选择</el-button>
                </div>
              </div>
            </div>

            <div class="component-category">
              <h4>
                <IconifyIconOnline icon="ri:wifi-line" class="mr-1" />
                网络监控
              </h4>
              <div class="component-list">
                <div
                  class="component-item"
                  @click="selectComponent('network_io')"
                >
                  <div class="component-info">
                    <strong>网络IO</strong>
                    <span>监控网络流量统计</span>
                  </div>
                  <el-button type="primary" text size="small">选择</el-button>
                </div>
              </div>
            </div>

            <div class="component-category">
              <h4>
                <IconifyIconOnline icon="ri:terminal-line" class="mr-1" />
                进程监控
              </h4>
              <div class="component-list">
                <div
                  class="component-item"
                  @click="selectComponent('process_list')"
                >
                  <div class="component-info">
                    <strong>进程列表</strong>
                    <span>显示系统进程信息</span>
                  </div>
                  <el-button type="primary" text size="small">选择</el-button>
                </div>
                <div
                  class="component-item"
                  @click="selectComponent('process_count')"
                >
                  <div class="component-info">
                    <strong>进程数量统计</strong>
                    <span>统计系统进程数量</span>
                  </div>
                  <el-button type="primary" text size="small">选择</el-button>
                </div>
                <div
                  class="component-item"
                  @click="selectComponent('top_processes')"
                >
                  <div class="component-info">
                    <strong>资源占用TOP进程</strong>
                    <span>显示资源占用最高的进程</span>
                  </div>
                  <el-button type="primary" text size="small">选择</el-button>
                </div>
              </div>
            </div>

            <div class="component-category">
              <h4>
                <IconifyIconOnline icon="ri:information-line" class="mr-1" />
                系统信息
              </h4>
              <div class="component-list">
                <div
                  class="component-item"
                  @click="selectComponent('system_info')"
                >
                  <div class="component-info">
                    <strong>系统基本信息</strong>
                    <span>显示系统基本配置信息</span>
                  </div>
                  <el-button type="primary" text size="small">选择</el-button>
                </div>
                <div class="component-item" @click="selectComponent('uptime')">
                  <div class="component-info">
                    <strong>系统运行时间</strong>
                    <span>显示系统启动时间和运行时长</span>
                  </div>
                  <el-button type="primary" text size="small">选择</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
import { IconifyIconOnline } from "@repo/components/ReIcon";

// 定义属性
const props = defineProps<{
  serverId: number;
}>();

// 定义事件
const emit = defineEmits<{
  expressionSelected: [expression: string];
}>();

// 响应式状态
const visible = ref(false);
const expressionType = ref<string>("PROMETHEUS");
const serverReportType = ref<string>("prometheus");

/**
 * 打开对话框
 */
const open = (
  type: string = "PROMETHEUS",
  reportType: string = "prometheus"
) => {
  expressionType.value = type;
  serverReportType.value = reportType;
  visible.value = true;
};

/**
 * 选择表达式
 */
const selectExpression = (expression: string) => {
  emit("expressionSelected", expression);
  visible.value = false;
};

/**
 * 选择组件
 */
const selectComponent = (component: string) => {
  emit("expressionSelected", component);
  visible.value = false;
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

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;

    .header-icon {
      font-size: 20px;
      color: var(--el-color-primary);
    }

    .dialog-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.help-content {
  max-height: 70vh;
  overflow-y: auto;
  padding: 20px 0;

  .help-section {
    h3 {
      display: flex;
      align-items: center;
      color: var(--el-color-primary);
      margin-bottom: 16px;
      font-size: 18px;
      font-weight: 600;
    }

    h4 {
      display: flex;
      align-items: center;
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

    .code-block {
      background: var(--el-fill-color-extra-light);
      border: 1px solid var(--el-border-color-light);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;

      pre {
        margin: 0;
        font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
        font-size: 13px;
        line-height: 1.5;
        color: var(--el-text-color-primary);
        white-space: pre-wrap;
        word-break: break-all;
      }
    }

    .function-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 12px;
      margin-bottom: 20px;

      .function-item {
        padding: 12px;
        background: var(--el-fill-color-light);
        border-radius: 6px;
        border-left: 4px solid var(--el-color-primary);

        strong {
          color: var(--el-color-primary);
          font-weight: 600;
        }
      }
    }

    .examples {
      .example-item {
        margin-bottom: 16px;
        padding: 16px;
        background: var(--el-fill-color-light);
        border-radius: 8px;
        border: 1px solid var(--el-border-color-light);
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          border-color: var(--el-color-primary);
          box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
        }

        .example-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          strong {
            color: var(--el-text-color-primary);
            font-weight: 600;
          }
        }

        code {
          display: block;
          background: var(--el-fill-color-extra-light);
          padding: 8px 12px;
          border-radius: 4px;
          font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
          font-size: 12px;
          color: var(--el-color-primary);
          word-break: break-all;
          white-space: pre-wrap;
        }
      }
    }
  }

  .component-help {
    .component-grid {
      display: grid;
      gap: 24px;

      .component-category {
        h4 {
          display: flex;
          align-items: center;
          color: var(--el-text-color-primary);
          margin-bottom: 16px;
          font-size: 16px;
          font-weight: 600;
          padding-bottom: 8px;
          border-bottom: 2px solid var(--el-border-color-light);
        }

        .component-list {
          display: grid;
          gap: 12px;

          .component-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            background: var(--el-fill-color-light);
            border-radius: 8px;
            border: 1px solid var(--el-border-color-light);
            cursor: pointer;
            transition: all 0.3s ease;

            &:hover {
              border-color: var(--el-color-primary);
              box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
              transform: translateY(-2px);
            }

            .component-info {
              flex: 1;

              strong {
                display: block;
                color: var(--el-text-color-primary);
                font-weight: 600;
                margin-bottom: 4px;
              }

              span {
                color: var(--el-text-color-regular);
                font-size: 13px;
              }
            }
          }
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 0 0;
  border-top: 1px solid var(--el-border-color-light);
}

// 响应式设计
@media (max-width: 768px) {
  .help-content {
    .help-section {
      .function-list {
        grid-template-columns: 1fr;
      }

      .examples {
        .example-item {
          padding: 12px;

          code {
            font-size: 11px;
            padding: 6px 8px;
          }
        }
      }
    }

    .component-help {
      .component-grid {
        .component-category {
          .component-list {
            .component-item {
              padding: 12px;
              flex-direction: column;
              align-items: flex-start;
              gap: 8px;

              .component-info {
                strong {
                  font-size: 14px;
                }

                span {
                  font-size: 12px;
                }
              }
            }
          }
        }
      }
    }
  }
}

// 滚动条样式
.help-content {
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--el-fill-color-light);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color);
    border-radius: 3px;

    &:hover {
      background: var(--el-border-color-dark);
    }
  }
}
</style>
