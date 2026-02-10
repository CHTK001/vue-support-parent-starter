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
} from "vue";

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
  width: 320px;
  background: var(--el-bg-color);
  box-shadow: -2px 0 12px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.widgets-aside :deep(.el-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  height: 50px !important;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-color-primary);
}

.widgets-aside-title {
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  color: #fff;
  gap: 8px;
}

.widgets-aside-title i {
  font-size: 18px;
}

.widgets-aside-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.85);
  transition: all 0.2s;
}

.widgets-aside-close:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

/* 部件列表 */
.widgets-list {
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
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
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: var(--el-color-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
}

.widgets-list-item .item-logo {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--el-color-primary-light-9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 12px;
  color: var(--el-color-primary);
  transition: all 0.3s ease;
}

.widgets-list-item:hover .item-logo {
  background: var(--el-color-primary);
  color: #fff;
  transform: scale(1.1) rotate(5deg);
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
}

/* 底部操作栏 */
.widgets-aside :deep(.el-footer) {
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
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
