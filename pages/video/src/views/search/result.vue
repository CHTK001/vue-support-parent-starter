<template>
  <div class="video-search-result">
    <!-- 搜索信息栏 -->
    <div class="search-info">
      <h2 class="search-title">
        搜索结果
        <span v-if="searchKeyword" class="search-keyword">「{{ searchKeyword }}」</span>
      </h2>
      <div class="search-stats" v-if="totalCount > 0">找到 {{ totalCount }} 个相关视频</div>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section">
      <div class="filter-row">
        <div class="filter-item">
          <label>类型：</label>
          <el-select v-model="selectedType" placeholder="全部类型" clearable @change="handleFilter">
            <el-option label="全部" value=""></el-option>
            <el-option label="电影" value="movie"></el-option>
            <el-option label="电视剧" value="tv"></el-option>
            <el-option label="综艺" value="variety"></el-option>
            <el-option label="动漫" value="anime"></el-option>
          </el-select>
        </div>

        <div class="filter-item">
          <label>年代：</label>
          <el-select v-model="selectedYear" placeholder="全部年代" clearable @change="handleFilter">
            <el-option label="全部" value=""></el-option>
            <el-option label="2024" value="2024"></el-option>
            <el-option label="2023" value="2023"></el-option>
            <el-option label="2022" value="2022"></el-option>
            <el-option label="2021" value="2021"></el-option>
            <el-option label="2020" value="2020"></el-option>
          </el-select>
        </div>

        <div class="filter-item">
          <label>地区：</label>
          <el-select v-model="selectedRegion" placeholder="全部地区" clearable @change="handleFilter">
            <el-option label="全部" value=""></el-option>
            <el-option label="大陆" value="大陆"></el-option>
            <el-option label="香港" value="香港"></el-option>
            <el-option label="台湾" value="台湾"></el-option>
            <el-option label="美国" value="美国"></el-option>
            <el-option label="日本" value="日本"></el-option>
            <el-option label="韩国" value="韩国"></el-option>
          </el-select>
        </div>

        <div class="filter-item">
          <label>排序：</label>
          <el-select v-model="sortBy" placeholder="默认排序" @change="handleFilter">
            <el-option label="默认排序" value="default"></el-option>
            <el-option label="最新发布" value="latest"></el-option>
            <el-option label="评分最高" value="rating"></el-option>
            <el-option label="播放最多" value="views"></el-option>
          </el-select>
        </div>
      </div>
    </div>

    <!-- 搜索结果列表 -->
    <div class="result-list" v-loading="loading">
      <div v-if="videoList.length === 0 && !loading" class="no-result">
        <el-empty description="暂无搜索结果">
          <el-button type="primary" @click="goBack">返回搜索</el-button>
        </el-empty>
      </div>

      <!-- 使用ScTable组件的list模式 -->
      <div v-else class="video-table-container">
        <ScTable :data="videoList" :columns="tableColumns" :loading="loading" :pagination="paginationConfig" list-mode @row-click="goToDetail" @page-change="handleCurrentChange" @size-change="handleSizeChange">
          <!-- 自定义海报列 -->
          <template #poster="{ row }">
            <div class="video-poster-cell">
              <img :src="row.poster || '/placeholder-video.jpg'" :alt="row.title" class="poster-image" />
              <div class="poster-overlay" @click.stop="playVideo(row)" v-if="row.playUrl">
                <IconifyIconOnline icon="ep:video-play" class="play-icon" />
              </div>
              <div class="video-duration" v-if="row.duration">{{ row.duration }}</div>
            </div>
          </template>

          <!-- 自定义标题列 -->
          <template #title="{ row }">
            <div class="video-title-cell">
              <h4 class="video-title" :title="row.title">{{ row.title }}</h4>
              <div class="video-meta">
                <el-tag size="small" type="primary">{{ row.type }}</el-tag>
                <el-tag size="small">{{ row.year }}</el-tag>
                <el-tag size="small">{{ row.region }}</el-tag>
                <el-tag size="small" v-if="row.language">{{ row.language }}</el-tag>
              </div>
            </div>
          </template>

          <!-- 自定义统计信息列 -->
          <template #stats="{ row }">
            <div class="video-stats-cell">
              <div class="stat-item" v-if="row.rating">
                <IconifyIconOnline icon="ep:star-filled" />
                <span>{{ row.rating }}</span>
              </div>
              <div class="stat-item" v-if="row.views">
                <IconifyIconOnline icon="ep:view" />
                <span>{{ formatViews(row.views) }}</span>
              </div>
              <div class="stat-item" v-if="row.status">
                <IconifyIconOnline icon="ep:video-camera" />
                <span>{{ row.status }}</span>
              </div>
            </div>
          </template>

          <!-- 自定义详情列 -->
          <template #details="{ row }">
            <div class="video-details-cell">
              <div class="video-description" v-if="row.description">
                {{ row.description }}
              </div>
              <div class="video-cast" v-if="row.cast && row.cast.length > 0">
                <span class="label">主演：</span>
                <span>{{ row.cast.join("、") }}</span>
              </div>
              <div class="video-director" v-if="row.director">
                <span class="label">导演：</span>
                <span>{{ row.director }}</span>
              </div>
            </div>
          </template>

          <!-- 自定义下载地址列 -->
          <template #downloads="{ row }">
            <div class="video-downloads-cell" v-if="row.downloadUrls && row.downloadUrls.length > 0">
              <el-tag v-for="(url, index) in row.downloadUrls" :key="index" size="small" type="success" class="download-tag">
                {{ url.quality || `链接${index + 1}` }}
              </el-tag>
            </div>
          </template>

          <!-- 自定义操作列 -->
          <template #actions="{ row }">
            <div class="video-actions-cell">
              <el-button type="primary" size="small" @click.stop="goToDetail(row)">
                <IconifyIconOnline icon="ep:view" />
                详情
              </el-button>
              <el-button type="success" size="small" @click.stop="playVideo(row)" v-if="row.playUrl">
                <IconifyIconOnline icon="ep:video-play" />
                播放
              </el-button>
            </div>
          </template>
        </ScTable>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper" v-if="totalCount > pageSize">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[20, 40, 60, 80]" :total="totalCount" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

interface VideoItem {
  id: string;
  title: string;
  poster: string;
  year: string;
  region: string;
  type: string;
  rating?: number;
  views?: number;
  duration?: string;
  description?: string;
  cast?: string[];
  director?: string;
  language?: string;
  status?: string;
  downloadUrls?: Array<{
    quality: string;
    url: string;
  }>;
  playUrl?: string;
}

interface CategoryGroup {
  type: string;
  videos: VideoItem[];
}

// 路由相关
const route = useRoute();
const router = useRouter();

// 搜索关键词
const searchKeyword = ref("");

// 筛选条件
const selectedType = ref("");
const selectedYear = ref("");
const selectedRegion = ref("");
const sortBy = ref("default");

// 分页相关
const currentPage = ref(1);
const pageSize = ref(20);
const totalCount = ref(0);

// 数据相关
const loading = ref(false);
const videoList = ref<VideoItem[]>([]);

// ScTable列配置
const tableColumns = ref([
  {
    prop: "poster",
    label: "海报",
    width: 120,
    slot: "poster",
  },
  {
    prop: "title",
    label: "标题信息",
    minWidth: 300,
    slot: "title",
  },
  {
    prop: "stats",
    label: "统计信息",
    width: 200,
    slot: "stats",
  },
  {
    prop: "details",
    label: "详细信息",
    minWidth: 250,
    slot: "details",
  },
  {
    prop: "downloads",
    label: "下载地址",
    width: 150,
    slot: "downloads",
  },
  {
    prop: "actions",
    label: "操作",
    width: 150,
    slot: "actions",
    fixed: "right",
  },
]);

// 分页配置
const paginationConfig = computed(() => ({
  currentPage: currentPage.value,
  pageSize: pageSize.value,
  total: totalCount.value,
  pageSizes: [10, 20, 50, 100],
  layout: "total, sizes, prev, pager, next, jumper",
}));

// 模拟视频数据
const mockVideoData: VideoItem[] = [
  {
    id: "1",
    title: "流浪地球2",
    poster: "https://img.alicdn.com/imgextra/i1/2206266136/O1CN01YQJjJJ1Ks8QXxQJjJ_!!2206266136.jpg",
    year: "2023",
    region: "大陆",
    type: "电影",
    rating: 8.3,
    views: 1250000,
    duration: "173分钟",
    description: "太阳即将毁灭，人类在地球表面建造出巨大的推进器，寻找新的家园。然而宇宙之路危机四伏，为了拯救地球，为了人类能在漫长的2500年后抵达新的家园，流浪地球时代的年轻人挺身而出，展开争分夺秒的生死之战。",
    cast: ["刘德华", "吴京", "李雪健", "沙溢", "宁理"],
    director: "郭帆",
    language: "国语",
    status: "已完结",
    downloadUrls: [
      { quality: "4K超清", url: "https://download1.example.com" },
      { quality: "1080P高清", url: "https://download2.example.com" },
      { quality: "720P标清", url: "https://download3.example.com" },
    ],
    playUrl: "https://play.example.com/video1",
  },
  {
    id: "2",
    title: "满江红",
    poster: "https://img.alicdn.com/imgextra/i2/2206266136/O1CN01YQJjJJ1Ks8QXxQJjJ_!!2206266136.jpg",
    year: "2023",
    region: "大陆",
    type: "电影",
    rating: 7.9,
    views: 980000,
    duration: "159分钟",
    description: "南宋绍兴年间，岳飞死后四年，秦桧率兵与金国会谈。会谈前夜，金国使者死在宰相驻地，所携密信也不翼而飞。小兵张大与亲兵营副统领孙均受命调查此事。",
    cast: ["沈腾", "易烊千玺", "张译", "雷佳音", "岳云鹏"],
    director: "张艺谋",
    language: "国语",
    status: "已完结",
    downloadUrls: [
      { quality: "1080P高清", url: "https://download4.example.com" },
      { quality: "720P标清", url: "https://download5.example.com" },
    ],
    playUrl: "https://play.example.com/video2",
  },
  {
    id: "3",
    title: "狂飙",
    poster: "https://img.alicdn.com/imgextra/i3/2206266136/O1CN01YQJjJJ1Ks8QXxQJjJ_!!2206266136.jpg",
    year: "2023",
    region: "大陆",
    type: "电视剧",
    rating: 9.0,
    views: 2100000,
    duration: "39集",
    description: "京海市一线刑警安欣在与黑恶势力的斗争中，不断遭到保护伞的打击，始终无法将犯罪分子绳之以法。全国政法队伍教育整顿工作开展后，临江省派出指导组入驻京海，安欣配合指导组彻底清除了以高启强为首的黑恶势力及其保护伞。",
    cast: ["张译", "张颂文", "李一桐", "张志坚", "吴刚"],
    director: "徐纪周",
    language: "国语",
    status: "已完结",
    downloadUrls: [
      { quality: "1080P高清", url: "https://download6.example.com" },
      { quality: "720P标清", url: "https://download7.example.com" },
    ],
    playUrl: "https://play.example.com/video3",
  },
];

// 获取搜索结果
const fetchSearchResults = async () => {
  loading.value = true;
  try {
    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 根据搜索关键词过滤数据
    let filteredData = [...mockVideoData];

    if (searchKeyword.value) {
      filteredData = filteredData.filter((video) => video.title.includes(searchKeyword.value) || video.description.includes(searchKeyword.value));
    }

    // 应用筛选条件
    if (selectedType.value) {
      filteredData = filteredData.filter((video) => video.type === selectedType.value);
    }

    if (selectedYear.value) {
      filteredData = filteredData.filter((video) => video.year === selectedYear.value);
    }

    if (selectedRegion.value) {
      filteredData = filteredData.filter((video) => video.region === selectedRegion.value);
    }

    // 排序
    if (sortBy.value === "latest") {
      filteredData.sort((a, b) => parseInt(b.year) - parseInt(a.year));
    } else if (sortBy.value === "rating") {
      filteredData.sort((a, b) => b.rating - a.rating);
    } else if (sortBy.value === "views") {
      filteredData.sort((a, b) => b.views - a.views);
    }

    totalCount.value = filteredData.length;

    // 分页
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    videoList.value = filteredData.slice(start, end);
  } catch (error) {
    console.error("获取搜索结果失败:", error);
    ElMessage.error("获取搜索结果失败");
  } finally {
    loading.value = false;
  }
};

// 处理筛选
const handleFilter = () => {
  currentPage.value = 1;
  fetchSearchResults();
};

// 处理分页大小变化
const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  fetchSearchResults();
};

// 处理页码变化
const handleCurrentChange = (page: number) => {
  currentPage.value = page;
  fetchSearchResults();
};

// 格式化播放次数
const formatViews = (views: number) => {
  if (views >= 10000) {
    return (views / 10000).toFixed(1) + "万";
  }
  return views.toString();
};

// 跳转到视频详情
const goToDetail = (video: VideoItem) => {
  router.push(`/video/detail/${video.id}`);
};

// 播放视频
const playVideo = (video: VideoItem) => {
  if (video.playUrl) {
    // 这里可以打开播放器或跳转到播放页面
    window.open(video.playUrl, "_blank");
  }
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
      fetchSearchResults();
    }
  },
  { immediate: true }
);

// 组件挂载时获取搜索关键词
onMounted(() => {
  const keyword = route.query.keyword as string;
  if (keyword) {
    searchKeyword.value = keyword;
    fetchSearchResults();
  }
});
</script>

<style scoped>
.video-search-result {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.search-info {
  margin-bottom: 20px;
}

.search-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.search-keyword {
  color: #409eff;
}

.search-stats {
  color: #666;
  font-size: 14px;
}

.filter-section {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-item label {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
}

.filter-item .el-select {
  width: 120px;
}

.result-list {
  min-height: 400px;
}

.no-result {
  text-align: center;
  padding: 60px 0;
}

/* ScTable容器样式 */
.video-table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

/* ScTable自定义单元格样式 */
.video-poster-cell {
  position: relative;
  width: 100px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
}

.poster-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poster-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  cursor: pointer;
}

.video-poster-cell:hover .poster-overlay {
  opacity: 1;
}

.poster-overlay .play-icon {
  font-size: 20px;
  color: white;
}

.video-duration {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 10px;
}

.video-title-cell {
  padding: 8px 0;
}

.video-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.video-stats-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;
}

.video-details-cell {
  padding: 8px 0;
}

.video-description {
  font-size: 13px;
  color: #606266;
  line-height: 1.4;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-cast,
.video-director {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.label {
  font-weight: 500;
  color: #606266;
}

.video-downloads-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.download-tag {
  font-size: 11px;
}

.video-actions-cell {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 分类展示样式 */
.categorized-results {
  margin-bottom: 30px;
}

.category-section {
  margin-bottom: 40px;
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #409eff;
}

.category-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.category-count {
  color: #909399;
  font-size: 14px;
  background: #f0f2f5;
  padding: 4px 12px;
  border-radius: 12px;
}

/* 视频列表样式 - 左侧图片右侧详情 */
.video-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.video-item {
  display: flex;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 180px;
}

.video-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* 左侧图片区域 */
.video-poster {
  position: relative;
  width: 240px;
  height: 180px;
  flex-shrink: 0;
  overflow: hidden;
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
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.video-item:hover .video-overlay {
  opacity: 1;
}

.play-icon {
  font-size: 36px;
  color: white;
}

.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

/* 右侧详情区域 */
.video-details {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.video-header {
  margin-bottom: 12px;
}

.video-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.video-stats {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.video-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #606266;
}

.video-description {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-cast,
.video-director {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
  line-height: 1.4;
}

.cast-label,
.director-label {
  font-weight: 500;
  color: #303133;
}

.cast-list {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-download {
  margin-bottom: 15px;
}

.download-label {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
  display: block;
}

.download-links {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.download-tag {
  cursor: pointer;
  transition: all 0.2s ease;
}

.download-tag:hover {
  transform: scale(1.05);
}

.video-actions {
  display: flex;
  gap: 10px;
  margin-top: auto;
}

.pagination-wrapper {
  margin-top: 40px;
  text-align: center;
}

@media (max-width: 768px) {
  .video-search-result {
    padding: 16px;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-item {
    justify-content: space-between;
  }

  .filter-item .el-select {
    width: 150px;
  }

  .video-item {
    flex-direction: column;
    min-height: auto;
  }

  .video-poster {
    width: 100%;
    height: 200px;
  }

  .video-details {
    padding: 15px;
  }

  .video-stats {
    gap: 15px;
  }

  .video-actions {
    flex-direction: column;
    gap: 8px;
  }

  .category-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .video-list {
    gap: 15px;
  }

  .video-title {
    font-size: 16px;
  }

  .download-links {
    gap: 6px;
  }

  .video-stats {
    gap: 12px;
  }
}
</style>
