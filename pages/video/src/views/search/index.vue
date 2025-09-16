<template>
  <div class="video-search">
    <!-- Logo区域 -->
    <div class="logo-section">
      <div class="logo">
        <IconifyIconOnline icon="ep:video-play" class="logo-icon" />
        <span class="logo-text">视频搜索</span>
      </div>
    </div>

    <!-- 搜索区域 -->
    <div class="search-section">
      <div class="search-container">
        <!-- 分类选择器 -->
        <div class="category-selector">
           <el-select v-model="searchForm.videoType" placeholder="分类" size="large" class="category-select">
            <el-option label="全部" value="" />
            <el-option label="电影" value="movie" />
            <el-option label="电视剧" value="tv" />
            <el-option label="动漫" value="anime" />
            <el-option label="综艺" value="variety" />
            <el-option label="纪录片" value="documentary" />
          </el-select>
        </div>

        <!-- 搜索输入框 -->
        <div class="search-input-container">
          <el-input v-model="searchForm.keyword" placeholder="搜索视频、演员、导演..." size="large" class="search-input" @keyup.enter="handleSearch" @focus="showSuggestions = true" @blur="hideSuggestions" @input="handleInputChange">
            <template #suffix>
              <el-button type="primary" @click="handleSearch" :loading="searching" class="search-btn">
                <IconifyIconOnline icon="ep:search" />
              </el-button>
            </template>
          </el-input>

          <!-- 搜索建议下拉 -->
          <div class="suggestions-dropdown" v-if="showSuggestions && suggestions.length > 0">
            <div v-for="suggestion in suggestions" :key="suggestion" class="suggestion-item" @mousedown="selectSuggestion(suggestion)">
              <IconifyIconOnline icon="ep:search" class="suggestion-icon" />
              {{ suggestion }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 热门搜索 -->
    <div class="hot-section">
      <div class="hot-keywords">
        <div class="hot-title">热门搜索</div>
        <div class="hot-list">
          <span v-for="(keyword, index) in hotKeywords" :key="keyword.keywordId" :class="['hot-item', { 'hot-top': index < 3 }]" @click="selectKeyword(keyword.keywordContent)">
            {{ keyword.keywordContent }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { getHotKeywords, getSearchSuggestions } from "../../api/search";
import type { VideoKeyword } from "../../api/types";

/**
 * 视频搜索主页面 - 简洁版
 * @author CH
 * @version 2.0.0
 * @since 2024-12-19
 */

const router = useRouter();

// 搜索表单
const searchForm = reactive({
  keyword: "",
  videoType: "all",
});

// 页面状态
const searching = ref(false);
const showSuggestions = ref(false);

// 数据
const suggestions = ref<string[]>([]);
const hotKeywords = ref<VideoKeyword[]>([]);

/**
 * 隐藏搜索建议
 */
const hideSuggestions = () => {
  // 延迟隐藏，确保点击事件能够触发
  setTimeout(() => {
    showSuggestions.value = false;
  }, 200);
};

/**
 * 处理搜索
 */
const handleSearch = async () => {
  if (!searchForm.keyword.trim()) {
    ElMessage.warning("请输入搜索关键词");
    return;
  }

  searching.value = true;

  try {
    // 跳转到搜索结果页
    router.push({
      path: "/video/search/result",
      query: {
        keyword: searchForm.keyword,
        videoType: searchForm.videoType,
      },
    });
  } catch (error) {
    console.error("搜索失败:", error);
    ElMessage.error("搜索失败，请重试");
  } finally {
    searching.value = false;
  }
};

/**
 * 处理输入变化
 */
const handleInputChange = async (value: string) => {
  if (!value.trim()) {
    suggestions.value = [];
    showSuggestions.value = false;
    return;
  }

  try {
    const result = await getSearchSuggestions(value);
    suggestions.value = result.data || [];
    showSuggestions.value = suggestions.value.length > 0;
  } catch (error) {
    console.error("获取搜索建议失败:", error);
  }
};

/**
 * 选择搜索建议
 */
const selectSuggestion = (suggestion: string) => {
  searchForm.keyword = suggestion;
  showSuggestions.value = false;
  handleSearch();
};

/**
 * 选择热门关键词
 */
const selectKeyword = (keyword: string) => {
  searchForm.keyword = keyword;
  handleSearch();
};

/**
 * 处理搜索框聚焦
 */
const handleFocus = () => {
  if (suggestions.value.length > 0) {
    showSuggestions.value = true;
  }
};

/**
 * 加载热门关键词
 */
const loadHotKeywords = async () => {
  try {
    const response = await getHotKeywords(10);
    if (response.code === 1000) {
      hotKeywords.value = response.data;
    }
  } catch (error) {
    console.error("获取热门关键词失败:", error);
  }
};

// 组件挂载时初始化
onMounted(() => {
  loadHotKeywords();
});
</script>

<style scoped>
.video-search {
  min-height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.logo-section {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 10px;
}

.logo-icon {
  font-size: 3rem;
  color: #4285f4;
}

.logo-text {
  font-size: 3rem;
  font-weight: 300;
  color: #4285f4;
  letter-spacing: -1px;
}

.search-section {
  width: 100%;
  max-width: 584px;
  position: relative;
}

.search-container {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 30px;
}

.category-selector {
  flex-shrink: 0;
}

.category-select {
  width: 120px;
}

.category-select :deep(.el-input__wrapper) {
  border-radius: 24px;
  border: 1px solid #dfe1e5;
  box-shadow: none;
  transition: box-shadow 0.2s;
}

.category-select :deep(.el-input__wrapper:hover) {
  box-shadow: 0 2px 5px 1px rgba(64, 60, 67, 0.16);
}

.category-select :deep(.el-input__wrapper.is-focus) {
  border-color: transparent;
  box-shadow: 0 2px 5px 1px rgba(64, 60, 67, 0.16);
}

.search-input-container {
  flex: 1;
  position: relative;
}

.search-input {
  width: 100%;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 24px;
  border: 1px solid #dfe1e5;
  box-shadow: none;
  transition: box-shadow 0.2s;
  padding: 0 16px;
}

.search-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 2px 5px 1px rgba(64, 60, 67, 0.16);
}

.search-input :deep(.el-input__wrapper.is-focus) {
  border-color: transparent;
  box-shadow: 0 2px 5px 1px rgba(64, 60, 67, 0.16);
}

.search-input :deep(.el-input__inner) {
  font-size: 16px;
  height: 44px;
  border: none;
  outline: none;
}

.search-btn {
  background: transparent;
  border: none;
  color: #9aa0a6;
  padding: 8px;
}

.search-btn:hover {
  color: #4285f4;
  background: transparent;
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #dfe1e5;
  border-radius: 0 0 24px 24px;
  box-shadow: 0 2px 5px 1px rgba(64, 60, 67, 0.16);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
  margin-top: -1px;
}

.suggestion-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 16px;
  color: #3c4043;
  display: flex;
  align-items: center;
  gap: 12px;
}

.suggestion-item:hover {
  background-color: #f8f9fa;
}

.suggestion-icon {
  color: #9aa0a6;
  font-size: 14px;
}

.hot-section {
  margin-top: 30px;
  text-align: center;
  width: 100%;
  max-width: 584px;
}

.hot-keywords {
  width: 100%;
}

.hot-title {
  color: #70757a;
  font-size: 14px;
  margin-bottom: 16px;
}

.hot-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.hot-item {
  padding: 6px 12px;
  background: #f8f9fa;
  border: 1px solid #f0f0f0;
  border-radius: 16px;
  color: #3c4043;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.hot-item:hover {
  background: #e8f0fe;
  border-color: #4285f4;
  color: #1a73e8;
}

.hot-item.hot-top {
  background: #fef7e0;
  border-color: #fbbc04;
  color: #ea8600;
}

.hot-item.hot-top:hover {
  background: #fdd663;
}

@media (max-width: 768px) {
  .video-search {
    padding: 16px;
  }

  .logo-text {
    font-size: 2.5rem;
  }

  .logo-icon {
    font-size: 2.5rem;
  }

  .search-section {
    max-width: 90%;
  }

  .search-container {
    flex-direction: column;
    gap: 12px;
  }

  .category-selector {
    width: 100%;
  }

  .category-select {
    width: 100%;
  }

  .search-input :deep(.el-input__inner) {
    height: 40px;
    font-size: 14px;
  }

  .hot-list {
    gap: 6px;
  }

  .hot-item {
    font-size: 13px;
    padding: 5px 10px;
  }
}
</style>
