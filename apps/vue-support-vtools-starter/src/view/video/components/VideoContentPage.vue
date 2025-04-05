<template>
  <div class="video-content">
    <!-- 导航组件 -->
    <VideoNavigation v-model="selectedCategory" @search="handleNavSearch" @category-change="handleCategoryChange" @home-click="handleHomeClick" />

    <!-- 分类内容区域 -->
    <div v-if="!showSearchResults" class="video-content__category-container">
      <keep-alive>
        <component :is="currentCategoryComponent" ref="tableRef" />
      </keep-alive>
    </div>
  </div>
</template>

<script setup lang="ts">
import VideoNavigation from "@/view/video/components/VideoNavigation.vue";
import { videoCategories } from "@/view/video/data/categories";
import { computed, defineAsyncComponent, onMounted, ref, shallowRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
// 动态导入分类页面组件
const MovieCategory = defineAsyncComponent(() => import("@/view/video/categories/MovieCategory.vue"));
const TVCategory = defineAsyncComponent(() => import("@/view/video/categories/TVCategory.vue"));
const AnimeCategory = defineAsyncComponent(() => import("@/view/video/categories/AnimeCategory.vue"));
const DocumentaryCategory = defineAsyncComponent(() => import("@/view/video/categories/DocumentaryCategory.vue"));
const DefaultCategory = defineAsyncComponent(() => import("@/view/video/categories/DefaultCategory.vue"));

// 定义组件属性
const props = defineProps<{
  initialKeyword?: string;
  initialCategory?: string;
}>();

// 定义组件事件
const emit = defineEmits<{
  (e: "home-click"): void;
}>();

const router = useRouter();
const route = useRoute();
const tableRef = ref(null);
const componentRef = ref(null);

// 搜索相关
const searchKeyword = ref(props.initialKeyword || "");
const showSearchResults = ref(!!props.initialKeyword);

// 分类和筛选条件
const selectedCategory = ref(props.initialCategory || "");
const filterConditions = ref({
  types: ["全部"],
  years: ["全部"],
  districts: ["全部"],
  languages: ["全部"],
});

// 排序方式
const sortBy = ref("newest");

// 总结果计数
const totalResults = ref(0);

// 当前分类组件
const currentCategoryComponent = shallowRef(MovieCategory);

/**
 * 处理首页点击事件
 * 转发给父组件
 */
const handleHomeClick = () => {
  // 直接转发事件到父组件
  emit("home-click");
};

/**
 * 根据分类值获取对应组件
 * @param categoryValue 分类值
 */
const getCategoryComponent = (categoryValue: string) => {
  switch (categoryValue) {
    case "MV":
      return MovieCategory;
    case "TV":
      return TVCategory;
    case "AC":
      return AnimeCategory;
    case "纪录片":
      return DocumentaryCategory;
    default:
      return DefaultCategory;
  }
};

/**
 * 处理分类变化
 * @param category 分类值
 */
const handleCategoryChange = (category: string) => {
  selectedCategory.value = category;
  currentCategoryComponent.value = getCategoryComponent(category);
  showSearchResults.value = false;

  // 更新路由
  router.push({
    path: "/video/search",
    query: {
      type: category,
    },
  });
};

/**
 * 计算查询参数
 */
const queryParams = computed(() => {
  const params: Record<string, any> = {
    keyword: searchKeyword.value,
    category: selectedCategory.value || "",
    sortBy: sortBy.value,
  };

  // 添加筛选条件
  if (!filterConditions.value.types.includes("全部")) {
    params.types = filterConditions.value.types.join(",");
  }

  if (!filterConditions.value.years.includes("全部")) {
    params.years = filterConditions.value.years.join(",");
  }

  if (!filterConditions.value.districts.includes("全部")) {
    params.districts = filterConditions.value.districts.join(",");
  }

  if (!filterConditions.value.languages.includes("全部")) {
    params.languages = filterConditions.value.languages.join(",");
  }

  return params;
});

/**
 * 处理数据加载完成事件
 * @param data ScTable返回的数据
 */
const handleDataLoaded = (data) => {
  if (data && data.total !== undefined) {
    totalResults.value = data.total;
  } else {
    totalResults.value = 0;
  }
};

/**
 * 格式化播放次数
 * @param views 播放次数
 * @returns 格式化后的字符串
 */
const formatViews = (views: number) => {
  if (views >= 10000) {
    return (views / 10000).toFixed(1) + "万";
  }
  return views.toString();
};

/**
 * 处理导航组件搜索
 * @param keyword 搜索关键词
 */
const handleNavSearch = (keyword: string) => {
  searchKeyword.value = keyword;
  showSearchResults.value = true;

  // 更新路由
  router.push({
    path: "/video/search",
    query: {
      keyword: searchKeyword.value,
    },
  });

  // 刷新表格数据
  if (tableRef.value) {
    tableRef.value.refresh();
  }
};

/**
 * 处理筛选条件变化
 */
const handleFilterChange = () => {
  // 刷新表格数据
  if (tableRef.value) {
    tableRef.value.refresh();
  }
};

/**
 * 处理排序方式变化
 */
const handleSortChange = () => {
  // 刷新表格数据
  if (tableRef.value) {
    tableRef.value.refresh();
  }
};

/**
 * 处理视频点击
 * @param video 视频数据
 */
const handleVideoClick = (video: any) => {
  router.push({
    path: `/video/detail/${video.videoId}`,
  });
};

// 初始化首选类别
const initDefaultCategory = () => {
  if (!selectedCategory.value && videoCategories.length > 0) {
    // 找到第一个非全部的分类
    const firstCategory = videoCategories.find((item) => item.value !== null);
    if (firstCategory) {
      selectedCategory.value = firstCategory.value;
      currentCategoryComponent.value = getCategoryComponent(firstCategory.value);
    }
  }
};

// 监听路由变化
watch(
  () => route.query,
  (query) => {
    if (query.keyword) {
      searchKeyword.value = query.keyword as string;
      showSearchResults.value = true;

      // 刷新表格数据
      if (tableRef.value) {
        tableRef.value.refresh();
      }
    } else if (query.type) {
      // 处理分类导航
      const categoryType = query.type as string;
      selectedCategory.value = categoryType;
      currentCategoryComponent.value = getCategoryComponent(categoryType);
      showSearchResults.value = false;
    }
  },
  { immediate: true, deep: true }
);

// 监听props变化
watch(
  () => props.initialKeyword,
  (newValue) => {
    if (newValue) {
      searchKeyword.value = newValue;
      showSearchResults.value = true;

      if (tableRef.value) {
        tableRef.value.refresh();
      }
    }
  }
);

watch(
  () => props.initialCategory,
  (newValue) => {
    if (newValue) {
      selectedCategory.value = newValue;
      currentCategoryComponent.value = getCategoryComponent(newValue);
      showSearchResults.value = false;
    }
  }
);

// 初始化
onMounted(() => {
  // 如果没有指定分类，初始化默认分类
  if (!selectedCategory.value) {
    initDefaultCategory();
  }

  // 如果有搜索关键词，刷新表格
  if (searchKeyword.value && showSearchResults.value && tableRef.value) {
    tableRef.value.refresh();
  }
});
</script>

<style lang="scss" scoped>
.video-content {
  width: 100%;

  &__category-container {
    margin-top: 12px;
  }

  &__result-container {
    background-color: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  &__count {
    font-size: 15px;
    color: var(--el-text-color-regular);

    &-num {
      color: var(--el-color-danger);
      font-weight: 700;
      font-size: 18px;
    }
  }

  &__card {
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    cursor: pointer;
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    height: 100%;
    display: flex;
    flex-direction: column;

    &:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);

      .video-content__cover img {
        transform: scale(1.1);
      }
    }
  }

  &__cover {
    position: relative;
    height: 0;
    padding-bottom: 140%; /* 海报比例 */
    overflow: hidden;

    img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
  }

  &__rating {
    position: absolute;
    top: 10px;
    right: 10px;
    background-color: rgba(0, 0, 0, 0.7);
    color: #f7ba2a;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 700;
    backdrop-filter: blur(4px);
    z-index: 2;
  }

  &__views {
    position: absolute;
    bottom: 10px;
    right: 10px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 13px;
    backdrop-filter: blur(4px);
  }

  &__info {
    padding: 14px;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }

  &__name {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--el-text-color-primary);
  }

  &__meta {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin-bottom: 8px;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: auto;

    .el-tag {
      font-size: 11px;
      padding: 0 6px;
      height: 22px;
      border-radius: 4px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .video-content {
    padding: 16px;

    &__result-container {
      padding: 16px;
    }

    &__header {
      flex-direction: column;
      align-items: flex-start;

      .video-content__sort {
        margin-top: 10px;
        width: 100%;
        overflow-x: auto;
      }
    }
  }
}
</style>
