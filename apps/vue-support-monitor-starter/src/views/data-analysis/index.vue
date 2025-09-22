<template>
  <div class="data-analysis-container">
    <div class="page-header">
      <h2>数据分析</h2>
      <p>对系统数据进行统计分析和可视化展示</p>
    </div>
    
    <div class="content-placeholder">
      <el-empty description="数据分析功能开发中...">
        <template #image>
          <IconifyIconOnline icon="ri:bar-chart-box-line" style="font-size: 64px; color: #409eff;" />
        </template>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconifyIconOnline } from "@repo/components";

// 页面标题
defineOptions({
  name: "DataAnalysis"
});
</script>

<style lang="scss" scoped>
.data-analysis-container {
  padding: 24px;
  height: 100%;
  background: var(--el-bg-color-overlay);
}

.page-header {
  margin-bottom: 24px;
  
  h2 {
    margin: 0 0 8px 0;
    color: var(--el-text-color-primary);
    font-size: 24px;
    font-weight: 600;
  }
  
  p {
    margin: 0;
    color: #606266;
    font-size: 14px;
  }
}

.content-placeholder {
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}
</style>
