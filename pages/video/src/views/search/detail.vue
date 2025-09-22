<template>
  <div class="video-detail">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- 视频详情内容 -->
    <div v-else-if="videoDetail" class="detail-content">
      <!-- 返回按钮 -->
      <div class="detail-header">
        <el-button @click="goBack" type="primary">
          <IconifyIconOnline icon="ep:arrow-left" />
          返回搜索结果
        </el-button>
      </div>

      <!-- 主要内容区域 -->
      <div class="main-content">
        <!-- 左侧海报和播放区域 -->
        <div class="poster-section">
          <div class="video-poster">
            <img :src="videoDetail.poster || '/placeholder-video.jpg'" :alt="videoDetail.title" />
            <div class="poster-overlay" @click="playVideo" v-if="videoDetail.playUrl">
              <IconifyIconOnline icon="ep:video-play" class="play-icon" />
              <span class="play-text">立即播放</span>
            </div>
          </div>

          <!-- 评分和统计 -->
          <div class="rating-section">
            <div class="rating-score" v-if="videoDetail.rating">
              <IconifyIconOnline icon="ep:star-filled" class="star-icon" />
              <span class="score">{{ videoDetail.rating }}</span>
              <span class="score-text">评分</span>
            </div>
            <div class="view-count" v-if="videoDetail.views">
              <IconifyIconOnline icon="ep:view" />
              <span>{{ formatViews(videoDetail.views) }} 次播放</span>
            </div>
          </div>
        </div>

        <!-- 右侧详细信息 -->
        <div class="info-section">
          <!-- 标题和基本信息 -->
          <div class="title-section">
            <h1 class="video-title">{{ videoDetail.title }}</h1>
            <div class="basic-info">
              <el-tag type="primary" size="large">{{ videoDetail.type }}</el-tag>
              <el-tag size="large">{{ videoDetail.year }}</el-tag>
              <el-tag size="large">{{ videoDetail.region }}</el-tag>
              <el-tag size="large" v-if="videoDetail.language">{{ videoDetail.language }}</el-tag>
              <el-tag size="large" :type="videoDetail.status === '已完结' ? 'success' : 'warning'" v-if="videoDetail.status">
                {{ videoDetail.status }}
              </el-tag>
            </div>
          </div>

          <!-- 详细信息表格 -->
          <div class="detail-info">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="时长" v-if="videoDetail.duration">
                {{ videoDetail.duration }}
              </el-descriptions-item>
              <el-descriptions-item label="导演" v-if="videoDetail.director">
                {{ videoDetail.director }}
              </el-descriptions-item>
              <el-descriptions-item label="主演" v-if="videoDetail.cast && videoDetail.cast.length > 0">
                {{ videoDetail.cast.join("、") }}
              </el-descriptions-item>
              <el-descriptions-item label="类型">
                {{ videoDetail.type }}
              </el-descriptions-item>
              <el-descriptions-item label="地区">
                {{ videoDetail.region }}
              </el-descriptions-item>
              <el-descriptions-item label="年份">
                {{ videoDetail.year }}
              </el-descriptions-item>
              <el-descriptions-item label="语言" v-if="videoDetail.language">
                {{ videoDetail.language }}
              </el-descriptions-item>
              <el-descriptions-item label="状态" v-if="videoDetail.status">
                {{ videoDetail.status }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 剧情简介 -->
          <div class="description-section" v-if="videoDetail.description">
            <h3>剧情简介</h3>
            <p class="description-text">{{ videoDetail.description }}</p>
          </div>

          <!-- 下载地址 -->
          <div class="download-section" v-if="videoDetail.downloadUrls && videoDetail.downloadUrls.length > 0">
            <h3>下载地址</h3>
            <div class="download-list">
              <div v-for="(download, index) in videoDetail.downloadUrls" :key="index" class="download-item">
                <div class="download-info">
                  <span class="download-quality">{{ download.quality }}</span>
                  <span class="download-url">{{ download.url }}</span>
                </div>
                <div class="download-actions">
                  <el-button type="primary" size="small" @click="copyDownloadUrl(download.url)">
                    <IconifyIconOnline icon="ep:copy-document" />
                    复制链接
                  </el-button>
                  <el-button type="success" size="small" @click="downloadVideo(download.url)">
                    <IconifyIconOnline icon="ep:download" />
                    下载
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="action-section">
            <el-button type="primary" size="large" @click="playVideo" v-if="videoDetail.playUrl">
              <IconifyIconOnline icon="ep:video-play" />
              在线播放
            </el-button>
            <el-button type="success" size="large" @click="addToFavorites">
              <IconifyIconOnline icon="ep:star" />
              收藏
            </el-button>
            <el-button size="large" @click="shareVideo">
              <IconifyIconOnline icon="ep:share" />
              分享
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 未找到视频 -->
    <div v-else class="not-found">
      <el-empty description="视频不存在或已被删除">
        <el-button type="primary" @click="goBack">返回搜索</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

interface VideoDetail {
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

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const videoDetail = ref<VideoDetail | null>(null);

onMounted(() => {
  const videoId = (route.query.id as string) || (route.params.id as string);
  if (videoId) {
    loadVideoDetail(videoId);
  } else {
    loading.value = false;
  }
});

const loadVideoDetail = async (id: string) => {
  loading.value = true;
  try {
    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 模拟视频详情数据
    const mockDetail: VideoDetail = {
      id: id,
      title: "流浪地球2",
      poster: "/images/video1.jpg",
      year: "2023",
      region: "大陆",
      type: "电影",
      rating: 8.3,
      views: 1200000,
      duration: "173分钟",
      description:
        "太阳即将毁灭，人类在地球表面建造出巨大的推进器，寻找新的家园。然而，在人类即将踏上流浪之旅时，却发现这个计划存在着巨大的危机。为了拯救地球，为了人类能在漫长的2500年后抵达新的家园，流浪地球时代的年轻人挺身而出，展开争分夺秒的生死之战。在这场关乎人类命运的最后一战中，他们将面临前所未有的宇宙级灾难，用智慧与勇气书写人类文明的新篇章。",
      cast: ["刘德华", "吴京", "李雪健", "沙溢", "宁理", "王智", "朱颜曼滋"],
      director: "郭帆",
      language: "国语",
      status: "已完结",
      downloadUrls: [
        { quality: "4K超清 (3.2GB)", url: "https://download1.example.com/liulangdiqiu2_4k.mp4" },
        { quality: "1080P高清 (1.8GB)", url: "https://download2.example.com/liulangdiqiu2_1080p.mp4" },
        { quality: "720P标清 (1.2GB)", url: "https://download3.example.com/liulangdiqiu2_720p.mp4" },
        { quality: "480P流畅 (800MB)", url: "https://download4.example.com/liulangdiqiu2_480p.mp4" },
      ],
      playUrl: "https://play.example.com/video1",
    };

    videoDetail.value = mockDetail;
  } catch (error) {
    ElMessage.error("加载视频详情失败");
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.go(-1);
};

const playVideo = () => {
  if (videoDetail.value?.playUrl) {
    window.open(videoDetail.value.playUrl, "_blank");
  }
};

const copyDownloadUrl = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url);
    ElMessage.success("下载链接已复制到剪贴板");
  } catch (error) {
    ElMessage.error("复制失败，请手动复制");
  }
};

const downloadVideo = (url: string) => {
  window.open(url, "_blank");
};

const addToFavorites = () => {
  ElMessage.success("已添加到收藏夹");
};

const shareVideo = () => {
  const shareUrl = window.location.href;
  copyDownloadUrl(shareUrl);
  ElMessage.success("分享链接已复制到剪贴板");
};

const formatViews = (views: number) => {
  if (views >= 10000) {
    return (views / 10000).toFixed(1) + "万";
  }
  return views.toString();
};
</script>

<style scoped>
.video-detail {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
}

.loading-container {
  padding: 40px;
}

.detail-header {
  margin-bottom: 30px;
}

.main-content {
  display: flex;
  gap: 40px;
  align-items: flex-start;
}

/* 左侧海报区域 */
.poster-section {
  flex-shrink: 0;
  width: 300px;
}

.video-poster {
  position: relative;
  width: 100%;
  height: 400px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.video-poster img {
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  cursor: pointer;
}

.video-poster:hover .poster-overlay {
  opacity: 1;
}

.play-icon {
  font-size: 64px;
  color: var(--el-text-color-primary);
  margin-bottom: 10px;
}

.play-text {
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 500;
}

.rating-section {
  background: var(--el-bg-color-overlay);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.rating-score {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
}

.star-icon {
  color: #f39c12;
  font-size: 20px;
}

.score {
  font-size: 24px;
  font-weight: 600;
  color: #f39c12;
}

.score-text {
  color: #606266;
}

.view-count {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  font-size: 14px;
}

/* 右侧信息区域 */
.info-section {
  flex: 1;
}

.title-section {
  margin-bottom: 30px;
}

.video-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 15px 0;
  line-height: 1.3;
}

.basic-info {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.detail-info {
  margin-bottom: 30px;
}

.description-section {
  margin-bottom: 30px;
}

.description-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 15px 0;
}

.description-text {
  font-size: 15px;
  line-height: 1.6;
  color: #606266;
  margin: 0;
}

.download-section {
  margin-bottom: 30px;
}

.download-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 20px 0;
}

.download-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.download-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.download-info {
  flex: 1;
}

.download-quality {
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-right: 15px;
}

.download-url {
  font-size: 13px;
   color: var(--el-text-color-primary);
  font-family: monospace;
}

.download-actions {
  display: flex;
  gap: 10px;
}

.action-section {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .video-detail {
    padding: 15px;
  }

  .main-content {
    flex-direction: column;
    gap: 30px;
  }

  .poster-section {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
  }

  .video-title {
    font-size: 24px;
  }

  .download-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .download-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .action-section {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .basic-info {
    gap: 8px;
  }

  .download-actions {
    flex-direction: column;
    width: 100%;
  }

  .action-section {
    flex-direction: column;
  }
}
</style>
