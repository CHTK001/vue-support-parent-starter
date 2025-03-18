<template>
  <div class="dialog-container">
    <div class="setting">
      <div :class="{ 'show-content': !showSetting }" class="show-setting-content">
        <div v-if="showSetting" class="px-4">
          <div class="flex gap-4">
            <div>
              <el-row><b>设备选择</b></el-row>
              <el-row class="selectLayout">
                <el-segmented
                  v-model="env.showOrHide"
                  @change="handleShowOrHide"
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
            <div class="!w-[400px]">
              <el-row><b>布局方式</b></el-row>
              <el-row class="selectLayout">
                <el-col :span="4" class="selectLayout-item item00" :class="{ active: env.layout == 1 }" @click="setLayout(1)" title="1">
                  <el-row :gutter="2">
                    <el-col :span="24"><span /></el-col>
                  </el-row>
                </el-col>
                <el-col :span="4" class="selectLayout-item item03" :class="{ active: env.layout == 2 }" @click="setLayout(2)" title="2x2">
                  <el-row :gutter="2">
                    <el-col :span="12"><span /></el-col>
                    <el-col :span="12"><span /></el-col>
                    <el-col :span="12"><span /></el-col>
                    <el-col :span="12"><span /></el-col>
                  </el-row>
                </el-col>
                <el-col :span="4" class="selectLayout-item item04" :class="{ active: env.layout == 3 }" @click="setLayout(3)" title="3x3">
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
      <div class="show-button">
        <div></div>
        <el-icon class="btn" color="white" size="24" @click="() => (showSetting = !showSetting)">
          <component :is="useRenderIcon('ep:arrow-down')" v-if="showSetting" />
          <component :is="useRenderIcon('ep:arrow-up')" v-else />
        </el-icon>
        <div></div>
      </div>
    </div>
    <el-container ref="videoAreaRef" class="z-[888]">
      <div class="h-full w-full selectLayout-item-active">
        <template v-if="env.layout == 1">
          <el-row class="h-full w-full selectLayout-item-active">
            <el-col :span="24">
              <CameraPreviewDialog :autoOrHide="env.autoOrHide" :ref="(el) => (refs['1'] = el)" :form="env.form" :devices="env.devices" key="1" diff="1" />
            </el-col>
          </el-row>
        </template>
        <template v-else-if="env.layout == 2">
          <el-row :gutter="2" class="h-1/2 w-full">
            <el-col :span="12" class="video-item">
              <CameraPreviewDialog :autoOrHide="env.autoOrHide" :ref="(el) => (refs['01'] = el)" :form="env.form" :devices="env.devices" key="01" diff="01" />
            </el-col>
            <el-col :span="12" class="video-item">
              <CameraPreviewDialog :autoOrHide="env.autoOrHide" :ref="(el) => (refs['02'] = el)" :form="env.form" :devices="env.devices" key="02" diff="02" />
            </el-col>
          </el-row>
          <el-row :gutter="2" class="h-1/2 w-full mt-1">
            <el-col :span="12" class="video-item">
              <CameraPreviewDialog :autoOrHide="env.autoOrHide" :ref="(el) => (refs['11'] = el)" :form="env.form" :devices="env.devices" key="11" diff="11" />
            </el-col>
            <el-col :span="12" class="video-item">
              <CameraPreviewDialog :autoOrHide="env.autoOrHide" :ref="(el) => (refs['12'] = el)" :form="env.form" :devices="env.devices" key="12" diff="12" />
            </el-col>
          </el-row>
        </template>
        <template v-else-if="env.layout == 3">
          <el-row :gutter="2" class="h-1/3 w-full">
            <el-col :span="8" class="video-item">
              <CameraPreviewDialog :autoOrHide="env.autoOrHide" :ref="(el) => (refs['01'] = el)" :form="env.form" :devices="env.devices" key="01" diff="01" />
            </el-col>
            <el-col :span="8" class="video-item">
              <CameraPreviewDialog :autoOrHide="env.autoOrHide" :ref="(el) => (refs['02'] = el)" :form="env.form" :devices="env.devices" key="02" diff="02" />
            </el-col>
            <el-col :span="8" class="video-item">
              <CameraPreviewDialog :autoOrHide="env.autoOrHide" :ref="(el) => (refs['03'] = el)" :form="env.form" :devices="env.devices" key="03" diff="03" />
            </el-col>
          </el-row>
          <el-row :gutter="2" class="h-1/3 w-full mt-1">
            <el-col :span="8" class="video-item">
              <CameraPreviewDialog :autoOrHide="env.autoOrHide" :ref="(el) => (refs['11'] = el)" :form="env.form" :devices="env.devices" key="11" diff="11" />
            </el-col>
            <el-col :span="8" class="video-item">
              <CameraPreviewDialog :autoOrHide="env.autoOrHide" :ref="(el) => (refs['12'] = el)" :form="env.form" :devices="env.devices" key="12" diff="12" />
            </el-col>
            <el-col :span="8" class="video-item">
              <CameraPreviewDialog :autoOrHide="env.autoOrHide" :ref="(el) => (refs['13'] = el)" :form="env.form" :devices="env.devices" key="13" diff="13" />
            </el-col>
          </el-row>
          <el-row :gutter="2" class="h-1/3 w-full mt-1">
            <el-col :span="8" class="video-item">
              <CameraPreviewDialog :autoOrHide="env.autoOrHide" :ref="(el) => (refs['21'] = el)" :form="env.form" :devices="env.devices" key="21" name="21" />
            </el-col>
            <el-col :span="8" class="video-item">
              <CameraPreviewDialog :autoOrHide="env.autoOrHide" :ref="(el) => (refs['22'] = el)" :form="env.form" :devices="env.devices" key="22" name="22" />
            </el-col>
            <el-col :span="8" class="video-item">
              <CameraPreviewDialog :autoOrHide="env.autoOrHide" :ref="(el) => (refs['23'] = el)" :form="env.form" :devices="env.devices" key="23" name="23" />
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
import { defineAsyncComponent, defineExpose, nextTick, reactive, shallowRef, getCurrentInstance, handleError, onMounted, onUnmounted } from "vue";
import LoadingComponent from "@repo/components/ScLoad/index.vue";
import { useFullscreen } from "@vueuse/core";
import { Base64 } from "js-base64";
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
  window.aside?.style.setProperty("--aside-width", settingOpen.value ? "300px" : "55px");
};

isFullscreen.value = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);

const handleOpen = async (item, mode) => {
  env.visible = true;
  env.mode = mode;
  if (mode == "view-all") {
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
:deep(.height-500) {
  height: 600px;
}

.auto-height {
  --button-height: 100%;
  height: var(--button-height);
}

.selectLayout {
  width: 100%;
  display: flex;
}

.selectLayout-item-active {
}

.selectLayout-item {
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
  height: 22px;
  margin-bottom: 2px;
}

.selectLayout-item.item04 span {
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

.dialog-container {
  height: 100vh;
  width: 100vw;
}
.setting {
  cursor: pointer;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  display: flex;
  flex-direction: column;
  width: 100vw;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  z-index: 9999;
  .show-button {
    width: 100vw;
    display: flex;
    div {
      flex: 1;
      background-color: transparent !important;
    }
    .btn {
      backdrop-filter: blur(10px) brightness(90%);
      background-color: rgba(255, 255, 255, 0.5);
      border-bottom-left-radius: 4px;
      border-bottom-right-radius: 4px;
      width: 96px;
    }
  }
  .show-content {
    height: 0 !important;
    transition:
      transform 300ms linear,
      height 300ms;
  }
  .show-setting-content {
    height: 300px;
    width: 100vw;
    backdrop-filter: blur(10px) brightness(90%);
    background-color: rgba(255, 255, 255, 0.5);
  }
}
.video-item {
  border-radius: 10px;
}
</style>
