<template>
  <div class="video-search-results">
    <!-- 筛选条件 -->
    <div class="filter-container">
      <!-- 类型筛选 -->
      <div class="filter-row">
        <div class="filter-label">
          <el-icon><Film /></el-icon>
          类型:
        </div>
        <div class="filter-options">
          <div v-for="type in displayedTypes" :key="type.value" :class="['filter-option', { active: selectedTypes.includes(type.value) }]" @click="handleTypeClick(type)">
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
          <div v-for="year in displayedYears" :key="year.value" :class="['filter-option', { active: selectedYears.includes(year.value) }]" @click="handleYearClick(year)">
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
    <div class="results-container flex-1">
      <div class="results-header">
        <div class="results-count">
          共找到 <span class="count">{{ totalResults }}</span> 个结果
        </div>
        <div class="results-controls">
          <div class="display-mode">
            <el-radio-group v-model="displayMode" size="small">
              <el-radio-button label="default">默认</el-radio-button>
              <el-radio-button label="large">大图</el-radio-button>
            </el-radio-group>
          </div>
          <div class="results-sort">
            <el-select v-model="sortBy" class="!w-[200px]">
              <el-option @change="handleSortChange" :value="item.value" :label="item.label" v-for="item in VideoOrderByOptions">{{ item.label }}</el-option>
            </el-select>
          </div>
        </div>
      </div>

      <!-- 使用 ScTable 渲染卡片结果，替换原 video-grid + 分页 -->
      <ScTable ref="tableRef" layout="card" :page-size="12" :col-size="6" :url="getVideoList" :params="searchParams" row-key="videoId" v-loading="loading" @data-loaded="handleDataLoaded" @row-click="handleRowClick">
        <template #default="{ row }">
          <div class="video-card" :class="{ 'video-card-large': displayMode === 'large' }">
            <div class="video-cover !w-full">
              <el-image referrerpolicy="no-referrer" v-if="row.videoCover" :src="(row.videoCover || '').split(',')[0]" fit="cover">
                <template #error>
                  <img :src="placeholderImage" alt="no-cover" />
                </template>
              </el-image>
              <div v-else class="video-cover-placeholder">暂无封面</div>

              <!-- 大图模式下的信息覆盖层 -->
              <div v-if="displayMode === 'large'" class="video-overlay">
                <div class="video-rating" v-if="row.videoScore">{{ row.videoScore }}分</div>
                <div class="video-views" v-if="row.videoViews">{{ formatViews(row.videoViews) }}次播放</div>
                <div class="video-info-overlay">
                  <div class="video-name-overlay">{{ row.videoTitle || row.videoName }}</div>
                  <div class="video-meta-overlay">
                    <span v-if="row.videoYear">{{ row.videoYear }}年</span>
                    <span v-if="row.videoDistrict"> · {{ row.videoDistrict }}</span>
                    <span v-if="row.videoLanguage"> · {{ row.videoLanguage }}</span>
                  </div>
                  <div class="video-tags-overlay" v-if="row.videoType">
                    <el-tag v-for="(tag, index) in (row.videoType || '')?.split(',')" :key="index" size="small">
                      {{ tag }}
                    </el-tag>
                  </div>
                </div>
              </div>

              <!-- 默认模式下的评分和播放次数 -->
              <template v-else>
                <div class="video-rating" v-if="row.videoScore">{{ row.videoScore }}分</div>
                <div class="video-views" v-if="row.videoViews">{{ formatViews(row.videoViews) }}次播放</div>
              </template>
            </div>

            <!-- 默认模式下的信息区域 -->
            <div v-if="displayMode === 'default'" class="video-info">
              <div class="video-name">{{ row.videoTitle || row.videoName }}</div>
              <div class="video-meta">
                <span v-if="row.videoYear">{{ row.videoYear }}年</span>
                <span v-if="row.videoDistrict"> · {{ row.videoDistrict }}</span>
                <span v-if="row.videoLanguage"> · {{ row.videoLanguage }}</span>
              </div>
              <div class="video-tags" v-if="row.videoType">
                <el-tag v-for="(tag, index) in (row.videoType || '')?.split(',')" :key="index" size="small">
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </div>
        </template>
      </ScTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import ScTable from "@repo/components/ScTable/index.vue";
import { computed, defineExpose, nextTick, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getVideoList } from "../../api/video";
import { placeholderImage, VideoOrderByOptions } from "../../data";
import { generateYearOptions, movieTypes, videoCategories } from "../../data/categories";
import { districtOptions, languageOptions } from "../../data/videoOptions";
const props = defineProps({
  keyword: {
    type: String,
    default: "",
  },
  category: {
    type: String,
    default: "",
  },
});

const router = useRouter();
const route = useRoute();

// 搜索相关
const searchKeyword = ref(props.keyword);

// 分类和筛选
const categories = ref(videoCategories);
const types = ref(movieTypes);
const years = ref(generateYearOptions());
const districts = ref([...districtOptions.map((item) => ({ ...item, active: false }))]);
const languages = ref([...languageOptions.map((item) => ({ ...item, active: false }))]);

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

// 已选择的筛选条件（导航菜单是单选，其他筛选条件是多选）
const selectedCategories = ref<string>(props.category); // 改为单选，保存单个值
const selectedTypes = ref<string[]>(["ALL"]); // 多选
const selectedYears = ref<string[]>(["ALL"]); // 多选
const selectedDistricts = ref<string[]>(["ALL"]); // 多选
const selectedLanguages = ref<string[]>(["ALL"]); // 多选

// 显示模式
const displayMode = ref("default");

// 排序方式
const sortBy = ref("vote_count.desc");

// 分页相关（保留原状态以兼容旧逻辑，但不再用于渲染）

// ScTable 相关
const tableRef = ref();
const loading = ref(false);

// 统一构造 ScTable 请求参数
const searchParams = computed(() => {
  const params = {
    category: selectedCategories.value || undefined,
    keyword: searchKeyword.value || undefined,
    videoName: searchKeyword.value || undefined,
    videoSubtypes: selectedTypes.value?.includes("ALL") ? undefined : selectedTypes.value?.join(","),
    years: selectedYears.value?.includes("ALL") ? undefined : selectedYears.value?.join(","),
    districts: selectedDistricts.value?.includes("ALL") ? undefined : selectedDistricts.value?.join(","),
    languages: selectedLanguages.value?.includes("ALL") ? undefined : selectedLanguages.value?.join(","),
    sortBy: sortBy.value,
    order: sortBy.value,
  };
  // 调试信息：打印当前参数
  console.log("searchParams updated:", params);
  console.log("selectedTypes:", selectedTypes.value);
  console.log("selectedYears:", selectedYears.value);
  return params;
});

const handleSearch = async () => {
  tableRef.value?.refresh?.();
};
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

// 处理单选的方法（专门用于导航菜单）
const handleSingleSelect = async (item, selectedItem, allValue = "all") => {
  selectedItem.value = item.value;
  // 等待响应式数据更新完成后再刷新表格
  await nextTick();
  tableRef.value?.refresh?.();
};

// 处理多选通用方法
const handleMultiSelect = async (item, selectedItems, allValue = null) => {
  if (item.value === allValue) {
    selectedItems.value = [allValue];
  } else {
    const allIndex = selectedItems.value.indexOf(allValue);
    if (allIndex !== -1) {
      selectedItems.value.splice(allIndex, 1);
    }
    const index = selectedItems.value.indexOf(item.value);
    if (index === -1) {
      selectedItems.value.push(item.value);
    } else {
      selectedItems.value.splice(index, 1);
      if (selectedItems.value.length === 0) {
        selectedItems.value = [allValue];
      }
    }
  }
  // 等待响应式数据更新完成后再刷新表格
  await nextTick();
  tableRef.value?.refresh?.();
};

const handleSortChange = async () => {
  await nextTick();
  tableRef.value?.refresh?.();
};

const totalResults = ref(0);

// 数据加载回调（ScTable 标准事件）
const handleDataLoaded = (data: any, total: number) => {
  if (typeof total === "number") {
    totalResults.value = total;
  }
};

const handleRowClick = async (row, index, event) => {
  //VideoDetailResult
  router.push({
    name: "VideoDetailResult",
    query: {
      id: row.videoId,
    },
  });
};

// 处理分类点击（单选）
const handleCategoryClick = (category) => {
  // 更新所有分类的活动状态
  categories.value.forEach((item) => {
    item.active = item.value === category.value;
  });
  handleSingleSelect(category, selectedCategories);
};

// 处理类型点击（多选）
const handleTypeClick = (type) => {
  handleMultiSelect(type, selectedTypes, "ALL");
};

// 处理年代点击（多选）
const handleYearClick = (year) => {
  handleMultiSelect(year, selectedYears, "ALL");
};

// 处理地区点击（多选）
const handleDistrictClick = (district) => {
  handleMultiSelect(district, selectedDistricts, "ALL");
};

// 处理语言点击（多选）
const handleLanguageClick = (language) => {
  handleMultiSelect(language, selectedLanguages, "ALL");
};

// 格式化播放次数
const formatViews = (views: number) => {
  if (!views) {
    return "";
  }
  if (views >= 10000) {
    return (views / 10000).toFixed(1) + "万";
  }
  return views.toString();
};

// 初始化
onMounted(() => {
  // 从路由获取搜索关键词
  const keyword = route.query.keyword as string;
  if (keyword) {
    searchKeyword.value = keyword;
  }
});

watch(
  () => props.category,
  (newCategory) => {
    if (newCategory) {
      selectedCategories.value = newCategory;
    }
  }
);

watch(
  () => props.keyword,
  (newKeyword) => {
    if (newKeyword) {
      searchKeyword.value = newKeyword;
    }
  }
);

defineExpose({
  handleSearch,
});
</script>

<style scoped lang="scss">
.video-search-results {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  padding-top: 20px;
  padding-bottom: 20px;
}

.search-header {
  margin-bottom: 20px;
}

.search-box {
  display: flex;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.search-input {
  flex: 1;
}

.search-input :deep(.el-input__wrapper) {
  height: 40px;
  border-radius: 20px 0 0 20px;
}

.search-button {
  height: 40px;
  border-radius: 0 20px 20px 0;
  padding: 0 20px;
}

.category-nav {
  display: flex;
  background-color: var(--el-bg-color);
  border-radius: 12px;
  padding: 12px 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  overflow-x: auto;
  position: sticky;
  top: 0;
  z-index: 10;
  flex-wrap: wrap;
  align-items: center;
}

.category-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  margin: 4px 8px 4px 0;
  font-size: 15px;
  cursor: pointer;
  white-space: nowrap;
  border-radius: 30px;
  transition: all 0.3s;
  gap: 6px;

  &:hover {
    color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
  }

  &.active {
    color: white;
    background-color: var(--el-color-primary);
    font-weight: 500;
    box-shadow: 0 3px 8px rgba(var(--el-color-primary-rgb), 0.25);
  }
}

.filter-container {
  background-color: white;
  border-radius: 8px;
  margin-bottom: 10px;
  padding: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.filter-row {
  display: flex;
  margin-bottom: 10px;
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
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.results-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.display-mode {
  display: flex;
  align-items: center;
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

/* 大图模式样式 */
.video-card-large {
  position: relative;
  min-height: 280px;

  .video-cover {
    height: 100%;
    min-height: 280px;
  }
}

.video-card-large .video-cover {
  height: 0;
  padding-bottom: 75%; /* 4:3 比例，更大的图片 */
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 50%, rgba(0, 0, 0, 0.8) 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.video-card-large:hover .video-overlay {
  opacity: 1;
}

.video-overlay .video-rating {
  position: static;
  align-self: flex-end;
  background-color: rgba(247, 186, 42, 0.9);
  color: white;
  margin-bottom: auto;
}

.video-overlay .video-views {
  position: static;
  align-self: flex-end;
  background-color: rgba(0, 0, 0, 0.8);
  margin-top: 8px;
}

.video-info-overlay {
  margin-top: auto;
}

.video-name-overlay {
  font-size: 18px;
  font-weight: bold;
  color: white;
  margin-bottom: 8px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-meta-overlay {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 8px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.video-tags-overlay {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.video-tags-overlay .el-tag {
  font-size: 11px;
  padding: 2px 6px;
  height: 22px;
  background-color: rgba(64, 158, 255, 0.9);
  border: none;
  color: white;
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding-top: 20px;
}
</style>
