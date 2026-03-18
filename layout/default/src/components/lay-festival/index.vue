<template>
  <Teleport to="body">
    <Transition name="festival-fade" mode="out-in">
      <component :is="currentFestivalComponent" v-if="currentFestivalComponent" :key="theme" />
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'

interface Props {
  theme: string
}

const props = defineProps<Props>()

// 懒加载节日特效组件
const HalloweenSpider = defineAsyncComponent(() => import('./halloween/HalloweenSpider.vue'))
const HalloweenGhost = defineAsyncComponent(() => import('./halloween/HalloweenGhost.vue'))
const HalloweenPumpkin = defineAsyncComponent(() => import('./halloween/HalloweenPumpkin.vue'))

const ChristmasSnow = defineAsyncComponent(() => import('./christmas/ChristmasSnow.vue'))
const ChristmasTree = defineAsyncComponent(() => import('./christmas/ChristmasTree.vue'))

const SpringFestivalFirework = defineAsyncComponent(() => import('./spring-festival/SpringFestivalFirework.vue'))
const SpringFestivalLantern = defineAsyncComponent(() => import('./spring-festival/SpringFestivalLantern.vue'))

// 节日特效组件映射
const festivalComponents: Record<string, any> = {
  halloween: HalloweenSpider,
  christmas: ChristmasSnow,
  'spring-festival': SpringFestivalLantern
}

// 根据主题动态选择节日特效组件
const currentFestivalComponent = computed(() => {
  const theme = props.theme?.toLowerCase()
  return festivalComponents[theme] || null
})
</script>

<style scoped lang="scss">
.festival-fade-enter-active,
.festival-fade-leave-active {
  transition: opacity var(--transition-base, 0.3s);
}

.festival-fade-enter-from,
.festival-fade-leave-to {
  opacity: 0;
}
</style>
