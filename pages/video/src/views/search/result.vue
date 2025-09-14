<template>
  <div class="search-result">
    <!-- 搜索头部 -->
    <div class="search-header bg-white shadow-sm p-4 mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <el-button @click="goBack" circle>
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          
          <div class="search-info">
            <h2 class="text-xl font-semibold text-gray-800">
              "{{ searchParams.keyword }}" 的搜索结果
            </h2>
            <p class="text-sm text-gray-500 mt-1">
              找到 {{ totalCount }} 个结果，用时 {{ searchTime }}ms
            </p>
          </div>
        </div>
        
        <div class="search-actions">
          <el-button @click="showSearchDialog = true">
            <el-icon><Search /></el-icon>
            重新搜索
          </el-button>
        </div>
      </div>
    </div>

    <!-- 搜索过滤器 -->
    <div class="search-filters bg-white rounded-lg shadow p-4 mb-6">
      <div class="flex flex-wrap items-center gap-4">
        <div class="filter-item">
          <span class="filter-label">来源:</span>
          <el-radio-group v-model="currentSource" @change="handleSourceChange">
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button label="local">本地</el-radio-button>
            <el-radio-button label="pansou">PanSou</el-radio-button>
            <el-radio-button label="online">在线</el-radio-button>
          </el-radio-group>
        </div>
        
        <div class="filter-item">
          <span class="filter-label">排序:</span>
          <el-select v-model="sortBy" @change="handleSortChange" style="width: 120px">
            <el-option label="相关度" value="relevance" />
            <el-option label="时间" value="time" />
            <el-option label="评分" value="rating" />
            <el-option label="热度" value="popularity" />
          </el-select>
        </div>
        
        <div class="filter-item">
          <span class="filter-label">类型:</span>
          <el-select v-model="filterType" @change="handleFilterChange" style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="电影" value="movie" />
            <el-option label="电视剧" value="tv" />
            <el-option label="综艺" value="variety" />
            <el-option label="动漫" value="anime" />
          </el-select>
        </div>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div class="search-results">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>
      
      <!-- 结果列表 -->
      <div v-else-if="searchResults.length > 0" class="results-list">
        <div 
          v-for="result in searchResults" 
          :key="result.videoId"
          class="result-item bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4 mb-4"
        >
          <div class="flex">
            <!-- 视频封面 -->
            <div class="video-cover flex-shrink-0 mr-4">
              <img 
                :src="result.videoCover || '/placeholder-video.jpg'"
                :alt="result.videoTitle"
                class="w-32 h-20 object-cover rounded"
                @error="handleImageError"
              />
            </div>
            
            <!-- 视频信息 -->
            <div class="video-info flex-1">
              <div class="flex items-start justify-between">
                <div class="video-details flex-1">
                  <h3 class="video-title text-lg font-semibold text-gray-800 mb-2 hover:text-blue-600 cursor-pointer"
                      @click="viewVideoDetail(result)">
                    {{ result.videoTitle }}
                  </h3>
                  
                  <div class="video-meta flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-2">
                    <span v-if="result.videoYear">{{ result.videoYear }}</span>
                    <span v-if="result.videoDirector">导演: {{ result.videoDirector }}</span>
                    <span v-if="result.videoActors">主演: {{ result.videoActors }}</span>
                    <span v-if="result.videoRating" class="flex items-center">
                      <el-icon class="mr-1 text-yellow-500"><Star /></el-icon>
                      {{ result.videoRating }}
                    </span>
                  </div>
                  
                  <p class="video-description text-gray-600 text-sm line-clamp-2 mb-3">
                    {{ result.videoDescription || '暂无简介' }}
                  </p>
                  
                  <div class="video-tags flex flex-wrap gap-2">
                    <el-tag v-if="result.videoCategory" size="small" type="info">
                      {{ result.videoCategory }}
                    </el-tag>
                    <el-tag v-if="result.videoLanguage" size="small">
                      {{ result.videoLanguage }}
                    </el-tag>
                    <el-tag v-if="result.videoQuality" size="small" type="success">
                      {{ result.videoQuality }}
                    </el-tag>
                  </div>
                </div>
                
                <!-- 操作按钮 -->
                <div class="video-actions flex flex-col gap-2 ml-4">
                  <el-button type="primary" size="small" @click="playVideo(result)">
                    <el-icon><VideoPlay /></el-icon>
                    播放
                  </el-button>
                  <el-button size="small" @click="downloadVideo(result)">
                    <el-icon><Download /></el-icon>
                    下载
                  </el-button>
                  <el-button size="small" @click="collectVideo(result)">
                    <el-icon><Star /></el-icon>
                    收藏
                  </el-button>
                </div>
              </div>
              
              <!-- 来源信息 -->
              <div class="source-info mt-3 pt-3 border-t border-gray-100">
                <div class="flex items-center justify-between">
                  <div class="source-details flex items-center gap-4">
                    <span class="source-name flex items-center">
                      <el-icon class="mr-1 text-blue-500"><Link /></el-icon>
                      来源: {{ getSourceName(result.videoSource) }}
                    </span>
                    <span class="source-size" v-if="result.videoSize">
                      大小: {{ formatFileSize(result.videoSize) }}
                    </span>
                    <span class="source-time text-gray-400">
                      {{ formatTime(result.createTime) }}
                    </span>
                  </div>
                  
                  <div class="source-actions">
                    <el-button text type="primary" @click="viewSource(result)">
                      查看来源
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="empty-state text-center py-12">
        <el-empty description="没有找到相关视频">
          <el-button type="primary" @click="showSearchDialog = true">
            重新搜索
          </el-button>
        </el-empty>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-container flex justify-center mt-8" v-if="totalCount > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="totalCount"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 搜索对话框 -->
    <el-dialog v-model="showSearchDialog" title="重新搜索" width="600px">
      <el-form :model="newSearchForm" label-width="80px">
        <el-form-item label="关键词">
          <el-input v-model="newSearchForm.keyword" placeholder="请输入搜索关键词" />
        </el-form-item>
        <el-form-item label="搜索源">
          <el-select v-model="newSearchForm.source" placeholder="选择搜索源">
            <el-option label="全部" value="" />
            <el-option label="本地" value="local" />
            <el-option label="PanSou" value="pansou" />
            <el-option label="在线" value="online" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="newSearchForm.category" placeholder="选择分类">
            <el-option label="全部" value="" />
            <el-option label="电影" value="movie" />
            <el-option label="电视剧" value="tv" />
            <el-option label="综艺" value="variety" />
            <el-option label="动漫" value="anime" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showSearchDialog = false">取消</el-button>
          <el-button type="primary" @click="handleNewSearch">搜索</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, Search, VideoPlay, Download, Star, Link } from '@element-plus/icons-vue';
import { searchVideos, getVideoDetail, addVideoToCollection } from '../../api/video';
import { recordSearchBehavior } from '../../api/search';
import type { VideoInfo, VideoSearchRequest } from '../../api/types';

/**
 * 视频搜索结果页面
 * @author CH
 * @version 1.0.0
 * @since 2024-12-19
 */

const route = useRoute();
const router = useRouter();

// 搜索参数
const searchParams = reactive({
  keyword: '',
  source: '',
  category: '',
  year: '',
  platform: ''
});

// 页面状态
const loading = ref(false);
const searchResults = ref<VideoInfo[]>([]);
const totalCount = ref(0);
const searchTime = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);

// 过滤器
const currentSource = ref('');
const sortBy = ref('relevance');
const filterType = ref('');

// 对话框
const showSearchDialog = ref(false);
const newSearchForm = reactive({
  keyword: '',
  source: '',
  category: ''
});

/**
 * 返回上一页
 */
const goBack = () => {
  router.back();
};

/**
 * 执行搜索
 */
const performSearch = async () => {
  loading.value = true;
  const startTime = Date.now();
  
  try {
    const request: VideoSearchRequest = {
      keyword: searchParams.keyword,
      source: currentSource.value || searchParams.source,
      category: filterType.value || searchParams.category,
      year: searchParams.year ? parseInt(searchParams.year) : undefined,
      platform: searchParams.platform,
      page: currentPage.value,
      size: pageSize.value,
      sortBy: sortBy.value
    };
    
    const response = await searchVideos(request);
    
    if (response.code === 1000) {
      searchResults.value = response.data.records;
      totalCount.value = response.data.total;
      searchTime.value = Date.now() - startTime;
    } else {
      ElMessage.error(response.message || '搜索失败');
    }
  } catch (error) {
    console.error('搜索失败:', error);
    ElMessage.error('搜索失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

/**
 * 处理来源变化
 */
const handleSourceChange = () => {
  currentPage.value = 1;
  performSearch();
};

/**
 * 处理排序变化
 */
const handleSortChange = () => {
  currentPage.value = 1;
  performSearch();
};

/**
 * 处理过滤器变化
 */
const handleFilterChange = () => {
  currentPage.value = 1;
  performSearch();
};

/**
 * 处理页码变化
 */
const handleCurrentChange = (page: number) => {
  currentPage.value = page;
  performSearch();
};

/**
 * 处理页大小变化
 */
const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  performSearch();
};

/**
 * 查看视频详情
 */
const viewVideoDetail = async (video: VideoInfo) => {
  try {
    const response = await getVideoDetail(video.videoId);
    if (response.code === 1000) {
      // 跳转到视频详情页
      router.push({
        name: 'VideoDetail',
        params: { id: video.videoId }
      });
    }
  } catch (error) {
    console.error('获取视频详情失败:', error);
    ElMessage.error('获取视频详情失败');
  }
};

/**
 * 播放视频
 */
const playVideo = (video: VideoInfo) => {
  // 跳转到播放页面
  router.push({
    name: 'VideoPlay',
    params: { id: video.videoId }
  });
};

/**
 * 下载视频
 */
const downloadVideo = (video: VideoInfo) => {
  // 跳转到下载页面
  router.push({
    name: 'VideoDownload',
    params: { id: video.videoId }
  });
};

/**
 * 收藏视频
 */
const collectVideo = async (video: VideoInfo) => {
  try {
    const response = await addVideoToCollection(video.videoId);
    if (response.code === 1000) {
      ElMessage.success('收藏成功');
    } else {
      ElMessage.error(response.message || '收藏失败');
    }
  } catch (error) {
    console.error('收藏失败:', error);
    ElMessage.error('收藏失败，请稍后重试');
  }
};

/**
 * 查看来源
 */
const viewSource = (video: VideoInfo) => {
  if (video.videoUrl) {
    window.open(video.videoUrl, '_blank');
  } else {
    ElMessage.warning('暂无来源链接');
  }
};

/**
 * 处理新搜索
 */
const handleNewSearch = () => {
  if (!newSearchForm.keyword.trim()) {
    ElMessage.warning('请输入搜索关键词');
    return;
  }
  
  // 更新搜索参数
  Object.assign(searchParams, newSearchForm);
  currentSource.value = newSearchForm.source;
  filterType.value = newSearchForm.category;
  currentPage.value = 1;
  
  showSearchDialog.value = false;
  performSearch();
};

/**
 * 获取来源名称
 */
const getSourceName = (source: string) => {
  const sourceMap: Record<string, string> = {
    local: '本地',
    pansou: 'PanSou',
    online: '在线',
    iqiyi: '爱奇艺',
    tencent: '腾讯视频',
    youku: '优酷',
    bilibili: '哔哩哔哩'
  };
  return sourceMap[source] || source;
};

/**
 * 格式化文件大小
 */
const formatFileSize = (size: number) => {
  if (size < 1024) return size + ' B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
  if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + ' MB';
  return (size / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

/**
 * 格式化时间
 */
const formatTime = (time: string) => {
  return new Date(time).toLocaleString();
};

/**
 * 处理图片错误
 */
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = '/placeholder-video.jpg';
};

/**
 * 初始化搜索参数
 */
const initSearchParams = () => {
  const query = route.query;
  searchParams.keyword = (query.keyword as string) || '';
  searchParams.source = (query.source as string) || '';
  searchParams.category = (query.category as string) || '';
  searchParams.year = (query.year as string) || '';
  searchParams.platform = (query.platform as string) || '';
  
  currentSource.value = searchParams.source;
  filterType.value = searchParams.category;
  
  // 初始化新搜索表单
  newSearchForm.keyword = searchParams.keyword;
  newSearchForm.source = searchParams.source;
  newSearchForm.category = searchParams.category;
};

// 监听路由变化
watch(() => route.query, () => {
  initSearchParams();
  performSearch();
});

// 组件挂载
onMounted(() => {
  initSearchParams();
  if (searchParams.keyword) {
    performSearch();
  }
});
</script>

<style scoped>
.search-result {
  padding: 0;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.filter-label {
  font-size: 14px;
  color: #666;
  margin-right: 8px;
}

.filter-item {
  display: flex;
  align-items: center;
}

.video-title {
  line-height: 1.4;
}

.video-description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-item:hover {
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .result-item .flex {
    flex-direction: column;
  }
  
  .video-cover {
    margin-right: 0;
    margin-bottom: 12px;
    align-self: center;
  }
  
  .video-actions {
    flex-direction: row;
    margin-left: 0;
    margin-top: 12px;
  }
}
</style>