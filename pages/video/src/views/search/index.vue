<template>
  <div class="video-search-container">
    <!-- 搜索首页 -->
    <div class="search-home">
      <div class="search-title">视频搜索</div>
      <div class="search-box">
        <el-input v-model="searchKeyword" placeholder="请输入视频名称、演员、导演等关键词" class="search-input" clearable @keyup.enter="handleSearch">
          <template #prefix>
            <IconifyIconOnline icon="ep:search" />
          </template>
        </el-input>
        <el-button type="primary" class="search-button" @click="handleSearch">
          <IconifyIconOnline icon="ep:search" />
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
  </div>
</template>

<script setup lang="ts">
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { getConfig } from "@repo/config";
import { getRandomString } from "@repo/utils";
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { generateYearOptions, hotSearchKeywords, movieTypes, videoCategories } from "../../data/categories";
import { districtOptions, languageOptions } from "../../data/videoOptions";

// Element-Plus图标是全局参数，不需要导入

const router = useRouter();
const route = useRoute();
const config = getConfig();
const ossAddress = getRandomString(config.OssAddress);

// 搜索相关
const searchKeyword = ref("");
const showResults = ref(false);

// 分类和筛选
const categories = ref(videoCategories);
const types = ref(movieTypes);
const years = ref(generateYearOptions());
const districts = ref([{ label: "全部", value: null, active: true }, ...districtOptions.map((item) => ({ ...item, active: false }))]);
const languages = ref([{ label: "全部", value: null, active: true }, ...languageOptions.map((item) => ({ ...item, active: false }))]);

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
const selectedCategory = ref(null);
const selectedType = ref(null);
const selectedYear = ref(null);
const selectedDistricts = ref<string[]>([null]);
const selectedLanguages = ref<string[]>([null]);

// 排序方式
const sortBy = ref("recommend");

// ScTable 相关
const tableRef = ref();
const loading = ref(false);
const totalResults = ref(0);

// 统一构造 ScTable 请求参数
const searchParams = computed(() => ({
  videoName: searchKeyword.value || undefined,
  videoTypes: selectedCategory.value || undefined,
  videoSubtypes: selectedType.value || undefined,
  videoYear: selectedYear.value || undefined,
  videoDistrict: selectedDistricts.value?.includes(null as any) ? undefined : selectedDistricts.value?.join(","),
  videoLanguage: selectedLanguages.value?.includes(null as any) ? undefined : selectedLanguages.value?.join(","),
  sortBy: sortBy.value,
  order: sortBy.value,
}));

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
  tableRef.value?.refresh?.();
};

// 处理类型点击
const handleTypeClick = (type: any) => {
  types.value.forEach((item) => {
    item.active = item.value === type.value;
  });
  selectedType.value = type.value;
  tableRef.value?.refresh?.();
};

// 处理年代点击
const handleYearClick = (year: any) => {
  years.value.forEach((item) => {
    item.active = item.value === year.value;
  });
  selectedYear.value = year.value;
  tableRef.value?.refresh?.();
};

// 处理地区点击（多选）
const handleDistrictClick = (district: any) => {
  if (district.value === null) {
    selectedDistricts.value = [null as any];
    districts.value.forEach((item) => {
      item.active = item.value === null;
    });
  } else {
    const allIndex = selectedDistricts.value.indexOf(null as any);
    if (allIndex !== -1) {
      selectedDistricts.value.splice(allIndex, 1);
      districts.value.find((item) => item.value === null)!.active = false;
    }
    const index = selectedDistricts.value.indexOf(district.value);
    if (index === -1) {
      selectedDistricts.value.push(district.value);
    } else {
      selectedDistricts.value.splice(index, 1);
      if (selectedDistricts.value.length === 0) {
        selectedDistricts.value = [null as any];
        districts.value.find((item) => item.value === null)!.active = true;
      }
    }
  }
  tableRef.value?.refresh?.();
};

// 处理语言点击（多选）
const handleLanguageClick = (language: any) => {
  if (language.value === null) {
    selectedLanguages.value = [null as any];
    languages.value.forEach((item) => {
      item.active = item.value === null;
    });
  } else {
    const allIndex = selectedLanguages.value.indexOf(null as any);
    if (allIndex !== -1) {
      selectedLanguages.value.splice(allIndex, 1);
      languages.value.find((item) => item.value === null)!.active = false;
    }
    const index = selectedLanguages.value.indexOf(language.value);
    if (index === -1) {
      selectedLanguages.value.push(language.value);
    } else {
      selectedLanguages.value.splice(index, 1);
      if (selectedLanguages.value.length === 0) {
        selectedLanguages.value = [null as any];
        languages.value.find((item) => item.value === null)!.active = true;
      }
    }
  }
  tableRef.value?.refresh?.();
};

// 热门标签点击
const handleHotTagClick = (keyword: string) => {
  searchKeyword.value = keyword;
  handleSearch();
};

// 搜索
const handleSearch = () => {
  if (!searchKeyword.value.trim() && !showResults.value) {
    return;
  }
  showResults.value = true;
  // 交由 ScTable 控制分页与加载
  tableRef.value?.refresh?.();
  const fullUrl = `${window.location.origin}/?keyword=${searchKeyword.value}#/remaining-component/video-search-result`;
  window.open(fullUrl, "_blank");
};

// 数据加载回调（ScTable 标准事件）
const handleDataLoaded = (data: any, total: number) => {
  if (typeof total === "number") totalResults.value = total;
};

// 生成兼容的图片OSS地址
const createCompatibleImageUrl = (videoCover: string, videoPlatform: string) => {
  if (!videoCover) return null as any;
  return ossAddress + `/video/${videoCover.replace("cover", "cover/" + videoPlatform)}`;
};

// 点击视频卡片
const handleVideoClick = (video: any) => {
  router.push(`/video/manage/detail?id=${video.videoId}`);
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
