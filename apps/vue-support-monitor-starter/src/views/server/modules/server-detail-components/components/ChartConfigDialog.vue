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
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="基础配置" name="basic">
          <el-form :model="configForm" label-width="120px" class="config-form">
            <el-form-item label="图表标题">
              <el-input v-model="configForm.title" placeholder="请输入图表标题" />
            </el-form-item>
            
            <el-form-item label="显示图例">
              <el-switch v-model="configForm.legend.show" />
            </el-form-item>
            
            <el-form-item label="图例位置" v-if="configForm.legend.show">
              <el-select v-model="configForm.legend.position" style="width: 100%">
                <el-option label="顶部" value="top" />
                <el-option label="底部" value="bottom" />
                <el-option label="左侧" value="left" />
                <el-option label="右侧" value="right" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="显示工具栏">
              <el-switch v-model="configForm.toolbox.show" />
            </el-form-item>
            
            <el-form-item label="显示数据缩放">
              <el-switch v-model="configForm.dataZoom.show" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="样式配置" name="style">
          <el-form :model="configForm" label-width="120px" class="config-form">
            <el-form-item label="主题色">
              <el-color-picker v-model="configForm.color.primary" />
            </el-form-item>
            
            <el-form-item label="背景色">
              <el-color-picker v-model="configForm.color.background" />
            </el-form-item>
            
            <el-form-item label="网格线颜色">
              <el-color-picker v-model="configForm.color.grid" />
            </el-form-item>
            
            <el-form-item label="字体大小">
              <el-input-number v-model="configForm.fontSize" :min="10" :max="24" style="width: 100%" />
            </el-form-item>
            
            <el-form-item label="线条宽度" v-if="isLineChart">
              <el-input-number v-model="configForm.lineWidth" :min="1" :max="10" style="width: 100%" />
            </el-form-item>
            
            <el-form-item label="柱状图宽度" v-if="isBarChart">
              <el-input-number v-model="configForm.barWidth" :min="10" :max="100" style="width: 100%" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="数据配置" name="data">
          <el-form :model="configForm" label-width="120px" class="config-form">
            <el-form-item label="数据单位">
              <el-input v-model="configForm.unit" placeholder="如：%、MB、个等" />
            </el-form-item>
            
            <el-form-item label="小数位数">
              <el-input-number v-model="configForm.decimal" :min="0" :max="6" style="width: 100%" />
            </el-form-item>
            
            <el-form-item label="最大值" v-if="isGaugeChart">
              <el-input-number v-model="configForm.max" :min="1" style="width: 100%" />
            </el-form-item>
            
            <el-form-item label="最小值" v-if="isGaugeChart">
              <el-input-number v-model="configForm.min" :min="0" style="width: 100%" />
            </el-form-item>
            
            <el-form-item label="阈值配置" v-if="isGaugeChart || isCardChart">
              <div class="threshold-config">
                <div v-for="(threshold, index) in configForm.thresholds" :key="index" class="threshold-item">
                  <el-input-number v-model="threshold.value" placeholder="阈值" style="width: 120px" />
                  <el-color-picker v-model="threshold.color" />
                  <el-input v-model="threshold.label" placeholder="标签" style="width: 100px" />
                  <el-button type="danger" size="small" @click="removeThreshold(index)">
                    <IconifyIconOnline icon="ri:delete-bin-line" />
                  </el-button>
                </div>
                <el-button type="primary" size="small" @click="addThreshold">
                  <IconifyIconOnline icon="ri:add-line" class="mr-1" />
                  添加阈值
                </el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="高级配置" name="advanced">
          <el-form :model="configForm" label-width="120px" class="config-form">
            <el-form-item label="自定义配置">
              <el-input
                v-model="customConfigStr"
                type="textarea"
                :rows="10"
                placeholder="请输入JSON格式的ECharts配置"
              />
            </el-form-item>
            
            <el-form-item>
              <el-button type="info" @click="validateConfig">验证配置</el-button>
              <el-button type="warning" @click="resetConfig">重置配置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      
      <!-- 预览区域 -->
      <div class="preview-section">
        <div class="preview-header">
          <span class="preview-title">实时预览</span>
          <el-button size="small" @click="refreshPreview">
            <IconifyIconOnline icon="ri:refresh-line" />
          </el-button>
        </div>
        <div class="preview-content" v-loading="previewLoading">
          <div class="preview-chart" ref="previewChartRef"></div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          <IconifyIconOnline icon="ri:save-line" class="mr-1" />
          保存配置
        </el-button>
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
    position: "top"
  },
  toolbox: {
    show: true
  },
  dataZoom: {
    show: false
  },
  color: {
    primary: "#409EFF",
    background: "transparent",
    grid: "#E4E7ED"
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
    { value: 0, color: "#67C23A", label: "正常" }
  ]
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
      const config = typeof item.chartConfig === 'string' 
        ? JSON.parse(item.chartConfig) 
        : item.chartConfig;
      
      // 合并配置到表单
      Object.assign(configForm, {
        ...configForm,
        ...config
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
        color: configForm.color.primary
      }
    },
    legend: {
      show: configForm.legend.show,
      [configForm.legend.position]: 10
    },
    toolbox: {
      show: configForm.toolbox.show,
      feature: {
        saveAsImage: {},
        dataZoom: {},
        restore: {}
      }
    },
    backgroundColor: configForm.color.background
  };

  // 根据图表类型生成不同的配置
  switch (currentItem.value?.type) {
    case "line":
      return {
        ...baseOption,
        xAxis: {
          type: 'category',
          data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        },
        yAxis: {
          type: 'value'
        },
        series: [{
          data: [120, 200, 150, 80, 70, 110, 130],
          type: 'line',
          lineStyle: {
            width: configForm.lineWidth,
            color: configForm.color.primary
          }
        }]
      };
      
    case "bar":
      return {
        ...baseOption,
        xAxis: {
          type: 'category',
          data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        },
        yAxis: {
          type: 'value'
        },
        series: [{
          data: [120, 200, 150, 80, 70, 110, 130],
          type: 'bar',
          barWidth: configForm.barWidth,
          itemStyle: {
            color: configForm.color.primary
          }
        }]
      };
      
    case "gauge":
      return {
        ...baseOption,
        series: [{
          type: 'gauge',
          min: configForm.min,
          max: configForm.max,
          data: [{ value: 75, name: '使用率' }],
          axisLine: {
            lineStyle: {
              color: configForm.thresholds.map(t => [t.value / configForm.max, t.color])
            }
          }
        }]
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
    label: "新阈值"
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
      { value: 0, color: "#67C23A", label: "正常" }
    ]
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
watch(() => configForm, () => {
  if (visible.value) {
    refreshPreview();
  }
}, { deep: true });

// 暴露方法
defineExpose({
  open
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
</style>
