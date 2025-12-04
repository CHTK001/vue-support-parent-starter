<template>
  <el-dialog
    v-model="visibleProxy"
    title="同步镜像"
    width="650px"
    :show-close="!syncing"
    :close-on-click-modal="!syncing"
    :close-on-press-escape="!syncing"
    class="sync-dialog"
  >
    <div class="content">
      <!-- 同步进行中显示进度 -->
      <template v-if="syncStatus === 'syncing'">
        <div class="sync-progress-section">
          <div class="sync-header">
            <div class="sync-icon syncing">
              <IconifyIconOnline icon="ri:loader-4-line" class="spinning" />
            </div>
            <div class="sync-info">
              <div class="sync-title">正在同步镜像...</div>
              <div class="sync-subtitle">
                请勿关闭此窗口，同步完成后将自动关闭
              </div>
            </div>
          </div>

          <div class="progress-list">
            <div
              v-for="(progress, serverId) in serverProgress"
              :key="serverId"
              class="progress-item"
            >
              <div class="progress-header">
                <span class="server-name">{{ progress.serverName }}</span>
                <span class="progress-percent">{{ progress.progress }}%</span>
              </div>
              <el-progress
                :percentage="progress.progress"
                :status="progress.progress === 100 ? 'success' : undefined"
                :stroke-width="8"
              />
              <div class="progress-message">{{ progress.message }}</div>
            </div>
          </div>

          <div class="sync-stats" v-if="syncResult">
            <div class="stat-item">
              <span class="stat-label">总镜像数</span>
              <span class="stat-value">{{ syncResult.totalImages || 0 }}</span>
            </div>
            <div class="stat-item success">
              <span class="stat-label">成功</span>
              <span class="stat-value">{{ syncResult.successCount || 0 }}</span>
            </div>
            <div class="stat-item error" v-if="syncResult.errorCount > 0">
              <span class="stat-label">失败</span>
              <span class="stat-value">{{ syncResult.errorCount || 0 }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- 同步完成显示结果 -->
      <template v-else-if="syncStatus === 'completed'">
        <div class="sync-complete-section">
          <div class="complete-icon">
            <IconifyIconOnline icon="ri:checkbox-circle-fill" />
          </div>
          <div class="complete-title">同步完成</div>
          <div class="complete-stats">
            <div class="stat-card">
              <div class="stat-number">{{ syncResult?.totalImages || 0 }}</div>
              <div class="stat-label">总镜像数</div>
            </div>
            <div class="stat-card success">
              <div class="stat-number">{{ syncResult?.successCount || 0 }}</div>
              <div class="stat-label">同步成功</div>
            </div>
            <div
              class="stat-card error"
              v-if="(syncResult?.errorCount || 0) > 0"
            >
              <div class="stat-number">{{ syncResult?.errorCount || 0 }}</div>
              <div class="stat-label">同步失败</div>
            </div>
          </div>
        </div>
      </template>

      <!-- 同步失败显示错误 -->
      <template v-else-if="syncStatus === 'error'">
        <div class="sync-error-section">
          <div class="error-icon">
            <IconifyIconOnline icon="ri:close-circle-fill" />
          </div>
          <div class="error-title">同步未开始</div>
          <div class="error-message">{{ errorMessage }}</div>
        </div>
      </template>

      <!-- 默认显示服务器选择 -->
      <template v-else>
        <div class="pane-title">
          <IconifyIconOnline icon="ri:server-line" class="mr-2" />
          选择目标服务器
        </div>
        <div class="pane-subtitle">从服务器同步Docker镜像到系统镜像库</div>

        <div class="server-cards" v-loading="loadingServers">
          <template v-if="servers.length > 0">
            <div
              v-for="server in servers"
              :key="server.monitorSysGenServerId"
              class="server-card"
              :class="{
                selected: selectedServerIds.includes(
                  server.monitorSysGenServerId
                ),
                disabled: server.monitorSysGenServerConnectionStatus !== 1,
              }"
              @click="toggleServerSelect(server)"
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
                    {{
                      getStatusText(server.monitorSysGenServerConnectionStatus)
                    }}
                  </el-tag>
                </div>
                <div
                  class="server-check"
                  v-if="
                    selectedServerIds.includes(server.monitorSysGenServerId)
                  "
                >
                  <IconifyIconOnline icon="ri:check-line" />
                </div>
              </div>
              <div class="server-card-body">
                <div class="server-info-row">
                  <IconifyIconOnline
                    icon="ri:computer-line"
                    class="info-icon"
                  />
                  <span
                    >{{ server.monitorSysGenServerHost }}:{{
                      server.monitorSysGenServerPort
                    }}</span
                  >
                </div>
                <div
                  class="server-info-row"
                  v-if="server.monitorSysGenServerTags"
                >
                  <IconifyIconOnline
                    icon="ri:price-tag-3-line"
                    class="info-icon"
                  />
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
          </template>
          <div v-else-if="!loadingServers" class="no-servers">
            <IconifyIconOnline icon="ri:server-line" class="empty-icon" />
            <span>暂无可用服务器</span>
          </div>
        </div>

        <div class="server-hint" v-if="servers.length > 0">
          <IconifyIconOnline icon="ri:information-line" class="mr-1" />
          已选择
          <b>{{ selectedServerCount }}</b>
          台服务器，将从这些服务器同步Docker镜像到系统镜像库
        </div>
      </template>
    </div>

    <template #footer>
      <div class="dlg-footer">
        <template v-if="syncStatus === 'completed' || syncStatus === 'error'">
          <el-button type="primary" @click="handleClose"> 确定 </el-button>
        </template>
        <template v-else-if="syncStatus === 'syncing'">
          <el-button disabled> 同步进行中... </el-button>
        </template>
        <template v-else>
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
            {{ syncing ? "提交中..." : "开始同步" }}
          </el-button>
        </template>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { ElMessage, ElNotification } from "element-plus";
import { getServerList, imageApi } from "@/api/docker-management";
import { useGlobalSocket } from "@repo/core";

/**
 * 镜像同步对话框组件
 * @author CH
 * @version 2.0.0
 * @since 2025-01-16
 */

interface Props {
  visible: boolean;
}

interface Emits {
  (e: "update:visible", v: boolean): void;
  (e: "success"): void;
}

// 同步进度类型
interface SyncProgress {
  serverName: string;
  progress: number;
  message: string;
}

// 同步结果类型
interface SyncResult {
  operationId: string;
  totalImages: number;
  successCount: number;
  errorCount: number;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visibleProxy = computed({
  get: () => props.visible,
  set: (v) => emit("update:visible", v),
});

// 状态
const servers = ref<any[]>([]);
const selectedServerIds = ref<number[]>([]);
const syncing = ref(false);
const loadingServers = ref(false);
const syncStatus = ref<"idle" | "syncing" | "completed" | "error">("idle");
const errorMessage = ref("");
const currentOperationId = ref("");
const serverProgress = ref<Record<number, SyncProgress>>({});
const syncResult = ref<SyncResult | null>(null);

const selectedServerCount = computed(() => selectedServerIds.value.length);

// 获取全局Socket
const globalSocket = useGlobalSocket();

// 加载服务器列表
async function loadServers() {
  try {
    loadingServers.value = true;
    const res: any = await getServerList();
    if (res?.code === "00000") {
      servers.value = res.data || [];
    } else if (Array.isArray(res)) {
      servers.value = res || [];
    }
  } catch (error) {
    console.error("加载服务器列表失败:", error);
    ElMessage.error("加载服务器列表失败");
  } finally {
    loadingServers.value = false;
  }
}

// 切换服务器选择
function toggleServerSelect(server: any) {
  // 离线服务器不可选
  if (server.monitorSysGenServerConnectionStatus !== 1) {
    ElMessage.warning("该服务器离线，无法同步");
    return;
  }

  const id = server.monitorSysGenServerId;
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

// 提交同步
async function submit() {
  const ids = selectedServerIds.value || [];
  if (!ids.length) {
    return ElMessage.warning("请选择至少一台服务器");
  }

  try {
    syncing.value = true;

    // 初始化进度
    serverProgress.value = {};
    ids.forEach((id) => {
      const server = servers.value.find((s) => s.monitorSysGenServerId === id);
      serverProgress.value[id] = {
        serverName: server?.monitorSysGenServerName || `服务器-${id}`,
        progress: 0,
        message: "等待开始...",
      };
    });

    const payload = { serverIds: ids };
    const result = await imageApi.syncImages(payload);

    if (result.code === "00000" && result.data) {
      // 同步任务已开始
      currentOperationId.value = result.data.operationId;
      syncStatus.value = "syncing";
      syncResult.value = result.data as any;

      ElNotification.success({
        title: "同步任务已开始",
        message: "正在从服务器同步镜像，请查看进度",
        position: "bottom-right",
        duration: 3000,
      });
    } else {
      // 同步未开始
      syncStatus.value = "error";
      errorMessage.value =
        result.msg || "同步任务未能启动，请检查服务器连接状态";

      ElNotification.error({
        title: "同步未开始",
        message: errorMessage.value,
        position: "bottom-right",
        duration: 5000,
      });
    }
  } catch (error: any) {
    console.error("同步镜像失败", error);
    syncStatus.value = "error";
    errorMessage.value = error?.message || "同步请求失败，请稍后重试";

    ElNotification.error({
      title: "同步未开始",
      message: errorMessage.value,
      position: "bottom-right",
    });
  } finally {
    syncing.value = false;
  }
}

// 处理关闭
function handleClose() {
  if (syncStatus.value === "completed") {
    emit("success");
  }
  resetState();
  visibleProxy.value = false;
}

// 重置状态
function resetState() {
  syncStatus.value = "idle";
  errorMessage.value = "";
  currentOperationId.value = "";
  serverProgress.value = {};
  syncResult.value = null;
  selectedServerIds.value = [];
}

// 设置Socket监听
function setupSocketListeners() {
  if (!globalSocket) return;

  // 监听同步进度
  globalSocket.on("software_sync_progress", (data: any) => {
    if (data.operationId === currentOperationId.value) {
      const serverId = data.serverId;
      if (serverProgress.value[serverId]) {
        serverProgress.value[serverId].progress = data.progress || 0;
        serverProgress.value[serverId].message = data.message || "同步中...";
      }
    }
  });

  // 监听同步完成
  globalSocket.on("operation_complete", (data: any) => {
    if (
      data.operationId === currentOperationId.value &&
      data.type === "sync_images"
    ) {
      syncStatus.value = "completed";
      syncResult.value = {
        operationId: data.operationId,
        totalImages: data.totalImages || 0,
        successCount: data.successCount || 0,
        errorCount: data.errorCount || 0,
      };

      ElNotification.success({
        title: "同步完成",
        message: `成功同步 ${data.successCount || 0} 个镜像`,
        position: "bottom-right",
        duration: 4000,
      });
    }
  });
}

// 清理Socket监听
function cleanupSocketListeners() {
  if (!globalSocket) return;
  globalSocket.off("software_sync_progress");
  globalSocket.off("operation_complete");
}

// 监听对话框打开
watch(
  () => visibleProxy.value,
  (val) => {
    if (val) {
      resetState();
      loadServers();
      setupSocketListeners();
    } else {
      cleanupSocketListeners();
    }
  }
);

onUnmounted(() => {
  cleanupSocketListeners();
});
</script>

<style scoped>
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

/* 离线服务器不可选 */
.server-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.server-card.disabled:hover {
  border-color: var(--el-border-color);
  box-shadow: none;
}

/* 空状态 */
.no-servers {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--el-text-color-secondary);
  gap: 12px;
}

.no-servers .empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

/* 同步进度区域 */
.sync-progress-section {
  padding: 20px;
}

.sync-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.sync-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.sync-icon.syncing .spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.sync-info {
  flex: 1;
}

.sync-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.sync-subtitle {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.progress-item {
  padding: 16px;
  background: var(--el-fill-color-light);
  border-radius: 12px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-header .server-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.progress-percent {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.progress-message {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.sync-stats {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 12px;
}

.sync-stats .stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.sync-stats .stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.sync-stats .stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.sync-stats .stat-item.success .stat-value {
  color: var(--el-color-success);
}

.sync-stats .stat-item.error .stat-value {
  color: var(--el-color-danger);
}

/* 同步完成区域 */
.sync-complete-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
}

.complete-icon {
  font-size: 64px;
  color: var(--el-color-success);
  margin-bottom: 16px;
}

.complete-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 24px;
}

.complete-stats {
  display: flex;
  gap: 24px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 32px;
  background: var(--el-fill-color-light);
  border-radius: 12px;
  min-width: 100px;
}

.stat-card .stat-number {
  font-size: 32px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.stat-card .stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.stat-card.success {
  background: linear-gradient(
    135deg,
    rgba(103, 194, 58, 0.1) 0%,
    rgba(103, 194, 58, 0.05) 100%
  );
}

.stat-card.success .stat-number {
  color: var(--el-color-success);
}

.stat-card.error {
  background: linear-gradient(
    135deg,
    rgba(245, 108, 108, 0.1) 0%,
    rgba(245, 108, 108, 0.05) 100%
  );
}

.stat-card.error .stat-number {
  color: var(--el-color-danger);
}

/* 同步错误区域 */
.sync-error-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
}

.error-icon {
  font-size: 64px;
  color: var(--el-color-danger);
  margin-bottom: 16px;
}

.error-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
}

.error-message {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  text-align: center;
  max-width: 400px;
  line-height: 1.6;
}
</style>
