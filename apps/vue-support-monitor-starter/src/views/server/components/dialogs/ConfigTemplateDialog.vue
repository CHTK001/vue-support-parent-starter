<template>
  <sc-dialog
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
  </sc-dialog>
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
@use "@/styles/variables.scss" as *;

.config-template-dialog {
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
}

.template-content {
  .template-list {
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
    max-height: 500px;
    overflow-y: auto;
    @include custom-scrollbar;

    .template-item {
      @include card-style;
      padding: $spacing-lg;
      cursor: pointer;
      transition: all $duration-normal $ease-standard;

      &:hover {
        border-color: var(--el-color-primary);
        transform: translateY(-2px);
      }

      .template-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: $spacing-sm;

        .template-title {
          display: flex;
          align-items: center;
          gap: $spacing-sm;
          font-size: $font-lg;
          font-weight: $font-weight-semibold;
          color: var(--el-text-color-primary);

          .template-icon {
            font-size: $icon-lg;
            color: var(--el-color-primary);
            transition: transform $duration-fast $ease-standard;
          }
        }

        .el-button {
          border-radius: $radius-sm;
          transition: all $duration-fast $ease-standard;

          &:hover {
            transform: scale(1.05);
          }
        }
      }

      &:hover .template-icon {
        transform: scale(1.1) rotate(5deg);
      }

      .template-description {
        font-size: $font-md;
        color: var(--el-text-color-regular);
        margin-bottom: $spacing-md;
        line-height: 1.5;
      }

      .template-preview {
        @include glass-effect(0.85, 16px);
        border-radius: $radius-sm;
        padding: $spacing-md;
        border: 1px solid $border-light;
        transition: all $duration-fast $ease-standard;

        &:hover {
          border-color: $border-primary;
        }

        pre {
          margin: 0;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: $font-xs;
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
  .template-content .template-list {
    max-height: 400px;
  }
}

@include respond-to(sm) {
  .template-content {
    .template-list {
      gap: $spacing-md;
      max-height: 350px;

      .template-item {
        padding: $spacing-md;

        .template-header {
          .template-title {
            font-size: $font-md;

            .template-icon {
              font-size: $icon-md;
            }
          }
        }

        .template-description {
          font-size: $font-sm;
        }

        .template-preview {
          padding: $spacing-sm;

          pre {
            font-size: 11px;
          }
        }
      }
    }
  }
}
</style>
