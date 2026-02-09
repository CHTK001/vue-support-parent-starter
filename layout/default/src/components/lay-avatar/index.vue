<script setup lang="ts">
import { computed } from "vue";
import { useLayout } from "../../hooks/useLayout";

interface Props {
  src: string;
  alt?: string;
  style?: any;
}

const props = defineProps<Props>();

const { layoutTheme } = useLayout();

const themeClass = computed(() => {
  return layoutTheme.value.theme;
});
</script>

<template>
  <div class="lay-avatar" :class="themeClass">
    <img :src="src" :alt="alt" :style="style" class="lay-avatar-img" />
    <!-- 节日装饰层 -->
    <div v-if="themeClass === 'halloween'" class="avatar-decoration halloween-decoration"></div>
    <div v-else-if="themeClass === 'spring-festival'" class="avatar-decoration spring-decoration"></div>
  </div>
</template>

<style lang="scss" scoped>
.lay-avatar {
  position: relative;
  display: inline-block;
  width: 100%;
  height: 100%;
  
  .lay-avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    border-radius: inherit;
  }
}

.avatar-decoration {
  position: absolute;
  pointer-events: none;
  z-index: 1;
}

/* 万圣节装饰 */
.halloween-decoration {
  top: -20%;
  left: -20%;
  width: 140%;
  height: 140%;
  /* 蜘蛛网风格边框 */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='grad1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23ff7518;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%2376ff03;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M50 5 L 65 25 L 90 25 L 75 50 L 90 75 L 65 75 L 50 95 L 35 75 L 10 75 L 25 50 L 10 25 L 35 25 Z' fill='none' stroke='url(%23grad1)' stroke-width='2' opacity='0.8'/%3E%3Ccircle cx='50' cy='50' r='42' stroke='%232c003e' stroke-width='2' fill='none' stroke-dasharray='4 2'/%3E%3Cpath d='M50 10 L 50 90 M 10 50 L 90 50 M 22 22 L 78 78 M 22 78 L 78 22' stroke='%235e35b1' stroke-width='1' opacity='0.5'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  animation: spin-slow 20s linear infinite;
  filter: drop-shadow(0 0 5px rgba(255, 117, 24, 0.5));
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
