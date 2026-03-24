<template>
  <sc-dialog
    v-model="visibleProxy"
    title="同步镜像"
    width="600px"
    :show-close="true"
  >
    <div class="content">
      <div class="pane-title">
        <IconifyIconOnline icon="ri:server-line" class="mr-2" />
        选择目标服务器
      </div>
      <div class="pane-subtitle">从服务器同步Docker镜像到系统镜像库</div>

      <div class="server-cards">
        <div
          v-for="server in servers"
          :key="server.monitorSysGenServerId"
          class="server-card"
          :class="{
            selected: selectedServerIds.includes(server.monitorSysGenServerId),
          }"
          @click="toggleServerSelect(server.monitorSysGenServerId)"
        >
          <div class="server-card-header">
            <div class="server-name-status">
              <div class="server-name">
                {{ server.monitorSysGenServerName }}
              </div>
              <el-tag
                :type="
                  getStatusType(server.monitorSysGenServerConnectionStatus)
                "
                size="small"
              >
                {{ getStatusText(server.monitorSysGenServerConnectionStatus) }}
              </el-tag>
            </div>
            <div
              class="server-check"
              v-if="selectedServerIds.includes(server.monitorSysGenServerId)"
            >
              <IconifyIconOnline icon="ri:check-line" />
            </div>
          </div>
          <div class="server-card-body">
            <div class="server-info-row">
              <IconifyIconOnline icon="ri:computer-line" class="info-icon" />
              <span
                >{{ server.monitorSysGenServerHost }}:{{
                  server.monitorSysGenServerPort
                }}</span
              >
            </div>
            <div class="server-info-row" v-if="server.monitorSysGenServerTags">
              <IconifyIconOnline icon="ri:price-tag-3-line" class="info-icon" />
              <div class="server-tags">
                <el-tag
                  v-for="tag in server.monitorSysGenServerTags?.split(',')"
                  :key="tag"
                  size="small"
                  type="info"
                  effect="plain"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="server-hint">
        <IconifyIconOnline icon="ri:information-line" class="mr-1" />
        已选择
        <b>{{ selectedServerCount }}</b>
        台服务器，将从这些服务器同步Docker镜像到系统镜像库
      </div>
    </div>

    <template #footer>
      <div class="dlg-footer">
        <el-button @click="visibleProxy = false">取消</el-button>
        <el-button
          type="primary"
          :loading="syncing"
          :disabled="selectedServerCount === 0"
          @click="submit"
        >
          <IconifyIconOnline
            icon="ri:refresh-line"
            class="mr-1"
            v-if="!syncing"
          />
          {{ syncing ? "同步中..." : "开始同步" }}
        </el-button>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { message } from "@repo/utils";
import { ElNotification } from "element-plus";
import { getServerList, imageApi } from "@/api/docker";

interface Props {
  visible: boolean;
}

interface Emits {
  (e: "update:visible", v: boolean): void;
  (e: "success"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visibleProxy = computed({
  get: () => props.visible,
  set: (v) => emit("update:visible", v),
});

const servers = ref<any[]>([]);
const selectedServerIds = ref<number[]>([]);
const syncing = ref(false);

const selectedServerCount = computed(() => selectedServerIds.value.length);

// 加载服务器列表
async function loadServers() {
  try {
    const res: any = await getServerList();
    if (res?.code === "00000") {
      servers.value = res.data || [];
    } else if (Array.isArray(res)) {
      servers.value = res || [];
    }
  } catch (error) {
    console.error("加载服务器列表失败:", error);
    message("加载服务器列表失败", { type: "error" });
  }
}

// 切换服务器选择
function toggleServerSelect(id: number) {
  const index = selectedServerIds.value.indexOf(id);
  if (index > -1) {
    selectedServerIds.value.splice(index, 1);
  } else {
    selectedServerIds.value.push(id);
  }
}

// 获取状态类型
function getStatusType(
  status: number | undefined
): "success" | "info" | "warning" | "danger" {
  if (status === 1) return "success";
  if (status === 0) return "danger";
  return "info";
}

// 获取状态文本
function getStatusText(status: number | undefined): string {
  if (status === 1) return "在线";
  if (status === 0) return "离线";
  return "未知";
}

// 提交
async function submit() {
  const ids = selectedServerIds.value || [];
  if (!ids.length) {
    return message("请选择至少一台服务器", { type: "warning" });
  }

  try {
    syncing.value = true;
    const payload = { serverIds: ids };

    const result = await imageApi.syncImages(payload);

    if (result.code === "00000") {
      const data = result.data || {};

      // 显示详细的服务器状态信息
      if (data.serverStatus) {
        const { disabledServers, failedServers } = data.serverStatus;

        // 如果有未启用Docker的服务器，显示警告
        if (disabledServers && disabledServers.length > 0) {
          const serverNames = disabledServers
            .map((s: any) => s.serverName)
            .join("、");
          ElNotification.warning({
            title: "部分服务器未启用Docker",
            message: `以下服务器未启用Docker功能：${serverNames}`,
            duration: 6000,
            position: "bottom-right",
          });
        }

        // 如果有连接失败的服务器，显示错误
        if (failedServers && failedServers.length > 0) {
          const errorInfo = failedServers
            .map((s: any) => `${s.serverName}: ${s.message}`)
            .join("\n");
          ElNotification.error({
            title: "部分服务器连接失败",
            message: errorInfo,
            duration: 8000,
            position: "bottom-right",
          });
        }
      }

      // 显示同步摘要
      if (data.statusSummary) {
        message(data.statusSummary, { type: "success" });
      } else {
        message("同步任务已启动", { type: "success" });
      }

      emit("success");
      visibleProxy.value = false;
    } else {
      message(result.msg || "同步失败", { type: "error" });
    }
  } catch (error: any) {
    console.error("同步镜像失败", error);
    ElNotification.error({
      title: "同步失败",
      message: error?.message || "同步失败，请稍后重试",
      position: "bottom-right",
    });
  } finally {
    syncing.value = false;
  }
}

// 监听对话框打开
watch(
  () => visibleProxy.value,
  (val) => {
    if (val) {
      loadServers();
    } else {
      selectedServerIds.value = [];
    }
  }
);
</script>

<style scoped lang="scss">
.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pane-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.pane-subtitle {
  font-size: 12px;
  color: var(--app-text-secondary);
  margin-bottom: 12px;
}

.server-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding: 4px;
}

.server-card {
  border: 2px solid var(--el-border-color);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.server-card:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.server-card.selected {
  border-color: var(--el-color-primary);
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.05),
    rgba(14, 165, 233, 0.05)
  );
}

.server-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.server-name-status {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.server-name {
  font-weight: 600;
  font-size: 14px;
}

.server-check {
  color: var(--el-color-success);
  font-size: 20px;
}

.server-card-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.server-info-row {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--app-text-secondary);
}

.info-icon {
  margin-right: 4px;
}

.server-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.server-hint {
  display: flex;
  align-items: center;
  padding: 12px;
  background: var(--el-color-info-light-9);
  border-radius: 8px;
  font-size: 14px;
}

.dlg-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}


/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>
