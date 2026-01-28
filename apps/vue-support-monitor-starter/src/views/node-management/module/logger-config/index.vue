<template>
  <sc-dialog
    v-model="visible"
    title="节点日志配置"
    width="900px"
    :before-close="handleClose"
    append-to-body
    class="logger-config-dialog"
    destroy-on-close
    top="5vh"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-info">
          <div class="header-icon-wrapper">
            <IconifyIconOnline icon="ri:file-list-3-line" class="header-icon" />
          </div>
          <div class="header-text">
            <h3>日志配置</h3>
            <p v-if="nodeInfo">
              <span class="node-name">{{ nodeInfo.nodeName || nodeInfo.applicationName }}</span>
              <span class="node-address">{{ nodeInfo.ipAddress }}:{{ nodeInfo.port }}</span>
            </p>
          </div>
        </div>
        <div class="header-stats" v-if="loggers.length > 0">
          <div class="stat-item">
            <span class="stat-value">{{ loggers.length }}</span>
            <span class="stat-label">日志器</span>
          </div>
        </div>
      </div>
    </template>

    <div class="logger-config-content">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="searchText"
            placeholder="搜索日志器..."
            clearable
            class="search-input"
          >
            <template #prefix>
              <IconifyIconOnline icon="ri:search-line" />
            </template>
          </el-input>
          <span class="search-result" v-if="searchText">
            找到 <strong>{{ filteredLoggers.length }}</strong> 个
          </span>
        </div>
        <div class="toolbar-right">
          <el-tooltip content="刷新配置" placement="top">
            <el-button
              type="primary"
              :icon="loading ? '' : undefined"
              @click="handleRefresh"
              :loading="loading"
            >
              <IconifyIconOnline v-if="!loading" icon="ri:refresh-line" />
              刷新
            </el-button>
          </el-tooltip>
        </div>
      </div>

      <!-- 日志配置表格 -->
      <div class="table-wrapper">
        <ScTable
          ref="tableRef"
          :data="filteredLoggers"
          table-name="node-logger-config"
          :page-size="50"
          border
          max-height="calc(90vh - 220px)"
          :loading="loading"
          @refresh="handleRefresh"
        >
          <el-table-column label="日志器名称" min-width="280">
            <template #default="{ row }">
              <div class="logger-name-cell">
                <div class="logger-icon-wrapper" :class="{ 'is-root': row.loggerName === 'ROOT' }">
                  <IconifyIconOnline
                    :icon="row.loggerName === 'ROOT' ? 'ri:home-5-line' : 'ri:code-s-slash-line'"
                  />
                </div>
                <span class="logger-name-text" :title="row.loggerName">
                  {{ row.loggerName }}
                </span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="配置等级" width="110" align="center">
            <template #default="{ row }">
              <el-tag
                v-if="row.configuredLevel"
                :type="getLevelTagType(row.configuredLevel)"
                size="small"
                effect="light"
                round
              >
                {{ row.configuredLevel }}
              </el-tag>
              <span v-else class="no-config">-</span>
            </template>
          </el-table-column>

          <el-table-column label="有效等级" width="110" align="center">
            <template #default="{ row }">
              <el-tag
                :type="getLevelTagType(row.effectiveLevel)"
                size="small"
                effect="dark"
                round
              >
                {{ row.effectiveLevel }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="继承" width="70" align="center">
            <template #default="{ row }">
              <IconifyIconOnline
                :icon="row.additive ? 'ri:checkbox-circle-fill' : 'ri:close-circle-line'"
                :class="['inherit-icon', row.additive ? 'is-active' : 'is-inactive']"
              />
            </template>
          </el-table-column>

          <el-table-column label="设置等级" width="130" align="center">
            <template #default="{ row }">
              <el-select
                v-model="row.newLevel"
                placeholder="选择"
                size="small"
                class="level-select"
              >
                <el-option
                  v-for="level in logLevels"
                  :key="level"
                  :label="level"
                  :value="level"
                >
                  <div class="level-option">
                    <el-tag :type="getLevelTagType(level)" size="small" effect="light">
                      {{ level }}
                    </el-tag>
                  </div>
                </el-option>
              </el-select>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="90" align="center" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                :loading="row.updating"
                :disabled="!row.newLevel || row.newLevel === row.configuredLevel"
                @click="updateLoggerLevel(row)"
                plain
              >
                应用
              </el-button>
            </template>
          </el-table-column>
        </ScTable>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { message } from "@repo/utils";
import {
  getNodeLoggers,
  setLoggerLevel,
  refreshNodeLoggers,
} from "@/api/server/node-logger-config";
import { setNodeLogLevel } from "@/api/monitor/actuator";

// 日志等级枚举
export type LogLevel = "ERROR" | "WARN" | "INFO" | "DEBUG" | "TRACE";

// 节点日志器配置接口
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

// 定义组件属性
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

// 响应式数据
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

// 过滤后的日志器列表
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

// 监听弹框显示状态
watch(visible, (newVisible) => {
  if (newVisible && props.nodeInfo) {
    loadLoggers();
  } else if (!newVisible) {
    // 关闭时清理数据
    loggers.value = [];
    searchText.value = "";
  }
});

// 加载日志器配置数据
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
      // 后端返回的数据在 response.data 中，直接使用后端字段名
      loggers.value = ((response as any).data || []).map((logger: any) => ({
        ...logger,
        // 添加前端扩展字段
        newLevel: logger.configuredLevel || "",
        updating: false,
      }));
    } else {
      message.error(
        "获取日志配置失败: " + ((response as any).msg || "未知错误")
      );
      loggers.value = [];
    }
  } catch (error) {
    console.error("Load loggers error:", error);
    message.error("网络错误，请稍后重试");
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
      message.success("日志配置刷新成功");
    } else {
      message.error(
        "刷新日志配置失败: " + ((response as any).msg || "未知错误")
      );
    }
  } catch (error) {
    console.error("Refresh loggers error:", error);
    message.error("网络错误，请稍后重试");
  } finally {
    loading.value = false;
  }
};

/**
 * 更新日志器等级
 * 优先通过 SyncServer 下发命令，失败时回退到 HTTP 方式
 *
 * @param logger 日志器配置
 */
const updateLoggerLevel = async (logger: any) => {
  if (!props.nodeInfo) return;

  logger.updating = true;
  try {
    // 优先使用 SyncServer 方式下发日志等级设置命令
    const syncResponse = await setNodeLogLevel({
      ipAddress: props.nodeInfo.ipAddress,
      port: props.nodeInfo.port,
      loggerName: logger.loggerName,
      logLevel: logger.newLevel || "",
    });

    if (syncResponse.code === "00000") {
      logger.configuredLevel = logger.newLevel;
      message.success("日志等级设置命令已下发");
      // 延迟重新加载数据以获取最新状态
      setTimeout(() => loadLoggers(), 1000);
      return;
    }

    // SyncServer 失败时回退到 HTTP 方式
    console.warn("SyncServer 方式失败，回退到 HTTP 方式:", syncResponse.msg);
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
      message.success("日志等级设置成功");
      await loadLoggers();
    } else {
      message.error(
        "设置日志等级失败: " + ((response as any).msg || "未知错误")
      );
    }
  } catch (error) {
    console.error("Update logger level error:", error);
    message.error("网络错误，请稍后重试");
  } finally {
    logger.updating = false;
  }
};

const handleClose = () => {
  visible.value = false;
};
</script>

<style scoped lang="scss">
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .header-icon-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: var(--el-color-primary-light-9);
      border-radius: 10px;

      .header-icon {
        font-size: 20px;
        color: var(--el-color-primary);
      }
    }

    .header-text {
      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      p {
        margin: 4px 0 0 0;
        font-size: 13px;
        color: var(--el-text-color-secondary);
        display: flex;
        align-items: center;
        gap: 8px;

        .node-name {
          font-weight: 500;
        }

        .node-address {
          font-family: "JetBrains Mono", "Consolas", monospace;
          font-size: 12px;
          padding: 2px 6px;
          background: var(--el-fill-color-light);
          border-radius: 4px;
        }
      }
    }
  }

  .header-stats {
    display: flex;
    gap: 16px;

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px 16px;
      background: var(--el-fill-color-lighter);
      border-radius: 8px;

      .stat-value {
        font-size: 18px;
        font-weight: 700;
        color: var(--el-color-primary);
      }

      .stat-label {
        font-size: 11px;
        color: var(--el-text-color-secondary);
        margin-top: 2px;
      }
    }
  }
}

.logger-config-content {
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .search-input {
        width: 240px;

        :deep(.el-input__wrapper) {
          border-radius: 6px;
          background: var(--el-bg-color);
        }
      }

      .search-result {
        font-size: 13px;
        color: var(--el-text-color-secondary);

        strong {
          color: var(--el-color-primary);
        }
      }
    }
  }

  .table-wrapper {
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);
  }

  .logger-name-cell {
    display: flex;
    align-items: center;
    gap: 10px;

    .logger-icon-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      background: var(--el-fill-color-light);
      border-radius: 6px;
      color: var(--el-text-color-secondary);
      font-size: 14px;
      flex-shrink: 0;

      &.is-root {
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
      }
    }

    .logger-name-text {
      font-family: "JetBrains Mono", "Consolas", monospace;
      font-size: 13px;
      color: var(--el-text-color-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .no-config {
    color: var(--el-text-color-placeholder);
    font-size: 14px;
  }

  .inherit-icon {
    font-size: 18px;

    &.is-active {
      color: var(--el-color-success);
    }

    &.is-inactive {
      color: var(--el-text-color-placeholder);
    }
  }

  .level-select {
    width: 100px;

    :deep(.el-select__wrapper) {
      border-radius: 6px;
    }
  }

  .level-option {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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
