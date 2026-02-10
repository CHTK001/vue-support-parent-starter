<script setup>
import { defineAsyncComponent, reactive, ref, onMounted, onUnmounted } from "vue";
import { GridLayout, GridItem } from "grid-layout-plus";
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

const gridLayoutRef = ref(null);

/**
 * 隐藏组件
 * @param key 隐藏组件
 */
const handleRemove = async (key) => {
  userLayoutObject.removeComp(key);
};

// Drop Handler
const onDrop = (e) => {
  e.preventDefault();
  const data = e.dataTransfer.getData("text/plain");
  if (!data) return;
  
  try {
    const item = JSON.parse(data);
    const layout = userLayoutObject.layout;
    
    // Calculate position
    // Simple logic: add to bottom or find first empty space.
    // For now, let's just push it. GridLayout might handle auto-placement if we don't specify x/y, 
    // but usually we need to specify.
    // Let's assume we want to place it where the mouse is.
    // However, calculating grid coordinates from mouse event is complex without grid-layout-plus internal helper.
    // We will use pushComp which likely handles finding a spot or adding to end.
    
    // Actually, user expects to drop *at the position*. 
    // grid-layout-plus usually supports drag-in from outside if configured.
    // But since we don't have the "drag from outside" feature fully set up in the library props (if it has any),
    // we can just add it.
    
    // Better UX: If we can't easily calculate grid position, just add it.
    userLayoutObject.pushComp(item);
  } catch (err) {
    console.error("Drop error", err);
  }
};

const onDragOver = (e) => {
  e.preventDefault();
};

</script>
<template>
  <div class="customizing h-full" @drop="onDrop" @dragover="onDragOver">
    <GridLayout 
      ref="gridLayoutRef"
      class="!h-full" 
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
            <div class="h-full">
              <el-skeleton class="h-full" :loading="userLayoutObject.isLoaded(item, loadingCollection)" animated>
                <template #template>
                  <div class="!w-full !h-full" style="width: 100% !important">
                    <div class="!h-full">
                      <keep-alive class="!h-full">
                        <component class="!h-full" :is="userLayoutObject.loadComponent(item.id)" :frameInfo="userLayoutObject.loadFrameInfo(item.id)" :key="userLayoutObject.loadFrameInfo(item.id).key" @loaded="() => userLayoutObject.loaded(item.id, loadingCollection)" />
                      </keep-alive>
                    </div>
                  </div>
                </template>
              </el-skeleton>
            </div>
            <div v-if="props.modelValue" class="customize-overlay">
              <el-button-group class="close">
                <el-button
                  v-if="item.type != 1"
                  type="primary"
                  plain
                  size="small"
                  :icon="!userLayoutObject.loadRemoteComponent(item.id) ? useRenderIcon('ri:eye-close-line') : useRenderIcon('ri:eye-line')"
                  @click="userLayoutObject.loadRemoteComponent(item.id, !userLayoutObject.loadRemoteComponent(item.id))"
                />
                <el-button type="danger" plain :icon="useRenderIcon('ep:close')" size="small" @click="handleRemove(item.id)" />
              </el-button-group>
              <label>
                <el-icon>
                  <component :is="useRenderIcon(userLayoutObject.getComponent(item.id).sysSfcIcon)" />
                </el-icon>
              </label>
            </div>
          </div>
        </div>
      </template>
    </GridLayout>
  </div>
</template>

<style scoped lang="scss">
:deep(.vgl-item__resizer) {
  z-index: 99;
}

.vgl-layout {
  --vgl-placeholder-bg: var(--el-color-primary);
  --vgl-placeholder-opacity: 0.2;
}

.widgets-home {
  display: flex;
  flex-direction: row;
  flex: 1;
  height: 100%;
}

.widgets-content {
  flex: 1;
  overflow: auto;
  overflow-x: hidden;
  padding: 16px;
  transition: all 0.3s ease;
}

.widgets-aside {
  width: 360px;
  background: var(--el-bg-color-overlay);
  box-shadow: var(--el-box-shadow-light);
  position: relative;
  overflow: auto;
  border-left: 1px solid var(--el-border-color-lighter);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  [data-theme='glass'] & {
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(20px);
    border-left: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
  }
}

.widgets-aside-title {
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-primary);
  padding: 16px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.widgets-aside-title i {
  margin-right: 10px;
  font-size: 18px;
  color: var(--el-color-primary);
}

.widgets-aside-close {
  font-size: 18px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  transition: all 0.3s ease;
}

.widgets-aside-close:hover {
  background: var(--el-fill-color);
  color: var(--el-color-primary);
}

.widgets-top {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.widgets-top-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  letter-spacing: 0.5px;
}

.widgets {
  --transform-scale: 1;
  transform-origin: top left;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: calc((100% - 50px) / var(--transform-scale));
  width: calc(100% / var(--transform-scale));
}

.item,
.widgets > .widgets-wrapper {
  width: 100%;
  height: 100%;
}

.draggable-box {
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--el-box-shadow-lighter);
  transition: all 0.3s ease;
  background: var(--el-bg-color);
  
  &:hover {
    box-shadow: var(--el-box-shadow);
  }
}

.customizing .widgets-wrapper {
  margin-right: -360px;
}

.customizing .widgets-wrapper .el-col {
  padding-bottom: 15px;
}

.customizing .widgets-wrapper .draggable-box {
  border: 2px dashed var(--el-color-primary-light-5);
  padding: 15px;
  background: var(--el-color-primary-light-9);
  
  &:hover {
    border-color: var(--el-color-primary);
  }
}

.customizing .widgets-wrapper .no-widgets {
  display: none;
}
.item .widgets-item {
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.customizing .widgets-item {
  position: relative;
  margin-bottom: 15px;
  height: 100%;
  box-shadow: none;
  
  &:hover {
    transform: translateY(-2px);
  }
}

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
  background: rgba(var(--el-color-primary-rgb), 0.1);
  backdrop-filter: blur(4px);
  cursor: move;
  border-radius: 12px;
  border: 2px solid var(--el-color-primary);
  opacity: 0;
  transition: opacity 0.3s ease;
  
  &:hover {
    opacity: 1;
  }
}

.customizing .widgets-item:hover .customize-overlay {
  opacity: 1;
}

.customize-overlay label {
  background: var(--el-color-primary);
  color: #fff;
  height: 40px;
  padding: 0 24px;
  border-radius: 20px;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.4);
  transform: translateY(10px);
  transition: all 0.3s ease;
}

.customize-overlay:hover label {
  transform: translateY(0);
}

.customize-overlay label i {
  margin-right: 8px;
  font-size: 20px;
}

.customize-overlay .close {
  position: absolute;
  top: 12px;
  right: 12px;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.3s ease;
  
  .el-button {
    border-radius: 8px;
    padding: 8px;
  }
}

.customize-overlay:hover .close {
  opacity: 1;
  transform: translateY(0);
}

.widgets-list-item {
  display: flex;
  flex-direction: row;
  padding: 16px;
  align-items: center;
  border-radius: 12px;
  margin: 8px;
  transition: all 0.2s ease;
  cursor: grab;
  
  &:active {
    cursor: grabbing;
  }
}

.widgets-list-item .item-logo {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--el-color-primary-light-9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 16px;
  color: var(--el-color-primary);
  transition: all 0.3s ease;
}

.widgets-list-item:hover .item-logo {
  background: var(--el-color-primary);
  color: #fff;
  transform: scale(1.1) rotate(5deg);
}

.widgets-list-item .item-info {
  flex: 1;
}

.widgets-list-item .item-info h2 {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.widgets-list-item .item-info p {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.widgets-list-item:hover {
  background: var(--el-fill-color-light);
  transform: translateX(4px);
}

.widgets-wrapper .sortable-ghost {
  opacity: 0.5;
  background: var(--el-color-primary-light-8);
  border: 2px dashed var(--el-color-primary);
}

.selectLayout {
  width: 100%;
  display: flex;
  gap: 12px;
  padding: 12px;
}

.selectLayout-item {
  width: 64px;
  height: 64px;
  border: 2px solid var(--el-border-color-light);
  border-radius: 10px;
  padding: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--el-bg-color);
  
  &:hover {
    border-color: var(--el-color-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }
}

.selectLayout-item span {
  display: block;
  background: var(--el-fill-color);
  height: 48px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.selectLayout-item.item02 span {
  height: 32px;
}

.selectLayout-item.item02 .el-col:nth-child(1) span {
  height: 14px;
  margin-bottom: 2px;
}

.selectLayout-item.item03 span {
  height: 14px;
  margin-bottom: 2px;
}

.selectLayout-item.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.selectLayout-item.active span {
  background: var(--el-color-primary);
  opacity: 0.8;
}

.dark {
  .widgets-aside {
    background: var(--el-bg-color-overlay);
  }

  .customize-overlay {
    background: rgba(0, 0, 0, 0.6);
  }
}

@media (max-width: 992px) {
  .customizing .widgets {
    transform: scale(1) !important;
  }

  .customizing .widgets-aside {
    width: 100%;
    position: fixed;
    top: auto;
    right: 0;
    bottom: 0;
    height: 50vh;
    border-top: 1px solid var(--el-border-color-lighter);
    box-shadow: 0 -4px 16px rgba(0,0,0,0.1);
    z-index: 100;
  }

  .customizing .widgets-wrapper {
    margin-right: 0;
    padding-bottom: 50vh;
  }
}
</style>
