<template>
  <div class="app-page system-container">
    <div class="app-hero">
      <div>
        <p class="app-kicker">Monitor</p>
        <h1>应用管理</h1>
        <p class="app-subtitle">集中管理监控项目配置、设备接入和平台信息。</p>
      </div>
      <div class="app-stats">
        <div class="stat-card">
          <span class="stat-value">{{ totalApps }}</span>
          <span class="stat-label">项目总数</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ activeApps }}</span>
          <span class="stat-label">在线项目</span>
        </div>
      </div>
    </div>

    <div class="app-toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="query.keyword"
          clearable
          placeholder="搜索项目名称或平台"
          class="toolbar-input"
          @keyup.enter="reload"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
        <el-select
          v-model="query.platform"
          clearable
          placeholder="选择平台"
          class="toolbar-select"
        >
          <el-option label="全部平台" value="" />
          <el-option label="Spring Boot" value="spring" />
          <el-option label="Node.js" value="node" />
          <el-option label="Python" value="python" />
          <el-option label="Docker" value="docker" />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-button @click="reload">
          <IconifyIconOnline icon="ri:refresh-line" />
          刷新
        </el-button>
        <el-button type="primary" @click="handleOpenEdit({})">
          <IconifyIconOnline icon="ri:add-circle-line" />
          新建项目
        </el-button>
      </div>
    </div>

    <ScTable
      ref="tableRef"
      class="app-table"
      layout="card"
      :col-size="4"
      :page-size="12"
      :url="loadAppData"
    >
      <template #empty>
        <el-empty description="暂无应用配置">
          <el-button type="primary" @click="handleOpenEdit({})">立即创建</el-button>
        </el-empty>
      </template>

      <template #default="{ row: item }">
        <div class="app-card" @click="handleViewDetail(item)">
          <div class="app-card-top">
            <div class="app-icon" :class="getPlatformClass(item.monitorApplicationName)">
              <IconifyIconOnline :icon="getPlatformIcon(item.monitorApplicationName)" />
            </div>
            <div class="app-copy">
              <div class="app-name-row">
                <h3 class="app-name">{{ item.monitorName || "未命名项目" }}</h3>
                <span class="status-pill" :class="getStatusClass(item)">
                  {{ getStatusText(item) }}
                </span>
              </div>
              <p class="app-platform">{{ item.monitorApplicationName || "未知平台" }}</p>
            </div>
          </div>

          <div class="app-metrics">
            <div class="metric-card">
              <span class="metric-label">在线设备</span>
              <span class="metric-value">{{ getOnlineCount(item) }}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">最后更新</span>
              <span class="metric-value">{{ formatTime(item.updateTime) }}</span>
            </div>
          </div>

          <div class="app-actions" @click.stop>
            <el-button size="small" @click="handleViewDetail(item)">
              <IconifyIconOnline icon="ri:eye-line" />
            </el-button>
            <el-button size="small" @click="handleOpenEdit(item)">
              <IconifyIconOnline icon="ri:edit-line" />
            </el-button>
            <el-button size="small" @click="handleCopy(item)">
              <IconifyIconOnline icon="ri:file-copy-line" />
            </el-button>
            <el-button size="small" type="danger" plain @click="handleDelete(item)">
              <IconifyIconOnline icon="ri:delete-bin-line" />
            </el-button>
          </div>
        </div>
      </template>
    </ScTable>

    <EditDialog
      v-model:visible="editDialogVisible"
      :data="currentItem"
      @success="handleEditSuccess"
    />
    <DetailDialog
      v-model:visible="detailDialogVisible"
      :data="detailItem"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { message } from "@repo/utils";
import { fetchAppDelete, fetchAppPageList } from "../../api/monitor/app";
import DetailDialog from "./modules/DetailDialog.vue";
import EditDialog from "./modules/EditDialog.vue";

interface Discovery {
  host: string;
  port: number;
}

interface MonitorApplication {
  monitorId?: number;
  monitorName?: string;
  monitorApplicationName?: string;
  systemDataSettingIcon?: string;
  monitorRequests?: Discovery[];
  updateTime?: string;
}

const tableRef = ref();
const editDialogVisible = ref(false);
const detailDialogVisible = ref(false);
const currentItem = ref<MonitorApplication>({});
const detailItem = ref<MonitorApplication>({});
const appRecords = ref<MonitorApplication[]>([]);
const totalApps = ref(0);

const query = ref({
  keyword: "",
  platform: "",
});

const activeApps = computed(() => {
  return appRecords.value.filter(item => getOnlineCount(item) > 0).length;
});

const normalizePageResult = (payload: any) => {
  const data = payload?.data;
  const records =
    data?.records ||
    data?.data ||
    data?.list ||
    data?.items ||
    [];
  const total =
    data?.total ||
    data?.count ||
    data?.recordsTotal ||
    records.length;

  return {
    records,
    total,
  };
};

const loadAppData = async (params: any) => {
  try {
    const res = await fetchAppPageList({
      ...query.value,
      ...params,
    });
    const { records, total } = normalizePageResult(res);
    appRecords.value = records;
    totalApps.value = total;
    return {
      code: "00000",
      data: {
        records,
        total,
        size: params?.size || 12,
        current: params?.page || 1,
      },
    };
  } catch (error) {
    console.error("获取应用列表失败:", error);
    appRecords.value = [];
    totalApps.value = 0;
    return {
      code: "99999",
      data: {
        records: [],
        total: 0,
        size: params?.size || 12,
        current: params?.page || 1,
      },
    };
  }
};

const reload = () => {
  tableRef.value?.reload?.(query.value, 1);
};

const getOnlineCount = (item: MonitorApplication) => {
  return item.monitorRequests?.length || 0;
};

const getPlatformIcon = (platform?: string) => {
  const iconMap: Record<string, string> = {
    spring: "simple-icons:springboot",
    node: "simple-icons:nodedotjs",
    java: "simple-icons:openjdk",
    python: "simple-icons:python",
    go: "simple-icons:go",
    docker: "simple-icons:docker",
  };
  return iconMap[String(platform || "").toLowerCase()] || "ri:code-box-line";
};

const getPlatformClass = (platform?: string) => {
  const classMap: Record<string, string> = {
    spring: "platform-spring",
    node: "platform-node",
    java: "platform-java",
    python: "platform-python",
    go: "platform-go",
    docker: "platform-docker",
  };
  return classMap[String(platform || "").toLowerCase()] || "platform-default";
};

const getStatusClass = (item: MonitorApplication) => {
  return getOnlineCount(item) > 0 ? "status-online" : "status-offline";
};

const getStatusText = (item: MonitorApplication) => {
  return getOnlineCount(item) > 0 ? "运行中" : "离线";
};

const formatTime = (value?: string) => {
  if (!value) return "未知";
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return "刚刚";
};

const handleOpenEdit = (item: MonitorApplication) => {
  currentItem.value = { ...item };
  editDialogVisible.value = true;
};

const handleEditSuccess = () => {
  editDialogVisible.value = false;
  tableRef.value?.reload?.();
};

const handleViewDetail = (item: MonitorApplication) => {
  detailItem.value = item;
  detailDialogVisible.value = true;
};

const handleCopy = (item: MonitorApplication) => {
  const cloned = { ...item };
  delete cloned.monitorId;
  cloned.monitorName = `${item.monitorName || "应用"}_副本`;
  handleOpenEdit(cloned);
};

const handleDelete = async (item: MonitorApplication) => {
  try {
    await ElMessageBox.confirm("确定删除该应用配置吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    const res = await fetchAppDelete({ monitorId: item.monitorId });
    if (res?.code === "00000") {
      message.success("删除成功");
      tableRef.value?.reload?.();
      return;
    }
    message.error(res?.msg || "删除失败");
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除应用失败:", error);
      message.error("删除失败");
    }
  }
};
</script>

<style scoped lang="scss">
.app-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  min-height: 100%;
  background:
    radial-gradient(circle at top left, rgba(64, 158, 255, 0.12), transparent 28%),
    radial-gradient(circle at top right, rgba(103, 194, 58, 0.08), transparent 24%),
    linear-gradient(180deg, #f7fbff 0%, #f4f7fb 100%);
}

.app-hero {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 28px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
}

.app-kicker {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--el-color-primary);
}

.app-hero h1 {
  margin: 0;
  font-size: 30px;
  line-height: 1.1;
  color: var(--el-text-color-primary);
}

.app-subtitle {
  margin: 10px 0 0;
  color: var(--el-text-color-secondary);
}

.app-stats {
  display: flex;
  gap: 14px;
}

.stat-card {
  min-width: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 18px 20px;
  border-radius: 16px;
  background: linear-gradient(135deg, #fff, #f8fbff);
  border: 1px solid var(--el-border-color-lighter);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.app-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.toolbar-left {
  flex: 1;
}

.toolbar-input {
  max-width: 320px;
}

.toolbar-select {
  width: 180px;
}

.app-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  padding: 18px;
  border-radius: 20px;
  background: linear-gradient(180deg, #fff, #f8fbff);
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.app-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 22px 40px rgba(15, 23, 42, 0.08);
}

.app-card-top {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.app-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  color: #fff;
  font-size: 22px;
  flex-shrink: 0;
}

.platform-spring { background: linear-gradient(135deg, #6db33f, #4a7c59); }
.platform-node { background: linear-gradient(135deg, #339933, #286f28); }
.platform-java { background: linear-gradient(135deg, #f59e0b, #d97706); }
.platform-python { background: linear-gradient(135deg, #3776ab, #2d5a87); }
.platform-go { background: linear-gradient(135deg, #00add8, #0f766e); }
.platform-docker { background: linear-gradient(135deg, #2496ed, #1d4ed8); }
.platform-default { background: linear-gradient(135deg, #64748b, #475569); }

.app-copy {
  flex: 1;
  min-width: 0;
}

.app-name-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
}

.app-name {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.app-platform {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
}

.status-pill {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.status-pill.status-online {
  color: #166534;
  background: #dcfce7;
}

.status-pill.status-offline {
  color: #991b1b;
  background: #fee2e2;
}

.app-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(241, 245, 249, 0.86);
}

.metric-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.metric-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.app-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 960px) {
  .app-hero,
  .app-toolbar {
    flex-direction: column;
  }

  .app-stats {
    width: 100%;
  }

  .stat-card {
    flex: 1;
  }

  .toolbar-left,
  .toolbar-right {
    width: 100%;
    flex-wrap: wrap;
  }

  .toolbar-input,
  .toolbar-select {
    width: 100%;
    max-width: none;
  }
}
</style>
