<template>
  <div class="system-container modern-bg">
    <div class="search-container">
      <!-- Logo -->
      <div class="logo-section">
        <IconifyIconOnline icon="ri:search-line" class="logo-icon" />
        <h1 class="logo">影视搜索</h1>
        <p class="logo-desc">搜索您想看的影视内容</p>
      </div>

      <!-- 搜索框 -->
      <div class="search-box">
        <div class="search-input-wrapper">
          <IconifyIconOnline icon="ep:search" class="search-icon" />
          <input
            v-model="searchKeyword"
            type="text"
            class="search-input"
            placeholder="输入影视名称、演员或导演"
            @keyup.enter="handleSearch"
          />
        </div>
        <ScButton type="primary" class="search-btn" @click="handleSearch">
          <IconifyIconOnline icon="ep:search" />
          搜索
        </ScButton>
      </div>

      <!-- 热词 -->
      <div class="hot-words">
        <span class="hot-words-label">
          <IconifyIconOnline icon="ep:hot-water" />
          热门搜索：
        </span>
        <span
          v-for="item in hotSearchKeywords.slice(0, 6)"
          :key="item.value"
          class="hot-word"
          @click="handleHotTagClick(item.value)"
        >
          {{ item.label }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getConfig } from "@repo/config";
import { getRandomString } from "@repo/utils";
import { computed, nextTick, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  generateYearOptions,
  hotSearchKeywords,
  movieTypes,
  videoCategories,
} from "../../data/categories";
import { districtOptions, languageOptions } from "../../data/videoOptions";

// Element-Plus图标是全局参数，不需要导入

const router = useRouter();
const route = useRoute();
const config = getConfig();
const ossAddress = getRandomString(config.OssAddress);

// 搜索相关
const searchKeyword = ref("");
const showResults = ref(false);

// 当前选中的分类
const activeCategory = ref("all");

// 分类数据
const categories = [
  { id: "all", name: "全部", icon: "ri:apps-line" },
  { id: "movie", name: "电影", icon: "ri:film-line" },
  { id: "tv", name: "电视剧", icon: "ri:tv-2-line" },
  { id: "variety", name: "综艺", icon: "ri:star-smile-line" },
  { id: "anime", name: "动漫", icon: "ri:ghost-smile-line" },
  { id: "doc", name: "纪录片", icon: "ri:vidicon-line" },
];

// 获取排名样式
const getRankClass = (index: number) => {
  if (index === 0) return "rank-1";
  if (index === 1) return "rank-2";
  if (index === 2) return "rank-3";
  return "";
};

// 处理分类选择
const handleCategorySelect = (cat: { id: string; name: string }) => {
  activeCategory.value = cat.id;
  if (cat.id !== "all") {
    searchKeyword.value = cat.name;
    handleSearch();
  }
};

// 原分类数据
const videoCategories2 = ref(videoCategories);
const types = ref(movieTypes);
const years = ref(generateYearOptions());
const districts = ref([
  { label: "全部", value: null, active: true },
  ...districtOptions.map((item) => ({ ...item, active: false })),
]);
const languages = ref([
  { label: "全部", value: null, active: true },
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
  videoDistrict: selectedDistricts.value?.includes(null as any)
    ? undefined
    : selectedDistricts.value?.join(","),
  videoLanguage: selectedLanguages.value?.includes(null as any)
    ? undefined
    : selectedLanguages.value?.join(","),
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

// 处理分类点击（旧版本，保留兼容）
const handleCategoryClick = (category: any) => {
  videoCategories2.value.forEach((item) => {
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
const handleSearch = async () => {
  if (!searchKeyword.value.trim() && !showResults.value) {
    return;
  }
  showResults.value = true;
  await nextTick();
  // 交由 ScTable 控制分页与加载
  tableRef.value?.refresh?.();

  // 跳转到搜索结果页面，传递搜索关键词
  //VideoDetailResult
  const fullUrl = `${window.location.origin}/#/remaining-component/video-search-result?keyword=${searchKeyword.value.trim()}`;
  window.open(fullUrl, "_blank");
};

// 数据加载回调（ScTable 标准事件）
const handleDataLoaded = (data: any, total: number) => {
  if (typeof total === "number") totalResults.value = total;
};

// 生成兼容的图片OSS地址
const createCompatibleImageUrl = (
  videoCover: string,
  videoPlatform: string
) => {
  if (!videoCover) return null as any;
  return (
    ossAddress +
    `/video/${videoCover.replace("cover", "cover/" + videoPlatform)}`
  );
};

// 点击视频卡片
const handleVideoClick = (video: any) => {
  router.push(`/video/manage/detail?id=${video.videoId}`);
};
</script>

<style scoped lang="scss">
.search-container {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
  padding: 60px 20px;
  min-height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.logo-section {
  margin-bottom: 40px;
}

.logo-icon {
  font-size: 64px;
  color: var(--el-color-primary);
  margin-bottom: 16px;
  display: block;
}

.logo {
  font-size: 42px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 12px 0;
  letter-spacing: 2px;
}

.logo-desc {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  margin: 0;
}

.search-box {
  display: flex;
  gap: 12px;
  width: 100%;
  max-width: 700px;
  margin: 0 auto 32px;
  background: var(--el-bg-color-overlay);
  padding: 8px;
  border-radius: 50px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.search-box:focus-within {
  box-shadow: 0 6px 30px rgba(var(--el-color-primary-rgb), 0.2);
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
}

.search-icon {
  font-size: 20px;
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  height: 48px;
  border: none;
  outline: none;
  font-size: 16px;
  color: var(--el-text-color-primary);
  background: transparent;
}

.search-input::placeholder {
  color: var(--el-text-color-placeholder);
}

.search-btn {
  height: 48px;
  padding: 0 32px;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
}

.hot-words {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.hot-words-label {
  font-size: 14px;
  color: var(--el-text-color-regular);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.hot-word {
  font-size: 13px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  padding: 6px 16px;
  border-radius: 20px;
  transition: all 0.3s ease;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  font-weight: 500;
}

.hot-word:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  background: rgba(var(--el-color-primary-rgb), 0.1);
}

@media (max-width: 640px) {
  .search-container {
    padding: 40px 16px;
  }

  .logo-icon {
    font-size: 48px;
  }

  .logo {
    font-size: 32px;
  }

  .search-box {
    flex-direction: column;
    border-radius: 16px;
    padding: 12px;
  }

  .search-input-wrapper {
    padding: 0 12px;
  }

  .search-btn {
    width: 100%;
    justify-content: center;
  }

  .hot-words {
    gap: 8px;
  }
}
</style>
