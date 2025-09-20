<template>
  <div class="video-detail-container">
    <!-- 美化后的页面头部 -->
    <div class="detail-header">
      <div class="header-background"></div>
      <div class="header-content">
        <el-button @click="goBack" class="back-button">
          <IconifyIconOnline icon="ep:arrow-left" />
          返回
        </el-button>
        <div class="header-title">
          <h1 class="detail-title">{{ videoData.videoTitle || videoData.videoName }}</h1>
          <div class="title-subtitle" v-if="videoData.videoYear">{{ videoData.videoYear }}年</div>
        </div>
      </div>
    </div>

    <div class="detail-content">
      <!-- 美化后的海报和操作区域 -->
      <div class="poster-section">
        <div class="poster-wrapper">
          <div class="poster-container">
            <el-image v-if="videoData.videoCover" referrerpolicy="no-referrer" :src="videoData.videoCover?.split(',')?.[0]" :preview-src-list="videoData.videoCover?.split(',')" fit="cover" class="poster-image">
              <template #error>
                <el-image
                  v-if="videoData.videoCover"
                  referrerpolicy="no-referrer"
                  :src="createCompatibleImageUrl(videoData.videoCover?.split(',')?.[1], videoData.videoPlatform)"
                  :preview-src-list="[createCompatibleImageUrl(videoData.videoCover?.split(',')?.[1], videoData.videoPlatform)]"
                  fit="cover"
                  class="poster-image"
                >
                  <template #error>
                    <div class="no-poster">
                      <IconifyIconOnline icon="ep:picture" class="no-poster-icon" />
                      <span>暂无海报</span>
                    </div>
                  </template>
                </el-image>
              </template>
            </el-image>
            <div v-else class="no-poster">
              <IconifyIconOnline icon="ep:picture" class="no-poster-icon" />
              <span>暂无海报</span>
            </div>
            <div class="poster-overlay"></div>
          </div>
        </div>

        <!-- 剧情简介卡片 -->
        <div class="info-card detail-info mb-8">
          <div class="card-header">
            <div class="section-title">
              <IconifyIconOnline icon="ep:document" class="title-icon" />
              <h3>剧情简介</h3>
            </div>
          </div>
          <div class="plot-summary">
            <p v-if="videoData.videoDescription" class="plot-text">{{ videoData.videoDescription }}</p>
            <div v-else class="no-data">
              <IconifyIconOnline icon="ep:warning" />
              <span>暂无简介</span>
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <el-button type="primary" @click="handleEdit" class="action-btn primary-btn">
            <IconifyIconOnline icon="ep:edit" />
            <span>编辑视频</span>
          </el-button>
          <el-button type="success" @click="handlePlay" class="action-btn play-btn" v-if="videoData.videoUrl">
            <IconifyIconOnline icon="ep:video-play" />
            <span>播放视频</span>
          </el-button>
        </div>
      </div>

      <!-- 美化后的信息区域 -->
      <div class="info-section">
        <!-- 基本信息卡片 -->
        <div class="info-card basic-info">
          <div class="card-header">
            <div class="section-title">
              <IconifyIconOnline icon="ep:info-filled" class="title-icon" />
              <h3>基本信息</h3>
            </div>
            <div class="ratings-container">
              <!-- 视频评分 -->
              <div class="score-tag" v-if="videoData.videoScore">
                <IconifyIconOnline icon="ep:star-filled" class="star-icon" />
                <span class="score-value">{{ videoData.videoScore }}</span>
                <span class="score-text">分</span>
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
            <div class="info-item" v-for="(item, index) in infoItems" :key="index">
              <div class="item-label">
                <IconifyIconOnline :icon="item.icon" class="item-icon" />
                <span>{{ item.label }}</span>
              </div>
              <div class="item-value" :class="item.class">
                <component :is="item.component" v-bind="item.props">
                  {{ item.value }}
                </component>
              </div>
            </div>
          </div>
        </div>

        <!-- 下载信息卡片 -->
        <div class="info-card download-section">
          <div class="card-header">
            <div class="section-title">
              <IconifyIconOnline icon="ep:download" class="title-icon" />
              <h3>下载信息</h3>
            </div>
            <el-button type="primary" size="small" @click="showAddLinkDialog" class="add-link-btn">
              <IconifyIconOnline icon="ep:plus" />
              <span>新增链接</span>
            </el-button>
          </div>

          <div class="download-tabs">
            <el-tabs type="border-card" class="modern-tabs">
              <!-- 下载资源选项卡 -->
              <el-tab-pane label="下载资源">
                <!-- 过滤器 -->
                <div class="filter-container">
                  <div class="filter-row">
                    <el-segmented v-model="downloadQualityFilter" :options="qualityFilterOptions"> </el-segmented>
                  </div>
                </div>

                <div class="download-list compact" v-if="videoData.downloadList && videoData.downloadList.length > 0">
                  <div v-for="(download, index) in filteredDownloadLinks" :key="'download-' + index" class="download-item">
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
                      <el-button v-if="isFromIndexPage" type="danger" size="small" @click="handleDeleteDownload(download)">
                        <IconifyIconOnline icon="ep:delete" />
                        删除
                      </el-button>
                    </div>
                  </div>
                </div>
                <div v-else class="no-data">暂无下载资源</div>
              </el-tab-pane>

              <!-- 磁力资源选项卡 - 更紧凑的布局 -->
              <el-tab-pane label="磁力资源">
                <!-- 高清度和磁力类型过滤 -->
                <div class="filter-container flex flex-row">
                  <el-segmented v-model="qualityFilter" :options="qualityFilterOptions" @change="debounceFilter(() => {})"> </el-segmented>
                  <el-segmented v-model="magnetTypeFilter" :options="magnetTypeOptions" @change="debounceFilter(() => {})"> </el-segmented>
                </div>

                <div class="download-list-container">
                  <!-- 过滤加载状态 -->
                  <div v-if="isFiltering" class="filter-loading">
                    <el-skeleton :rows="3" animated />
                  </div>
                  <div v-else class="download-list compact">
                    <template v-if="videoData.downloadList">
                      <transition-group name="download-item" tag="div" class="download-items-wrapper">
                        <div v-for="(magnet, index) in filteredMagnetLinks" :key="'magnet-' + magnet.videoDownloadUrl + magnet.videoDownloadName" class="download-item">
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
                            <el-button v-if="isFromIndexPage" type="danger" size="small" @click="handleDeleteDownload(magnet)">
                              <IconifyIconOnline icon="ep:delete" />
                              删除
                            </el-button>
                          </div>
                        </div>
                      </transition-group>
                    </template>
                    <div v-if="!filteredMagnetLinks.length" class="no-data">暂无磁力资源</div>
                  </div>
                </div>
              </el-tab-pane>

              <!-- 网盘资源选项卡 - 更紧凑的布局 -->
              <el-tab-pane label="网盘资源">
                <!-- 添加网盘类型过滤 -->
                <div class="filter-container">
                  <div class="pan-type-tags">
                    <el-tag :effect="panTypeFilter === '' ? 'dark' : 'plain'" class="pan-type-tag" :class="{ 'pan-type-selected': panTypeFilter === '' }" @click="debounceFilter(() => (panTypeFilter = ''))"> 全部 </el-tag>
                    <el-tag v-for="type in panTypes" :key="type.value" :effect="panTypeFilter === type.value ? 'dark' : 'plain'" class="pan-type-tag" :class="{ 'pan-type-selected': panTypeFilter === type.value }" @click="debounceFilter(() => (panTypeFilter = type.value))">
                      {{ type.label }}
                    </el-tag>
                  </div>
                </div>

                <div class="download-list-container">
                  <!-- 过滤加载状态 -->
                  <div v-if="isFiltering" class="filter-loading">
                    <el-skeleton :rows="3" animated />
                  </div>
                  <div v-else class="download-list compact">
                    <template v-if="videoData.downloadList">
                      <transition-group name="download-item" tag="div" class="download-items-wrapper">
                        <div v-for="(pan, index) in filteredPanLinks" :key="'pan-' + pan.videoDownloadUrl + pan.videoDownloadName" class="download-item">
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
                            <el-button v-if="isFromIndexPage" type="danger" size="small" @click="handleDeleteDownload(pan)">
                              <IconifyIconOnline icon="ep:delete" />
                              删除
                            </el-button>
                          </div>
                        </div>
                      </transition-group>
                    </template>
                    <div v-if="!filteredPanLinks.length" class="no-data">暂无网盘资源</div>
                  </div>
                </div>
              </el-tab-pane>

              <!-- 在线播放选项卡 - 更紧凑的布局 -->
              <el-tab-pane label="在线播放">
                <div class="download-list compact" v-if="playAddressList">
                  <div v-for="(online, index) in playAddressList" :key="'online-' + index" class="download-item">
                    <div class="download-info">
                      <div class="download-name">
                        <IconifyIconOnline icon="ep:video-play" class="download-icon online-icon" />
                        <span>{{ online.videoPlayAddressName || `在线资源 ${index + 1}` }}</span>
                        <span class="inline-tags"
                          ><span v-if="online.quality" class="inline-quality">{{ online.quality }}</span
                          ><span v-if="online.platform" class="inline-platform">{{ online.platform }}</span></span
                        >
                      </div>
                      <div>
                        <template v-for="channel in online.videoPlayAddressChannels" :key="channel">
                          <el-button class="inline-channel" @click="openOnlineLink(channel.videoPlayAddressUrl)">
                            <IconifyIconOnline icon="ep:video-play" />
                            {{ channel.videoPlayAddressChannelName }}
                          </el-button>
                        </template>
                      </div>
                    </div>
                    <div class="download-actions" v-if="online.videoPlayAddressChannels.length == 1">
                      <el-button type="success" size="small" @click="openOnlineLink(online.videoPlayAddressChannels[0].videoPlayAddressUrl)">
                        <IconifyIconOnline icon="ep:video-play" />
                        播放
                      </el-button>
                    </div>
                  </div>
                  <div v-if="!playAddressList" class="no-data">暂无在线资源</div>
                </div>
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
      </div>
    </div>
    <!-- 添加链接对话框 -->
    <add-download-link-dialog ref="addLinkDialogRef" :video-id="videoData.videoId" @success="handleAddLinkSuccess" />
  </div>
</template>

<script setup lang="ts">
import { getConfig } from "@repo/config";
import { formatDateTime, getRandomString, message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { deleteDownload, getDownloadsByVideoId } from "../../../api/download";
import { findPlayAddress } from "../../../api/play";
import { getVideoDetail } from "../../../api/video";
import { panTypes } from "../../../data/panTypes";
import { getDownloadField, getDownloadIcon, magnetTypeOptions, parseMagnetLinks, qualityFilterOptions } from "../../../data/videoFilters";
import AddDownloadLinkDialog from "./components/AddDownloadLinkDialog.vue";

const config = getConfig();
const ossAddress = getRandomString(config.OssAddress);
const route = useRoute();
const router = useRouter();
const videoData = ref<any>({});
const loading = ref(false);
const addLinkDialogRef = ref<InstanceType<typeof AddDownloadLinkDialog>>();

// 判断是否从index页面打开
const isFromIndexPage = computed(() => {
  return route.query.from === "index" || document.referrer.includes("/video/manage/index");
});

// 过滤器
const qualityFilter = ref("");
const downloadQualityFilter = ref("");
const panTypeFilter = ref("");
const magnetTypeFilter = ref("");

// 过滤状态管理
const isFiltering = ref(false);
const filterDebounceTimer = ref<NodeJS.Timeout | null>(null);

// 防抖过滤函数
const debounceFilter = (callback: () => void, delay = 150) => {
  if (filterDebounceTimer.value) {
    clearTimeout(filterDebounceTimer.value);
  }
  isFiltering.value = true;
  filterDebounceTimer.value = setTimeout(() => {
    callback();
    isFiltering.value = false;
  }, delay);
};
const playAddressList = ref([]);

// 信息项配置
const infoItems = computed(() => [
  {
    label: "类型",
    icon: "ep:collection-tag",
    value: videoData.value.videoType || "未分类",
    component: "div",
    class: "type-tags",
    props: {
      innerHTML: (videoData.value.videoType || "未分类")
        .split(",")
        .map((type) => `<span class="type-tag">${type}</span>`)
        .join(""),
    },
  },
  {
    label: "年份",
    icon: "ep:calendar",
    value: `${videoData.value.videoYear || "未知"}年`,
    component: "span",
    class: "",
    props: {},
  },
  {
    label: "上映日期",
    icon: "ep:date",
    value: videoData.value.videoRelease || "未知",
    component: "span",
    class: "",
    props: {},
  },
  {
    label: "地区",
    icon: "ep:location",
    value: videoData.value.videoDistrict || "未知",
    component: "span",
    class: "",
    props: {},
  },
  {
    label: "语言",
    icon: "ep:chat-line-round",
    value: videoData.value.videoLanguage || "未知",
    component: "span",
    class: "",
    props: {},
  },
  {
    label: "导演",
    icon: "ep:user",
    value: videoData.value.videoDirector || "未知",
    component: "span",
    class: "director-name",
    props: {},
  },
  {
    label: "主演",
    icon: "ep:user-filled",
    value: videoData.value.videoActor || "未知",
    component: "span",
    class: "actor-name",
    props: {},
  },
  {
    label: "时长",
    icon: "ep:timer",
    value: videoData.value.videoDuration ? `${videoData.value.videoDuration}分钟` : "未知",
    component: "span",
    class: "",
    props: {},
  },
  {
    label: "状态",
    icon: "ep:circle-check",
    value: videoData.value.videoStatus === 0 ? "启用" : "禁用",
    component: "el-tag",
    class: "",
    props: {
      type: videoData.value.videoStatus === 0 ? "success" : "info",
      size: "small",
    },
  },
  {
    label: "发布时间",
    icon: "ep:clock",
    value: videoData.value.videoPublishDate || "未知",
    component: "span",
    class: "",
    props: {},
  },
  {
    label: "更新时间",
    icon: "ep:refresh",
    value: formatDateTime(videoData.value.updateTime) || "未知",
    component: "span",
    class: "",
    props: {},
  },
]);

// 过滤后的磁力链接
const filteredMagnetLinks = computed(() => {
  const magnetLinks = parseMagnetLinks(videoData.value.downloadList || []);

  // 先按清晰度过滤
  let filteredLinks = magnetLinks;
  if (qualityFilter.value) {
    filteredLinks = filteredLinks.filter((item) => {
      return item.videoDownloadQuality && item.videoDownloadQuality.includes(qualityFilter.value);
    });
  }

  // 再按磁力类型过滤
  if (magnetTypeFilter.value) {
    filteredLinks = filteredLinks.filter((item) => {
      return item.videoDownloadName && item.videoDownloadName.includes(magnetTypeFilter.value);
    });
  }

  return filteredLinks;
});

// 过滤后的下载链接
const filteredDownloadLinks = computed(() => {
  if (!downloadQualityFilter.value || !videoData.value.downloadList) {
    return videoData.value.downloadList || [];
  }
  return videoData.value.downloadList.filter((item) => {
    return item.videoDownloadQuality && item.videoDownloadQuality.includes(downloadQualityFilter.value);
  });
});

// 过滤后的网盘链接
const filteredPanLinks = computed(() => {
  const links = parsePanLinks(videoData.value.downloadList || []);
  if (!panTypeFilter.value) {
    return links;
  }
  return links.filter((item) => {
    return item.videoDownloadQuality === panTypeFilter.value;
  });
});

// 处理播放地址索引
const getIndex = (channel) => {
  const rs = [];
  for (let i = channel.videoPlayAddressStartIndex; i <= channel.videoPlayAddressEndIndex; i++) {
    rs.push(i);
  }
  return rs;
};
// 处理高清度过滤变化
const handleQualityFilterChange = () => {
  // 过滤逻辑已经在计算属性中实现
};

// 处理网盘类型过滤变化
const handlePanTypeFilterChange = () => {
  // 过滤逻辑已经在计算属性中实现，使用videoDownloadQuality字段进行过滤
};

// 处理磁力类型过滤变化
const handleMagnetTypeFilterChange = () => {
  // 过滤逻辑已经在计算属性中实现
};

const createCompatibleImageUrl = (videoCover, videoPlatform) => {
  if (!videoCover) {
    return null;
  }
  return ossAddress + `/video/${videoCover.replace("cover", "cover/" + videoPlatform)}`;
};

const fetchVideoDonwload = async () => {
  const videoId: any = route.query.id;
  if (!videoId) return;
  getDownloadsByVideoId(videoId).then((res) => {
    videoData.value.downloadList = res.data;
  });
};

const fetchPlayAddress = async () => {
  const videoId: any = route.query.id;
  if (!videoId) return;
  findPlayAddress({ videoId }).then((res) => {
    //@ts-ignore
    playAddressList.value = res.data;
  });
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

// 处理下载
const handleDownload = (download) => {
  if (download.videoDownloadType === "磁力资源" && download.videoDownloadMagnetic) {
    openMagnetLink(`magnet:?xt=urn:btih:${download.videoDownloadMagnetic}`);
  } else if (download.videoDownloadUrl) {
    window.open(download.videoDownloadUrl, "_blank");
  } else {
    message("无法获取下载链接", { type: "warning" });
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
    message("无法获取下载链接", { type: "warning" });
    return;
  }

  navigator.clipboard
    .writeText(linkText)
    .then(() => {
      message("下载链接已复制到剪贴板", { type: "success" });
    })
    .catch(() => {
      message("复制失败，请手动复制", { type: "error" });
    });
};

// 解析网盘链接
const parsePanLinks = (downloadList) => {
  if (!downloadList || !Array.isArray(downloadList)) return [];
  return downloadList.filter((it) => ["网盘资源", "百度网盘", "阿里云盘", "天翼网盘"].includes(it.videoDownloadType));
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
    message("无法获取磁力链接", { type: "warning" });
    return;
  }

  navigator.clipboard
    .writeText(link)
    .then(() => {
      message("磁力链接已复制到剪贴板", { type: "success" });
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
        message("磁力链接已复制到剪贴板", { type: "success" });
      } catch (e) {
        message("复制失败，请手动复制", { type: "error" });
      }
    });
};

// 打开磁力链接
const openMagnetLink = (link) => {
  if (!link) {
    message("无法获取磁力链接", { type: "warning" });
    return;
  }
  window.open(link, "_blank");
};

// 复制网盘链接和密码
const copyPanLink = (link) => {
  if (!link) {
    message("无法获取网盘链接", { type: "warning" });
    return;
  }

  navigator.clipboard
    .writeText(link)
    .then(() => {
      message("网盘链接已复制到剪贴板", { type: "success" });
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
        message("网盘链接已复制到剪贴板", { type: "success" });
      } catch (e) {
        message("复制失败，请手动复制", { type: "error" });
      }
    });
};

// 打开网盘链接
const openPanLink = (link) => {
  window.open(link, "_blank");
};

// 打开在线播放链接
const openOnlineLink = (link) => {
  // 跳转到播放页面，传递视频URL参数

  const fullUrl = `${window.location.origin}/#/remaining-component/video-play?url=${encodeURIComponent(link)}`;
  window.open(fullUrl, "_blank");
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
    message(`无法获取${mark.videoMarkType}链接`, { type: "warning" });
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
  message("添加链接成功", { type: "success" });
  // 刷新视频详情，获取最新的下载列表
  fetchVideoDetail();
};

// 处理删除下载链接
const handleDeleteDownload = (download) => {
  if (!download || !download.videoDownloadId) {
    message("无法获取下载链接ID", { type: "warning" });
    return;
  }

  ElMessageBox.confirm("确定要删除该下载链接吗？删除后无法恢复。", "删除确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      loading.value = true;
      try {
        const res = await deleteDownload(download.videoDownloadId);
        if (res.data && res.data.code === 0) {
          message("删除成功", { type: "success" });
          // 刷新视频详情，获取最新的下载列表
          fetchVideoDetail();
        } else {
          message(res.data?.message || "删除失败");
        }
      } catch (error) {
        console.error("删除下载链接出错:", error);
        message("删除失败", { type: "error" });
      } finally {
        loading.value = false;
      }
    })
    .catch(() => {
      // 用户取消删除操作
    });
};

onMounted(() => {
  fetchVideoDonwload();
  fetchVideoDetail();
  fetchPlayAddress();
});
</script>

<style scoped>
/* 动画关键帧 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes slideInFromBottom {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 全局容器样式 */
.video-detail-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow-x: hidden;
  animation: fadeInUp 0.6s ease-out;
}

/* 页面头部样式 */
.detail-header {
  position: relative;
  padding: 30px 0;
  margin-bottom: 30px;
}

.header-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%);
  backdrop-filter: blur(10px);
}

.header-content {
  position: relative;
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.header-title {
  flex: 1;
}

.detail-title {
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  line-height: 1.2;
}

.title-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 5px;
  font-weight: 500;
}

/* 主要内容区域 */
.detail-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px 40px;
  display: flex;
  gap: 40px;
  align-items: flex-start;
}

/* 海报区域样式 */
.poster-section {
  flex-shrink: 0;
  width: 320px;
  animation: fadeInLeft 0.8s ease-out;
}

.poster-wrapper {
  margin-bottom: 25px;
  animation: scaleIn 0.6s ease-out 0.2s both;
}

.poster-container {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.poster-container:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
}

.poster-image {
  width: 100%;
  height: 450px;
  object-fit: cover;
}

.poster-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.3) 100%);
  pointer-events: none;
}

.no-poster {
  width: 100%;
  height: 450px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #6c757d;
  font-size: 16px;
  font-weight: 500;
}

.no-poster-icon {
  font-size: 48px;
  margin-bottom: 10px;
  opacity: 0.6;
}

/* 操作按钮样式 */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.primary-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4);
}

.play-btn {
  background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%);
  border: none;
  box-shadow: 0 8px 20px rgba(86, 171, 47, 0.3);
}

.play-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(86, 171, 47, 0.4);
}

/* 信息区域样式 */
.info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 30px;
  animation: fadeInRight 0.8s ease-out;
}

.info-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  animation: slideInFromBottom 0.6s ease-out;
}

.info-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
}

.info-card:nth-child(1) {
  animation-delay: 0.1s;
}
.info-card:nth-child(2) {
  animation-delay: 0.2s;
}
.info-card:nth-child(3) {
  animation-delay: 0.3s;
}
.info-card:nth-child(4) {
  animation-delay: 0.4s;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f8f9fa;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
}

.section-title h3 {
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}

.title-icon {
  font-size: 24px;
  color: #667eea;
}

/* 评分区域样式 */
.ratings-container {
  display: flex;
  align-items: center;
  gap: 15px;
}

.score-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 25px;
  font-weight: 700;
  font-size: 16px;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
}

.star-icon {
  font-size: 18px;
}

.score-value {
  font-size: 18px;
  font-weight: 800;
}

.score-text {
  font-size: 14px;
  opacity: 0.9;
}

.external-ratings {
  display: flex;
  gap: 12px;
}

.rating-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 15px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 12px;
  min-width: 70px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.rating-item.douban {
  background: linear-gradient(135deg, #00b51d 0%, #00a01a 100%);
  color: white;
}

.rating-item.imdb {
  background: linear-gradient(135deg, #f5c518 0%, #e6b800 100%);
  color: #000;
}

.rating-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.rating-name {
  font-weight: 700;
  margin-bottom: 3px;
}

.rating-score {
  font-size: 16px;
  font-weight: 800;
}

.rating-count {
  font-size: 10px;
  opacity: 0.8;
  margin-top: 2px;
}

/* 信息网格样式 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  padding: 15px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item:hover {
  background: rgba(102, 126, 234, 0.02);
  border-radius: 8px;
  padding: 15px;
  margin: 0 -15px;
}

.item-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #495057;
  min-width: 100px;
  margin-right: 20px;
}

.item-icon {
  font-size: 16px;
  color: #667eea;
}

.item-value {
  flex: 1;
  color: #2c3e50;
  font-weight: 500;
}

.type-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.type-tag {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.director-name,
.actor-name {
  font-weight: 600;
  color: #2c3e50;
}

/* 剧情简介样式 */
.plot-summary {
  line-height: 1.8;
  color: #495057;
  font-size: 15px;
}

.plot-text {
  margin: 0;
  text-align: justify;
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #6c757d;
  font-style: italic;
  text-align: center;
  padding: 30px;
  background: rgba(108, 117, 125, 0.05);
  border-radius: 12px;
}

/* 下载区域样式 */
.add-link-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  font-weight: 600;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.add-link-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.download-tabs {
  margin-top: 20px;
}

.modern-tabs {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

/* 过滤器样式 */
.filter-container {
  margin-bottom: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.filter-row {
  display: flex;
  gap: 15px;
  align-items: center;
}

.filter-select {
  min-width: 150px;
}

.pan-type-tags {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.pan-type-tag {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #dee2e6;
  border-radius: 20px;
  font-weight: 500;
}

.pan-type-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.pan-type-selected {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
  border-color: transparent !important;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

/* 下载列表容器样式 - 防止抖动 */
.download-list-container {
  min-height: 200px;
  transition: all 0.3s ease;
}

/* 过滤加载状态样式 */
.filter-loading {
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.download-list.compact {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.download-items-wrapper {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.download-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.download-item:hover {
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-3px) scale(1.01);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* 过渡动画 - 平滑的进入和离开效果 */
.download-item-enter-active,
.download-item-leave-active {
  transition: all 0.3s ease;
}

.download-item-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.download-item-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.download-item-move {
  transition: transform 0.3s ease;
}

.download-info {
  flex: 1;
  margin-right: 20px;
}

.download-name {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 15px;
}

.download-icon {
  font-size: 18px;
  color: #667eea;
}

.download-icon.magnet-icon {
  color: #e74c3c;
}

.download-icon.pan-icon {
  color: #3498db;
}

.download-icon.online-icon {
  color: #27ae60;
}

.download-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
  font-size: 13px;
  color: #6c757d;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  background: rgba(108, 117, 125, 0.1);
  border-radius: 15px;
  font-weight: 500;
}

.meta-icon {
  font-size: 12px;
  opacity: 0.8;
}

.download-quality {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.download-size {
  color: #495057;
}

.download-platform {
  color: #007bff;
  font-weight: 600;
}

.download-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.action-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 5px;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.action-btn.primary:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  animation: pulse 2s infinite;
}

.action-btn.success {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
}

.action-btn.success:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
  animation: pulse 2s infinite;
}

.action-btn.warning {
  background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3);
}

.action-btn.warning:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 20px rgba(255, 193, 7, 0.4);
  animation: pulse 2s infinite;
}

/* 按钮点击效果 */
.action-btn:active {
  transform: translateY(0) scale(0.98);
  transition: all 0.1s ease;
}

/* 加载状态动画 */
.loading-shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200px 100%;
  animation: shimmer 1.5s infinite;
}

/* 响应式设计优化 */
@media (max-width: 1400px) {
  .video-detail-container {
    padding: 20px;
  }

  .detail-content {
    gap: 24px;
  }
}

@media (max-width: 1200px) {
  .video-detail-container {
    padding: 18px;
  }

  .detail-content {
    gap: 20px;
  }

  .poster-section {
    width: 280px;
  }

  .info-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }

  .download-list.compact {
    gap: 12px;
  }

  .info-card {
    padding: 20px;
  }
}

@media (max-width: 992px) {
  .video-detail-container {
    padding: 16px;
  }

  .detail-content {
    gap: 18px;
  }

  .poster-section {
    width: 260px;
    animation-delay: 0s;
  }

  .poster-wrapper {
    height: 380px;
  }

  .info-section {
    animation-delay: 0.1s;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .ratings-container {
    margin-top: 15px;
  }

  .external-ratings {
    flex-wrap: wrap;
    gap: 10px;
  }

  .download-actions {
    flex-wrap: wrap;
    gap: 8px;
  }

  .action-btn {
    padding: 10px 14px;
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .video-detail-container {
    padding: 14px;
    animation-duration: 0.4s;
  }

  .detail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
    margin-bottom: 20px;
  }

  .detail-title {
    font-size: 22px;
    line-height: 1.3;
  }

  .detail-content {
    flex-direction: column;
    width: 100%;
    gap: 20px;
  }

  .poster-section {
    width: 100%;
    margin-bottom: 0;
    animation: fadeInUp 0.5s ease-out;
  }

  .poster-wrapper {
    height: 320px;
    max-width: 240px;
    margin: 0 auto 20px auto;
  }

  .action-buttons {
    justify-content: center;
    gap: 10px;
  }

  .action-btn {
    min-width: 120px;
    padding: 12px 16px;
  }

  .info-section {
    width: 100%;
    animation: fadeInUp 0.5s ease-out 0.1s both;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .item-label {
    font-weight: 600;
    color: #495057;
  }

  .item-value {
    width: 100%;
    text-align: left;
  }

  .download-list.compact {
    gap: 12px;
  }

  .download-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 16px;
  }

  .download-info {
    width: 100%;
  }

  .download-name {
    font-size: 16px;
    margin-bottom: 10px;
  }

  .download-meta {
    justify-content: flex-start;
    gap: 8px;
    margin-top: 8px;
  }

  .download-actions {
    width: 100%;
    justify-content: center;
    gap: 10px;
    margin-top: 10px;
  }

  .action-btn {
    flex: 1;
    min-width: 0;
    max-width: 120px;
  }
}

@media (max-width: 576px) {
  .video-detail-container {
    padding: 12px;
    animation-duration: 0.3s;
  }

  .detail-title {
    font-size: 20px;
    line-height: 1.2;
    text-align: center;
  }

  .card-header .section-title {
    font-size: 18px;
    text-align: center;
  }

  .info-card {
    padding: 16px;
    margin-bottom: 12px;
  }

  .poster-wrapper {
    height: 300px;
    max-width: 200px;
    margin: 0 auto 16px auto;
  }

  .action-buttons {
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }

  .action-btn {
    width: 100%;
    max-width: 200px;
    padding: 14px 20px;
    font-size: 16px;
  }

  .info-grid {
    gap: 10px;
  }

  .info-item {
    padding: 12px;
    background: rgba(248, 249, 250, 0.8);
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.05);
  }

  .download-item {
    padding: 14px;
    border-radius: 10px;
  }

  .download-name {
    font-size: 15px;
    text-align: center;
    margin-bottom: 12px;
  }

  .download-meta {
    justify-content: center;
    flex-wrap: wrap;
    gap: 6px;
  }

  .meta-item {
    font-size: 12px;
    padding: 3px 8px;
  }

  .download-actions {
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .action-btn {
    flex: 0 1 auto;
    min-width: 80px;
    max-width: 100px;
    padding: 10px 12px;
    font-size: 13px;
  }

  /* 优化动画性能 */
  .download-item:nth-child(n + 4) {
    animation-delay: 0.3s;
  }

  /* 简化hover效果以提升性能 */
  .download-item:hover,
  .info-card:hover,
  .action-btn:hover {
    transform: translateY(-2px);
  }

  /* 隐藏不必要的装饰元素 */
  .poster-overlay {
    display: none;
  }
}

.filter-container {
  margin-bottom: 16px;

  .pan-type-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .pan-type-tag {
      cursor: pointer;
      margin-right: 0;
      transition: all 0.3s;
      border-width: 1px;

      &:hover {
        opacity: 0.8;
        transform: translateY(-2px);
      }

      &.pan-type-selected {
        font-weight: bold;
        border-width: 2px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }
    }
  }
}
</style>
