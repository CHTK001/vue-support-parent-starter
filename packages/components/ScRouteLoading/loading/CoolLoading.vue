<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import DefaultLoading from "./DefaultLoading.vue";
import PixelLoading from "./PixelLoading.vue";
import DinoGameLoading from "./DinoGameLoading.vue";
import NeonLineLoading from "./NeonLineLoading.vue";
import SkeletonCardsLoading from "./SkeletonCardsLoading.vue";
import MarioLoading from "./MarioLoading.vue";
import BookFlipLoading from "./BookFlipLoading.vue";
import BookWritingLoading from "./BookWritingLoading.vue";
import BeaverClamLoading from "./BeaverClamLoading.vue";

/**
 * 炫酷加载组件（壳组件，根据类型或本地配置选择具体动画）
 */
interface Props {
  /** 加载文案 */
  loadingText?: string;
  /** 是否显示进度条 */
  showProgress?: boolean;
  /**
   * 动画类型：
   * - default：默认炫酷加载
   * - pixel：像素风加载
   * - dinoGame：恐龙小游戏加载
   * - neon：霓虹进度条加载
   * - skeleton：骨架卡片加载
   * - mario：马里奥采蘑菇
   * - book：翻书加载
   * - bookWrite：笔书写书加载
   * - beaver：河狸敲蛤蜊
   * 不传则读取本地 sys-loading-anim
   */
  type?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loadingText: "组件加载中...",
  showProgress: true,
  type: ""
});

// 使用 ref 来存储当前动画类型，以便响应 localStorage 变化
const localAnimType = ref<string>("");

const getLocalAnimType = () => {
  const localKey = localStorage.getItem("sys-loading-anim") || "default";
  // 兼容老的 dino 配置
  if (localKey === "dino") {
    return "dinoGame";
  }
  if (localKey === "neon") {
    return "neon";
  }
  if (localKey === "skeleton") {
    return "skeleton";
  }
  if (localKey === "book") {
    return "book";
  }
  if (localKey === "bookWrite") {
    return "bookWrite";
  }
  if (localKey === "beaver") {
    return "beaver";
  }
  return localKey;
};

// 初始化
localAnimType.value = getLocalAnimType();

// 监听 storage 事件，响应 localStorage 变化
const handleStorageChange = (e: StorageEvent) => {
  if (e.key === "sys-loading-anim") {
    localAnimType.value = getLocalAnimType();
  }
};

// 监听同窗口内的 localStorage 变化（通过自定义事件）
const handleLocalStorageChange = ((e: CustomEvent) => {
  if (e.detail?.key === "sys-loading-anim") {
    localAnimType.value = getLocalAnimType();
  }
}) as EventListener;

onMounted(() => {
  window.addEventListener("storage", handleStorageChange);
  window.addEventListener("localStorageChange", handleLocalStorageChange);
});

onUnmounted(() => {
  window.removeEventListener("storage", handleStorageChange);
  window.removeEventListener("localStorageChange", handleLocalStorageChange);
});

const currentKey = computed(() => {
  if (props.type) {
    return props.type;
  }
  return localAnimType.value;
});

const loadingMap: Record<string, unknown> = {
  default: DefaultLoading,
  pixel: PixelLoading,
  dinoGame: DinoGameLoading,
  neon: NeonLineLoading,
  skeleton: SkeletonCardsLoading,
  mario: MarioLoading,
  book: BookFlipLoading,
  bookWrite: BookWritingLoading,
  beaver: BeaverClamLoading
};

const currentComponent = computed(() => loadingMap[currentKey.value] || DefaultLoading);
</script>

<template>
  <div class="cool-loading">
    <component
      :is="currentComponent"
      :loading-text="loadingText"
      :show-progress="showProgress"
    />
  </div>
</template>

<style scoped>
.cool-loading {
  position: fixed;
  inset: 0;
  z-index: 9999;
}
</style>

 