<template>
  <div class="device-camera-container">
    <div class="device-camera-settings-toggle" @click="() => {
      isShow = !isShow;
    }
      ">
      <el-icon color="white" size="24">
        <component :is="useRenderIcon('ri:list-settings-fill')" />
      </el-icon>
    </div>
    <div class="device-camera-tool" v-if="isShow" :class="{ 'device-camera-tool-show': isShow }">
      <el-form :inline="true" class="device-camera-form">
        <el-form-item>
          <el-select size="small" class="device-camera-select" v-model="playSetting.sysDeviceId"
            @change="handleChangeDeviceId" placeholder="选择设备" clearable>
            <el-option v-for="device in devices" :key="device.sysDeviceId" :label="device.sysDeviceName"
              :value="device.sysDeviceId"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="playSetting.sysDeviceId">
          <el-select size="small" class="device-camera-select" v-model="playSetting.channelNo" placeholder="选择通道"
            clearable>
            <el-option v-for="item in getChannel()" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="playSetting.sysDeviceId">
          <el-select size="small" class="device-camera-select" v-model="playSetting.subtype" placeholder="选择通道"
            clearable>
            <el-option label="主码流" :value="getMainSubtype"></el-option>
            <el-option label="子码流" :value="getSubSubtype"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    <div v-if="hideVideo" class="device-camera-placeholder">
      <el-button @click="handlePlayer" :icon="useRenderIcon('ri:play-line')"
        class="device-camera-play-button"></el-button>
    </div>
    <div v-else class="device-camera-video-wrapper">
      <video :id="'video' + diff" ref="videoPlayer" controls class="device-camera-video"></video>
    </div>
  </div>
</template>

<!--脚本部分保持不变-->
<script setup>
import { fetchGetProjectForDevicePreviewUrl } from "@/api/manage/project-device";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message } from "@repo/utils";
import Hls from "hls.js";
import { defineExpose, onMounted, shallowRef, reactive, computed, watch, nextTick, onUnmounted } from "vue";
const props = defineProps({
  form: {
    type: Object,
    default: () => { },
  },
  devices: {
    type: Array,
    default: () => [],
  },
  autoPlay: {
    type: Boolean,
    default: false,
  },
  autoOrHide: {
    type: Boolean,
    default: false,
  },
  diff: {
    type: String,
    default: "0",
  },
});
let playSetting = reactive({
  sysDeviceId: null,
  channelNo: null,
});
const videoPlayer = shallowRef(null);
const _autoPlay = shallowRef(false);
const channels = shallowRef([]);
const hideVideo = computed(() => {
  if (!playSetting.sysDeviceId) {
    _autoPlay.value = false;
    return true;
  }

  if (!playSetting.channelNo) {
    _autoPlay.value = false;
    return true;
  }
  if (!playSetting.subtype) {
    _autoPlay.value = false;
    return true;
  }
  return !_autoPlay.value;
});

watch(
  playSetting.sysDeviceId,
  () => {
    _autoPlay.value = false;
  },
  {
    deep: true,
    immediate: true,
  }
);
watch(
  playSetting.channelNo,
  () => {
    _autoPlay.value = false;
  },
  {
    deep: true,
    immediate: true,
  }
);
watch(
  playSetting.subtype,
  () => {
    _autoPlay.value = false;
  },
  {
    deep: true,
    immediate: true,
  }
);

onMounted(async () => {
  handleOpen();
});

const getChannel = () => {
  return props.devices.filter((it) => it.sysDeviceId == playSetting.sysDeviceId)[0]?.sysDeviceChannels?.split(",") || [];
};

const getMainSubtype = computed(() => {
  return props.devices.filter((it) => it.sysDeviceId == playSetting.sysDeviceId)[0]?.sysDeviceMainSubtype || 0;
});

const getSubSubtype = computed(() => {
  return props.devices.filter((it) => it.sysDeviceId == playSetting.sysDeviceId)[0]?.sysDeviceSubSubtype || 1;
});

const handlePlayer = async () => {
  if (!playSetting.sysDeviceId) {
    message("请选择设备", { type: "warning" });
    return;
  }
  if (!playSetting.channelNo) {
    message("请选择管道", { type: "warning" });
    return;
  }
  if (!playSetting.subtype) {
    message("请选择码流", { type: "warning" });
    return;
  }
  handlePreviewUrl();
};
const handlePreviewUrl = async () => {
  const device = props.devices.filter((it) => it.sysDeviceId == playSetting.sysDeviceId)[0] || {};
  if (device.sysDeviceRtsp) {
    const url = device.sysDeviceRtsp.replace(/\$\{(\w+)\}/g, (match, key) => {
      return device[key] || playSetting[key] || match; // 如果没有找到对应的键，则保留原值
    });
    playSetting.previewUrl = url;
    _autoPlay.value = true;
    handleVideo(device);
    return;
  }
  const newForm = {};
  Object.assign(newForm, props.form, { sysDeviceId: playSetting.sysDeviceId, channelNo: playSetting.channelNo, subtype: playSetting.subtype });
  fetchGetProjectForDevicePreviewUrl(newForm)
    .then((res) => {
      _autoPlay.value = true;
      playSetting.previewUrl = res?.data;
      handleVideo(device);
    })
    .catch((res) => {
      message(res.msg, { type: "error" });
    });
};

const handleVideo = async (device) => {
  nextTick(() => {
    if (playSetting.previewUrl.startsWith("http://") || playSetting.previewUrl.startsWith("https://")) {
      handlePlayHls();
      return;
    }

    if (playSetting.previewUrl.startsWith("rtsp://")) {
      if (!device.sysDeviceRtspWebrtc) {
        _autoPlay.value = false;
        message("暂不支持rtsp, 需要本地安装webrtc-streamer", { type: "warning" });
        return;
      }
      handlePlayWebRtcRtsp(device);
    }
  });
};
const webRtcServer = shallowRef();
const isShow = shallowRef(false);

const handlePlayWebRtcRtsp = async (device) => {
  webRtcServer.value = new WebRtcStreamer("video" + props.diff, device.sysDeviceRtspWebrtc);
  webRtcServer.value.connect(playSetting.previewUrl);
};
onUnmounted(() => {
  handleClose();
});

const handleOpen = async (_isFullscreen) => {
  fullscreen(_isFullscreen);
  _autoPlay.value = props.autoPlay;
  if (props.devices.length == 1) {
    playSetting.sysDeviceId = props.devices[0]?.sysDeviceId;
    playSetting.subtype = getMainSubtype;
    const channels = getChannel();
    if (channels.length == 1) {
      playSetting.channelNo = channels[0];
    }
  }
};

const fullscreen = (_isFullscreen) => { };
const handleShowOrHide = (val) => { };

const handleChangeDeviceId = () => {
  playSetting.subtype = getMainSubtype;
  const channels = getChannel();
  if (channels.length > 0) {
    playSetting.channelNo = channels[0];
  }
};
const handleClose = async () => {
  if (webRtcServer.value) {
    webRtcServer.value.disconnect();
  }
  videoPlayer.value = null;
  _autoPlay.value = false;
  videoPlayer.value = null;
  playSetting = reactive({});
};

const handlePlayHls = async () => {
  if (Hls.isSupported()) {
    const video = videoPlayer.value;
    const hls = new Hls();
    hls.loadSource(playSetting.previewUrl);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, function () {
      video.play();
    });
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    // 如果浏览器原生支持HLS
    video.src = playSetting.previewUrl;
    video.addEventListener("loadedmetadata", function () {
      video.play();
    });
  }
};
defineExpose({
  handleClose,
  handleOpen,
  fullscreen,
  handleShowOrHide,
});
</script>
<style scoped lang="scss">
@keyframes device-camera-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes device-camera-pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0.7);
  }

  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(var(--el-color-primary-rgb), 0);
  }

  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0);
  }
}

/* 添加新的动画效果 */
@keyframes device-camera-shine {
  0% {
    background-position: -100% 0;
  }

  100% {
    background-position: 200% 0;
  }
}

@keyframes device-camera-rotate {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@keyframes device-camera-breathe {

  0%,
  100% {
    box-shadow: 0 0 15px rgba(var(--el-color-primary-rgb), 0.4);
  }

  50% {
    box-shadow: 0 0 25px rgba(var(--el-color-primary-rgb), 0.7);
  }
}

.device-camera-container {
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.12);
  transition: all 0.4s cubic-bezier(0.215, 0.61, 0.355, 1);
  background: linear-gradient(145deg, rgba(20, 20, 20, 0.6), rgba(10, 10, 10, 0.8));

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
    background-size: 200% 100%;
    animation: device-camera-shine 8s linear infinite;
    pointer-events: none;
    z-index: 1;
  }
}

.device-camera-settings-toggle {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 999;
  cursor: pointer;
  background-color: rgba(30, 30, 30, 0.7);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  opacity: 0.5;
  transform: translateY(-10px);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: device-camera-fade-in 0.5s ease-out;

  &:hover {
    opacity: 1;
    background-color: rgba(var(--el-color-primary-rgb), 0.8);
    transform: scale(1.15) translateY(0);
    box-shadow: 0 0 15px rgba(var(--el-color-primary-rgb), 0.5);
    animation: device-camera-float 3s ease-in-out infinite, device-camera-breathe 2s ease-in-out infinite;
  }
}

.device-camera-tool {
  position: absolute;
  top: 80px;
  left: 20px;
  background-color: rgba(20, 20, 20, 0.85);
  backdrop-filter: blur(12px);
  z-index: 999;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  animation: device-camera-fade-in 0.4s cubic-bezier(0.215, 0.61, 0.355, 1);
  transition: all 0.4s ease;
  transform-origin: top left;
  border: 1px solid rgba(255, 255, 255, 0.08);
  max-width: 400px;

  &::before {
    content: '';
    position: absolute;
    top: -1px;
    left: -1px;
    right: -1px;
    height: 1px;
    background: linear-gradient(90deg, rgba(var(--el-color-primary-rgb), 0.5), transparent);
    border-radius: 12px 12px 0 0;
  }
}

.device-camera-form {
  display: flex;
  flex-direction: column;
  gap: 12px;

  :deep(.el-form-item) {
    margin-bottom: 0;
    margin-right: 0;
  }
}

.device-camera-select {
  width: 160px !important;

  :deep(.el-input__wrapper) {
    background-color: rgba(40, 40, 40, 0.6);
    box-shadow: none;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      border-color: rgba(var(--el-color-primary-rgb), 0.7);
      background-color: rgba(50, 50, 50, 0.6);
    }

    &.is-focus {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.2);
      background-color: rgba(60, 60, 60, 0.6);
    }
  }
}

/* 其他样式保持不变 */
.device-camera-placeholder {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #0a0a0a;
  border-radius: 12px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, rgba(50, 50, 50, 0.4) 0%, rgba(10, 10, 10, 0.9) 80%);
    z-index: 1;
  }
}

.device-camera-play-button {
  position: absolute;
  top: 42%;
  left: 42%;
  transform: translate(-50%, -50%);
  font-size: 3.2em;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  cursor: pointer;
  background-color: rgba(var(--el-color-primary-rgb), 0.8);
  border: none;
  border-radius: 50%;
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: device-camera-pulse 2s infinite, device-camera-ripple 3s infinite;
  box-shadow: 0 0 30px rgba(var(--el-color-primary-rgb), 0.6);

  &::before {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    border-radius: 50%;
    background: linear-gradient(45deg, rgba(var(--el-color-primary-rgb), 0.3), rgba(var(--el-color-primary-rgb), 0.1), rgba(var(--el-color-primary-rgb), 0.3));
    z-index: -1;
    animation: device-camera-rotate 4s linear infinite;
  }

  &:hover {
    transform: translate(-50%, -50%) scale(1.15);
    background-color: var(--el-color-primary);
    box-shadow: 0 0 40px rgba(var(--el-color-primary-rgb), 0.7);
  }

  &:active {
    transform: translate(-50%, -50%) scale(0.92);
  }

  :deep(i) {
    font-size: 1.6em;
    margin-left: 0;
    filter: drop-shadow(0 2px 4px rgba(255, 255, 255, 0.9));
    animation: device-camera-glow 2s ease-in-out infinite;
  }
}

.device-camera-video {
  height: 100%;
  width: 100%;
  object-fit: cover;
  border-radius: 12px;
}
</style>