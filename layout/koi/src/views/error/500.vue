<template>
  <div class="error-page koi-flex">
    <div class="error-page__inner">
      <img class="error-page__banner" :src="img500" alt="500" />
      <div class="koi-bottom">
        <div class="koi-text1">500</div>
        <p class="koi-text2">服务器好像开小差了，请稍后再试</p>
        <div class="error-page__actions">
          <el-button class="error-btn error-btn--primary" @click="handleHomePage">
            <el-icon><HomeFilled /></el-icon>
            <span>返回首页</span>
          </el-button>
          <el-button class="error-btn error-btn--ghost" @click="handleBack">
            <el-icon><ArrowLeft /></el-icon>
            <span>返回上页</span>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="error500Page">
import { ArrowLeft, HomeFilled } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import { HOME_URL } from "../../config/index.ts";
import img500 from "../../assets/images/error/500.png";

const router = useRouter();

const handleHomePage = () => {
  router.push({ path: HOME_URL });
};

const handleBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    handleHomePage();
  }
};
</script>

<style lang="scss" scoped>
$error-accent: var(--el-color-danger);
$error-accent-light: var(--el-color-danger-light-3);

.error-page {
  position: relative;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color-page);

  &::before,
  &::after {
    position: absolute;
    border-radius: 50%;
    filter: blur(72px);
    opacity: 0.35;
    pointer-events: none;
    content: "";
  }

  &::before {
    top: -70px;
    right: 15%;
    width: 290px;
    height: 290px;
    background: var(--el-color-danger);
  }

  &::after {
    bottom: -55px;
    left: 8%;
    width: 230px;
    height: 230px;
    background: var(--el-color-danger-light-5);
  }
}

.error-page__inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 24px 20px 32px;
}

.error-page__banner {
  display: block;
  flex-shrink: 1;
  width: min(560px, 88vw);
  max-height: min(420px, 42vh);
  object-fit: contain;
}

.koi-bottom {
  flex-shrink: 0;
  margin-top: 8px;
  text-align: center;
}

.koi-text1 {
  font-size: clamp(40px, 8vw, 56px);
  font-weight: 800;
  line-height: 1;
  letter-spacing: 2px;
  background: linear-gradient(135deg, $error-accent 0%, $error-accent-light 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.koi-text2 {
  max-width: 420px;
  padding-top: 16px;
  margin: 0 auto;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.error-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-top: 28px;

  :deep(.error-btn.el-button) {
    height: 42px;
    padding: 0 22px;
    font-size: 15px;
    font-weight: 500;
    border-radius: 21px;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease,
      background 0.2s ease,
      border-color 0.2s ease;

    .el-icon {
      margin-right: 6px;
      font-size: 16px;
    }

    &:hover {
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0);
    }
  }

  :deep(.error-btn--primary.el-button) {
    color: #fff;
    background: linear-gradient(135deg, $error-accent 0%, $error-accent-light 100%);
    border: none;
    box-shadow: 0 8px 20px color-mix(in srgb, $error-accent 35%, transparent);

    &:hover,
    &:focus {
      color: #fff;
      background: linear-gradient(135deg, $error-accent 0%, $error-accent-light 100%);
      border: none;
      box-shadow: 0 10px 24px color-mix(in srgb, $error-accent 45%, transparent);
    }
  }

  :deep(.error-btn--ghost.el-button) {
    color: var(--el-text-color-primary);
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color);
    box-shadow: 0 2px 8px rgb(0 0 0 / 4%);

    &:hover,
    &:focus {
      color: $error-accent;
      border-color: $error-accent-light;
      background: color-mix(in srgb, $error-accent 8%, var(--el-fill-color-blank));
    }
  }
}
</style>
