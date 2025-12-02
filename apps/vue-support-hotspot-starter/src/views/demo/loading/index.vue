<script setup>
import { getRandomInt } from "@repo/utils";
import { defineAsyncComponent, ref } from "vue";
const loadingShow = ref(true);
const loadingRef = ref();
const showNumber = ref(true);
const showLoading = ref(false);
const layout = ref("loader5");
const LoadingLayout = defineAsyncComponent(() => import("@repo/components/ScLoading/index.vue"));

setInterval(() => {
  loadingRef.value.stepBy(getRandomInt(1, 10));
}, 1000);
</script>
<template>
  <div class="loading-demo-page">
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ri:loader-4-line" class="title-icon" />
            Loading 加载动画演示
          </h1>
          <p class="page-subtitle">展示多种加载动画效果，可自定义配置</p>
        </div>
      </div>
    </div>

    <div class="control-panel">
      <el-card shadow="hover" class="control-card">
        <template #header>
          <div class="card-header">
            <IconifyIconOnline icon="ri:settings-3-line" class="header-icon" />
            <span>配置选项</span>
          </div>
        </template>
        <el-form :inline="true" class="control-form">
          <el-form-item label="布局样式">
            <el-select v-model="layout" placeholder="请选择布局" class="layout-select">
              <el-option label="Spinning" value="spining">
                <div class="option-item">
                  <IconifyIconOnline icon="ri:loader-line" />
                  <span>Spinning</span>
                </div>
              </el-option>
              <el-option label="Spinning 2" value="spining2">
                <div class="option-item">
                  <IconifyIconOnline icon="ri:loader-2-line" />
                  <span>Spinning 2</span>
                </div>
              </el-option>
              <el-option label="Pencil" value="pencil">
                <div class="option-item">
                  <IconifyIconOnline icon="ri:pencil-line" />
                  <span>Pencil</span>
                </div>
              </el-option>
              <el-option label="Loader" value="loader" />
              <el-option label="Loader 2" value="loader2" />
              <el-option label="Loader 3" value="loader3" />
              <el-option label="Loader 4" value="loader4" />
              <el-option label="Loader 5" value="loader5" />
              <el-option label="Loader 6" value="loader6" />
              <el-option label="Banter" value="banter" />
              <el-option label="Default" value="default" />
              <el-option label="Jimi" value="jimi" />
              <el-option label="Box" value="box" />
            </el-select>
          </el-form-item>
          <el-form-item label="显示数字">
            <el-switch v-model="showNumber" active-color="var(--el-color-primary)" />
          </el-form-item>
          <el-form-item label="显示文本">
            <el-switch v-model="showLoading" active-color="var(--el-color-primary)" />
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <div class="loading-display">
      <el-card shadow="never" class="display-card">
        <div class="loading-container">
          <LoadingLayout ref="loadingRef" v-model="loadingShow" :layout="layout" :show-number="showNumber" :show-loading="showLoading" />
        </div>
      </el-card>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-demo-page {
  padding: 0;
  background: var(--el-bg-color-page);
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
  padding: 32px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 28px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0 0 12px 0;

  .title-icon {
    font-size: 32px;
    color: var(--el-color-primary);
    animation: rotate 2s linear infinite;
  }
}

.page-subtitle {
  color: var(--el-text-color-regular);
  font-size: 16px;
  margin: 0;
}

.control-panel {
  margin-bottom: 24px;
}

.control-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

  :deep(.el-card__header) {
    background: var(--el-fill-color-light);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  .header-icon {
    font-size: 20px;
    color: var(--el-color-primary);
  }
}

.control-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;

  :deep(.el-form-item__label) {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .layout-select {
    width: 220px;

    :deep(.el-input__wrapper) {
      border-radius: 8px;
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 0 0 1px var(--el-color-primary-light-5) inset;
      }
    }
  }
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-display {
  margin-bottom: 24px;
}

.display-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  background: linear-gradient(135deg, var(--el-bg-color-overlay) 0%, var(--el-fill-color-blank) 100%);
}

.loading-container {
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(var(--el-color-primary-rgb), 0.05) 0%, transparent 70%);
    border-radius: 50%;
    animation: pulse 3s ease-in-out infinite;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.5;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.8;
  }
}

:deep(.el-switch) {
  --el-switch-on-color: var(--el-color-primary);
}
</style>
