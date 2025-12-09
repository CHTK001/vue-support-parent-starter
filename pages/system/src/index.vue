<template>
  <div class="system-home">
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ri:settings-3-line" class="title-icon" />
            系统管理
          </h1>
          <p class="page-subtitle">系统配置、日志管理、限流设置等功能</p>
        </div>
      </div>
    </div>

    <div class="content-area">
      <div class="feature-grid">
        <router-link to="/system/log" class="feature-card">
          <div class="feature-icon-wrapper">
            <IconifyIconOnline
              icon="ri:file-list-3-line"
              class="feature-icon"
            />
          </div>
          <h3 class="feature-title">日志管理</h3>
          <p class="feature-desc">查看和管理系统日志记录</p>
        </router-link>

        <router-link to="/system/limit" class="feature-card">
          <div class="feature-icon-wrapper">
            <IconifyIconOnline icon="ri:speed-line" class="feature-icon" />
          </div>
          <h3 class="feature-title">限流配置</h3>
          <p class="feature-desc">配置和管理系统限流规则</p>
        </router-link>

        <router-link to="/system/holiday" class="feature-card">
          <div class="feature-icon-wrapper">
            <IconifyIconOnline icon="ri:calendar-line" class="feature-icon" />
          </div>
          <h3 class="feature-title">节假日管理</h3>
          <p class="feature-desc">管理系统节假日配置</p>
        </router-link>

        <router-link to="/system/file" class="feature-card">
          <div class="feature-icon-wrapper">
            <IconifyIconOnline icon="ri:folder-upload-line" class="feature-icon" />
          </div>
          <h3 class="feature-title">文件管理</h3>
          <p class="feature-desc">单机文件上传与管理</p>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { IconifyIconOnline } from "@repo/components";
</script>

<style lang="scss" scoped>
.system-home {
  padding: 0;
  background: var(--el-bg-color-page);
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9) 0%,
    var(--el-color-primary-light-8) 100%
  );
  padding: 32px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
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
  font-size: 32px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0 0 12px 0;

  .title-icon {
    font-size: 36px;
    color: var(--el-color-primary);
  }
}

.page-subtitle {
  color: var(--el-text-color-regular);
  font-size: 16px;
  margin: 0;
}

.content-area {
  padding: 0 32px;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 24px;
}

.feature-card {
  display: block;
  padding: 32px;
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    border-color: var(--el-color-primary);

    .feature-icon-wrapper {
      background: var(--el-color-primary);
      transform: scale(1.1);

      .feature-icon {
        color: white;
      }
    }
  }
}

.feature-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  background: var(--el-color-primary-light-9);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.feature-icon {
  font-size: 32px;
  color: var(--el-color-primary);
  transition: all 0.3s ease;
}

.feature-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 12px 0;
}

.feature-desc {
  font-size: 14px;
  color: var(--el-text-color-regular);
  margin: 0;
  line-height: 1.6;
}
</style>
