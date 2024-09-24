<template>
  <div class="h-full">
    <aYinTechBorderB4>
      <el-empty v-if="listData.length === 0" />
      <SeamlessScroll v-else ref="scroll" :data="listData" :class-option="classOption" class="warp !h-[90%] pt-[30px]">
        <techButtonB1 v-for="(item, index) in listData" :key="index" :config="config" class="h-[38px] w-full py-[14px]">
          <div class="flex flex-1 w-full">
            <div class="basis-3/7 truncate px-[10px]">
              <el-tooltip :content="dateFormat(item.timestamp * 1)">
                {{ dateFormat(item.timestamp * 1) }}
              </el-tooltip>
            </div>
            <div class="basis-3/7 truncate px-[10px]">
              <el-tooltip :content="item.text">
                {{ item.text }}
              </el-tooltip>
            </div>
            <div class="basis-1/7 px-[10px]">{{ item.cost }}ms</div>
          </div>
        </techButtonB1>
      </SeamlessScroll>
      <div class="absolute top-[-3px] cursor-pointer">
        <el-icon>
          <component :is="useRenderIcon('ep:search')" @click="onDetail" />
        </el-icon>
      </div>
      <detail v-if="detailVisible" ref="detailRef" :form="form" />
    </aYinTechBorderB4>
  </div>
</template>

<script setup>
import { fetchSearchQuery } from "@/api/monitor/service";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import SeamlessScroll from "@/components/ReSeamlessScroll/index";
import { dateFormat } from "@/utils/date";
import { Md5 } from "ts-md5";
import { defineExpose, defineProps, nextTick, onMounted, reactive, ref } from "vue";
import detail from "./memdetail.vue";

const detailVisible = ref(false);
const detailRef = ref();
const onDetail = async () => {
  detailVisible.value = true;
  await nextTick();
  detailRef.value?.open();
};
const props = defineProps({
  history: Boolean,
  form: Object,
  condition: Object
});

const config = {
  decorationColorAlt: true,
  scaleAction: false,
  decorationLength: 19,
  glow: true,
  class: "disabled",
  scale: 0.95,
  caretDistance: 5,
  caretWidth: 5
};
const update = async data => {
  if (listData.value.length > 20) {
    listData.value.splice(0, 1);
  }
  listData.value.push({
    timestamp: data.timestamp,
    method: data.method,
    text: data.url,
    cost: data.cost
  });
};

const classOption = reactive({
  direction: "top"
});

const listData = ref([]);
const initialCounter = async () => {
  if (props.history) {
    const q = {};
    Object.assign(q, props.condition);
    q.name = "url:" + Md5.hashStr("URL:" + props.form.host + props.form.port);
    q.count = 20;
    q.fromTimestamp = new Date(new Date(new Date().toLocaleDateString()).getTime()).getTime();
    q.toTimestamp = new Date(new Date(new Date().toLocaleDateString()).getTime() + 24 * 60 * 60 * 1000 - 1).getTime();
    fetchSearchQuery(q).then(res => {
      listData.value = res.data.data;
    });
  }
};
onMounted(async () => {
  initialCounter();
});

defineExpose({
  update
});
</script>
<style lang="scss" scoped>
.border-content {
  height: 100%;
}
</style>
