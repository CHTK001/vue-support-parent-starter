<template>
  <el-dialog
    v-model="dialogVisible"
    title="配置对比"
    width="90%"
    :before-close="handleClose"
    destroy-on-close
  >
    <div class="history-compare">
      <!-- 选择对比的历史记�?-->
      <div class="compare-selector">
        <el-row :gutter="16">
          <el-col :span="12">
            <div class="selector-section">
              <h4 class="selector-title">选择基准配置</h4>
              <el-select 
                v-model="selectedHistory1" 
                placeholder="请选择基准配置"
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="history in historyOptions"
                  :key="history.monitorSysGenServerSettingHistoryId"
                  :label="formatHistoryLabel(history)"
                  :value="history.monitorSysGenServerSettingHistoryId"
                >
                  <div class="history-option">
                    <div class="option-main">
                      <el-tag 
                        :type="ChangeTypeColors[history.changeType]" 
                        size="small"
                        class="mr-2"
                      >
                        {{ ChangeTypeNames[history.changeType] }}
                      </el-tag>
                      <span>{{ history.changeDescription }}</span>
                    </div>
                    <div class="option-time">
                      {{ formatTime(history.changeTime) }}
                    </div>
                  </div>
                </el-option>
              </el-select>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="selector-section">
              <h4 class="selector-title">选择对比配置</h4>
              <el-select 
                v-model="selectedHistory2" 
                placeholder="请选择对比配置"
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="history in historyOptions"
                  :key="history.monitorSysGenServerSettingHistoryId"
                  :label="formatHistoryLabel(history)"
                  :value="history.monitorSysGenServerSettingHistoryId"
                  :disabled="history.monitorSysGenServerSettingHistoryId === selectedHistory1"
                >
                  <div class="history-option">
                    <div class="option-main">
                      <el-tag 
                        :type="ChangeTypeColors[history.changeType]" 
                        size="small"
                        class="mr-2"
                      >
                        {{ ChangeTypeNames[history.changeType] }}
                      </el-tag>
                      <span>{{ history.changeDescription }}</span>
                    </div>
                    <div class="option-time">
                      {{ formatTime(history.changeTime) }}
                    </div>
                  </div>
                </el-option>
              </el-select>
            </div>
          </el-col>
        </el-row>
        
        <div class="compare-actions">
          <el-button 
            type="primary" 
            :disabled="!canCompare"
            :loading="comparing"
            @click="handleCompare"
          >
            <IconifyIconOnline icon="ri:git-compare-line" class="mr-1" />
            开始对�?
          </el-button>
        </div>
      </div>

      <!-- 对比结果 -->
      <div class="compare-result" v-if="compareResult">
        <div class="result-header">
          <h4 class="result-title">
            <IconifyIconOnline icon="ri:git-compare-line" class="mr-2" />
            对比结果
          </h4>
          <div class="result-summary">
            <el-tag type="info" size="small">
              共发�?{{ differences.length }} 处差�?
            </el-tag>
          </div>
        </div>

        <!-- 差异列表 -->
        <div class="differences-list" v-if="differences.length > 0">
          <el-table :data="differences" stripe>
            <el-table-column prop="field" label="字段路径" width="200">
              <template #default="{ row }">
                <div class="field-path">
                  <IconifyIconOnline icon="ri:node-tree" class="mr-1" />
                  {{ row.field }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="基准�?>
              <template #default="{ row }">
                <div class="value-cell base-value">
                  {{ formatValue(row.baseValue) }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="对比�?>
              <template #default="{ row }">
                <div class="value-cell compare-value">
                  {{ formatValue(row.compareValue) }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="changeType" label="变更类型" width="100">
              <template #default="{ row }">
                <el-tag 
                  :type="getDifferenceTypeColor(row.changeType)" 
                  size="small"
                >
                  {{ getDifferenceTypeName(row.changeType) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 无差异提�?-->
        <div class="no-differences" v-else>
          <el-empty description="两个配置完全相同，没有发现差�? :image-size="80" />
        </div>

        <!-- 并排对比视图 -->
        <div class="side-by-side-view">
          <h4 class="view-title">
            <IconifyIconOnline icon="ri:layout-column-line" class="mr-2" />
            并排对比
          </h4>
          <el-row :gutter="16">
            <el-col :span="12">
              <div class="config-panel">
                <div class="panel-header">
                  <h5>基准配置</h5>
                  <el-tag type="info" size="small">
                    {{ formatTime(baseHistory?.changeTime || '') }}
                  </el-tag>
                </div>
                <div class="config-content">
                  <pre><code>{{ formatConfig(baseConfig) }}</code></pre>
                </div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="config-panel">
                <div class="panel-header">
                  <h5>对比配置</h5>
                  <el-tag type="info" size="small">
                    {{ formatTime(compareHistory?.changeTime || '') }}
                  </el-tag>
                </div>
                <div class="config-content">
                  <pre><code>{{ formatConfig(compareConfig) }}</code></pre>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button 
          v-if="compareResult && baseHistory"
          type="warning" 
          @click="handleRestoreBase"
        >
          <IconifyIconOnline icon="ri:restart-line" class="mr-1" />
          恢复基准配置
        </el-button>
        <el-button 
          v-if="compareResult && compareHistory"
          type="warning" 
          @click="handleRestoreCompare"
        >
          <IconifyIconOnline icon="ri:restart-line" class="mr-1" />
          恢复对比配置
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { message } from "@repo/utils";
import { 
  type ServerSettingHistory,
  compareHistory,
  ChangeTypeNames,
  ChangeTypeColors
} from "@/api/server/settingHistory";

// 定义属�?
interface Props {
  visible: boolean;
  historyList: ServerSettingHistory[];
  selectedHistory?: ServerSettingHistory | null;
}

const props = defineProps<Props>();

// 定义事件
const emit = defineEmits<{
  "update:visible": [visible: boolean];
  compare: [historyId1: number, historyId2: number];
  restore: [historyId: number];
}>();

// 响应式状�?
const dialogVisible = ref(false);
const comparing = ref(false);
const selectedHistory1 = ref<number | null>(null);
const selectedHistory2 = ref<number | null>(null);
const compareResult = ref<any>(null);

// 计算属�?
const historyOptions = computed(() => {
  return props.historyList.filter(h => h.settingSnapshot);
});

const canCompare = computed(() => {
  return selectedHistory1.value && selectedHistory2.value && 
         selectedHistory1.value !== selectedHistory2.value;
});

const baseHistory = computed(() => {
  return historyOptions.value.find(h => h.monitorSysGenServerSettingHistoryId === selectedHistory1.value);
});

const compareHistory = computed(() => {
  return historyOptions.value.find(h => h.monitorSysGenServerSettingHistoryId === selectedHistory2.value);
});

const baseConfig = computed(() => {
  if (!baseHistory.value?.settingSnapshot) return null;
  try {
    return JSON.parse(baseHistory.value.settingSnapshot);
  } catch (error) {
    return null;
  }
});

const compareConfig = computed(() => {
  if (!compareHistory.value?.settingSnapshot) return null;
  try {
    return JSON.parse(compareHistory.value.settingSnapshot);
  } catch (error) {
    return null;
  }
});

const differences = computed(() => {
  if (!compareResult.value?.differences) return [];
  return compareResult.value.differences;
});

/**
 * 格式化历史记录标�?
 */
const formatHistoryLabel = (history: ServerSettingHistory) => {
  return `${history.changeDescription} - ${formatTime(history.changeTime)}`;
};

/**
 * 格式化时�?
 */
const formatTime = (time: string) => {
  return new Date(time).toLocaleString();
};

/**
 * 格式化�?
 */
const formatValue = (value: any) => {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "boolean") return value.toString();
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

/**
 * 格式化配�?
 */
const formatConfig = (config: any) => {
  if (!config) return "";
  return JSON.stringify(config, null, 2);
};

/**
 * 获取差异类型颜色
 */
const getDifferenceTypeColor = (type: string) => {
  switch (type) {
    case "added": return "success";
    case "removed": return "danger";
    case "modified": return "warning";
    default: return "info";
  }
};

/**
 * 获取差异类型名称
 */
const getDifferenceTypeName = (type: string) => {
  switch (type) {
    case "added": return "新增";
    case "removed": return "删除";
    case "modified": return "修改";
    default: return "未知";
  }
};

/**
 * 处理对比
 */
const handleCompare = async () => {
  if (!canCompare.value) return;
  
  try {
    comparing.value = true;
    const result = await compareHistory(selectedHistory1.value!, selectedHistory2.value!);
    
    if (result.success) {
      compareResult.value = result.data;
      message.success("对比完成");
    } else {
      message.error(result.message || "对比失败");
    }
  } catch (error) {
    console.error("对比失败:", error);
    message.error("对比失败");
  } finally {
    comparing.value = false;
  }
};

/**
 * 处理恢复基准配置
 */
const handleRestoreBase = () => {
  if (baseHistory.value) {
    emit("restore", baseHistory.value.monitorSysGenServerSettingHistoryId);
  }
};

/**
 * 处理恢复对比配置
 */
const handleRestoreCompare = () => {
  if (compareHistory.value) {
    emit("restore", compareHistory.value.monitorSysGenServerSettingHistoryId);
  }
};

/**
 * 处理关闭
 */
const handleClose = () => {
  emit("update:visible", false);
  // 重置状�?
  selectedHistory1.value = null;
  selectedHistory2.value = null;
  compareResult.value = null;
};

// 监听visible变化
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal;
  if (newVal && props.selectedHistory) {
    selectedHistory1.value = props.selectedHistory.monitorSysGenServerSettingHistoryId;
  }
});

// 监听dialogVisible变化
watch(dialogVisible, (newVal) => {
  if (!newVal) {
    emit("update:visible", false);
  }
});
</script>

<style lang="scss" scoped>
.history-compare {
  .compare-selector {
    margin-bottom: 24px;
    padding: 20px;
    background: var(--el-bg-color-overlay);
    border-radius: 8px;

    .selector-section {
      .selector-title {
        margin-bottom: 12px;
        font-size: 14px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
    }

    .history-option {
      .option-main {
        display: flex;
        align-items: center;
        margin-bottom: 4px;
      }

      .option-time {
        font-size: 12px;
         color: var(--el-text-color-primary);
      }
    }

    .compare-actions {
      margin-top: 16px;
      text-align: center;
    }
  }

  .compare-result {
    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .result-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        display: flex;
        align-items: center;
      }
    }

    .differences-list {
      margin-bottom: 24px;

      .field-path {
        display: flex;
        align-items: center;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        color: #606266;
      }

      .value-cell {
        font-family: 'Courier New', monospace;
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 4px;
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        &.base-value {
          background: #f0f9ff;
          color: #409eff;
        }

        &.compare-value {
          background: #fef0f0;
          color: #f56c6c;
        }
      }
    }

    .no-differences {
      text-align: center;
      padding: 40px 0;
    }

    .side-by-side-view {
      .view-title {
        margin-bottom: 16px;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        display: flex;
        align-items: center;
      }

      .config-panel {
        border: 1px solid var(--el-border-color);
        border-radius: 4px;
        overflow: hidden;

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: var(--el-bg-color-overlay);
          border-bottom: 1px solid #dcdfe6;

          h5 {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
            color: var(--el-text-color-primary);
          }
        }

        .config-content {
          max-height: 400px;
          overflow-y: auto;
          padding: 12px;
          background: #fafafa;

          pre {
            margin: 0;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.5;
            color: var(--el-text-color-primary);
          }
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
