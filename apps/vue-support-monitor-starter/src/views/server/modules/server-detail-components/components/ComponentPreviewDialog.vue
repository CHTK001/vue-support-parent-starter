<template>
  <el-dialog
    v-model="visible"
    title="组件预览"
    width="1000px"
    :close-on-click-modal="false"
    destroy-on-close
    class="component-preview-dialog"
    align-center
    top="5vh"
  >
    <!-- 自定义头部 -->
    <template #header="{ titleId, titleClass }">
      <div class="dialog-header">
        <div class="header-left">
          <IconifyIconOnline icon="ri:eye-line" class="header-icon" />
          <span :id="titleId" :class="titleClass" class="dialog-title">
            组件预览 - {{ componentData?.monitorSysGenServerDetailComponentName || '未命名组件' }}
          </span>
        </div>
        <div class="header-right">
          <el-tag :type="getComponentTypeColor(componentData?.monitorSysGenServerDetailComponentType)" size="small">
            <IconifyIconOnline :icon="getComponentTypeIcon(componentData?.monitorSysGenServerDetailComponentType)" class="mr-1" />
            {{ getComponentTypeName(componentData?.monitorSysGenServerDetailComponentType) }}
          </el-tag>
          <el-button size="small" @click="handleRefresh" :loading="loading">
            <IconifyIconOnline icon="ri:refresh-line" />
            刷新
          </el-button>
        </div>
      </div>
    </template>

    <div class="preview-content" v-loading="loading">
      <!-- 组件信息 -->
      <div class="component-info">
        <div class="info-item">
          <span class="label">组件名称：</span>
          <span class="value">{{ componentData?.monitorSysGenServerDetailComponentName }}</span>
        </div>
        <div class="info-item">
          <span class="label">组件标题：</span>
          <span class="value">{{ componentData?.monitorSysGenServerDetailComponentTitle }}</span>
        </div>
        <div class="info-item">
          <span class="label">组件类型：</span>
          <span class="value">{{ getComponentTypeName(componentData?.monitorSysGenServerDetailComponentType) }}</span>
        </div>
        <div class="info-item">
          <span class="label">表达式类型：</span>
          <span class="value">{{ getExpressionTypeName(componentData?.monitorSysGenServerDetailComponentExpressionType) }}</span>
        </div>
        <div class="info-item" v-if="componentData?.monitorSysGenServerDetailComponentExpression">
          <span class="label">查询表达式：</span>
          <div class="expression-value">
            <code>{{ componentData.monitorSysGenServerDetailComponentExpression }}</code>
          </div>
        </div>
      </div>

      <!-- 预览区域 -->
      <div class="preview-area">
        <div class="preview-header">
          <h4>
            <IconifyIconOnline icon="ri:dashboard-line" class="mr-1" />
            组件预览
          </h4>
          <div class="preview-actions">
            <el-button-group>
              <el-button 
                size="small" 
                :type="previewSize === 'small' ? 'primary' : ''"
                @click="previewSize = 'small'"
              >
                小
              </el-button>
              <el-button 
                size="small" 
                :type="previewSize === 'medium' ? 'primary' : ''"
                @click="previewSize = 'medium'"
              >
                中
              </el-button>
              <el-button 
                size="small" 
                :type="previewSize === 'large' ? 'primary' : ''"
                @click="previewSize = 'large'"
              >
                大
              </el-button>
            </el-button-group>
          </div>
        </div>
        
        <div class="preview-wrapper" :class="`preview-${previewSize}`">
          <!-- 模拟预览组件 -->
          <div class="mock-component" :class="componentData?.monitorSysGenServerDetailComponentType">
            <div class="component-header">
              <h5>{{ componentData?.monitorSysGenServerDetailComponentTitle || '组件标题' }}</h5>
            </div>
            <div class="component-body">
              <!-- 根据组件类型显示不同的预览内容 -->
              <div v-if="componentData?.monitorSysGenServerDetailComponentType === 'card'" class="card-preview">
                <div class="metric-value">{{ mockData.value }}</div>
                <div class="metric-unit">{{ mockData.unit }}</div>
                <div class="metric-trend" :class="mockData.trend">
                  <IconifyIconOnline :icon="mockData.trend === 'up' ? 'ri:arrow-up-line' : 'ri:arrow-down-line'" />
                  {{ mockData.change }}
                </div>
              </div>
              
              <div v-else-if="componentData?.monitorSysGenServerDetailComponentType === 'gauge'" class="gauge-preview">
                <div class="gauge-circle">
                  <div class="gauge-value">{{ mockData.percentage }}%</div>
                </div>
                <div class="gauge-label">{{ mockData.label }}</div>
              </div>
              
              <div v-else-if="componentData?.monitorSysGenServerDetailComponentType === 'line'" class="chart-preview">
                <div class="chart-placeholder">
                  <IconifyIconOnline icon="ri:line-chart-line" />
                  <span>折线图预览</span>
                </div>
              </div>
              
              <div v-else-if="componentData?.monitorSysGenServerDetailComponentType === 'bar'" class="chart-preview">
                <div class="chart-placeholder">
                  <IconifyIconOnline icon="ri:bar-chart-line" />
                  <span>柱状图预览</span>
                </div>
              </div>
              
              <div v-else-if="componentData?.monitorSysGenServerDetailComponentType === 'pie'" class="chart-preview">
                <div class="chart-placeholder">
                  <IconifyIconOnline icon="ri:pie-chart-line" />
                  <span>饼图预览</span>
                </div>
              </div>
              
              <div v-else-if="componentData?.monitorSysGenServerDetailComponentType === 'table'" class="table-preview">
                <table>
                  <thead>
                    <tr>
                      <th>指标</th>
                      <th>数值</th>
                      <th>状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in mockData.tableData" :key="index">
                      <td>{{ item.metric }}</td>
                      <td>{{ item.value }}</td>
                      <td>
                        <el-tag :type="item.status === 'normal' ? 'success' : 'warning'" size="small">
                          {{ item.status === 'normal' ? '正常' : '警告' }}
                        </el-tag>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div v-else class="default-preview">
                <IconifyIconOnline icon="ri:dashboard-line" />
                <span>{{ getComponentTypeName(componentData?.monitorSysGenServerDetailComponentType) }} 预览</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">关闭</el-button>
        <el-button type="primary" @click="handleRefresh" :loading="loading">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新预览
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import type { ServerDetailComponent } from "@/api/server";

// 定义属性
const props = defineProps<{
  serverId: number;
}>();

// 响应式状态
const visible = ref(false);
const loading = ref(false);
const previewSize = ref<'small' | 'medium' | 'large'>('medium');
const componentData = ref<ServerDetailComponent>();

// 模拟数据
const mockData = reactive({
  value: '85.6',
  unit: '%',
  change: '+2.3%',
  trend: 'up',
  percentage: 76,
  label: 'CPU使用率',
  tableData: [
    { metric: 'CPU使用率', value: '85.6%', status: 'normal' },
    { metric: '内存使用率', value: '92.3%', status: 'warning' },
    { metric: '磁盘使用率', value: '45.2%', status: 'normal' },
  ]
});

/**
 * 打开对话框
 */
const open = (data: ServerDetailComponent) => {
  componentData.value = data;
  visible.value = true;
  handleRefresh();
};

/**
 * 刷新预览
 */
const handleRefresh = () => {
  loading.value = true;
  
  // 模拟数据加载
  setTimeout(() => {
    // 生成随机模拟数据
    mockData.value = (Math.random() * 100).toFixed(1);
    mockData.percentage = Math.floor(Math.random() * 100);
    mockData.change = (Math.random() > 0.5 ? '+' : '-') + (Math.random() * 10).toFixed(1) + '%';
    mockData.trend = mockData.change.startsWith('+') ? 'up' : 'down';
    
    loading.value = false;
  }, 1000);
};

/**
 * 获取组件类型名称
 */
const getComponentTypeName = (type?: string) => {
  const typeMap: Record<string, string> = {
    card: '卡片',
    gauge: '仪表盘',
    line: '折线图',
    bar: '柱状图',
    pie: '饼图',
    table: '表格'
  };
  return typeMap[type || 'card'] || '未知';
};

/**
 * 获取组件类型图标
 */
const getComponentTypeIcon = (type?: string) => {
  const iconMap: Record<string, string> = {
    card: 'ri:dashboard-line',
    gauge: 'ri:dashboard-3-line',
    line: 'ri:line-chart-line',
    bar: 'ri:bar-chart-line',
    pie: 'ri:pie-chart-line',
    table: 'ri:table-line'
  };
  return iconMap[type || 'card'] || 'ri:dashboard-line';
};

/**
 * 获取组件类型颜色
 */
const getComponentTypeColor = (type?: string) => {
  const colorMap: Record<string, string> = {
    card: 'primary',
    gauge: 'success',
    line: 'warning',
    bar: 'info',
    pie: 'danger',
    table: ''
  };
  return colorMap[type || 'card'] || '';
};

/**
 * 获取表达式类型名称
 */
const getExpressionTypeName = (type?: string) => {
  const typeMap: Record<string, string> = {
    PROMETHEUS: 'Prometheus PromQL',
    COMPONENT: '组件选择',
    SQL: 'SQL查询'
  };
  return typeMap[type || 'COMPONENT'] || '未知';
};

// 暴露方法
defineExpose({
  open,
});
</script>

<style lang="scss" scoped>
.component-preview-dialog {
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

.preview-content {
  padding: 20px 0;

  .component-info {
    background: var(--el-fill-color-light);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;

    .info-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        min-width: 100px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .value {
        color: var(--el-text-color-regular);
        flex: 1;
      }

      .expression-value {
        flex: 1;

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
          border: 1px solid var(--el-border-color-light);
        }
      }
    }
  }

  .preview-area {
    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      h4 {
        display: flex;
        align-items: center;
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
    }

    .preview-wrapper {
      border: 1px solid var(--el-border-color-light);
      border-radius: 8px;
      overflow: hidden;
      background: var(--el-bg-color-overlay);

      &.preview-small {
        height: 200px;
      }

      &.preview-medium {
        height: 300px;
      }

      &.preview-large {
        height: 400px;
      }

      .mock-component {
        height: 100%;
        display: flex;
        flex-direction: column;

        .component-header {
          padding: 12px 16px;
          background: var(--el-fill-color-light);
          border-bottom: 1px solid var(--el-border-color-light);

          h5 {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
            color: var(--el-text-color-primary);
          }
        }

        .component-body {
          flex: 1;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    }
  }
}

// 组件预览样式
.card-preview {
  text-align: center;
  width: 100%;

  .metric-value {
    font-size: 36px;
    font-weight: 700;
    color: var(--el-color-primary);
    margin-bottom: 8px;
  }

  .metric-unit {
    font-size: 14px;
    color: var(--el-text-color-regular);
    margin-bottom: 12px;
  }

  .metric-trend {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 14px;
    font-weight: 600;

    &.up {
      color: var(--el-color-success);
    }

    &.down {
      color: var(--el-color-danger);
    }
  }
}

.gauge-preview {
  text-align: center;
  width: 100%;

  .gauge-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: conic-gradient(var(--el-color-primary) 0deg 270deg, var(--el-fill-color-light) 270deg 360deg);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      width: 80px;
      height: 80px;
      background: var(--el-bg-color-overlay);
      border-radius: 50%;
    }

    .gauge-value {
      position: relative;
      z-index: 1;
      font-size: 24px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }
  }

  .gauge-label {
    font-size: 14px;
    color: var(--el-text-color-regular);
  }
}

.chart-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .chart-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    color: var(--el-text-color-placeholder);

    .iconify {
      font-size: 48px;
    }

    span {
      font-size: 16px;
    }
  }
}

.table-preview {
  width: 100%;

  table {
    width: 100%;
    border-collapse: collapse;

    th, td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid var(--el-border-color-light);
    }

    th {
      background: var(--el-fill-color-light);
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    td {
      color: var(--el-text-color-regular);
    }
  }
}

.default-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--el-text-color-placeholder);
  width: 100%;

  .iconify {
    font-size: 48px;
  }

  span {
    font-size: 16px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 0 0;
  border-top: 1px solid var(--el-border-color-light);
}

// 响应式设计
@media (max-width: 768px) {
  .preview-content {
    .component-info {
      padding: 12px;

      .info-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;

        .label {
          min-width: auto;
        }
      }
    }

    .preview-area {
      .preview-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .preview-wrapper {
        &.preview-small,
        &.preview-medium,
        &.preview-large {
          height: 250px;
        }

        .mock-component {
          .component-body {
            padding: 12px;
          }
        }
      }
    }
  }

  .card-preview {
    .metric-value {
      font-size: 28px;
    }
  }

  .gauge-preview {
    .gauge-circle {
      width: 100px;
      height: 100px;

      &::before {
        width: 70px;
        height: 70px;
      }

      .gauge-value {
        font-size: 20px;
      }
    }
  }

  .chart-preview {
    .chart-placeholder {
      .iconify {
        font-size: 36px;
      }

      span {
        font-size: 14px;
      }
    }
  }
}
</style>
