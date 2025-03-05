<script setup>
import { fetchHistoryTaskForVincent } from "@/api/ai/text-generations";
import { defineExpose, defineEmits, defineProps, onMounted, reactive, shallowRef, defineAsyncComponent } from "vue";
import Error from "@repo/assets/images/error.png";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import "viewerjs/dist/viewer.css";
import { api as viewerApi } from "v-viewer";
import { checkImage } from "@repo/utils";
import "video.js/dist/video-js.css";
import { VideoPlayer } from "@videojs-player/vue";

const emit = defineEmits(["redrawer"]);
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
const toolShow = reactive({});
const historyData = shallowRef([]);
/**
 * 加载历史数据(前十张)
 * @return {*}
 */
const loadHistoryData = async () => {
  fetchHistoryTaskForVincent({ sysAiVincentTaskType: props.env.category }).then(({ data }) => {
    historyData.value = data.map((it) => {
      return {
        ...it,
        config: !it.sysAiVincentTaskCondition ? {} : JSON.parse(it.sysAiVincentTaskCondition),
        sysAiVincentTaskUrls: it?.sysAiVincentTaskUrl?.split(",") || [],
        sysAiVincentTaskLocalUrls: it?.sysAiVincentTaskLocalUrl?.split(",") || [],
      };
    });
  });
};

/**
 * 预览图片
 * @param {*}
 * @return {*}
 */
const handlePreview = (url) => {
  const _images = [];
  if (url) {
    _images.push(url);
    viewerApi({
      images: _images,
      options: {
        backdrop: true,
        inline: true,
      },
    });
    return;
  }
  let _loadingImages = [];
  historyData.value.forEach((ele) => {
    ele.sysAiVincentTaskLocalUrls.forEach((url) => {
      _loadingImages.push(checkImage(url));
    });
    ele.sysAiVincentTaskLocalUrls.forEach((url) => {
      _loadingImages.push(checkImage(url));
    });
  });
  Promise.allSettled(_loadingImages).then((results) => {
    results.forEach((it) => {
      if (!it.value) {
        return;
      }
      _images.push(it.value);
    });
    viewerApi({
      images: _images,
      options: {
        backdrop: true,
        inline: true,
      },
    });
  });
};
/**
 * 下载图片
 * @param {*}
 * @return {*}
 */
const handleDownload = (url) => {
  const link = document.createElement("a");
  link.href = url;
  link.click();
};
/**
 * 获取span
 * @param {*}
 * @return {*}
 */
const getSpan = (_item) => {
  const _n = _item.parameters?.number || 1;
  return 24 - _n * 4 - 5;
};
onMounted(async () => {
  loadHistoryData();
});

/**
 * 更新数据
 * @param {*}
 * @return {*}
 */
const updateData = async () => {
  loadHistoryData();
};

/**
 * 重绘
 * @param {*}
 * @return {*}
 */
const handleReDraw = async (prompt) => {
  emit("redrawer", prompt);
};
defineExpose({
  updateData,
});
</script>
<template>
  <div class="!overflow-auto history relative">
    <el-row v-for="row in historyData" class="flex" :gutter="4">
      <el-col :span="20">
        <el-row :gutter="6">
          <el-col :span="4" v-for="(item, index) in row.config?.parameters?.number || 1">
            <div
              class="img-item cursor-pointer relative z-0"
              :class="[
                {
                  video: props.form.sysAiModuleType == 'VIDEO',
                },
                {
                  image: props.form.sysAiModuleType !== 'VIDEO',
                },
              ]"
            >
              <el-image
                :src="row.sysAiVincentTaskUrls[index]"
                class="img"
                v-if="props.form.sysAiModuleType == 'VINCENT'"
                @click.prevent="handlePreview(row.sysAiVincentTaskUrls[index])"
                @mouseover="toolShow[row.sysAiVincentTaskUrls[index]] = true"
                @mouseleave="toolShow[row.sysAiVincentTaskUrls[index]] = false"
              >
                <template #error>
                  <el-image :src="row.sysAiVincentTaskLocalUrls[index]" class="img2" style="--show-level-one-shadow: 0">
                    <template #error>
                      <img :src="Error" alt="" class="errorImg" />
                    </template>
                  </el-image>
                </template>
              </el-image>
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
                :src="row.sysAiVincentTaskUrls[index]"
                controls
                :autoplay="false"
                language="cn"
                :playbackRates="[0.5, 1, 1.5, 2]"
                class="w-full video process"
                v-else-if="props.form.sysAiModuleType == 'VIDEO'"
              />

              <div class="absolute tool z-1 bottom-0 p-2" v-if="toolShow[row.sysAiVincentTaskUrls[index]] && props.form.sysAiModuleType == 'VINCENT'">
                <el-button circle :icon="useRenderIcon('ep:download')" @click="handleDownload(row.sysAiVincentTaskUrls[index])"></el-button>
                <el-button circle :icon="useRenderIcon('ep:view')" @click.stop="handlePreview()"></el-button>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-col>
      <el-col :span="4" class="h-full w-full" :title="row.config?.input?.prompt">
        <el-card class="h-full w-full card ribbon-3">
          <div class="flex flex-col relative z-0">
            <div class="otherTypeCou--QIGeNEET">
              <div class="otherType--fqMcYymU">{{ row.config.model }}</div>
            </div>
            <div class="prompt--Kll06NyU">
              <div class="text--gF1ZsVLO textLine3--Mzcb_C92" data-spm-anchor-id="5176.28735648.0.i0.1ed81eceaEw8DO" @click="handleReDraw(row.config?.input?.prompt)">{{ row.config?.input?.prompt }}</div>
            </div>
            <div class="help--DsIM8RLY" v-if="row?.input?.refImage">
              <div class="popoverLine--Zm22xWTH" style="gap: 8px">
                <div>
                  <span>参考图像</span>
                  <el-image :src="row.input.refImage" class="w-[40px] h-[40px]" />
                </div>
              </div>
            </div>
            <div class="btnLine--kz2jqeAV active--SBaVjOyL"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
<style scoped lang="scss">
.history {
  height: calc(100vh - 380px);
  padding: 0 20px 0 20px;
}
.image,
.card,
.img-item {
  max-width: 250px;
  max-height: 250px;
  border-radius: 10px;
  margin: 5px 0 5px 0;
}
.card {
  height: auto;
  width: auto;
}
.video {
  height: 250px;
  width: 250px;
  border-radius: 10px;
  padding: 5px 0 5px 0;
  box-shadow:
    0px 2px 4px 0px rgba(0, 0, 0, 0.4),
    0px 7px 13px -3px rgba(0, 0, 0, 0.3),
    0px -3px 0px 0px rgba(0, 0, 0, 0.2) inset;
}
.img {
  --show-level-one-shadown: 1;
  height: 100%;
  width: 100%;
  border-radius: 10px;
  box-shadow:
    0px 2px 4px 0px rgba(0, 0, 0, calc(var(--show-level-one-shadown) - 0.6)),
    0px 7px 13px -3px rgba(0, 0, 0, calc(var(--show-level-one-shadown) - 0.7)),
    0px -3px 0px 0px rgba(0, 0, 0, calc(var(--show-level-one-shadown) - 0.8)) inset;
  &:has(.img2) {
    --show-level-one-shadown: 0;
  }
  .img2 {
    box-shadow:
      0px 2px 4px 0px rgba(0, 0, 0, 0.4),
      0px 7px 13px -3px rgba(0, 0, 0, 0.3),
      0px -3px 0px 0px rgba(0, 0, 0, 0.2) inset;
  }
}
.tool {
  backdrop-filter: blur(10px) brightness(90%);
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  width: 100%;
}
.btnLine--kz2jqeAV.active--SBaVjOyL {
  justify-content: space-between;
}
.btnLine--kz2jqeAV {
  align-items: center;
  display: flex;
}
.popoverLine--Zm22xWTH {
  align-items: center;
  display: flex;
}
.textLine3--Mzcb_C92 {
  -webkit-line-clamp: 3;
}
.help--DsIM8RLY {
  flex: 1;
}
.text--gF1ZsVLO {
  -webkit-box-orient: vertical;
  cursor: pointer;
  display: inline-block;
  display: -webkit-box;
  overflow: hidden;
  padding: 2px 4px;
  text-overflow: ellipsis;
}
.prompt--Kll06NyU {
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  color: var(--wanx-v2-color10);
  display: -webkit-box;
  font-size: 13px;
  margin: 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
}
.otherTypeCou--QIGeNEET {
  display: flex;
  .otherType--fqMcYymU {
    background: var(--wanx-v2-color5);
    border-radius: 100px;
    color: var(--wanx-v2-color1);
    font-size: 13px;
    font-weight: var(--wanx-v2-font500);
    margin-right: 8px;
    padding: 4px 12px;
    padding-left: 0px;
    text-align: center;
  }
}

.ribbon-3 {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 150px;
  height: 150px;
  overflow: hidden;

  &::before,
  &::after {
    content: "";
    position: absolute;
  }

  &::before {
    left: 8px;
    width: 40px;
    height: 8px;
    border-radius: 8px 8px 0px 0px;
    background-color: var(--ribbon-primary-color);
    opacity: 0.6;
  }

  &::after {
    border-radius: 0px 8px 8px 0px;
    width: 8px;
    height: 40px;
    right: 0px;
    bottom: 8px;
    background-color: #615ced;
    opacity: 0.6;
  }

  & > span {
    position: absolute;
    top: 20%;
    right: -40%;
    z-index: 2;
    width: 150%;
    height: 40px;
    overflow: hidden;
    transform: rotate(45deg);
    border: 1px dashed;
    box-shadow:
      0 0 0 3px #615ced,
      0px 21px 5px -18px rgba(0, 0, 0, 0.6);
    background: #615ced;

    /* 文本居中 */
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
  }
}
</style>
