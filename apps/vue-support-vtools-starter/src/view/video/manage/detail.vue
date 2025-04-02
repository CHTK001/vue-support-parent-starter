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
            <div class="score-tag" v-if="videoData.videoScore">
              <IconifyIconOnline icon="ep:star-filled" class="star-icon" />
              <span>{{ videoData.videoScore }}分</span>
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
              <!-- 使用downloadList数据 -->
              <el-tab-pane label="下载资源">
                <div class="download-list" v-if="videoData.downloadList && videoData.downloadList.length > 0">
                  <div v-for="(download, index) in videoData.downloadList" :key="'download-' + index" class="download-item">
                    <div class="download-info">
                      <div class="download-name">
                        <IconifyIconOnline :icon="getDownloadIcon(download.videoDownloadType)" class="download-icon" />
                        <span>{{ download.videoDownloadName }}</span>
                      </div>
                      <div class="download-meta">
                        <span v-if="download.videoDownloadType" class="download-type">{{ download.videoDownloadType }}</span>
                        <span v-if="download.videoDownloadQuality" class="download-quality">{{ download.videoDownloadQuality }}</span>
                        <span v-if="download.videoDownloadSize" class="download-size">{{ download.videoDownloadSize }}</span>
                        <span class="download-date">{{ formatDateTime(download.createTime) }}</span>
                        <span class="download-count">下载次数: {{ download.videoDownloadCount }}</span>
                      </div>
                    </div>
                    <div class="download-actions">
                      <el-button type="primary" size="small" @click="copyDownloadLink(download)">
                        <IconifyIconOnline icon="ep:copy-document" />
                        复制链接
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

              <!-- 保留原有的磁力资源选项卡 -->
              <el-tab-pane label="磁力资源">
                <div class="download-list" v-if="videoData.downloadList">
                  <div v-for="(magnet, index) in parseMagnetLinks(videoData.downloadList)" :key="'magnet-' + index" class="download-item">
                    <div class="download-info">
                      <div class="download-name">
                        <IconifyIconOnline icon="ep:magnet" class="download-icon magnet-icon" />
                        <span>{{ magnet.videoDownloadName }}</span>
                      </div>
                      <div class="download-meta">
                        <span v-if="magnet.videoDownloadQuality" class="download-quality">{{ magnet.videoDownloadQuality }}</span>
                        <span v-if="magnet.videoDownloadSize" class="download-size">{{ magnet.videoDownloadSize }}</span>
                        <span v-if="magnet.createTime" class="download-date">{{ magnet.createTime }}</span>
                      </div>
                    </div>
                    <div class="download-actions">
                      <el-button type="primary" size="small" @click="copyMagnetLink(magnet.videoDownloadUrl)">
                        <IconifyIconOnline icon="ep:copy-document" />
                        复制链接
                      </el-button>
                    </div>
                  </div>
                  <div v-if="!parseMagnetLinks(videoData.downloadList).length" class="no-data">暂无磁力资源</div>
                </div>
                <div v-else class="no-data">暂无磁力资源</div>
              </el-tab-pane>

              <!-- 保留原有的网盘资源选项卡 -->
              <el-tab-pane label="网盘资源">
                <div class="download-list" v-if="videoData.downloadList">
                  <div v-for="(pan, index) in parsePanLinks(videoData.downloadList)" :key="'pan-' + index" class="download-item">
                    <div class="download-info">
                      <div class="download-name">
                        <IconifyIconOnline :icon="getPanIcon(pan.type)" class="download-icon pan-icon" />
                        <span>{{ pan.videoDownloadName }} {{ pan.videoDownloadQuality }}</span>
                      </div>
                    </div>
                    <div class="download-actions">
                      <el-button type="primary" size="small" @click="copyPanLink(pan.videoDownloadUrl)">
                        <IconifyIconOnline icon="ep:copy-document" />
                        复制链接
                      </el-button>
                      <el-button type="success" size="small" @click="openPanLink(pan.videoDownloadUrl)">
                        <IconifyIconOnline icon="ep:link" />
                        打开链接
                      </el-button>
                    </div>
                  </div>
                  <div v-if="!parsePanLinks(videoData.downloadList).length" class="no-data">暂无网盘资源</div>
                </div>
                <div v-else class="no-data">暂无网盘资源</div>
              </el-tab-pane>

              <!-- 保留原有的在线播放选项卡 -->
              <el-tab-pane label="在线播放">
                <div class="download-list" v-if="videoData.downloadList">
                  <div v-for="(online, index) in parseOnlineLinks(videoData.downloadList)" :key="'online-' + index" class="download-item">
                    <div class="download-info">
                      <div class="download-name">
                        <IconifyIconOnline icon="ep:video-play" class="download-icon online-icon" />
                        <span>{{ online.name || `在线资源 ${index + 1}` }}</span>
                      </div>
                      <div class="download-meta">
                        <span v-if="online.quality" class="download-quality">{{ online.quality }}</span>
                        <span v-if="online.platform" class="download-platform">{{ online.platform }}</span>
                        <span v-if="online.date" class="download-date">{{ online.date }}</span>
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

.score-tag {
  display: flex;
  align-items: center;
  background-color: #fff8e6;
  color: #ff9900;
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: bold;
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
  gap: 12px;
}

.download-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #fff;
  border-radius: 4px;
  border-left: 3px solid var(--el-color-primary);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
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
  gap: 12px;
  color: #909399;
  font-size: 13px;
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
