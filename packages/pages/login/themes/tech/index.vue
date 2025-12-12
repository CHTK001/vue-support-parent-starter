<template>
  <div class="tech-login-page">
    <!-- 科技背景 -->
    <div class="tech-background">
      <canvas ref="canvasRef" class="tech-canvas"></canvas>
      <div class="tech-grid"></div>
      <div class="tech-overlay"></div>
    </div>

    <!-- 顶部工具栏 -->
    <slot name="toolbar"></slot>

    <!-- 主要内容区 -->
    <div class="login-main-container">
      <div class="tech-content-box">
        <!-- 左侧科技装饰 -->
        <div class="tech-decoration-section">
          <div class="tech-circle-container">
            <div class="tech-circle tech-circle-1"></div>
            <div class="tech-circle tech-circle-2"></div>
            <div class="tech-circle tech-circle-3"></div>
          </div>
          <div class="tech-lines">
            <div class="tech-line" v-for="i in 5" :key="i"></div>
          </div>
          <div class="tech-logo-area">
            <IconifyIconOnline icon="ri:shield-keyhole-line" class="tech-icon" />
            <div class="tech-title">安全登录</div>
            <div class="tech-subtitle">SECURE ACCESS SYSTEM</div>
          </div>
        </div>

        <!-- 右侧表单区域 -->
        <div class="form-section">
          <div class="form-wrapper">
            <div class="form-header">
              <div class="scan-line"></div>
            </div>
            <slot name="form"></slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";

defineOptions({
  name: "TechLoginTheme",
});

const canvasRef = ref(null);
let animationId = null;

onMounted(() => {
  initTechBackground();
});

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
});

const initTechBackground = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const particleCount = 100;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 2 + 1,
    });
  }

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(64, 158, 255, 0.1)";
    ctx.strokeStyle = "rgba(64, 158, 255, 0.2)";

    particles.forEach((particle, i) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();

      particles.slice(i + 1).forEach((p2) => {
        const dx = particle.x - p2.x;
        const dy = particle.y - p2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 120) {
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });
    });

    animationId = requestAnimationFrame(animate);
  };

  animate();

  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
};
</script>

<style lang="scss" scoped>
.tech-login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
}

.tech-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;

  .tech-canvas {
    width: 100%;
    height: 100%;
  }

  .tech-grid {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: linear-gradient(
        rgba(64, 158, 255, 0.1) 1px,
        transparent 1px
      ),
      linear-gradient(90deg, rgba(64, 158, 255, 0.1) 1px, transparent 1px);
    background-size: 50px 50px;
    animation: gridMove 20s linear infinite;
  }

  .tech-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(
      circle at 50% 50%,
      transparent 0%,
      rgba(10, 14, 39, 0.8) 100%
    );
  }
}

.login-main-container {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.tech-content-box {
  width: 100%;
  max-width: 1200px;
  display: flex;
  background: rgba(26, 31, 58, 0.8);
  border: 1px solid rgba(64, 158, 255, 0.3);
  border-radius: 16px;
  box-shadow: 0 0 40px rgba(64, 158, 255, 0.2),
    inset 0 0 40px rgba(64, 158, 255, 0.05);
  backdrop-filter: blur(10px);
  overflow: hidden;
  min-height: 600px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 0 60px rgba(64, 158, 255, 0.4),
      inset 0 0 40px rgba(64, 158, 255, 0.1);
    border-color: rgba(64, 158, 255, 0.5);
  }
}

.tech-decoration-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    rgba(64, 158, 255, 0.1) 0%,
    transparent 100%
  );

  .tech-circle-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 400px;
    height: 400px;
  }

  .tech-circle {
    position: absolute;
    border: 2px solid rgba(64, 158, 255, 0.3);
    border-radius: 50%;
    animation: techRotate 20s linear infinite;

    &.tech-circle-1 {
      width: 100%;
      height: 100%;
      border-style: dashed;
    }

    &.tech-circle-2 {
      width: 70%;
      height: 70%;
      top: 15%;
      left: 15%;
      animation-duration: 15s;
      animation-direction: reverse;
    }

    &.tech-circle-3 {
      width: 40%;
      height: 40%;
      top: 30%;
      left: 30%;
      animation-duration: 10s;
      border-style: dotted;
    }
  }

  .tech-lines {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  }

  .tech-line {
    position: absolute;
    width: 2px;
    height: 100%;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      rgba(64, 158, 255, 0.5) 50%,
      transparent 100%
    );
    animation: techLineMove 3s ease-in-out infinite;

    &:nth-child(1) {
      left: 20%;
      animation-delay: 0s;
    }
    &:nth-child(2) {
      left: 35%;
      animation-delay: 0.6s;
    }
    &:nth-child(3) {
      left: 50%;
      animation-delay: 1.2s;
    }
    &:nth-child(4) {
      left: 65%;
      animation-delay: 1.8s;
    }
    &:nth-child(5) {
      left: 80%;
      animation-delay: 2.4s;
    }
  }

  .tech-logo-area {
    position: relative;
    z-index: 1;
    text-align: center;
    color: #fff;

    .tech-icon {
      font-size: 80px;
      color: var(--el-color-primary);
      filter: drop-shadow(0 0 20px rgba(64, 158, 255, 0.6));
      animation: techPulse 2s ease-in-out infinite;
    }

    .tech-title {
      margin-top: 20px;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 2px;
      text-shadow: 0 0 20px rgba(64, 158, 255, 0.8);
    }

    .tech-subtitle {
      margin-top: 10px;
      font-size: 14px;
      font-weight: 300;
      letter-spacing: 4px;
      color: rgba(255, 255, 255, 0.6);
      font-family: "Courier New", monospace;
    }
  }
}

.form-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  background: rgba(10, 14, 39, 0.6);
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 2px;
    height: 100%;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      rgba(64, 158, 255, 0.5) 50%,
      transparent 100%
    );
  }
}

.form-wrapper {
  width: 100%;
  max-width: 420px;
  position: relative;

  .form-header {
    position: absolute;
    top: -30px;
    left: 0;
    right: 0;
    height: 2px;
    overflow: hidden;

    .scan-line {
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent 0%,
        var(--el-color-primary) 50%,
        transparent 100%
      );
      animation: scanMove 2s ease-in-out infinite;
    }
  }
}

@keyframes gridMove {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(50px, 50px);
  }
}

@keyframes techRotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes techLineMove {
  0%,
  100% {
    opacity: 0.2;
    transform: translateY(-20px);
  }
  50% {
    opacity: 1;
    transform: translateY(20px);
  }
}

@keyframes techPulse {
  0%,
  100% {
    transform: scale(1);
    filter: drop-shadow(0 0 20px rgba(64, 158, 255, 0.6));
  }
  50% {
    transform: scale(1.05);
    filter: drop-shadow(0 0 30px rgba(64, 158, 255, 0.9));
  }
}

@keyframes scanMove {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@media (max-width: 768px) {
  .tech-content-box {
    flex-direction: column;
    min-height: auto;
  }

  .tech-decoration-section {
    min-height: 200px;
    padding: 40px 20px;

    .tech-circle-container {
      width: 200px;
      height: 200px;
    }

    .tech-logo-area {
      .tech-icon {
        font-size: 50px;
      }

      .tech-title {
        font-size: 24px;
      }
    }
  }

  .form-section {
    padding: 40px 20px;

    &::before {
      width: 100%;
      height: 2px;
      background: linear-gradient(
        to right,
        transparent 0%,
        rgba(64, 158, 255, 0.5) 50%,
        transparent 100%
      );
    }
  }
}
</style>
