<template>
  <div class="remaining-component-page">
    <!-- 加载中状态 -->
    <CoolLoading v-if="isLoading" loading-text="页面加载中..." :show-progress="true" />

    <!-- 组件加载成功 -->
    <component :is="dynamicComponent" v-else-if="dynamicComponent && !isLoading" />

    <!-- 组件加载失败 - 404页面 -->
    <div v-else-if="!isLoading && loadError" class="error-404">
      <NoFound />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
// @ts-ignore
import noExist from "@repo/assets/status/404.svg?component";
import { CoolLoading } from "@repo/pages";
/**
 * 组件页面
 * @author CH
 * @version 1.0.0
 * @since 2024-01-20
 */

const route = useRoute();
const router = useRouter();

// 获取路由参数中的组件路径
const componentPath = computed(() => {
  return route.params.componentPath as string;
});

// 动态组件引用
const dynamicComponent = ref(null);

// 加载状态
const isLoading = ref(false);

// 加载错误状态
const loadError = ref(false);

/**
 * 动态加载组件
 */
const loadComponent = async () => {
  try {
    // 开始加载，重置状态
    isLoading.value = true;
    loadError.value = false;
    dynamicComponent.value = null;

    if (!componentPath.value) {
      console.error("组件路径参数缺失");
      loadError.value = true;
      return;
    }

    // 根据路径参数加载对应的组件
    if (componentPath.value === "video-search") {
      const { VideoSearch } = await import("@pages/video");
      dynamicComponent.value = VideoSearch;
    } else if (componentPath.value === "video-search-result") {
      const { VideoSearchResult } = await import("@pages/video");
      dynamicComponent.value = VideoSearchResult;
    } else if (componentPath.value === "video-manage") {
      const { VideoManage } = await import("@pages/video");
      dynamicComponent.value = VideoManage;
    } else {
      // 尝试通用路径加载
      const actualPath = convertPathToComponentPath(componentPath.value);
      const componentModule = await import(/* @vite-ignore */ actualPath);
      dynamicComponent.value = componentModule.default || componentModule;
    }

    // 检查组件是否成功加载
    if (!dynamicComponent.value) {
      loadError.value = true;
    }
  } catch (error) {
    console.error("加载组件失败:", error);
    loadError.value = true;
    dynamicComponent.value = null;
  } finally {
    // 加载完成，无论成功还是失败
    isLoading.value = false;
  }
};

/**
 * 将路径参数转换为实际的组件路径
 * @param path 路径参数
 * @returns 组件路径
 */
const convertPathToComponentPath = (path: string): string => {
  // 根据实际的组件路径规则进行转换
  const pathMap: Record<string, string> = {
    "video-search": "@pages/video",
    "video-search-result": "@pages/video",
    "video-manage": "@pages/video",
    // 可以继续添加更多映射
  };

  return pathMap[path] || `@/views/${path.replace(/-/g, "/")}/index.vue`;
};

/**
 * 返回上一页
 */
const goBack = () => {
  router.back();
};

// 组件挂载时加载动态组件
onMounted(() => {
  loadComponent();
});
</script>

<style scoped>
.remaining-component-page {
  width: 100%;
  height: 100%;
}


</style>
