<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { getConfig } from "@repo/config";
import { useLayoutLayoutStore } from "@repo/core";
import { useThemeStore } from "@layout/default/src/stores/themeStore";
import {
  defineAsyncComponent,
  nextTick,
  onBeforeMount,
  reactive,
  shallowRef,
  defineComponent,
  onErrorCaptured,
  h
} from "vue";

// 安全预览包装组件
const SafePreview = defineComponent({
  name: 'SafePreview',
  emits: ['error'],
  setup(props, { slots, emit }) {
    onErrorCaptured((err) => {
      emit('error', err);
      return false;
    });
    return () => slots.default ? slots.default() : null;
  }
});

// 预览错误状态跟踪
const previewErrors = reactive({});

const handlePreviewError = (id) => {
  previewErrors[id] = true;
};

const widgets = shallowRef();
const userLayoutObject = useLayoutLayoutStore();
const themeStore = useThemeStore();

const CustomLayout = defineAsyncComponent(
  () => import("./layout/CustomLayout.vue")
);
const openRemoteLayout = getConfig().RemoteLayout;
const openLocationLayout = getConfig().LocationLayout;
const customizing = reactive({
  customizing: true,
  hasLayout: openRemoteLayout || openLocationLayout,
});

const handeCustom = async () => {
  customizing.customizing = true;
  nextTick(() => {
    const scale = 1;
    widgets.value.style.setProperty("transform", `scale(${scale})`);
    widgets.value.style.setProperty("--transform-scale", `${scale}`);
  });
};

// Drag Logic
const onDragStart = (e, item) => {
  e.dataTransfer.setData("text/plain", JSON.stringify(item));
  e.dataTransfer.dropEffect = "copy";
};


/**
 * 恢复默认
 */
const backDefault = async () => {
  customizing.customizing = false;
  widgets.value.style.removeProperty("transform");
  userLayoutObject.resetLayout();
};
/**
 * 关闭
 */
const handleClose = async () => {
  customizing.customizing = false;
  widgets.value.style.removeProperty("transform");
};
/**
 *追加
 * @param item 追加
 */
const push = async (item) => {
  userLayoutObject.pushComp(item);
};

const handleUpdate = async () => {
  customizing.customizing = false;
  widgets.value.style.removeProperty("transform");
  userLayoutObject.saveLayout();
};
onBeforeMount(async () => {
  useLayoutLayoutStore().load();
});
</script>
<template>
  <div
    ref="main"
    :class="[
      'el-card widgets-home',
      customizing.customizing ? 'customizing' : '',
    ]"
  >
    <div class="widgets-content">
      <div class="widgets-top">
        <div class="widgets-top-title">{{ $t("buttons.board") }}</div>
        <div class="widgets-top-actions">
          <div v-if="customizing.hasLayout && themeStore.homeCustomizationEnabled">
            <el-button
              v-if="customizing.customizing"
              type="primary"
              :icon="useRenderIcon('ep:check')"
              round
              @click="handleUpdate"
              >{{ $t("buttons.finish") }}</el-button
            >
            <el-button
              v-else
              type="primary"
              :icon="useRenderIcon('ep:edit')"
              round
              @click="handeCustom"
              >{{ $t("buttons.custom") }}</el-button
            >
          </div>
        </div>
      </div>
      <div ref="widgets" class="widgets">
        <div class="widgets-wrapper">
          <div v-if="!customizing.hasLayout">
            <el-empty
              :image="widgetsImage"
              :description="$t('message.noPlugin')"
              :image-size="280"
            />
          </div>
          <div v-else class="h-full">
            <div
              v-if="!userLayoutObject.hasSettingCompent()"
              class="no-widgets"
            >
              <el-empty
                :image="widgetsImage"
                :description="$t('message.noPlugin')"
                :image-size="280"
              />
            </div>
            <CustomLayout
              v-else
              v-model="customizing.customizing"
            ></CustomLayout>
          </div>
        </div>
      </div>
    </div>
    <div v-if="customizing.customizing" class="widgets-aside">
      <el-container>
        <el-header>
          <div class="widgets-aside-title">
            <el-icon>
              <component :is="useRenderIcon('ep:circle-plus-filled')" />
            </el-icon>
            {{ $t("message.addWidget") }}
          </div>
          <div class="widgets-aside-close" @click="handleClose()">
            <el-icon>
              <component :is="useRenderIcon('ep:close')" />
            </el-icon>
          </div>
        </el-header>
        <el-main class="nopadding">
          <div class="widgets-list">
            <div
              v-if="!userLayoutObject.hasMyCompsList()"
              class="widgets-list-nodata"
            >
              <el-empty
                :description="$t('message.noPlugin')"
                :image-size="60"
              />
            </div>
            <div
              v-for="item in userLayoutObject.myCompsList()"
              :key="item.title"
              class="widgets-list-item"
              draggable="true"
              @dragstart="onDragStart($event, item)"
            >
              <div class="item-logo">
                <el-icon>
                  <component :is="useRenderIcon(item.icon)" />
                </el-icon>
              </div>
              <div class="item-info">
                <h2>{{ item.title }}</h2>
                <p>{{ item.description }}</p>
              </div>
              <div class="item-actions">
                <el-button
                  type="primary"
                  :icon="useRenderIcon('ep:plus')"
                  size="small"
                  @click="push(item)"
                />
              </div>
            </div>
          </div>
        </el-main>
        <el-footer style="height: 51px; background-color: var(--el-bg-color)">
          <el-button size="small" @click="backDefault()">{{
            $t("buttons.default")
          }}</el-button>
        </el-footer>
      </el-container>
    </div>
  </div>
</template>

<style scoped lang="scss">
:deep(.vgl-item__resizer) {
  z-index: 99;
}

.vgl-layout {
  --vgl-placeholder-bg: var(--el-color-primary);
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

/* 添加部件侧边栏 - 美化 */
.widgets-aside {
  width: 340px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--el-border-color-lighter);
  z-index: 100;
}

.widgets-aside :deep(.el-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 56px !important;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: transparent;
}

.widgets-aside-title {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  color: var(--el-text-color-primary);
  gap: 10px;
  letter-spacing: 0.5px;
}

.widgets-aside-title i {
  font-size: 20px;
  color: var(--el-color-primary);
}

.widgets-aside-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.widgets-aside-close:hover {
  background: var(--el-fill-color);
  color: var(--el-color-danger);
  transform: rotate(90deg);
}

/* 部件列表 */
.widgets-list {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.widgets-list-nodata {
  grid-column: span 2;
  padding: 40px 20px;
  text-align: center;
}

.widgets-list-item {
  display: flex;
  flex-direction: column;
  padding: 16px;
  align-items: center;
  border-radius: 16px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  position: relative;
  overflow: hidden;
}

.widgets-list-item:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  transform: translateY(-4px);
}

.widgets-list-item .item-logo {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--el-color-primary-light-9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: 12px;
  color: var(--el-color-primary);
  transition: all 0.4s ease;
}

/* Added for preview */
.widgets-list-item.has-preview {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  .item-info {
    padding: 12px 16px;
    width: 100%;
    margin-top: auto;
    background: var(--el-bg-color);
    position: relative;
    z-index: 5;
    border-top: 1px solid var(--el-border-color-lighter);
  }
  
  .item-actions {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 20;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.3s;
    
    .el-button {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border: none;
      
      &:hover {
        background: var(--el-color-primary);
        color: #fff;
      }
    }
  }
}

.widgets-list-item.has-preview:hover .item-actions {
  opacity: 1;
  transform: translateY(0);
}

.item-preview {
  width: 100%;
  height: 120px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.preview-scaler {
  width: 200%;
  height: 200%;
  transform: scale(0.5);
  transform-origin: top left;
  pointer-events: none; /* 让事件穿透到遮罩 */
}

.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  cursor: grab;
  background: transparent;
  transition: background 0.3s;
}

.widgets-list-item:hover .item-preview .preview-overlay {
  background: rgba(0, 0, 0, 0.02);
}

.widgets-list-item:hover .item-logo {
  background: var(--el-color-primary);
  color: #fff;
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 4px 12px var(--el-color-primary-light-5);
}

.widgets-list-item .item-info {
  width: 100%;
  text-align: center;
  margin-bottom: 8px;
}

.widgets-list-item .item-info h2 {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.widgets-list-item .item-info p {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 34px; /* Fixed height for 2 lines */
}

.widgets-list-item .item-actions {
  width: 100%;
  margin-top: auto;
}

.widgets-list-item .item-actions .el-button {
  width: 100%;
  border-radius: 8px;
  height: 32px;
  font-weight: 500;
}

/* 底部操作栏 */
.widgets-aside :deep(.el-footer) {
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid var(--el-border-color-lighter);
  background: transparent;
  backdrop-filter: blur(10px);
}

/* 暗黑模式适配 */
html.dark .widgets-aside {
  background: rgba(30, 30, 30, 0.85);
  border-left: 1px solid var(--el-border-color-darker);
}

html.dark .widgets-list-item {
  background: var(--el-bg-color-overlay);
  border-color: var(--el-border-color-darker);
}

html.dark .widgets-list-item:hover {
  border-color: var(--el-color-primary);
  background: var(--el-bg-color-overlay);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

html.dark .item-logo {
  background: var(--el-color-primary-light-8);
}

/* 自定义模式 */
.customizing .widgets-wrapper {
  margin-right: -320px;
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
