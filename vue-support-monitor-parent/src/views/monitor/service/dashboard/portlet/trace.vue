<template>
  <div class="h-full">
    <aYinTechBorderB4>
      <el-empty v-if="listData.length === 0" />
      <SeamlessScroll v-else ref="scroll" :data="listData" :class-option="classOption" class="warp h-full">
        <div v-for="(item, index) in listData" :key="index" class="h-[38px] flex flex-1 align-middle m-1 top-5" style="line-height: 38px">
          <div class="basis-1/7 !min-w-[40px] px-[10px]">{{ dateFormat(item.timestamp * 1) }}</div>
          <div class="basis-1/7 px-[10px]">{{ item.method }}</div>
          <div class="basis-1/7 truncate px-[10px] !w-[300px]">{{ item.text }}</div>
          <div class="basis-1/7 px-[10px]">{{ item.cost }}ms</div>
        </div>
      </SeamlessScroll>
    </aYinTechBorderB4>
  </div>
</template>

<script setup>
import { fetchIndicatorHGet, fetchSearchQuery } from "@/api/monitor/service";
import SeamlessScroll from "@/components/ReSeamlessScroll/index";
import { defineExpose, defineProps, reactive, onMounted, ref } from "vue";
import { Md5 } from "ts-md5";
import { dateFormat } from "@/utils/date";

const props = defineProps({
  history: Boolean,
  form: Object,
  condition: Object
});
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
