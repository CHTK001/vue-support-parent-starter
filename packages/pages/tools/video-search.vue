<script setup>
import { reactive, ref, onMounted, computed, shallowRef } from "vue";
import { message } from "@repo/utils";
import { useI18n } from "vue-i18n";
import { fetchVideoSearch, fetchVideoTypes, fetchHotKeywords } from "@repo/core";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

// 国际化
const { t } = useI18n();

// 防抖定时器
let debounceTimer = null;
// 在 script setup 部分添加以下代码（放在 env 变量定义之后）
const isSearchPanelCollapsed = ref(true);

/**
 * 切换搜索面板的折叠状态
 */
const toggleSearchPanel = () => {
  isSearchPanelCollapsed.value = !isSearchPanelCollapsed.value;
};
// 环境变量
const env = reactive({
  loading: false,
  keyword: "",
  selectedType: "all",
  searchResults: [],
  history: [],
  currentPage: 1,
  pageSize: 10,
  totalResults: 0,
  showHistory: true,
  types: [
    {
      id: "all",
      name: "全部类型",
      icon: "ri:search-line",
      color: "#409EFF",
    },
    {
      id: "movie",
      name: "电影",
      icon: "ri:movie-line",
      color: "#FF9C00",
    },
    {
      id: "tv",
      name: "电视剧",
      icon: "ri:tv-line",
      color: "#00BE06",
    },
    {
      id: "anime",
      name: "动漫",
      icon: "ri:gamepad-line",
      color: "#FB7299",
    },
    {
      id: "variety",
      name: "综艺",
      icon: "ri:live-line",
      color: "#FF8800",
    },
    {
      id: "documentary",
      name: "纪录片",
      icon: "ri:film-line",
      color: "#0099FF",
    },
    {
      id: "short",
      name: "短视频",
      icon: "ri:video-line",
      color: "#000000",
    },
    {
      id: "music",
      name: "音乐MV",
      icon: "ri:music-line",
      color: "#FF0000",
    },
  ],
  platforms: [
    {
      id: "all",
      name: "全部平台",
      icon: "ri:global-line",
      color: "#409EFF",
      url: "",
    },
    {
      id: "bilibili",
      name: "哔哩哔哩",
      icon: "ri:bilibili-line",
      color: "#FB7299",
      url: "https://search.bilibili.com/all?keyword={{keyword}}",
    },
    {
      id: "youtube",
      name: "YouTube",
      icon: "ri:youtube-line",
      color: "#FF0000",
      url: "https://www.youtube.com/results?search_query={{keyword}}",
    },
    {
      id: "iqiyi",
      name: "爱奇艺",
      icon: "ri:tv-line",
      color: "#00BE06",
      url: "https://so.iqiyi.com/so/q_{{keyword}}",
    },
    {
      id: "tencent",
      name: "腾讯视频",
      icon: "ri:video-line",
      color: "#FF9C00",
      url: "https://v.qq.com/x/search/?q={{keyword}}",
    },
    {
      id: "youku",
      name: "优酷",
      icon: "ri:play-circle-line",
      color: "#0099FF",
      url: "https://so.youku.com/search_video/q_{{keyword}}",
    },
    {
      id: "mgtv",
      name: "芒果TV",
      icon: "ri:movie-line",
      color: "#FF8800",
      url: "https://so.mgtv.com/so/k-{{keyword}}",
    },
    {
      id: "douyin",
      name: "抖音",
      icon: "ri:rhythm-line",
      color: "#000000",
      url: "https://www.douyin.com/search/{{keyword}}",
    },
  ],
  popularKeywords: ["热门电影", "综艺节目", "动漫", "纪录片", "电视剧", "音乐MV", "教程", "游戏实况"],
});

// 计算属性：分页后的搜索结果
const paginatedResults = computed(() => {
  const start = (env.currentPage - 1) * env.pageSize;
  const end = start + env.pageSize;
  return env.searchResults.slice(start, end);
});

// 计算属性：总页数
const totalPages = computed(() => {
  return Math.ceil(env.searchResults.length / env.pageSize);
});

const form = reactive({});
const tableRef = shallowRef();

const handleDataLoad = async (data, total) => {
  env.totalResults = total;
};
/**
 * 搜索视频
 */
const searchVideo = async () => {
  if (!env.keyword.trim()) {
    message(t("message.emptyKeyword") || "请输入搜索关键词", { type: "warning" });
    return;
  }
  form.keyword = env.keyword.trim();
  env.loading = true;
  tableRef.value.reload(form);
  // 添加到历史记录
  addToHistory(env.keyword);

  env.loading = false;
};

/**
 * 防抖搜索
 */
const debounceSearch = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    if (env.keyword.trim()) {
      searchVideo();
    }
  }, 500);
};

/**
 * 添加到历史记录
 * @param {string} keyword - 搜索关键词
 */
const addToHistory = (keyword) => {
  // 如果已存在，先移除
  const index = env.history.indexOf(keyword);
  if (index !== -1) {
    env.history.splice(index, 1);
  }

  // 添加到历史记录开头
  env.history.unshift(keyword);

  // 限制历史记录数量为10个
  if (env.history.length > 10) {
    env.history.pop();
  }

  // 保存到本地存储
  localStorage.setItem("video-search-history", JSON.stringify(env.history));
};

/**
 * 从历史记录中选择
 * @param {string} keyword - 历史关键词
 */
const selectFromHistory = (keyword) => {
  env.keyword = keyword;
  searchVideo();
};

/**
 * 清空历史记录
 */
const clearHistory = () => {
  env.history = [];
  localStorage.removeItem("video-search-history");
};

/**
 * 打开搜索平台
 * @param {string} platformId - 平台ID
 */
const openSearchPlatform = (platformId) => {
  form.platformId = platformId;
  if (!env.keyword.trim()) {
    message(t("message.emptyKeyword") || "请输入搜索关键词", { type: "warning" });
    return;
  }

  const platform = env.platforms.find((p) => p.id === platformId);
  if (platform && platform.url) {
    const url = platform.url.replace("{{keyword}}", encodeURIComponent(env.keyword));
    window.open(url, "_blank");

    // 添加到历史记录
    addToHistory(env.keyword);
  }
};

/**
 * 使用热门关键词
 * @param {string} keyword - 热门关键词
 */
const usePopularKeyword = (keyword) => {
  env.keyword = keyword;
  form.keyword = keyword;
  searchVideo();
};

/**
 * 格式化数字
 * @param {number} num - 要格式化的数字
 * @returns {string} 格式化后的字符串
 */
const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + "万";
  }
  return num.toString();
};

/**
 * 打开视频链接
 * @param {string} url - 视频链接
 */
const openVideoLink = (url) => {
  window.open(url, "_blank");
};

/**
 * 切换页码
 * @param {number} page - 页码
 */
const changePage = (page) => {
  env.currentPage = page;
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: "smooth" });
};

/**
 * 获取视频类型列表
 */
const getVideoTypes = async () => {
  try {
    // 实际项目中应该使用下面的API调用
    // const res = await fetchVideoTypes();
    // if (res.success) {
    //   env.types = res.data || [];
    // }

    // 这里使用的是预设的类型列表
    console.log("使用预设的视频类型列表");
  } catch (error) {
    console.error("获取视频类型失败:", error);
  }
};

/**
 * 获取热门搜索关键词
 */
const getHotKeywords = async () => {
  try {
    // 实际项目中应该使用下面的API调用
    // const res = await fetchHotKeywords();
    // if (res.success) {
    //   env.popularKeywords = res.data || [];
    // }

    // 这里使用的是预设的热门关键词
    console.log("使用预设的热门搜索关键词");
  } catch (error) {
    console.error("获取热门搜索关键词失败:", error);
  }
};

// 组件挂载时的操作
onMounted(() => {
  // 从本地存储加载历史记录
  const savedHistory = localStorage.getItem("video-search-history");
  if (savedHistory) {
    try {
      env.history = JSON.parse(savedHistory);
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  }

  // 获取视频类型列表
  getVideoTypes();

  // 获取热门搜索关键词
  getHotKeywords();
});
</script>

<template>
  <div class="video-search-tool">
    <div class="video-search-tool__content">
      <!-- 顶部区域：标题和说明 -->
      <div class="video-search-tool__header-container">
        <div class="video-search-tool__header">
          <div class="video-search-tool__header-inner">
            <div class="video-search-tool__header-title">视频搜索工具</div>
            <div class="video-search-tool__header-subtitle">一站式搜索各大视频平台内容</div>
          </div>
          <div class="video-search-tool__header-decoration">
            <div class="video-search-tool__header-circle"></div>
            <div class="video-search-tool__header-circle"></div>
            <div class="video-search-tool__header-circle"></div>
          </div>
        </div>
      </div>

      <!-- 搜索区域 -->
      <el-card class="video-search-tool__search-card" shadow="hover">
        <template #header>
          <div class="video-search-tool__card-header" @click="toggleSearchPanel">
            <IconifyIconOnline icon="ri:search-line" class="video-search-tool__card-icon" />
            <span>搜索选项</span>
            <div class="video-search-tool__card-toggle">
              <IconifyIconOnline :icon="isSearchPanelCollapsed ? 'ri:arrow-down-s-line' : 'ri:arrow-up-s-line'" />
            </div>
          </div>
        </template>

        <div class="video-search-tool__search-container" :class="{ 'is-collapsed': isSearchPanelCollapsed }">
          <div class="video-search-tool__search-input-container">
            <el-input v-model="env.keyword" placeholder="输入视频关键词搜索..." class="video-search-tool__search-input" clearable>
              <template #prefix>
                <IconifyIconOnline icon="ri:search-line" class="video-search-tool__search-icon" />
              </template>
              <template #append>
                <el-button :icon="useRenderIcon('ep:search')" type="primary" @click="searchVideo" :loading="env.loading"> </el-button>
              </template>
            </el-input>
          </div>

          <div class="video-search-tool__collapsible-content" :class="{ 'is-collapsed': isSearchPanelCollapsed }">
            <!-- 视频类型选择 -->
            <div class="video-search-tool__types">
              <div class="video-search-tool__types-label">视频类型:</div>
              <div class="video-search-tool__types-list">
                <el-button
                  v-for="type in env.types"
                  :key="type.id"
                  :type="env.selectedType === type.id ? 'primary' : 'default'"
                  size="small"
                  class="video-search-tool__type-btn"
                  @click="
                    env.selectedType = type.id;
                    form.selectedType = type.id;
                    if (env.keyword) searchVideo();
                  "
                >
                  <IconifyIconOnline :icon="type.icon" class="video-search-tool__type-icon" :style="{ color: env.selectedType === type.id ? '#ffffff' : type.color }" />
                  <span>{{ type.name }}</span>
                </el-button>
              </div>
            </div>

            <!-- 平台选择 -->
            <div class="video-search-tool__platforms">
              <div class="video-search-tool__platforms-label">搜索平台:</div>
              <div class="video-search-tool__platforms-list">
                <el-button v-for="platform in env.platforms" :key="platform.id" size="small" class="video-search-tool__platform-btn" @click="platform.id === 'all' ? searchVideo() : openSearchPlatform(platform.id)">
                  <IconifyIconOnline :icon="platform.icon" class="video-search-tool__platform-icon" :style="{ color: platform.color }" />
                  <span>{{ platform.name }}</span>
                </el-button>
              </div>
            </div>

            <!-- 历史记录和热门搜索 -->
            <div class="video-search-tool__search-helpers" v-if="env.showHistory">
              <!-- 历史记录 -->
              <div class="video-search-tool__history" v-if="env.history.length > 0">
                <div class="video-search-tool__history-header">
                  <div class="video-search-tool__history-title">
                    <IconifyIconOnline icon="ri:history-line" class="video-search-tool__history-icon" />
                    <span>搜索历史</span>
                  </div>
                  <el-button type="danger" link size="small" @click="clearHistory">
                    <IconifyIconOnline icon="ri:delete-bin-line" />
                    <span>清空</span>
                  </el-button>
                </div>
                <div class="video-search-tool__history-items">
                  <el-tag v-for="(item, index) in env.history" :key="index" class="video-search-tool__history-item" @click="selectFromHistory(item)" :effect="env.keyword === item ? 'dark' : 'plain'">
                    {{ item }}
                  </el-tag>
                </div>
              </div>

              <!-- 热门搜索 -->
              <div class="video-search-tool__popular">
                <div class="video-search-tool__popular-title">
                  <IconifyIconOnline icon="ri:fire-line" class="video-search-tool__popular-icon" />
                  <span>热门搜索</span>
                </div>
                <div class="video-search-tool__popular-items">
                  <el-tag v-for="(item, index) in env.popularKeywords" :key="index" class="video-search-tool__popular-item" @click="usePopularKeyword(item)" :effect="env.keyword === item ? 'dark' : 'plain'" type="success">
                    {{ item }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 搜索结果 -->
      <el-card class="video-search-tool__results-card" shadow="hover">
        <template #header>
          <div class="video-search-tool__card-header">
            <IconifyIconOnline icon="ri:video-line" class="video-search-tool__card-icon" />
            <span>搜索结果 (共 {{ env.totalResults }} 个)</span>
          </div>
        </template>

        <!-- 使用 ScTable 替代原来的结果列表 -->
        <ScTable ref="tableRef" :row-size="6" :url="fetchVideoSearch" height="500px" :data-loaded="handleDataLoad" layout="card">
          <template #default="{ row }">
            <div class="video-card">
              <!-- 缩略图作为整个卡片的背景 -->
              <div class="video-card__thumbnail-wrapper">
                <img :src="row.monitorVideoThumbnail" :alt="row.monitorVideoTitle" class="video-card__thumbnail" />

                <!-- 渐变遮罩层，使文字更易读 -->
                <div class="video-card__overlay"></div>

                <!-- 视频时长和平台标签 -->
                <div class="video-card__duration">{{ row.monitorVideoDuration }}</div>
                <div class="video-card__platform">
                  <el-tag size="small" effect="dark" type="primary">{{ row.monitorVideoPlatform }}</el-tag>
                </div>

                <!-- 播放按钮 -->
                <div class="video-card__play-btn" @click.stop="openVideoLink(row.monitorVideoUrl)">
                  <IconifyIconOnline icon="ri:play-circle-fill" class="video-card__play-icon" />
                </div>

                <!-- 视频信息叠加在图片上 -->
                <div class="video-card__content">
                  <div class="video-card__title" :title="row.monitorVideoTitle">{{ row.monitorVideoTitle }}</div>

                  <div class="video-card__info">
                    <div class="video-card__type">
                      <el-tag size="small" effect="plain" type="info">{{ row.monitorVideoType }}</el-tag>
                    </div>

                    <div class="video-card__meta">
                      <div class="video-card__views">
                        <IconifyIconOnline icon="ri:eye-line" class="video-card__info-icon" />
                        <span>{{ formatNumber(row.monitorVideoViews) }}</span>
                      </div>

                      <div class="video-card__date">
                        <IconifyIconOnline icon="ri:time-line" class="video-card__info-icon" />
                        <span>{{ row.monitorVideoPublishDate }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </ScTable>
      </el-card>

      <!-- 空状态和使用说明部分保持不变 -->
    </div>
  </div>
</template>

<style lang="scss" scoped>
.video-search-tool {
  &__card-header {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    user-select: none;

    &:hover {
      color: var(--el-color-primary);
    }
  }

  &__card-toggle {
    margin-left: auto;
    transition: transform 0.3s;
  }

  &__search-container {
    transition: max-height 0.5s ease;
    overflow: hidden;

    &.is-collapsed {
      max-height: 70px;
    }
  }

  &__collapsible-content {
    transition:
      opacity 0.3s,
      transform 0.3s;
    transform-origin: top;

    &.is-collapsed {
      opacity: 0;
      transform: scaleY(0);
      height: 0;
      overflow: hidden;
    }
  }
  /* 内容区域样式 */
  &__content {
    border-radius: 12px;
  }

  /* 头部样式 */
  &__header-container {
    margin-bottom: 20px;
  }

  &__header {
    background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
    border-radius: 12px;
    padding: 30px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(var(--el-color-primary-rgb), 0.3);
    display: flex;
    justify-content: space-between;
    align-items: center;

    &-inner {
      position: relative;
      z-index: 2;
    }

    &-title {
      font-size: 28px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 8px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    &-subtitle {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.9);
    }

    &-decoration {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    &-circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);

      &:nth-child(1) {
        width: 200px;
        height: 200px;
        top: -100px;
        right: -50px;
        animation: float 15s infinite ease-in-out;
      }

      &:nth-child(2) {
        width: 150px;
        height: 150px;
        bottom: -50px;
        left: -30px;
        animation: float 12s infinite ease-in-out reverse;
      }

      &:nth-child(3) {
        width: 100px;
        height: 100px;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        animation: pulse 8s infinite ease-in-out;
      }
    }
  }

  /* 卡片样式 */
  &__search-card,
  &__results-card,
  &__tips-card {
    margin-bottom: 20px;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1);
    }
  }

  &__card-header {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
  }

  &__card-icon {
    margin-right: 8px;
    font-size: 20px;
    color: var(--el-color-primary);
  }

  /* 搜索区域样式 */
  &__search-container {
    padding: 10px 0;
  }

  &__search-input-container {
    margin-bottom: 15px;
  }

  &__search-input {
    width: 100%;
  }

  &__search-icon {
    color: var(--el-color-primary);
    font-size: 18px;
  }

  /* 视频类型样式 */
  &__types {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    flex-wrap: wrap;
  }

  &__types-label {
    font-weight: 600;
    margin-right: 10px;
    margin-bottom: 8px;
  }

  &__types-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__type-btn {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }

  &__type-icon {
    margin-right: 5px;
    font-size: 16px;
  }

  /* 平台样式 */
  &__platforms {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    flex-wrap: wrap;
  }

  &__platforms-label {
    font-weight: 600;
    margin-right: 10px;
    margin-bottom: 8px;
  }

  &__platforms-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__platform-btn {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }

  &__platform-icon {
    margin-right: 5px;
    font-size: 16px;
  }

  /* 历史记录和热门搜索 */
  &__search-helpers {
    margin-top: 15px;
    border-top: 1px dashed var(--el-border-color-lighter);
    padding-top: 15px;
  }

  &__history,
  &__popular {
    margin-bottom: 15px;
  }

  &__history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  &__history-title,
  &__popular-title {
    display: flex;
    align-items: center;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  &__history-icon,
  &__popular-icon {
    margin-right: 5px;
    font-size: 16px;
    color: var(--el-color-info);
  }

  &__history-items,
  &__popular-items {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__history-item,
  &__popular-item {
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-2px);
    }
  }

  /* 表格样式 */
  &__table-thumbnail {
    position: relative;
    width: 160px;
    height: 90px;
    border-radius: 4px;
    overflow: hidden;
  }

  &__table-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__table-duration {
    position: absolute;
    bottom: 5px;
    right: 5px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 2px 4px;
    border-radius: 2px;
    font-size: 12px;
  }

  &__table-title {
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

/* 动画效果 */
@keyframes pulse {
  0%,
  100% {
    transform: scale(1) translate(-50%, -50%);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1) translate(-45%, -45%);
    opacity: 1;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(10deg);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .video-search-tool {
    &__ip-value {
      font-size: 24px;
    }

    &__engines-list {
      flex-wrap: wrap;
    }

    &__result-col {
      width: 100%;
    }
  }
}

/* 卡片布局样式 */
.video-search-tool {
  /* ... 现有样式保持不变 ... */

  /* 视频卡片样式 */
  .video-card {
    display: flex;
    flex-direction: column;
    border-radius: 8px;
    overflow: hidden;
    background-color: var(--el-bg-color);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    height: 100%;
    position: relative;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);

      .video-card__play-btn {
        opacity: 1;
      }

      .video-card__thumbnail {
        transform: scale(1.05);
      }

      .video-card__overlay {
        background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0.3) 100%);
      }

      .video-card__content {
        opacity: 1;
      }
    }

    &__thumbnail-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 280px;
      overflow: hidden;
    }

    &__thumbnail {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }

    &__overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 60%, rgba(0, 0, 0, 0.2) 100%);
      transition: all 0.3s ease;
    }

    &__duration {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 2;
    }

    &__platform {
      position: absolute;
      top: 8px;
      left: 8px;
      z-index: 2;
    }

    &__play-btn {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: rgba(0, 0, 0, 0.2);
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 3;
      cursor: pointer;
    }

    &__play-icon {
      font-size: 48px;
      color: white;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }

    &__content {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      padding: 16px;
      z-index: 4;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: opacity 0.3s ease;
    }

    &__title {
      font-size: 16px;
      font-weight: 500;
      line-height: 1.4;
      color: white;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    }

    &__info {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.9);
    }

    &__meta {
      display: flex;
      gap: 12px;
      margin-top: 4px;
    }

    &__info-icon {
      margin-right: 4px;
      vertical-align: middle;
    }

    &__views,
    &__date {
      display: flex;
      align-items: center;
      color: rgba(255, 255, 255, 0.8);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    }

    &__actions {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }
  }
}
</style>
