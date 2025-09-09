<script setup>
import { defineExpose, onMounted, reactive, ref, defineAsyncComponent } from "vue";
import Wait from "@repo/assets/images/wait.apng";
import Error from "@repo/assets/images/error.png";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import "viewerjs/dist/viewer.css";
import { api as viewerApi } from "v-viewer";
import "video.js/dist/video-js.css";
import { VideoPlayer } from "@videojs-player/vue";

const props = defineProps({
  form: {
    type: Object,
    default: () => {},
  },
  env: {
    type: Object,
    default: () => {},
  },
});
const images = reactive([]);
const process = ref(10);
const mode = reactive({
  status: "none",
});

const initialImageIndex = async () => {
  mode.status = "start";
  process.value = 10;
  for (let index = 0; index < props.form.parameters.number; index++) {
    images[index] = Wait;
  }
};

const updateImage = async (value) => {
  clearImage();
  for (let index = 0; index < value.length; index++) {
    images[index] = value[index] || Error;
  }
};

const finish = async () => {
  mode.status = "end";
};
const updateImageIndex = async (value) => {
  process.value = value;
};
const handleDownload = (url) => {
  const link = document.createElement("a");
  link.href = url;
  link.click();
};

const failure = async () => {
  for (let index = 0; index < props.form.parameters.number; index++) {
    images[index] = Error;
  }
};
const handlePreview = (url) => {
  const _images = [];
  if (url) {
    _images.push(url);
  } else {
    _images.push(...images);
  }
  viewerApi({
    images: _images,
    options: {
      backdrop: true,
      inline: true,
    },
  });
};
const clearImage = async () => {
  for (let index = 0; index < props.form.parameters.number; index++) {
    delete images[index];
  }
};
const toolShow = reactive({});
defineExpose({
  failure,
  updateImage,
  clearImage,
  finish,
  initialImageIndex,
  updateImageIndex,
});
</script>
<template>
  <div class="flex justify-start gap-2 h-[261px] pl-[20px]" :style="{ '--n': props.form.parameters.number }">
    <div v-for="(item, index) in props.form.parameters.number" :class="[{ img: process < 100 }]" class="overflow-hidden loading size1 relative z-0 w-[261px] h-[261px]" v-if="mode.status == 'start'">
      <b class="absolute left-4 top-0" style="font-size: 14px">进度: {{ process }}%</b>
      <div :style="{ transform: 'translateY(' + (100 - process) + '%)' }" class="absolute item">
        <img :src="images[index]" class="w-[261px] h-[261px] process" :class="[{ img: process >= 100 }, { 'image-container': process < 100 }]" v-if="process < 100" />
        <template v-else-if="process >= 100 && props.form.sysAiModuleType == 'VIDEO'">
          <VideoPlayer
            :controlBar="{
              timeDivider: true,
              durationDisplay: true,
              remainingTimeDisplay: true,
              fullscreenToggle: true,
            }"
            notSupportedMessage="此视频暂无法播放，请稍后再试"
            :height="250"
            :width="250"
            :src="images[index]"
            controls
            :autoplay="false"
            language="cn"
            :playbackRates="[0.5, 1, 1.5, 2]"
            class="w-full video process"
          />
        </template>
      </div>
    </div>
    <div
      v-for="(item, index) in props.form.parameters.number"
      :class="{
        size: props.form.sysAiModuleType == 'VINCENT',
      }"
      v-else-if="mode.status == 'end'"
      class="cursor-pointer relative z-0 w-[261px] h-[261px]"
    >
      <div :style="{ transform: 'translateY(' + (100 - process) + '%)' }" class="absolute item w-[261px] h-[261px]">
        <img :src="images[index]" class="w-full img process" v-if="props.form.sysAiModuleType == 'VINCENT'" @click.prevent="handlePreview(images[index])" @mouseover="toolShow[images[index]] = true" @mouseleave="toolShow[images[index]] = false" />
        <VideoPlayer
          :controlBar="{
            timeDivider: true,
            durationDisplay: true,
            remainingTimeDisplay: true,
            fullscreenToggle: true,
          }"
          notSupportedMessage="此视频暂无法播放，请稍后再试"
          :height="250"
          :width="250"
          :src="images[index]"
          controls
          :autoplay="false"
          language="cn"
          :playbackRates="[0.5, 1, 1.5, 2]"
          class="w-full video process"
          v-else-if="props.form.sysAiModuleType == 'VIDEO'"
        />
      </div>
      <div class="absolute tool img z-100 bottom-0 p-2 h-0" v-if="images[index] && toolShow[images[index]]">
        <el-button circle :icon="useRenderIcon('ep:download')" @click="handleDownload(images[index])"></el-button>
        <el-button circle :icon="useRenderIcon('ep:view')" @click.stop="handlePreview()"></el-button>
      </div>
    </div>

    <defs>
      <mask id="mask">
        <image :href="Wait" x="0" y="0" width="100%" height="100%" />
      </mask>
    </defs>
  </div>
</template>
<style scoped lang="scss">
.size {
  --wanx-v2-color7: #f7f8fc;
  background: var(--wanx-v2-color7);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  width: 261px;
  height: 261px;
  backdrop-filter: blur(10px) brightness(90%);
  background-color: rgba(255, 255, 255, 0.5);
  box-shadow:
    0px 2px 4px 0px rgba(0, 0, 0, 0.4),
    0px 7px 13px -3px rgba(0, 0, 0, 0.3),
    0px -3px 0px 0px rgba(0, 0, 0, 0.2) inset;
}
.img {
  border-radius: 16px;
  box-shadow:
    0px 2px 4px 0px rgba(0, 0, 0, 0.4),
    0px 7px 13px -3px rgba(0, 0, 0, 0.3),
    0px -3px 0px 0px rgba(0, 0, 0, 0.2) inset;
}
.tool {
  backdrop-filter: blur(10px) brightness(90%);
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  width: 100%;
  height: 48px;
}
.image-container::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0) 80%); /* 渐变阴影 */
  z-index: -1; /* 确保阴影在图片下方 */
  mask-image: url("#mask"); /* 使用SVG遮罩 */
  -webkit-mask-image: url("#mask");
}
.item {
  bottom: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  left: 0;
  position: absolute;
  transform: translateY(100%);
  transition: all 1s;
  width: 100%;
  z-index: 1;
}
.loading {
  background-color: #f7f8fc;
}
</style>
