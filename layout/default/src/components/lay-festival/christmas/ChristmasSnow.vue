<template>
  <canvas ref="canvasRef" class="christmas-snow-canvas"></canvas>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationId: number | null = null;

// 雪花粒子
interface Snowflake {
  x: number;
  y: number;
  radius: number;
  speed: number;
  drift: number;
  opacity: number;
}

const snowflakes: Snowflake[] = [];
const maxSnowflakes = 100;

// 创建雪花
const createSnowflake = (canvas: HTMLCanvasElement): Snowflake => {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    radius: Math.random() * 3 + 1,
    speed: Math.random() * 1 + 0.5,
    drift: Math.random() * 0.5 - 0.25,
    opacity: Math.random() * 0.6 + 0.4,
  };
};

// 更新雪花位置
const updateSnowflake = (
  snowflake: Snowflake,
  canvas: HTMLCanvasElement
): void => {
  snowflake.y += snowflake.speed;
  snowflake.x += snowflake.drift;

  // 重置超出边界的雪花
  if (snowflake.y > canvas.height) {
    snowflake.y = -10;
    snowflake.x = Math.random() * canvas.width;
  }
  if (snowflake.x > canvas.width) {
    snowflake.x = 0;
  } else if (snowflake.x < 0) {
    snowflake.x = canvas.width;
  }
};

// 绘制雪花
const drawSnowflake = (
  ctx: CanvasRenderingContext2D,
  snowflake: Snowflake
): void => {
  ctx.beginPath();
  ctx.arc(snowflake.x, snowflake.y, snowflake.radius, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, ${snowflake.opacity})`;
  ctx.fill();
};

// 动画循环
const animate = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
): void => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  snowflakes.forEach((snowflake) => {
    updateSnowflake(snowflake, canvas);
    drawSnowflake(ctx, snowflake);
  });

  animationId = requestAnimationFrame(() => animate(ctx, canvas));
};

// 初始化 Canvas
const initCanvas = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 设置 Canvas 尺寸
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // 创建雪花
  snowflakes.length = 0;
  for (let i = 0; i < maxSnowflakes; i++) {
    snowflakes.push(createSnowflake(canvas));
  }

  // 开始动画
  animate(ctx, canvas);
};

// 窗口大小变化时重新初始化
const handleResize = () => {
  initCanvas();
};

onMounted(() => {
  initCanvas();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
  }
});
</script>

<style scoped>
.christmas-snow-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}
</style>
