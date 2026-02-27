<script setup lang="ts">
/**
 * 路由加载骨架屏组件
 * 用于 Suspense fallback 和路由切换时的加载状态
 * @author Auto-generated
 * @version 1.0.0
 */
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    /** 骨架屏行数 */
    rows?: number;
    /** 是否显示头部 */
    showHeader?: boolean;
    /** 是否显示侧边栏 */
    showSidebar?: boolean;
    /** 加载提示文本 */
    loadingText?: string;
    /** 最小高度 */
    minHeight?: string;
  }>(),
  {
    rows: 6,
    showHeader: true,
    showSidebar: false,
    loadingText: "加载中...",
    minHeight: "400px",
  }
);

const containerStyle = computed(() => ({
  minHeight: props.minHeight,
}));
</script>

<template>
  <div class="route-loading-skeleton" :style="containerStyle">
    <!-- 头部骨架 -->
    <div v-if="showHeader" class="skeleton-header">
      <el-skeleton :rows="0" animated>
        <template #template>
          <div class="header-content">
            <el-skeleton-item variant="text" style="width: 120px; height: 24px" />
            <div class="header-actions">
              <el-skeleton-item variant="button" style="width: 80px" />
              <el-skeleton-item variant="button" style="width: 80px" />
            </div>
          </div>
        </template>
      </el-skeleton>
    </div>

    <!-- 主体内容骨架 -->
    <div class="skeleton-body">
      <el-skeleton :rows="rows" animated>
        <template #template>
          <div class="body-content">
            <!-- 工具栏区域 -->
            <div class="toolbar-skeleton">
              <el-skeleton-item variant="button" style="width: 100px" />
              <el-skeleton-item variant="button" style="width: 100px" />
              <el-skeleton-item variant="text" style="width: 200px; margin-left: auto" />
            </div>
            
            <!-- 表格/内容区域 -->
            <div class="table-skeleton">
              <!-- 表头 -->
              <div class="table-header-skeleton">
                <el-skeleton-item v-for="i in 5" :key="i" variant="text" style="flex: 1" />
              </div>
              <!-- 表格行 -->
              <div v-for="row in rows" :key="row" class="table-row-skeleton">
                <el-skeleton-item v-for="i in 5" :key="i" variant="text" style="flex: 1" />
              </div>
            </div>
          </div>
        </template>
      </el-skeleton>
    </div>

    <!-- 加载提示 -->
    <div class="loading-indicator">
      <ScIcon class="loading-icon">
        <svg viewBox="0 0 24 24" class="spin-icon">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="31.4" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
          </circle>
        </svg>
      </ScIcon>
      <span class="loading-text">{{ loadingText }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.route-loading-skeleton {
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: var(--el-bg-color);
  position: relative;
}

.skeleton-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  
  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.skeleton-body {
  flex: 1;
  
  .body-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .toolbar-skeleton {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
  }
  
  .table-skeleton {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 4px;
    overflow: hidden;
  }
  
  .table-header-skeleton {
    display: flex;
    gap: 16px;
    padding: 12px 16px;
    background: var(--el-fill-color-light);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
  
  .table-row-skeleton {
    display: flex;
    gap: 16px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    
    &:last-child {
      border-bottom: none;
    }
  }
}

.loading-indicator {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--el-bg-color);
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  
  .loading-icon {
    font-size: 18px;
    color: var(--el-color-primary);
  }
  
  .spin-icon {
    width: 18px;
    height: 18px;
  }
  
  .loading-text {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}

// 深色模式适配
.dark {
  .loading-indicator {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  }
}
</style>
