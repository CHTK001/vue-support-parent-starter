<template>
  <div class="data-analysis-container system-container modern-bg">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <IconifyIconOnline icon="ri:bar-chart-box-line" class="title-icon" />
          <div>
            <h2>数据分析</h2>
            <p>对系统数据进行统计分析和可视化展示</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 内容区域 -->
    <div class="content-area">
      <div class="content-card">
        <el-empty description="数据分析功能开发中...">
          <template #image>
            <div class="empty-icon">
              <IconifyIconOnline icon="ri:bar-chart-box-line" />
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
  name: "DataAnalysis"
});
</script>

<style lang="scss" scoped>
@use "@/styles/mixins.scss" as *;

.data-analysis-container {
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
    animation: float 3s ease-in-out infinite;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

// 响应式设计
@include respond-to(sm) {
  .data-analysis-container {
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
