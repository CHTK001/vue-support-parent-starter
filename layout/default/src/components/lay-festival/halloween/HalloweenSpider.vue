<template>
  <canvas ref="canvasRef" class="halloween-spider-canvas"></canvas>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationId: number | null = null;

// 蜘蛛网节点
interface WebNode {
  x: number;
  y: number;
}

// 绘制蜘蛛网
const drawSpiderWeb = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  maxRadius: number
) => {
  const rings = 6; // 环数
  const spokes = 8; // 辐条数

  ctx.strokeStyle = "rgba(155, 89, 182, 0.3)";
  ctx.lineWidth = 1;

  // 绘制辐条
  for (let i = 0; i < spokes; i++) {
    const angle = (Math.PI * 2 * i) / spokes;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(angle) * maxRadius,
      centerY + Math.sin(angle) * maxRadius
    );
    ctx.stroke();
  }

  // 绘制环
  for (let i = 1; i <= rings; i++) {
    const radius = (maxRadius * i) / rings;
    ctx.beginPath();
    for (let j = 0; j <= spokes; j++) {
      const angle = (Math.PI * 2 * j) / spokes;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      if (j === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
  }
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

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 四角绘制蜘蛛网
  const webSize = 150;
  const positions = [
    { x: 0, y: 0 }, // 左上
    { x: canvas.width, y: 0 }, // 右上
    { x: 0, y: canvas.height }, // 左下
    { x: canvas.width, y: canvas.height }, // 右下
  ];

  positions.forEach((pos) => {
    drawSpiderWeb(ctx, pos.x, pos.y, webSize);
  });
};

// 窗口大小变化时重新绘制
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
.halloween-spider-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}
</style>
