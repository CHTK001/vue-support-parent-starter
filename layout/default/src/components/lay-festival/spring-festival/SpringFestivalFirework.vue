<template>
  <canvas ref="canvasRef" class="spring-festival-firework-canvas"></canvas>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationId: number | null = null;

// 烟花粒子
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

const fireworks: Particle[][] = [];
const colors = ["#E74C3C", "#F39C12", "#F1C40F", "#FFD700"];

// 创建烟花
const createFirework = (x: number, y: number): Particle[] => {
  const particles: Particle[] = [];
  const particleCount = 50;
  const color = colors[Math.floor(Math.random() * colors.length)];

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount;
    const speed = Math.random() * 3 + 2;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: Math.random() * 60 + 60,
      color,
      size: Math.random() * 2 + 1,
    });
  }

  return particles;
};

// 更新粒子
const updateParticle = (particle: Particle): boolean => {
  particle.x += particle.vx;
  particle.y += particle.vy;
  particle.vy += 0.1; // 重力
  particle.life++;

  return particle.life < particle.maxLife;
};

// 绘制粒子
const drawParticle = (
  ctx: CanvasRenderingContext2D,
  particle: Particle
): void => {
  const opacity = 1 - particle.life / particle.maxLife;
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
  ctx.fillStyle = particle.color.replace(")", `, ${opacity})`).replace("rgb", "rgba");
  ctx.fill();
};

// 动画循环
const animate = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
): void => {
  ctx.fillStyle = "rgba(31, 13, 13, 0.1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 随机生成新烟花
  if (Math.random() < 0.02) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * (canvas.height * 0.5);
    fireworks.push(createFirework(x, y));
  }

  // 更新和绘制所有烟花
  for (let i = fireworks.length - 1; i >= 0; i--) {
    const particles = fireworks[i];
    for (let j = particles.length - 1; j >= 0; j--) {
      const particle = particles[j];
      if (!updateParticle(particle)) {
        particles.splice(j, 1);
      } else {
        drawParticle(ctx, particle);
      }
    }
    if (particles.length === 0) {
      fireworks.splice(i, 1);
    }
  }

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

  // 清空烟花数组
  fireworks.length = 0;

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
.spring-festival-firework-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}
</style>
