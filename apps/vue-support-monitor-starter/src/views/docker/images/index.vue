<template>
  <div class="images-management system-container modern-bg">
    <!-- 统计卡片 -->
    <div class="stats-row">
      <ScCard
        layout="stats-simple"
        theme="purple"
        icon="ri:stack-line"
        :value="total"
        label="全部镜像"
      />
      <ScCard
        layout="stats-simple"
        theme="success"
        icon="ri:checkbox-circle-line"
        :value="availableCount"
        label="可用"
      />
      <ScCard
        layout="stats-simple"
        theme="warning"
        icon="ri:loader-4-line"
        :value="pullingCount"
        label="拉取中"
      />
      <ScCard
        layout="stats-simple"
        theme="blue"
        icon="ri:server-line"
        :value="servers.length"
        label="服务器"
      />
    </div>

    <!-- 工具栏 -->
    <div class="toolbar-section">
      <div class="toolbar-left">
        <el-input
          v-model="searchParams.keyword"
          placeholder="搜索镜像名称、标签..."
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
          placeholder="全部服务器"
          clearable
          class="filter-select"
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
          class="filter-select"
          @change="handleSearch"
        >
          <el-option label="全部状态" :value="undefined" />
          <el-option label="可用" value="AVAILABLE" />
          <el-option label="拉取中" value="PULLING" />
          <el-option label="错误" value="PULL_FAILED" />
        </el-select>
        <div class="view-toggle">
          <button
            v-for="view in viewOptions"
            :key="view.value"
            :class="['toggle-btn', { active: groupBy === view.value }]"
            @click="handleViewChange(view.value)"
          >
            <IconifyIconOnline :icon="view.icon" />
            <span>{{ view.label }}</span>
          </button>
        </div>
      </div>
      <div class="toolbar-right">
        <el-button @click="handleRefresh" :loading="loading">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
        <el-button @click="syncVisible = true">
          <IconifyIconOnline icon="ri:cloud-line" class="mr-1" />
          同步
        </el-button>
        <el-button @click="importVisible = true">
          <IconifyIconOnline icon="ri:upload-2-line" class="mr-1" />
          导入
        </el-button>
        <el-button type="primary" @click="pullVisible = true">
          <IconifyIconOnline icon="ri:download-cloud-line" class="mr-1" />
          拉取镜像
        </el-button>
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
                  >{{ group.servers.length }} 台服务器</span>
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

    <!-- 列表视图 - 使用 ScTable -->
    <div v-else class="list-view-modern">
      <ScTable
        ref="imageTableRef"
        :url="imageApi.getImagePageList"
        :params="searchParams"
        table-name="docker-images"
        class="modern-table"
        :data-loaded="handleDataLoaded"
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
      </ScTable>
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
      :event-name="socketEventNames"
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
import { message } from "@repo/utils";
import { ElMessageBox, ElNotification } from "element-plus";
import { useGlobalSocket, MonitorTopics } from "@repo/core";
import { imageApi, getServerList, type SystemSoftImage } from "@/api/docker";
import PullImageDialog from "./components/PullImageDialog.vue";
import InstallContainerDialog from "./components/InstallContainerDialog.vue";
import ImageSyncDialog from "./components/ImageSyncDialog.vue";
import ImageImportDialog from "./components/ImageImportDialog.vue";
import ScSocketMessageDialog from "@repo/components/ScSocketMessageDialog/index.vue";
import ScTable from "@repo/components/ScTable/index.vue";
import { ScCard } from "@repo/components/ScCard";

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

// ScTable 引用
const imageTableRef = ref();

// Socket事件名称 - 使用 MonitorTopics 常量
const socketEventNames = [
  MonitorTopics.DOCKER.IMAGE_PULL_PROGRESS,
  MonitorTopics.SOFTWARE.SYNC_PROGRESS,
  MonitorTopics.DOCKER.IMAGE_EXPORT_PROGRESS,
  MonitorTopics.DOCKER.IMAGE_IMPORT_PROGRESS,
];

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
    message("加载镜像列表失败", { type: "error" });
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
  // 如果是列表视图，通过 ScTable 刷新
  if (groupBy.value === "none" && imageTableRef.value) {
    imageTableRef.value.refresh();
  } else {
    loadImages();
  }
}

// 刷新
function handleRefresh() {
  if (groupBy.value === "none" && imageTableRef.value) {
    imageTableRef.value.refresh();
  } else {
    loadImages();
  }
}

// ScTable 数据加载完成回调
function handleDataLoaded(data: SystemSoftImage[], totalCount: number) {
  imageList.value = data || [];
  total.value = totalCount || 0;
}

// 分组切换
function handleGroupChange() {
  loadImages();
}

// 视图切换
function handleViewChange(value: string) {
  groupBy.value = value as "server" | "image" | "none";
  handleGroupChange();
}

// 打开安装容器对话框
function openInstallContainer(image: SystemSoftImage) {
  currentImage.value = image;
  installContainerVisible.value = true;
}

// 导出镜像
async function handleExportImage(image: SystemSoftImage) {
  try {
    message("正在导出镜像，请稍候...", { type: "info" });
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
    message(error?.message || "导出镜像失败", { type: "error" });
  }
}

// 导出服务器所有镜像
async function handleExportServerImages(serverId: number) {
  try {
    message("正在导出服务器所有镜像，请稍候...", { type: "info" });
    const listRes = await imageApi.getImagesByServerId(serverId);
    if (listRes.code !== "00000") {
      return message(listRes.msg || "获取镜像列表失败", { type: "error" });
    }

    const images = listRes.data || [];
    if (!images.length) {
      return message("该服务器暂无镜像可导出", { type: "warning" });
    }

    const results = await Promise.allSettled(
      images.map((image) =>
        imageApi.exportImage({
          imageId: image.systemSoftImageId!,
          serverId: image.systemSoftImageServerId!,
        }),
      ),
    );

    const successCount = results.filter(
      (item) => item.status === "fulfilled" && item.value.code === "00000",
    ).length;
    const failedCount = results.length - successCount;

    if (successCount > 0) {
      ElNotification.success({
        title: "批量导出已提交",
        message: `成功提交 ${successCount} 个镜像导出任务，失败 ${failedCount} 个`,
        position: "bottom-right",
      });
    } else {
      message("批量导出失败", { type: "error" });
    }
  } catch (error: any) {
    console.error("导出失败:", error);
    message(error?.message || "导出失败", { type: "error" });
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
      message("删除成功", { type: "success" });
      loadImages();
    } else {
      message(res.msg || "删除失败", { type: "error" });
    }
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("删除镜像失败:", error);
      message(error?.message || "删除失败", { type: "error" });
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

// 获取状态CSS类名
function getStatusClass(status: string | undefined): string {
  switch (status) {
    case "AVAILABLE":
      return "available";
    case "PULLING":
      return "pulling";
    case "PULL_FAILED":
      return "failed";
    default:
      return "unknown";
  }
}

// 获取镜像渐变色
function getImageGradient(imageName: string | undefined): string {
  if (!imageName) return "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

  // 根据镜像名称生成不同的渐变色
  const gradients = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    "linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)",
    "linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)",
  ];

  // 使用镜像名称的哈希值选择渐变色
  let hash = 0;
  for (let i = 0; i < imageName.length; i++) {
    hash = imageName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

// 显示进度对话框
function showProgressDialog(title: string, eventId: string) {
  progressTitle.value = title;
  progressEventId.value = eventId;
  progressVisible.value = true;
}

// 关闭进度对话框
function handleProgressClose() {
  progressVisible.value = false;
  loadImages();
}

// 处理进度数据
function handleProgressData(data: any) {
  console.log("📊 进度数据:", data);

  // 如果操作完成，刷新列表
  if (data.status === "success" || data.status === "error") {
    setTimeout(() => {
      loadImages();
    }, 1000);
  }
}

// Socket事件监听 - 使用 ScSocketMessageDialog 替代
function setupSocketListeners() {
  if (!globalSocket) return;

  // 监听镜像拉取进度 - 显示进度对话框
  globalSocket.on(MonitorTopics.DOCKER.IMAGE_PULL_PROGRESS, (data: any) => {
    console.log("📦 镜像拉取进度:", data);
    if (data.operationId && !progressVisible.value) {
      showProgressDialog(`拉取镜像: ${data.imageName || ""}`, data.operationId);
    }
  });

  // 监听镜像导出进度
  globalSocket.on(MonitorTopics.DOCKER.IMAGE_EXPORT_PROGRESS, (data: any) => {
    console.log("📤 镜像导出进度:", data);
    if (data.operationId && !progressVisible.value) {
      showProgressDialog(`导出镜像: ${data.imageName || ""}`, data.operationId);
    }
  });

  // 监听镜像导入进度
  globalSocket.on(MonitorTopics.DOCKER.IMAGE_IMPORT_PROGRESS, (data: any) => {
    console.log("📥 镜像导入进度:", data);
    if (data.operationId && !progressVisible.value) {
      showProgressDialog("导入镜像", data.operationId);
    }
  });

  // 监听操作完成
  globalSocket.on(MonitorTopics.OPERATION.COMPLETE, (operation: any) => {
    console.log("✅ 操作完成:", operation);
    if (
      ["pull_image", "export_image", "import_image", "sync_images"].includes(
        operation.type
      )
    ) {
      ElNotification.success({
        title: "操作完成",
        message: operation.message || "操作已成功完成",
        position: "bottom-right",
      });
      loadImages();
    }
  });

  // 监听操作错误
  globalSocket.on(MonitorTopics.OPERATION.ERROR, (operation: any) => {
    console.log("❌ 操作失败:", operation);
    ElNotification.error({
      title: "操作失败",
      message: operation.error || "操作执行失败",
      position: "bottom-right",
    });
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

<style scoped lang="scss">

.modern-bg {
  position: relative;
  overflow: hidden;

  /* 渐变背景 */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}


.images-management {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100vh;
}

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

/* 工具栏 */
.toolbar-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  width: 240px;
}

.filter-select {
  width: 130px;
}

/* 视图切换 */
.view-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--el-bg-color);
  border-radius: 14px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.search-section {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-box {
  display: flex;
  align-items: center;
  background: var(--el-fill-color-light);
  border-radius: 10px;
  padding: 0 14px;
  width: 280px;
  height: 40px;
  transition: box-shadow 0.2s;
}

.search-box:focus-within {
  box-shadow: 0 0 0 2px var(--el-color-primary-light-5);
}

.search-icon {
  color: var(--el-text-color-placeholder);
  margin-right: 10px;
}

.search-box input {
  border: none;
  background: transparent;
  outline: none;
  width: 100%;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.filter-select-modern {
  width: 140px;
}

.view-toggle {
  display: flex;
  gap: 4px;
  background: var(--el-fill-color-light);
  padding: 4px;
  border-radius: 10px;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  transition: all 0.2s;
}

.toggle-btn:hover {
  color: var(--el-text-color-primary);
}

.toggle-btn.active {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

/* 现代化分组视图 */
.grouped-view-modern {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.server-group-card,
.image-group-card {
  background: var(--el-bg-color);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.group-header-modern {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

.group-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

.group-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
}

.group-icon.image {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.group-text h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.group-count,
.server-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.group-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.version-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.more-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  transition: all 0.2s;
}

.more-btn:hover {
  background: var(--el-fill-color);
  color: var(--el-text-color-primary);
}

/* 现代化镜像卡片网格 */
.images-grid-modern,
.servers-grid-modern {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 20px;
}

.image-card-modern,
.server-card-modern {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.25s;
}

.image-card-modern:hover,
.server-card-modern:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.image-card-header,
.server-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.image-icon-box {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
  flex-shrink: 0;
}

.server-icon-box {
  width: 36px;
  height: 36px;
  background: var(--el-fill-color);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: var(--el-color-primary);
}

.image-title,
.server-title {
  flex: 1;
  min-width: 0;
}

.image-title h4,
.server-title h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-tag-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.available {
  background: #10b981;
}
.status-dot.pulling {
  background: #f59e0b;
  animation: pulse 1.5s infinite;
}
.status-dot.failed {
  background: #ef4444;
}
.status-dot.unknown {
  background: #9ca3af;
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

.image-card-body,
.server-card-body {
  margin-bottom: 14px;
}

.image-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}

.meta-icon {
  font-size: 14px;
  color: var(--el-text-color-placeholder);
}

.image-id-text {
  font-family: "Monaco", "Consolas", monospace;
  font-size: 11px;
  background: var(--el-fill-color-light);
  padding: 2px 6px;
  border-radius: 4px;
}

.image-card-actions,
.server-card-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-extra-light);
}

.card-action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  color: var(--el-text-color-regular);
  transition: all 0.2s;
}

.card-action-btn:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.card-action-btn.primary {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: white;
  flex: 1;
  justify-content: center;
}

.card-action-btn.primary:hover {
  background: var(--el-color-primary-dark-2);
}

.card-action-btn.danger:hover {
  border-color: var(--el-color-danger);
  color: var(--el-color-danger);
}

/* 现代化列表视图 */
.list-view-modern {
  background: var(--el-bg-color);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.table-wrapper {
  padding: 0 20px;
}

.modern-table {
  border: none;
}

.table-image-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.image-icon-mini {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: white;
}

.image-info-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.image-name-text {
  font-weight: 600;
  font-size: 13px;
}

.version-tag-mini {
  font-size: 11px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  padding: 1px 6px;
  border-radius: 3px;
  display: inline-block;
  width: fit-content;
}

.table-server-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-regular);
}

.server-icon-mini {
  color: var(--el-text-color-placeholder);
}

.size-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.status-badge.available {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.status-badge.pulling {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

.status-badge.failed {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.table-actions {
  display: flex;
  gap: 6px;
}

.table-action-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-regular);
  transition: all 0.2s;
}

.table-action-btn:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.table-action-btn.primary {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: white;
}

.table-action-btn.danger:hover {
  border-color: var(--el-color-danger);
  color: var(--el-color-danger);
}

.pagination-wrapper {
  padding: 16px 20px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--el-border-color-extra-light);
}

/* 响应式 */
@media (max-width: 1200px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .toolbar-modern {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .search-section {
    flex-wrap: wrap;
  }

  .search-box {
    width: 100%;
  }

  .view-toggle {
    justify-content: center;
  }

  .stats-row {
    grid-template-columns: 1fr 1fr;
  }

  .images-grid-modern,
  .servers-grid-modern {
    grid-template-columns: 1fr;
  }
}
</style>
