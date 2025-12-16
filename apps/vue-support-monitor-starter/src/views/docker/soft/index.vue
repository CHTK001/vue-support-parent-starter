<template>
  <div class="soft-management">
    <ProgressMonitor />
    <!-- 现代化页面头部 -->
    <div class="modern-header">
      <div class="header-content">
        <div class="header-info">
          <div class="icon-wrapper">
            <IconifyIconOnline icon="ri:apps-2-line" class="header-icon" />
          </div>
          <div class="title-wrapper">
            <h1 class="page-title">软件库</h1>
            <p class="page-subtitle">从仓库检索并管理可安装的软件</p>
          </div>
        </div>
        <div class="header-actions">
          <el-button @click="reload" class="action-btn">
            <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
            刷新
          </el-button>
          <el-button @click="syncVisible = true" type="success" plain class="action-btn">
            <IconifyIconOnline icon="ri:cloud-line" class="mr-1" />
            同步镜像
          </el-button>
          <el-button @click="onlineVisible = true" class="action-btn">
            <IconifyIconOnline icon="ri:search-eye-line" class="mr-1" />
            在线搜索
          </el-button>
          <el-button type="primary" v-admin @click="openEdit()" class="action-btn">
            <IconifyIconOnline icon="ri:add-line" class="mr-1" />
            新增软件
          </el-button>
        </div>
      </div>
    </div>

    <!-- 统计卡片区域 -->
    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-icon total">
          <IconifyIconOnline icon="ri:apps-line" />
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.total }}</span>
          <span class="stat-label">软件总数</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon enabled">
          <IconifyIconOnline icon="ri:checkbox-circle-line" />
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.enabled }}</span>
          <span class="stat-label">已启用</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon disabled">
          <IconifyIconOnline icon="ri:close-circle-line" />
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.disabled }}</span>
          <span class="stat-label">已禁用</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon official">
          <IconifyIconOnline icon="ri:verified-badge-line" />
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.official }}</span>
          <span class="stat-label">官方软件</span>
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar-section">
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
        <el-button type="primary" @click="reload">
          <IconifyIconOnline icon="ri:search-2-line" class="mr-1" />
          搜索
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
            <el-button
              size="small"
              type="primary"
              plain
              @click="openInstall(row)"
            >
              <IconifyIconOnline icon="ri:download-line" class="mr-1" /> 安装
            </el-button>
            <el-button size="small" v-role="'admin'" @click="openEdit(row)">
              <IconifyIconOnline icon="ri:edit-line" class="mr-1" /> 编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              v-role="'admin'"
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

    <!-- 全屏安装向导 -->
    <SoftInstallDialog
      v-model:visible="installVisible"
      :soft="currentSoft"
      @success="onInstallSuccess"
    />

    <!-- 在线搜索弹框 -->
    <SoftOnlineSearchDialog v-model:visible="onlineVisible" @success="reload" />

    <!-- 同步镜像弹框 -->
    <SoftSyncDialog v-model:visible="syncVisible" @success="onSyncSuccess" />
  </div>
</template>

<script setup lang="ts">
import { softwareApi } from "@/api/docker";
import ProgressMonitor from "@/components/ProgressMonitor.vue";
import { useGlobalSocket, MonitorTopics } from "@repo/core";
import ScDialog from "@repo/components/ScDialog/src/index.vue";
import ScTable from "@repo/components/ScTable/index.vue";
import { message } from "@repo/utils";
import { ElMessageBox, ElNotification } from "element-plus";
import { onMounted, onUnmounted, reactive, ref, watch } from "vue";
import SoftInstallDialog from "./components/SoftInstallDialog.vue";
import SoftOnlineSearchDialog from "./components/SoftOnlineSearchDialog.vue";
import SoftSyncDialog from "./components/SoftSyncDialog.vue";

const tableRef = ref();
const onlineVisible = ref(false);
const syncVisible = ref(false);
const params = reactive<any>({
  page: 1,
  size: 12,
  keyword: "",
  category: undefined,
  status: undefined,
});
const categories = ref<string[]>([]);

// 统计数据
const stats = reactive({
  total: 0,
  enabled: 0,
  disabled: 0,
  official: 0,
});

// 分页模式：默认 normal / 滚动 scroll
const paginationType = ref<"default" | "scroll">("default");
const isScroll = ref(false);
watch(isScroll, (v) => (paginationType.value = v ? "scroll" : "default"));

// 获取全局Socket服务
const globalSocket = useGlobalSocket();

// 设置Socket事件监听
function setupSocketListeners() {
  if (!globalSocket) {
    console.warn("Global Socket服务未初始化");
    return;
  }

  // 监听Docker镜像拉取进度
  globalSocket.on(MonitorTopics.DOCKER.IMAGE_PULL_PROGRESS, (data: any) => {
    console.log("📦 镜像拉取进度:", data);
  });

  // 监听操作进度更新
  globalSocket.on(MonitorTopics.OPERATION.UPDATE, (operation: any) => {
    if (
      operation.type === "pull_image" ||
      operation.type === "install_software"
    ) {
      console.log("⚙️ 安装进度更新:", operation);
    }
  });

  // 监听操作完成
  globalSocket.on(MonitorTopics.OPERATION.COMPLETE, (operation: any) => {
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
  globalSocket.on(MonitorTopics.OPERATION.ERROR, (operation: any) => {
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
  // 数据格式: { containerId, containerName, status, softId, serverId, updateTime }
  globalSocket.on(MonitorTopics.DOCKER.CONTAINER_STATUS, (data: any) => {
    // 根据 softId 过滤当前页面关心的软件
    // 如果需要过滤特定软件，可以在这里添加条件
    // if (data.softId !== currentSoftId) return;
    console.log("🐳 容器状态变化:", data);
  });

  // 监听软件同步进度
  globalSocket.on(MonitorTopics.SOFTWARE.SYNC_PROGRESS, (data: any) => {
    console.log("🔄 软件同步进度:", data);
  });
}

// 清理Socket事件监听
function cleanupSocketListeners() {
  if (!globalSocket) return;

  globalSocket.off(MonitorTopics.DOCKER.IMAGE_PULL_PROGRESS);
  globalSocket.off(MonitorTopics.OPERATION.UPDATE);
  globalSocket.off(MonitorTopics.OPERATION.COMPLETE);
  globalSocket.off(MonitorTopics.OPERATION.ERROR);
  globalSocket.off(MonitorTopics.DOCKER.CONTAINER_STATUS);
  globalSocket.off(MonitorTopics.SOFTWARE.SYNC_PROGRESS);
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

async function reload() {
  tableRef.value?.reload?.(params, 1);
  await loadStats();
}

// 加载统计数据
async function loadStats() {
  try {
    const { code, data } = await softwareApi.getSoftPageList({ page: 1, size: 1000 });
    if (code === 0 && data?.records) {
      const list = data.records;
      stats.total = list.length;
      stats.enabled = list.filter((s: any) => s.systemSoftStatus === 1).length;
      stats.disabled = list.filter((s: any) => s.systemSoftStatus === 0).length;
      stats.official = list.filter((s: any) => s.systemSoftIsOfficial === 1).length;
    }
  } catch (e) {
    console.error('加载统计数据失败', e);
  }
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
      message("更新成功", { type: "success" });
      editVisible.value = false;
      reload();
    } else {
      message(msg || "更新失败", { type: "error" });
    }
  } else {
    const { code, msg } = await softwareApi.createSoft({ ...form });
    if (code === 0) {
      message("新增成功", { type: "success" });
      editVisible.value = false;
      reload();
    } else {
      message(msg || "新增失败", { type: "error" });
    }
  }
}

async function onDelete(row: any) {
  await ElMessageBox.confirm(`确认删除软件【${row.systemSoftName}】?`, "提示", {
    type: "warning",
  });
  const { code, msg } = await softwareApi.deleteSoft(row.systemSoftId);
  if (code === 0) {
    message("删除成功", { type: "success" });
    reload();
  } else {
    message(msg || "删除失败", { type: "error" });
  }
}

// 安装
const installVisible = ref(false);
const currentSoft = ref<any>();
function openInstall(row: any) {
  currentSoft.value = row;
  installVisible.value = true;
}
function onInstallSuccess() {
  ElNotification.success({
    title: "安装任务已创建",
    message: "正在拉取镜像，请在右下角查看实时进度",
    duration: 4000,
    position: "bottom-right",
  });
}

// 同步
function onSyncSuccess() {
  ElNotification.success({
    title: "同步任务已创建",
    message: "正在从服务器同步Docker镜像，请在右下角查看实时进度",
    duration: 4000,
    position: "bottom-right",
  });
}
</script>

<style scoped lang="scss">
.soft-management {
  padding: 0;
  background: var(--app-bg-secondary);
  min-height: 100vh;
}

// 现代化头部
.modern-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 28px 32px;
  color: #fff;
  margin-bottom: 0;

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1600px;
    margin: 0 auto;
  }

  .header-info {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .icon-wrapper {
    width: 56px;
    height: 56px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);

    .header-icon {
      font-size: 28px;
      color: #fff;
    }
  }

  .title-wrapper {
    .page-title {
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 4px 0;
      letter-spacing: -0.5px;
    }

    .page-subtitle {
      font-size: 14px;
      opacity: 0.85;
      margin: 0;
    }
  }

  .header-actions {
    display: flex;
    gap: 12px;

    .action-btn {
      border-radius: 10px;
      padding: 10px 18px;
      font-weight: 500;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
      }
    }
  }
}

// 统计卡片区域
.stats-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  padding: 24px 32px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);

  .stat-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: var(--el-fill-color-lighter);
    border-radius: 14px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    }

    .stat-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;

      &.total {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
      }

      &.enabled {
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        color: #fff;
      }

      &.disabled {
        background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
        color: #fff;
      }

      &.official {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: #fff;
      }
    }

    .stat-info {
      display: flex;
      flex-direction: column;

      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: var(--el-text-color-primary);
        line-height: 1.2;
      }

      .stat-label {
        font-size: 13px;
        color: var(--el-text-color-secondary);
        margin-top: 4px;
      }
    }
  }
}

// 工具栏
.toolbar-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .search-input {
    width: 280px;

    :deep(.el-input__wrapper) {
      border-radius: 10px;
    }
  }

  .filter-select {
    width: 140px;

    :deep(.el-input__wrapper) {
      border-radius: 10px;
    }
  }
}

// 卡片容器
:deep(.sc-table-card-grid) {
  padding: 24px 32px;
}

// 软件卡片
.soft-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--el-bg-color);
  border-radius: 14px;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.25s ease;
  padding: 18px;
  height: 100%;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1);
    border-color: var(--el-color-primary-light-5);
  }

  .soft-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .soft-card-title {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .soft-card-icon {
    font-size: 24px;
    color: var(--el-color-primary);
  }

  .name {
    font-weight: 600;
    font-size: 15px;
    color: var(--el-text-color-primary);
  }

  .soft-badges {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .soft-meta {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    display: flex;
    align-items: center;
  }

  .soft-desc {
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    flex: 1;
  }

  .soft-actions {
    display: flex;
    gap: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--el-border-color-lighter);
    margin-top: auto;
  }
}

// 响应式
@media (max-width: 1200px) {
  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .modern-header {
    padding: 20px;

    .header-content {
      flex-direction: column;
      gap: 16px;
      align-items: flex-start;
    }

    .header-actions {
      width: 100%;
      flex-wrap: wrap;
      justify-content: flex-start;
    }
  }

  .stats-section {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 16px;

    .stat-card {
      padding: 16px;

      .stat-info .stat-value {
        font-size: 24px;
      }
    }
  }

  .toolbar-section {
    flex-direction: column;
    gap: 12px;
    padding: 16px;

    .toolbar-left {
      flex-wrap: wrap;
      width: 100%;
    }

    .search-input {
      width: 100%;
    }

    .filter-select {
      flex: 1;
      min-width: 100px;
    }
  }

  :deep(.sc-table-card-grid) {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .stats-section {
    grid-template-columns: 1fr;
  }
}
</style>
