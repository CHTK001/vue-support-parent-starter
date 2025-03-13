<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

const url = computed(() => {
  return link[type.value].replace("{{input}}", input.value);
});

const show = ref(true);
const link = reactive({
  1: "https://jx.xmflv.cc/?url={{input}}?vfm=2008_aldbd&fc=828fb30b722f3164&fv=p_0",
  2: "https://www.8090g.cn/?url={{input}}",
  3: "https://vip.parwix.com:4433/player/?url={{input}}",
  4: "https://jx.m3u8.tv/jiexi/?url={{input}}"
});
const type = ref(1);
const input = ref();
const goFullScreen = () => {
  const iframe: any = document.getElementById("myFrame");
  // 进入全屏模式
  if (iframe.requestFullscreen) {
    iframe.requestFullscreen();
  } else if (iframe.mozRequestFullScreen) {
    /* Firefox */
    iframe.mozRequestFullScreen();
  } else if (iframe.webkitRequestFullscreen) {
    /* Chrome, Safari & Opera */
    iframe.webkitRequestFullscreen();
  } else if (iframe.msRequestFullscreen) {
    /* IE/Edge */
    iframe.msRequestFullscreen();
  }
};
</script>

<template>
  <div>
    <el-form v-if="show" :inline="true">
      <el-form-item label="解析服务" class="w-[200px]">
        <el-select v-model="type" class="w-[200px]">
          <el-option label="智能解析" :value="1" />
          <el-option label="备用地址1" :value="2" />
          <el-option label="备用地址2" :value="3" />
          <el-option label="备用地址3" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item label="视频地址" class="w-[800px]">
        <el-input v-model="input" class="w-[800px]" />
      </el-form-item>
    </el-form>
    <div class="fixed right-0">
      <el-button v-if="show" :icon="useRenderIcon('ri:fullscreen-fill')" @click="goFullScreen()">全屏</el-button>
      <el-button v-else :icon="useRenderIcon('ri:fullscreen-exit-fill')" @click="goFullScreen()">退出全屏</el-button>
      <el-button v-if="show" :icon="useRenderIcon('ri:arrow-up-double-line')" @click="show = false" />
      <el-button v-else :icon="useRenderIcon('ri:arrow-down-double-line')" @click="show = true" />
    </div>
    <iframe id="myFrame" class="h-full w-full overflow-auto" :src="url" />
  </div>
</template>

<style scoped lang="scss"></style>
