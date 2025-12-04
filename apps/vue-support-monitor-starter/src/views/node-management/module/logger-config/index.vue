<template>
  <el-dialog
    v-model="visible"
    title="节点日志配置"
    width="80%"
    :before-close="handleClose"
    append-to-body
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-info">
          <IconifyIconOnline icon="ri:settings-4-line" class="header-icon" />
          <div class="header-text">
            <h3>节点日志配置</h3>
            <p v-if="nodeInfo">
              {{ nodeInfo.nodeName || nodeInfo.applicationName }}
              ({{ nodeInfo.ipAddress }}:{{ nodeInfo.port }})
            </p>
          </div>
        </div>
      </div>
    </template>

    <div class="logger-config-content">
      <!-- 搜索�?-->
      <div
        class="search-bar"
        style="
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        "
      >
        <el-input
          v-model="searchText"
          placeholder="搜索日志器名�?.."
          clearable
          style="width: 300px"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
        <el-button type="primary" @click="handleRefresh" :loading="loading">
          <IconifyIconOnline icon="ri:refresh-line" />
          刷新配置
        </el-button>
        <div
          class="search-info"
          style=" color: var(--el-text-color-primary); font-size: 14px"
          v-if="searchText"
        >
          找到 {{ filteredLoggers.length }} 个日志器
        </div>
      </div>

      <!-- 日志配置表格 -->
      <ScTable
        ref="tableRef"
        :data="filteredLoggers"
        table-name="node-logger-config"
        :page-size="10"
        border
        stripe
        height="500"
        :loading="loading"
        @refresh="handleRefresh"
      >
        <el-table-column label="日志器名�? min-width="300">
          <template #default="{ row }">
            <div class="logger-name">
              <IconifyIconOnline
                :icon="
                  row.loggerName === 'ROOT' ? 'ri:home-line' : 'ri:folder-line'
                "
                class="logger-icon"
              />
              <span :title="row.loggerName">{{ row.loggerName }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="配置等级" width="120" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="row.configuredLevel"
              :type="getLevelTagType(row.configuredLevel)"
              size="small"
            >
              {{ row.configuredLevel }}
            </el-tag>
            <span v-else class="text-[var(--el-text-color-placeholder)]">未配�?/span>
          </template>
        </el-table-column>

        <el-table-column label="有效等级" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getLevelTagType(row.effectiveLevel)" size="small">
              {{ row.effectiveLevel }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="继承�? width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.additive ? 'success' : 'info'" size="small">
              {{ row.additive ? "�? : "�? }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="新等�? width="150" align="center">
          <template #default="{ row }">
            <el-select
              v-model="row.newLevel"
              placeholder="选择等级"
              size="small"
              style="width: 100px"
            >
              <el-option
                v-for="level in logLevels"
                :key="level"
                :label="level"
                :value="level"
              />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :loading="row.updating"
              :disabled="!row.newLevel || row.newLevel === row.configuredLevel"
              @click="updateLoggerLevel(row)"
            >
              设置
            </el-button>
          </template>
        </el-table-column>
      </ScTable>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  getNodeLoggers,
  setLoggerLevel,
  refreshNodeLoggers,
} from "@/api/server/node-logger-config";

// 日志等级枚举
export type LogLevel = "ERROR" | "WARN" | "INFO" | "DEBUG" | "TRACE";

// 节点日志器配置接�?
export interface NodeLoggerConfig {
  pluginNodeLoggerConfigId?: number;
  pluginNodeLoggerConfigNodeName: string;
  pluginNodeLoggerConfigNodeUrl: string;
  pluginNodeLoggerConfigApplicationName: string;
  pluginNodeLoggerConfigLoggerName: string;
  pluginNodeLoggerConfigCurrentLevel?: LogLevel;
  pluginNodeLoggerConfigConfiguredLevel?: LogLevel;
  pluginNodeLoggerConfigEffectiveLevel?: LogLevel;
  pluginNodeLoggerConfigEnabled?: boolean;
  pluginNodeLoggerConfigLastUpdated?: string;
  pluginNodeLoggerConfigCreatedTime?: string;
  pluginNodeLoggerConfigUpdatedTime?: string;
  // 前端扩展字段
  newLevel?: string;
  updating?: boolean;
}

// API响应接口
export interface LoggerConfigResponse {
  success: boolean;
  message?: string;
  nodeUrl?: string;
  loggers?: NodeLoggerConfig[];
  count?: number;
}

/**
 * 编码节点URL
 */
const encodeNodeUrl = (ip: string, port: number): string => {
  return btoa(`${ip}:${port}`);
};

/**
 * 获取日志等级标签类型
 */
const getLevelTagType = (
  level?: string
): "success" | "warning" | "info" | "primary" | "danger" | undefined => {
  switch (level) {
    case "ERROR":
      return "danger";
    case "WARN":
      return "warning";
    case "INFO":
      return "primary";
    case "DEBUG":
      return "success";
    case "TRACE":
      return "info";
    default:
      return undefined;
  }
};

// 定义组件属�?
interface Props {
  modelValue: boolean;
  nodeInfo?: {
    nodeName?: string;
    applicationName: string;
    ipAddress: string;
    port: number;
  } | null;
}

// 定义事件
interface Emits {
  (e: "update:modelValue", value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 响应式数�?
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

// 表格引用
const tableRef = ref();
const loggers = ref<NodeLoggerConfig[]>([]);
const loading = ref(false);
const searchText = ref("");

// 日志等级选项
const logLevels: LogLevel[] = ["ERROR", "WARN", "INFO", "DEBUG", "TRACE"];

// 过滤后的日志器列�?
const filteredLoggers = computed(() => {
  if (!searchText.value) return loggers.value;
  return loggers.value.filter((logger: any) =>
    logger.loggerName?.toLowerCase().includes(searchText.value.toLowerCase())
  );
});

// 监听节点信息变化
watch(
  () => props.nodeInfo,
  (newNodeInfo) => {
    if (newNodeInfo && visible.value) {
      loadLoggers();
    }
  },
  { immediate: true }
);

// 监听弹框显示状�?
watch(visible, (newVisible) => {
  if (newVisible && props.nodeInfo) {
    loadLoggers();
  } else if (!newVisible) {
    // 关闭时清理数�?
    loggers.value = [];
    searchText.value = "";
  }
});

// 加载日志器配置数�?
const loadLoggers = async () => {
  if (!props.nodeInfo) return;

  loading.value = true;
  try {
    const encodedNodeUrl = encodeNodeUrl(
      props.nodeInfo.ipAddress,
      props.nodeInfo.port
    );
    const response = await getNodeLoggers(encodedNodeUrl);

    if (response.success && (response as any).data) {
      // 后端返回的数据在 response.data 中，直接使用后端字段�?
      loggers.value = ((response as any).data || []).map((logger: any) => ({
        ...logger,
        // 添加前端扩展字段
        newLevel: logger.configuredLevel || "",
        updating: false,
      }));
    } else {
      ElMessage.error(
        "获取日志配置失败: " + ((response as any).msg || "未知错误")
      );
      loggers.value = [];
    }
  } catch (error) {
    console.error("Load loggers error:", error);
    ElMessage.error("网络错误，请稍后重试");
    loggers.value = [];
  } finally {
    loading.value = false;
  }
};

// 刷新表格数据
const handleRefresh = async () => {
  if (!props.nodeInfo) return;

  loading.value = true;
  try {
    const encodedNodeUrl = encodeNodeUrl(
      props.nodeInfo.ipAddress,
      props.nodeInfo.port
    );
    const response = await refreshNodeLoggers(encodedNodeUrl);

    if (response.success) {
      await loadLoggers();
      ElMessage.success("日志配置刷新成功");
    } else {
      ElMessage.error(
        "刷新日志配置失败: " + ((response as any).msg || "未知错误")
      );
    }
  } catch (error) {
    console.error("Refresh loggers error:", error);
    ElMessage.error("网络错误，请稍后重试");
  } finally {
    loading.value = false;
  }
};

const updateLoggerLevel = async (logger: any) => {
  if (!props.nodeInfo) return;

  logger.updating = true;
  try {
    const encodedNodeUrl = encodeNodeUrl(
      props.nodeInfo.ipAddress,
      props.nodeInfo.port
    );
    const response = await setLoggerLevel(
      encodedNodeUrl,
      logger.loggerName,
      logger.newLevel || ""
    );

    if (response.success) {
      logger.configuredLevel = logger.newLevel;
      ElMessage.success("日志等级设置成功");
      // 重新加载数据以获取最新状�?
      await loadLoggers();
    } else {
      ElMessage.error(
        "设置日志等级失败: " + ((response as any).msg || "未知错误")
      );
    }
  } catch (error) {
    console.error("Update logger level error:", error);
    ElMessage.error("网络错误，请稍后重试");
  } finally {
    logger.updating = false;
  }
};

const handleClose = () => {
  visible.value = false;
};
</script>

<style scoped>
.dialog-header {
  .header-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .header-icon {
      font-size: 24px;
      color: #409eff;
    }

    .header-text {
      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      p {
        margin: 4px 0 0 0;
        font-size: 14px;
         color: var(--el-text-color-primary);
      }
    }
  }
}

.logger-config-content {
  .search-section {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
  }

  .logger-name {
    display: flex;
    align-items: center;
    gap: 8px;

    .logger-icon {
      color: #409eff;
      font-size: 16px;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
