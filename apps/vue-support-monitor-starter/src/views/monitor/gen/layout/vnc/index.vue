<template>
  <div id="callPage" class="call-page h-full overflow-auto" style="width: 100%; height: calc(100vh - 60px)">
    <div class="absolute right-0 z-[19]">
      <el-button :icon="useRenderIcon('ep:full-screen')" circle @click="goFullScreen" />
      <el-button :icon="useRenderIcon('ep:arrow-left')" circle @click="handleMore" />
    </div>
    <div id="myFrame" ref="vncContainer" class="h-full" />
  </div>
</template>
<script setup>
import RFB from "@novnc/novnc";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message } from "@repo/utils";
import { reactive, ref, watchEffect } from "vue";
const show = ref(true);
const form = reactive({
  target: ""
});

const props = defineProps({
  data: Object
});

const vncContainer = ref(null);
watchEffect(() => {
  if (vncContainer.value) {
    connectVNC(vncContainer.value);
  }
});

const handleMore = () => {
  message("暂未实现", { type: "warning" });
};
const goFullScreen = () => {
  const iframe = document.getElementById("myFrame");
  // 进入全屏模式
  if (iframe.requestFullscreen) {
    iframe.requestFullscreen();
    streamRef.value.goFullScreen();
  } else if (iframe.mozRequestFullScreen) {
    /* Firefox */
    iframe.mozRequestFullScreen();
    streamRef.value.goFullScreen();
  } else if (iframe.webkitRequestFullscreen) {
    /* Chrome, Safari & Opera */
    iframe.webkitRequestFullscreen();
    streamRef.value.goFullScreen();
  } else if (iframe.msRequestFullscreen) {
    /* IE/Edge */
    iframe.msRequestFullscreen();
    streamRef.value.goFullScreen();
  }
};
const connectVNC = container => {
  const config = props.data;
  const wsURL = "ws://" + config.genDriverRemoteUrl; // Websockify 服务器的地址

  const rfb = new RFB(container, wsURL, {
    credentials: { password: config.genPassword } // 电脑A vnc设置的连接密码
  });
  rfb.scaleViewport = true;
  //scaleViewport指示是否应在本地扩展远程会话以使其适合其容器。禁用时，如果远程会话小于其容器，则它将居中，或者根据clipViewport它是否更大来处理。默认情况下禁用。
  rfb.resizeSession = true;
  //是一个boolean指示是否每当容器改变尺寸应被发送到调整远程会话的请求。默认情况下禁用
  rfb.addEventListener("connect", () => {
    console.log("Connected to VNC server");
  });

  rfb.addEventListener("disconnect", e => {
    console.error("Disconnected from VNC server", e.detail);
  });
  rfb.addEventListener("securityfailure", e => {
    message(e.detail.reason, { type: "error" });
  });
};
</script>
