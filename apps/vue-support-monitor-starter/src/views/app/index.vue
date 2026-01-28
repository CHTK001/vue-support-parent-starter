<template>
  <div class="page flex flex-col system-container modern-bg">
    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ri:apps-2-line" class="title-icon" />
            项目管理
          </h1>
          <p class="page-subtitle">管理和监控您的应用项目配置</p>
        </div>
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-number">{{ totalApps }}</div>
            <div class="stat-label">总项目数</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ activeApps }}</div>
            <div class="stat-label">活跃项目</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 顶部工具栏：搜索 / 类型过滤 / 排序 / 新建 -->
    <div class="toolbar modern-toolbar">
      <div class="left">
        <div class="search-container">
          <el-input
            v-model="query.keyword"
            class="search-input"
            placeholder="搜索项目名称、平台..."
            clearable
          >
            <template #prefix>
              <IconifyIconOnline icon="ep:search" class="search-icon" />
            </template>
          </el-input>
        </div>
        <div class="filter-container">
          <el-select
            v-model="query.platform"
            class="platform-select"
            clearable
            placeholder="选择平台"
          >
            <el-option label="全部平台" value="">
              <div class="option-item">
                <IconifyIconOnline icon="ri:apps-line" class="option-icon" />
                <span>全部平台</span>
              </div>
            </el-option>
            <el-option label="Spring Boot" value="spring">
              <div class="option-item">
                <IconifyIconOnline
                  icon="simple-icons:springboot"
                  class="option-icon spring-icon"
                />
                <span>Spring Boot</span>
              </div>
            </el-option>
            <el-option label="Node.js" value="node">
              <div class="option-item">
                <IconifyIconOnline
                  icon="simple-icons:nodedotjs"
                  class="option-icon node-icon"
                />
                <span>Node.js</span>
              </div>
            </el-option>
            <el-option label="其他" value="other">
              <div class="option-item">
                <IconifyIconOnline icon="ri:more-line" class="option-icon" />
                <span>其他</span>
              </div>
            </el-option>
          </el-select>
        </div>
      </div>
      <div class="right">
        <el-button class="search-btn" @click="reload">
          <IconifyIconOnline icon="ep:search" class="btn-icon" />
          搜索
        </el-button>
        <el-button type="primary" class="create-btn" @click="handleOpenEit({})">
          <IconifyIconOnline icon="ri:add-circle-line" class="btn-icon" />
          新建项目
        </el-button>
      </div>
    </div>

    <div class="relative h-full w-full">
      <ScTable
        class="card-grid"
        :url="fetchAppPageList"
        :col-size="4"
        ref="tableRef"
        layout="card"
      >
        <template #empty>
          <div class="empty-state">
            <div class="empty-illustration w-full">
              <IconifyIconOnline icon="ri:apps-2-line" class="empty-icon" />
            </div>
            <h3 class="empty-title w-full">暂无项目配置</h3>
            <p class="empty-description">开始创建您的第一个项目配置</p>
            <el-button
              type="primary"
              class="empty-action"
              @click="handleOpenEit({})"
            >
              <IconifyIconOnline icon="ri:add-circle-line" class="btn-icon" />
              新建项目
            </el-button>
          </div>
        </template>

        <template #default="{ row: item }">
          <div class="app-card" @click="handleCardClick(item)">
            <!-- 状态指示器 -->
            <div class="status-indicator" :class="getStatusClass(item)"></div>

            <!-- 卡片头部 -->
            <div class="card-header">
              <div class="app-icon-wrapper">
                <img
                  v-if="item.systemDataSettingIcon"
                  :src="item.systemDataSettingIcon"
                  class="app-icon app-icon-img"
                />
                <div
                  v-else
                  class="app-icon app-icon-badge"
                  :class="getPlatformClass(item.monitorApplicationName)"
                >
                  <IconifyIconOnline
                    :icon="getPlatformIcon(item.monitorApplicationName)"
                    class="platform-icon"
                  />
                </div>
                <div class="status-badge" :class="getStatusClass(item)">
                  <IconifyIconOnline
                    :icon="getStatusIcon(item)"
                    class="status-icon"
                  />
                </div>
              </div>
              <div class="app-info">
                <h3 class="app-title" :title="item.monitorName">
                  {{ item.monitorName }}
                </h3>
                <div class="app-platform">
                  <IconifyIconOnline
                    :icon="getPlatformIcon(item.monitorApplicationName)"
                    class="platform-icon-small"
                  />
                  <span>{{ item.monitorApplicationName || "未知平台" }}</span>
                </div>
              </div>
            </div>

            <!-- 卡片内容 -->
            <div class="card-content">
              <div class="metrics-grid">
                <div class="metric-item">
                  <IconifyIconOnline
                    icon="ri:server-line"
                    class="metric-icon online-icon"
                  />
                  <div class="metric-info">
                    <span class="metric-label">在线设备</span>
                    <span
                      class="metric-value online-count"
                      :class="{ 'has-devices': getOnlineCount(item) > 0 }"
                    >
                      {{ getOnlineCount(item) }}
                    </span>
                  </div>
                </div>
                <div class="metric-item">
                  <IconifyIconOnline icon="ri:time-line" class="metric-icon" />
                  <div class="metric-info">
                    <span class="metric-label">最后更新</span>
                    <span class="metric-value">{{
                      formatTime(item.updateTime)
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- 标签区域 -->
              <div class="tags-section" v-if="item.tags && item.tags.length">
                <el-tag
                  v-for="tag in item.tags"
                  :key="tag"
                  size="small"
                  class="app-tag"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>

            <!-- 卡片操作 -->
            <div class="card-actions" @click.stop>
              <div class="action-buttons">
                <el-tooltip content="查看详情" placement="top">
                  <el-button
                    class="action-btn primary"
                    @click.stop="handleViewDetail(item)"
                  >
                    <IconifyIconOnline icon="ri:eye-line" />
                  </el-button>
                </el-tooltip>
                <el-tooltip content="编辑配置" placement="top">
                  <el-button
                    class="action-btn"
                    @click.stop="handleOpenEit(item)"
                  >
                    <IconifyIconOnline icon="ri:edit-line" />
                  </el-button>
                </el-tooltip>
                <el-tooltip content="复制配置" placement="top">
                  <el-button class="action-btn" @click.stop="handleCopy(item)">
                    <IconifyIconOnline icon="ri:file-copy-line" />
                  </el-button>
                </el-tooltip>
                <el-tooltip content="删除" placement="top">
                  <el-button
                    class="action-btn danger"
                    @click.stop="handleDelete(item)"
                  >
                    <IconifyIconOnline icon="ri:delete-bin-line" />
                  </el-button>
                </el-tooltip>
              </div>
            </div>
          </div>
        </template>
      </ScTable>
    </div>
    <EditDialog
      :data="currentData"
      :visible="editDialogStatus"
      @success="handleSuccessOpenEit"
    ></EditDialog>

    <DetailDialog v-model:visible="detailDialogStatus" :data="detailData" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import EditDialog from "./modules/EditDialog.vue";
import DetailDialog from "./modules/DetailDialog.vue";
import { fetchAppDelete, fetchAppPageList } from "@/api/monitor/app";
import { ElMessageBox} from "element-plus";
import { message } from "@repo/utils";

const tableRef = ref<any>();
const editDialogStatus = ref(false);
const detailDialogStatus = ref(false);
const currentData = ref<any>();
const detailData = ref<any>({});
const appList = ref<any[]>([]);

// 查询参数
const query = ref<{ keyword: string; platform: string | undefined }>({
  keyword: "",
  platform: undefined,
});

// 统计数据
const totalApps = computed(() => appList.value.length);
const activeApps = computed(
  () => appList.value.filter((app) => app.status === "active").length
);

const reload = () => {
  tableRef.value?.reload(query.value);
};

// 获取平台图标
const getPlatformIcon = (platform: string) => {
  const platformMap: Record<string, string> = {
    spring: "simple-icons:springboot",
    node: "simple-icons:nodedotjs",
    java: "simple-icons:openjdk",
    python: "simple-icons:python",
    go: "simple-icons:go",
    docker: "simple-icons:docker",
    kubernetes: "simple-icons:kubernetes",
  };
  return platformMap[platform?.toLowerCase()] || "ri:code-box-line";
};

// 获取平台样式类
const getPlatformClass = (platform: string) => {
  const classMap: Record<string, string> = {
    spring: "platform-spring",
    node: "platform-node",
    java: "platform-java",
    python: "platform-python",
    go: "platform-go",
    docker: "platform-docker",
  };
  return classMap[platform?.toLowerCase()] || "platform-default";
};

// 获取在线设备数量
const getOnlineCount = (item: any) => {
  return item.monitorRequests?.length || 0;
};

// 获取状态样式类
const getStatusClass = (item: any) => {
  // 根据在线设备数量判断状态
  const count = getOnlineCount(item);
  if (count === 0) return "status-error";
  return "status-success";
};

// 获取状态图标
const getStatusIcon = (item: any) => {
  const statusClass = getStatusClass(item);
  const iconMap: Record<string, string> = {
    "status-success": "ri:check-line",
    "status-warning": "ri:error-warning-line",
    "status-error": "ri:close-line",
  };
  return iconMap[statusClass] || "ri:question-line";
};

// 获取状态文本
const getStatusText = (item: any) => {
  const statusClass = getStatusClass(item);
  const textMap: Record<string, string> = {
    "status-success": "运行正常",
    "status-warning": "运行异常",
    "status-error": "已停止",
  };
  return textMap[statusClass] || "未知";
};

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return "未知";
  const date = new Date(time);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return "刚刚";
};

// 卡片点击事件
const handleCardClick = (item: any) => {
  // 可以添加卡片点击逻辑，比如跳转到详情页
  console.log("Card clicked:", item);
};

// 查看详情
const handleViewDetail = (item: any) => {
  detailData.value = item;
  detailDialogStatus.value = true;
};

// 复制配置
const handleCopy = (item: any) => {
  const copyData = { ...item };
  delete copyData.monitorId;
  copyData.monitorName = `${item.monitorName}_副本`;
  handleOpenEit(copyData);
};
/**
 * 成功打开编辑
 */
const handleSuccessOpenEit = () => {
  editDialogStatus.value = false;
  tableRef.value.reload();
};
/**
 * 打开编辑
 */
const handleOpenEit = (item: any) => {
  editDialogStatus.value = true;
  currentData.value = item;
};

const handleDelete = (item: any) => {
  ElMessageBox.confirm("确定删除该配置吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    fetchAppDelete({ monitorId: item.monitorId }).then((res) => {
      if (res.code === "00000") {
        tableRef.value.reload();
      }
    });
  });
};
</script>

<style scoped lang="scss">
@import "@/styles/mixins.scss";

.page {
  @include system-container;
  @include modern-bg;
  @include flex-column;
  padding: $padding-container;
  gap: $spacing-lg;
}

/* 页面头部 */
.page-header {
  @include glass-card(0.9, 20px);
  padding: $spacing-lg $spacing-xl;
  margin-bottom: $spacing-lg;
}

.header-content {
  @include flex-between;
  gap: $spacing-2xl;
}

.title-section {
  flex: 1;
}

.page-title {
  font-size: $font-2xl;
  font-weight: $font-weight-semibold;
  margin: 0;
  @include flex-align-center;
  gap: $spacing-sm;
  color: var(--el-text-color-primary);

  .title-icon {
    font-size: $icon-xl;
    color: var(--el-color-primary);
  }
}

.page-subtitle {
  font-size: $font-sm;
  color: var(--el-text-color-secondary);
  margin: $spacing-xs 0 0 0;
}

.stats-section {
  @include flex-align-center;
  gap: $spacing-md;
}

.stat-card {
  @include card-base;
  text-align: center;
  padding: $spacing-md $spacing-lg;
  min-width: 72px;
}

.stat-number {
  font-size: $font-2xl;
  font-weight: $font-weight-bold;
  color: var(--el-color-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: $font-xs;
  color: var(--el-text-color-secondary);
  font-weight: $font-weight-medium;
  margin-top: $spacing-xs;
}

/* 工具栏样式 */
.modern-toolbar {
  @include toolbar-style;
  border-radius: $radius-md;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
}

.modern-toolbar .left {
  @include flex-align-center;
  gap: $spacing-md;
  flex: 1;
}

.modern-toolbar .right {
  @include flex-align-center;
  gap: $spacing-sm;
}

.search-container {
  flex: 1;
  max-width: 320px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: $radius-md;
  background: var(--el-fill-color-light);
  box-shadow: none;
  border: 1px solid transparent;
}

.search-input :deep(.el-input__wrapper):hover,
.search-input :deep(.el-input__wrapper):focus-within {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-bg-color);
}

.search-icon {
  color: var(--el-text-color-placeholder);
}

.filter-container {
  @include flex-align-center;
  gap: $spacing-sm;
}

.platform-select {
  width: 160px;
}

.platform-select :deep(.el-select__wrapper) {
  border-radius: $radius-md;
  background: var(--el-fill-color-light);
  box-shadow: none;
  border: 1px solid transparent;
}

.platform-select :deep(.el-select__wrapper):hover {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-bg-color);
}

.option-item {
  @include flex-align-center;
  gap: $spacing-sm;
}

.option-icon {
  font-size: $icon-sm;
}

.spring-icon {
  color: #6db33f;
}

.node-icon {
  color: #339933;
}

.search-btn,
.create-btn {
  border-radius: $radius-md;
  padding: $spacing-sm $spacing-lg;
  font-weight: $font-weight-medium;
}

.btn-icon {
  margin-right: $spacing-xs;
}

/* 应用卡片 */
.app-card {
  @include card-base;
  @include flex-column;
  height: 100%;
  overflow: hidden;
  cursor: pointer;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: $gradient-line-top;
  }

  &:hover {
    @include card-hover;
    transform: translateY(-6px);
  }
}

/* 状态指示器 */
.status-indicator {
  position: absolute;
  top: $spacing-md;
  right: $spacing-md;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  z-index: 2;

  &.status-success {
    background: var(--el-color-success);
    box-shadow: 0 0 0 2px var(--el-color-success-light-8);
  }

  &.status-warning {
    background: var(--el-color-warning);
    box-shadow: 0 0 0 2px var(--el-color-warning-light-8);
  }

  &.status-error {
    background: var(--el-color-danger);
    box-shadow: 0 0 0 2px var(--el-color-danger-light-8);
  }
}

/* 卡片头部 */
.card-header {
  padding: $spacing-xl $spacing-xl $spacing-lg;
  @include flex-align-center;
  align-items: flex-start;
  gap: $spacing-lg;
  border-bottom: 1px solid $border-light;
}

.app-icon-wrapper {
  position: relative;
  flex-shrink: 0;
}

.app-icon {
  width: 48px;
  height: 48px;
  border-radius: $radius-md;
  @include flex-center;
  font-size: 20px;
  font-weight: $font-weight-semibold;
  color: #fff;
}

.app-icon-img {
  object-fit: cover;
}

.app-icon-badge {
  background: $gradient-primary;
  box-shadow: $shadow-hover-primary;
}

.platform-spring {
  background: linear-gradient(135deg, #6db33f, #4a7c59);
  box-shadow: 0 4px 12px rgba(109, 179, 63, 0.3);
}

.platform-node {
  background: linear-gradient(135deg, #339933, #2d5a2d);
  box-shadow: 0 4px 12px rgba(51, 153, 51, 0.3);
}

.platform-java {
  background: linear-gradient(135deg, #ed8b00, #b8860b);
  box-shadow: 0 4px 12px rgba(237, 139, 0, 0.3);
}

.platform-python {
  background: linear-gradient(135deg, #3776ab, #2d5a87);
  box-shadow: 0 4px 12px rgba(55, 118, 171, 0.3);
}

.platform-go {
  background: linear-gradient(135deg, #00add8, #007d9c);
  box-shadow: 0 4px 12px rgba(0, 173, 216, 0.3);
}

.platform-docker {
  background: linear-gradient(135deg, #2496ed, #1a73e8);
  box-shadow: 0 4px 12px rgba(36, 150, 237, 0.3);
}

.platform-default {
  background: linear-gradient(135deg, #6b7280, #4b5563);
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
}

.platform-icon {
  font-size: $icon-xl;
}

.status-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--el-bg-color);
  @include flex-center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.status-icon {
  font-size: 10px;
}

.status-success .status-icon {
  color: var(--el-color-success);
}

.status-warning .status-icon {
  color: var(--el-color-warning);
}

.status-error .status-icon {
  color: var(--el-color-danger);
}

.app-info {
  flex: 1;
  min-width: 0;
}

.app-title {
  font-size: $font-lg;
  font-weight: $font-weight-bold;
  margin: 0 0 $spacing-xs 0;
  color: var(--el-text-color-primary);
  @include text-ellipsis;
}

.app-platform {
  @include flex-align-center;
  gap: $spacing-xs;
  color: var(--el-text-color-secondary);
  font-size: $font-sm;
}

.platform-icon-small {
  font-size: $icon-sm;
}

/* 卡片内容 */
.card-content {
  padding: $spacing-lg $spacing-xl;
  flex: 1;
}

.metrics-grid {
  @include flex-column;
  gap: $spacing-sm;
}

.metric-item {
  @include flex-align-center;
  gap: $spacing-md;
  padding: $spacing-sm $spacing-md;
  background: var(--el-fill-color-lighter);
  border-radius: $radius-md;
  transition: all $duration-fast $ease-standard;

  &:hover {
    background: var(--el-fill-color-light);
    transform: translateX(2px);
  }
}

.metric-icon {
  font-size: $icon-md;
  color: $primary-color;
  flex-shrink: 0;
}

.metric-info {
  flex: 1;
  min-width: 0;
}

.metric-label {
  display: block;
  font-size: $font-xs;
  color: var(--el-text-color-placeholder);
}

.metric-value {
  font-size: $font-sm;
  font-weight: $font-weight-semibold;
  color: var(--el-text-color-primary);

  &.status-success {
    color: var(--el-color-success);
  }

  &.status-warning {
    color: var(--el-color-warning);
  }

  &.status-error {
    color: var(--el-color-danger);
  }

  &.online-count {
    font-size: $font-md;
    font-weight: $font-weight-bold;
    color: var(--el-text-color-placeholder);

    &.has-devices {
      color: var(--el-color-success);
    }
  }
}

.online-icon {
  color: var(--el-color-success);
}

.tags-section {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.app-tag {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border: none;
  border-radius: 4px;
  font-size: 11px;
}

/* 卡片操作 */
.card-actions {
  padding: 12px 20px 16px;
  background: var(--el-fill-color-lighter);
  border-top: 1px solid var(--el-border-color-extra-light);
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.app-card:hover .card-actions {
  opacity: 1;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s ease;
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-btn.primary {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.action-btn.primary:hover {
  background: #667eea;
  color: #fff;
}

.action-btn.danger {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.action-btn.danger:hover {
  background: #ef4444;
  color: #fff;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  border-radius: 12px;
  margin: 0;
  background: transparent;
}

.empty-illustration {
  margin-bottom: 16px;
}

.empty-icon {
  font-size: 48px;
  color: var(--el-text-color-placeholder);
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 6px 0;
}

.empty-description {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin: 0 0 20px 0;
}

.empty-action {
  border-radius: 8px;
  padding: 8px 20px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    padding: 12px;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .stats-section {
    width: 100%;
    justify-content: space-around;
  }

  .modern-toolbar {
    flex-direction: column;
    align-items: stretch;
    padding: 12px;
  }

  .modern-toolbar .left {
    flex-direction: column;
    align-items: stretch;
  }

  .modern-toolbar .right {
    justify-content: stretch;
  }

  .modern-toolbar .right .el-button {
    flex: 1;
  }

  .search-container {
    max-width: none;
  }

  .filter-container {
    justify-content: stretch;
  }

  .platform-select {
    flex: 1;
    width: auto;
  }

  .card-actions {
    opacity: 1;
  }
}
</style>
