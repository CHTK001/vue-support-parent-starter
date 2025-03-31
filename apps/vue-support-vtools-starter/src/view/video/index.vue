<script setup>
import { defineAsyncComponent, provide, ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { createDefaultVideoStore } from "./config/videoData";
// 异步加载子组件
const SearchComponent = defineAsyncComponent(() => import("./components/SearchComponent.vue"));
const ResultsComponent = defineAsyncComponent(() => import("./components/ResultsComponent.vue"));

const searchBoxMinimized = ref(false);
const router = useRouter();
const route = useRoute();

// 当前活动页面
const activePage = ref("search"); // 'search' 或 'results'

// 创建视频存储状态
const videoStore = createDefaultVideoStore();

// 提供视频存储状态给子组件
provide("videoStore", videoStore);

// 监听路由变化
onMounted(() => {
  // 根据当前路由设置活动页面
  if (route.name === "VideoSearchResults") {
    activePage.value = "results";
  } else {
    activePage.value = "search";
  }

  // 如果有查询参数，应用到过滤条件
  if (route.query.keyword) {
    videoStore.filters.keyword = route.query.keyword;
  }
  if (route.query.category) {
    videoStore.filters.category = route.query.category.split(",");
  }
  if (route.query.year) {
    videoStore.filters.year = route.query.year.split(",");
  }
  if (route.query.region) {
    videoStore.filters.region = route.query.region.split(",");
  }
  if (route.query.language) {
    videoStore.filters.language = route.query.language.split(",");
  }
  if (route.query.sort) {
    videoStore.filters.sort = route.query.sort;
  }

  // 如果在结果页面，执行搜索
  if (activePage.value === "results" && videoStore.searchResults.length === 0) {
    videoStore.search();
  }
});

// 切换页面
const switchPage = (page) => {
  activePage.value = page;
  if (page === "search") {
    router.push({ name: "VideoSearchHome" });
  } else {
    router.push({ name: "VideoSearchResults" });
  }
};
</script>

<template>
  <div class="video-container">
    <!-- 搜索页 -->
    <SearchComponent
      @minimize="searchBoxMinimized = true"
      @search="
        () => {
          videoStore.search();
          searchBoxMinimized = true;
          activePage = 'results';
        }
      "
    />

    <!-- 结果页 -->
    <ResultsComponent v-if="searchBoxMinimized" @back-to-search="switchPage('search')" />
  </div>
</template>

<style lang="scss" scoped>
.video-container {
  min-height: 100vh;
  background: transparent;
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
