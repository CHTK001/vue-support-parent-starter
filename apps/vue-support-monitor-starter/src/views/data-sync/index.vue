<template>
  <div class="data-sync-container">
    <div class="page-header">
      <h2>数据同步</h2>
      <p>管理数据同步任务和配置同步策略</p>
    </div>
    
    <div class="content-placeholder">
      <el-empty description="数据同步功能开发中...">
        <template #image>
          <IconifyIconOnline icon="ri:refresh-line" style="font-size: 64px; color: #409eff;" />
        </template>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconifyIconOnline } from "@repo/components";

// 页面标题
defineOptions({
  name: "DataSync"
});
</script>

<style lang="scss" scoped>
.data-sync-container {
  padding: 24px;
  height: 100%;
  background: #f5f7fa;
}

.page-header {
  margin-bottom: 24px;
  
  h2 {
    margin: 0 0 8px 0;
    color: #303133;
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
  background: white;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}
</style>
