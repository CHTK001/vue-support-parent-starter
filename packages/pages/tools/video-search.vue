<script setup>
import { reactive, ref, onMounted, computed, shallowRef } from "vue";
import { message } from "@repo/utils";
import { useI18n } from "vue-i18n";
import { fetchVideoSearch, fetchVideoTypes, fetchVideoPlatforms, fetchHotKeywords } from "./video/api";
import { videoTypes, videoPlatforms, videoHotKeywords } from "./video/api/mockData";
import VideoHeader from "./video/components/VideoHeader.vue";
import VideoSearchPanel from "./video/components/VideoSearchPanel.vue";
import VideoResults from "./video/components/VideoResults.vue";

// 国际化
const { t } = useI18n();

// 防抖定时器
let debounceTimer = null;

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
  types: videoTypes,
  platforms: videoPlatforms,
  popularKeywords: videoHotKeywords,
});

// 表单和表格引用
const form = reactive({});
const tableRef = shallowRef();

/**
 * 搜索视频
 */
const searchVideo = async () => {
  if (!env.keyword.trim()) {
    message(t("message.emptyKeyword") || "请输入搜索关键词", { type: "warning" });
    return;
  }
  form.keyword = env.keyword.trim();
  form.selectedType = env.selectedType;
  env.loading = true;

  try {
    const res = await fetchVideoSearch({
      keyword: env.keyword.trim(),
      selectedType: env.selectedType,
      page: env.currentPage,
      pageSize: env.pageSize,
    });

    if (res.success) {
      env.searchResults = res.data.data;
      env.totalResults = res.data.total;

      // 添加到历史记录
      addToHistory(env.keyword);
    }
  } catch (error) {
    console.error("搜索视频失败:", error);
    message("搜索视频失败，请稍后重试", { type: "error" });
  } finally {
    env.loading = false;
  }
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
  if (!env.keyword.trim()) {
    message(t("message.emptyKeyword") || "请输入搜索关键词", { type: "warning" });
    return;
  }

  const platform = env.platforms.find((p) => p.videoId === platformId);
  if (platform && platform.videoUrl) {
    const url = platform.videoUrl.replace("{{keyword}}", encodeURIComponent(env.keyword));
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
  searchVideo();
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: "smooth" });
};

/**
 * 获取视频类型列表
 */
const getVideoTypes = async () => {
  try {
    const res = await fetchVideoTypes();
    if (res.success) {
      env.types = res.data || [];
    }
  } catch (error) {
    console.error("获取视频类型失败:", error);
  }
};

/**
 * 获取热门搜索关键词
 */
const getHotKeywords = async () => {
  try {
    const res = await fetchHotKeywords();
    if (res.success) {
      env.popularKeywords = res.data || [];
    }
  } catch (error) {
    console.error("获取热门关键词失败:", error);
  }
};

/**
 * 获取视频平台列表
 */
const getVideoPlatforms = async () => {
  try {
    const res = await fetchVideoPlatforms();
    if (res.success) {
      env.platforms = res.data || [];
    }
  } catch (error) {
    console.error("获取视频平台失败:", error);
  }
};

// 生命周期钩子
onMounted(async () => {
  // 从本地存储加载历史记录
  const savedHistory = localStorage.getItem("video-search-history");
  if (savedHistory) {
    try {
      env.history = JSON.parse(savedHistory);
    } catch (error) {
      console.error("解析历史记录失败:", error);
    }
  }

  // 获取视频类型、平台和热门关键词
  await Promise.all([getVideoTypes(), getVideoPlatforms(), getHotKeywords()]);
});
</script>

<template>
  <div class="video-search-container">
    <!-- 头部 -->
    <VideoHeader title="视频搜索工具" subtitle="一站式搜索各大视频平台内容" />

    <!-- 搜索面板 -->
    <VideoSearchPanel :env="env" :searchVideo="searchVideo" :selectFromHistory="selectFromHistory" :clearHistory="clearHistory" :usePopularKeyword="usePopularKeyword" :openSearchPlatform="openSearchPlatform" v-model:keyword="env.keyword" v-model:selectedType="env.selectedType" />

    <!-- 搜索结果 -->
    <VideoResults :videos="env.searchResults" :loading="env.loading" :keyword="env.keyword" :totalResults="env.totalResults" :currentPage="env.currentPage" :pageSize="env.pageSize" :formatNumber="formatNumber" :openVideoLink="openVideoLink" :changePage="changePage" />
  </div>
</template>

<style lang="scss" scoped>
.video-search-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}
</style>
