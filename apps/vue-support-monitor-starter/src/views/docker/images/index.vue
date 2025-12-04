<template>
  <div class="images-management">
    <!-- 统计卡片 -->
    <div class="stats-section">
      <div class="stats-grid">
        <ScCard
          layout="stats"
          theme="primary"
          icon="ri:image-line"
          :value="imageStats.total"
          label="镜像总数"
          trend-icon="ri:stack-line"
          trend-text="全部镜像"
        />
        <ScCard
          layout="stats"
          theme="success"
          icon="ri:server-line"
          :value="imageStats.serverCount"
          label="服务器数"
          trend-icon="ri:computer-line"
          trend-text="已连�?
        />
        <ScCard
          layout="stats"
          theme="warning"
          icon="ri:hard-drive-2-line"
          :value="formatSize(imageStats.totalSize)"
          label="总大�?
          trend-icon="ri:database-2-line"
          trend-text="存储占用"
        />
      </div>
    </div>

    <!-- 工具�?-->
    <div class="toolbar-section">
      <div class="toolbar-left">
        <el-input
          v-model="searchParams.keyword"
          placeholder="搜索镜像名称或标�?
          class="search-input"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
        <el-select
          v-model="searchParams.serverId"
          placeholder="选择服务�?
          clearable
          class="filter-select"
          @change="handleSearch"
        >
          <el-option label="全部服务�? :value="undefined" />
          <el-option
            v-for="server in servers"
            :key="server.monitorSysGenServerId"
            :label="server.monitorSysGenServerName"
            :value="server.monitorSysGenServerId"
          />
        </el-select>
        <el-radio-group
          v-model="groupBy"
          size="default"
          @change="handleGroupChange"
        >
          <el-radio-button value="server">按服务器</el-radio-button>
          <el-radio-button value="image">按镜�?/el-radio-button>
          <el-radio-button value="none">列表</el-radio-button>
        </el-radio-group>
      </div>
      <div class="toolbar-right">
        <el-button @click="handleRefresh" :loading="loading">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
        <el-button @click="syncVisible = true" type="success" plain>
          <IconifyIconOnline icon="ri:refresh-2-line" class="mr-1" />
          同步
        </el-button>
        <el-button @click="importVisible = true" type="warning" plain>
          <IconifyIconOnline icon="ri:upload-line" class="mr-1" />
          导入
        </el-button>
        <el-button type="primary" @click="pullVisible = true">
          <IconifyIconOnline icon="ri:download-line" class="mr-1" />
          拉取
        </el-button>
      </div>
    </div>

    <!-- 分组显示：按服务器分�?-->
    <div v-if="groupBy === 'server'" class="grouped-view">
      <el-card
        v-for="group in groupedByServer"
        :key="group.serverId"
        class="group-card"
        shadow="hover"
      >
        <template #header>
          <div class="group-header">
            <div class="group-title">
              <IconifyIconOnline icon="ri:server-line" class="mr-2" />
              <span class="server-name">{{ group.serverName }}</span>
              <el-tag size="small" type="info" class="ml-2"
                >{{ group.images.length }} 个镜�?/el-tag
              >
            </div>
            <div class="group-actions">
              <el-button
                size="small"
                text
                @click="handleExportServerImages(group.serverId)"
              >
                <IconifyIconOnline icon="ri:download-2-line" class="mr-1" />
                导出全部
              </el-button>
            </div>
          </div>
        </template>

        <div class="image-grid">
          <div
            v-for="image in group.images"
            :key="image.systemSoftImageId"
            class="image-item"
          >
            <div class="image-item-header">
              <div class="image-name-tag">
                <div class="image-name">{{ image.systemSoftImageName }}</div>
                <el-tag size="small" type="primary" effect="plain">{{
                  image.systemSoftImageTag
                }}</el-tag>
              </div>
              <el-tag
                :type="getStatusTagType(image.systemSoftImageStatus)"
                size="small"
              >
                {{ getStatusText(image.systemSoftImageStatus) }}
              </el-tag>
            </div>
            <div class="image-item-body">
              <div class="image-meta">
                <span class="meta-label">大小�?/span>
                <span>{{ formatSize(image.systemSoftImageSize) }}</span>
              </div>
              <div class="image-meta">
                <span class="meta-label">ID�?/span>
                <span class="image-id">{{
                  (image.systemSoftImageImageId || "").substring(0, 12)
                }}</span>
              </div>
            </div>
            <div class="image-item-actions">
              <el-button
                size="small"
                type="primary"
                @click="openInstallContainer(image)"
              >
                <IconifyIconOnline icon="ri:play-circle-line" class="mr-1" />
                安装容器
              </el-button>
              <el-button size="small" @click="handleExportImage(image)">
                <IconifyIconOnline icon="ri:download-2-line" class="mr-1" />
                导出
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="handleDeleteImage(image)"
              >
                <IconifyIconOnline icon="ri:delete-bin-line" />
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 分组显示：按镜像分组 -->
    <div v-else-if="groupBy === 'image'" class="grouped-view">
      <el-card
        v-for="group in groupedByImage"
        :key="group.imageName"
        class="group-card"
        shadow="hover"
      >
        <template #header>
          <div class="group-header">
            <div class="group-title">
              <IconifyIconOnline icon="ri:image-line" class="mr-2" />
              <span class="image-name">{{ group.imageName }}</span>
              <el-tag size="small" type="primary" effect="plain" class="ml-2">{{
                group.tag
              }}</el-tag>
              <el-tag size="small" type="info" class="ml-2"
                >{{ group.servers.length }} 台服务器</el-tag
              >
            </div>
          </div>
        </template>

        <div class="server-grid">
          <div
            v-for="item in group.servers"
            :key="item.systemSoftImageId"
            class="server-item"
          >
            <div class="server-item-header">
              <div class="server-info">
                <IconifyIconOnline icon="ri:server-line" class="mr-1" />
                <span>{{ item.systemSoftImageServerName }}</span>
              </div>
              <el-tag
                :type="getStatusTagType(item.systemSoftImageStatus)"
                size="small"
              >
                {{ getStatusText(item.systemSoftImageStatus) }}
              </el-tag>
            </div>
            <div class="server-item-body">
              <div class="image-meta">
                <span class="meta-label">大小�?/span>
                <span>{{ formatSize(item.systemSoftImageSize) }}</span>
              </div>
              <div class="image-meta">
                <span class="meta-label">ID�?/span>
                <span class="image-id">{{
                  (item.systemSoftImageImageId || "").substring(0, 12)
                }}</span>
              </div>
            </div>
            <div class="server-item-actions">
              <el-button
                size="small"
                type="primary"
                @click="openInstallContainer(item)"
              >
                <IconifyIconOnline icon="ri:play-circle-line" class="mr-1" />
                安装容器
              </el-button>
              <el-button size="small" @click="handleExportImage(item)">
                <IconifyIconOnline icon="ri:download-2-line" />
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="handleDeleteImage(item)"
              >
                <IconifyIconOnline icon="ri:delete-bin-line" />
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 列表视图 -->
    <el-card v-else class="images-table-card">
      <ScTable
        ref="imageTableRef"
        :url="imageApi.getImagePageList"
        :params="searchParams"
        stripe
        table-name="docker-images"
        row-key="systemSoftImageId"
        class="images-table"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column label="镜像" min-width="200">
          <template #default="{ row }">
            <div class="image-info">
              <div class="image-name">{{ row.systemSoftImageName }}</div>
              <el-tag size="small" type="primary" effect="plain">{{
                row.systemSoftImageTag
              }}</el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="服务�? width="180">
          <template #default="{ row }">
            <div class="server-info">
              <IconifyIconOnline icon="ri:server-line" class="mr-1" />
              {{ row.systemSoftImageServerName }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="大小" width="120">
          <template #default="{ row }">
            {{ formatSize(row.systemSoftImageSize) }}
          </template>
        </el-table-column>

        <el-table-column label="镜像ID" width="140">
          <template #default="{ row }">
            <span class="image-id">{{
              (row.systemSoftImageImageId || "").substring(0, 12)
            }}</span>
          </template>
        </el-table-column>

        <el-table-column label="状�? width="100">
          <template #default="{ row }">
            <el-tag
              :type="getStatusTagType(row.systemSoftImageStatus)"
              size="small"
            >
              {{ getStatusText(row.systemSoftImageStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              type="primary"
              @click="openInstallContainer(row)"
            >
              <IconifyIconOnline icon="ri:play-circle-line" class="mr-1" />
              安装容器
            </el-button>
            <el-button size="small" @click="handleExportImage(row)">
              <IconifyIconOnline icon="ri:download-2-line" class="mr-1" />
              导出
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDeleteImage(row)"
            >
              <IconifyIconOnline icon="ri:delete-bin-line" />
            </el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <!-- 拉取镜像对话�?-->
    <PullImageDialog v-model:visible="pullVisible" @success="handleRefresh" />

    <!-- 安装容器对话�?-->
    <InstallContainerDialog
      v-model:visible="installContainerVisible"
      :image="currentImage"
      @success="handleInstallSuccess"
    />

    <!-- 同步镜像对话�?-->
    <ImageSyncDialog
      v-model:visible="syncVisible"
      @success="handleSyncSuccess"
    />

    <!-- 导入镜像对话�?-->
    <ImageImportDialog
      v-model:visible="importVisible"
      @success="handleImportSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { ElMessage, ElMessageBox, ElNotification } from "element-plus";
import { useGlobalSocket } from "@repo/core";
import { useImagePullNotification } from "@/composables/useImagePullNotification";
import ProgressMonitor from "@/components/ProgressMonitor.vue";
import ScTable from "@repo/components/ScTable/index.vue";
import ScCard from "@repo/components/ScCard/index.vue";
import {
  imageApi,
  getServerList,
  type SystemSoftImage,
} from "@/api/docker";
import PullImageDialog from "./components/PullImageDialog.vue";
import InstallContainerDialog from "./components/InstallContainerDialog.vue";
import ImageSyncDialog from "./components/ImageSyncDialog.vue";
import ImageImportDialog from "./components/ImageImportDialog.vue";

const loading = ref(false);
const pullVisible = ref(false);
const installContainerVisible = ref(false);
const syncVisible = ref(false);
const importVisible = ref(false);
const currentImage = ref<SystemSoftImage | null>(null);
const imageTableRef = ref();
const selectedImages = ref<SystemSoftImage[]>([]);

const groupBy = ref<"server" | "image" | "none">("none");
const imageList = ref<SystemSoftImage[]>([]);
const servers = ref<any[]>([]);
const total = ref(0);

// 统计数据
const imageStats = computed(() => {
  const serverSet = new Set<number>();
  let totalSize = 0;

  imageList.value.forEach((img) => {
    if (img.systemSoftImageServerId) {
      serverSet.add(img.systemSoftImageServerId);
    }
    totalSize += img.systemSoftImageSize || 0;
  });

  return {
    total: imageList.value.length,
    serverCount: serverSet.size,
    totalSize,
  };
});

const searchParams = ref({
  page: 1,
  size: 20,
  keyword: "",
  serverId: undefined as number | undefined,
  status: undefined as string | undefined,
});

// 获取全局Socket服务
const globalSocket = useGlobalSocket();

// 使用拉取通知功能
const { showPullProgress, showPullSuccess, showPullError } =
  useImagePullNotification();

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

// 按镜像分�?
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
      params.size = 1000; // 分组时加载更多数�?
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

// 加载服务器列�?
async function loadServers() {
  try {
    const res: any = await getServerList();
    if (res?.code === "00000") {
      servers.value = res.data || [];
    } else if (Array.isArray(res)) {
      servers.value = res || [];
    }
  } catch (error) {
    console.error("加载服务器列表失�?", error);
  }
}

// 搜索
function handleSearch() {
  searchParams.value.page = 1;
  loadImages();
}

// 刷新
function handleRefresh() {
  if (groupBy.value === "none" && imageTableRef.value) {
    // 列表视图使用ScTable刷新
    imageTableRef.value.refresh?.();
  } else {
    // 分组视图手动加载
    loadImages();
  }
}

// 选择变化处理
function handleSelectionChange(selection: SystemSoftImage[]) {
  selectedImages.value = selection;
}

// 分组切换
function handleGroupChange() {
  loadImages();
}

// 打开安装容器对话�?
function openInstallContainer(image: SystemSoftImage) {
  currentImage.value = image;
  installContainerVisible.value = true;
}

// 导出镜像
async function handleExportImage(image: SystemSoftImage) {
  try {
    ElMessage.info("正在导出镜像，请稍�?..");
    // TODO: 调用导出镜像API
    const res = await imageApi.exportImage({
      imageId: image.systemSoftImageId!,
      serverId: image.systemSoftImageServerId!,
    });

    if (res.code === "00000") {
      ElNotification.success({
        title: "导出任务已创�?,
        message: `正在导出镜像 ${image.systemSoftImageName}:${image.systemSoftImageTag}`,
        position: "bottom-right",
      });
    }
  } catch (error: any) {
    console.error("导出镜像失败:", error);
    ElMessage.error(error?.message || "导出镜像失败");
  }
}

// 导出服务器所有镜�?
async function handleExportServerImages(serverId: number) {
  try {
    ElMessage.info("正在导出服务器所有镜像，请稍�?..");
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
    message: "容器已成功创建，可在容器管理中查�?,
    position: "bottom-right",
  });
}

// 同步成功
function handleSyncSuccess() {
  ElNotification.success({
    title: "同步任务已创�?,
    message: "正在从服务器同步镜像，请在右下角查看实时进度",
    position: "bottom-right",
  });
  loadImages();
}

// 导入成功
function handleImportSuccess() {
  ElNotification.success({
    title: "导入任务已创�?,
    message: "正在导入镜像文件，请在右下角查看实时进度",
    position: "bottom-right",
  });
  loadImages();
}

// 格式化大�?
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

// 获取状态标签类�?
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

// 获取状态文�?
function getStatusText(status: string | undefined): string {
  switch (status) {
    case "AVAILABLE":
      return "可用";
    case "PULLING":
      return "拉取�?;
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
  globalSocket.on("docker_image_pull_progress", (data: any) => {
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
  globalSocket.on("docker_image_export_progress", (data: any) => {
    console.log("📤 镜像导出进度:", data);
  });

  // 监听镜像导入进度
  globalSocket.on("docker_image_import_progress", (data: any) => {
    console.log("📥 镜像导入进度:", data);
  });

  // 监听操作完成
  globalSocket.on("operation_complete", (operation: any) => {
    console.log("�?操作完成:", operation);

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
  globalSocket.on("operation_error", (operation: any) => {
    console.log("�?操作失败:", operation);

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

  globalSocket.off("docker_image_pull_progress");
  globalSocket.off("docker_image_export_progress");
  globalSocket.off("docker_image_import_progress");
  globalSocket.off("operation_complete");
  globalSocket.off("operation_error");
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

/* 统计卡片区域 */
.stats-section {
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

/* 工具�?*/
.toolbar-section {
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

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  gap: 8px;
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
  flex: 1;
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

/* 服务器网�?*/
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
