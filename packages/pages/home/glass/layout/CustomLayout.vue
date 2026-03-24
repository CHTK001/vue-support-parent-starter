<script setup>
import { defineAsyncComponent } from "vue";
import { GridLayout } from "grid-layout-plus";
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
          <div class="widgets-item glass-panel">
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
                      <el-icon :size="48" class="placeholder-icon">
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
                    class="glass-button"
                    @click="userLayoutObject.loadRemoteComponent(item.id, !userLayoutObject.loadRemoteComponent(item.id))"
                  >
                    <el-icon>
                      <component :is="useRenderIcon(userLayoutObject.loadRemoteComponent(item.id) ? 'ri:eye-line' : 'ri:eye-close-line')" />
                    </el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="移除部件" placement="top">
                  <el-button type="danger" circle size="small" class="glass-button" @click="handleRemove(item.id)">
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
                  <el-tag size="small" :type="item.type === 1 ? 'success' : 'primary'" class="drag-type glass-tag">
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
  background: rgba(255, 255, 255, 0.3); // Glass resizer
  border-radius: 4px;
  opacity: 1;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.vgl-layout {
  --vgl-placeholder-bg: rgba(255, 255, 255, 0.1);
}

:deep(.vgl-item--placeholder) {
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05) !important;
  backdrop-filter: blur(4px);
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
  border-radius: 20px;
  overflow: hidden;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  will-change: transform;
  
  // Glassmorphism Style
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);

  &:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.25);
  }
}

/* 部件内容 */
.widget-content {
  border-radius: 20px;
  overflow: hidden;
}

/* 占位符样式 */
.widget-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: rgba(0, 0, 0, 0.05);
  gap: 12px;
  
  .placeholder-icon {
    color: rgba(255, 255, 255, 0.6);
  }
  
  .placeholder-text {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
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
  background: rgba(15, 23, 42, 0.6); // Darker overlay for contrast
  backdrop-filter: blur(4px);
  cursor: move;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  color: white;
}

.widgets-item:hover .customize-overlay {
  border-color: rgba(255, 255, 255, 0.6);
}

/* 操作按钮组 */
.overlay-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  z-index: 11;
  
  .glass-button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    
    &:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: scale(1.1);
    }
  }
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
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
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
  color: white;
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.drag-type {
  border-radius: 6px;
}

.glass-tag {
  background: rgba(255, 255, 255, 0.15) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: white !important;
}

.drag-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 8px;
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
  color: rgba(255, 255, 255, 0.6);
}

/* 深色模式适配 (Glass 风格通常自带暗黑感，这里做微调) */
.dark {
  .widgets-item {
    background: rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.08);
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
}
</style>
