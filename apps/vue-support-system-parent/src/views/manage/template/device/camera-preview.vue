<template>
  <div>
    <el-dialog width="70%" draggable v-model="env.visible" :title="env.title" :close-on-click-modal="false">
      <video ref="videoPlayer" controls class="w-full h-full"></video>
    </el-dialog>
  </div>
</template>
<script setup>
import { fetchGetProjectForDevicePreviewUrl } from "@/api/manage/project-device";
import { defineExpose, reactive, ref } from "vue";
import Hls from "hls.js";
const videoPlayer = ref(null);

const env = reactive({
  title: "预览",
  data: {},
  visible: false,
  previewUrl: null,
});

const handlePreviewUrl = async () => {
  fetchGetProjectForDevicePreviewUrl(env.data).then((res) => {
    if (res.code == "00000") {
      env.previewUrl = res?.data;
      if (Hls.isSupported()) {
        const video = videoPlayer.value;
        const hls = new Hls();
        hls.loadSource(env.previewUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
          video.play();
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // 如果浏览器原生支持HLS
        video.src = env.previewUrl;
        video.addEventListener("loadedmetadata", function () {
          video.play();
        });
      }
      return;
    }

    message(res.msg, { type: "error" });
    handleClose();
  });
};
const handleClose = async () => {
  env.visible = false;
};

const handleOpen = async (item) => {
  env.visible = true;
  env.data = item;
  env.title = "预览" + item.sysDeviceName;
  handlePreviewUrl();
};

defineExpose({
  handleOpen,
  handleClose,
});
</script>
