<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { getConfig } from "@repo/config";
import { useLayoutLayoutStore } from "@repo/core";
import {
  defineAsyncComponent,
  nextTick,
  onBeforeMount,
  reactive,
  shallowRef,
} from "vue";

const widgets = shallowRef();
const userLayoutObject = useLayoutLayoutStore();

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
          <div v-if="customizing.hasLayout">
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
  --vgl-placeholder-bg: #1890ff;
}

/* 主容器 */
.widgets-home {
  display: flex;
  flex-direction: row;
  flex: 1;
  height: 100%;
  background: #f5f7fa;
}

/* 内容区 */
.widgets-content {
  flex: 1;
  overflow: auto;
  overflow-x: hidden;
  padding: 24px;
}

/* 顶部标题栏 */
.widgets-top {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.widgets-top-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

/* 部件展示区 */
.widgets {
  --transform-scale: 1;
  transform-origin: top left;
  transition: transform 0.2s ease;
  height: calc((100% - 80px) / var(--transform-scale));
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

/* 添加部件侧边栏 */
.widgets-aside {
  width: 320px;
  background: #fff;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #f0f0f0;
}

.widgets-aside :deep(.el-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 56px !important;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.widgets-aside-title {
  font-size: 15px;
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
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.2s;
}

.widgets-aside-close:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

/* 部件列表 */
.widgets-list {
  padding: 12px;
}

.widgets-list-nodata {
  padding: 40px 20px;
  text-align: center;
}

.widgets-list-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  margin-bottom: 8px;
  border-radius: 10px;
  background: #f8f9fc;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  cursor: pointer;
}

.widgets-list-item:hover {
  background: #fff;
  border-color: #e8e8e8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transform: translateX(-2px);
}

.widgets-list-item .item-logo {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 14px;
  color: #fff;
  flex-shrink: 0;
}

.widgets-list-item .item-info {
  flex: 1;
  min-width: 0;
}

.widgets-list-item .item-info h2 {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.widgets-list-item .item-info p {
  font-size: 12px;
  color: #999;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.widgets-list-item .item-actions {
  flex-shrink: 0;
  margin-left: 12px;
}

.widgets-list-item .item-actions :deep(.el-button) {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 8px;
}

/* 底部操作栏 */
.widgets-aside :deep(.el-footer) {
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

/* 自定义模式 */
.customizing .widgets-wrapper {
  margin-right: -320px;
}

.customizing .widgets-wrapper .el-col {
  padding-bottom: 16px;
}

.customizing .widgets-wrapper .draggable-box {
  border: 2px dashed #1890ff;
  border-radius: 8px;
  padding: 16px;
  background: rgba(24, 144, 255, 0.02);
}

.customizing .widgets-wrapper .no-widgets {
  display: none;
}

.item .widgets-item {
  height: 100%;
}

.customizing .widgets-item {
  position: relative;
  margin-bottom: 16px;
  height: 100%;
}

/* 拖拽遮罩 */
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
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(4px);
  cursor: move;
  border-radius: 8px;
}

.customize-overlay label {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  height: 44px;
  padding: 0 28px;
  border-radius: 22px;
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.customize-overlay label i {
  margin-right: 10px;
  font-size: 20px;
}

.customize-overlay .close {
  position: absolute;
  top: 12px;
  right: 12px;
}

.customize-overlay .close:focus,
.customize-overlay .close:hover {
  background: var(--el-button-hover-color);
}

.widgets-wrapper .sortable-ghost {
  opacity: 0.5;
}

/* 布局选择 */
.selectLayout {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.selectLayout-item {
  width: 60px;
  height: 60px;
  border: 2px solid #e8e8e8;
  padding: 6px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.selectLayout-item span {
  display: block;
  background: #e8e8e8;
  height: 44px;
  border-radius: 4px;
}

.selectLayout-item.item02 span {
  height: 28px;
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
  border-color: #1890ff;
}

.selectLayout-item.active {
  border-color: #1890ff;
  background: rgba(24, 144, 255, 0.05);
}

.selectLayout-item.active span {
  background: #1890ff;
}

/* 暗色模式 */
.dark {
  .widgets-home {
    background: #1a1a1a;
  }

  .widgets-top {
    background: #2b2b2b;
  }

  .widgets-top-title {
    color: #e5e5e5;
  }

  .widgets-aside {
    background: #2b2b2b;
    border-left-color: #3a3a3a;
  }

  .widgets-aside :deep(.el-header) {
    border-bottom-color: #3a3a3a;
  }

  .widgets-list-item {
    background: #333;
  }

  .widgets-list-item:hover {
    background: #3a3a3a;
    border-color: #444;
  }

  .widgets-list-item .item-info h2 {
    color: #e5e5e5;
  }

  .customize-overlay {
    background: rgba(43, 43, 43, 0.9);
  }

  .widgets-aside :deep(.el-footer) {
    background: #222;
    border-top-color: #3a3a3a;
  }
}

/* 响应式 */
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
    border-radius: 16px 16px 0 0;
  }

  .customizing .widgets-wrapper {
    margin-right: 0;
  }
}
</style>
