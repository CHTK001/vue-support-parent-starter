<template>
  <div class="video-home">
    <!-- 搜索首页 -->
    <VideoSearchHome v-if="!showResults" @search="handleSearch" />

    <!-- 导航和内容页面 -->
    <VideoContentPage v-else :initial-keyword="searchKeyword" :initial-category="selectedCategory" @home-click="handleHomeClick" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import VideoSearchHome from "@/view/video/components/VideoSearchHome.vue";
import VideoContentPage from "@/view/video/components/VideoContentPage.vue";

const router = useRouter();
const route = useRoute();

// 搜索相关状态
const searchKeyword = ref("");
const selectedCategory = ref("");
const showResults = ref(false);

/**
 * 处理搜索事件
 * @param keyword 搜索关键词
 */
const handleSearch = (keyword: string) => {
  searchKeyword.value = keyword;
  showResults.value = true;

  router.push({
    path: "/video/search",
    query: {
      keyword,
    },
  });
};

/**
 * 处理首页点击事件
 * 显示VideoSearchHome页面
 */
const handleHomeClick = () => {
  // 立即切换到首页视图
  showResults.value = false;
  searchKeyword.value = "";
  selectedCategory.value = "";

  // 确保路由更新，防止路由事件触发前视图已经改变
  router.push({
    path: "/video",
    replace: true,
  });
};

/**
 * 初始化页面状态
 * 根据当前路由决定是否显示结果页面
 */
const initPageState = () => {
  const query = route.query;
  const path = route.path;

  // 判断是否为根路径且无查询参数（首页状态）
  const isHomePage = path === "/video" && !query.keyword && !query.type;

  if (isHomePage) {
    // 如果是视频首页且没有查询参数，显示VideoSearchHome
    showResults.value = false;
    searchKeyword.value = "";
    selectedCategory.value = "";
  } else if (query.keyword || query.type || path.includes("/video/category") || path.includes("/video/search")) {
    // 如果URL包含关键词或类型，或者路径是分类或搜索页，则显示结果页面
    if (query.keyword) {
      searchKeyword.value = query.keyword as string;
    }

    if (query.type) {
      selectedCategory.value = query.type as string;
    }

    showResults.value = true;
  }
};

// 页面加载时初始化状态
onMounted(() => {
  initPageState();
});

// 监听路由变化，用于处理页面刷新和导航
watch(
  () => route,
  () => {
    initPageState();
  },
  { deep: true }
);
</script>

<style lang="scss" scoped>
.video-home {
  width: 100%;
  min-height: 100vh;
  background-color: var(--el-fill-color-light);
}
</style>
