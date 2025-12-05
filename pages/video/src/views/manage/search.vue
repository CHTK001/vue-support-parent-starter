<template>
  <div class="search-content">
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-group">
        <span class="filter-label">类型</span>
        <span
          v-for="type in displayedTypes"
          :key="type.value"
          :class="[
            'filter-tag',
            { active: selectedTypes.includes(type.value) },
          ]"
          @click="handleTypeClick(type)"
        >
          {{ type.label }}
        </span>
      </div>
      <div class="filter-group">
        <span class="filter-label">年份</span>
        <span
          v-for="year in displayedYears"
          :key="year.value"
          :class="[
            'filter-tag',
            { active: selectedYears.includes(year.value) },
          ]"
          @click="handleYearClick(year)"
        >
          {{ year.label }}
        </span>
      </div>
      <div class="filter-group">
        <span class="filter-label">地区</span>
        <span
          v-for="district in displayedDistricts"
          :key="district.value"
          :class="[
            'filter-tag',
            { active: selectedDistricts.includes(district.value) },
          ]"
          @click="handleDistrictClick(district)"
        >
          {{ district.label }}
        </span>
      </div>
    </div>

    <!-- 结果头 -->
    <div class="result-header">
      <span class="result-count">共 {{ totalResults }} 部</span>
      <el-select
        v-model="sortBy"
        size="small"
        class="sort-select"
        @change="handleSortChange"
      >
        <el-option
          v-for="item in VideoOrderByOptions"
          :key="item.value"
          :value="item.value"
          :label="item.label"
        />
      </el-select>
    </div>

    <!-- 视频列表 -->
    <ScTable
      ref="tableRef"
      layout="card"
      :page-size="18"
      :col-size="6"
      :url="getVideoList"
      :params="searchParams"
      row-key="videoId"
      v-loading="loading"
      @data-loaded="handleDataLoaded"
      @row-click="handleRowClick"
      class="video-table"
    >
      <template #default="{ row }">
        <div class="video-card">
          <div class="poster">
            <el-image
              v-if="row.videoCover"
              :src="(row.videoCover || '').split(',')[0]"
              fit="cover"
              referrerpolicy="no-referrer"
            >
              <template #error>
                <div class="poster-error">暂无封面</div>
              </template>
            </el-image>
            <div v-else class="poster-error">暂无封面</div>
            <span v-if="row.videoScore" class="score">{{
              row.videoScore
            }}</span>
          </div>
          <div class="info">
            <h4 class="name">{{ row.videoTitle || row.videoName }}</h4>
            <p class="meta">
              <span v-if="row.videoYear">{{ row.videoYear }}</span>
              <span v-if="row.videoDistrict">{{ row.videoDistrict }}</span>
            </p>
          </div>
        </div>
      </template>
    </ScTable>
  </div>
</template>

<script setup lang="ts">
import ScTable from "@repo/components/ScTable/index.vue";
import { computed, defineExpose, nextTick, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getVideoList } from "../../api/video";
import { placeholderImage, VideoOrderByOptions } from "../../data";
import {
  generateYearOptions,
  movieTypes,
  videoCategories,
} from "../../data/categories";
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
const districts = ref([
  ...districtOptions.map((item) => ({ ...item, active: false })),
]);
const languages = ref([
  ...languageOptions.map((item) => ({ ...item, active: false })),
]);

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
const showMoreDistricts = computed(
  () => districts.value.length > MAX_DISPLAY_COUNT
);
const showMoreLanguages = computed(
  () => languages.value.length > MAX_DISPLAY_COUNT
);

// 计算显示的筛选条件
const displayedTypes = computed(() => {
  return showAllTypes.value
    ? types.value
    : types.value.slice(0, MAX_DISPLAY_COUNT);
});

const displayedYears = computed(() => {
  return showAllYears.value
    ? years.value
    : years.value.slice(0, MAX_DISPLAY_COUNT);
});

const displayedDistricts = computed(() => {
  return showAllDistricts.value
    ? districts.value
    : districts.value.slice(0, MAX_DISPLAY_COUNT);
});

const displayedLanguages = computed(() => {
  return showAllLanguages.value
    ? languages.value
    : languages.value.slice(0, MAX_DISPLAY_COUNT);
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
    videoSubtypes: selectedTypes.value?.includes("ALL")
      ? undefined
      : selectedTypes.value?.join(","),
    years: selectedYears.value?.includes("ALL")
      ? undefined
      : selectedYears.value?.join(","),
    districts: selectedDistricts.value?.includes("ALL")
      ? undefined
      : selectedDistricts.value?.join(","),
    languages: selectedLanguages.value?.includes("ALL")
      ? undefined
      : selectedLanguages.value?.join(","),
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
  const fullUrl = `${window.location.origin}/#/remaining-component/video-detail-result?id=${row.videoId}`;
  window.open(fullUrl, "_blank");
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

<style scoped>
.search-content {
  padding: 20px 24px;
}

/* 筛选栏 */
.filter-bar {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 16px;
}

.filter-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.filter-group:last-child {
  margin-bottom: 0;
}

.filter-label {
  font-size: 13px;
  color: #999;
  width: 40px;
  flex-shrink: 0;
}

.filter-tag {
  font-size: 13px;
  color: #666;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-tag:hover {
  color: #1890ff;
}

.filter-tag.active {
  color: #1890ff;
  background: rgba(24, 144, 255, 0.1);
}

/* 结果头 */
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.result-count {
  font-size: 13px;
  color: #999;
}

.sort-select {
  width: 140px;
}

/* 视频卡片 */
.video-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.video-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.poster {
  position: relative;
  width: 100%;
  padding-bottom: 140%;
  background: #f5f5f5;
  overflow: hidden;
}

.poster :deep(.el-image) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.poster :deep(.el-image img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poster-error {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
  font-size: 12px;
  background: #f5f5f5;
}

.score {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: #ffc107;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

.info {
  padding: 10px 12px;
}

.name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  font-size: 12px;
  color: #999;
  margin: 0;
  display: flex;
  gap: 8px;
}

/* ScTable 覆盖 */
:deep(.sc-table) {
  background: transparent;
}

:deep(.sc-table .el-pagination) {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
}

/* 响应式 */
@media (max-width: 768px) {
  .search-content {
    padding: 12px 16px;
  }

  .filter-bar {
    padding: 12px 16px;
  }

  .filter-label {
    width: 100%;
    margin-bottom: 4px;
  }
}
</style>
