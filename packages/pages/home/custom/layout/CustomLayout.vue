<script setup>
import { defineAsyncComponent, reactive, ref, defineProps } from "vue";
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
 * 隐藏组件
 * @param key 隐藏组件
 */
const handleRemove = async (key) => {
  userLayoutObject.removeComp(key);
};
</script>
<template>
  <div class="customizing h-full">
    <GridLayout class="!h-full" :row-height="200" v-model:layout="userLayoutObject.layout" :is-draggable="props.modelValue" :is-resizable="props.modelValue" vertical-compact use-css-transforms>
      <template #item="{ item }">
        <div class="item">
          <div class="widgets-item">
            <div class="h-full">
              <el-skeleton class="h-full" :loading="userLayoutObject.isLoaded(item, loadingCollection)" animated>
                <template #template>
                  <div class="!w-full !h-full" style="width: 100% !important">
                    <div class="!h-full" v-if="(item.type == 1 && props.modelValue) || !props.modelValue || userLayoutObject.loadRemoteComponent(item.id)">
                      <keep-alive class="!h-full">
                        <component class="!h-full" :is="userLayoutObject.loadComponent(item.id)" :frameInfo="userLayoutObject.loadFrameInfo(item.id)" :key="userLayoutObject.loadFrameInfo(item.id).key" @loaded="() => userLayoutObject.loaded(item.id, loadingCollection)" />
                      </keep-alive>
                    </div>
                    <div v-else-if="props.modelValue" class="relative h-full">
                      <component class="w-full !h-full" :is="useRenderIcon(userLayoutObject.getComponent(item.id).sysSfcIcon)" />
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
  --vgl-placeholder-bg: green;
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
  padding: 15px;
}

.widgets-aside {
  width: 360px;
  background: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: auto;
}

.widgets-aside-title {
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.widgets-aside-title i {
  margin-right: 10px;
  font-size: 18px;
}

.widgets-aside-close {
  font-size: 18px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  cursor: pointer;
}

.widgets-aside-close:hover {
  background: rgba(180, 180, 180, 0.1);
}

.widgets-top {
  margin-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.widgets-top-title {
  font-size: 18px;
  font-weight: bold;
}

.widgets {
  --transform-scale: 1;
  transform-origin: top left;
  transition: transform 0.15s;
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
}

.customizing .widgets-wrapper {
  margin-right: -360px;
}

.customizing .widgets-wrapper .el-col {
  padding-bottom: 15px;
}

.customizing .widgets-wrapper .draggable-box {
  border: 1px dashed var(--el-color-primary);
  padding: 15px;
}

.customizing .widgets-wrapper .no-widgets {
  display: none;
}
.item .widgets-item {
  height: 100%;
}
.customizing .widgets-item {
  position: relative;
  margin-bottom: 15px;
  height: 100%;
}

.customize-overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.5);
  cursor: move;
}

.customize-overlay label {
  background: var(--el-color-primary);
  color: #fff;
  height: 40px;
  padding: 0 30px;
  border-radius: 40px;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
}

.customize-overlay label i {
  margin-right: 15px;
  font-size: 24px;
}

.customize-overlay .close {
  position: absolute;
  top: 15px;
  right: 15px;
}

.customize-overlay .close:focus,
.customize-overlay .close:hover {
  background: var(--el-button-hover-color);
}

.widgets-list {
}

.widgets-list-item {
  display: flex;
  flex-direction: row;
  padding: 15px;
  align-items: center;
}

.widgets-list-item .item-logo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(180, 180, 180, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  margin-right: 15px;
  color: #6a8bad;
}

.widgets-list-item .item-info {
  flex: 1;
}

.widgets-list-item .item-info h2 {
  font-size: 16px;
  font-weight: normal;
  cursor: default;
}

.widgets-list-item .item-info p {
  font-size: 12px;
  color: #999;
  cursor: default;
}

.widgets-list-item:hover {
  background: rgba(180, 180, 180, 0.1);
}

.widgets-wrapper .sortable-ghost {
  opacity: 0.5;
}

.selectLayout {
  width: 100%;
  display: flex;
}

.selectLayout-item {
  width: 60px;
  height: 60px;
  border: 2px solid var(--el-border-color-light);
  padding: 5px;
  cursor: pointer;
  margin-right: 11px;
  margin-top: 11px;
}

.selectLayout-item span {
  display: block;
  background: var(--el-border-color-light);
  height: 46px;
}

.selectLayout-item.item02 span {
  height: 30px;
}

.selectLayout-item.item02 .el-col:nth-child(1) span {
  height: 14px;
  margin-bottom: 2px;
}

.selectLayout-item.item03 span {
  height: 14px;
  margin-bottom: 2px;
}

.selectLayout-item:hover {
  border-color: var(--el-color-primary);
}

.selectLayout-item.active {
  border-color: var(--el-color-primary);
}

.selectLayout-item.active span {
  background: var(--el-color-primary);
}

.dark {
  .widgets-aside {
    background: #2b2b2b;
  }

  .customize-overlay {
    background: rgba(43, 43, 43, 0.9);
  }
}

@media (max-width: 992px) {
  .customizing .widgets {
    transform: scale(1) !important;
  }

  .customizing .widgets-aside {
    width: 100%;
    position: absolute;
    top: 50%;
    right: 0;
    bottom: 0;
  }

  .customizing .widgets-wrapper {
    margin-right: 0;
  }
}
</style>
