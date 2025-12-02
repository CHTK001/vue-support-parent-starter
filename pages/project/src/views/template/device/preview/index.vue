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
  background: linear-gradient(
    135deg,
    var(--el-bg-color-page) 0%,
    var(--el-fill-color-darker) 100%
  );
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 80%,
        rgba(var(--el-color-primary-rgb), 0.05) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 20%,
        rgba(var(--el-color-primary-rgb), 0.03) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }
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
  width: 100vw;
  backdrop-filter: blur(20px) saturate(180%);
  background: linear-gradient(
    180deg,
    rgba(var(--el-bg-color-rgb), 0.95) 0%,
    rgba(var(--el-bg-color-rgb), 0.85) 100%
  );
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  animation: device-camera-fade-in 0.5s ease-out;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(var(--el-color-primary-rgb), 0.1);
}

.device-camera-show-content {
  height: 0 !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.device-camera-setting-inner {
  padding: 20px 32px;
  height: 100%;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 32px;
    right: 32px;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(var(--el-color-primary-rgb), 0.2),
      transparent
    );
  }
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
  padding: 16px 20px;
  background: rgba(var(--el-color-primary-rgb), 0.03);
  border-radius: 12px;
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.08);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(var(--el-color-primary-rgb), 0.06);
    border-color: rgba(var(--el-color-primary-rgb), 0.15);
  }

  b {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
    display: inline-flex;
    align-items: center;
    color: var(--el-text-color-primary);
    position: relative;
    padding-left: 16px;

    &:before {
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 16px;
      background: linear-gradient(
        180deg,
        var(--el-color-primary) 0%,
        var(--el-color-primary-light-3) 100%
      );
      border-radius: 2px;
      box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.3);
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
  padding: 5px;
  cursor: pointer;
  margin-right: 12px;
  margin-top: 6px;
  margin-bottom: 6px;
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(
    145deg,
    var(--el-fill-color-lighter) 0%,
    var(--el-fill-color-light) 100%
  );
  max-width: 80px;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(var(--el-color-primary-rgb), 0) 0%,
      rgba(var(--el-color-primary-rgb), 0.1) 100%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &.el-col {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  &:hover {
    border-color: var(--el-color-primary);
    transform: translateY(-4px) scale(1.08);
    box-shadow:
      0 12px 28px rgba(var(--el-color-primary-rgb), 0.25),
      0 4px 12px rgba(0, 0, 0, 0.15);

    &::before {
      opacity: 1;
    }

    span {
      background: linear-gradient(
        135deg,
        var(--el-color-primary-light-7) 0%,
        var(--el-color-primary-light-5) 100%
      );
    }
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

/* 激活状态样式 */
.device-camera-active {
  border-color: var(--el-color-primary) !important;
  background: linear-gradient(
    145deg,
    rgba(var(--el-color-primary-rgb), 0.15) 0%,
    rgba(var(--el-color-primary-rgb), 0.08) 100%
  ) !important;
  box-shadow:
    0 8px 24px rgba(var(--el-color-primary-rgb), 0.3),
    0 2px 8px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;

  &::before {
    opacity: 1 !important;
  }

  span {
    background: linear-gradient(
      135deg,
      var(--el-color-primary) 0%,
      var(--el-color-primary-light-3) 100%
    ) !important;
    box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.3);
  }
}

/* 切换按钮样式 */
.device-camera-toggle {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 0;
  background: linear-gradient(
    180deg,
    rgba(var(--el-bg-color-rgb), 0.6) 0%,
    transparent 100%
  );
}

.device-camera-toggle-btn {
  width: 48px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    var(--el-color-primary) 0%,
    var(--el-color-primary-light-3) 100%
  );
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 4px 16px rgba(var(--el-color-primary-rgb), 0.3),
    0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: scale(1.1);
    box-shadow:
      0 8px 24px rgba(var(--el-color-primary-rgb), 0.4),
      0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: scale(0.95);
  }
}

/* Segmented 组件美化 */
.device-camera-segmented {
  :deep(.el-segmented) {
    background: var(--el-fill-color-light);
    border-radius: 10px;
    padding: 3px;

    .el-segmented__item {
      border-radius: 8px;
      transition: all 0.3s ease;
      font-weight: 500;

      &.is-selected {
        background: linear-gradient(
          135deg,
          var(--el-color-primary) 0%,
          var(--el-color-primary-light-3) 100%
        );
        box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.3);
      }
    }
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
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.2),
    0 2px 8px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  position: relative;
  background: linear-gradient(
    145deg,
    rgba(0, 0, 0, 0.9) 0%,
    rgba(0, 0, 0, 0.95) 100%
  );

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    z-index: 1;
  }

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    pointer-events: none;
    z-index: 1;
  }

  &:hover {
    transform: scale(1.02) translateY(-4px);
    z-index: 10;
    box-shadow:
      0 20px 48px rgba(var(--el-color-primary-rgb), 0.2),
      0 8px 24px rgba(0, 0, 0, 0.3);

    &::after {
      border-color: rgba(var(--el-color-primary-rgb), 0.3);
    }
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
