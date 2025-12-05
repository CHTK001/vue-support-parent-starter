<template>
  <div class="search-result-page">
    <!-- 顶部栏 -->
    <header class="header">
      <div class="header-content">
        <span class="back" @click="goBack">← 返回</span>
        <h1 class="title">「{{ searchKeyword }}」的搜索结果</h1>
        <span class="count">共 {{ totalCount }} 条</span>
      </div>
    </header>

    <!-- 结果列表 -->
    <main class="main">
      <ScTable
        ref="tableRef"
        layout="list"
        :url="findOnlineResources"
        :params="searchParams"
        row-key="id"
        :page-size="pageSize"
        :border="false"
        :stripe="false"
        :loading="loading"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
        class="result-table"
      >
        <template #default="{ row }">
          <div class="movie-item" @click="goToDetail(row)">
            <!-- 海报 -->
            <div class="poster">
              <el-image
                :src="row.videoCover || '/placeholder.jpg'"
                fit="cover"
                class="poster-img"
              />
            </div>
            <!-- 信息 -->
            <div class="info">
              <h3 class="name">{{ row.videoTitle }}</h3>
              <p class="meta">
                <span v-if="row.videoType">{{ row.videoType }}</span>
                <span v-if="row.videoYear">{{ row.videoYear }}</span>
                <span>热度 {{ row.videoPopularity }}</span>
                <span>{{ row.videoSize }}</span>
              </p>
              <p class="desc" v-if="row.videoDescription">
                {{ row.videoDescription }}
              </p>
            </div>
            <!-- 操作 -->
            <div class="actions">
              <el-button
                type="primary"
                size="small"
                @click.stop="downloadFile(row)"
              >
                下载
              </el-button>
            </div>
          </div>
        </template>
      </ScTable>

      <!-- 空状态 -->
      <div v-if="!loading && totalCount === 0" class="empty">
        <p>暂无搜索结果</p>
        <el-button @click="goBack">返回搜索</el-button>
      </div>
    </main>

    <!-- 下载进度 -->
    <el-dialog v-model="downloadDialogVisible" title="下载进度" width="400px">
      <div v-for="task in downloadTasks" :key="task.id" class="progress-item">
        <div class="progress-header">
          <span>{{ task.fileName }}</span>
          <span>{{ task.progress }}%</span>
        </div>
        <el-progress :percentage="task.progress" :status="task.status" />
      </div>
      <template #footer>
        <el-button @click="downloadDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// 已使用 IconifyIconOnline 替代 Element Plus 图标
import { ElMessage, ElNotification } from "element-plus";
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
const currentPage = ref(1);
const pageSize = ref(20);

// 表格引用
const tableRef = ref();

// 下载相关
const downloadingItems = ref<string[]>([]);
const downloadDialogVisible = ref(false);
const downloadTasks = ref<DownloadTask[]>([]);

// 搜索参数
const searchParams = computed(() => ({
  keyword: searchKeyword.value,
  page: currentPage.value,
  pageSize: pageSize.value,
}));

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
    link.download = `${item.videoTitle}.${getFileExtension(item.donwloadUrls) || "mp4"}`;
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
    console.error("下载失败:", error);
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
    const extension = pathname.split(".").pop();
    return extension || "";
  } catch {
    return "";
  }
};

// 跳转到视频详情
const goToDetail = (video: VideoItem) => {
  router.push(`/video/detail/${video.id}`);
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
/* 页面容器 */
.search-result-page {
  min-height: 100vh;
  background: #f8f8f8;
}

/* 顶部栏 */
.header {
  background: #fff;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.back {
  color: #666;
  cursor: pointer;
  font-size: 14px;
}

.back:hover {
  color: #333;
}

.title {
  flex: 1;
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.count {
  color: #999;
  font-size: 13px;
}

/* 主内容 */
.main {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

/* 电影项 */
.movie-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.movie-item:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

/* 海报 */
.poster {
  width: 90px;
  height: 130px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.poster-img {
  width: 100%;
  height: 100%;
}

/* 信息 */
.info {
  flex: 1;
  min-width: 0;
}

.name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.movie-item:hover .name {
  color: #1890ff;
}

.meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #999;
}

.meta span {
  display: inline-block;
}

.desc {
  margin: 0;
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 操作 */
.actions {
  display: flex;
  align-items: flex-start;
}

/* 空状态 */
.empty {
  text-align: center;
  padding: 80px 20px;
  color: #999;
}

.empty p {
  margin: 0 0 16px 0;
}

/* 进度对话框 */
.progress-item {
  margin-bottom: 16px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

/* ScTable 覆盖 */
:deep(.sc-table) {
  background: transparent;
}

:deep(.sc-table .el-pagination) {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
}

/* 响应式 */
@media (max-width: 640px) {
  .header-content {
    padding: 12px 16px;
  }

  .title {
    font-size: 15px;
  }

  .main {
    padding: 12px;
  }

  .movie-item {
    padding: 12px;
  }

  .poster {
    width: 70px;
    height: 100px;
  }

  .name {
    font-size: 14px;
  }
}
</style>
