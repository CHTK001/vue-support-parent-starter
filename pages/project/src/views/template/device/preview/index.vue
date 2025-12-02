<template>
  <div class="device-camera-container">
    <div class="device-camera-setting">
      <div
        :class="{ 'device-camera-show-content': !showSetting }"
        class="device-camera-setting-content"
      >
        <div v-if="showSetting" class="device-camera-setting-inner">
          <div class="device-camera-options">
            <div class="device-camera-option-group">
              <el-row><b>设备选择</b></el-row>
              <el-row class="device-camera-select-layout">
                <el-segmented
                  v-model="env.showOrHide"
                  @change="handleShowOrHide"
                  class="device-camera-segmented"
                  :options="[
                    {
                      label: '显示',
                      value: true,
                    },
                    {
                      label: '隐藏',
                      value: false,
                    },
                  ]"
                ></el-segmented>
              </el-row>
            </div>
            <div
              class="device-camera-option-group device-camera-layout-options"
            >
              <el-row><b>布局方式</b></el-row>
              <el-row class="device-camera-select-layout">
                <el-col
                  :span="3"
                  class="device-camera-layout-item device-camera-item00"
                  :class="{ 'device-camera-active': env.layout == 1 }"
                  @click="setLayout(1)"
                  title="1"
                >
                  <el-row :gutter="2">
                    <el-col :span="24"><span /></el-col>
                  </el-row>
                </el-col>
                <el-col
                  :span="3"
                  class="device-camera-layout-item device-camera-item03"
                  :class="{ 'device-camera-active': env.layout == 2 }"
                  @click="setLayout(2)"
                  title="2x2"
                >
                  <el-row :gutter="2" class="h-[45px]">
                    <el-col :span="12"><span /></el-col>
                    <el-col :span="12"><span /></el-col>
                    <el-col :span="12"><span /></el-col>
                    <el-col :span="12"><span /></el-col>
                  </el-row>
                </el-col>
                <el-col
                  :span="3"
                  class="device-camera-layout-item device-camera-item04"
                  :class="{ 'device-camera-active': env.layout == 3 }"
                  @click="setLayout(3)"
                  title="3x3"
                >
                  <el-row :gutter="2">
                    <el-col :span="8"><span /></el-col>
                    <el-col :span="8"><span /></el-col>
                    <el-col :span="8"><span /></el-col>
                    <el-col :span="8"><span /></el-col>
                    <el-col :span="8"><span /></el-col>
                    <el-col :span="8"><span /></el-col>
                    <el-col :span="8"><span /></el-col>
                    <el-col :span="8"><span /></el-col>
                    <el-col :span="8"><span /></el-col>
                  </el-row>
                </el-col>
              </el-row>
            </div>
          </div>
        </div>
      </div>
      <div class="device-camera-toggle">
        <div></div>
        <el-icon
          class="device-camera-toggle-btn"
          color="white"
          size="24"
          @click="() => (showSetting = !showSetting)"
        >
          <component :is="useRenderIcon('ep:arrow-down')" v-if="showSetting" />
          <component :is="useRenderIcon('ep:arrow-up')" v-else />
        </el-icon>
        <div></div>
      </div>
    </div>
    <el-container ref="videoAreaRef" class="device-camera-video-area">
      <div class="device-camera-video-container">
        <template v-if="env.layout == 1">
          <el-row class="device-camera-video-row device-camera-single">
            <el-col :span="24">
              <CameraPreviewDialog
                :autoOrHide="env.autoOrHide"
                :ref="(el) => (refs['01'] = el)"
                :form="env.form"
                :devices="env.devices"
                key="01"
                diff="01"
              />
            </el-col>
          </el-row>
        </template>
        <template v-else-if="env.layout == 2">
          <el-row
            :gutter="2"
            class="device-camera-video-row device-camera-grid-2"
          >
            <el-col :span="12" class="device-camera-video-item">
              <CameraPreviewDialog
                :autoOrHide="env.autoOrHide"
                :ref="(el) => (refs['01'] = el)"
                :form="env.form"
                :devices="env.devices"
                key="01"
                diff="01"
              />
            </el-col>
            <el-col :span="12" class="device-camera-video-item">
              <CameraPreviewDialog
                :autoOrHide="env.autoOrHide"
                :ref="(el) => (refs['02'] = el)"
                :form="env.form"
                :devices="env.devices"
                key="02"
                diff="02"
              />
            </el-col>
          </el-row>
          <el-row
            :gutter="2"
            class="device-camera-video-row device-camera-grid-2"
          >
            <el-col :span="12" class="device-camera-video-item">
              <CameraPreviewDialog
                :autoOrHide="env.autoOrHide"
                :ref="(el) => (refs['11'] = el)"
                :form="env.form"
                :devices="env.devices"
                key="11"
                diff="11"
              />
            </el-col>
            <el-col :span="12" class="device-camera-video-item">
              <CameraPreviewDialog
                :autoOrHide="env.autoOrHide"
                :ref="(el) => (refs['12'] = el)"
                :form="env.form"
                :devices="env.devices"
                key="12"
                diff="12"
              />
            </el-col>
          </el-row>
        </template>
        <template v-else-if="env.layout == 3">
          <el-row
            :gutter="2"
            class="device-camera-video-row device-camera-grid-3"
          >
            <el-col :span="8" class="device-camera-video-item">
              <CameraPreviewDialog
                :autoOrHide="env.autoOrHide"
                :ref="(el) => (refs['01'] = el)"
                :form="env.form"
                :devices="env.devices"
                key="01"
                diff="01"
              />
            </el-col>
            <el-col :span="8" class="device-camera-video-item">
              <CameraPreviewDialog
                :autoOrHide="env.autoOrHide"
                :ref="(el) => (refs['02'] = el)"
                :form="env.form"
                :devices="env.devices"
                key="02"
                diff="02"
              />
            </el-col>
            <el-col :span="8" class="device-camera-video-item">
              <CameraPreviewDialog
                :autoOrHide="env.autoOrHide"
                :ref="(el) => (refs['03'] = el)"
                :form="env.form"
                :devices="env.devices"
                key="03"
                diff="03"
              />
            </el-col>
          </el-row>
          <el-row
            :gutter="2"
            class="device-camera-video-row device-camera-grid-3"
          >
            <el-col :span="8" class="device-camera-video-item">
              <CameraPreviewDialog
                :autoOrHide="env.autoOrHide"
                :ref="(el) => (refs['11'] = el)"
                :form="env.form"
                :devices="env.devices"
                key="11"
                diff="11"
              />
            </el-col>
            <el-col :span="8" class="device-camera-video-item">
              <CameraPreviewDialog
                :autoOrHide="env.autoOrHide"
                :ref="(el) => (refs['12'] = el)"
                :form="env.form"
                :devices="env.devices"
                key="12"
                diff="12"
              />
            </el-col>
            <el-col :span="8" class="device-camera-video-item">
              <CameraPreviewDialog
                :autoOrHide="env.autoOrHide"
                :ref="(el) => (refs['13'] = el)"
                :form="env.form"
                :devices="env.devices"
                key="13"
                diff="13"
              />
            </el-col>
          </el-row>
          <el-row
            :gutter="2"
            class="device-camera-video-row device-camera-grid-3"
          >
            <el-col :span="8" class="device-camera-video-item">
              <CameraPreviewDialog
                :autoOrHide="env.autoOrHide"
                :ref="(el) => (refs['21'] = el)"
                :form="env.form"
                :devices="env.devices"
                key="21"
                name="21"
              />
            </el-col>
            <el-col :span="8" class="device-camera-video-item">
              <CameraPreviewDialog
                :autoOrHide="env.autoOrHide"
                :ref="(el) => (refs['22'] = el)"
                :form="env.form"
                :devices="env.devices"
                key="22"
                name="22"
              />
            </el-col>
            <el-col :span="8" class="device-camera-video-item">
              <CameraPreviewDialog
                :autoOrHide="env.autoOrHide"
                :ref="(el) => (refs['23'] = el)"
                :form="env.form"
                :devices="env.devices"
                key="23"
                name="23"
              />
            </el-col>
          </el-row>
        </template>
      </div>
    </el-container>
  </div>
</template>

<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message } from "@repo/utils";
import { useRoute, useRouter } from "vue-router";
import {
  defineAsyncComponent,
  defineExpose,
  nextTick,
  reactive,
  shallowRef,
  getCurrentInstance,
  handleError,
  onMounted,
  onUnmounted,
} from "vue";
import LoadingComponent from "@repo/components/ScLoadCompent/index.vue";
import { useFullscreen } from "@vueuse/core";
import { Base64 } from "js-base64";
import * as _ from "lodash-es";
const videoAreaRef = shallowRef();
const { isFullscreen, toggle } = useFullscreen(videoAreaRef);

const showSetting = shallowRef(false);
const CameraPreviewDialog = defineAsyncComponent({
  loader: () => import("./camera-preview.vue"),
  loadingComponent: LoadingComponent,
});

onMounted(() => {
  const _route = useRoute();
  try {
    handleOpen(JSON.parse(Base64.decode(_route.query.data)), "view");
  } catch (error) {}
});

onUnmounted(async () => {
  handleClose();
});
const settingOpen = shallowRef(false);
const env = reactive({
  visible: false,
  showOrHide: false,
  fullscreen: false,
  title: "预览",
  form: {},
  layout: 1,
});

const refs = {};
const setLayout = async (value) => {
  env.layout = value;
  handleOpenCanvas();
};

const handleToggle = async () => {
  if (settingOpen.value) {
    handleTrigger();
  }
  toggle();
};

const handleTrigger = async () => {
  settingOpen.value = !settingOpen.value;
  window.aside?.style.setProperty(
    "--aside-width",
    settingOpen.value ? "300px" : "55px"
  );
};

isFullscreen.value = !!(
  document.fullscreenElement ||
  document.webkitFullscreenElement ||
  document.mozFullScreenElement ||
  document.msFullscreenElement
);

const handleOpen = async (item, mode) => {
  env.visible = true;
  env.mode = mode;
  if (_.isArray(item)) {
    env.devices = item;
  } else {
    env.form = item;
    env.devices = [item];
    env.title = "预览" + item.sysDeviceName;
  }
  nextTick(() => {
    handleTrigger();
    setTimeout(async () => {
      setLayout(1);
    }, 200);
  });
};

const handleOpenCanvas = async () => {
  nextTick(() => {
    const _value = Object.values(refs).filter(Boolean);
    _value.forEach((item) => {
      item?.handleOpen(env.isFullscreen);
    });
  });
};
const handleShowOrHide = async () => {
  nextTick(() => {
    const _value = Object.values(refs).filter(Boolean);
    _value.forEach((item) => {
      item?.handleShowOrHide(!env.showOrHide);
    });
  });
};
const handleOpenRealCanvas = async () => {
  if (!channelValue.value || channelValue.value.length == 0) {
    message("请选择管道", { type: "warning" });
    return;
  }
  handleClose();
  cameraPreviewDialogRef.value.handleOpen(env.form, channelValue.value);
};

const cameraPreviewDialogRef = shallowRef();
const handleClose = async () => {
  env.visible = false;
  cameraPreviewDialogRef.value?.handleClose();
};

defineExpose({
  handleOpen,
  handleClose,
});
</script>

<style scoped lang="scss">
/* 动画定义 */
@keyframes device-camera-fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes device-camera-scale-in {
  from {
    transform: scale(0.95);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes device-camera-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0.4);
  }

  70% {
    box-shadow: 0 0 0 10px rgba(var(--el-color-primary-rgb), 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0);
  }
}

@keyframes device-camera-glow {
  0% {
    box-shadow: 0 0 5px rgba(var(--el-color-primary-rgb), 0.5);
  }

  50% {
    box-shadow: 0 0 20px rgba(var(--el-color-primary-rgb), 0.8);
  }

  100% {
    box-shadow: 0 0 5px rgba(var(--el-color-primary-rgb), 0.5);
  }
}

/* 主容器样式 */
.device-camera-container {
  height: 100vh;
  width: 100vw;
  background-color: var(--el-bg-color-page);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 设置面板样式 */
.device-camera-setting {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  width: 100vw;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  z-index: 9999;
}

.device-camera-setting-content {
  height: 160px;
  /* 进一步增加高度，确保布局选项完全显示 */
  width: 100vw;
  backdrop-filter: blur(15px);
  background-color: rgba(var(--el-bg-color-rgb), 0.85);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  animation: device-camera-fade-in 0.5s ease-out;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.device-camera-show-content {
  height: 0 !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.device-camera-setting-inner {
  padding: 16px 24px;
  height: 100%;
}

.device-camera-options {
  display: flex;
  gap: 32px;
  color: var(--el-text-color-primary);
  flex-wrap: wrap;
  align-items: flex-start;
  /* 确保项目从顶部对齐 */
}

.device-camera-option-group {
  margin-bottom: 16px;

  b {
    font-size: 14px;
    margin-bottom: 10px;
    display: inline-block;
    color: var(--el-text-color-primary);
    position: relative;
    padding-left: 12px;

    &:before {
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 14px;
      background: var(--el-color-primary);
      border-radius: 2px;
    }
  }
}

.device-camera-select-layout {
  width: 100%;
  display: flex;
  margin-top: 10px;
  flex-wrap: wrap;
  /* 允许内容换行 */
}

.device-camera-layout-options {
  width: 500px;

  .el-row {
    margin-left: 0 !important;
    margin-right: 0 !important;
    width: 100%;
  }
}

/* 布局选择器样式 */
.device-camera-layout-item {
  height: 55px;
  border: 2px solid var(--el-border-color-lighter);
  padding: 4px;
  cursor: pointer;
  margin-right: 12px;
  margin-top: 6px;
  margin-bottom: 6px;
  /* 添加底部间距 */
  border-radius: 8px;
  transition: all 0.3s ease;
  background-color: var(--el-fill-color-light);
  max-width: 80px;
  /* 限制最大宽度 */

  /* 修复 Element Plus 栅格系统的溢出问题 */
  &.el-col {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  &:hover {
    border-color: var(--el-color-primary);
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  }

  span {
    display: block;
    background: var(--el-fill-color);
    height: 22px;
    border-radius: 4px;
    transition: all 0.3s ease;
  }
}

.device-camera-item04 {
  span {
    display: block;
    background: var(--el-fill-color);
    height: 15px;
    border-radius: 4px;
    transition: all 0.3s ease;
    padding-top: 1px !important;
  }
}

/* 视频区域样式 */
.device-camera-video-area {
  height: 100vh;
  width: 100vw;
  padding: 24px;
  z-index: 888;
  /* 增加顶部边距，避免与设置面板重叠 */
}

.device-camera-video-container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.device-camera-video-row {
  transition: all 0.3s ease;
  animation: device-camera-scale-in 0.4s ease-out;
}

.device-camera-single {
  height: 100%;
  width: 100%;
}

.device-camera-grid-2 {
  height: 50%;
  width: 100%;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
}

.device-camera-grid-3 {
  height: 33.333%;
  width: 100%;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
}

.device-camera-video-item {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  height: 100%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  &:hover {
    transform: scale(1.01);
    z-index: 10;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    animation: device-camera-glow 2s infinite;
  }
}

/* 修复视频播放器样式 */
:deep(.height-500) {
  height: 100%;
}

:deep(.video-js) {
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  background-color: #000;
}

:deep(.video-js .vjs-big-play-button) {
  top: calc(50% - 24px);
  left: calc(50% - 48px);
  border-radius: 50px;
  transition: all 0.3s ease;
  background-color: rgba(var(--el-color-primary-rgb), 0.8);
  border: none;
  width: 96px;
  height: 48px;
  line-height: 48px;
  font-size: 20px;

  &:hover {
    transform: scale(1.1);
    background-color: var(--el-color-primary);
    box-shadow: 0 0 20px rgba(var(--el-color-primary-rgb), 0.6);
  }
}

:deep(.vjs-control-bar) {
  backdrop-filter: blur(10px);
  background-color: rgba(0, 0, 0, 0.5) !important;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
  height: 40px;

  .vjs-button {
    transition: all 0.2s ease;

    &:hover {
      transform: scale(1.1);
    }
  }

  .vjs-progress-control {
    height: 6px;
    top: -6px;

    &:hover {
      height: 8px;
      top: -8px;
    }

    .vjs-progress-holder {
      border-radius: 3px;
      margin: 0;
    }

    .vjs-play-progress {
      background-color: var(--el-color-primary);

      &:before {
        font-size: 0.9em;
        top: -0.3em;
      }
    }
  }
}

:deep(.vjs-fullscreen-control) {
  margin-right: 5px;
}

:deep(.vjs-volume-panel) {
  margin-right: 5px;
}

:deep(.vjs-menu-button-popup .vjs-menu) {
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  overflow: hidden;
}
</style>
