<template>
  <div class="video-search-result">
    <!-- 顶部搜索信息栏 -->
    <div class="search-header">
      <div class="search-info">
        <div class="search-title-section">
          <IconifyIconOnline icon="ep:search" class="search-icon" />
          <h1 class="search-title">
            搜索结果
            <span v-if="searchKeyword" class="search-keyword">「{{ searchKeyword }}」</span>
          </h1>
        </div>
        <div class="search-stats" v-if="totalCount > 0">
          <IconifyIconOnline icon="ep:document" />
          找到 <span class="count-number">{{ totalCount }}</span> 个相关视频
        </div>
      </div>

    </div>


    <!-- 搜索结果容器 -->
    <div class="result-container">
      <!-- 使用 ScTable 统一渲染 -->
      <ScTable
        v-if="viewMode === 'table'"
        ref="tableRef"
        :url="findOnlineResources"
        :params="searchParams"
        row-key="id"
        :page-size="pageSize"
        :height="600"
        :border="false"
        :stripe="false"
        :loading="loading"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
        @selection-change="handleSelectionChange"
        class="video-results-table"
      >
        <el-table-column type="selection" width="55" fixed="left" />
        <el-table-column label="海报" width="120">
          <template #default="{ row }">
            <div class="poster-cell">
              <el-image
                :src="row.videoCover || '/placeholder-video.jpg'"
                :alt="row.videoTitle"
                fit="cover"
                class="poster-image"
                @error="handleImageError"
              />
              <div class="poster-overlay" @click="playVideo(row)">
                <IconifyIconOnline icon="ep:video-play" class="play-icon" />
              </div>
              <div v-if="row.duration" class="video-duration">{{ row.duration }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="视频信息" min-width="300">
          <template #default="{ row }">
            <div class="video-info">
              <h4 class="video-title" :title="row.videoTitle">{{ row.videoTitle }}</h4>
              <div class="video-meta">
                <el-tag size="small" type="success">
                  <IconifyIconOnline icon="ep:trend-charts" />
                  热度: {{ row.videoPopularity }}
                </el-tag>
                <el-tag size="small" type="info">
                  <IconifyIconOnline icon="ep:files" />
                  大小: {{ row.videoSize }}
                </el-tag>
                <el-tag v-if="row.videoType" size="small" type="warning">
                  {{ row.videoType }}
                </el-tag>
              </div>
              <div class="video-description" v-if="row.description">
                {{ row.description }}
              </div>
              <div class="video-stats">
                <span v-if="row.views">
                  <IconifyIconOnline icon="ep:view" />
                  {{ formatNumber(row.views) }} 观看
                </span>
                <span v-if="row.rating">
                  <IconifyIconOnline icon="ep:star" />
                  {{ row.rating }} 分
                </span>
                <span v-if="row.year">
                  <IconifyIconOnline icon="ep:calendar" />
                  {{ row.year }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="下载地址" width="200">
          <template #default="{ row }">
            <div class="download-links">
              <el-button
                v-if="row.downloadUrls"
                size="small"
                type="primary"
                :loading="downloadingItems.includes(`${row.id}_0`)"
                @click="downloadFile(row)"
              >
                <IconifyIconOnline icon="ep:download" />
                下载
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons-cell">
              <el-button type="primary" size="small" @click="goToDetail(row)">
                <IconifyIconOnline icon="ep:view" />
              </el-button>
              <el-button type="success" size="small" @click="playVideo(row)">
                <IconifyIconOnline icon="ep:video-play" />
              </el-button>
              <el-dropdown @command="(command) => handleItemAction(command, row)" trigger="click">
                <el-button size="small" type="info">
                  <IconifyIconOnline icon="ep:more" />
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="share">
                      <IconifyIconOnline icon="ep:share" />
                      分享
                    </el-dropdown-item>
                    <el-dropdown-item command="favorite">
                      <IconifyIconOnline icon="ep:star" />
                      收藏
                    </el-dropdown-item>
                    <el-dropdown-item command="report">
                      <IconifyIconOnline icon="ep:warning" />
                      举报
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </ScTable>

      <!-- 卡片和列表视图使用不同的 ScTable 配置 -->
      <ScTable
        v-else
        ref="tableRef"
        :layout="viewMode"
        :url="'/api/v1/video/search'"
        :params="searchParams"
        row-key="id"
        :page-size="pageSize"
        :height="600"
        :col-size="viewMode === 'grid' ? 4 : 1"
        :border="false"
        :stripe="false"
        :selection="true"
        :loading="loading"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
        @selection-change="handleSelectionChange"
        class="video-results-table"
      >
        <template #default="{ row }">
          <!-- 网格卡片视图 -->
          <div v-if="viewMode === 'grid'" class="video-grid-card" @click="goToDetail(row)">
            <div class="grid-selector">
              <el-checkbox :model-value="selectedItems.includes(row.id)" @change="toggleSelect(row.id)" @click.stop />
            </div>
            <div class="grid-poster">
              <el-image
                :src="row.poster || '/placeholder-video.jpg'"
                :alt="row.videoTitle"
                fit="cover"
                class="poster-image"
                @error="handleImageError"
              />
              <div class="grid-overlay">
                <IconifyIconOnline icon="ep:video-play" class="play-icon" />
              </div>
              <div v-if="row.duration" class="video-duration">{{ row.duration }}</div>
            </div>
            <div class="grid-content">
              <h5 class="grid-title" :title="row.videoTitle">{{ row.videoTitle }}</h5>
              <div class="grid-meta">
                <el-tag size="small" type="success">{{ row.videoPopularity }}</el-tag>
                <el-tag size="small" type="info">{{ row.videoSize }}</el-tag>
              </div>
              <div class="grid-actions">
                <el-button
                  v-if="row.donwloadUrls"
                  size="small"
                  type="primary"
                  :loading="downloadingItems.includes(`${row.id}_0`)"
                  @click.stop="downloadFile(row)"
                >
                  <IconifyIconOnline icon="ep:download" />
                  下载
                </el-button>
              </div>
            </div>
          </div>

          <!-- 列表视图 -->
          <div v-else-if="viewMode === 'list'" class="video-list-item" :class="{ selected: selectedItems.includes(row.id) }" @click="selectItem(row.id)">
            <!-- 选择框 -->
            <div class="list-selector">
              <el-checkbox :model-value="selectedItems.includes(row.id)" @change="toggleSelect(row.id)" @click.stop />
            </div>

            <!-- 视频海报 -->
            <div class="list-poster">
              <el-image
                :src="row.poster || '/placeholder-video.jpg'"
                :alt="row.videoTitle"
                fit="cover"
                class="poster-image"
                @error="handleImageError"
              />
              <div class="poster-overlay" @click.stop="playVideo(row)">
                <IconifyIconOnline icon="ep:video-play" class="play-icon" />
              </div>
              <div v-if="row.duration" class="video-duration">{{ row.duration }}</div>
            </div>

            <!-- 视频内容 -->
            <div class="list-content">
              <div class="video-header">
                <h4 class="video-title" :title="row.videoTitle">{{ row.videoTitle }}</h4>
                <div class="video-meta">
                  <el-tag size="small" type="success">
                    <IconifyIconOnline icon="ep:trend-charts" />
                    热度: {{ row.videoPopularity }}
                  </el-tag>
                  <el-tag size="small" type="info">
                    <IconifyIconOnline icon="ep:files" />
                    大小: {{ row.videoSize }}
                  </el-tag>
                  <el-tag v-if="row.videoType" size="small" type="warning">
                    {{ row.videoType }}
                  </el-tag>
                </div>
              </div>

              <div class="video-description" v-if="row.description">
                {{ row.description }}
              </div>

              <div class="video-stats">
                <span v-if="row.views">
                  <IconifyIconOnline icon="ep:view" />
                  {{ formatNumber(row.views) }} 观看
                </span>
                <span v-if="row.rating">
                  <IconifyIconOnline icon="ep:star" />
                  {{ row.rating }} 分
                </span>
                <span v-if="row.year">
                  <IconifyIconOnline icon="ep:calendar" />
                  {{ row.year }}
                </span>
              </div>

              <!-- 下载区域 -->
              <div class="download-section">
                <div class="download-header">
                  <IconifyIconOnline icon="ep:download" />
                  <span>下载地址</span>
                </div>
                <div class="download-links">
                  <el-button
                    v-if="row.donwloadUrls"
                    size="small"
                    type="primary"
                    :loading="downloadingItems.includes(`${row.id}_0`)"
                    @click.stop="downloadFile(row)"
                  >
                    <IconifyIconOnline icon="ep:download" />
                    下载
                  </el-button>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="list-actions">
              <el-button type="primary" size="small" @click.stop="goToDetail(row)">
                <IconifyIconOnline icon="ep:view" />
                详情
              </el-button>
              <el-button type="success" size="small" @click.stop="playVideo(row)">
                <IconifyIconOnline icon="ep:video-play" />
                播放
              </el-button>
              <el-dropdown @command="(command) => handleItemAction(command, row)" trigger="click">
                <el-button size="small" type="info">
                  更多
                  <IconifyIconOnline icon="ep:arrow-down" class="ml-1" />
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="share">
                      <IconifyIconOnline icon="ep:share" />
                      分享
                    </el-dropdown-item>
                    <el-dropdown-item command="favorite">
                      <IconifyIconOnline icon="ep:star" />
                      收藏
                    </el-dropdown-item>
                    <el-dropdown-item command="report">
                      <IconifyIconOnline icon="ep:warning" />
                      举报
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </template>
      </ScTable>




      <!-- 空状态 -->
      <div v-if="!loading && !searchKeyword" class="empty-state">
        <el-empty description="请输入搜索关键词">
          <template #image>
            <IconifyIconOnline icon="ep:search" style="font-size: 64px; color: #dcdfe6;" />
          </template>
          <el-button type="primary" @click="goBack">
            <IconifyIconOnline icon="ep:arrow-left" />
            返回搜索
          </el-button>
        </el-empty>
      </div>
    </div>

    <!-- 下载进度对话框 -->
    <el-dialog v-model="downloadDialogVisible" title="下载进度" width="500px" :close-on-click-modal="false">
      <div class="download-progress">
        <div v-for="task in downloadTasks" :key="task.id" class="progress-item">
          <div class="progress-info">
            <span class="file-name">{{ task.fileName }}</span>
            <span class="progress-text">{{ task.progress }}%</span>
          </div>
          <el-progress :percentage="task.progress" :status="task.status" />
        </div>
      </div>
      <template #footer>
        <el-button @click="cancelDownload">
          <IconifyIconOnline icon="ep:close" />
          取消下载
        </el-button>
        <el-button type="primary" @click="downloadDialogVisible = false">
          <IconifyIconOnline icon="ep:check" />
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// 已使用 IconifyIconOnline 替代 Element Plus 图标
import { ElMessage, ElMessageBox, ElNotification } from "element-plus";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { findOnlineResources } from "../../api/online";

// 定义视频项接口
interface VideoItem {
  id?: string;
  videoTitle: string;
  videoPopularity: number;
  videoSize: string;
  donwloadUrls: string;
  poster?: string;
  duration?: string;
  description?: string;
  videoType?: string;
  views?: number;
  rating?: number;
  year?: number;
}

// 定义下载链接接口
interface DownloadUrl {
  url: string;
  quality?: string;
  format?: string;
}

// 定义下载任务接口
interface DownloadTask {
  id: string;
  fileName: string;
  progress: number;
  status: "active" | "success" | "exception";
}

// 路由相关
const route = useRoute();
const router = useRouter();

// 搜索关键词
const searchKeyword = ref("");

const totalCount = ref(0);

// 数据相关
const loading = ref(false);
const videoList = ref<VideoItem[]>([]);
const currentPage = ref(1);
const pageSize = ref(20);

// 由 ScTable 组件处理数据加载，不再需要手动调用 loadData

// 视图和筛选相关
const viewMode = ref<"list" | "grid" | "table">("table");
const sortBy = ref("popularity_desc");

// 选择相关
const selectedItems = ref<string[]>([]);
const selectAll = ref(false);
const tableRef = ref();

// 下载相关
const downloadingItems = ref<string[]>([]);
const downloadingAll = ref(false);
const downloadDialogVisible = ref(false);
const downloadTasks = ref<DownloadTask[]>([]);

// 计算属性
const hasSelectedItems = computed(() => selectedItems.value.length > 0);

// 搜索参数
const searchParams = computed(() => ({
  keyword: searchKeyword.value,
  page: currentPage.value,
  pageSize: pageSize.value,
  sortBy: sortBy.value,
}));

// 工具方法
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + "万";
  }
  return num.toString();
};

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = "/placeholder-video.jpg";
};

// 选择相关方法
const selectItem = (id: string) => {
  toggleSelect(id);
};

const toggleSelect = (id: string) => {
  const index = selectedItems.value.indexOf(id);
  if (index > -1) {
    selectedItems.value.splice(index, 1);
  } else {
    selectedItems.value.push(id);
  }
  updateSelectAll();
};

const handleSelectAll = (checked: boolean) => {
  if (checked) {
    // 获取 ScTable 中的数据
    const tableData = tableRef.value?.getData?.() || [];
    selectedItems.value = tableData.map((item: VideoItem) => item.id || "").filter((id: string) => id);
  } else {
    selectedItems.value = [];
  }
};

const updateSelectAll = () => {
  // 获取 ScTable 中的数据
  const tableData = tableRef.value?.getData?.() || [];
  const validIds = tableData.map((item: VideoItem) => item.id || "").filter((id: string) => id);
  selectAll.value = validIds.length > 0 && selectedItems.value.length === validIds.length;
};

// 视图和排序方法
const handleViewModeChange = (mode: "list" | "grid" | "table") => {
  viewMode.value = mode;
};

// 处理表格选择变化
const handleSelectionChange = (selection: VideoItem[]) => {
  selectedItems.value = selection.map(item => item.id || "").filter(id => id);
  updateSelectAll();
};

const handleSort = (sortType: string) => {
  sortBy.value = sortType;
  // ScTable 会监听 searchParams 变化并自动重新加载数据
};

// 分页方法
const handlePageChange = (page: number) => {
  currentPage.value = page;
  // ScTable 会监听 searchParams 变化并自动重新加载数据
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  // ScTable 会监听 searchParams 变化并自动重新加载数据
};

// 下载相关方法
const downloadFile = async (item: VideoItem) => {
  const taskId = `${item.id}_0`;

  if (downloadingItems.value.includes(taskId)) {
    return;
  }

  try {
    downloadingItems.value.push(taskId);

    // 使用 a 标签调用浏览器下载功能
    const link = document.createElement("a");
    link.href = item.donwloadUrls;
    link.download = `${item.videoTitle}.${getFileExtension(item.donwloadUrls) || 'mp4'}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    
    // 添加到 DOM 并触发点击
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    ElNotification({
      title: "开始下载",
      message: `${item.videoTitle} 开始下载`,
      type: "success",
    });
  } catch (error) {
    console.error('下载失败:', error);
    ElMessage.error("下载失败: " + error);
  } finally {
    // 延迟移除下载状态，避免用户看不到反馈
    setTimeout(() => {
      const index = downloadingItems.value.indexOf(taskId);
      if (index > -1) {
        downloadingItems.value.splice(index, 1);
      }
    }, 1000);
  }
};

// 获取文件扩展名
const getFileExtension = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const extension = pathname.split('.').pop();
    return extension || '';
  } catch {
    return '';
  }
};

const downloadAll = async () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning("请先选择要下载的视频");
    return;
  }

  try {
    await ElMessageBox.confirm(`确定要下载选中的 ${selectedItems.value.length} 个视频吗？`, "批量下载确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    downloadingAll.value = true;

    // 获取 ScTable 中的数据
    const tableData = tableRef.value?.getData?.() || [];
    
    for (const itemId of selectedItems.value) {
      const item = tableData.find((v: VideoItem) => v.id === itemId);
      if (item && item.donwloadUrls) {
        // 只有一个下载地址，直接下载
        await downloadFile(item);
        // 添加延迟避免同时下载太多
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    ElMessage.success("批量下载已开始");
  } catch {
    // 用户取消
  } finally {
    downloadingAll.value = false;
  }
};

const cancelDownload = () => {
  downloadTasks.value = [];
  downloadingItems.value = [];
  downloadDialogVisible.value = false;
  ElMessage.info("已取消下载");
};

// 导出方法
const handleExport = (command: string) => {
  // 获取 ScTable 中的数据
  const tableData = tableRef.value?.getData?.() || [];
  const selectedData = selectedItems.value.length > 0 
    ? tableData.filter((item: VideoItem) => selectedItems.value.includes(item.id || "")) 
    : tableData;

  if (selectedData.length === 0) {
    ElMessage.warning("没有数据可导出");
    return;
  }

  switch (command) {
    case "excel":
      exportToExcel(selectedData);
      break;
    case "csv":
      exportToCSV(selectedData);
      break;
    case "json":
      exportToJSON(selectedData);
      break;
  }
};

const exportToExcel = (data: VideoItem[]) => {
  // 这里应该使用实际的Excel导出库，如 xlsx
  ElMessage.success("Excel导出功能开发中");
};

const exportToCSV = (data: VideoItem[]) => {
  const headers = ["标题", "热度", "大小", "下载地址"];
  const csvContent = [headers.join(","), ...data.map((item) => [`"${item.videoTitle}"`, item.videoPopularity, `"${item.videoSize}"`, `"${item.donwloadUrls}"`].join(","))].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `视频搜索结果_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();

  ElMessage.success("CSV导出成功");
};

const exportToJSON = (data: VideoItem[]) => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `视频搜索结果_${new Date().toISOString().split("T")[0]}.json`;
  link.click();

  ElMessage.success("JSON导出成功");
};

// 其他操作方法
const handleItemAction = (command: string, item: VideoItem) => {
  switch (command) {
    case "share":
      navigator.clipboard.writeText(item.donwloadUrls);
      ElMessage.success("下载链接已复制到剪贴板");
      break;
    case "favorite":
      ElMessage.success("已添加到收藏");
      break;
    case "report":
      ElMessage.info("举报功能开发中");
      break;
  }
};

// 数据加载方法由 ScTable 组件处理，不再需要手动实现 loadData 函数

// 跳转到视频详情
const goToDetail = (video: VideoItem) => {
  router.push(`/video/detail/${video.id}`);
};

// 播放视频
const playVideo = (video: VideoItem) => {
  ElMessage.info("播放功能开发中");
};

// 返回搜索页面
const goBack = () => {
  router.push("/video/search");
};

// 监听路由参数变化
watch(
  () => route.query.keyword,
  (newKeyword) => {
    if (newKeyword) {
      searchKeyword.value = newKeyword as string;
    }
  },
  { immediate: true }
);

// 组件挂载时获取搜索关键词
onMounted(() => {
  const keyword = route.query.keyword as string;
  if (keyword) {
    searchKeyword.value = keyword;
    // ScTable 会自动监听 searchParams 变化并加载数据
  }
});

// 监听搜索关键词变化
watch(
  () => searchKeyword.value,
  (newKeyword) => {
    if (newKeyword) {
      currentPage.value = 1;
      // ScTable 会自动监听 searchParams 变化并加载数据
    }
  }
);
</script>

<style scoped>
.video-search-result {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

/* 顶部搜索信息栏 */
.search-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 24px;
  border-radius: 20px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.search-info {
  flex: 1;
  min-width: 300px;
}

.search-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.search-icon {
  font-size: 28px;
  color: #667eea;
  filter: drop-shadow(0 2px 4px rgba(102, 126, 234, 0.3));
}

.search-title {
  font-size: 28px;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
  line-height: 1.2;
  background: linear-gradient(135deg, #2d3748, #4a5568);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.search-keyword {
  color: #667eea;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.search-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #718096;
  font-size: 16px;
  font-weight: 500;
}

.count-number {
  color: #667eea;
  font-weight: 700;
  font-size: 18px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* 筛选和排序栏 */
.filter-bar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 20px 24px;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-group label {
  font-weight: 600;
  color: #4a5568;
  white-space: nowrap;
}

.selected-count {
  color: #667eea;
  font-weight: 600;
  margin-left: 8px;
  padding: 4px 8px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 8px;
}

/* 结果容器 */
.result-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  min-height: 500px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* ScTable 自定义样式 */
.video-results-table {
  --el-table-border-color: rgba(224, 230, 237, 0.5);
  --el-table-header-bg-color: rgba(247, 250, 252, 0.8);
  --el-table-row-hover-bg-color: rgba(102, 126, 234, 0.05);
}

/* 海报相关样式 */
.poster-cell {
  position: relative;
  width: 100px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
}

.poster-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.poster-cell:hover .poster-image {
  transform: scale(1.05);
}

.poster-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  cursor: pointer;
}

.poster-cell:hover .poster-overlay {
  opacity: 1;
}

.play-icon {
  font-size: 24px;
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.video-duration {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

/* 视频信息样式 */
.video-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.video-title {
  font-size: 16px;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.video-meta .el-tag {
  font-weight: 600;
  border: none;
  border-radius: 6px;
  font-size: 12px;
}

.video-description {
  color: #718096;
  font-size: 13px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #718096;
}

.video-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 下载链接样式 */
.download-links {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.download-links .el-button {
  margin: 0;
  font-size: 12px;
  padding: 4px 8px;
}

/* 操作按钮样式 */
.action-buttons-cell {
  display: flex;
  gap: 4px;
}

.action-buttons-cell .el-button {
  padding: 4px 8px;
  font-size: 12px;
}

/* 网格卡片样式 */
.video-grid-card {
  position: relative;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
}

.video-grid-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  border-color: rgba(102, 126, 234, 0.3);
}

.grid-selector {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  padding: 4px;
  backdrop-filter: blur(5px);
}

.grid-poster {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
}

.grid-poster .poster-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.video-grid-card:hover .grid-poster .poster-image {
  transform: scale(1.1);
}

.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.video-grid-card:hover .grid-overlay {
  opacity: 1;
}

.grid-overlay .play-icon {
  font-size: 36px;
}

.grid-content {
  padding: 16px;
}

.grid-title {
  font-size: 14px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.grid-meta {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}

.grid-meta .el-tag {
  font-size: 11px;
}

.grid-actions {
  display: flex;
  gap: 6px;
}

.grid-actions .el-button {
  flex: 1;
  font-size: 11px;
  padding: 4px 8px;
}

/* 列表项样式 */
.video-list-item {
  display: flex;
  align-items: stretch;
  padding: 20px;
  border-bottom: 1px solid rgba(224, 230, 237, 0.5);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  background: white;
}

.video-list-item:hover {
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  transform: translateX(4px);
}

.video-list-item.selected {
  background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%);
  border-left: 4px solid #667eea;
}

.video-list-item:last-child {
  border-bottom: none;
}

.list-selector {
  display: flex;
  align-items: center;
  margin-right: 16px;
}

.list-poster {
  position: relative;
  width: 200px;
  height: 120px;
  border-radius: 12px;
  overflow: hidden;
  margin-right: 20px;
  flex-shrink: 0;
}

.list-poster .poster-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.video-list-item:hover .list-poster .poster-image {
  transform: scale(1.05);
}

.list-poster .poster-overlay {
  border-radius: 12px;
}

.list-poster .video-duration {
  bottom: 8px;
  right: 8px;
}

.list-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-right: 20px;
}

.download-section {
  background: rgba(247, 250, 252, 0.8);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(224, 230, 237, 0.5);
}

.download-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-weight: 600;
  color: #4a5568;
  font-size: 13px;
}

.download-section .download-links {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.download-section .download-links .el-button {
  font-size: 12px;
  padding: 4px 8px;
}

.list-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 120px;
}

.list-actions .el-button {
  margin: 0;
}

/* 空状态样式 */
.empty-state {
  padding: 80px 20px;
  text-align: center;
  background: rgba(255, 255, 255, 0.5);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .video-grid-card {
    margin-bottom: 16px;
  }
}

@media (max-width: 768px) {
  .video-search-result {
    padding: 12px;
  }

  .search-header {
    padding: 20px;
    flex-direction: column;
    align-items: stretch;
  }

  .search-info {
    min-width: auto;
    margin-bottom: 16px;
  }

  .search-title {
    font-size: 24px;
  }

  .filter-section {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .filter-group {
    justify-content: space-between;
  }

  .video-list-item {
    flex-direction: column;
    gap: 16px;
  }

  .list-poster {
    width: 100%;
    height: 200px;
    margin-right: 0;
  }

  .list-content {
    margin-right: 0;
  }

  .list-actions {
    flex-direction: row;
    min-width: auto;
  }

  .action-buttons {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .search-title {
    font-size: 20px;
  }

  .video-list-item {
    padding: 16px;
  }

  .action-buttons {
    flex-direction: column;
  }
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.video-list-item,
.video-grid-card {
  animation: fadeInUp 0.3s ease-out;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-button) {
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

:deep(.el-button:hover) {
  transform: translateY(-1px);
}

:deep(.el-tag) {
  border-radius: 6px;
  font-weight: 600;
}

:deep(.el-select) {
  min-width: 140px;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #667eea;
  border-color: #667eea;
}

:deep(.el-radio-button__inner) {
  border-radius: 8px;
  font-weight: 600;
}

:deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
  background-color: #667eea;
  border-color: #667eea;
}

/* ScTable 样式覆盖 */
:deep(.sc-table) {
  border-radius: 0;
  border: none;
}

:deep(.sc-table .el-table) {
  background: transparent;
}

:deep(.sc-table .el-table__header) {
  background: rgba(247, 250, 252, 0.8);
}

:deep(.sc-table .el-table__body tr:hover > td) {
  background: rgba(102, 126, 234, 0.05) !important;
}

:deep(.sc-table .el-pagination) {
  background: rgba(255, 255, 255, 0.8);
  padding: 16px;
  margin: 0;
  border-top: 1px solid rgba(224, 230, 237, 0.5);
}

/* 自定义滚动条 */
.result-container::-webkit-scrollbar {
  width: 6px;
}

.result-container::-webkit-scrollbar-track {
  background: rgba(241, 241, 241, 0.5);
  border-radius: 3px;
}

.result-container::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.6);
  border-radius: 3px;
}

/* 下载进度对话框样式 */
.download-progress {
  max-height: 400px;
  overflow-y: auto;
}

.progress-item {
  margin-bottom: 16px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.file-name {
  font-weight: 600;
  color: #2d3748;
}

.progress-text {
  color: #718096;
  font-size: 14px;
}

/* 自定义滚动条 */
.download-progress::-webkit-scrollbar {
  width: 6px;
}

.download-progress::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.download-progress::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 3px;
}

.download-progress::-webkit-scrollbar-thumb:hover {
  background: #5a67d8;
}
</style>

/* 列表视图 */
.list-view {
  padding: 0;
}

.video-item {
  display: flex;
  align-items: stretch;
  padding: 24px;
  border-bottom: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.video-item:hover {
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  transform: translateX(4px);
}

.video-item.selected {
  background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%);
  border-left: 4px solid #667eea;
}

.video-item:last-child {
  border-bottom: none;
}

.item-selector {
  display: flex;
  align-items: center;
  margin-right: 20px;
}

.video-poster {
  position: relative;
  width: 200px;
  height: 120px;
  border-radius: 12px;
  overflow: hidden;
  margin-right: 24px;
  flex-shrink: 0;
}

.video-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.video-item:hover .video-poster img {
  transform: scale(1.05);
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 12px;
}

.video-item:hover .video-overlay {
  opacity: 1;
}

.play-icon {
  font-size: 36px;
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.video-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-right: 24px;
}

.video-header {
  margin-bottom: 8px;
}

.video-title {
  font-size: 18px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 12px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.video-meta .el-tag {
  font-weight: 600;
  border: none;
  border-radius: 8px;
}

.video-description {
  color: #718096;
  font-size: 14px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-stats {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #718096;
}

.video-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.download-section {
  background: #f7fafc;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.download-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
  color: #4a5568;
}

.download-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.video-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 120px;
}

/* 网格视图 */
.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  padding: 24px;
}

.grid-item {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.grid-item:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.grid-item.selected {
  border: 2px solid #667eea;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.grid-item-selector {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  padding: 4px;
}

.grid-poster {
  position: relative;
  width: 100%;
  height: 160px;
  overflow: hidden;
}

.grid-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.grid-item:hover .grid-poster img {
  transform: scale(1.1);
}

.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.grid-item:hover .grid-overlay {
  opacity: 1;
}

.grid-content {
  padding: 16px;
}

.grid-title {
  font-size: 16px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 12px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.grid-meta {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}

.grid-download {
  display: flex;
  gap: 6px;
}

.grid-download .el-button {
  flex: 1;
  font-size: 12px;
}

/* 空状态 */
.empty-state {
  padding: 80px 20px;
  text-align: center;
}

/* 分页 */
.pagination-wrapper {
  background: white;
  padding: 24px;
  border-radius: 0 0 16px 16px;
  border-top: 1px solid #e2e8f0;
  text-align: center;
}

/* 下载进度对话框 */
.download-progress {
  max-height: 400px;
  overflow-y: auto;
}

.progress-item {
  margin-bottom: 20px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.file-name {
  font-weight: 600;
  color: #2d3748;
}

.progress-text {
  color: #718096;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .grid-view {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .video-search-result {
    padding: 12px;
  }

  .search-header {
    padding: 20px;
    flex-direction: column;
    align-items: stretch;
  }

  .search-info {
    min-width: auto;
    margin-bottom: 16px;
  }

  .search-title {
    font-size: 24px;
  }

  .filter-section {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .filter-group {
    justify-content: space-between;
  }

  .video-item {
    flex-direction: column;
    gap: 16px;
  }

  .video-poster {
    width: 100%;
    height: 200px;
    margin-right: 0;
  }

  .video-content {
    margin-right: 0;
  }

  .video-actions {
    flex-direction: row;
    min-width: auto;
  }

  .grid-view {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    padding: 16px;
  }

  .action-buttons {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .search-title {
    font-size: 20px;
  }

  .video-item {
    padding: 16px;
  }

  .grid-view {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.video-item {
  animation: fadeInUp 0.3s ease-out;
}

.grid-item {
  animation: fadeInUp 0.3s ease-out;
}

/* 自定义滚动条 */
.download-progress::-webkit-scrollbar {
  width: 6px;
}

.download-progress::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.download-progress::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 3px;
}

.download-progress::-webkit-scrollbar-thumb:hover {
  background: #5a67d8;
}

/* 加载状态优化 */
.result-container[v-loading] {
  min-height: 500px;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-button) {
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

:deep(.el-button:hover) {
  transform: translateY(-1px);
}

:deep(.el-tag) {
  border-radius: 6px;
  font-weight: 600;
}

:deep(.el-select) {
  min-width: 140px;
}

:deep(.el-pagination) {
  --el-pagination-button-color: #667eea;
  --el-pagination-hover-color: #5a67d8;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #667eea;
  border-color: #667eea;
}

:deep(.el-radio-button__inner) {
  border-radius: 8px;
  font-weight: 600;
}

:deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
  background-color: #667eea;
  border-color: #667eea;
}