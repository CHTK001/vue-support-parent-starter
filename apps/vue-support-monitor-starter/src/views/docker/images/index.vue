<template>
  <div class="images-management">
    <!-- 页面头部 - 现代化设计 -->
    <div class="page-header-modern">
      <div class="header-content">
        <div class="header-left">
          <div class="title-wrapper">
            <div class="title-icon-box">
              <IconifyIconOnline icon="ri:image-2-line" />
            </div>
            <div class="title-text">
              <h1>镜像管理</h1>
              <p>管理Docker镜像的拉取、安装、导入和导出</p>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <el-button
            @click="handleRefresh"
            :loading="loading"
            class="action-btn"
          >
            <IconifyIconOnline icon="ri:refresh-line" />
          </el-button>
          <el-button @click="syncVisible = true" class="action-btn sync-btn">
            <IconifyIconOnline icon="ri:cloud-line" class="mr-1" />
            同步
          </el-button>
          <el-button
            @click="importVisible = true"
            class="action-btn import-btn"
          >
            <IconifyIconOnline icon="ri:upload-2-line" class="mr-1" />
            导入
          </el-button>
          <el-button
            type="primary"
            @click="pullVisible = true"
            class="action-btn primary-btn"
          >
            <IconifyIconOnline icon="ri:download-cloud-line" class="mr-1" />
            拉取镜像
          </el-button>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon total">
            <IconifyIconOnline icon="ri:stack-line" />
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ total }}</span>
            <span class="stat-label">全部镜像</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon available">
            <IconifyIconOnline icon="ri:checkbox-circle-line" />
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ availableCount }}</span>
            <span class="stat-label">可用</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon pulling">
            <IconifyIconOnline icon="ri:loader-4-line" />
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ pullingCount }}</span>
            <span class="stat-label">拉取中</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon servers">
            <IconifyIconOnline icon="ri:server-line" />
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ servers.length }}</span>
            <span class="stat-label">服务器</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索和分组栏 - 现代化 -->
    <div class="toolbar-modern">
      <div class="search-section">
        <div class="search-box">
          <IconifyIconOnline icon="ri:search-line" class="search-icon" />
          <input
            v-model="searchParams.keyword"
            type="text"
            placeholder="搜索镜像名称、标签..."
            @keyup.enter="handleSearch"
          />
        </div>
        <el-select
          v-model="searchParams.serverId"
          placeholder="全部服务器"
          clearable
          class="filter-select-modern"
          @change="handleSearch"
        >
          <el-option label="全部服务器" :value="undefined" />
          <el-option
            v-for="server in servers"
            :key="server.monitorSysGenServerId"
            :label="server.monitorSysGenServerName"
            :value="server.monitorSysGenServerId"
          />
        </el-select>
        <el-select
          v-model="searchParams.status"
          placeholder="全部状态"
          clearable
          class="filter-select-modern"
          @change="handleSearch"
        >
          <el-option label="全部状态" :value="undefined" />
          <el-option label="可用" value="AVAILABLE" />
          <el-option label="拉取中" value="PULLING" />
          <el-option label="错误" value="PULL_FAILED" />
        </el-select>
      </div>
      <div class="view-toggle">
        <button
          v-for="view in viewOptions"
          :key="view.value"
          :class="['toggle-btn', { active: groupBy === view.value }]"
          @click="
            groupBy = view.value;
            handleGroupChange();
          "
        >
          <IconifyIconOnline :icon="view.icon" />
          <span>{{ view.label }}</span>
        </button>
      </div>
    </div>

    <!-- 分组显示：按服务器分组 - 现代化卡片 -->
    <div v-if="groupBy === 'server'" class="grouped-view-modern">
      <div
        v-for="group in groupedByServer"
        :key="group.serverId"
        class="server-group-card"
      >
        <div class="group-header-modern">
          <div class="group-info">
            <div class="group-icon">
              <IconifyIconOnline icon="ri:server-line" />
            </div>
            <div class="group-text">
              <h3>{{ group.serverName }}</h3>
              <span class="group-count">{{ group.images.length }} 个镜像</span>
            </div>
          </div>
          <el-dropdown trigger="click">
            <button class="more-btn">
              <IconifyIconOnline icon="ri:more-2-fill" />
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  @click="handleExportServerImages(group.serverId)"
                >
                  <IconifyIconOnline icon="ri:download-2-line" class="mr-2" />
                  导出全部镜像
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <div class="images-grid-modern">
          <div
            v-for="image in group.images"
            :key="image.systemSoftImageId"
            class="image-card-modern"
          >
            <div class="image-card-header">
              <div
                class="image-icon-box"
                :style="{
                  background: getImageGradient(image.systemSoftImageName),
                }"
              >
                <IconifyIconOnline icon="ri:box-3-line" />
              </div>
              <div class="image-title">
                <h4>{{ image.systemSoftImageName }}</h4>
                <div class="image-tag-row">
                  <span class="version-tag">{{
                    image.systemSoftImageTag
                  }}</span>
                  <span
                    :class="[
                      'status-dot',
                      getStatusClass(image.systemSoftImageStatus),
                    ]"
                  ></span>
                </div>
              </div>
            </div>
            <div class="image-card-body">
              <div class="image-meta-row">
                <IconifyIconOnline
                  icon="ri:hard-drive-2-line"
                  class="meta-icon"
                />
                <span>{{ formatSize(image.systemSoftImageSize) }}</span>
              </div>
              <div class="image-meta-row">
                <IconifyIconOnline
                  icon="ri:fingerprint-line"
                  class="meta-icon"
                />
                <span class="image-id-text">{{
                  (image.systemSoftImageImageId || "").substring(0, 12)
                }}</span>
              </div>
            </div>
            <div class="image-card-actions">
              <button
                class="card-action-btn primary"
                @click="openInstallContainer(image)"
              >
                <IconifyIconOnline icon="ri:play-circle-line" />
                安装
              </button>
              <button class="card-action-btn" @click="handleExportImage(image)">
                <IconifyIconOnline icon="ri:download-2-line" />
              </button>
              <button
                class="card-action-btn danger"
                @click="handleDeleteImage(image)"
              >
                <IconifyIconOnline icon="ri:delete-bin-line" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分组显示：按镜像分组 - 现代化 -->
    <div v-else-if="groupBy === 'image'" class="grouped-view-modern">
      <div
        v-for="group in groupedByImage"
        :key="group.imageName"
        class="image-group-card"
      >
        <div class="group-header-modern image-header">
          <div class="group-info">
            <div
              class="group-icon image"
              :style="{ background: getImageGradient(group.imageName) }"
            >
              <IconifyIconOnline icon="ri:box-3-line" />
            </div>
            <div class="group-text">
              <h3>{{ group.imageName }}</h3>
              <div class="group-tags">
                <span class="version-tag">{{ group.tag }}</span>
                <span class="server-count"
                  >{{ group.servers.length }} 台服务器</span
                >
              </div>
            </div>
          </div>
        </div>

        <div class="servers-grid-modern">
          <div
            v-for="item in group.servers"
            :key="item.systemSoftImageId"
            class="server-card-modern"
          >
            <div class="server-card-header">
              <div class="server-icon-box">
                <IconifyIconOnline icon="ri:server-line" />
              </div>
              <div class="server-title">
                <h4>{{ item.systemSoftImageServerName }}</h4>
                <span
                  :class="[
                    'status-dot',
                    getStatusClass(item.systemSoftImageStatus),
                  ]"
                ></span>
              </div>
            </div>
            <div class="server-card-body">
              <div class="image-meta-row">
                <IconifyIconOnline
                  icon="ri:hard-drive-2-line"
                  class="meta-icon"
                />
                <span>{{ formatSize(item.systemSoftImageSize) }}</span>
              </div>
              <div class="image-meta-row">
                <IconifyIconOnline
                  icon="ri:fingerprint-line"
                  class="meta-icon"
                />
                <span class="image-id-text">{{
                  (item.systemSoftImageImageId || "").substring(0, 12)
                }}</span>
              </div>
            </div>
            <div class="server-card-actions">
              <button
                class="card-action-btn primary"
                @click="openInstallContainer(item)"
              >
                <IconifyIconOnline icon="ri:play-circle-line" />
                安装
              </button>
              <button class="card-action-btn" @click="handleExportImage(item)">
                <IconifyIconOnline icon="ri:download-2-line" />
              </button>
              <button
                class="card-action-btn danger"
                @click="handleDeleteImage(item)"
              >
                <IconifyIconOnline icon="ri:delete-bin-line" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 列表视图 - 现代化表格 -->
    <div v-else class="list-view-modern">
      <div class="table-wrapper">
        <el-table
          :data="imageList"
          v-loading="loading"
          class="modern-table"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            fontWeight: 600,
          }"
        >
          <el-table-column type="selection" width="50" />

          <el-table-column label="镜像" min-width="260">
            <template #default="{ row }">
              <div class="table-image-cell">
                <div
                  class="image-icon-mini"
                  :style="{
                    background: getImageGradient(row.systemSoftImageName),
                  }"
                >
                  <IconifyIconOnline icon="ri:box-3-line" />
                </div>
                <div class="image-info-cell">
                  <span class="image-name-text">{{
                    row.systemSoftImageName
                  }}</span>
                  <span class="version-tag-mini">{{
                    row.systemSoftImageTag
                  }}</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="服务器" width="180">
            <template #default="{ row }">
              <div class="table-server-cell">
                <IconifyIconOnline
                  icon="ri:server-line"
                  class="server-icon-mini"
                />
                <span>{{ row.systemSoftImageServerName }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="大小" width="120">
            <template #default="{ row }">
              <span class="size-text">{{
                formatSize(row.systemSoftImageSize)
              }}</span>
            </template>
          </el-table-column>

          <el-table-column label="镜像ID" width="140">
            <template #default="{ row }">
              <span class="image-id-text">{{
                (row.systemSoftImageImageId || "").substring(0, 12)
              }}</span>
            </template>
          </el-table-column>

          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <span
                :class="[
                  'status-badge',
                  getStatusClass(row.systemSoftImageStatus),
                ]"
              >
                {{ getStatusText(row.systemSoftImageStatus) }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <div class="table-actions">
                <el-tooltip content="安装容器" placement="top">
                  <button
                    class="table-action-btn primary"
                    @click="openInstallContainer(row)"
                  >
                    <IconifyIconOnline icon="ri:play-circle-line" />
                  </button>
                </el-tooltip>
                <el-tooltip content="导出" placement="top">
                  <button
                    class="table-action-btn"
                    @click="handleExportImage(row)"
                  >
                    <IconifyIconOnline icon="ri:download-2-line" />
                  </button>
                </el-tooltip>
                <el-tooltip content="删除" placement="top">
                  <button
                    class="table-action-btn danger"
                    @click="handleDeleteImage(row)"
                  >
                    <IconifyIconOnline icon="ri:delete-bin-line" />
                  </button>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="searchParams.page"
          v-model:page-size="searchParams.size"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadImages"
          @current-change="loadImages"
        />
      </div>
    </div>

    <!-- 拉取镜像对话框 -->
    <PullImageDialog v-model:visible="pullVisible" @success="handleRefresh" />

    <!-- 安装容器对话框 -->
    <InstallContainerDialog
      v-model:visible="installContainerVisible"
      :image="currentImage"
      @success="handleInstallSuccess"
    />

    <!-- 同步镜像对话框 -->
    <ImageSyncDialog
      v-model:visible="syncVisible"
      @success="handleSyncSuccess"
    />

    <!-- 导入镜像对话框 -->
    <ImageImportDialog
      v-model:visible="importVisible"
      @success="handleImportSuccess"
    />

    <!-- Socket消息进度对话框 - 镜像操作进度 -->
    <ScSocketMessageDialog
      ref="progressDialogRef"
      mode="dialog"
      layout="log"
      position="bottom-right"
      :title="progressTitle"
      :event-id="progressEventId"
      :event-name="[
        'image-pull-progress',
        'image-sync-progress',
        'image-export-progress',
        'image-import-progress',
      ]"
      :visible="progressVisible"
      :width="450"
      :dialog-height="320"
      @update:visible="progressVisible = $event"
      @close="handleProgressClose"
      @data="handleProgressData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { ElMessage, ElMessageBox, ElNotification } from "element-plus";
import { useGlobalSocket, MonitorTopics } from "@repo/core";
import { imageApi, getServerList, type SystemSoftImage } from "@/api/docker";
import PullImageDialog from "./components/PullImageDialog.vue";
import InstallContainerDialog from "./components/InstallContainerDialog.vue";
import ImageSyncDialog from "./components/ImageSyncDialog.vue";
import ImageImportDialog from "./components/ImageImportDialog.vue";
import ScSocketMessageDialog from "@repo/components/ScSocketMessageDialog/index.vue";

/**
 * 镜像管理页面 - 现代化重构版本
 * 集成 ScSocketMessageDialog 监听后台推送消息
 * @author CH
 * @version 2.0.0
 * @since 2025-12-04
 */

const loading = ref(false);
const pullVisible = ref(false);
const installContainerVisible = ref(false);
const syncVisible = ref(false);
const importVisible = ref(false);
const currentImage = ref<SystemSoftImage | null>(null);

const groupBy = ref<"server" | "image" | "none">("none");
const imageList = ref<SystemSoftImage[]>([]);
const servers = ref<any[]>([]);
const total = ref(0);

// Socket消息对话框相关
const progressDialogRef = ref();
const progressVisible = ref(false);
const progressTitle = ref("操作进度");
const progressEventId = ref("");

// 视图切换选项
const viewOptions = [
  { value: "server", label: "服务器", icon: "ri:server-line" },
  { value: "image", label: "镜像", icon: "ri:box-3-line" },
  { value: "none", label: "列表", icon: "ri:list-check" },
];

const searchParams = ref({
  page: 1,
  size: 20,
  keyword: "",
  serverId: undefined as number | undefined,
  status: undefined as string | undefined,
});

// 统计数据
const availableCount = computed(
  () =>
    imageList.value.filter((img) => img.systemSoftImageStatus === "AVAILABLE")
      .length
);
const pullingCount = computed(
  () =>
    imageList.value.filter((img) => img.systemSoftImageStatus === "PULLING")
      .length
);

// 获取全局Socket服务
const globalSocket = useGlobalSocket();

// 按服务器分组
const groupedByServer = computed(() => {
  const groups = new Map<
    number,
    { serverId: number; serverName: string; images: SystemSoftImage[] }
  >();

  imageList.value.forEach((image) => {
    const serverId = image.systemSoftImageServerId!;
    if (!groups.has(serverId)) {
      groups.set(serverId, {
        serverId,
        serverName: image.systemSoftImageServerName || "",
        images: [],
      });
    }
    groups.get(serverId)!.images.push(image);
  });

  return Array.from(groups.values());
});

// 按镜像分组
const groupedByImage = computed(() => {
  const groups = new Map<
    string,
    { imageName: string; tag: string; servers: SystemSoftImage[] }
  >();

  imageList.value.forEach((image) => {
    const key = `${image.systemSoftImageName}:${image.systemSoftImageTag}`;
    if (!groups.has(key)) {
      groups.set(key, {
        imageName: image.systemSoftImageName || "",
        tag: image.systemSoftImageTag || "",
        servers: [],
      });
    }
    groups.get(key)!.servers.push(image);
  });

  return Array.from(groups.values());
});

// 加载镜像列表
async function loadImages() {
  try {
    loading.value = true;
    const params: any = { ...searchParams.value };

    // 根据分组模式调整查询参数
    if (groupBy.value !== "none") {
      params.size = 1000; // 分组时加载更多数据
    }

    const res = await imageApi.getImagePageList(params);
    if (res.code === "00000") {
      imageList.value = res.data.records || [];
      total.value = res.data.total || 0;
    }
  } catch (error) {
    console.error("加载镜像列表失败:", error);
    ElMessage.error("加载镜像列表失败");
  } finally {
    loading.value = false;
  }
}

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
  }
}

// 搜索
function handleSearch() {
  searchParams.value.page = 1;
  loadImages();
}

// 刷新
function handleRefresh() {
  loadImages();
}

// 分组切换
function handleGroupChange() {
  loadImages();
}

// 打开安装容器对话框
function openInstallContainer(image: SystemSoftImage) {
  currentImage.value = image;
  installContainerVisible.value = true;
}

// 导出镜像
async function handleExportImage(image: SystemSoftImage) {
  try {
    ElMessage.info("正在导出镜像，请稍候...");
    // TODO: 调用导出镜像API
    const res = await imageApi.exportImage({
      imageId: image.systemSoftImageId!,
      serverId: image.systemSoftImageServerId!,
    });

    if (res.code === "00000") {
      ElNotification.success({
        title: "导出任务已创建",
        message: `正在导出镜像 ${image.systemSoftImageName}:${image.systemSoftImageTag}`,
        position: "bottom-right",
      });
    }
  } catch (error: any) {
    console.error("导出镜像失败:", error);
    ElMessage.error(error?.message || "导出镜像失败");
  }
}

// 导出服务器所有镜像
async function handleExportServerImages(serverId: number) {
  try {
    ElMessage.info("正在导出服务器所有镜像，请稍候...");
    // TODO: 调用批量导出API
  } catch (error: any) {
    console.error("导出失败:", error);
    ElMessage.error(error?.message || "导出失败");
  }
}

// 删除镜像
async function handleDeleteImage(image: SystemSoftImage) {
  try {
    await ElMessageBox.confirm(
      `确认删除镜像 ${image.systemSoftImageName}:${image.systemSoftImageTag}？`,
      "提示",
      { type: "warning" }
    );

    const res = await imageApi.deleteImage(image.systemSoftImageId!);
    if (res.code === "00000") {
      ElMessage.success("删除成功");
      loadImages();
    } else {
      ElMessage.error(res.msg || "删除失败");
    }
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("删除镜像失败:", error);
      ElMessage.error(error?.message || "删除失败");
    }
  }
}

// 安装容器成功
function handleInstallSuccess() {
  ElNotification.success({
    title: "容器创建成功",
    message: "容器已成功创建，可在容器管理中查看",
    position: "bottom-right",
  });
}

// 同步成功
function handleSyncSuccess() {
  ElNotification.success({
    title: "同步任务已创建",
    message: "正在从服务器同步镜像，请在右下角查看实时进度",
    position: "bottom-right",
  });
  loadImages();
}

// 导入成功
function handleImportSuccess() {
  ElNotification.success({
    title: "导入任务已创建",
    message: "正在导入镜像文件，请在右下角查看实时进度",
    position: "bottom-right",
  });
  loadImages();
}

// 格式化大小
function formatSize(bytes: number | undefined): string {
  if (!bytes) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// 获取状态标签类型
function getStatusTagType(
  status: string | undefined
): "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "AVAILABLE":
      return "success";
    case "PULLING":
      return "warning";
    case "PULL_FAILED":
      return "danger";
    default:
      return "info";
  }
}

// 获取状态文本
function getStatusText(status: string | undefined): string {
  switch (status) {
    case "AVAILABLE":
      return "可用";
    case "PULLING":
      return "拉取中";
    case "PULL_FAILED":
      return "拉取失败";
    default:
      return "未知";
  }
}

// Socket事件监听
function setupSocketListeners() {
  if (!globalSocket) return;

  // 监听镜像拉取进度
  globalSocket.on(MonitorTopics.DOCKER.IMAGE_PULL_PROGRESS, (data: any) => {
    console.log("📦 镜像拉取进度:", data);

    // 显示实时进度通知
    if (data.operationId && data.imageName) {
      showPullProgress({
        operationId: data.operationId,
        imageName: data.imageName,
        imageTag: data.imageTag,
        progress: data.progress || 0,
        status: data.status || "running",
        message: data.message || "正在拉取镜像...",
      });
    }
  });

  // 监听镜像导出进度
  globalSocket.on(MonitorTopics.DOCKER.IMAGE_EXPORT_PROGRESS, (data: any) => {
    console.log("📤 镜像导出进度:", data);
  });

  // 监听镜像导入进度
  globalSocket.on(MonitorTopics.DOCKER.IMAGE_IMPORT_PROGRESS, (data: any) => {
    console.log("📥 镜像导入进度:", data);
  });

  // 监听操作完成
  globalSocket.on(MonitorTopics.OPERATION.COMPLETE, (operation: any) => {
    console.log("✅ 操作完成:", operation);

    // 如果是镜像拉取完成，显示成功通知
    if (operation.type === "pull_image" && operation.imageName) {
      showPullSuccess(operation.imageName, operation.imageTag);
      loadImages(); // 刷新列表
    } else if (
      ["export_image", "import_image", "sync_images"].includes(operation.type)
    ) {
      loadImages(); // 刷新列表
    }
  });

  // 监听操作错误
  globalSocket.on(MonitorTopics.OPERATION.ERROR, (operation: any) => {
    console.log("❌ 操作失败:", operation);

    // 如果是镜像拉取失败，显示错误通知
    if (operation.type === "pull_image" && operation.imageName) {
      showPullError(
        operation.imageName,
        operation.error || "拉取失败",
        operation.imageTag
      );
    }
  });
}

function cleanupSocketListeners() {
  if (!globalSocket) return;

  globalSocket.off(MonitorTopics.DOCKER.IMAGE_PULL_PROGRESS);
  globalSocket.off(MonitorTopics.DOCKER.IMAGE_EXPORT_PROGRESS);
  globalSocket.off(MonitorTopics.DOCKER.IMAGE_IMPORT_PROGRESS);
  globalSocket.off(MonitorTopics.OPERATION.COMPLETE);
  globalSocket.off(MonitorTopics.OPERATION.ERROR);
}

onMounted(() => {
  loadServers();
  loadImages();
  setupSocketListeners();
});

onUnmounted(() => {
  cleanupSocketListeners();
});
</script>

<style scoped>
.images-management {
  padding: 20px;
  background: var(--app-bg-secondary);
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
  margin-top: 4px;
}

.header-right {
  display: flex;
  gap: 8px;
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

.search-left {
  display: flex;
  gap: 8px;
}

.search-input {
  width: 280px;
}

.filter-select {
  width: 160px;
}

.search-right {
  display: flex;
  gap: 8px;
}

/* 分组视图 */
.grouped-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.group-card {
  border-radius: 12px;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.group-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}

.server-name,
.image-name {
  font-weight: 600;
}

.group-actions {
  display: flex;
  gap: 8px;
}

/* 镜像网格 */
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.image-item {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s;
}

.image-item:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.image-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.image-name-tag {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.image-name {
  font-weight: 600;
  font-size: 14px;
}

.image-item-body {
  margin-bottom: 12px;
}

.image-meta {
  font-size: 12px;
  color: var(--app-text-secondary);
  margin-bottom: 4px;
}

.meta-label {
  color: var(--app-text-tertiary);
}

.image-id {
  font-family: "Consolas", "Monaco", monospace;
  font-size: 12px;
  color: var(--app-text-secondary);
}

.image-item-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 服务器网格 */
.server-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.server-item {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s;
}

.server-item:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.server-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.server-info {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 14px;
}

.server-item-body {
  margin-bottom: 12px;
}

.server-item-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 列表视图 */
.images-table-card {
  border-radius: 12px;
}

.images-table {
  margin-bottom: 16px;
}

.image-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
