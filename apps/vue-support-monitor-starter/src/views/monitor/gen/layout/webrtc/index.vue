<template>
  <div id="callPage" class="call-page h-full">
    <el-container class="h-full">
      <el-header>
        <el-form inline>
          <el-form-item>
            <el-input v-model="form.roomId" placeholder="请输入房间号" class="!w-[400px]" />
          </el-form-item>

          <el-form-item>
            <el-button-group>
              <el-button id="callBtn" type="primary" class="btn-success btn" @click="handleCall">创建</el-button>
              <el-button id="callBtn" type="primary" class="btn-success btn" @click="handleJoin">加入</el-button>
              <el-button id="callBtn" class="btn-success btn" :icon="useRenderIcon('ri:close-circle-fill')" type="danger" @click="handleCancel" />
              <!-- <el-button v-if="show" :icon="useRenderIcon('ri:fullscreen-fill')" @click="goFullScreen()">全屏</el-button>
              <el-button v-else :icon="useRenderIcon('ri:fullscreen-exit-fill')" @click="goFullScreen()">退出全屏</el-button> -->
            </el-button-group>
          </el-form-item>
        </el-form>
      </el-header>
      <el-main id="myFrame">
        <Stream v-if="status === 'CREATE'" ref="streamRef" />
        <Join v-else-if="status === 'JOIN'" ref="joinRef" />
      </el-main>
    </el-container>
  </div>
</template>
<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { reactive, ref } from "vue";
import Stream from "./stream.vue";
import Join from "./join.vue";
import { uuid } from "@repo/utils";

const status = ref("CREATE");
const show = ref(true);
const form = reactive({
  roomId: uuid()
});
const streamRef = ref();
const joinRef = ref();
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
  status.value = "CREATE";
  streamRef.value.handleCall(form);
};
const handleCancel = () => {
  streamRef.value.handleOut(form);
};

const handleJoin = () => {
  status.value = "JOIN";
  joinRef.value.handleCall(form);
};
</script>
