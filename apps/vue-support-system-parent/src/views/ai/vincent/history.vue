<script setup>
import { fetchHistoryTaskForVincent } from "@/api/ai/vincent";
import { defineExpose, defineProps, onMounted, reactive, shallowRef } from "vue";
import Error from "@repo/assets/images/error.png";
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
const toolShow = reactive({});
const historyData = shallowRef([]);
const loadHistoryData = async () => {
  fetchHistoryTaskForVincent({}).then(({ data }) => {
    historyData.value = data.map((it) => {
      return {
        ...it,
        config: JSON.parse(it.sysAiVincentTaskCondition),
        sysAiVincentTaskUrls: it?.sysAiVincentTaskUrl?.split(",") || [],
      };
    });
  });
};

const handlePreview = (url) => {
  const _images = [];
  if (url) {
    _images.push(url);
  } else {
    historyData.value.forEach((ele) => {
      _images.push(...ele.sysAiVincentTaskUrls);
    });
  }
  viewerApi({
    images: _images,
    options: {
      backdrop: true,
      inline: true,
    },
  });
};
const handleDownload = (url) => {
  const link = document.createElement("a");
  link.href = url;
  link.click();
};
const getSpan = (_item) => {
  const _n = _item.parameters.number;
  return 24 - _n * 4 - 5;
};
onMounted(async () => {
  loadHistoryData();
});

const updateData = async () => {
  loadHistoryData();
};

defineExpose({
  updateData,
});
</script>
<template>
  <div class="h-full !overflow-auto history relative">
    <el-divider></el-divider>
    <el-row v-for="row in historyData" class="flex">
      <el-col :span="4" v-for="(item, index) in row.config?.parameters?.number || 1">
        <div class="img-item cursor-pointer relative z-0" @click.prevent="handlePreview(row.sysAiVincentTaskUrls[index])" @mouseover="toolShow[row.sysAiVincentTaskUrls[index]] = true" @mouseleave="toolShow[row.sysAiVincentTaskUrls[index]] = false">
          <el-image :src="row.sysAiVincentTaskUrls[index]" class="img">
            <template #error>
              <img :src="Error" alt="" class="errorImg" />
            </template>
          </el-image>
          <div class="absolute tool z-1 bottom-0 p-2" v-if="toolShow[row.sysAiVincentTaskUrls[index]]">
            <el-button circle :icon="useRenderIcon('ep:download')" @click="handleDownload(row.sysAiVincentTaskUrls[index])"></el-button>
            <el-button circle :icon="useRenderIcon('ep:view')" @click.stop="handlePreview()"></el-button>
          </div>
        </div>
      </el-col>
      <el-col :span="getSpan(row.config)" />
      <el-col :span="5" class="h-full" :title="row.config.input.prompt">
        <div class="flex flex-col relative z-0">
          <div class="otherTypeCou--QIGeNEET">
            <div class="otherType--fqMcYymU">{{ row.config.model }}</div>
          </div>
          <div class="prompt--Kll06NyU">
            <div class="text--gF1ZsVLO textLine3--Mzcb_C92" data-spm-anchor-id="5176.28735648.0.i0.1ed81eceaEw8DO">{{ row.config.input.prompt }}</div>
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
      </el-col>
    </el-row>
  </div>
</template>
<style scoped lang="scss">
.history {
  height: calc(100vh - 125px);
}
.img-item {
  max-width: 250px;
  max-height: 250px;
  margin: 5px 0 5px 0;
}
.img {
  height: 100%;
  width: 100%;
  border-radius: 10px;
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
    text-align: center;
  }
}
</style>
