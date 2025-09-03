<script setup lang="ts">
import { computed } from "vue";
import { useNav } from "../../../hooks/useNav";
import NavVertical from "../NavVertical.vue";
import NavHorizontal from "../NavHorizontal.vue";
import NavMix from "../NavMix.vue";

// Props
interface Props {
  showLogo?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showLogo: true
});

// Emits
interface Emits {
  menuClick: [menu: any];
  favoriteToggle: [menu: any, isFavorited: boolean];
}

const emit = defineEmits<Emits>();

const { layout } = useNav();

// 处理菜单点击事件
function handleMenuClick(menu: any) {
  emit('menuClick', menu);
}

// 处理收藏切换事件
function handleFavoriteToggle(menu: any, isFavorited: boolean) {
  emit('favoriteToggle', menu, isFavorited);
}
</script>

<template>
  <!-- 根据布局模式选择对应的导航组件 -->
  <NavVertical 
    v-if="layout === 'vertical'"
    :show-logo="props.showLogo"
    @menu-click="handleMenuClick"
    @favorite-toggle="handleFavoriteToggle"
  />
  <NavHorizontal 
    v-else-if="layout === 'horizontal'"
    :show-logo="props.showLogo"
    @menu-click="handleMenuClick"
    @favorite-toggle="handleFavoriteToggle"
  />
  <NavMix 
    v-else-if="layout === 'mix'"
    :show-logo="props.showLogo"
    @menu-click="handleMenuClick"
    @favorite-toggle="handleFavoriteToggle"
  />
  <!-- 默认使用垂直导航 -->
  <NavVertical 
    v-else
    :show-logo="props.showLogo"
    @menu-click="handleMenuClick"
    @favorite-toggle="handleFavoriteToggle"
  />
</template>

<style lang="scss" scoped>
/* 主容器样式由子组件负责 */
</style>