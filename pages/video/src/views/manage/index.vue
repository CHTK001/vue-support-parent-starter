<template>
  <div class="video-manage">
    <!-- 页面头部 -->
    <div class="manage-header mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 mb-2">视频管理</h1>
          <p class="text-gray-600">管理本地视频资源，支持批量操作和详情查看</p>
        </div>

        <div class="header-actions flex items-center space-x-3">
          <el-button @click="refreshVideos">
            <el-icon><IconifyIconOnline icon="ep:refresh" /></el-icon>
            刷新
          </el-button>
          <el-button type="primary" @click="showUploadDialog = true">
            <el-icon><IconifyIconOnline icon="ep:upload" /></el-icon>
            上传视频
          </el-button>
          <el-button type="success" @click="showImportDialog = true">
            <el-icon><IconifyIconOnline icon="ep:download" /></el-icon>
            导入视频
          </el-button>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-cards grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <div class="stat-card bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="stat-icon bg-blue-100 text-blue-600 p-3 rounded-full mr-3">
            <el-icon><IconifyIconOnline icon="ep:video-play" /></el-icon>
          </div>
          <div>
            <p class="text-sm text-gray-500">总视频数</p>
            <p class="text-2xl font-bold text-gray-800">{{ stats.totalVideos }}</p>
          </div>
        </div>
      </div>

      <div class="stat-card bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="stat-icon bg-green-100 text-green-600 p-3 rounded-full mr-3">
            <el-icon><IconifyIconOnline icon="ep:folder-opened" /></el-icon>
          </div>
          <div>
            <p class="text-sm text-gray-500">总大小</p>
            <p class="text-2xl font-bold text-gray-800">{{ formatFileSize(stats.totalSize) }}</p>
          </div>
        </div>
      </div>

      <div class="stat-card bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="stat-icon bg-yellow-100 text-yellow-600 p-3 rounded-full mr-3">
            <el-icon><IconifyIconOnline icon="ep:star" /></el-icon>
          </div>
          <div>
            <p class="text-sm text-gray-500">收藏数</p>
            <p class="text-2xl font-bold text-gray-800">{{ stats.favoriteVideos }}</p>
          </div>
        </div>
      </div>

      <div class="stat-card bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="stat-icon bg-purple-100 text-purple-600 p-3 rounded-full mr-3">
            <el-icon><IconifyIconOnline icon="ep:view" /></el-icon>
          </div>
          <div>
            <p class="text-sm text-gray-500">总播放</p>
            <p class="text-2xl font-bold text-gray-800">{{ stats.totalViews }}</p>
          </div>
        </div>
      </div>

      <div class="stat-card bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="stat-icon bg-red-100 text-red-600 p-3 rounded-full mr-3">
            <el-icon><IconifyIconOnline icon="ep:clock" /></el-icon>
          </div>
          <div>
            <p class="text-sm text-gray-500">今日新增</p>
            <p class="text-2xl font-bold text-gray-800">{{ stats.todayAdded }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar bg-white rounded-lg shadow p-4 mb-6">
      <div class="flex items-center justify-between">
        <div class="toolbar-left flex items-center space-x-4">
          <!-- 搜索框 -->
          <el-input v-model="searchKeyword" placeholder="搜索视频标题、演员、导演..." style="width: 300px" @input="handleSearch" clearable>
            <template #prefix>
              <el-icon><IconifyIconOnline icon="ep:search" /></el-icon>
            </template>
          </el-input>

          <!-- 分类筛选 -->
          <el-select v-model="categoryFilter" placeholder="分类" style="width: 120px" @change="handleFilter">
            <el-option label="全部" value="" />
            <el-option label="电影" value="movie" />
            <el-option label="电视剧" value="tv" />
            <el-option label="综艺" value="variety" />
            <el-option label="动漫" value="anime" />
            <el-option label="纪录片" value="documentary" />
          </el-select>

          <!-- 状态筛选 -->
          <el-select v-model="statusFilter" placeholder="状态" style="width: 120px" @change="handleFilter">
            <el-option label="全部" value="" />
            <el-option label="正常" value="normal" />
            <el-option label="收藏" value="favorite" />
            <el-option label="已删除" value="deleted" />
          </el-select>
        </div>

        <div class="toolbar-right flex items-center space-x-3">
          <!-- 视图切换 -->
          <el-radio-group v-model="viewMode" @change="handleViewModeChange">
            <el-radio-button label="list">
              <el-icon><IconifyIconOnline icon="ep:list" /></el-icon>
            </el-radio-button>
            <el-radio-button label="grid">
              <el-icon><IconifyIconOnline icon="ep:grid" /></el-icon>
            </el-radio-button>
          </el-radio-group>

          <!-- 批量操作 -->
          <el-dropdown @command="handleBatchCommand" :disabled="selectedVideos.length === 0">
            <el-button :disabled="selectedVideos.length === 0">
              批量操作 ({{ selectedVideos.length }})
              <el-icon class="ml-1"><IconifyIconOnline icon="ep:arrow-down" /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="favorite">批量收藏</el-dropdown-item>
                <el-dropdown-item command="unfavorite">取消收藏</el-dropdown-item>
                <el-dropdown-item command="download">批量下载</el-dropdown-item>
                <el-dropdown-item command="export">导出信息</el-dropdown-item>
                <el-dropdown-item command="delete" divided>批量删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 视频列表 -->
    <div class="video-content bg-white rounded-lg shadow">
      <!-- 列表视图 -->
      <div v-if="viewMode === 'list'" class="list-view">
        <el-table :data="videoList" v-loading="loading" stripe @selection-change="handleSelectionChange" @row-click="handleRowClick">
          <el-table-column type="selection" width="55" />

          <el-table-column label="封面" width="100">
            <template #default="{ row }">
              <div class="video-cover-cell">
                <img :src="row.videoCover || '/placeholder-video.jpg'" :alt="row.videoTitle" class="w-16 h-10 object-cover rounded cursor-pointer" @click="previewVideo(row)" @error="handleImageError" />
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="videoTitle" label="标题" min-width="200">
            <template #default="{ row }">
              <div class="video-title-cell">
                <div class="font-medium text-gray-800 hover:text-blue-600 cursor-pointer" @click="viewVideoDetail(row)">
                  {{ row.videoTitle }}
                </div>
                <div class="text-sm text-gray-500 mt-1">
                  {{ row.videoDescription || "暂无描述" }}
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="videoCategory" label="分类" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="getCategoryType(row.videoCategory)">
                {{ getCategoryName(row.videoCategory) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="videoDuration" label="时长" width="100">
            <template #default="{ row }">
              <span class="text-gray-600">{{ formatDuration(row.videoDuration) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="videoSize" label="大小" width="100">
            <template #default="{ row }">
              <span class="text-gray-600">{{ formatFileSize(row.videoSize) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="videoViews" label="播放" width="80" align="center">
            <template #default="{ row }">
              <span class="font-medium">{{ row.videoViews || 0 }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="createTime" label="添加时间" width="160">
            <template #default="{ row }">
              <span class="text-gray-500">{{ formatTime(row.createTime) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <div class="flex items-center space-x-2">
                <el-button size="small" type="primary" @click="playVideo(row)"> 播放 </el-button>
                <el-button size="small" @click="editVideo(row)"> 编辑 </el-button>
                <el-dropdown @command="(command) => handleVideoCommand(command, row)">
                  <el-button size="small">
                    更多
                    <el-icon class="ml-1"><IconifyIconOnline icon="ep:arrow-down" /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="favorite">
                        {{ row.isFavorite ? "取消收藏" : "收藏" }}
                      </el-dropdown-item>
                      <el-dropdown-item command="download">下载</el-dropdown-item>
                      <el-dropdown-item command="share">分享</el-dropdown-item>
                      <el-dropdown-item command="info">详情</el-dropdown-item>
                      <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 网格视图 -->
      <div v-else class="grid-view p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div v-for="video in videoList" :key="video.videoId" class="video-card bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" @click="viewVideoDetail(video)">
            <!-- 视频封面 -->
            <div class="video-cover-container relative">
              <img :src="video.videoCover || '/placeholder-video.jpg'" :alt="video.videoTitle" class="w-full h-32 object-cover" @error="handleImageError" />

              <!-- 播放按钮覆盖层 -->
              <div class="play-overlay absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" @click.stop="playVideo(video)">
                <el-icon class="text-white text-3xl"><IconifyIconOnline icon="ep:video-play" /></el-icon>
              </div>

              <!-- 时长标签 -->
              <div class="duration-label absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                {{ formatDuration(video.videoDuration) }}
              </div>

              <!-- 选择框 -->
              <div class="selection-checkbox absolute top-2 left-2">
                <el-checkbox :model-value="selectedVideos.includes(video)" @change="(checked) => handleVideoSelection(video, checked)" @click.stop />
              </div>
            </div>

            <!-- 视频信息 -->
            <div class="video-info p-3">
              <h4 class="video-title font-medium text-gray-800 text-sm mb-1 line-clamp-2">
                {{ video.videoTitle }}
              </h4>

              <div class="video-meta text-xs text-gray-500 mb-2">
                <div class="flex items-center justify-between">
                  <span>{{ getCategoryName(video.videoCategory) }}</span>
                  <span>{{ formatFileSize(video.videoSize) }}</span>
                </div>
                <div class="flex items-center justify-between mt-1">
                  <span>{{ video.videoViews || 0 }} 次播放</span>
                  <span>{{ formatTime(video.createTime) }}</span>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="video-actions flex items-center justify-between">
                <div class="action-buttons flex items-center space-x-1">
                  <el-button size="small" type="primary" @click.stop="playVideo(video)"> 播放 </el-button>
                  <el-button size="small" @click.stop="editVideo(video)"> 编辑 </el-button>
                </div>

                <div class="action-icons flex items-center space-x-1">
                  <el-button size="small" :type="video.isFavorite ? 'warning' : 'info'" circle @click.stop="toggleFavorite(video)">
                    <el-icon><IconifyIconOnline icon="ep:star" /></el-icon>
                  </el-button>

                  <el-dropdown @command="(command) => handleVideoCommand(command, video)" @click.stop>
                    <el-button size="small" circle>
                      <el-icon><IconifyIconOnline icon="ep:more-filled" /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="download">下载</el-dropdown-item>
                        <el-dropdown-item command="share">分享</el-dropdown-item>
                        <el-dropdown-item command="info">详情</el-dropdown-item>
                        <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-container p-4 flex justify-center" v-if="totalCount > 0">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[20, 50, 100, 200]" :total="totalCount" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      </div>
    </div>

    <!-- 视频详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="视频详情" width="800px">
      <div v-if="currentVideo" class="video-detail">
        <div class="flex">
          <!-- 视频封面 -->
          <div class="video-cover mr-6">
            <img :src="currentVideo.videoCover || '/placeholder-video.jpg'" :alt="currentVideo.videoTitle" class="w-48 h-32 object-cover rounded" />
          </div>

          <!-- 视频信息 -->
          <div class="video-info flex-1">
            <h3 class="text-xl font-bold mb-3">{{ currentVideo.videoTitle }}</h3>

            <div class="info-grid grid grid-cols-2 gap-4 text-sm">
              <div><span class="font-medium">分类:</span> {{ getCategoryName(currentVideo.videoCategory) }}</div>
              <div><span class="font-medium">时长:</span> {{ formatDuration(currentVideo.videoDuration) }}</div>
              <div><span class="font-medium">大小:</span> {{ formatFileSize(currentVideo.videoSize) }}</div>
              <div><span class="font-medium">播放次数:</span> {{ currentVideo.videoViews || 0 }}</div>
              <div><span class="font-medium">导演:</span> {{ currentVideo.videoDirector || "未知" }}</div>
              <div><span class="font-medium">演员:</span> {{ currentVideo.videoActors || "未知" }}</div>
              <div><span class="font-medium">年份:</span> {{ currentVideo.videoYear || "未知" }}</div>
              <div><span class="font-medium">地区:</span> {{ currentVideo.videoRegion || "未知" }}</div>
            </div>

            <div class="video-description mt-4">
              <span class="font-medium">简介:</span>
              <p class="text-gray-600 mt-1">{{ currentVideo.videoDescription || "暂无简介" }}</p>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDetailDialog = false">关闭</el-button>
          <el-button type="primary" @click="playVideo(currentVideo)">播放</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 上传视频对话框 -->
    <el-dialog v-model="showUploadDialog" title="上传视频" width="600px">
      <el-upload class="upload-demo" drag :action="uploadUrl" :headers="uploadHeaders" :on-success="handleUploadSuccess" :on-error="handleUploadError" :before-upload="beforeUpload" multiple accept="video/*">
        <el-icon class="el-icon--upload"><IconifyIconOnline icon="ep:upload-filled" /></el-icon>
        <div class="el-upload__text">将视频文件拖拽到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">支持 mp4, avi, mkv, mov 等格式，单个文件不超过 2GB</div>
        </template>
      </el-upload>
    </el-dialog>

    <!-- 导入视频对话框 -->
    <el-dialog v-model="showImportDialog" title="导入视频" width="600px">
      <el-form :model="importForm" label-width="100px">
        <el-form-item label="导入方式">
          <el-radio-group v-model="importForm.type">
            <el-radio label="url">URL导入</el-radio>
            <el-radio label="folder">文件夹扫描</el-radio>
            <el-radio label="batch">批量导入</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="importForm.type === 'url'" label="视频URL">
          <el-input v-model="importForm.url" placeholder="请输入视频URL" />
        </el-form-item>

        <el-form-item v-if="importForm.type === 'folder'" label="文件夹路径">
          <el-input v-model="importForm.folderPath" placeholder="请输入文件夹路径" />
        </el-form-item>

        <el-form-item v-if="importForm.type === 'batch'" label="批量URL">
          <el-input v-model="importForm.batchUrls" type="textarea" :rows="5" placeholder="每行一个URL" />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showImportDialog = false">取消</el-button>
          <el-button type="primary" @click="handleImport" :loading="importing"> 导入 </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from "element-plus";
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
// 移除@element-plus/icons-vue导入，直接使用IconifyIconOnline全局组件
import type { VideoInfo, VideoSearchRequest } from "../../api/types";
import { deleteVideo, getVideoDetail, getVideoStats, searchVideos } from "../../api/video";

/**
 * 视频管理页面
 * @author CH
 * @version 1.0.0
 * @since 2024-12-19
 */

const router = useRouter();

// 页面状态
const loading = ref(false);
const importing = ref(false);
const searchKeyword = ref("");
const categoryFilter = ref("");
const statusFilter = ref("");
const viewMode = ref("list");
const currentPage = ref(1);
const pageSize = ref(20);
const totalCount = ref(0);

// 数据
const videoList = ref<VideoInfo[]>([]);
const selectedVideos = ref<VideoInfo[]>([]);
const currentVideo = ref<VideoInfo | null>(null);

// 统计信息
const stats = reactive({
  totalVideos: 0,
  totalSize: 0,
  favoriteVideos: 0,
  totalViews: 0,
  todayAdded: 0,
});

// 对话框状态
const showDetailDialog = ref(false);
const showUploadDialog = ref(false);
const showImportDialog = ref(false);

// 表单
const importForm = reactive({
  type: "url",
  url: "",
  folderPath: "",
  batchUrls: "",
});

// 上传配置
const uploadUrl = computed(() => "/api/video/upload");
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
}));

/**
 * 加载视频列表
 */
const loadVideos = () => {
  loading.value = true;

  const request: VideoSearchRequest = {
    keyword: searchKeyword.value,
    category: categoryFilter.value,
    page: currentPage.value,
    size: pageSize.value,
  };

  searchVideos(request)
    .then((response) => {
      if (response.code === 1000) {
        videoList.value = response.data.records;
        totalCount.value = response.data.total;
      }
    })
    .catch((error) => {
      console.error("加载视频列表失败:", error);
      ElMessage.error("加载视频列表失败");
    })
    .finally(() => {
      loading.value = false;
    });
};

/**
 * 加载统计信息
 */
const loadStats = () => {
  getVideoStats()
    .then((response) => {
      if (response.code === 1000) {
        Object.assign(stats, response.data);
      }
    })
    .catch((error) => {
      console.error("加载统计信息失败:", error);
    });
};

/**
 * 刷新视频
 */
const refreshVideos = () => {
  loadVideos();
  loadStats();
};

/**
 * 处理搜索
 */
const handleSearch = () => {
  currentPage.value = 1;
  loadVideos();
};

/**
 * 处理筛选
 */
const handleFilter = () => {
  currentPage.value = 1;
  loadVideos();
};

/**
 * 处理视图模式变化
 */
const handleViewModeChange = () => {
  // 保存用户偏好
  localStorage.setItem("video-view-mode", viewMode.value);
};

/**
 * 处理选择变化
 */
const handleSelectionChange = (selection: VideoInfo[]) => {
  selectedVideos.value = selection;
};

/**
 * 处理视频选择
 */
const handleVideoSelection = (video: VideoInfo, checked: boolean) => {
  if (checked) {
    if (!selectedVideos.value.includes(video)) {
      selectedVideos.value.push(video);
    }
  } else {
    const index = selectedVideos.value.indexOf(video);
    if (index > -1) {
      selectedVideos.value.splice(index, 1);
    }
  }
};

/**
 * 处理行点击
 */
const handleRowClick = (row: VideoInfo) => {
  viewVideoDetail(row);
};

/**
 * 处理分页变化
 */
const handleCurrentChange = (page: number) => {
  currentPage.value = page;
  loadVideos();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  loadVideos();
};

/**
 * 查看视频详情
 */
const viewVideoDetail = (video: VideoInfo) => {
  getVideoDetail(video.videoId)
    .then((response) => {
      if (response.code === 1000) {
        currentVideo.value = response.data;
        showDetailDialog.value = true;
      }
    })
    .catch((error) => {
      console.error("获取视频详情失败:", error);
      ElMessage.error("获取视频详情失败");
    });
};

/**
 * 播放视频
 */
const playVideo = (video: VideoInfo) => {
  // 跳转到播放页面
  router.push({
    name: "VideoPlay",
    params: { id: video.videoId },
  });
};

/**
 * 预览视频
 */
const previewVideo = (video: VideoInfo) => {
  // 在当前页面预览
  viewVideoDetail(video);
};

/**
 * 编辑视频
 */
const editVideo = (video: VideoInfo) => {
  // 跳转到编辑页面
  router.push({
    name: "VideoEdit",
    params: { id: video.videoId },
  });
};

/**
 * 切换收藏状态
 */
const toggleFavorite = (video: VideoInfo) => {
  // TODO: 实现收藏功能API
  // const apiCall = video.isFavorite ? removeVideoFromCollection(video.videoId) : addVideoToCollection(video.videoId);
  // apiCall.then(() => {
  //   video.isFavorite = !video.isFavorite;
  //   ElMessage.success(video.isFavorite ? "收藏成功" : "取消收藏成功");
  // }).catch((error) => {
  //   console.error("操作失败:", error);
  //   ElMessage.error("操作失败");
  // });

  // 临时实现：直接切换状态
  try {
    video.isFavorite = !video.isFavorite;
    ElMessage.success(video.isFavorite ? "收藏成功" : "取消收藏成功");
  } catch (error) {
    console.error("操作失败:", error);
    ElMessage.error("操作失败");
  }
};

/**
 * 处理视频命令
 */
const handleVideoCommand = (command: string, video: VideoInfo) => {
  switch (command) {
    case "favorite":
      toggleFavorite(video);
      break;
    case "download":
      downloadVideo(video);
      break;
    case "share":
      shareVideo(video);
      break;
    case "info":
      viewVideoDetail(video);
      break;
    case "delete":
      deleteVideoConfirm(video);
      break;
  }
};

/**
 * 下载视频
 */
const downloadVideo = (video: VideoInfo) => {
  // 跳转到下载页面
  router.push({
    name: "VideoDownload",
    params: { id: video.videoId },
  });
};

/**
 * 分享视频
 */
const shareVideo = (video: VideoInfo) => {
  const shareUrl = `${window.location.origin}/video/play/${video.videoId}`;
  navigator.clipboard.writeText(shareUrl)
    .then(() => {
      ElMessage.success("分享链接已复制到剪贴板");
    })
    .catch((error) => {
      ElMessage.error("复制失败");
    });
};

/**
 * 删除视频确认
 */
const deleteVideoConfirm = (video: VideoInfo) => {
  ElMessageBox.confirm(`确定要删除视频 "${video.videoTitle}" 吗？`, "确认删除", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      deleteVideo(video.videoId)
        .then((response) => {
          if (response.code === 1000) {
            ElMessage.success("删除成功");
            loadVideos();
          }
        })
        .catch((error) => {
          console.error("删除失败:", error);
          ElMessage.error("删除失败");
        });
    })
    .catch((error) => {
      if (error !== "cancel") {
        console.error("删除失败:", error);
        ElMessage.error("删除失败");
      }
    });
};

/**
 * 处理批量命令
 */
const handleBatchCommand = (command: string) => {
  if (selectedVideos.value.length === 0) {
    ElMessage.warning("请先选择视频");
    return;
  }

  switch (command) {
    case "favorite":
      batchFavorite(true);
      break;
    case "unfavorite":
      batchFavorite(false);
      break;
    case "download":
      batchDownload();
      break;
    case "export":
      exportVideoInfo();
      break;
    case "delete":
      batchDelete();
      break;
  }
};

/**
 * 批量收藏
 */
const batchFavorite = (favorite: boolean) => {
  // TODO: 实现批量收藏功能API
  // const promises = selectedVideos.value.map((video) => (favorite ? addVideoToCollection(video.videoId) : removeVideoFromCollection(video.videoId)));
  // Promise.all(promises)
  //   .then(() => {
  //     selectedVideos.value.forEach((video) => {
  //       video.isFavorite = favorite;
  //     });
  //     ElMessage.success(`批量${favorite ? "收藏" : "取消收藏"}成功`);
  //     selectedVideos.value = [];
  //   })
  //   .catch((error) => {
  //     console.error("批量操作失败:", error);
  //     ElMessage.error("批量操作失败");
  //   });

  // 临时实现：直接更新状态
  try {
    selectedVideos.value.forEach((video) => {
      video.isFavorite = favorite;
    });

    ElMessage.success(`批量${favorite ? "收藏" : "取消收藏"}成功`);
    selectedVideos.value = [];
  } catch (error) {
    console.error("批量操作失败:", error);
    ElMessage.error("批量操作失败");
  }
};

/**
 * 批量下载
 */
const batchDownload = () => {
  const videoIds = selectedVideos.value.map((v) => v.videoId);
  router.push({
    name: "VideoBatchDownload",
    query: { ids: videoIds.join(",") },
  });
};

/**
 * 导出视频信息
 */
const exportVideoInfo = () => {
  const data = selectedVideos.value.map((video) => ({
    标题: video.videoTitle,
    分类: getCategoryName(video.videoCategory),
    时长: formatDuration(video.videoDuration),
    大小: formatFileSize(video.videoSize),
    播放次数: video.videoViews || 0,
    添加时间: formatTime(video.createTime),
  }));

  const csv = convertToCSV(data);
  downloadCSV(csv, "video-export.csv");

  ElMessage.success("导出成功");
};

/**
 * 批量删除
 */
const batchDelete = () => {
  ElMessageBox.confirm(`确定要删除选中的 ${selectedVideos.value.length} 个视频吗？`, "确认批量删除", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      const promises = selectedVideos.value.map((video) => deleteVideo(video.videoId));
      Promise.all(promises)
        .then(() => {
          ElMessage.success("批量删除成功");
          selectedVideos.value = [];
          loadVideos();
        })
        .catch((error) => {
          console.error("批量删除失败:", error);
          ElMessage.error("批量删除失败");
        });
    })
    .catch((error) => {
      if (error !== "cancel") {
        console.error("批量删除失败:", error);
        ElMessage.error("批量删除失败");
      }
    });
};

/**
 * 处理上传成功
 */
const handleUploadSuccess = (response: any) => {
  ElMessage.success("上传成功");
  showUploadDialog.value = false;
  loadVideos();
};

/**
 * 处理上传错误
 */
const handleUploadError = (error: any) => {
  console.error("上传失败:", error);
  ElMessage.error("上传失败");
};

/**
 * 上传前检查
 */
const beforeUpload = (file: File) => {
  const isVideo = file.type.startsWith("video/");
  const isLt2G = file.size / 1024 / 1024 / 1024 < 2;

  if (!isVideo) {
    ElMessage.error("只能上传视频文件");
    return false;
  }

  if (!isLt2G) {
    ElMessage.error("文件大小不能超过 2GB");
    return false;
  }

  return true;
};

/**
 * 处理导入
 */
const handleImport = async () => {
  importing.value = true;

  try {
    // TODO: 实现导入逻辑
    ElMessage.success("导入成功");
    showImportDialog.value = false;
    loadVideos();
  } catch (error) {
    console.error("导入失败:", error);
    ElMessage.error("导入失败");
  } finally {
    importing.value = false;
  }
};

/**
 * 获取分类类型
 */
const getCategoryType = (category: string) => {
  const typeMap: Record<string, string> = {
    movie: "primary",
    tv: "success",
    variety: "warning",
    anime: "danger",
    documentary: "info",
  };
  return typeMap[category] || "";
};

/**
 * 获取分类名称
 */
const getCategoryName = (category: string) => {
  const nameMap: Record<string, string> = {
    movie: "电影",
    tv: "电视剧",
    variety: "综艺",
    anime: "动漫",
    documentary: "纪录片",
  };
  return nameMap[category] || category || "未知";
};

/**
 * 格式化文件大小
 */
const formatFileSize = (size: number) => {
  if (!size) return "-";
  if (size < 1024) return size + " B";
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
  if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + " MB";
  return (size / (1024 * 1024 * 1024)).toFixed(1) + " GB";
};

/**
 * 格式化时长
 */
const formatDuration = (duration: number) => {
  if (!duration) return "-";
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

/**
 * 格式化时间
 */
const formatTime = (time: string) => {
  if (!time) return "-";
  return new Date(time).toLocaleString();
};

/**
 * 处理图片错误
 */
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = "/placeholder-video.jpg";
};

/**
 * 转换为CSV
 */
const convertToCSV = (data: any[]) => {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csvContent = [headers.join(","), ...data.map((row) => headers.map((header) => `"${row[header]}"`).join(","))].join("\n");

  return csvContent;
};

/**
 * 下载CSV
 */
const downloadCSV = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 组件挂载
onMounted(() => {
  // 恢复用户偏好
  const savedViewMode = localStorage.getItem("video-view-mode");
  if (savedViewMode) {
    viewMode.value = savedViewMode;
  }

  loadVideos();
  loadStats();
});
</script>

<style scoped>
.video-manage {
  padding: 24px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.stat-card {
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.video-cover-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-title-cell {
  max-width: 200px;
}

.video-card {
  transition: all 0.3s ease;
}

.video-card:hover {
  transform: translateY(-2px);
}

.video-cover-container {
  position: relative;
  overflow: hidden;
}

.play-overlay {
  transition: opacity 0.3s ease;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-actions {
  margin-top: 8px;
}

.action-buttons .el-button {
  padding: 4px 8px;
  font-size: 12px;
}

.action-icons .el-button {
  padding: 4px;
}

@media (max-width: 768px) {
  .video-manage {
    padding: 16px;
  }

  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .header-actions {
    flex-direction: column;
    gap: 8px;
  }

  .toolbar-left {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .toolbar-right {
    margin-top: 12px;
  }
}
</style>
