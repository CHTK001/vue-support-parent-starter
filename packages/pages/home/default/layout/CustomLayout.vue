<script setup>
import { defineAsyncComponent, reactive, ref, computed } from "vue";
import { GridLayout } from "grid-layout-plus";
import Widgets from "@repo/assets/svg/no-widgets.svg?component";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { useLayoutLayoutStore } from "@repo/core";

const loadingCollection = {};
const userLayoutObject = useLayoutLayoutStore();

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

/**
 * 获取部件标题
 * @param key 部件key
 */
const getWidgetTitle = (key) => {
  const comp = userLayoutObject.getComponent(key);
  return comp?.sysSfcChineseName || comp?.sysSfcName || '未命名部件';
};

/**
 * 获取部件类型标签
 * @param item 部件项
 */
const getTypeLabel = (item) => {
  return item.type === 1 ? '本地' : '远程';
};

/**
 * 隐藏组件
 * @param key 隐藏组件
 */
const handleRemove = async (key) => {
  userLayoutObject.removeComp(key);
};
</script>
<template>
  <div class="customizing h-full">
    <GridLayout 
      class="!h-full grid-layout-container" 
      :row-height="200" 
      v-model:layout="userLayoutObject.layout" 
      :is-draggable="props.modelValue" 
      :is-resizable="props.modelValue" 
      vertical-compact 
      use-css-transforms
    >
      <template #item="{ item }">
        <div class="item">
          <div class="widgets-item">
            <!-- 部件内容 -->
            <div class="widget-content h-full">
              <el-skeleton class="h-full" :loading="userLayoutObject.isLoaded(item, loadingCollection)" animated>
                <template #template>
                  <div class="!w-full !h-full" style="width: 100% !important">
                    <div class="!h-full" v-if="(item.type == 1 && props.modelValue) || !props.modelValue || userLayoutObject.loadRemoteComponent(item.id)">
                      <keep-alive class="!h-full">
                        <component 
                          class="!h-full" 
                          :is="userLayoutObject.loadComponent(item.id)" 
                          :frameInfo="userLayoutObject.loadFrameInfo(item.id)" 
                          :key="userLayoutObject.loadFrameInfo(item.id).key" 
                          @loaded="() => userLayoutObject.loaded(item.id, loadingCollection)" 
                        />
                      </keep-alive>
                    </div>
                    <div v-else-if="props.modelValue" class="widget-placeholder">
                      <el-icon :size="48" color="var(--el-color-primary-light-5)">
                        <component :is="useRenderIcon(userLayoutObject.getComponent(item.id).sysSfcIcon || 'ri:apps-line')" />
                      </el-icon>
                      <span class="placeholder-text">{{ getWidgetTitle(item.id) }}</span>
                    </div>
                  </div>
                </template>
              </el-skeleton>
            </div>
            
            <!-- 编辑模式遮罩层 -->
            <div v-if="props.modelValue" class="customize-overlay">
              <!-- 操作按钮组 -->
              <div class="overlay-actions">
                <el-tooltip content="预览/隐藏" placement="top" v-if="item.type != 1">
                  <el-button
                    :type="userLayoutObject.loadRemoteComponent(item.id) ? 'primary' : 'info'"
                    circle
                    size="small"
                    @click="userLayoutObject.loadRemoteComponent(item.id, !userLayoutObject.loadRemoteComponent(item.id))"
                  >
                    <el-icon>
                      <component :is="useRenderIcon(userLayoutObject.loadRemoteComponent(item.id) ? 'ri:eye-line' : 'ri:eye-close-line')" />
                    </el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="移除部件" placement="top">
                  <el-button type="danger" circle size="small" @click="handleRemove(item.id)">
                    <el-icon><component :is="useRenderIcon('ep:delete')" /></el-icon>
                  </el-button>
                </el-tooltip>
              </div>
              
              <!-- 拖拽区域 -->
              <div class="drag-area">
                <div class="drag-icon">
                  <el-icon :size="28">
                    <component :is="useRenderIcon(userLayoutObject.getComponent(item.id).sysSfcIcon || 'ri:apps-line')" />
                  </el-icon>
                </div>
                <div class="drag-info">
                  <span class="drag-title">{{ getWidgetTitle(item.id) }}</span>
                  <el-tag size="small" :type="item.type === 1 ? 'success' : 'primary'" class="drag-type">
                    {{ getTypeLabel(item) }}
                  </el-tag>
                </div>
                <div class="drag-hint">
                  <el-icon :size="14"><component :is="useRenderIcon('ri:drag-move-2-line')" /></el-icon>
                  <span>拖拽移动</span>
                </div>
              </div>
              
              <!-- 调整大小提示 -->
              <div class="resize-hint">
                <el-icon :size="12"><component :is="useRenderIcon('ri:expand-diagonal-line')" /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </template>
    </GridLayout>
  </div>
</template>

<style scoped lang="scss">
/* Grid Layout 样式 */
:deep(.vgl-item) {
  transition: none !important;
}

:deep(.vgl-item__resizer) {
  z-index: 99;
  width: 16px !important;
  height: 16px !important;
  bottom: 4px !important;
  right: 4px !important;
  background: var(--el-color-primary);
  border-radius: 4px;
  opacity: 1;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.2);
  }
}

.vgl-layout {
  --vgl-placeholder-bg: var(--el-color-primary-light-7);
}

:deep(.vgl-item--placeholder) {
  border: 2px dashed var(--el-color-primary);
  border-radius: 12px;
  background: var(--el-color-primary-light-9) !important;
  opacity: 0.6 !important;
}

/* 基础布局 */
.grid-layout-container {
  padding: 8px;
}

.item {
  width: 100%;
  height: 100%;
}

.widgets-item {
  position: relative;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: var(--el-bg-color);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s ease, background 0.3s ease;
  will-change: transform;
  
  /* Glassmorphism Support */
  [data-theme='glass'] & {
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(12px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
}

.widgets-item:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  
  [data-theme='glass'] & {
    background: rgba(255, 255, 255, 0.75);
    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
  }
}

/* 部件内容 */
.widget-content {
  border-radius: 12px;
  overflow: hidden;
}

/* 占位符样式 */
.widget-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: linear-gradient(135deg, var(--el-fill-color-light), var(--el-fill-color));
  gap: 12px;
  
  [data-theme='glass'] & {
    background: transparent;
  }
  
  .placeholder-text {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    font-weight: 500;
  }
}

/* 编辑模式遮罩层 */
.customize-overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  cursor: move;
  border: 2px dashed var(--el-color-primary-light-3);
  border-radius: 12px;
  backdrop-filter: blur(4px);
  
  [data-theme='glass'] & {
    background: rgba(255, 255, 255, 0.4);
    border-color: rgba(255, 255, 255, 0.5);
  }
}

.widgets-item:hover .customize-overlay {
  border-color: var(--el-color-primary);
}

/* 操作按钮组 */
.overlay-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  z-index: 11;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.3s ease;
  
  :deep(.el-button) {
    width: 32px;
    height: 32px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    &:hover {
      transform: scale(1.1);
    }
  }
}

.widgets-item:hover .overlay-actions {
  opacity: 1;
  transform: translateY(0);
}

/* 拖拽区域 */
.drag-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
}

.drag-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--el-color-primary-light-7), var(--el-color-primary-light-5));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-primary);
  margin-bottom: 4px;
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
  transition: transform 0.3s ease;
  
  [data-theme='glass'] & {
    background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.2), rgba(var(--el-color-primary-rgb), 0.4));
  }
}

.widgets-item:hover .drag-icon {
  transform: scale(1.1) rotate(5deg);
}

.drag-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.drag-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.drag-type {
  border-radius: 4px;
}

.drag-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-top: 8px;
  opacity: 0.8;
}

/* 调整大小提示 */
.resize-hint {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-primary);
  opacity: 0.6;
}

/* 深色模式 */
.dark {
  .widgets-item {
    background: var(--el-bg-color);
    
    [data-theme='glass'] & {
      background: rgba(30, 30, 30, 0.6);
      border-color: rgba(255, 255, 255, 0.1);
    }
  }
  
  .customize-overlay {
    background: rgba(30, 30, 30, 0.9);
    backdrop-filter: blur(8px);
    
    [data-theme='glass'] & {
      background: rgba(0, 0, 0, 0.5);
    }
  }
  
  .widgets-item:hover .customize-overlay {
    background: rgba(30, 30, 30, 0.95);
    
    [data-theme='glass'] & {
      background: rgba(0, 0, 0, 0.6);
    }
  }
  
  .widget-placeholder {
    background: linear-gradient(135deg, var(--el-fill-color), var(--el-fill-color-dark));
    
    [data-theme='glass'] & {
      background: transparent;
    }
  }
  
  .drag-icon {
    background: linear-gradient(135deg, var(--el-color-primary-dark-2), var(--el-color-primary));
    color: #fff;
  }
}

/* 拖拽幽灵样式 */
.widgets-wrapper .sortable-ghost {
  opacity: 0.5;
}

/* 响应式 */
@media (max-width: 768px) {
  .drag-area {
    padding: 12px;
  }
  
  .drag-icon {
    width: 44px;
    height: 44px;
  }
  
  .drag-title {
    font-size: 13px;
  }
  
  .overlay-actions :deep(.el-button) {
    width: 28px;
    height: 28px;
  }
}
</style>
