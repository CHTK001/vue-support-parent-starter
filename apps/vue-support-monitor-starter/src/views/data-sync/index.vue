<template>
  <div class="data-sync-container system-container modern-bg">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <IconifyIconOnline icon="ri:refresh-line" class="title-icon" />
          <div>
            <h2>数据同步</h2>
            <p>管理数据同步任务和配置同步策略</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 内容区域 -->
    <div class="content-area">
      <div class="content-card">
        <el-empty description="数据同步功能开发中...">
          <template #image>
            <div class="empty-icon">
              <IconifyIconOnline icon="ri:refresh-line" />
            </div>
          </template>
        </el-empty>
      </div>
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
@use "@/styles/mixins.scss" as *;
@use "@/styles/variables.scss" as *;

.data-sync-container {
  @include page-container;
  padding: $spacing-lg;
}

.page-header {
  @include toolbar-style;
  margin-bottom: $spacing-lg;
  
  .header-content {
    @include flex-between;
    width: 100%;
  }
  
  .header-title {
    @include flex-align-center;
    gap: $spacing-md;
    
    .title-icon {
      font-size: 32px;
      color: $primary-color;
      @include gradient-text;
      animation: rotate 3s linear infinite;
    }
    
    h2 {
      margin: 0 0 $spacing-xs 0;
      font-size: 24px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      @include gradient-text;
    }
    
    p {
      margin: 0;
      color: var(--el-text-color-regular);
      font-size: 14px;
      line-height: 1.5;
    }
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

.content-area {
  flex: 1;
  overflow: auto;
}

.content-card {
  @include glass-card;
  @include flex-center;
  min-height: 500px;
  padding: $spacing-4xl;
  
  .empty-icon {
    font-size: 80px;
    color: $primary-color;
    opacity: 0.6;
    animation: pulse 2s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

// 响应式设计
@include respond-to(sm) {
  .data-sync-container {
    padding: $spacing-md;
  }
  
  .page-header {
    .header-title {
      flex-direction: column;
      align-items: flex-start;
      gap: $spacing-sm;
      
      .title-icon {
        font-size: 24px;
      }
      
      h2 {
        font-size: 20px;
      }
    }
  }
  
  .content-card {
    min-height: 300px;
    padding: $spacing-lg;
    
    .empty-icon {
      font-size: 60px;
    }
  }
}
</style>
