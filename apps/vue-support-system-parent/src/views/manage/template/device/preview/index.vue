<template>
  <div class="dialog-container">
    <el-dialog v-model="env.visible" width="80%" :title="env.title" draggable :close-on-click-modal="false"
      @close="handleClose" class="custom-dialog-height !min-h-[550px]" :class="isFullscreen ? '' : 'height-500'">
      <el-container ref="videoAreaRef">
        <div class=" h-full w-full selectLayout-item-active">
          <template v-if="env.layout == 1">
            <el-row class="h-full w-full selectLayout-item-active">
              <el-col :span="24">
                <CameraPreviewDialog :ref="el => refs['1'] = el" :form="env.form" :devices="env.devices" key="1"
                  diff="1" />
              </el-col>
            </el-row>
          </template>
          <template v-else-if="env.layout == 2">
            <el-row :gutter="2" class="h-1/2 w-full">
              <el-col :span="12">
                <CameraPreviewDialog :ref="el => refs['01'] = el" :form="env.form" :devices="env.devices" key="01"
                  diff="01" />
              </el-col>
              <el-col :span="12">
                <CameraPreviewDialog :ref="el => refs['02'] = el" :form="env.form" :devices="env.devices" key="02"
                  diff="02" />
              </el-col>
            </el-row>
            <el-row :gutter="2" class="h-1/2 w-full mt-1">
              <el-col :span="12">
                <CameraPreviewDialog :ref="el => refs['11'] = el" :form="env.form" :devices="env.devices" key="11"
                  diff="11" />
              </el-col>
              <el-col :span="12">
                <CameraPreviewDialog :ref="el => refs['12'] = el" :form="env.form" :devices="env.devices" key="12"
                  diff="12" />
              </el-col>
            </el-row>
          </template>
          <template v-else-if="env.layout == 3">
            <el-row :gutter="2" class="h-1/3 w-full">
              <el-col :span="8">
                <CameraPreviewDialog :ref="el => refs['01'] = el" :form="env.form" :devices="env.devices" key="01"
                  diff="01" />
              </el-col>
              <el-col :span="8">
                <CameraPreviewDialog :ref="el => refs['02'] = el" :form="env.form" :devices="env.devices" key="02"
                  diff="02" />
              </el-col>
              <el-col :span="8">
                <CameraPreviewDialog :ref="el => refs['03'] = el" :form="env.form" :devices="env.devices" key="03"
                  diff="03" />
              </el-col>
            </el-row>
            <el-row :gutter="2" class="h-1/3 w-full mt-1">
              <el-col :span="8">
                <CameraPreviewDialog :ref="el => refs['11'] = el" :form="env.form" :devices="env.devices" key="11"
                  diff="11" />
              </el-col>
              <el-col :span="8">
                <CameraPreviewDialog :ref="el => refs['12'] = el" :form="env.form" :devices="env.devices" key="12"
                  diff="12" />
              </el-col>
              <el-col :span="8">
                <CameraPreviewDialog :ref="el => refs['13'] = el" :form="env.form" :devices="env.devices" key="13"
                  diff="13" />
              </el-col>
            </el-row>
            <el-row :gutter="2" class="h-1/3 w-full mt-1">
              <el-col :span="8">
                <CameraPreviewDialog :ref="el => refs['21'] = el" :form="env.form" :devices="env.devices" key="21"
                  name="21" />
              </el-col>
              <el-col :span="8">
                <CameraPreviewDialog :ref="el => refs['22'] = el" :form="env.form" :devices="env.devices" key="22"
                  name="22" />
              </el-col>
              <el-col :span="8">
                <CameraPreviewDialog :ref="el => refs['23'] = el" :form="env.form" :devices="env.devices" key="23"
                  name="23" />
              </el-col>
            </el-row>
          </template>
        </div>
        <el-aside style="width: var(--aside-width)" id="aside" v-if="env.mode != 'view'">
          <div class="w-full flex justify-start mb-4">
            <el-icon :size="22" @click="handleTrigger" class="cursor-pointer">
              <component :is="useRenderIcon('mdi:menu-open')" v-if="!settingOpen" />
              <component :is="useRenderIcon('mdi:menu-close')" v-else />
            </el-icon>
          </div>
          <div v-if="settingOpen" class="px-4">
            <el-row><b>显示方式</b></el-row>
            <el-row class="selectLayout">
              <el-radio-group>
                <el-radio-button label="true" :value="true" @click="handleToggle">全屏</el-radio-button>
              </el-radio-group>
            </el-row>
            <el-row><b>设备选择</b></el-row>
            <el-row class="selectLayout">
              <el-segmented v-model="env.showOrHide" @change="handleShowOrHide" :options="[{
                label: '显示',
                value: true
              }, {
                label: '隐藏',
                value: false
              }]"></el-segmented>
            </el-row>
            <div class="py-4"></div>
            <el-row><b>布局方式</b></el-row>
            <el-row class="selectLayout">
              <el-col :span="4" class="selectLayout-item item00" :class="{ active: env.layout == 1 }"
                @click="setLayout(1)" title="1">
                <el-row :gutter="2">
                  <el-col :span="24"><span /></el-col>
                </el-row>
              </el-col>
              <el-col :span="4" class="selectLayout-item item03" :class="{ active: env.layout == 2 }"
                @click="setLayout(2)" title="2x2">
                <el-row :gutter="2">
                  <el-col :span="12"><span /></el-col>
                  <el-col :span="12"><span /></el-col>
                  <el-col :span="12"><span /></el-col>
                  <el-col :span="12"><span /></el-col>
                </el-row>
              </el-col>
              <el-col :span="4" class="selectLayout-item item04" :class="{ active: env.layout == 3 }"
                @click="setLayout(3)" title="3x3">
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
        </el-aside>
      </el-container>
    </el-dialog>
  </div>
</template>
<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message } from "@repo/utils";
import { defineAsyncComponent, defineExpose, nextTick, reactive, shallowRef, getCurrentInstance, handleError, onMounted, onUnmounted } from "vue";
import LoadingComponent from "@repo/components/ScLoad/index.vue";
import { useFullscreen } from "@vueuse/core";
const videoAreaRef = shallowRef();
const { isFullscreen, toggle } = useFullscreen(videoAreaRef);

const CameraPreviewDialog = defineAsyncComponent({
  loader: () => import("./camera-preview.vue"),
  loadingComponent: LoadingComponent
});
const settingOpen = shallowRef(false);
const env = reactive({
  visible: false,
  fullscreen: false,
  title: "预览",
  form: {},
  layout: 1,
});

const refs = {
};
const setLayout = async (value) => {
  env.layout = value;
  handleOpenCanvas();
}

const handleToggle = async () => {
  if (settingOpen.value) {
    handleTrigger();
  }
  toggle();
}


const handleTrigger = async () => {
  settingOpen.value = !settingOpen.value;
  window.aside?.style.setProperty("--aside-width", settingOpen.value ? "300px" : "55px");
};

isFullscreen.value = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);

const handleOpen = async (item, mode) => {
  env.visible = true;
  env.mode = mode;
  if (mode == 'view-all') {
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
    }, 200)
  })
};

const handleOpenCanvas = async () => {
  nextTick(() => {
    const _value = Object.values(refs).filter(Boolean);
    _value.forEach(item => {
      item?.handleOpen(env.isFullscreen);
    });
  })
}
const handleShowOrHide = async () => {
  nextTick(() => {
    const _value = Object.values(refs).filter(Boolean);
    _value.forEach(item => {
      item?.handleShowOrHide(!env.showOrHide);
    });
  })
}
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

.selectLayout-item-active {}

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
  :deep(.custom-dialog-height) {
    min-height: 600px;
  }

  :deep(.custom-dialog-height .el-dialog__body) {
    height: calc(100% - 30px);
  }

  :deep(.selectLayout-item-active) {
    height: 100%;
  }

}
</style>
