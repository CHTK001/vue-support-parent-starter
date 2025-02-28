<script setup>
import { defineProps, defineExpose, onMounted, reactive, ref, defineAsyncComponent } from "vue";
import Wait from "@repo/assets/images/wait.apng";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import "viewerjs/dist/viewer.css";
import { api as viewerApi } from "v-viewer";
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
const process = reactive([]);
const mode = reactive({
  status: "none",
});

const initialImageIndex = async () => {
  mode.status = "start";
  for (let index = 0; index < props.form.parameters.number; index++) {
    images[index] = Wait;
    process[index] = 10;
  }
};

const updateImage = async (value) => {
  for (let index = 0; index < value.length; index++) {
    images[index] = value[index];
  }
};

const finish = async () => {
  mode.status = "end";
};
const updateImageIndex = async (index, value) => {
  process[index] = value;
};
const handleDownload = (url) => {
  const link = document.createElement("a");
  link.href = url;
  link.click();
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
const toolShow = reactive({});
defineExpose({
  updateImage,
  finish,
  initialImageIndex,
  updateImageIndex,
});
</script>
<template>
  <div class="flex justify-start gap-1" :style="{ '--n': props.form.parameters.number }">
    <div v-for="(item, index) in props.form.parameters.number" class="h-full w-full size relative z-0" v-if="mode.status == 'start'">
      <b class="absolute left-4 top-0" style="font-size: 14px">进度: {{ process[index] }}%</b>
      <div :style="{ transform: 'translateY(' + (100 - process[index]) + '%)' }" class="absolute item">
        <img :src="images[index]" class="w-full process" />
      </div>
    </div>
    <div v-for="(item, index) in props.form.parameters.number" @click.prevent="handlePreview(images[index])" class="h-full w-full cursor-pointer size relative z-0" v-else-if="mode.status == 'end'" @mouseover="toolShow[images[index]] = true" @mouseleave="toolShow[images[index]] = false">
      <div :style="{ transform: 'translateY(' + (100 - process[index]) + '%)' }" class="absolute item">
        <img :src="images[index]" class="w-full process" />
      </div>
      <div class="absolute tool img z-100 bottom-0 p-2 h-0" v-if="images[index] && toolShow[images[index]]">
        <el-button circle :icon="useRenderIcon('ep:download')" @click="handleDownload(images[index])"></el-button>
        <el-button circle :icon="useRenderIcon('ep:view')" @click.stop="handlePreview()"></el-button>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
img {
  box-shadow:
    0px 2px 4px 0px rgba(0, 0, 0, 0.4),
    0px 7px 13px -3px rgba(0, 0, 0, 0.3),
    0px -3px 0px 0px rgba(0, 0, 0, 0.2) inset;
}
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
.tool {
  backdrop-filter: blur(10px) brightness(90%);
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  width: 100%;
  height: 48px;
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
</style>
