<template>
  <div class="modern-login-page">
    <!-- 动态背景 -->
    <div class="background-container">
      <img :src="bg" class="login-bg" />
      <div class="background-overlay"></div>
      <div class="background-particles"></div>
    </div>

    <!-- 顶部工具栏 -->
    <slot name="toolbar"></slot>

    <!-- 主要内容区 -->
    <div class="login-main-container">
      <div class="modern-content-box">
        <!-- 左侧插图区域 -->
        <div class="illustration-section">
          <div class="illustration-content">
            <component :is="toRaw(illustration)" class="main-illustration" />
            <div class="illustration-decoration"></div>
          </div>
        </div>

        <!-- 右侧表单区域 -->
        <div class="form-section">
          <div class="form-wrapper">
            <slot name="form"></slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { toRaw } from "vue";
import { bg, illustration } from "../../utils/static";

defineOptions({
  name: "ModernLoginTheme",
});
</script>

<style lang="scss" scoped>
.modern-login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: var(--el-bg-color-page);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.background-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;

  .login-bg {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: blur(1px);
    transition: all 0.3s ease;
  }

  .background-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      135deg,
      rgba(var(--el-color-primary-rgb), 0.1) 0%,
      var(--el-bg-color-page) 50%,
      rgba(var(--el-color-primary-rgb), 0.05) 100%
    );
    backdrop-filter: blur(8px);
  }

  .background-particles {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: radial-gradient(
        circle at 20% 80%,
        var(--el-color-primary-light-9) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 20%,
        var(--el-color-primary-light-9) 0%,
        transparent 50%
      );
    animation: float 20s ease-in-out infinite;
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

.modern-content-box {
  width: 100%;
  max-width: 1200px;
  display: flex;
  background: var(--el-bg-color);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-height: 600px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.15);
  }
}

.illustration-section {
  flex: 1;
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9) 0%,
    var(--el-color-primary-light-8) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  position: relative;
  overflow: hidden;

  .illustration-content {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 500px;
  }

  .main-illustration {
    width: 100%;
    height: auto;
    filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.1));
    animation: float 6s ease-in-out infinite;
  }

  .illustration-decoration {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 120%;
    height: 120%;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 70%
    );
    animation: pulse 4s ease-in-out infinite;
  }
}

.form-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  background: var(--el-bg-color);
}

.form-wrapper {
  width: 100%;
  max-width: 420px;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

@media (max-width: 768px) {
  .modern-content-box {
    flex-direction: column;
    min-height: auto;
  }

  .illustration-section {
    display: none;
  }

  .form-section {
    padding: 40px 20px;
  }
}
</style>
