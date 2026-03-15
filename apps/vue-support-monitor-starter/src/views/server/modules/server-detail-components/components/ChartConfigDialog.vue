<template>
  <sc-dialog
    v-model="visible"
    title="图表配置"
    width="800px"
    :close-on-click-modal="false"
    destroy-on-close
    class="chart-config-dialog"
  >
    <div class="config-content">
      <ScTabs v-model="activeTab" type="border-card">
        <ScTabPane label="基础配置" name="basic">
          <ScForm :model="configForm" label-width="120px" class="config-form">
            <ScFormItem label="图表标题">
              <ScInput
                v-model="configForm.title"
                placeholder="请输入图表标题"
              />
            </ScFormItem>

            <ScFormItem label="显示图例">
              <ScSwitch v-model="configForm.legend.show" />
            </ScFormItem>

            <ScFormItem v-if="configForm.legend.show" label="图例位置">
              <ScSelect
                v-model="configForm.legend.position"
                style="width: 100%"
              >
                <ScOption label="顶部" value="top" />
                <ScOption label="底部" value="bottom" />
                <ScOption label="左侧" value="left" />
                <ScOption label="右侧" value="right" />
              </ScSelect>
            </ScFormItem>

            <ScFormItem label="显示工具栏">
              <ScSwitch v-model="configForm.toolbox.show" />
            </ScFormItem>

            <ScFormItem label="显示数据缩放">
              <ScSwitch v-model="configForm.dataZoom.show" />
            </ScFormItem>
          </ScForm>
        </ScTabPane>

        <ScTabPane label="样式配置" name="style">
          <ScForm :model="configForm" label-width="120px" class="config-form">
            <ScFormItem label="主题色">
              <ScColorPicker v-model="configForm.color.primary" />
            </ScFormItem>

            <ScFormItem label="背景色">
              <ScColorPicker v-model="configForm.color.background" />
            </ScFormItem>

            <ScFormItem label="网格线颜色">
              <ScColorPicker v-model="configForm.color.grid" />
            </ScFormItem>

            <ScFormItem label="字体大小">
              <ScInputNumber
                v-model="configForm.fontSize"
                :min="10"
                :max="24"
                style="width: 100%"
              />
            </ScFormItem>

            <ScFormItem v-if="isLineChart" label="线条宽度">
              <ScInputNumber
                v-model="configForm.lineWidth"
                :min="1"
                :max="10"
                style="width: 100%"
              />
            </ScFormItem>

            <ScFormItem v-if="isBarChart" label="柱状图宽度">
              <ScInputNumber
                v-model="configForm.barWidth"
                :min="10"
                :max="100"
                style="width: 100%"
              />
            </ScFormItem>
          </ScForm>
        </ScTabPane>

        <ScTabPane label="数据配置" name="data">
          <ScForm :model="configForm" label-width="120px" class="config-form">
            <ScFormItem label="数据单位">
              <ScInput
                v-model="configForm.unit"
                placeholder="如：%、MB、个等"
              />
            </ScFormItem>

            <ScFormItem label="小数位数">
              <ScInputNumber
                v-model="configForm.decimal"
                :min="0"
                :max="6"
                style="width: 100%"
              />
            </ScFormItem>

            <ScFormItem v-if="isGaugeChart" label="最大值">
              <ScInputNumber
                v-model="configForm.max"
                :min="1"
                style="width: 100%"
              />
            </ScFormItem>

            <ScFormItem v-if="isGaugeChart" label="最小值">
              <ScInputNumber
                v-model="configForm.min"
                :min="0"
                style="width: 100%"
              />
            </ScFormItem>

            <ScFormItem v-if="isGaugeChart || isCardChart" label="阈值配置">
              <div class="threshold-config">
                <div
                  v-for="(threshold, index) in configForm.thresholds"
                  :key="index"
                  class="threshold-item"
                >
                  <ScInputNumber
                    v-model="threshold.value"
                    placeholder="阈值"
                    style="width: 120px"
                  />
                  <ScColorPicker v-model="threshold.color" />
                  <ScInput
                    v-model="threshold.label"
                    placeholder="标签"
                    style="width: 100px"
                  />
                  <ScButton
                    type="danger"
                    size="small"
                    @click="removeThreshold(index)"
                  >
                    <IconifyIconOnline icon="ri:delete-bin-line" />
                  </ScButton>
                </div>
                <ScButton type="primary" size="small" @click="addThreshold">
                  <IconifyIconOnline icon="ri:add-line" class="mr-1" />
                  添加阈值
                </ScButton>
              </div>
            </ScFormItem>
          </ScForm>
        </ScTabPane>

        <ScTabPane label="高级配置" name="advanced">
          <ScForm :model="configForm" label-width="120px" class="config-form">
            <ScFormItem label="自定义配置">
              <ScInput
                v-model="customConfigStr"
                type="textarea"
                :rows="10"
                placeholder="请输入JSON格式的ECharts配置"
              />
            </ScFormItem>

            <ScFormItem>
              <ScButton type="info" @click="validateConfig"
                >验证配置</el-button
              >
              <ScButton type="warning" @click="resetConfig"
                >重置配置</el-button
              >
            </ScFormItem>
          </ScForm>
        </ScTabPane>
      </ScTabs>

      <!-- 预览区域 -->
      <div class="preview-section">
        <div class="preview-header">
          <span class="preview-title">实时预览</span>
          <ScButton size="small" @click="refreshPreview">
            <IconifyIconOnline icon="ri:refresh-line" />
          </ScButton>
        </div>
        <div v-loading="previewLoading" class="preview-content">
          <div ref="previewChartRef" class="preview-chart" />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ScButton @click="visible = false">取消</ScButton>
        <ScButton type="primary" :loading="saving" @click="handleSave">
          <IconifyIconOnline icon="ri:save-line" class="mr-1" />
          保存配置
        </ScButton>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from "vue";
import { message } from "@repo/utils";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import * as echarts from "echarts";

// 定义事件
const emit = defineEmits<{
  save: [item: any, config: any];
}>();

// 响应式状态
const visible = ref(false);
const activeTab = ref("basic");
const saving = ref(false);
const previewLoading = ref(false);
const currentItem = ref<any>(null);
const previewChartRef = ref<HTMLElement>();
const previewChart = ref<echarts.ECharts>();

// 配置表单
const configForm = reactive({
  title: "",
  legend: {
    show: true,
    position: "top",
  },
  toolbox: {
    show: true,
  },
  dataZoom: {
    show: false,
  },
  color: {
    primary: "#409EFF",
    background: "transparent",
    grid: "#E4E7ED",
  },
  fontSize: 12,
  lineWidth: 2,
  barWidth: 50,
  unit: "",
  decimal: 2,
  max: 100,
  min: 0,
  thresholds: [
    { value: 80, color: "#F56C6C", label: "危险" },
    { value: 60, color: "#E6A23C", label: "警告" },
    { value: 0, color: "#67C23A", label: "正常" },
  ],
});

// 自定义配置字符串
const customConfigStr = ref("");

// 计算属性
const isLineChart = computed(() => currentItem.value?.type === "line");
const isBarChart = computed(() => currentItem.value?.type === "bar");
const isGaugeChart = computed(() => currentItem.value?.type === "gauge");
const isCardChart = computed(() => currentItem.value?.type === "card");

/**
 * 打开对话框
 */
const open = (item: any) => {
  currentItem.value = item;
  visible.value = true;

  // 加载现有配置
  loadExistingConfig(item);

  // 初始化预览
  nextTick(() => {
    initPreview();
  });
};

/**
 * 加载现有配置
 */
const loadExistingConfig = (item: any) => {
  try {
    if (item.chartConfig) {
      const config =
        typeof item.chartConfig === "string"
          ? JSON.parse(item.chartConfig)
          : item.chartConfig;

      // 合并配置到表单
      Object.assign(configForm, {
        ...configForm,
        ...config,
      });

      customConfigStr.value = JSON.stringify(config, null, 2);
    }
  } catch (e) {
    console.warn("解析图表配置失败:", e);
  }
};

/**
 * 初始化预览
 */
const initPreview = () => {
  if (!previewChartRef.value) return;

  previewChart.value = echarts.init(previewChartRef.value);
  refreshPreview();
};

/**
 * 刷新预览
 */
const refreshPreview = () => {
  if (!previewChart.value) return;

  previewLoading.value = true;

  setTimeout(() => {
    const option = generatePreviewOption();
    previewChart.value?.setOption(option);
    previewLoading.value = false;
  }, 500);
};

/**
 * 生成预览配置
 */
const generatePreviewOption = () => {
  const baseOption = {
    title: {
      text: configForm.title || "预览图表",
      textStyle: {
        fontSize: configForm.fontSize,
        color: configForm.color.primary,
      },
    },
    legend: {
      show: configForm.legend.show,
      [configForm.legend.position]: 10,
    },
    toolbox: {
      show: configForm.toolbox.show,
      feature: {
        saveAsImage: {},
        dataZoom: {},
        restore: {},
      },
    },
    backgroundColor: configForm.color.background,
  };

  // 根据图表类型生成不同的配置
  switch (currentItem.value?.type) {
    case "line":
      return {
        ...baseOption,
        xAxis: {
          type: "category",
          data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            data: [120, 200, 150, 80, 70, 110, 130],
            type: "line",
            lineStyle: {
              width: configForm.lineWidth,
              color: configForm.color.primary,
            },
          },
        ],
      };

    case "bar":
      return {
        ...baseOption,
        xAxis: {
          type: "category",
          data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            data: [120, 200, 150, 80, 70, 110, 130],
            type: "bar",
            barWidth: configForm.barWidth,
            itemStyle: {
              color: configForm.color.primary,
            },
          },
        ],
      };

    case "gauge":
      return {
        ...baseOption,
        series: [
          {
            type: "gauge",
            min: configForm.min,
            max: configForm.max,
            data: [{ value: 75, name: "使用率" }],
            axisLine: {
              lineStyle: {
                color: configForm.thresholds.map((t) => [
                  t.value / configForm.max,
                  t.color,
                ]),
              },
            },
          },
        ],
      };

    default:
      return baseOption;
  }
};

/**
 * 添加阈值
 */
const addThreshold = () => {
  configForm.thresholds.push({
    value: 50,
    color: "#409EFF",
    label: "新阈值",
  });
};

/**
 * 删除阈值
 */
const removeThreshold = (index: number) => {
  configForm.thresholds.splice(index, 1);
};

/**
 * 验证配置
 */
const validateConfig = () => {
  try {
    JSON.parse(customConfigStr.value);
    message("配置格式正确", { type: "success" });
  } catch (e) {
    message("配置格式错误：" + e.message, { type: "error" });
  }
};

/**
 * 重置配置
 */
const resetConfig = () => {
  Object.assign(configForm, {
    title: "",
    legend: { show: true, position: "top" },
    toolbox: { show: true },
    dataZoom: { show: false },
    color: { primary: "#409EFF", background: "transparent", grid: "#E4E7ED" },
    fontSize: 12,
    lineWidth: 2,
    barWidth: 50,
    unit: "",
    decimal: 2,
    max: 100,
    min: 0,
    thresholds: [
      { value: 80, color: "#F56C6C", label: "危险" },
      { value: 60, color: "#E6A23C", label: "警告" },
      { value: 0, color: "#67C23A", label: "正常" },
    ],
  });
  customConfigStr.value = "";
};

/**
 * 保存配置
 */
const handleSave = () => {
  try {
    saving.value = true;

    let finalConfig = { ...configForm };

    // 如果有自定义配置，则合并
    if (customConfigStr.value.trim()) {
      const customConfig = JSON.parse(customConfigStr.value);
      finalConfig = { ...finalConfig, ...customConfig };
    }

    emit("save", currentItem.value, finalConfig);
    visible.value = false;
    message("配置保存成功", { type: "success" });
  } catch (e) {
    message("保存失败：" + e.message, { type: "error" });
  } finally {
    saving.value = false;
  }
};

// 监听配置变化，自动刷新预览
watch(
  () => configForm,
  () => {
    if (visible.value) {
      refreshPreview();
    }
  },
  { deep: true },
);

// 暴露方法
defineExpose({
  open,
});
</script>

<style lang="scss" scoped>
.chart-config-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
  }

  :deep(.el-dialog__body) {
    padding: 0;
  }
}

.config-content {
  display: flex;
  height: 600px;

  :deep(.el-tabs) {
    flex: 1;
    display: flex;
    flex-direction: column;

    .el-tabs__header {
      margin: 0;
    }

    .el-tabs__content {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
    }
  }

  .preview-section {
    width: 400px;
    border-left: 1px solid var(--el-border-color-light);
    display: flex;
    flex-direction: column;

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid var(--el-border-color-light);
      background: var(--el-fill-color-light);

      .preview-title {
        font-weight: 500;
      }
    }

    .preview-content {
      flex: 1;
      padding: 16px;

      .preview-chart {
        width: 100%;
        height: 100%;
        min-height: 300px;
      }
    }
  }
}

.config-form {
  .threshold-config {
    .threshold-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.mr-1 {
  margin-right: 4px;
}

// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}
</style>
