<template>
  <div class="christmas-tree-container">
    <svg
      v-for="tree in trees"
      :key="tree.id"
      class="christmas-tree"
      :style="{
        left: tree.x + '%',
        bottom: tree.y + 'px',
        width: tree.size + 'px',
        height: tree.size * 1.5 + 'px',
      }"
      viewBox="0 0 100 150"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- 树干 -->
      <rect x="42" y="120" width="16" height="30" fill="#5D4037" />
      <!-- 树叶层1 -->
      <polygon points="50,20 20,60 80,60" fill="#0F8B8D" />
      <!-- 树叶层2 -->
      <polygon points="50,45 15,85 85,85" fill="#0F8B8D" />
      <!-- 树叶层3 -->
      <polygon points="50,70 10,110 90,110" fill="#0F8B8D" />
      <!-- 星星 -->
      <polygon
        points="50,5 52,15 62,15 54,21 57,31 50,25 43,31 46,21 38,15 48,15"
        fill="#FFD700"
        class="tree-star"
      />
      <!-- 装饰灯 -->
      <circle
        v-for="light in tree.lights"
        :key="light.id"
        :cx="light.x"
        :cy="light.y"
        r="3"
        :fill="light.color"
        class="tree-light"
        :style="{ animationDelay: light.delay + 's' }"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

interface Light {
  id: number;
  x: number;
  y: number;
  color: string;
  delay: number;
}

interface Tree {
  id: number;
  x: number;
  y: number;
  size: number;
  lights: Light[];
}

// 生成装饰灯
const generateLights = (): Light[] => {
  const colors = ["#FFD700", "#C41E3A", "#0F8B8D", "#FFFFFF"];
  const lights: Light[] = [];
  const positions = [
    { x: 35, y: 50 },
    { x: 65, y: 50 },
    { x: 30, y: 75 },
    { x: 50, y: 75 },
    { x: 70, y: 75 },
    { x: 25, y: 100 },
    { x: 50, y: 100 },
    { x: 75, y: 100 },
  ];

  positions.forEach((pos, index) => {
    lights.push({
      id: index,
      x: pos.x,
      y: pos.y,
      color: colors[index % colors.length],
      delay: Math.random() * 2,
    });
  });

  return lights;
};

// 生成圣诞树
const trees = ref<Tree[]>([
  { id: 1, x: 5, y: 0, size: 80, lights: generateLights() },
  { id: 2, x: 90, y: 0, size: 70, lights: generateLights() },
]);
</script>

<style scoped>
.christmas-tree-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
}

.christmas-tree {
  position: absolute;
  filter: drop-shadow(0 0 10px rgba(15, 139, 141, 0.5));
}

.tree-star {
  animation: star-twinkle 1.5s ease-in-out infinite;
}

.tree-light {
  animation: light-blink 1s ease-in-out infinite;
}

@keyframes star-twinkle {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
}

@keyframes light-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}
</style>
