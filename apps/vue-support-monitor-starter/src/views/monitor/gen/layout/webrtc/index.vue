<template>
  <div id="callPage" class="call-page h-full">
    <el-container class="h-full">
      <el-header>
        <el-form inline>
          <el-form-item>
            <el-input v-model="form.target" type="text" placeholder="请输入呼叫的用户" />
          </el-form-item>

          <el-form-item>
            <el-button-group>
              <el-button id="callBtn" type="primary" class="btn-success btn" @click="handleCall">呼叫</el-button>
              <el-button v-if="show" :icon="useRenderIcon('ri:fullscreen-fill')" @click="goFullScreen()">全屏</el-button>
              <el-button v-else :icon="useRenderIcon('ri:fullscreen-exit-fill')" @click="goFullScreen()">退出全屏</el-button>
            </el-button-group>
          </el-form-item>
        </el-form>
      </el-header>
      <el-main id="myFrame">
        <Stream ref="streamRef" />
      </el-main>
    </el-container>
  </div>
</template>
<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { reactive, ref } from "vue";
import Stream from "./stream.vue";

const show = ref(true);
const form = reactive({
  target: ""
});
const streamRef = ref();
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
const handleCall = () => {
  streamRef.value.handleCall(form);
};
</script>
