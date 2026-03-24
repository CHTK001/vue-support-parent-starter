<script setup lang="ts">
/**
 * 雪花背景装饰组件
 * 用于圣诞节/冬季主题
 */
import { ref, onMounted } from 'vue';

interface Snowflake {
  id: number;
  x: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

const props = withDefaults(defineProps<{
  /** 雪花数量 */
  count?: number;
}>(), {
  count: 15,
});

const snowflakes = ref<Snowflake[]>([]);

function generateSnowflakes() {
  const result: Snowflake[] = [];
  for (let i = 0; i < props.count; i++) {
    result.push({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 4,
      opacity: Math.random() * 0.5 + 0.3,
    });
  }
  snowflakes.value = result;
}

onMounted(() => {
  generateSnowflakes();
});
</script>

<template>
  <div class="snowfall-background">
    <div 
      v-for="flake in snowflakes" 
      :key="flake.id"
      class="snowflake"
      :style="{
        left: flake.x + '%',
        width: flake.size + 'px',
        height: flake.size + 'px',
        animationDelay: flake.delay + 's',
        animationDuration: flake.duration + 's',
        opacity: flake.opacity,
      }"
    />
  </div>
</template>

<style scoped>
.snowfall-background {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.snowflake {
  position: absolute;
  top: -10px;
  background: radial-gradient(circle, #fff 0%, rgba(255, 255, 255, 0.8) 50%, transparent 70%);
  border-radius: 50%;
  animation: snowfall linear infinite;
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
}

@keyframes snowfall {
  0% {
    transform: translateY(-10px) rotate(0deg);
  }
  100% {
    transform: translateY(60px) rotate(360deg);
  }
}
</style>
