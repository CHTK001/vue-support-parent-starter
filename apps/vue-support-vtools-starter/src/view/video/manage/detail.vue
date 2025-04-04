<template>
  <div class="video-detail-container">
    <div class="detail-header">
      <el-button @click="goBack" class="back-button">
        <IconifyIconOnline icon="ep:arrow-left" />
        返回
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
              <span class="item-label">语言：</span>
              <span class="item-value">{{ videoData.videoLanguage || "未知" }}</span>
            </div>
            <div class="info-item">
              <span class="item-label">导演：</span>
              <span class="item-value director-name">{{ videoData.videoDirector || "未知" }}</span>
            </div>
            <div class="info-item">
              <span class="item-label">主演：</span>
              <span class="item-value actor-name">{{ videoData.videoActor || "未知" }}</span>
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
          <div class="section-header">
            <h3 class="section-title">下载信息</h3>
            <el-button type="primary" size="small" @click="showAddLinkDialog" class="add-link-btn">
              <IconifyIconOnline icon="ep:plus" />
              新增链接
            </el-button>
          </div>

          <div class="download-tabs">
            <el-tabs type="border-card">
              <!-- 下载资源选项卡 - 更紧凑的布局 -->
              <el-tab-pane label="下载资源">
                <div class="download-list compact" v-if="videoData.downloadList && videoData.downloadList.length > 0">
                  <div v-for="(download, index) in videoData.downloadList" :key="'download-' + index" class="download-item">
                    <div class="download-info">
                      <div class="download-name">
                        <IconifyIconOnline :icon="getDownloadIcon(getDownloadField(download, 'type'))" class="download-icon" />
                        <span class="min-w-[200px] max-w-[100%] mr-6 text-ellipsis overflow-hidden">{{ getDownloadField(download, "name") }}</span>
                        <span class="inline-tags"
                          ><span v-if="getDownloadField(download, 'quality')" class="inline-quality">{{ getDownloadField(download, "quality") }}</span
                          ><span v-if="getDownloadField(download, 'type')" class="inline-platform">{{ getDownloadField(download, "type") }}</span></span
                        >
                      </div>
                      <div class="download-meta">
                        <span v-if="getDownloadField(download, 'size')" class="download-size">{{ getDownloadField(download, "size") }}</span>
                        <span class="download-date">{{ formatDateTime(download.createTime) }}</span>
                        <span class="download-count">下载次数: {{ getDownloadField(download, "count") }}</span>
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
                        <span class="inline-tags"
                          ><span v-if="magnet.videoDownloadQuality" class="inline-quality">{{ magnet.videoDownloadQuality }}</span></span
                        >
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
                        <span class="inline-tags"
                          ><span v-if="pan.videoDownloadQuality" class="inline-quality">{{ pan.videoDownloadQuality }}</span></span
                        >
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
                        <span class="inline-tags"
                          ><span v-if="online.quality" class="inline-quality">{{ online.quality }}</span
                          ><span v-if="online.platform" class="inline-platform">{{ online.platform }}</span></span
                        >
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
    <!-- 添加链接对话框 -->
    <add-download-link-dialog ref="addLinkDialogRef" :video-id="videoData.videoId" @success="handleAddLinkSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getVideoDetail } from "@/api/video";
import { formatDateTime, getRandomString } from "@repo/utils";
import { getConfig } from "@repo/config";
import { ElMessage } from "element-plus";
import AddDownloadLinkDialog from "./components/AddDownloadLinkDialog.vue";

const config = getConfig();
const ossAddress = getRandomString(config.OssAddress);
const route = useRoute();
const router = useRouter();
const videoData = ref<any>({});
const loading = ref(false);
const addLinkDialogRef = ref<InstanceType<typeof AddDownloadLinkDialog>>();
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
  router.push(`/video/manage/edit?id=${videoData.value.videoId}`);
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

// 获取下载字段
const getDownloadField = (download, field) => {
  // 处理不同的字段名称映射
  const fieldMap = {
    name: "videoDownloadName",
    url: "videoDownloadUrl",
    type: "videoDownloadType",
    quality: "videoDownloadQuality",
    size: "videoDownloadSize",
    count: "videoDownloadCount",
    magnetic: "videoDownloadMagnetic",
    status: "videoDownloadStatus",
  };

  const mappedField = fieldMap[field];
  return mappedField ? download[mappedField] : null;
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
const parseMagnetLinks = (downloadList) => {
  if (!downloadList || !Array.isArray(downloadList)) return [];
  return downloadList.filter((it) => it.videoDownloadType === "磁力资源");
};

// 解析网盘链接
const parsePanLinks = (downloadList) => {
  if (!downloadList || !Array.isArray(downloadList)) return [];
  return downloadList.filter((it) => ["网盘资源", "百度网盘", "阿里云盘", "天翼网盘"].includes(it.videoDownloadType));
};

// 解析在线播放链接
const parseOnlineLinks = (downloadList) => {
  if (!downloadList || !Array.isArray(downloadList)) return [];
  return downloadList.filter((it) => it.videoDownloadType === "在线资源");
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
  if (!link) {
    ElMessage.warning("无法获取磁力链接");
    return;
  }

  navigator.clipboard
    .writeText(link)
    .then(() => {
      ElMessage.success("磁力链接已复制到剪贴板");
    })
    .catch(() => {
      // 兼容性处理：如果navigator.clipboard不可用，使用传统方法
      try {
        const textarea = document.createElement("textarea");
        textarea.value = link;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        ElMessage.success("磁力链接已复制到剪贴板");
      } catch (e) {
        ElMessage.error("复制失败，请手动复制");
      }
    });
};

// 打开磁力链接
const openMagnetLink = (link) => {
  if (!link) {
    ElMessage.warning("无法获取磁力链接");
    return;
  }
  window.open(link, "_blank");
};

// 复制网盘链接和密码
const copyPanLink = (link) => {
  if (!link) {
    ElMessage.warning("无法获取网盘链接");
    return;
  }

  navigator.clipboard
    .writeText(link)
    .then(() => {
      ElMessage.success("网盘链接已复制到剪贴板");
    })
    .catch(() => {
      // 兼容性处理：如果navigator.clipboard不可用，使用传统方法
      try {
        const textarea = document.createElement("textarea");
        textarea.value = link;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        ElMessage.success("网盘链接已复制到剪贴板");
      } catch (e) {
        ElMessage.error("复制失败，请手动复制");
      }
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

// 显示添加链接对话框
const showAddLinkDialog = () => {
  if (addLinkDialogRef.value) {
    addLinkDialogRef.value.openDialog();
  }
};

// 处理添加链接成功
const handleAddLinkSuccess = () => {
  ElMessage.success("添加链接成功");
  // 刷新视频详情，获取最新的下载列表
  fetchVideoDetail();
};

onMounted(() => {
  fetchVideoDetail();
});
</script>

<style lang="scss" scoped>
.video-detail-container {
  padding: 32px;
  background: linear-gradient(145deg, var(--el-bg-color) 0%, var(--el-bg-color-page) 100%);
  min-height: 100%;
  color: var(--el-text-color-primary);
}

.detail-header {
  display: flex;
  align-items: center;
  margin-bottom: 36px;
  position: relative;
}

.back-button {
  margin-right: 24px;
  border-radius: 50px;
  padding: 10px 20px;
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  font-weight: 600;

  &:hover {
    transform: translateX(-6px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }

  .icon {
    margin-right: 8px;
    font-size: 18px;
  }
}

.detail-title {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  color: var(--el-text-color-primary);
  letter-spacing: -0.5px;
  background: linear-gradient(90deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.detail-content {
  display: flex;
  gap: 36px;
  max-width: 100%;
  overflow-x: hidden;
}

.poster-section {
  width: 340px;
  flex-shrink: 0;
}

.poster-wrapper {
  width: 100%;
  height: 480px;
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(0deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 30%);
    opacity: 0;
    transition: opacity 0.4s ease;
    z-index: 1;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);

    &::before {
      opacity: 1;
    }
  }
}

.poster-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.8s ease;

  &:hover {
    transform: scale(1.05);
  }
}

.no-poster {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--el-fill-color-light) 0%, var(--el-fill-color) 100%);
  color: var(--el-text-color-secondary);
  font-size: 18px;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 16px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 16px;
  padding: 16px 0;
  font-weight: 700;
  font-size: 16px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: none;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 20px rgba(0, 0, 0, 0.18);
  }

  &[type="primary"] {
    background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  }

  &[type="success"] {
    background: linear-gradient(135deg, var(--el-color-success) 0%, var(--el-color-success-light-3) 100%);
  }
}

.info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 100%;
  overflow-x: hidden;
}

.basic-info,
.detail-info,
.tags-section,
.source-section,
.download-section {
  padding: 28px 32px;
  background: var(--el-bg-color-page);
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border: 1px solid rgba(var(--el-border-color-lighter), 0.05);

  &:hover {
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  position: relative;
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: var(--el-text-color-primary);
  padding-left: 18px;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 6px;
    height: 28px;
    background: linear-gradient(0deg, var(--el-color-primary) 0%, var(--el-color-primary-light-5) 100%);
    border-radius: 3px;
  }
}

.add-link-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.15);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(var(--el-color-primary-rgb), 0.2);
  }
}

.add-link-form {
  margin-top: 20px;
}

.ratings-container {
  display: flex;
  align-items: center;
  gap: 18px;
}

.score-tag {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, var(--el-color-warning-light-8) 0%, var(--el-color-warning-light-9) 100%);
  color: var(--el-color-warning-dark-2);
  padding: 8px 16px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 16px;
  box-shadow: 0 4px 8px rgba(var(--el-color-warning-rgb), 0.15);
  transform: translateY(0);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 8px 16px rgba(var(--el-color-warning-rgb), 0.2);
  }

  .star-icon {
    margin-right: 8px;
    font-size: 20px;
    color: var(--el-color-warning);
  }
}

.external-ratings {
  display: flex;
  gap: 16px;
}

.rating-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.06);

  &.douban {
    background: linear-gradient(135deg, #f5fffa 0%, #ebf9f1 100%);
    color: var(--el-color-success-dark-2);
    border: 1px solid rgba(var(--el-color-success-rgb), 0.15);
  }

  &.imdb {
    background: linear-gradient(135deg, #fffdf5 0%, #fff7e6 100%);
    color: var(--el-color-warning-dark-2);
    border: 1px solid rgba(var(--el-color-warning-rgb), 0.15);
  }

  &:hover {
    transform: translateY(-6px) scale(1.05);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  }
}

.rating-name {
  margin-right: 10px;
  font-weight: 700;
}

.rating-score {
  font-size: 20px;
  font-weight: 800;
  margin-right: 8px;
}

.rating-count {
  font-size: 12px;
  opacity: 0.9;
  font-weight: 500;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  padding: 0 6px;
  width: 100%;
  overflow-wrap: break-word;
  word-break: break-word;
}

.info-item {
  display: flex;
  align-items: center;
}

.item-label {
  color: var(--el-text-color-secondary);
  margin-right: 12px;
  flex-shrink: 0;
  font-weight: 600;
  font-size: 15px;
}

.item-value {
  color: var(--el-text-color-primary);
  font-weight: 600;
  font-size: 15px;
  max-width: 100%;
  overflow-wrap: break-word;
  word-break: break-word;
}

/* 导演和主演名字设置为主题色 */
.director-name,
.actor-name {
  background: linear-gradient(90deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
}

.type-tag {
  border: none;
  margin-right: 10px;
  border-radius: 8px;
  font-weight: 600;
  padding: 6px 14px;
  font-size: 12px;
  box-shadow: 0 2px 6px rgba(var(--el-color-primary-rgb), 0.15);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(var(--el-color-primary-rgb), 0.2);
  }
}

.plot-summary {
  line-height: 1.9;
  color: var(--el-text-color-primary);
  text-align: justify;
  font-size: 16px;
  padding: 0 8px;
  font-weight: 500;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 0 6px;
}

.tag-item {
  margin-right: 8px;
  margin-bottom: 8px;
  border-radius: 30px;
  padding: 8px 18px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-weight: 600;

  &:hover {
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.1);
  }
}

.no-data {
  color: var(--el-text-color-secondary);
  font-style: italic;
  padding: 12px 6px;
  font-size: 15px;
}

/* 下载区域样式 */
.download-tabs {
  margin-top: 20px;

  :deep(.el-tabs__item) {
    font-size: 16px;
    font-weight: 600;
    padding: 0 28px;
    height: 52px;
    line-height: 52px;
    transition: all 0.3s ease;

    &.is-active {
      font-weight: 700;
      transform: translateY(-2px);
    }

    &:hover {
      color: var(--el-color-primary);
    }
  }

  :deep(.el-tabs--border-card) {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(var(--el-border-color-lighter), 0.1);
  }

  :deep(.el-tabs__nav) {
    background: linear-gradient(180deg, var(--el-bg-color) 0%, var(--el-bg-color-page) 100%);
  }
}

.download-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px 8px;
}

.download-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(145deg, var(--el-bg-color) 0%, var(--el-bg-color-page) 100%);
  border-radius: 16px;
  border-left: 6px solid var(--el-color-primary);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    transform: translateY(-6px) scale(1.01);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
    border-left-width: 10px;
  }
}

.download-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.download-name {
  display: flex;
  align-items: center;
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.download-icon {
  margin-right: 14px;
  font-size: 24px;
}

.magnet-icon {
  color: var(--el-color-primary);
}

.pan-icon {
  color: var(--el-color-success);
}

.online-icon {
  color: var(--el-color-warning);
}

.download-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 1.5;
  font-weight: 500;
}

.inline-tags {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  white-space: normal;
}

.inline-quality,
.inline-platform {
  display: inline-block;
  margin-left: 14px;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 13px;
  background: linear-gradient(135deg, var(--el-color-success-light-8) 0%, var(--el-color-success-light-9) 100%);
  color: var(--el-color-success-dark-2);
  font-weight: 600;
  box-shadow: 0 3px 8px rgba(var(--el-color-success-rgb), 0.1);
}

.inline-platform {
  background: linear-gradient(135deg, var(--el-fill-color-light) 0%, var(--el-fill-color) 100%);
  color: var(--el-text-color-secondary);
}

.download-actions {
  display: flex;
  gap: 14px;
  margin-left: 20px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.download-actions .el-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  border-radius: 12px;
  padding: 10px 18px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.15);
  }

  &[type="primary"] {
    background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
    border: none;
  }

  &[type="success"] {
    background: linear-gradient(135deg, var(--el-color-success) 0%, var(--el-color-success-light-3) 100%);
    border: none;
  }
}

/* 响应式设计，保留原有代码并根据需要调整 */
@media (max-width: 1200px) {
  .info-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .download-list.compact {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}

@media (max-width: 992px) {
  .detail-content {
    gap: 16px;
  }

  .poster-section {
    width: 250px;
  }

  .poster-wrapper {
    height: 350px;
  }

  .info-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .ratings-container {
    margin-top: 12px;
  }

  .external-ratings {
    flex-wrap: wrap;
  }

  .download-list.compact {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }

  .download-actions {
    flex-wrap: nowrap;
  }

  .download-actions .el-button {
    padding: 8px 10px;
  }
}

@media (max-width: 768px) {
  .video-detail-container {
    padding: 16px;
  }

  .detail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .detail-title {
    font-size: 20px;
  }

  .detail-content {
    flex-direction: column;
    width: 100%;
  }

  .poster-section {
    width: 100%;
    margin-bottom: 20px;
  }

  .poster-wrapper {
    height: 300px;
    max-width: 220px;
    margin: 0 auto 16px auto;
  }

  .action-buttons {
    justify-content: center;
  }

  .info-section {
    width: 100%;
  }

  .info-grid {
    grid-template-columns: 1fr;
    width: 100%;
  }

  .info-item {
    flex-wrap: wrap;
    width: 100%;
  }

  .item-value {
    max-width: 100%;
  }

  .download-list.compact {
    grid-template-columns: 1fr;
  }

  .download-item {
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    padding: 12px;
  }

  .download-info {
    flex: 1;
    min-width: 60%;
    max-width: 100%;
  }

  .download-actions {
    margin-top: 0;
    width: auto;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;
  }

  .download-meta {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 4px;
  }

  .download-quality::before,
  .download-size::before,
  .download-platform::before,
  .download-date::before,
  .download-count::before,
  .download-type::before {
    content: "";
    margin-right: 0;
  }
}

@media (max-width: 576px) {
  .video-detail-container {
    padding: 12px;
  }

  .detail-title {
    font-size: 18px;
  }

  .section-title {
    font-size: 16px;
  }

  .basic-info,
  .detail-info,
  .tags-section,
  .source-section,
  .download-section {
    padding: 15px;
  }

  .poster-wrapper {
    height: 280px;
    max-width: 100%;
  }

  .action-buttons {
    flex-direction: column;
    gap: 8px;
  }

  .download-item {
    padding: 10px;
  }

  .download-info {
    width: 100%;
    overflow: hidden;
  }

  .download-actions {
    width: 100%;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
    justify-content: flex-start;
  }

  .download-actions .el-button {
    flex: 0 1 auto;
    padding: 8px 12px;
    height: auto;
    min-height: 32px;
    min-width: 80px;
  }

  .download-actions .el-button span {
    font-size: 12px;
  }

  .tags-list {
    gap: 6px;
  }

  .tag-item {
    margin-right: 0;
    margin-bottom: 0;
  }

  .download-name {
    flex-wrap: wrap;
    width: 100%;
  }

  .download-name span {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .inline-quality,
  .inline-platform {
    margin-top: 4px;
    margin-left: 0;
    margin-right: 4px;
  }
}
</style>
