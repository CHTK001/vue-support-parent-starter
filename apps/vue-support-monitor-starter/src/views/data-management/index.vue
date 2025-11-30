<template>
  <div class="data-management-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <div class="page-title-section">
            <div class="title-icon">
              <IconifyIconOnline icon="ri:database-2-line" />
            </div>
            <div class="title-content">
              <h1 class="page-title">数据管理中心</h1>
              <p class="page-subtitle">
                统一管理各类数据源连接，支持多种数据库类型和实时监控
              </p>
            </div>
          </div>
        </div>
        <div class="header-right">
          <div class="stats-overview">
            <div class="stat-item">
              <div class="stat-number">
                {{ fetchServerStaticData.dataSourceTotal }}
              </div>
              <div class="stat-label">数据源</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">
                {{ fetchServerStaticData.dataSourceType }}
              </div>
              <div class="stat-label">类型</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">
                {{ Object.keys(backupOn).filter((k) => backupOn[k]).length }}
              </div>
              <div class="stat-label">备份中</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar-section">
      <div class="toolbar modern-toolbar">
        <div class="left">
          <el-input
            v-model="searchKey"
            placeholder="搜索名称/类型"
            clearable
            class="w-280"
          >
            <template #prefix>
              <IconifyIconOnline icon="ri:search-line" />
            </template>
          </el-input>
          <el-select
            v-model="typeFilter"
            placeholder="全部类型"
            class="w-200 ml-8"
            clearable
          >
            <el-option label="全部类型" value="" />
            <el-option
              v-for="t in typeOptions"
              :key="t"
              :label="t"
              :value="t"
            />
          </el-select>
          <el-select v-model="sortKey" class="w-160 ml-8">
            <el-option label="按名称排序" value="name" />
            <el-option label="按类型排序" value="type" />
          </el-select>
        </div>
        <div class="right">
          <el-button
            type="primary"
            size="large"
            @click="openEdit()"
            class="create-btn"
          >
            <IconifyIconOnline icon="ri:add-line" />
            新建数据源
          </el-button>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content-section">
      <ScTable
        class="enhanced-card-grid"
        ref="tableRef"
        :loading="loading"
        :url="pageSystemDataSettings"
        :params="queryParams"
        :col-size="5"
        layout="card"
      >
        <template #empty>
          <el-empty description="暂无数据源配置">
            <el-button type="primary" @click="openEdit()">新建配置</el-button>
          </el-empty>
        </template>

        <template #default="{ row: item }">
          <div class="enhanced-card-wrapper">
            <el-card
              :class="[
                'enhanced-data-card',
                getTypeClass(item.systemDataSettingType),
              ]"
              shadow="never"
            >
              <!-- 卡片状态指示器 -->
              <div
                class="card-status-indicator"
                :class="getStatusClass(item)"
              ></div>

              <!-- 卡片头部 -->
              <div class="enhanced-card-header">
                <div class="header-main">
                  <div class="icon-container">
                    <img
                      v-if="item.systemDataSettingIcon"
                      :src="item.systemDataSettingIcon"
                      class="data-icon"
                    />
                    <div
                      v-else
                      class="data-icon-placeholder"
                      :class="getTypeClass(item.systemDataSettingType)"
                    >
                      <IconifyIconOnline
                        :icon="getTypeIcon(item.systemDataSettingType)"
                      />
                    </div>
                  </div>
                  <div class="title-section">
                    <h3 class="data-title" :title="item.systemDataSettingName">
                      {{ item.systemDataSettingName }}
                    </h3>
                    <div class="type-badge">
                      <el-tag
                        :type="getTypeTag(item.systemDataSettingType)"
                        size="small"
                        effect="light"
                      >
                        {{ item.systemDataSettingType }}
                      </el-tag>
                    </div>
                  </div>
                </div>
                <div class="header-actions">
                  <div class="quick-actions">
                    <el-tooltip
                      v-if="capOf(item)?.document"
                      content="查看文档"
                      placement="top"
                    >
                      <el-button
                        class="quick-action-btn"
                        size="small"
                        text
                        @click.stop="viewDocument(item)"
                      >
                        <IconifyIconOnline icon="ri:file-text-line" />
                      </el-button>
                    </el-tooltip>
                    <el-tooltip
                      v-if="capOf(item)?.backup"
                      :content="
                        backupOn[item.systemDataSettingId!]
                          ? '停止备份'
                          : '开始备份'
                      "
                      placement="top"
                    >
                      <el-button
                        class="quick-action-btn"
                        :class="{
                          'backup-active': backupOn[item.systemDataSettingId!],
                        }"
                        size="small"
                        text
                        @click.stop="toggleBackup(item)"
                      >
                        <IconifyIconOnline
                          :icon="
                            backupOn[item.systemDataSettingId!]
                              ? 'ri:pause-line'
                              : 'ri:play-line'
                          "
                        />
                      </el-button>
                    </el-tooltip>
                    <el-tooltip
                      v-if="isJdbcItem(item)"
                      content="上传驱动"
                      placement="top"
                    >
                      <el-upload
                        :auto-upload="false"
                        :show-file-list="false"
                        :on-change="(f) => onUploadDriver(item, f)"
                        class="upload-action"
                      >
                        <el-button class="quick-action-btn" size="small" text>
                          <IconifyIconOnline icon="ri:upload-2-line" />
                        </el-button>
                      </el-upload>
                    </el-tooltip>
                    <el-tooltip content="编辑配置" placement="top">
                      <el-button
                        class="quick-action-btn"
                        size="small"
                        text
                        @click.stop="openEdit(item)"
                      >
                        <IconifyIconOnline icon="ri:edit-line" />
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="删除数据源" placement="top">
                      <el-button
                        class="quick-action-btn danger"
                        size="small"
                        text
                        @click.stop="remove(item)"
                      >
                        <IconifyIconOnline icon="ri:delete-bin-line" />
                      </el-button>
                    </el-tooltip>
                  </div>
                </div>
              </div>

              <!-- 卡片主体内容 -->
              <div class="enhanced-card-body">
                <div class="connection-info">
                  <div class="info-item">
                    <div class="info-icon">
                      <IconifyIconOnline icon="ri:terminal-line" />
                    </div>
                    <div class="info-content">
                      <div class="info-label">控制台类型</div>
                      <div class="info-value">
                        {{ item.systemDataSettingConsoleType || "未配置" }}
                      </div>
                    </div>
                  </div>
                  <div class="info-item">
                    <div class="info-icon">
                      <IconifyIconOnline icon="ri:link-m" />
                    </div>
                    <div class="info-content">
                      <div class="info-label">连接地址</div>
                      <div class="info-value" :title="addressOf(item)">
                        {{ addressOf(item) }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 连接状态 -->
                <div class="connection-status">
                  <div
                    class="status-indicator"
                    :class="getConnectionStatus(item)"
                  >
                    <div class="status-dot"></div>
                    <span class="status-text">{{
                      getConnectionStatusText(item)
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- 背景装饰 -->
              <div class="card-decoration" :style="bgStyle(item)"></div>

              <!-- 操作按钮 -->
              <div class="enhanced-card-actions" @click.stop>
                <div class="action-buttons">
                  <el-tooltip content="打开控制台" placement="top">
                    <el-button
                      size="small"
                      type="primary"
                      @click.stop.prevent="openConsole(item)"
                      class="action-btn primary-action"
                    >
                      <IconifyIconOnline icon="ri:login-circle-line" />
                    </el-button>
                  </el-tooltip>
                </div>
              </div>
            </el-card>
          </div>
        </template>
      </ScTable>
    </div>

    <!-- 对话框组件 -->
    <EditDialog
      v-model:visible="showEdit"
      :model-value="current"
      @success="load"
    />
    <el-dialog
      v-model="showDoc"
      title="数据源文档"
      width="80%"
      draggable
      class="doc-dialog"
    >
      <iframe
        :src="docUrl"
        style="width: 100%; height: 70vh; border: none; border-radius: 8px"
      ></iframe>
    </el-dialog>
    <ConsoleSettingDialog
      v-model="showSetting"
      :setting-id="settingId"
      :setting-type="settingType"
      @saved="onSavedSetting"
    />
    <BackConsoleDialog
      :visibe="showBackupDialog"
      :data="backupLogList"
      @close="onCloseBackupDialog"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  watch,
  reactive,
} from "vue";
import {
  pageSystemDataSettings,
  deleteSystemDataSetting,
  type SystemDataSetting,
  uploadJdbcDriver,
  getDocumentHtmlUrl,
  startBackup,
  stopBackup,
  backupStatus,
  querySystemDataSeries,
  fetchServerStatic,
} from "@/api/system-data";
import { useRouter } from "vue-router";
import { ServerDataStatic } from "@/types/server-data";
import EditDialog from "./modules/EditDialog.vue";
import ConsoleSettingDialog from "./modules/ConsoleSettingDialog.vue";
import { ElMessage, ElMessageBox } from "element-plus";
import BackConsoleDialog from "./modules/BackConsoleDialog.vue";
import { format } from "sql-formatter";
import Prism from "prismjs"; // ② 高亮核心
import "prismjs/components/prism-sql"; // ③ SQL 语法文件
import "prismjs/themes/prism-tomorrow.css"; // ④ 主题（任选）

const loading = ref(false);
const list = ref<SystemDataSetting[]>([]);
const router = useRouter();
const capMap = ref<
  Record<number, { backup?: boolean; document?: boolean; file?: boolean }>
>({});
const backupOn = ref<Record<number, boolean>>({});
const showDoc = ref(false);
const docUrl = ref("");

// 实时计数：备份与日志
const backupCounts = ref<Record<number, number>>({});
const logCounts = ref<Record<number, number>>({});

// 备份列表对话框
const showBackupDialog = ref(false);
const currentSettingIdForBackup = ref<number | null>(null);
const backupList = ref<any[]>([]);
async function openBackupList(row: SystemDataSetting) {
  currentSettingIdForBackup.value = row.systemDataSettingId || null;
  showBackupDialog.value = true;
}

async function onCloseBackupDialog() {
  showBackupDialog.value = false;
}

async function loadBackupList() {
  if (!currentSettingIdForBackup.value) return;
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const res = await querySystemDataSeries({
    name: "system:data:backup",
    keyword: `settingId:${currentSettingIdForBackup.value}`,
    fromTimestamp: now - 7 * dayMs,
    toTimestamp: now,
    offset: 0,
    count: 100,
    sort: "timestamp desc",
  });
  // 后端返回结构未知，这里尽量兼容常见字段
  const items = (res?.data?.items ||
    res?.data?.data ||
    res?.data ||
    []) as any[];
  backupList.value = Array.isArray(items) ? items : [];
}

const showEdit = ref(false);
const current = ref<SystemDataSetting | null>(null);

const fetchServerStaticData = ref<ServerDataStatic>({} as ServerDataStatic);
const showSetting = ref(false);
const settingId = ref<number | null>(null);
const settingType = ref<string | undefined>(undefined);
const backupLogList = reactive<any>([]);
const tableRef = ref();
// 过滤与排序
const searchKey = ref("");
const typeFilter = ref<string | "">("");
const sortKey = ref<"name" | "type">("name");

const typeOptions = computed(
  () =>
    Array.from(
      new Set(list.value.map((i) => i.systemDataSettingType).filter(Boolean))
    ) as string[]
);

// 交给 ScTable 处理分页与过滤，这里保留 options 构建
const queryParams = ref({ current: 1, size: 20, name: "", type: "" });
watch([searchKey, typeFilter], () => {
  queryParams.value = {
    ...queryParams.value,
    current: 1,
    name: searchKey.value,
    type: typeFilter.value || "",
  };
});

function getTypeTag(
  type?: string
): "success" | "warning" | "info" | "primary" | "danger" {
  const t = (type || "").toLowerCase();
  if (t.includes("jdbc") || t.includes("sql")) {
    return "success";
  }
  if (t.includes("redis")) {
    return "warning";
  }
  if (t.includes("zk") || t.includes("zookeeper")) {
    return "info";
  }
  return "info";
}

function addressOf(i: SystemDataSetting) {
  return (
    i.systemDataSettingServer ||
    (i.systemDataSettingHost
      ? `${i.systemDataSettingHost}:${i.systemDataSettingPort || ""}`
      : "-")
  );
}

function getTypeClass(type?: string) {
  const t = (type || "").toLowerCase();
  if (t.includes("jdbc") || t.includes("sql")) {
    return "is-jdbc";
  }
  if (t.includes("redis")) {
    return "is-redis";
  }
  if (t.includes("zk") || t.includes("zookeeper")) {
    return "is-zk";
  }
  return "is-default";
}

function isJdbcItem(row: SystemDataSetting) {
  const type = (row.systemDataSettingType || "").toLowerCase();
  const url = (row.systemDataSettingServer || "").toLowerCase();
  return (
    type.includes("jdbc") || type.includes("sql") || url.startsWith("jdbc:")
  );
}

async function load() {
  tableRef.value.reload();
}

function openEdit(row?: SystemDataSetting) {
  current.value = row ? { ...row } : (null as any);
  showEdit.value = true;
}

function openConsole(row: SystemDataSetting) {
  const type = (row.systemDataSettingType || "").toLowerCase();
  let _url = "";
  if (
    type.includes("jdbc") ||
    type.includes("sql") ||
    (row.systemDataSettingServer || "").toLowerCase().startsWith("jdbc:")
  ) {
    _url = router.resolve({
      name: "dataJdbcConsoleFull",
      query: { id: row.systemDataSettingId },
    }).href;
  }
  else if (type.includes("redis")) {
    _url = router.resolve({
      name: "dataRedisConsoleFull",
      query: { id: row.systemDataSettingId },
    }).href;
  }
  else if (type.includes("zk") || type.includes("zookeeper")) {
    _url = router.resolve({
      name: "dataZookeeperConsoleFull",
      query: { id: row.systemDataSettingId },
    }).href;
  }
 else  if (type.includes("influx")) {
    _url = router.resolve({
      name: "dataInfluxConsoleFull",
      query: { id: row.systemDataSettingId },
    }).href;
  }
  else if (type.includes("mqtt")) {
    _url = router.resolve({
      name: "dataMqttConsoleFull",
      query: { id: row.systemDataSettingId },
    }).href;
  }
  else if (
    type.includes("graph") ||
    type.includes("graphdb") ||
    type.includes("neo4j")
  ) {
    _url = router.resolve({
      name: "dataGraphConsoleFull",
      query: { id: row.systemDataSettingId },
    }).href;
  }
  else if (type.includes("email")) {
    _url = router.resolve({
      name: "dataEmailConsoleFull",
      query: { id: row.systemDataSettingId },
    }).href;
  }
   window.open(_url, '_blank')
}

function openSetting(row: SystemDataSetting) {
  settingId.value = row.systemDataSettingId as number;
  settingType.value = row.systemDataSettingType;
  showSetting.value = true;
}

function onSavedSetting() {
  ElMessage.success("已保存控制台设置");
}

async function remove(row: SystemDataSetting) {
  await ElMessageBox.confirm(`确定删除 ${row.systemDataSettingName}?`, "提示", {
    type: "warning",
  });
  const res = await deleteSystemDataSetting(row.systemDataSettingId as number);
  if (res?.success) {
    ElMessage.success("已删除");
    load();
  }
}

function viewDocument(row: SystemDataSetting) {
  docUrl.value = getDocumentHtmlUrl(row.systemDataSettingId as number);
  showDoc.value = true;
}

async function toggleBackup(row: SystemDataSetting) {
  const id = row.systemDataSettingId as number;
  const on = backupOn.value[id];
  const res = on ? await stopBackup(id) : await startBackup(id);
  if (!res?.success) {
    ElMessage.error(res?.msg || "操作失败");
    return;
  }
  backupOn.value[id] = !on;
}

async function onUploadDriver(row: SystemDataSetting, fileEvent: any) {
  try {
    const raw = fileEvent?.raw as File;
    if (!raw) {
      return;
    }
    if (!row.systemDataSettingId) {
      ElMessage.warning("请先保存配置再上传驱动");
      return;
    }
    const res = await uploadJdbcDriver(row.systemDataSettingId, raw);
    if (!res?.success) {
      ElMessage.error(res?.msg || "上传失败");
      return;
    }
    ElMessage.success("上传成功");
  } catch (e: any) {
    ElMessage.error(e?.message || "上传失败");
  }
}

function capOf(item: any) {
  if (!item) return {};
  return {
    backup: item.capabilitiesBackup,
    document: item.capabilitiesDocument,
    file: item.capabilitiesFile,
  };
}

function bgStyle(item: SystemDataSetting) {
  const img = item.systemDataSettingImageUrl || item.systemDataSettingIcon;
  return img ? { backgroundImage: `url(${img})` } : {};
}

// 新增的UI辅助函数
function getTypeIcon(type?: string): string {
  const t = (type || "").toLowerCase();
  if (
    t.includes("jdbc") ||
    t.includes("sql") ||
    t.includes("mysql") ||
    t.includes("postgres")
  ) {
    return "ri:database-2-line";
  }
  if (t.includes("redis")) {
    return "ri:stack-line";
  }
  if (t.includes("zk") || t.includes("zookeeper")) {
    return "ri:node-tree";
  }
  if (t.includes("influx")) {
    return "ri:line-chart-line";
  }
  if (t.includes("mqtt")) {
    return "ri:wireless-charging-line";
  }
  if (t.includes("graph") || t.includes("neo4j")) {
    return "ri:share-circle-line";
  }
  if (t.includes("email")) {
    return "ri:mail-line";
  }
  return "ri:database-line";
}

function getStatusClass(item: SystemDataSetting): string {
  // 这里可以根据实际的连接状态来判断
  // 暂时使用随机状态作为示例
  const statuses = ["connected", "disconnected", "warning"];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

function getConnectionStatus(item: SystemDataSetting): string {
  // 根据实际情况判断连接状态
  const hasAddress = addressOf(item) !== "-";
  const hasConsole = item.systemDataSettingConsoleType;

  if (hasAddress && hasConsole) {
    return "status-connected";
  } else if (hasAddress) {
    return "status-warning";
  }
  return "status-disconnected";
}

function getConnectionStatusText(item: SystemDataSetting): string {
  const status = getConnectionStatus(item);
  switch (status) {
    case "status-connected":
      return "已连接";
    case "status-warning":
      return "配置中";
    case "status-disconnected":
      return "未连接";
    default:
      return "未知";
  }
}
/**
 * 服务器静态数据
 */
const fetchServerStaticDataFunction = () => {
  fetchServerStatic().then((res) => {
    fetchServerStaticData.value = res.data;
  });
};

onMounted(() => {
  load();
  fetchServerStaticDataFunction();
});
</script>

<style scoped>
/* 页面主容器 */
.data-management-page {
  background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 50%, #f8fafc 100%);
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.data-management-page::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.data-management-page::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.data-management-page > * {
  position: relative;
  z-index: 1;
}

/* 页面头部 */
.page-header {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  padding: 28px 32px;
  margin-bottom: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
}
.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
}

.page-title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28px;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.35);
  animation: iconFloat 3s ease-in-out infinite;
}

@keyframes iconFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.title-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 16px;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

/* 统计概览 */
.stats-overview {
  display: flex;
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 18px 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.6);
  min-width: 100px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.stat-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-item:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}

.stat-item:hover::before {
  opacity: 1;
}

.stat-item:nth-child(1) .stat-number { color: #3b82f6; }
.stat-item:nth-child(2) .stat-number { color: #8b5cf6; }
.stat-item:nth-child(3) .stat-number { color: #10b981; }

.stat-number {
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
  background: linear-gradient(135deg, currentColor, currentColor);
  -webkit-background-clip: text;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-top: 6px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.toolbar-section {
  padding: 0 32px;
  margin-bottom: 20px;
}

.modern-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  padding: 20px 28px;
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(226, 232, 240, 0.6);
}

.modern-toolbar .left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.w-280 {
  width: 280px;
}

.w-200 {
  width: 200px;
}

.w-160 {
  width: 160px;
}

/* 搜索框和下拉框美化 */
.modern-toolbar :deep(.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: none;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.modern-toolbar :deep(.el-input__wrapper:hover) {
  border-color: #cbd5e1;
}

.modern-toolbar :deep(.el-input__wrapper.is-focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.modern-toolbar :deep(.el-select .el-input__wrapper) {
  border-radius: 12px;
}

.create-btn {
  padding: 14px 28px;
  border-radius: 14px;
  font-weight: 600;
  font-size: 15px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.35);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
}

.create-btn:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.45);
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

.create-btn:active {
  transform: translateY(0) scale(0.98);
}

.content-section {
  padding: 0 32px 32px;
  flex: 1;
  overflow: auto;
}

/* 增强卡片网格 */
.enhanced-card-grid {
  --gap: 16px;
}

/* 卡片包装器 */
.enhanced-card-wrapper {
  height: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: cardFadeIn 0.5s ease forwards;
  opacity: 0;
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.enhanced-card-wrapper:nth-child(1) { animation-delay: 0.05s; }
.enhanced-card-wrapper:nth-child(2) { animation-delay: 0.1s; }
.enhanced-card-wrapper:nth-child(3) { animation-delay: 0.15s; }
.enhanced-card-wrapper:nth-child(4) { animation-delay: 0.2s; }
.enhanced-card-wrapper:nth-child(5) { animation-delay: 0.25s; }
.enhanced-card-wrapper:nth-child(6) { animation-delay: 0.3s; }
.enhanced-card-wrapper:nth-child(7) { animation-delay: 0.35s; }
.enhanced-card-wrapper:nth-child(8) { animation-delay: 0.4s; }

.enhanced-card-wrapper:hover {
  transform: translateY(-10px);
}

/* 增强数据卡片 */
.enhanced-data-card {
  height: 100%;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%);
  backdrop-filter: blur(10px);
  position: relative;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.enhanced-data-card:hover {
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.12);
}

/* 卡片状态指示器 */
.card-status-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  z-index: 2;
}

.card-status-indicator.connected {
  background: linear-gradient(90deg, #10b981, #059669);
}

.card-status-indicator.warning {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.card-status-indicator.disconnected {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

/* 增强卡片头部 */
.enhanced-card-header {
  padding: 16px 16px 10px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
  z-index: 1;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.icon-container {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

.data-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
}

.data-icon-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #fff;
  border-radius: 10px;
}

.data-icon-placeholder.is-jdbc {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.data-icon-placeholder.is-redis {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.data-icon-placeholder.is-zk {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.data-icon-placeholder.is-default {
  background: linear-gradient(135deg, #64748b, #475569);
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.data-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.type-badge {
  align-self: flex-start;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quick-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 10;
}

.enhanced-card-wrapper:hover .quick-actions {
  opacity: 1;
}

.quick-action-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  color: #64748b;
  transition: all 0.2s ease;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.quick-action-btn:hover {
  background: rgba(255, 255, 255, 1);
  border-color: #3b82f6;
  color: #3b82f6;
  transform: scale(1.1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.quick-action-btn.backup-active {
  background: linear-gradient(135deg, #67c23a, #85ce61);
  color: var(--el-text-color-primary);
  border-color: #67c23a;
}

.quick-action-btn.backup-active:hover {
  background: linear-gradient(135deg, #85ce61, #67c23a);
  transform: scale(1.1);
}

.quick-action-btn.danger {
  color: #ef4444;
}

.quick-action-btn.danger:hover {
  background: linear-gradient(135deg, #f56c6c, #f78989);
  color: var(--el-text-color-primary);
  border-color: #f56c6c;
}

.upload-action {
  display: inline-block;
}

.upload-action .el-upload {
  display: inline-block;
}

.status-badges {
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-badge {
  transition: all 0.2s ease;
}

.status-badge:hover {
  transform: scale(1.05);
}

/* 增强卡片主体 */
.enhanced-card-body {
  padding: 0 16px 12px;
  position: relative;
  z-index: 1;
}

.connection-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  transition: all 0.2s ease;
}

.info-item:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: #cbd5e1;
}

.info-icon {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 12px;
  flex-shrink: 0;
}

.info-content {
  flex: 1;
  min-width: 0;
}

.info-label {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 1px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.info-value {
  font-size: 12px;
  color: #1e293b;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.connection-status {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-indicator.status-connected .status-dot {
  background: #10b981;
}

.status-indicator.status-connected .status-text {
  color: #059669;
}

.status-indicator.status-warning .status-dot {
  background: #f59e0b;
}

.status-indicator.status-warning .status-text {
  color: #d97706;
}

.status-indicator.status-disconnected .status-dot {
  background: #ef4444;
}

.status-indicator.status-disconnected .status-text {
  color: #dc2626;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 卡片装饰背景 */
.card-decoration {
  position: absolute;
  top: 0;
  right: 0;
  width: 80px;
  height: 80px;
  background-size: cover;
  background-position: center;
  opacity: 0.08;
  border-radius: 0 16px 0 0;
  pointer-events: none;
  z-index: 0;
}

/* 增强操作按钮 */
.enhanced-card-actions {
  padding: 10px 16px 14px;
  border-top: 1px solid rgba(226, 232, 240, 0.6);
  background: rgba(248, 250, 252, 0.5);
  opacity: 0;
  transform: translateY(8px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.enhanced-card-wrapper:hover .enhanced-card-actions {
  opacity: 1;
  transform: translateY(0);
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s ease;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.8);
  color: #64748b;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 1);
  border-color: #cbd5e1;
  color: #475569;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.primary-action {
  width: 100%;
  height: auto;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border: none;
  color: #fff;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.primary-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  background: linear-gradient(135deg, #1d4ed8, #1e40af);
  color: #fff;
}

.secondary-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.backup-active {
  background: rgba(16, 185, 129, 0.1);
  border-color: #10b981;
  color: #059669;
}

.backup-active:hover {
  background: rgba(16, 185, 129, 0.2);
  border-color: #059669;
  color: #059669;
}

.danger-action {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
  color: #dc2626;
}

.danger-action:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: #dc2626;
  color: #dc2626;
}

.upload-action {
  display: inline-block;
}

.upload-action .action-btn {
  width: 32px;
  height: 32px;
}

/* 按钮风格系统 */
.btn-solid-primary {
  --btn-bg: var(--el-color-primary);
  --btn-bg-hover: var(--el-color-primary-light-3);
  --btn-text: #fff;
  background: var(--btn-bg);
  color: var(--btn-text);
  border: none;
}

.btn-solid-primary:hover {
  background: var(--btn-bg-hover);
  color: #fff;
}

.btn-soft {
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-primary);
  border: 1px solid var(--el-border-color-lighter);
}

.btn-soft:hover {
  background: var(--el-fill-color);
}

.btn-soft-danger {
  background: rgba(244, 63, 94, 0.06);
  color: var(--el-color-danger);
  border: 1px solid rgba(244, 63, 94, 0.18);
}

.btn-soft-danger:hover {
  background: rgba(244, 63, 94, 0.1);
}

/* 空状态样式 */
.empty-wrap {
  padding: 80px 40px;
  text-align: center;
  background: var(--el-bg-color-overlay);
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin: 20px 0;
}

.empty-icon {
  width: 120px;
  height: 120px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: #94a3b8;
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
}

.empty-description {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  max-width: 400px;
  margin: 0 auto 32px;
}

.empty-action {
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border: none;
  color: var(--el-text-color-primary);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  transition: all 0.2s ease;
}

.empty-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* 对话框样式 */
.doc-dialog :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

.doc-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-bottom: 1px solid #e2e8f0;
  padding: 20px 24px;
}

.doc-dialog :deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.doc-dialog :deep(.el-dialog__body) {
  padding: 0;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 24px;
  }

  .stats-overview {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 24px 16px;
  }

  .toolbar-section,
  .content-section {
    padding: 0 16px;
  }

  .modern-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .modern-toolbar .left {
    flex-direction: column;
    gap: 12px;
  }

  .w-280,
  .w-200,
  .w-160 {
    width: 100%;
  }

  .stats-overview {
    flex-wrap: wrap;
    gap: 12px;
  }

  .stat-item {
    flex: 1;
    min-width: calc(50% - 6px);
  }

  .secondary-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 24px;
  }

  .page-subtitle {
    font-size: 14px;
  }

  .enhanced-card-header {
    padding: 20px 16px 12px;
  }

  .enhanced-card-body {
    padding: 0 16px 12px;
  }

  .enhanced-card-actions {
    padding: 12px 16px 20px;
  }

  .secondary-actions {
    grid-template-columns: 1fr;
  }
}

/* 工具类 */
.text-muted {
  color: #64748b;
}

.text-primary {
  color: #3b82f6;
}

.text-success {
  color: #10b981;
}

.text-warning {
  color: #f59e0b;
}

.text-danger {
  color: #ef4444;
}

.bg-primary {
  background-color: #3b82f6;
}

.bg-success {
  background-color: #10b981;
}

.bg-warning {
  background-color: #f59e0b;
}

.bg-danger {
  background-color: #ef4444;
}

.mr-4 {
  margin-right: 4px;
}
</style>
