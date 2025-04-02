<template>
  <div class="video-search-container">
    <!-- 搜索首页 -->
    <div v-if="!showResults" class="search-home">
      <div class="search-title">视频搜索</div>
      <div class="search-box">
        <el-input v-model="searchKeyword" placeholder="请输入视频名称、演员、导演等关键词" class="search-input" clearable @keyup.enter="handleSearch">
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" class="search-button" @click="handleSearch">
          <el-icon><Search /></el-icon>
        </el-button>
      </div>

      <!-- 热门搜索标签 -->
      <div class="hot-search">
        <div class="hot-search-title">
          <el-icon><HotWater /></el-icon>
          热门搜索:
        </div>
        <div class="hot-search-tags">
          <el-tag v-for="item in hotSearchKeywords" :key="item.value" class="hot-tag" @click="handleHotTagClick(item.value)">
            {{ item.label }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 搜索结果页 -->
    <div v-else class="search-results">
      <!-- 导航菜单 -->
      <div class="category-nav">
        <div v-for="category in videoCategories" :key="category.value" :class="['category-item', { active: category.active }]" @click="handleCategoryClick(category)">
          {{ category.label }}
        </div>
      </div>

      <!-- 筛选条件 -->
      <div class="filter-container">
        <!-- 类型筛选 -->
        <div class="filter-row">
          <div class="filter-label">
            <el-icon><Film /></el-icon>
            类型:
          </div>
          <div class="filter-options">
            <div v-for="type in displayedTypes" :key="type.value" :class="['filter-option', { active: type.active }]" @click="handleTypeClick(type)">
              {{ type.label }}
            </div>
            <div v-if="showMoreTypes" class="filter-option more" @click="toggleMoreTypes">
              {{ showAllTypes ? "收起" : "更多" }}
              <el-icon>
                <component :is="showAllTypes ? 'ArrowUp' : 'ArrowDown'" />
              </el-icon>
            </div>
          </div>
        </div>

        <!-- 年代筛选 -->
        <div class="filter-row">
          <div class="filter-label">
            <el-icon><Calendar /></el-icon>
            年代:
          </div>
          <div class="filter-options">
            <div v-for="year in displayedYears" :key="year.value" :class="['filter-option', { active: year.active }]" @click="handleYearClick(year)">
              {{ year.label }}
            </div>
            <div v-if="showMoreYears" class="filter-option more" @click="toggleMoreYears">
              {{ showAllYears ? "收起" : "更多" }}
              <el-icon>
                <component :is="showAllYears ? 'ArrowUp' : 'ArrowDown'" />
              </el-icon>
            </div>
          </div>
        </div>

        <!-- 地区筛选 -->
        <div class="filter-row">
          <div class="filter-label">
            <el-icon><Location /></el-icon>
            地区:
          </div>
          <div class="filter-options">
            <div v-for="district in displayedDistricts" :key="district.value" :class="['filter-option', { active: selectedDistricts.includes(district.value) }]" @click="handleDistrictClick(district)">
              {{ district.label }}
            </div>
            <div v-if="showMoreDistricts" class="filter-option more" @click="toggleMoreDistricts">
              {{ showAllDistricts ? "收起" : "更多" }}
              <el-icon>
                <component :is="showAllDistricts ? 'ArrowUp' : 'ArrowDown'" />
              </el-icon>
            </div>
          </div>
        </div>

        <!-- 语言筛选 -->
        <div class="filter-row">
          <div class="filter-label">
            <el-icon><ChatDotRound /></el-icon>
            语言:
          </div>
          <div class="filter-options">
            <div v-for="language in displayedLanguages" :key="language.value" :class="['filter-option', { active: selectedLanguages.includes(language.value) }]" @click="handleLanguageClick(language)">
              {{ language.label }}
            </div>
            <div v-if="showMoreLanguages" class="filter-option more" @click="toggleMoreLanguages">
              {{ showAllLanguages ? "收起" : "更多" }}
              <el-icon>
                <component :is="showAllLanguages ? 'ArrowUp' : 'ArrowDown'" />
              </el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 搜索结果 -->
      <div class="results-container">
        <div class="results-header">
          <div class="results-count">
            共找到 <span class="count">{{ totalResults }}</span> 个结果
          </div>
          <div class="results-sort">
            <el-radio-group v-model="sortBy" size="small">
              <el-radio-button label="recommend">推荐</el-radio-button>
              <el-radio-button label="newest">最新上线</el-radio-button>
              <el-radio-button label="popular">最多播放</el-radio-button>
              <el-radio-button label="rating">评分最高</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <div class="video-grid">
          <div v-for="video in videoResults" :key="video.videoId" class="video-card">
            <div class="video-cover">
              <img :src="video.videoCover || placeholderImage" :alt="video.videoName" />
              <div class="video-rating">{{ video.rating }}</div>
              <div class="video-views">{{ formatViews(video.views) }}次播放</div>
            </div>
            <div class="video-info">
              <div class="video-name">{{ video.videoName }}</div>
              <div class="video-meta">{{ video.year }} · {{ video.district }} · {{ video.language }}</div>
              <div class="video-tags">
                <el-tag v-for="(tag, index) in video.videoTags?.split(',')" :key="index" size="small">
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[12, 24, 36, 48]" layout="total, sizes, prev, pager, next, jumper" :total="totalResults" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { placeholderImage } from "@/view/video/data";
import { generateYearOptions, hotSearchKeywords, mockVideoResults, movieTypes, videoCategories } from "@/view/video/data/categories";
import { districtOptions, languageOptions } from "@/view/video/data/videoOptions";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { message } from "@repo/utils";

// Element-Plus图标是全局参数，不需要导入

const router = useRouter();
const route = useRoute();

// 搜索相关
const searchKeyword = ref("");
const showResults = ref(false);

// 分类和筛选
const categories = ref(videoCategories);
const types = ref(movieTypes);
const years = ref(generateYearOptions());
const districts = ref([{ label: "全部", value: "all", active: true }, ...districtOptions]);
const languages = ref([{ label: "全部", value: "all", active: true }, ...languageOptions]);

// 筛选条件显示控制
const showAllTypes = ref(false);
const showAllYears = ref(false);
const showAllDistricts = ref(false);
const showAllLanguages = ref(false);

// 筛选条件显示数量
const MAX_DISPLAY_COUNT = 12;

// 计算是否显示更多按钮
const showMoreTypes = computed(() => types.value.length > MAX_DISPLAY_COUNT);
const showMoreYears = computed(() => years.value.length > MAX_DISPLAY_COUNT);
const showMoreDistricts = computed(() => districts.value.length > MAX_DISPLAY_COUNT);
const showMoreLanguages = computed(() => languages.value.length > MAX_DISPLAY_COUNT);

// 计算显示的筛选条件
const displayedTypes = computed(() => {
  return showAllTypes.value ? types.value : types.value.slice(0, MAX_DISPLAY_COUNT);
});

const displayedYears = computed(() => {
  return showAllYears.value ? years.value : years.value.slice(0, MAX_DISPLAY_COUNT);
});

const displayedDistricts = computed(() => {
  return showAllDistricts.value ? districts.value : districts.value.slice(0, MAX_DISPLAY_COUNT);
});

const displayedLanguages = computed(() => {
  return showAllLanguages.value ? languages.value : languages.value.slice(0, MAX_DISPLAY_COUNT);
});

// 已选择的筛选条件
const selectedCategory = ref("all");
const selectedType = ref("all");
const selectedYear = ref("all");
const selectedDistricts = ref<string[]>(["all"]);
const selectedLanguages = ref<string[]>(["all"]);

// 排序方式
const sortBy = ref("recommend");

// 分页相关
const currentPage = ref(1);
const pageSize = ref(12);
const totalResults = ref(0);

// 搜索结果
const videoResults = ref<any[]>([]);

// 切换更多筛选条件显示
const toggleMoreTypes = () => {
  showAllTypes.value = !showAllTypes.value;
};

const toggleMoreYears = () => {
  showAllYears.value = !showAllYears.value;
};

const toggleMoreDistricts = () => {
  showAllDistricts.value = !showAllDistricts.value;
};

const toggleMoreLanguages = () => {
  showAllLanguages.value = !showAllLanguages.value;
};

// 处理分类点击
const handleCategoryClick = (category: any) => {
  categories.value.forEach((item) => {
    item.active = item.value === category.value;
  });
  selectedCategory.value = category.value;
  fetchVideoResults();
};

// 处理类型点击
const handleTypeClick = (type: any) => {
  types.value.forEach((item) => {
    item.active = item.value === type.value;
  });
  selectedType.value = type.value;
  fetchVideoResults();
};

// 处理年代点击
const handleYearClick = (year: any) => {
  years.value.forEach((item) => {
    item.active = item.value === year.value;
  });
  selectedYear.value = year.value;
  fetchVideoResults();
};

// 处理地区点击（多选）
const handleDistrictClick = (district: any) => {
  if (district.value === "all") {
    // 点击全部，清除其他选择
    selectedDistricts.value = ["all"];
    districts.value.forEach((item) => {
      item.active = item.value === "all";
    });
  } else {
    // 移除全部选项
    const allIndex = selectedDistricts.value.indexOf("all");
    if (allIndex !== -1) {
      selectedDistricts.value.splice(allIndex, 1);
      districts.value.find((item) => item.value === "all")!.active = false;
    }

    // 切换选中状态
    const index = selectedDistricts.value.indexOf(district.value);
    if (index === -1) {
      selectedDistricts.value.push(district.value);
    } else {
      selectedDistricts.value.splice(index, 1);
      // 如果没有选中任何项，则默认选中全部
      if (selectedDistricts.value.length === 0) {
        selectedDistricts.value = ["all"];
        districts.value.find((item) => item.value === "all")!.active = true;
      }
    }
  }
  fetchVideoResults();
};

// 处理语言点击（多选）
const handleLanguageClick = (language: any) => {
  if (language.value === "all") {
    // 点击全部，清除其他选择
    selectedLanguages.value = ["all"];
    languages.value.forEach((item) => {
      item.active = item.value === "all";
    });
  } else {
    // 移除全部选项
    const allIndex = selectedLanguages.value.indexOf("all");
    if (allIndex !== -1) {
      selectedLanguages.value.splice(allIndex, 1);
      languages.value.find((item) => item.value === "all")!.active = false;
    }

    // 切换选中状态
    const index = selectedLanguages.value.indexOf(language.value);
    if (index === -1) {
      selectedLanguages.value.push(language.value);
    } else {
      selectedLanguages.value.splice(index, 1);
      // 如果没有选中任何项，则默认选中全部
      if (selectedLanguages.value.length === 0) {
        selectedLanguages.value = ["all"];
        languages.value.find((item) => item.value === "all")!.active = true;
      }
    }
  }
  fetchVideoResults();
};

// 处理热门标签点击
const handleHotTagClick = (keyword: string) => {
  searchKeyword.value = keyword;
  handleSearch();
};

// 处理搜索
const handleSearch = () => {
  if (!searchKeyword.value.trim() && !showResults.value) {
    return;
  }

  showResults.value = true;
  currentPage.value = 1;
  fetchVideoResults();

  // 更新路由
  router.push({
    path: "/video/search/results",
    query: {
      keyword: searchKeyword.value,
    },
  });
};

// 处理分页大小变化
const handleSizeChange = (size: number) => {
  pageSize.value = size;
  fetchVideoResults();
};

// 处理页码变化
const handleCurrentChange = (page: number) => {
  currentPage.value = page;
  fetchVideoResults();
};

// 格式化播放次数
const formatViews = (views: number) => {
  if (views >= 10000) {
    return (views / 10000).toFixed(1) + "万";
  }
  return views.toString();
};

// 获取视频结果
const fetchVideoResults = async () => {
  try {
    // 实际项目中应该调用API获取数据
    // const params = {
    //   videoName: searchKeyword.value,
    //   videoType: selectedType.value !== 'all' ? selectedType.value : undefined,
    //   pageNum: currentPage.value,
    //   pageSize: pageSize.value,
    // };
    // const res = getVideoList(params);
    // videoResults.value = res.data;
    // totalResults.value = res.total;

    // 使用模拟数据
    setTimeout(() => {
      videoResults.value = mockVideoResults;
      totalResults.value = mockVideoResults.length;
    }, 300);
  } catch (error) {
    console.error("获取视频列表失败:", error);
  }
};
</script>

<style scoped>
.video-search-container {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* 搜索首页样式 */
.search-home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #e0f2ff 0%, #f0f9ff 100%);
}

.search-title {
  font-size: 48px;
  font-weight: bold;
  color: #4e6ef2;
  margin-bottom: 40px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-box {
  display: flex;
  width: 100%;
  max-width: 800px;
  margin-bottom: 30px;
}

.search-input {
  flex: 1;
}

.search-input :deep(.el-input__wrapper) {
  height: 56px;
  border-radius: 28px 0 0 28px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.search-button {
  height: 56px;
  border-radius: 0 28px 28px 0;
  padding: 0 30px;
  font-size: 18px;
}

.hot-search {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 800px;
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.hot-search-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
  color: #606266;
  margin-bottom: 15px;
}

.hot-search-title .el-icon {
  color: #f56c6c;
  margin-right: 8px;
}

.hot-search-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hot-tag {
  cursor: pointer;
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 20px;
  transition: all 0.3s;
}

.hot-tag:hover {
  background-color: #4e6ef2;
  color: white;
}

/* 搜索结果页样式 */
.search-results {
  padding: 20px;
}

.category-nav {
  display: flex;
  background-color: white;
  border-radius: 8px;
  padding: 15px 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
}

.category-item {
  padding: 8px 16px;
  margin-right: 10px;
  font-size: 16px;
  cursor: pointer;
  white-space: nowrap;
  border-radius: 20px;
  transition: all 0.3s;
}

.category-item:hover {
  color: #4e6ef2;
}

.category-item.active {
  background-color: #4e6ef2;
  color: white;
}

.filter-container {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.filter-row {
  display: flex;
  margin-bottom: 15px;
}

.filter-row:last-child {
  margin-bottom: 0;
}

.filter-label {
  display: flex;
  align-items: center;
  width: 80px;
  font-size: 14px;
  font-weight: bold;
  color: #606266;
}

.filter-label .el-icon {
  margin-right: 5px;
}

.filter-options {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-option {
  padding: 5px 12px;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-option:hover {
  color: #4e6ef2;
}

.filter-option.active {
  background-color: #ecf5ff;
  color: #4e6ef2;
}

.filter-option.more {
  color: #4e6ef2;
  display: flex;
  align-items: center;
}

.filter-option.more .el-icon {
  margin-left: 5px;
}

.results-container {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.results-count {
  font-size: 14px;
  color: #606266;
}

.results-count .count {
  color: #f56c6c;
  font-weight: bold;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.video-card {
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s;
  cursor: pointer;
}

.video-card:hover {
  transform: translateY(-5px);
}

.video-cover {
  position: relative;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 比例 */
  overflow: hidden;
}

.video-cover img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-rating {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #f7ba2a;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.video-views {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.video-info {
  padding: 10px;
}

.video-name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-meta {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.video-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.video-tags .el-tag {
  font-size: 10px;
  padding: 0 4px;
  height: 20px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding-top: 20px;
}
</style>
