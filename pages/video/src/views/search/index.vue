<template>
  <div class="video-search">
    <!-- 搜索头部 -->
    <div class="search-header">
      <div class="search-title">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">视频搜索</h1>
        <p class="text-gray-600 mb-8">搜索各大平台视频资源，支持多种搜索源</p>
      </div>
    </div>

    <!-- 搜索区域 -->
    <div class="search-container bg-white rounded-lg shadow-lg p-8 mb-8">
      <div class="search-form">
        <!-- 搜索框 -->
        <div class="search-input-group mb-6">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入视频名称、演员、导演等关键词"
            size="large"
            class="search-input"
            @keyup.enter="handleSearch"
            @input="handleInputChange"
          >
            <template #prepend>
              <el-select v-model="searchForm.source" placeholder="搜索源" style="width: 120px">
                <el-option label="全部" value="" />
                <el-option label="本地" value="local" />
                <el-option label="PanSou" value="pansou" />
                <el-option label="在线" value="online" />
              </el-select>
            </template>
            <template #append>
              <el-button type="primary" @click="handleSearch" :loading="searching">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
            </template>
          </el-input>
        </div>

        <!-- 高级搜索选项 -->
        <div class="advanced-search" v-show="showAdvanced">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <el-select v-model="searchForm.category" placeholder="分类" clearable>
              <el-option label="全部" value="" />
              <el-option label="电影" value="movie" />
              <el-option label="电视剧" value="tv" />
              <el-option label="综艺" value="variety" />
              <el-option label="动漫" value="anime" />
              <el-option label="纪录片" value="documentary" />
            </el-select>
            
            <el-select v-model="searchForm.year" placeholder="年份" clearable>
              <el-option label="全部" value="" />
              <el-option v-for="year in yearOptions" :key="year" :label="year" :value="year" />
            </el-select>
            
            <el-select v-model="searchForm.platform" placeholder="平台" clearable>
              <el-option label="全部" value="" />
              <el-option label="爱奇艺" value="iqiyi" />
              <el-option label="腾讯视频" value="tencent" />
              <el-option label="优酷" value="youku" />
              <el-option label="芒果TV" value="mgtv" />
              <el-option label="哔哩哔哩" value="bilibili" />
            </el-select>
          </div>
        </div>

        <!-- 搜索选项切换 -->
        <div class="search-options flex items-center justify-between">
          <el-button text @click="showAdvanced = !showAdvanced">
            <el-icon><Setting /></el-icon>
            {{ showAdvanced ? '收起高级搜索' : '展开高级搜索' }}
          </el-button>
          
          <div class="search-stats text-sm text-gray-500">
            今日搜索: {{ todaySearchCount }} 次
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索建议 -->
    <div class="search-suggestions" v-if="suggestions.length > 0">
      <div class="bg-white rounded-lg shadow p-4 mb-6">
        <h3 class="text-lg font-semibold mb-3">搜索建议</h3>
        <div class="flex flex-wrap gap-2">
          <el-tag
            v-for="suggestion in suggestions"
            :key="suggestion"
            class="cursor-pointer"
            @click="selectSuggestion(suggestion)"
          >
            {{ suggestion }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 热门关键词 -->
    <div class="hot-keywords bg-white rounded-lg shadow p-6 mb-6">
      <h3 class="text-lg font-semibold mb-4 flex items-center">
        <el-icon class="mr-2 text-red-500"><Star /></el-icon>
        热门搜索
      </h3>
      <div class="flex flex-wrap gap-2">
        <el-tag
          v-for="(keyword, index) in hotKeywords"
          :key="keyword.keywordId"
          :type="index < 3 ? 'danger' : index < 6 ? 'warning' : 'info'"
          class="cursor-pointer"
          @click="selectKeyword(keyword.keywordContent)"
        >
          {{ keyword.keywordContent }}
          <span class="ml-1 text-xs opacity-75">{{ keyword.keywordCount }}</span>
        </el-tag>
      </div>
    </div>

    <!-- 搜索历史 -->
    <div class="search-history bg-white rounded-lg shadow p-6" v-if="searchHistory.length > 0">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold flex items-center">
          <el-icon class="mr-2 text-blue-500"><Clock /></el-icon>
          搜索历史
        </h3>
        <el-button text type="danger" @click="clearHistory">
          <el-icon><Delete /></el-icon>
          清空
        </el-button>
      </div>
      <div class="flex flex-wrap gap-2">
        <el-tag
          v-for="history in searchHistory"
          :key="history"
          type="info"
          class="cursor-pointer"
          @click="selectHistory(history)"
          closable
          @close="removeHistory(history)"
        >
          {{ history }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Search, Setting, Star, Clock, Delete } from '@element-plus/icons-vue';
import { getHotKeywords, getSearchSuggestions, getSearchHistory, clearSearchHistory, recordSearchBehavior } from '../../api/search';
import type { VideoKeyword } from '../../api/types';

/**
 * 视频搜索主页面
 * @author CH
 * @version 1.0.0
 * @since 2024-12-19
 */

const router = useRouter();

// 搜索表单
const searchForm = reactive({
  keyword: '',
  source: '',
  category: '',
  year: '',
  platform: ''
});

// 页面状态
const searching = ref(false);
const showAdvanced = ref(false);
const todaySearchCount = ref(0);

// 数据
const suggestions = ref<string[]>([]);
const hotKeywords = ref<VideoKeyword[]>([]);
const searchHistory = ref<string[]>([]);

// 年份选项
const yearOptions = ref<number[]>([]);

/**
 * 初始化年份选项
 */
const initYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let i = currentYear; i >= 1990; i--) {
    years.push(i);
  }
  yearOptions.value = years;
};

/**
 * 处理搜索
 */
const handleSearch = async () => {
  if (!searchForm.keyword.trim()) {
    ElMessage.warning('请输入搜索关键词');
    return;
  }

  searching.value = true;
  
  try {
    // 记录搜索行为
    await recordSearchBehavior(searchForm.keyword, searchForm.source);
    
    // 添加到搜索历史
    addToHistory(searchForm.keyword);
    
    // 跳转到搜索结果页
    router.push({
      name: 'VideoSearchResult',
      query: {
        keyword: searchForm.keyword,
        source: searchForm.source,
        category: searchForm.category,
        year: searchForm.year,
        platform: searchForm.platform
      }
    });
  } catch (error) {
    console.error('搜索失败:', error);
    ElMessage.error('搜索失败，请稍后重试');
  } finally {
    searching.value = false;
  }
};

/**
 * 处理输入变化
 */
const handleInputChange = async (value: string) => {
  if (value.length >= 2) {
    try {
      const response = await getSearchSuggestions(value, 5);
      if (response.code === 1000) {
        suggestions.value = response.data;
      }
    } catch (error) {
      console.error('获取搜索建议失败:', error);
    }
  } else {
    suggestions.value = [];
  }
};

/**
 * 选择搜索建议
 */
const selectSuggestion = (suggestion: string) => {
  searchForm.keyword = suggestion;
  suggestions.value = [];
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
 * 选择搜索历史
 */
const selectHistory = (history: string) => {
  searchForm.keyword = history;
  handleSearch();
};

/**
 * 添加到搜索历史
 */
const addToHistory = (keyword: string) => {
  const history = searchHistory.value;
  const index = history.indexOf(keyword);
  
  if (index > -1) {
    history.splice(index, 1);
  }
  
  history.unshift(keyword);
  
  if (history.length > 10) {
    history.pop();
  }
  
  // 保存到本地存储
  localStorage.setItem('video-search-history', JSON.stringify(history));
};

/**
 * 移除搜索历史
 */
const removeHistory = (keyword: string) => {
  const index = searchHistory.value.indexOf(keyword);
  if (index > -1) {
    searchHistory.value.splice(index, 1);
    localStorage.setItem('video-search-history', JSON.stringify(searchHistory.value));
  }
};

/**
 * 清空搜索历史
 */
const clearHistory = async () => {
  try {
    await clearSearchHistory();
    searchHistory.value = [];
    localStorage.removeItem('video-search-history');
    ElMessage.success('搜索历史已清空');
  } catch (error) {
    console.error('清空搜索历史失败:', error);
    ElMessage.error('清空失败，请稍后重试');
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
    console.error('加载热门关键词失败:', error);
  }
};

/**
 * 加载搜索历史
 */
const loadSearchHistory = () => {
  const saved = localStorage.getItem('video-search-history');
  if (saved) {
    try {
      searchHistory.value = JSON.parse(saved);
    } catch (error) {
      console.error('解析搜索历史失败:', error);
    }
  }
};

/**
 * 加载统计数据
 */
const loadStats = () => {
  // TODO: 从API获取今日搜索次数
  todaySearchCount.value = 89;
};

// 监听关键词变化
watch(() => searchForm.keyword, (newValue) => {
  if (!newValue) {
    suggestions.value = [];
  }
});

// 组件挂载
onMounted(() => {
  initYearOptions();
  loadHotKeywords();
  loadSearchHistory();
  loadStats();
});
</script>

<style scoped>
.video-search {
  padding: 24px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.search-input {
  font-size: 16px;
}

.search-input :deep(.el-input__inner) {
  font-size: 16px;
  padding: 12px 16px;
}

.search-input :deep(.el-input-group__prepend) {
  background-color: #fff;
  border-color: #dcdfe6;
}

.search-input :deep(.el-input-group__append) {
  background-color: #409eff;
  border-color: #409eff;
}

.search-input :deep(.el-input-group__append .el-button) {
  background-color: transparent;
  border: none;
  color: white;
}

.el-tag {
  margin: 2px;
  transition: all 0.3s ease;
}

.el-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.advanced-search {
  border-top: 1px solid #ebeef5;
  padding-top: 16px;
  margin-top: 16px;
}

@media (max-width: 768px) {
  .video-search {
    padding: 16px;
  }
  
  .search-container {
    padding: 16px;
  }
}
</style>