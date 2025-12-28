<script setup lang="ts">
/**
 * 烟花粒子背景装饰组件
 * 用于新年/春节等节日主题
 */
import { ref, onMounted } from 'vue';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  delay: number;
}

const props = withDefaults(defineProps<{
  /** 粒子数量 */
  count?: number;
  /** 粒子颜色列表 */
  colors?: string[];
}>(), {
  count: 20,
  colors: () => ['#ff4d4f', '#ffd700', '#ff6b6b', '#ffa940', '#ff85c0'],
});

const particles = ref<Particle[]>([]);

function generateParticles() {
  const result: Particle[] = [];
  for (let i = 0; i < props.count; i++) {
    result.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: props.colors[Math.floor(Math.random() * props.colors.length)],
      size: Math.random() * 4 + 2,
      delay: Math.random() * 3,
    });
  }
  particles.value = result;
}

onMounted(() => {
  generateParticles();
});
</script>

<template>
  <div class="fireworks-background">
    <div 
      v-for="particle in particles" 
      :key="particle.id"
      class="firework-particle"
      :style="{
        left: particle.x + '%',
        top: particle.y + '%',
        backgroundColor: particle.color,
        width: particle.size + 'px',
        height: particle.size + 'px',
        animationDelay: particle.delay + 's',
      }"
    />
  </div>
</template>

<style scoped>
.fireworks-background {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.firework-particle {
  position: absolute;
  border-radius: 50%;
  animation: firework-twinkle 2s ease-in-out infinite;
  opacity: 0;
}

@keyframes firework-twinkle {
  0%, 100% {
    opacity: 0;
    transform: scale(0.5);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.2);
  }
}
</style>
