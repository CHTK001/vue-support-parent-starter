<template>
  <div class="page flex flex-col h-full">
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline
              icon="ri:bar-chart-box-line"
              class="title-icon"
            />
            数据分析
          </h1>
          <p class="page-subtitle">对系统数据进行统计分析和可视化展示</p>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-hidden">
      <el-card shadow="never" class="h-full">
        <div class="content-placeholder">
          <el-empty description="数据分析功能开发中...">
            <template #image>
              <IconifyIconOnline
                icon="ri:bar-chart-box-line"
                style="font-size: 64px; color: var(--el-color-primary)"
              />
            </template>
          </el-empty>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconifyIconOnline } from "@repo/components";

// 页面标题
defineOptions({
  name: "DataAnalysis",
});
</script>

<style lang="scss" scoped>
.page {
  padding: 0;
  background: var(--el-bg-color-page);
}

.page-header {
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9) 0%,
    var(--el-color-primary-light-8) 100%
  );
  padding: 24px 32px;
  border-radius: 8px;
  margin-bottom: 16px;
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
  gap: 12px;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 8px 0;

  .title-icon {
    font-size: 28px;
    color: var(--el-color-primary);
  }
}

.page-subtitle {
  color: var(--el-text-color-regular);
  font-size: 14px;
  margin: 0;
}

.content-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

:deep(.el-card) {
  border-radius: 8px;
}
</style>
