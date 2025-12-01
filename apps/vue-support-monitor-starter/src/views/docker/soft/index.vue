<template>
  <div class="soft-management">
    <!-- 嵌入式安装进度显示（页面顶部） -->
    <div
      v-if="activeInstallOperations.length > 0"
      class="embedded-progress-panel"
    >
      <ScSocketEventProcess
        v-for="operation in activeInstallOperations"
        :key="operation.eventId"
        :event-id="operation.eventId"
        :event-name="operation.eventName"
        :title="operation.title"
        :icon="operation.icon"
        mode="embed"
        layout="log"
        :storage-prefix="'docker-install-embedded'"
        @data="handleOperationData(operation.eventId, $event)"
      />
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <div class="stats-grid">
        <ScCard
          layout="stats"
          theme="primary"
          icon="ri:apps-line"
          :value="softStats.total || 0"
          label="软件总数"
          trend-icon="ri:stack-line"
          trend-text="全部软件"
        />
        <ScCard
          layout="stats"
          theme="success"
          icon="ri:checkbox-circle-line"
          :value="softStats.enabled || 0"
          label="已启用"
          trend-icon="ri:check-line"
          trend-text="正常运行"
        />
        <ScCard
          layout="stats"
          theme="warning"
          icon="ri:award-line"
          :value="softStats.official || 0"
          label="官方软件"
          trend-icon="ri:verified-badge-line"
          trend-text="官方认证"
        />
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar-section flex flex-row justify-between">
      <div class="toolbar-left">
        <el-input
          v-model="params.keyword"
          placeholder="搜索名称/代码"
          class="search-input"
          clearable
          @keyup.enter="reload"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
        <el-select
          v-model="params.category"
          placeholder="分类"
          clearable
          class="filter-select"
          @change="reload"
        >
          <el-option label="全部" :value="undefined" />
          <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
        </el-select>
        <el-select
          v-model="params.status"
          placeholder="状态"
          clearable
          class="filter-select"
          @change="reload"
        >
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-button @click="reload">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
        </el-button>
        <el-button @click="onlineVisible = true" type="primary">
          <IconifyIconOnline icon="ri:search-eye-line" class="mr-1" />
        </el-button>
        <el-button type="primary" v-admin @click="openEdit()">
          <IconifyIconOnline icon="ri:add-line" class="mr-1" />
        </el-button>
      </div>
    </div>

    <!-- 软件卡片：使用 ScTable 的 card 布局 & url 模式 -->
    <ScTable
      ref="tableRef"
      :url="softwareApi.getSoftPageList"
      :params="params"
      row-key="systemSoftId"
      layout="card"
      :col-size="4"
      :row-size="3"
      :page-size="12"
      :pagination-type="paginationType"
      :auto-load="paginationType === 'scroll'"
      :load-distance="120"
      table-name="docker-soft-list"
    >
      <template #default="{ row }">
        <div class="soft-card">
          <div class="soft-card-header">
            <div class="soft-card-title">
              <IconifyIconOnline
                :icon="row.systemSoftIcon || 'ri:apps-line'"
                class="soft-card-icon"
              />
              <span class="name">{{ row.systemSoftName }}</span>
              <el-tag
                v-if="row.systemSoftIsOfficial === 1"
                size="small"
                type="warning"
                round
                class="ml-2"
                >官方</el-tag
              >
            </div>
            <div class="soft-badges">
              <el-tag size="small" effect="plain"
                ><IconifyIconOnline icon="ri:star-line" class="mr-1" />{{
                  row.systemSoftStarCount ?? 0
                }}</el-tag
              >
              <el-tag size="small" effect="plain"
                ><IconifyIconOnline icon="ri:download-2-line" class="mr-1" />{{
                  row.systemSoftPullCount ?? 0
                }}</el-tag
              >
              <el-tag
                size="small"
                :type="row.systemSoftStatus === 1 ? 'success' : 'info'"
              >
                {{ row.systemSoftStatus === 1 ? "启用" : "禁用" }}
              </el-tag>
            </div>
          </div>
          <div class="soft-meta">代码：{{ row.systemSoftCode }}</div>
          <div class="soft-meta">
            镜像：{{ row.systemSoftDockerImage || "—" }}
          </div>
          <div
            class="soft-meta"
            v-if="row.installedServers && row.installedServers.length > 0"
          >
            <IconifyIconOnline icon="ri:server-line" class="mr-1" />
            已安装：
            <el-tag
              v-for="server in row.installedServers.slice(0, 3)"
              :key="server"
              size="small"
              type="success"
              effect="plain"
              class="ml-1"
            >
              {{ server }}
            </el-tag>
            <el-tag
              v-if="row.installedServers.length > 3"
              size="small"
              type="info"
              effect="plain"
              class="ml-1"
            >
              +{{ row.installedServers.length - 3 }}
            </el-tag>
          </div>
          <div class="soft-desc">
            {{ row.systemSoftDesc || row.systemSoftDescription || "—" }}
          </div>
          <div class="soft-actions">
            <el-button size="small" type="primary" plain @click="openPull(row)">
              <IconifyIconOnline icon="ri:download-cloud-line" class="mr-1" />
              下载
            </el-button>
            <el-button size="small" v-admin @click="openEdit(row)">
              <IconifyIconOnline icon="ri:edit-line" class="mr-1" /> 编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              v-admin
              @click="onDelete(row)"
            >
              <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" /> 删除
            </el-button>
          </div>
        </div>
      </template>
    </ScTable>

    <!-- 新增/编辑软件 -->
    <ScDialog v-model:visible="editVisible" title="软件信息" width="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="名称" prop="systemSoftName">
          <el-input v-model="form.systemSoftName" />
        </el-form-item>
        <el-form-item label="代码" prop="systemSoftCode">
          <el-input v-model="form.systemSoftCode" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="form.systemSoftCategory" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.systemSoftDesc" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="form.systemSoftStatus"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="onSubmit">保存</el-button>
      </template>
    </ScDialog>

    <!-- 下载镜像对话框 -->
    <SoftPullDialog
      v-model:visible="pullVisible"
      :soft="currentSoft"
      @success="onPullSuccess"
    />

    <!-- 在线搜索弹框 -->
    <SoftOnlineSearchDialog v-model:visible="onlineVisible" @success="reload" />
  </div>
</template>

<script setup lang="ts">
import { softwareApi } from "@/api/docker-management";
import { useGlobalSocket } from "@repo/core";
import ScDialog from "@repo/components/ScDialog/src/index.vue";
import ScSocketEventProcess from "@repo/components/ScSocketMessageDialog/index.vue";
import ScTable from "@repo/components/ScTable/index.vue";
import ScCard from "@repo/components/ScCard/index.vue";
import { ElMessage, ElMessageBox, ElNotification } from "element-plus";
import { onMounted, onUnmounted, reactive, ref, watch } from "vue";
import SoftPullDialog from "./components/SoftPullDialog.vue";
import SoftOnlineSearchDialog from "./components/SoftOnlineSearchDialog.vue";

const tableRef = ref();
const onlineVisible = ref(false);
const pullVisible = ref(false);
const params = reactive<any>({
  page: 1,
  size: 12,
  keyword: "",
  category: undefined,
  status: undefined,
});
const categories = ref<string[]>([]);
const softStats = reactive({ total: 0, enabled: 0, official: 0 });

// 活跃的安装操作列表
interface InstallOperation {
  eventId: string;
  eventName: string | string[];
  title: string;
  icon: string;
}
const activeInstallOperations = ref<InstallOperation[]>([]);

// 分页模式：默认 normal / 滚动 scroll
const paginationType = ref<"default" | "scroll">("default");
const isScroll = ref(false);
watch(isScroll, (v) => (paginationType.value = v ? "scroll" : "default"));

// 获取全局Socket服务
const globalSocket = useGlobalSocket();

// 处理操作数据（用于清理已完成的操作）
function handleOperationData(eventId: string, data: any) {
  // 当进度完成或失败时，延迟移除
  if (data.status === "success" || data.status === "error") {
    setTimeout(() => {
      const index = activeInstallOperations.value.findIndex(
        (op) => op.eventId === eventId
      );
      if (index !== -1) {
        activeInstallOperations.value.splice(index, 1);
      }
    }, 10000); // 10秒后自动移除
  }
}

// 设置Socket事件监听
function setupSocketListeners() {
  if (!globalSocket) {
    console.warn("Global Socket服务未初始化");
    return;
  }

  // 监听Docker镜像拉取进度
  globalSocket.on("docker_image_pull_progress", (data: any) => {
    console.log("📦 镜像拉取进度:", data);
  });

  // 监听操作进度更新
  globalSocket.on("progress_update", (operation: any) => {
    if (
      operation.type === "pull_image" ||
      operation.type === "install_software"
    ) {
      console.log("⚙️ 安装进度更新:", operation);
    }
  });

  // 监听操作完成
  globalSocket.on("operation_complete", (operation: any) => {
    if (
      operation.type === "pull_image" ||
      operation.type === "install_software"
    ) {
      console.log("✅ 操作完成:", operation);
      ElNotification.success({
        title: "安装成功",
        message: `${operation.title} - ${operation.message}`,
        duration: 4000,
        position: "bottom-right",
      });
    }
  });

  // 监听操作错误
  globalSocket.on("operation_error", (operation: any) => {
    if (
      operation.type === "pull_image" ||
      operation.type === "install_software"
    ) {
      console.error("❌ 操作失败:", operation);
      ElNotification.error({
        title: "安装失败",
        message: `${operation.title} - ${operation.message}`,
        duration: 5000,
        position: "bottom-right",
      });
    }
  });

  // 监听容器状态变化
  globalSocket.on("docker_container_status", (data: any) => {
    console.log("🐳 容器状态变化:", data);
  });

  // 监听软件同步进度
  globalSocket.on("software_sync_progress", (data: any) => {
    console.log("🔄 软件同步进度:", data);
  });
}

// 清理Socket事件监听
function cleanupSocketListeners() {
  if (!globalSocket) return;

  globalSocket.off("docker_image_pull_progress");
  globalSocket.off("progress_update");
  globalSocket.off("operation_complete");
  globalSocket.off("operation_error");
  globalSocket.off("docker_container_status");
  globalSocket.off("software_sync_progress");
}

onMounted(() => {
  // 设置Socket事件监听
  setupSocketListeners();
  // 加载统计数据
  loadStats();
});

// 组件卸载时清理
onUnmounted(() => {
  cleanupSocketListeners();
});

function reload() {
  tableRef.value?.reload?.(params, 1);
}

// 编辑
const editVisible = ref(false);
const formRef = ref();
const form = reactive<any>({
  systemSoftId: undefined,
  systemSoftName: "",
  systemSoftCode: "",
  systemSoftCategory: "",
  systemSoftDesc: "",
  systemSoftStatus: 1,
});
const rules = {
  systemSoftName: [{ required: true, message: "必填", trigger: "blur" }],
  systemSoftCode: [{ required: true, message: "必填", trigger: "blur" }],
};

function openEdit(row?: any) {
  if (row) Object.assign(form, row);
  else Object.assign(form, { systemSoftId: undefined, systemSoftStatus: 1 });
  editVisible.value = true;
}

async function onSubmit() {
  await formRef.value?.validate();
  const id = form.systemSoftId as number | undefined;
  if (id) {
    const { code, msg } = await softwareApi.updateSoft(id, { ...form });
    if (code === 0) {
      ElMessage.success("更新成功");
      editVisible.value = false;
      reload();
    } else {
      ElMessage.error(msg || "更新失败");
    }
  } else {
    const { code, msg } = await softwareApi.createSoft({ ...form });
    if (code === 0) {
      ElMessage.success("新增成功");
      editVisible.value = false;
      reload();
    } else {
      ElMessage.error(msg || "新增失败");
    }
  }
}

async function onDelete(row: any) {
  await ElMessageBox.confirm(`确认删除软件【${row.systemSoftName}】?`, "提示", {
    type: "warning",
  });
  const { code, msg } = await softwareApi.deleteSoft(row.systemSoftId);
  if (code === 0) {
    ElMessage.success("删除成功");
    reload();
  } else {
    ElMessage.error(msg || "删除失败");
  }
}

// 下载镜像
const currentSoft = ref<any>();
function openPull(row: any) {
  currentSoft.value = row;
  pullVisible.value = true;
}
function onPullSuccess() {
  ElNotification.success({
    title: "下载任务已创建",
    message: "正在下载镜像，请在右下角查看实时进度",
    duration: 4000,
    position: "bottom-right",
  });
  reload();
}

// 加载统计数据
async function loadStats() {
  try {
    const res = await softwareApi.getSoftwareStats();
    if (res.code === "00000" && res.data) {
      softStats.total = res.data.totalSoftware || 0;
      softStats.enabled = res.data.enabledSoftware || 0;
      softStats.official = res.data.officialSoftware || 0;
    }
  } catch (e) {
    console.error("加载统计数据失败:", e);
  }
}
</script>

<style scoped>
.soft-management {
  padding: 20px;
  background: var(--app-bg-secondary);
}

/* 嵌入式进度面板 */
.embedded-progress-panel {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--el-bg-color);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* 统计卡片区域 */
.stats-section {
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.header-left .page-title {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: 600;
}
.title-icon {
  margin-right: 8px;
}
.page-subtitle {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.search-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 12px;
  background: linear-gradient(
    90deg,
    rgba(99, 102, 241, 0.08),
    rgba(14, 165, 233, 0.08)
  );
  margin-bottom: 16px;
}
.search-input {
  width: 280px;
}
.filter-select {
  width: 160px;
  margin-left: 8px;
}

.soft-card {
  background: var(--el-bg-color);
  border-radius: 14px;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
  padding: 14px;
}
.soft-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.1);
  border-color: var(--el-color-primary-light-5);
}
.soft-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.soft-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.soft-badges {
  display: flex;
  align-items: center;
  gap: 6px;
}
.soft-card-icon {
  font-size: 22px;
  color: var(--el-color-primary);
}
.name {
  font-weight: 600;
}
.soft-meta {
  color: var(--app-text-secondary);
  font-size: 12px;
  margin-bottom: 6px;
}
.soft-desc {
  color: var(--app-text-secondary);
  line-height: 1.5;
  min-height: 36px;
}
.soft-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.filter-select {
  width: 160px;
}

/* 卡片样式 */
.soft-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--app-card-bg);
  border: 1px solid var(--app-card-border);
  border-radius: 10px;
  padding: 14px;
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.soft-card:hover {
  box-shadow: var(--app-card-shadow);
  transform: translateY(-2px);
}

.soft-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.soft-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.soft-card-icon {
  font-size: 18px;
  color: var(--app-primary);
}

.soft-card .name {
  font-weight: 600;
  color: var(--app-text-primary);
}

.soft-meta {
  font-size: 12px;
  color: var(--app-text-secondary);
}

.soft-desc {
  color: var(--app-text-secondary);
  font-size: 13px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.soft-actions {
  display: flex;
  gap: 8px;
  padding-top: 6px;
}

/* 兼容原有截断类 */
.truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-left {
    flex-wrap: wrap;
  }

  .search-input,
  .filter-select {
    width: 100%;
  }
}
</style>
