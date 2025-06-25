<template>
  <el-dialog
    v-model="visible"
    title="配置模板"
    width="600px"
    :close-on-click-modal="false"
    destroy-on-close
    class="config-template-dialog"
  >
    <div class="template-content">
      <div class="template-list">
        <div
          v-for="template in templates"
          :key="template.name"
          class="template-item"
          @click="selectTemplate(template)"
        >
          <div class="template-header">
            <div class="template-title">
              <IconifyIconOnline :icon="template.icon" class="template-icon" />
              <span>{{ template.name }}</span>
            </div>
            <el-button type="primary" text size="small">
              选择
            </el-button>
          </div>
          <div class="template-description">
            {{ template.description }}
          </div>
          <div class="template-preview">
            <pre><code>{{ template.config }}</code></pre>
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
import { ref, computed } from "vue";

// 定义事件
const emit = defineEmits<{
  select: [template: string];
}>();

// 响应式状态
const visible = ref(false);
const componentType = ref<string>("card");

// 模板配置
const templateConfigs = {
  card: [
    {
      name: "基础卡片",
      icon: "ri:dashboard-line",
      description: "显示单个数值的基础卡片配置",
      config: JSON.stringify({
        unit: "%",
        icon: "ri:dashboard-line"
      }, null, 2)
    },
    {
      name: "带阈值卡片",
      icon: "ri:alarm-warning-line",
      description: "带有警告阈值的卡片配置",
      config: JSON.stringify({
        unit: "%",
        icon: "ri:cpu-line",
        thresholds: [
          { value: 70, color: "#E6A23C" },
          { value: 90, color: "#F56C6C" }
        ]
      }, null, 2)
    }
  ],
  gauge: [
    {
      name: "基础仪表盘",
      icon: "ri:dashboard-3-line",
      description: "标准的仪表盘配置",
      config: JSON.stringify({
        min: 0,
        max: 100,
        unit: "%",
        thresholds: [
          { value: 70, color: "#E6A23C" },
          { value: 90, color: "#F56C6C" }
        ]
      }, null, 2)
    },
    {
      name: "自定义范围仪表盘",
      icon: "ri:speed-line",
      description: "自定义数值范围的仪表盘",
      config: JSON.stringify({
        min: 0,
        max: 1000,
        unit: "MB/s",
        thresholds: [
          { value: 700, color: "#E6A23C" },
          { value: 900, color: "#F56C6C" }
        ]
      }, null, 2)
    }
  ],
  line: [
    {
      name: "基础折线图",
      icon: "ri:line-chart-line",
      description: "标准的折线图配置",
      config: JSON.stringify({
        unit: "%",
        legend: true,
        color: "#409EFF",
        smooth: true
      }, null, 2)
    },
    {
      name: "多色折线图",
      icon: "ri:line-chart-fill",
      description: "带有渐变色的折线图",
      config: JSON.stringify({
        unit: "MB",
        legend: true,
        color: "#67C23A",
        smooth: true,
        gradient: true
      }, null, 2)
    }
  ],
  bar: [
    {
      name: "基础柱状图",
      icon: "ri:bar-chart-line",
      description: "标准的柱状图配置",
      config: JSON.stringify({
        unit: "",
        legend: true,
        color: "#409EFF"
      }, null, 2)
    },
    {
      name: "堆叠柱状图",
      icon: "ri:bar-chart-fill",
      description: "堆叠显示的柱状图",
      config: JSON.stringify({
        unit: "GB",
        legend: true,
        stack: true,
        colors: ["#409EFF", "#67C23A", "#E6A23C"]
      }, null, 2)
    }
  ],
  pie: [
    {
      name: "基础饼图",
      icon: "ri:pie-chart-line",
      description: "标准的饼图配置",
      config: JSON.stringify({
        legend: true,
        radius: ["40%", "70%"]
      }, null, 2)
    },
    {
      name: "环形饼图",
      icon: "ri:pie-chart-fill",
      description: "环形显示的饼图",
      config: JSON.stringify({
        legend: true,
        radius: ["50%", "80%"],
        center: ["50%", "50%"]
      }, null, 2)
    }
  ],
  table: [
    {
      name: "基础表格",
      icon: "ri:table-line",
      description: "标准的表格配置",
      config: JSON.stringify({
        columns: [
          { prop: "name", label: "名称", width: "120" },
          { prop: "value", label: "值", width: "100" },
          { prop: "status", label: "状态", width: "80" }
        ],
        stripe: true,
        border: false
      }, null, 2)
    }
  ]
};

// 计算属性
const templates = computed(() => {
  return templateConfigs[componentType.value as keyof typeof templateConfigs] || [];
});

/**
 * 打开对话框
 */
const open = (type: string = "card") => {
  componentType.value = type;
  visible.value = true;
};

/**
 * 选择模板
 */
const selectTemplate = (template: any) => {
  emit("select", template.config);
  visible.value = false;
};

// 暴露方法
defineExpose({
  open,
});
</script>

<style lang="scss" scoped>
.config-template-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
  }
}

.template-content {
  .template-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 500px;
    overflow-y: auto;

    .template-item {
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        border-color: var(--el-color-primary);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .template-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .template-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: var(--el-text-color-primary);

          .template-icon {
            font-size: 18px;
            color: var(--el-color-primary);
          }
        }
      }

      .template-description {
        font-size: 14px;
        color: var(--el-text-color-regular);
        margin-bottom: 12px;
        line-height: 1.5;
      }

      .template-preview {
        background: var(--el-fill-color-extra-light);
        border-radius: 6px;
        padding: 12px;
        border: 1px solid var(--el-border-color-extra-light);

        pre {
          margin: 0;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 12px;
          line-height: 1.4;
          color: var(--el-text-color-primary);
          white-space: pre-wrap;
          word-break: break-all;

          code {
            background: none;
            padding: 0;
            border-radius: 0;
            font-size: inherit;
            color: var(--el-color-primary);
          }
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

// 响应式设计
@media (max-width: 768px) {
  .template-content {
    .template-list {
      .template-item {
        padding: 12px;

        .template-header {
          .template-title {
            font-size: 14px;

            .template-icon {
              font-size: 16px;
            }
          }
        }

        .template-description {
          font-size: 13px;
        }

        .template-preview {
          padding: 8px;

          pre {
            font-size: 11px;
          }
        }
      }
    }
  }
}
</style>
