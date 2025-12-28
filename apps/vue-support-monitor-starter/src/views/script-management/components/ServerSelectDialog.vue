<template>
  <sc-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="选择服务器运行脚本"
    width="600px"
    :close-on-click-modal="false"
    class="server-select-dialog"
    @close="handleClose"
  >
    <div class="dialog-content">
      <!-- 脚本信息 -->
      <div class="script-info" v-if="scriptData">
        <div class="info-icon">
          <IconifyIconOnline icon="ri:code-s-slash-line" />
        </div>
        <div class="info-text">
          <h4>{{ scriptData.monitorSysGenScriptName }}</h4>
          <p>{{ scriptData.monitorSysGenScriptType }} 脚本</p>
        </div>
      </div>

      <!-- 执行方式选择 -->
      <div class="execute-method">
        <label class="section-label">执行方式</label>
        <el-radio-group v-model="executeMethod" class="method-group">
          <el-radio-button value="SSH">
            <IconifyIconOnline icon="ri:terminal-line" />
            SSH 执行
          </el-radio-button>
          <el-radio-button value="NODE">
            <IconifyIconOnline icon="ri:server-line" />
            NODE 代理
          </el-radio-button>
        </el-radio-group>
        <p class="method-hint">
          {{ executeMethod === 'SSH' ? '通过 SSH 连接到服务器执行脚本' : '通过 NODE 代理服务执行脚本' }}
        </p>
      </div>

      <!-- 服务器列表 -->
      <div class="server-list-section">
        <div class="section-header">
          <label class="section-label">选择服务器</label>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索服务器..."
            clearable
            size="small"
            class="search-input"
          >
            <template #prefix>
              <IconifyIconOnline icon="ri:search-line" />
            </template>
          </el-input>
        </div>

        <div class="server-list" v-loading="loading">
          <div
            v-for="server in filteredServers"
            :key="server.monitorSysGenServerId"
            class="server-item"
            :class="{ selected: selectedServerId === server.monitorSysGenServerId }"
            @click="selectServer(server)"
          >
            <div class="server-icon">
              <IconifyIconOnline :icon="getServerIcon(server)" />
            </div>
            <div class="server-info">
              <div class="server-name">{{ server.monitorSysGenServerName }}</div>
              <div class="server-host">{{ server.monitorSysGenServerHost }}:{{ server.monitorSysGenServerPort }}</div>
            </div>
            <div class="server-status">
              <el-tag
                :type="server.monitorSysGenServerConnectionStatus === 1 ? 'success' : 'info'"
                size="small"
              >
                {{ server.monitorSysGenServerConnectionStatus === 1 ? '在线' : '离线' }}
              </el-tag>
            </div>
            <div class="check-icon" v-if="selectedServerId === server.monitorSysGenServerId">
              <IconifyIconOnline icon="ri:check-line" />
            </div>
          </div>

          <el-empty v-if="filteredServers.length === 0 && !loading" description="暂无可用服务器" />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          :disabled="!selectedServerId"
          :loading="executing"
          @click="handleExecute"
        >
          <IconifyIconOnline icon="ri:play-line" />
          执行脚本
        </el-button>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { message } from "@repo/utils";
import { getServerList } from "@/api/server";
import { executeScript } from "@/api/server/script-management";
import type { Script } from "../types";

interface Props {
  visible: boolean;
  scriptData?: Script | null;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  scriptData: null,
});

const emit = defineEmits<{
  "update:visible": [value: boolean];
  executed: [result: unknown];
}>();

// 响应式数据
const loading = ref(false);
const executing = ref(false);
const servers = ref<any[]>([]);
const selectedServerId = ref<number | null>(null);
const executeMethod = ref<"SSH" | "NODE">("SSH");
const searchKeyword = ref("");

// 计算属性：过滤后的服务器列表
const filteredServers = computed(() => {
  if (!searchKeyword.value) return servers.value;
  const keyword = searchKeyword.value.toLowerCase();
  return servers.value.filter(
    (s) =>
      s.monitorSysGenServerName?.toLowerCase().includes(keyword) ||
      s.monitorSysGenServerHost?.toLowerCase().includes(keyword)
  );
});

// 监听对话框打开
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      loadServers();
      selectedServerId.value = null;
    }
  }
);

// 加载服务器列表
const loadServers = async () => {
  try {
    loading.value = true;
    const response: any = await getServerList({ page: 1, pageSize: 100 });
    if (response.success) {
      servers.value = response.data?.records || [];
    }
  } catch (error) {
    console.error("加载服务器列表失败:", error);
  } finally {
    loading.value = false;
  }
};

// 选择服务器
const selectServer = (server: any) => {
  selectedServerId.value = server.monitorSysGenServerId;
};

// 获取服务器图标
const getServerIcon = (server: any) => {
  const protocol = server.monitorSysGenServerProtocol?.toUpperCase();
  switch (protocol) {
    case "SSH":
      return "ri:terminal-line";
    case "RDP":
      return "ri:computer-line";
    default:
      return "ri:server-line";
  }
};

// 执行脚本
const handleExecute = async () => {
  if (!selectedServerId.value || !props.scriptData) return;

  try {
    executing.value = true;
    const response: any = await executeScript({
      scriptId: props.scriptData.monitorSysGenScriptId!,
      serverId: selectedServerId.value,
      executeMethod: executeMethod.value,
    });

    if (response.success) {
      message("脚本已提交执行", { type: "success" });
      emit("executed", response.data);
      handleClose();
    } else {
      message(response.msg || "执行失败", { type: "error" });
    }
  } catch (error) {
    message("执行脚本失败", { type: "error" });
  } finally {
    executing.value = false;
  }
};

// 关闭对话框
const handleClose = () => {
  emit("update:visible", false);
};
</script>

<style scoped lang="scss">
.server-select-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
  }

  :deep(.el-dialog__header) {
    padding: 20px 24px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-dialog__body) {
    padding: 0;
  }
}

.dialog-content {
  padding: 20px 24px;
}

.script-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-color-primary-light-8));
  border-radius: 12px;
  margin-bottom: 20px;

  .info-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    background: var(--el-color-primary);
    border-radius: 10px;
    color: white;
    font-size: 22px;
  }

  .info-text {
    h4 {
      margin: 0 0 4px 0;
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    p {
      margin: 0;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}

.execute-method {
  margin-bottom: 20px;

  .method-group {
    margin-top: 8px;
    width: 100%;

    :deep(.el-radio-button) {
      flex: 1;

      .el-radio-button__inner {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: 100%;
        border-radius: 8px !important;
      }
    }
  }

  .method-hint {
    margin: 8px 0 0 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.section-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.server-list-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .search-input {
      width: 200px;
    }
  }
}

.server-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color);
    border-radius: 3px;
  }
}

.server-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid var(--el-border-color-lighter);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--el-fill-color-light);
  }

  &.selected {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-5);
  }

  .server-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: var(--el-fill-color);
    border-radius: 8px;
    color: var(--el-text-color-secondary);
    font-size: 18px;
  }

  .server-info {
    flex: 1;

    .server-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .server-host {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      font-family: "JetBrains Mono", monospace;
    }
  }

  .check-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: var(--el-color-primary);
    border-radius: 50%;
    color: white;
    font-size: 14px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--el-border-color-lighter);

  .el-button {
    min-width: 100px;
    border-radius: 8px;
  }
}
</style>
