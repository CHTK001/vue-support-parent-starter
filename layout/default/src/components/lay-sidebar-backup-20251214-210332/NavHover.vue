<script setup lang="ts">
import { computed } from "vue";
import { useNav } from "../../hooks/useNav";
import DefaultNavigation from "./components/DefaultNavigation.vue";
import HoverNavigation from "./components/HoverNavigation.vue";

// Props
interface Props {
  showLogo?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showLogo: true,
});

// Emits
interface Emits {
  menuClick: [menu: any];
  favoriteToggle: [menu: any, isFavorited: boolean];
}

const emit = defineEmits<Emits>();

const { layout } = useNav();

// 从全局状态获取布局模式
const isHoverMode = computed(() => layout.value === "hover");

// 处理菜单点击事件
function handleMenuClick(menu: any) {
  emit("menuClick", menu);
}

// 处理收藏切换事件
function handleFavoriteToggle(menu: any, isFavorited: boolean) {
  emit("favoriteToggle", menu, isFavorited);
}
</script>

<template>
  <!-- 根据导航模式选择对应的组件 -->
  <HoverNavigation v-if="isHoverMode" :show-logo="props.showLogo" @menu-click="handleMenuClick" @favorite-toggle="handleFavoriteToggle" />
  <DefaultNavigation v-else :show-logo="props.showLogo" @menu-click="handleMenuClick" @favorite-toggle="handleFavoriteToggle" />
</template>

<style lang="scss" scoped>
/* 主容器样式由子组件负责 */
</style>
