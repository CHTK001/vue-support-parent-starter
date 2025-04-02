<template>
  <div class="video-detail-container">
    <div class="detail-header">
      <el-button @click="goBack" class="back-button">
        <IconifyIconOnline icon="ep:arrow-left" />
        返回列表
      </el-button>
      <h2 class="detail-title">{{ videoData.videoTitle || videoData.videoName }}</h2>
    </div>

    <div class="detail-content">
      <div class="poster-section">
        <div class="poster-wrapper">
          <el-image v-if="videoData.videoCover" :src="videoData.videoCover?.split(',')?.[0]" :preview-src-list="videoData.videoCover?.split(',')" fit="cover" class="poster-image">
            <template #error>
              <el-image v-if="videoData.videoCover" :src="createCompatibleImageUrl(videoData.videoCover?.split(',')?.[1], videoData.videoPlatform)" :preview-src-list="[createCompatibleImageUrl(videoData.videoCover?.split(',')?.[1], videoData.videoPlatform)]" fit="cover" class="poster-image">
                <template #error>
                  <div class="no-poster">暂无海报</div>
                </template>
              </el-image>
            </template>
          </el-image>
          <div v-else class="no-poster">暂无海报</div>
        </div>

        <div class="action-buttons">
          <el-button type="primary" @click="handleEdit" class="action-btn">
            <IconifyIconOnline icon="ep:edit" />
            编辑视频
          </el-button>
          <el-button type="success" @click="handlePlay" class="action-btn" v-if="videoData.videoUrl">
            <IconifyIconOnline icon="ep:video-play" />
            播放视频
          </el-button>
        </div>
      </div>

      <div class="info-section">
        <div class="basic-info">
          <div class="info-header">
            <h3 class="section-title">基本信息</h3>
            <div class="ratings-container">
              <!-- 视频评分 -->
              <div class="score-tag" v-if="videoData.videoScore">
                <IconifyIconOnline icon="ep:star-filled" class="star-icon" />
                <span>{{ videoData.videoScore }}分</span>
              </div>

              <!-- 豆瓣和IMDb评分 -->
              <div class="external-ratings" v-if="videoData.videoMarkList && videoData.videoMarkList.length > 0">
                <div v-for="(mark, index) in videoData.videoMarkList" :key="index" class="rating-item" :class="{ douban: mark.videoMarkType === '豆瓣', imdb: mark.videoMarkType === 'IMDb' }" @click="openRatingLink(mark)">
                  <span class="rating-name">{{ mark.videoMarkType }}</span>
                  <span class="rating-score">{{ mark.videoMarkScore }}</span>
                  <span class="rating-count" v-if="mark.videoMarkPeople">{{ mark.videoMarkPeople }}人评价</span>
                </div>
              </div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <span class="item-label">类型：</span>
              <span class="item-value">
                <el-tag class="type-tag" type="primary" v-for="(item, index) in (videoData.videoType || '未分类')?.split(',')" :key="index">{{ item }}</el-tag>
              </span>
            </div>
            <div class="info-item">
              <span class="item-label">年份：</span>
              <span class="item-value">{{ videoData.videoYear || "未知" }}年</span>
            </div>
            <div class="info-item">
              <span class="item-label">上映日期</span>
              <span class="item-value">{{ videoData.videoRelease || "未知" }}</span>
            </div>
            <div class="info-item">
              <span class="item-label">地区：</span>
              <span class="item-value">{{ videoData.videoDistrict || "未知" }}</span>
            </div>
            <div class="info-item">
              <span class="item-label">导演：</span>
              <span class="item-value">{{ videoData.videoDirector || "未知" }}</span>
            </div>
            <div class="info-item">
              <span class="item-label">主演：</span>
              <span class="item-value">{{ videoData.videoActor || "未知" }}</span>
            </div>
            <div class="info-item">
              <span class="item-label">时长：</span>
              <span class="item-value">{{ videoData.videoDuration ? `${videoData.videoDuration}分钟` : "未知" }}</span>
            </div>
            <div class="info-item">
              <span class="item-label">状态：</span>
              <span class="item-value">
                <el-tag :type="videoData.videoStatus === 0 ? 'success' : 'info'" size="small">
                  {{ videoData.videoStatus === 0 ? "启用" : "禁用" }}
                </el-tag>
              </span>
            </div>
            <div class="info-item">
              <span class="item-label">发布时间：</span>
              <span class="item-value">{{ videoData.videoPublishDate || "未知" }}</span>
            </div>
            <div class="info-item">
              <span class="item-label">更新时间：</span>
              <span class="item-value">{{ formatDateTime(videoData.updateTime) || "未知" }}</span>
            </div>
          </div>
        </div>

        <div class="detail-info">
          <h3 class="section-title">剧情简介</h3>
          <div class="plot-summary">
            <p v-if="videoData.videoDescription">{{ videoData.videoDescription }}</p>
            <p v-else class="no-data">暂无简介</p>
          </div>
        </div>

        <div class="download-section">
          <h3 class="section-title">下载信息</h3>

          <div class="download-tabs">
            <el-tabs type="border-card">
              <!-- 下载资源选项卡 - 更紧凑的布局 -->
              <el-tab-pane label="下载资源">
                <div class="download-list compact" v-if="videoData.downloadList && videoData.downloadList.length > 0">
                  <div v-for="(download, index) in videoData.downloadList" :key="'download-' + index" class="download-item">
                    <div class="download-info">
                      <div class="download-name">
                        <IconifyIconOnline :icon="getDownloadIcon(download.videoDownloadType)" class="download-icon" />
                        <span>{{ download.videoDownloadName }}</span>
                        <span v-if="download.videoDownloadQuality" class="inline-quality">{{ download.videoDownloadQuality }}</span>
                        <span v-if="download.videoDownloadType" class="inline-platform">{{ download.videoDownloadType }}</span>
                      </div>
                      <div class="download-meta">
                        <span v-if="download.videoDownloadSize" class="download-size">{{ download.videoDownloadSize }}</span>
                        <span class="download-date">{{ formatDateTime(download.createTime) }}</span>
                        <span class="download-count">下载次数: {{ download.videoDownloadCount }}</span>
                      </div>
                    </div>
                    <div class="download-actions">
                      <el-button type="primary" size="small" @click="copyDownloadLink(download)">
                        <IconifyIconOnline icon="ep:copy-document" />
                        复制
                      </el-button>
                      <el-button type="success" size="small" @click="handleDownload(download)">
                        <IconifyIconOnline icon="ep:download" />
                        下载
                      </el-button>
                    </div>
                  </div>
                </div>
                <div v-else class="no-data">暂无下载资源</div>
              </el-tab-pane>

              <!-- 磁力资源选项卡 - 更紧凑的布局 -->
              <el-tab-pane label="磁力资源">
                <div class="download-list compact" v-if="videoData.downloadList">
                  <div v-for="(magnet, index) in parseMagnetLinks(videoData.downloadList)" :key="'magnet-' + index" class="download-item">
                    <div class="download-info">
                      <div class="download-name">
                        <IconifyIconOnline icon="ep:magnet" class="download-icon magnet-icon" />
                        <span>{{ magnet.videoDownloadName }}</span>
                        <span v-if="magnet.videoDownloadQuality" class="inline-quality">{{ magnet.videoDownloadQuality }}</span>
                      </div>
                      <div class="download-meta">
                        <span v-if="magnet.videoDownloadSize" class="download-size">{{ magnet.videoDownloadSize }}</span>
                        <span v-if="magnet.createTime" class="download-date">{{ formatDateTime(magnet.createTime) }}</span>
                      </div>
                    </div>
                    <div class="download-actions">
                      <el-button type="primary" size="small" @click="copyMagnetLink(magnet.videoDownloadUrl)">
                        <IconifyIconOnline icon="ep:copy-document" />
                        复制
                      </el-button>
                    </div>
                  </div>
                  <div v-if="!parseMagnetLinks(videoData.downloadList).length" class="no-data">暂无磁力资源</div>
                </div>
                <div v-else class="no-data">暂无磁力资源</div>
              </el-tab-pane>

              <!-- 网盘资源选项卡 - 更紧凑的布局 -->
              <el-tab-pane label="网盘资源">
                <div class="download-list compact" v-if="videoData.downloadList">
                  <div v-for="(pan, index) in parsePanLinks(videoData.downloadList)" :key="'pan-' + index" class="download-item">
                    <div class="download-info">
                      <div class="download-name">
                        <IconifyIconOnline :icon="getPanIcon(pan.type)" class="download-icon pan-icon" />
                        <span>{{ pan.videoDownloadName }}</span>
                        <span v-if="pan.videoDownloadQuality" class="inline-quality">{{ pan.videoDownloadQuality }}</span>
                      </div>
                    </div>
                    <div class="download-actions">
                      <el-button type="primary" size="small" @click="copyPanLink(pan.videoDownloadUrl)">
                        <IconifyIconOnline icon="ep:copy-document" />
                        复制
                      </el-button>
                      <el-button type="success" size="small" @click="openPanLink(pan.videoDownloadUrl)">
                        <IconifyIconOnline icon="ep:link" />
                        打开
                      </el-button>
                    </div>
                  </div>
                  <div v-if="!parsePanLinks(videoData.downloadList).length" class="no-data">暂无网盘资源</div>
                </div>
                <div v-else class="no-data">暂无网盘资源</div>
              </el-tab-pane>

              <!-- 在线播放选项卡 - 更紧凑的布局 -->
              <el-tab-pane label="在线播放">
                <div class="download-list compact" v-if="videoData.downloadList">
                  <div v-for="(online, index) in parseOnlineLinks(videoData.downloadList)" :key="'online-' + index" class="download-item">
                    <div class="download-info">
                      <div class="download-name">
                        <IconifyIconOnline icon="ep:video-play" class="download-icon online-icon" />
                        <span>{{ online.name || `在线资源 ${index + 1}` }}</span>
                        <span v-if="online.quality" class="inline-quality">{{ online.quality }}</span>
                        <span v-if="online.platform" class="inline-platform">{{ online.platform }}</span>
                      </div>
                    </div>
                    <div class="download-actions">
                      <el-button type="success" size="small" @click="openOnlineLink(online.link)">
                        <IconifyIconOnline icon="ep:video-play" />
                        播放
                      </el-button>
                    </div>
                  </div>
                  <div v-if="!parseOnlineLinks(videoData.downloadList).length" class="no-data">暂无在线资源</div>
                </div>
                <div v-else class="no-data">暂无在线资源</div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>

        <div class="tags-section" v-if="videoData.videoTags">
          <h3 class="section-title">标签</h3>
          <div class="tags-list">
            <el-tag v-for="(tag, index) in videoData.videoTags?.split(',').filter((t) => t)" :key="index" class="tag-item" effect="plain">
              {{ tag }}
            </el-tag>
            <span v-if="!videoData.videoTags || videoData.videoTags.split(',').filter((t) => t).length === 0" class="no-data"> 暂无标签 </span>
          </div>
        </div>

        <div class="source-section">
          <h3 class="section-title">来源信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="item-label">来源平台：</span>
              <span class="item-value">{{ videoData.videoPlatform || "未知" }}</span>
            </div>
            <div class="info-item">
              <span class="item-label">豆瓣ID：</span>
              <span class="item-value">{{ videoData.videoDouBanId || "未知" }}</span>
            </div>
            <div class="info-item">
              <span class="item-label">视频大小：</span>
              <span class="item-value">{{ videoData.videoSize || "未知" }}</span>
            </div>
            <div class="info-item">
              <span class="item-label">视频质量：</span>
              <span class="item-value">{{ videoData.videoQuality || "未知" }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getVideoDetail } from "@/api/video";
import { formatDateTime, createCompatibleImage, getRandomString } from "@repo/utils";
import { getConfig } from "@repo/config";
import { ElMessage } from "element-plus";

const config = getConfig();
const ossAddress = getRandomString(config.OssAddress);
const route = useRoute();
const router = useRouter();
const videoData = ref<any>({});
const loading = ref(false);
const createCompatibleImageUrl = (videoCover, videoPlatform) => {
  if (!videoCover) {
    return null;
  }
  return ossAddress + `/video/${videoCover.replace("cover", "cover/" + videoPlatform)}`;
};

// 获取视频详情
const fetchVideoDetail = async () => {
  const videoId: any = route.query.id;
  if (!videoId) return;

  loading.value = true;
  getVideoDetail(videoId)
    .then((res) => {
      videoData.value = res.data;
    })
    .catch((error) => {
      console.error("获取视频详情失败:", error);
    })
    .finally(() => {
      loading.value = false;
    });
};

// 返回列表
const goBack = () => {
  router.back();
};

// 编辑视频
const handleEdit = () => {
  router.push(`/video/manage/edit/${videoData.value.videoId}`);
};

// 播放视频
const handlePlay = () => {
  if (videoData.value.videoUrl) {
    window.open(videoData.value.videoUrl, "_blank");
  }
};

// 获取下载资源图标
const getDownloadIcon = (type) => {
  const iconMap = {
    磁力资源: "ep:magnet",
    网盘资源: "ep:folder",
    在线资源: "ep:video-play",
    百度网盘: "ep:folder",
    阿里云盘: "ep:folder",
    天翼网盘: "ep:folder",
  };
  return iconMap[type] || "ep:download";
};

// 处理下载
const handleDownload = (download) => {
  if (download.videoDownloadType === "磁力资源" && download.videoDownloadMagnetic) {
    openMagnetLink(`magnet:?xt=urn:btih:${download.videoDownloadMagnetic}`);
  } else if (download.videoDownloadUrl) {
    window.open(download.videoDownloadUrl, "_blank");
  } else {
    ElMessage.warning("无法获取下载链接");
  }
};

// 复制下载链接
const copyDownloadLink = (download) => {
  let linkText = "";

  if (download.videoDownloadType === "磁力资源" && download.videoDownloadMagnetic) {
    linkText = `magnet:?xt=urn:btih:${download.videoDownloadMagnetic}`;
  } else if (download.videoDownloadUrl) {
    linkText = download.videoDownloadUrl;
  } else {
    ElMessage.warning("无法获取下载链接");
    return;
  }

  navigator.clipboard
    .writeText(linkText)
    .then(() => {
      ElMessage.success("下载链接已复制到剪贴板");
    })
    .catch(() => {
      ElMessage.error("复制失败，请手动复制");
    });
};

// 解析磁力链接
const parseMagnetLinks = (magnetString) => {
  return magnetString.filter((it) => it.videoDownloadType == "磁力资源");
};

// 解析网盘链接
const parsePanLinks = (panString) => {
  return panString.filter((it) => it.videoDownloadType == "网盘资源");
};

// 解析在线播放链接
const parseOnlineLinks = (onlineString) => {
  return onlineString.filter((it) => it.videoDownloadType == "在线资源");
};

// 获取网盘图标
const getPanIcon = (type) => {
  const iconMap = {
    百度网盘: "ep:folder",
    阿里云盘: "ep:folder",
    天翼网盘: "ep:folder",
    微云: "ep:folder",
    "115网盘": "ep:folder",
    迅雷网盘: "ep:folder",
  };
  return iconMap[type] || "ep:folder";
};

// 复制磁力链接
const copyMagnetLink = (link) => {
  navigator.clipboard
    .writeText(link)
    .then(() => {
      ElMessage.success("磁力链接已复制到剪贴板");
    })
    .catch(() => {
      ElMessage.error("复制失败，请手动复制");
    });
};

// 打开磁力链接
const openMagnetLink = (link) => {
  window.open(link, "_blank");
};

// 复制网盘链接和密码
const copyPanLink = (pan) => {
  const textToCopy = pan.password ? `链接: ${pan.link} 提取码: ${pan.password}` : pan.link;

  navigator.clipboard
    .writeText(textToCopy)
    .then(() => {
      ElMessage.success("网盘链接已复制到剪贴板");
    })
    .catch(() => {
      ElMessage.error("复制失败，请手动复制");
    });
};

// 打开网盘链接
const openPanLink = (link) => {
  window.open(link, "_blank");
};

// 打开在线播放链接
const openOnlineLink = (link) => {
  window.open(link, "_blank");
};

// 打开评分网站链接
const openRatingLink = (mark) => {
  let url = "";
  if (mark.videoMarkType === "豆瓣" && videoData.value.videoDouBanId) {
    url = `https://movie.douban.com/subject/${videoData.value.videoDouBanId}/`;
  } else if (mark.videoMarkType === "IMDb" && mark.videoMarkId) {
    url = `https://www.imdb.com/title/${mark.videoMarkId}/`;
  }

  if (url) {
    window.open(url, "_blank");
  } else {
    ElMessage.warning(`无法获取${mark.videoMarkType}链接`);
  }
};

onMounted(() => {
  fetchVideoDetail();
});
</script>

<style lang="scss" scoped>
.video-detail-container {
  padding: 24px;
  background-color: #fff;
  min-height: 100%;
}

.detail-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.back-button {
  margin-right: 16px;
}

.detail-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.detail-content {
  display: flex;
  gap: 24px;
}

.poster-section {
  width: 300px;
  flex-shrink: 0;
}

.poster-wrapper {
  width: 100%;
  height: 420px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.poster-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-poster {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 16px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.basic-info,
.detail-info,
.tags-section,
.source-section,
.download-section {
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  position: relative;
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  padding-left: 12px;
}

.section-title::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 18px;
  background-color: var(--el-color-primary);
  border-radius: 2px;
}

.ratings-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.score-tag {
  display: flex;
  align-items: center;
  background-color: #fff8e6;
  color: #ff9900;
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: bold;
}

.external-ratings {
  display: flex;
  gap: 10px;
}

.rating-item {
  display: flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.rating-item.douban {
  background-color: #f5f5f5;
  color: #00b51d;
  border: 1px solid #e5e5e5;
}

.rating-item.imdb {
  background-color: #f5f5f5;
  color: #f5c518;
  border: 1px solid #e5e5e5;
}

.rating-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.rating-name {
  margin-right: 6px;
  font-weight: bold;
}

.rating-score {
  font-size: 16px;
  font-weight: bold;
  margin-right: 4px;
}

.rating-count {
  font-size: 12px;
  opacity: 0.8;
  font-weight: normal;
}

.star-icon {
  margin-right: 4px;
  color: #ff9900;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
}

.item-label {
  color: #606266;
  margin-right: 8px;
  flex-shrink: 0;
}

.item-value {
  color: #303133;
}

.type-tag {
  border: none;
  margin-right: 8px;
}

.plot-summary {
  line-height: 1.8;
  color: #303133;
  text-align: justify;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  margin-right: 8px;
  margin-bottom: 8px;
}

.no-data {
  color: #909399;
  font-style: italic;
}

/* 下载区域样式 */
.download-tabs {
  margin-top: 16px;
}

.download-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.download-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #fff;
  border-radius: 4px;
  border-left: 3px solid var(--el-color-primary);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 6px;
}

.download-info {
  flex: 1;
}

.download-name {
  display: flex;
  align-items: center;
  font-weight: 500;
  margin-bottom: 4px;
}

.download-icon {
  margin-right: 8px;
  font-size: 18px;
}

.magnet-icon {
  color: #409eff;
}

.pan-icon {
  color: #67c23a;
}

.online-icon {
  color: #e6a23c;
}

.download-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: #909399;
  font-size: 12px;
}

.inline-quality,
.inline-platform {
  display: inline-block;
  margin-left: 8px;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 12px;
  background-color: #f0f9eb;
  color: #67c23a;
}

.inline-platform {
  background-color: #f4f4f5;
  color: #909399;
}

.download-list.compact {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 10px;
}

.download-list.compact .download-item {
  margin-bottom: 0;
  height: 100%;
}

.download-quality,
.download-size,
.download-platform,
.download-password,
.download-date,
.download-count,
.download-type {
  display: flex;
  align-items: center;
}

.download-quality::before,
.download-size::before,
.download-platform::before,
.download-date::before,
.download-count::before,
.download-type::before {
  content: "•";
  margin-right: 4px;
}

.download-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 768px) {
  .detail-content {
    flex-direction: column;
  }

  .poster-section {
    width: 100%;
    margin-bottom: 24px;
  }

  .poster-wrapper {
    height: 300px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .download-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .download-actions {
    margin-top: 12px;
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
