<template>
  <el-dialog
    v-model="dialogVisible"
    title="配置变更详情"
    width="80%"
    :before-close="handleClose"
    destroy-on-close
  >
    <div class="history-detail" v-if="historyData">
      <!-- 基本信息 -->
      <div class="detail-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:information-line" class="mr-2" />
          基本信息
        </h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="变更时间">
            <div class="time-info">
              <IconifyIconOnline icon="ri:time-line" class="mr-1" />
              {{ formatTime(historyData.changeTime) }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="变更类型">
            <el-tag 
              :type="ChangeTypeColors[historyData.changeType]" 
              size="small"
            >
              {{ ChangeTypeNames[historyData.changeType] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="变更用户">
            <div class="user-info">
              <IconifyIconOnline icon="ri:user-line" class="mr-1" />
              {{ historyData.changeUser || '系统' }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="变更描述">
            {{ historyData.changeDescription }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 配置快照 -->
      <div class="detail-section" v-if="configSnapshot">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:camera-line" class="mr-2" />
          配置快照
          <el-button 
            type="primary" 
            text 
            size="small" 
            class="ml-2"
            @click="handleCopySnapshot"
          >
            <IconifyIconOnline icon="ri:file-copy-line" class="mr-1" />
            复制
          </el-button>
        </h4>
        <div class="config-snapshot">
          <el-tabs v-model="activeTab" type="card">
            <el-tab-pane label="格式化视�? name="formatted">
              <div class="formatted-config">
                <el-tree
                  :data="formattedConfig"
                  :props="treeProps"
                  default-expand-all
                  node-key="key"
                >
                  <template #default="{ node, data }">
                    <div class="tree-node">
                      <span class="node-label">{{ data.label }}</span>
                      <span v-if="data.value !== undefined" class="node-value">
                        {{ formatValue(data.value) }}
                      </span>
                    </div>
                  </template>
                </el-tree>
              </div>
            </el-tab-pane>
            <el-tab-pane label="JSON视图" name="json">
              <div class="json-config">
                <pre><code>{{ formattedJson }}</code></pre>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <!-- 变更字段 -->
      <div class="detail-section" v-if="changedFields && changedFields.length > 0">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:git-compare-line" class="mr-2" />
          变更字段
        </h4>
        <div class="changed-fields">
          <el-table :data="changedFields" stripe>
            <el-table-column prop="field" label="字段�? width="200" />
            <el-table-column prop="oldValue" label="原�?>
              <template #default="{ row }">
                <div class="value-cell old-value">
                  {{ formatValue(row.oldValue) }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="newValue" label="新�?>
              <template #default="{ row }">
                <div class="value-cell new-value">
                  {{ formatValue(row.newValue) }}
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button 
          v-if="historyData?.settingSnapshot"
          type="warning" 
          @click="handleRestore"
        >
          <IconifyIconOnline icon="ri:restart-line" class="mr-1" />
          恢复此配�?
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
  getHistoryDetail,
  ChangeTypeNames,
  ChangeTypeColors
} from "@/api/server/settingHistory";

// 定义属�?
interface Props {
  visible: boolean;
  historyData: ServerSettingHistory | null;
}

const props = defineProps<Props>();

// 定义事件
const emit = defineEmits<{
  "update:visible": [visible: boolean];
  restore: [historyId: number];
}>();

// 响应式状�?
const dialogVisible = ref(false);
const loading = ref(false);
const activeTab = ref("formatted");
const detailData = ref<any>(null);

// 树形组件属�?
const treeProps = {
  children: "children",
  label: "label"
};

// 计算属�?
const configSnapshot = computed(() => {
  if (!props.historyData?.settingSnapshot) return null;
  try {
    return JSON.parse(props.historyData.settingSnapshot);
  } catch (error) {
    console.error("解析配置快照失败:", error);
    return null;
  }
});

const formattedJson = computed(() => {
  if (!configSnapshot.value) return "";
  return JSON.stringify(configSnapshot.value, null, 2);
});

const formattedConfig = computed(() => {
  if (!configSnapshot.value) return [];
  return convertToTreeData(configSnapshot.value);
});

const changedFields = computed(() => {
  if (!props.historyData?.changedFields) return [];
  try {
    const fields = JSON.parse(props.historyData.changedFields);
    return Array.isArray(fields) ? fields : [];
  } catch (error) {
    console.error("解析变更字段失败:", error);
    return [];
  }
});

/**
 * 转换为树形数�?
 */
const convertToTreeData = (obj: any, parentKey = ""): any[] => {
  const result: any[] = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;
    const node: any = {
      key: fullKey,
      label: key
    };
    
    if (value && typeof value === "object" && !Array.isArray(value)) {
      node.children = convertToTreeData(value, fullKey);
    } else {
      node.value = value;
    }
    
    result.push(node);
  }
  
  return result;
};

/**
 * 格式化�?
 */
const formatValue = (value: any) => {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "boolean") return value.toString();
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

/**
 * 格式化时�?
 */
const formatTime = (time: string) => {
  return new Date(time).toLocaleString();
};

/**
 * 处理关闭
 */
const handleClose = () => {
  emit("update:visible", false);
};

/**
 * 处理恢复
 */
const handleRestore = () => {
  if (props.historyData) {
    emit("restore", props.historyData.monitorSysGenServerSettingHistoryId);
    handleClose();
  }
};

/**
 * 处理复制快照
 */
const handleCopySnapshot = async () => {
  try {
    await navigator.clipboard.writeText(formattedJson.value);
    message.success("配置快照已复制到剪贴�?);
  } catch (error) {
    console.error("复制失败:", error);
    message.error("复制失败");
  }
};

/**
 * 加载详情数据
 */
const loadDetailData = async () => {
  if (!props.historyData) return;
  
  try {
    loading.value = true;
    const result = await getHistoryDetail(props.historyData.monitorSysGenServerSettingHistoryId);
    if (result.success) {
      detailData.value = result.data;
    }
  } catch (error) {
    console.error("加载详情失败:", error);
  } finally {
    loading.value = false;
  }
};

// 监听visible变化
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal;
  if (newVal && props.historyData) {
    loadDetailData();
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
.history-detail {
  .detail-section {
    margin-bottom: 24px;

    .section-title {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .time-info,
  .user-info {
    display: flex;
    align-items: center;
    color: #606266;
  }

  .config-snapshot {
    .formatted-config {
      max-height: 400px;
      overflow-y: auto;
      border: 1px solid var(--el-border-color);
      border-radius: 4px;
      padding: 12px;

      .tree-node {
        display: flex;
        align-items: center;
        width: 100%;

        .node-label {
          font-weight: 500;
          color: var(--el-text-color-primary);
          margin-right: 8px;
        }

        .node-value {
          color: #606266;
          font-family: 'Courier New', monospace;
          font-size: 12px;
        }
      }
    }

    .json-config {
      max-height: 400px;
      overflow-y: auto;
      border: 1px solid var(--el-border-color);
      border-radius: 4px;
      padding: 12px;
      background: var(--el-bg-color-overlay);

      pre {
        margin: 0;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.5;
        color: var(--el-text-color-primary);
      }
    }
  }

  .changed-fields {
    .value-cell {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 4px;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      &.old-value {
        background: #fef0f0;
        color: #f56c6c;
      }

      &.new-value {
        background: #f0f9ff;
        color: #409eff;
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
