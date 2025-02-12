<template>
  <div class="h-full w-full relative">
    <div class="video-tool absolute right-0 bg-transparent z-[999]" v-if="!isShow">
      <el-form :inline="true">
        <el-form-item>
          <el-select size="small" class="!w-[100px]" v-model="playSetting.sysDeviceId" @change="handleChangeDeviceId"
            placeholder="选择设备" clearable>
            <el-option v-for="device in devices" :key="device.sysDeviceId" :label="device.sysDeviceName"
              :value="device.sysDeviceId"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="playSetting.sysDeviceId">
          <el-select size="small" class="!w-[100px]" v-model="playSetting.channelNo" placeholder="选择通道" clearable>
            <el-option v-for="item in getChannel()" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="playSetting.sysDeviceId">
          <el-select size="small" class="!w-[100px]" v-model="playSetting.subtype" placeholder="选择通道" clearable>
            <el-option label="主码流" :value="getMainSubtype"></el-option>
            <el-option label="子码流" :value="getSubSubtype"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    <div v-if="hideVideo" class="h-full w-full flex justify-center items-center" style="background-color: black;">
      <el-button @click="handlePlayer" :icon="useRenderIcon('ri:play-line')" class="play-button"></el-button>
    </div>
    <div v-else class="w-full h-full absolute">
      <video :id="'video' + diff" ref="videoPlayer" controls class="w-full h-full "></video>
    </div>
  </div>
</template>
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
  diff: {
    type: String,
    default: "0",
  },
});
let playSetting = reactive({
  sysDeviceId: null,
  channelNo: null,
})
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

watch(playSetting.sysDeviceId, () => {
  _autoPlay.value = false;
}, {
  deep: true,
  immediate: true
});
watch(playSetting.channelNo, () => {
  _autoPlay.value = false;
}, {
  deep: true,
  immediate: true
});
watch(playSetting.subtype, () => {
  _autoPlay.value = false;
}, {
  deep: true,
  immediate: true
});

onMounted(async () => {
  handleOpen();
});


const getChannel = () => {
  return props.devices.filter(it => it.sysDeviceId == playSetting.sysDeviceId)[0]?.sysDeviceChannels?.split(",") || [];
}

const getMainSubtype = computed(() => {
  return props.devices.filter(it => it.sysDeviceId == playSetting.sysDeviceId)[0]?.sysDeviceMainSubtype || 0;
})

const getSubSubtype = computed(() => {
  return props.devices.filter(it => it.sysDeviceId == playSetting.sysDeviceId)[0]?.sysDeviceSubSubtype || 1;
})

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
}
const handlePreviewUrl = async () => {
  const device = props.devices.filter(it => it.sysDeviceId == playSetting.sysDeviceId)[0] || {};
  if (device.sysDeviceRtsp) {
    const url = device.sysDeviceRtsp.replace(/\$\{(\w+)\}/g, (match, key) => {
      return device[key] || playSetting[key] || match; // 如果没有找到对应的键，则保留原值
    });
    playSetting.previewUrl = url;
    _autoPlay.value = true
    handleVideo(device);
    return;
  }
  const newForm = {};
  Object.assign(newForm, props.form, { sysDeviceId: playSetting.sysDeviceId, channelNo: playSetting.channelNo, subtype: playSetting.subtype });
  fetchGetProjectForDevicePreviewUrl(newForm).then((res) => {
    _autoPlay.value = true
    playSetting.previewUrl = res?.data;
    handleVideo(device);
  }).catch((res) => {
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
}
const webRtcServer = shallowRef();
const isShow = shallowRef();

const handlePlayWebRtcRtsp = async (device) => {
  webRtcServer.value = new WebRtcStreamer("video" + props.diff, device.sysDeviceRtspWebrtc);
  webRtcServer.value.connect(playSetting.previewUrl);
}
onUnmounted(() => {
  handleClose();
})

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
}

const fullscreen = (_isFullscreen) => {
  isShow.value = _isFullscreen;
}
const handleShowOrHide = (val) => {
  isShow.value = val;
}

const handleChangeDeviceId = () => {
  playSetting.subtype = getMainSubtype;
  const channels = getChannel();
  if (channels.length > 0) {
    playSetting.channelNo = channels[0];
  }
}
const handleClose = async () => {
  if (webRtcServer.value) {
    webRtcServer.value.disconnect();
  }
  videoPlayer.value = null;
  _autoPlay.value = false;
  videoPlayer.value = null;
  playSetting = reactive({});
}

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
}
defineExpose({
  handleClose,
  handleOpen,
  fullscreen,
  handleShowOrHide
})
</script>
<style scoped>
:deep(.el-form-item__label) {
  mix-blend-mode: difference;
  color: var(--el-text-color-regular);
}

:deep(.el-form--inline .el-form-item) {
  margin-right: 2px;
}

.play-button {
  font-size: 3em;
  line-height: 1.3em;
  height: 1.13332em;
  width: 2em;
  display: block;
  position: absolute;
  cursor: pointer;
  opacity: 1;
  background-color: rgba(43, 51, 63, 0.7);
  padding: 0px;
  border-width: 0.06666em;
  border-style: solid;
  border-color: rgb(255, 255, 255);
  border-image: initial;
  border-radius: 0.3em;
  transition: 0.4s;
}
</style>
