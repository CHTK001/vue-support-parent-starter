<template>
  <div class="relative" :style="{ width: width }">
    <div class="fixed" style="top: 100px; right: 16px; z-index: 1">
      <el-row>
        <el-radio-group v-model="form.level">
          <el-radio-button value="" label="">全部</el-radio-button>
          <el-radio-button value="ERROR" label="">ERROR</el-radio-button>
          <el-radio-button value="INFO" label="">INFO</el-radio-button>
          <el-radio-button value="DEBUG" label="">DEBUG</el-radio-button>
        </el-radio-group>
      </el-row>
      <el-row class="relative mt-1">
        <el-input v-model="form.traceId" placeholder="请输入请求ID" />
      </el-row>
      <el-row class="relative mt-1">
        <el-button class="absolute right-0" circle type="danger" :icon="useRenderIcon('ep:delete-filled')" @click="dataList.length = 0" />
        <el-button class="absolute right-[40px] sidebar-custom shadow" circle type="primary" :icon="useRenderIcon('simple-icons:logitech')" @click="openLog(false)" />
      </el-row>
    </div>
    <div ref="containerRef" class="pl-[30px] pr-[30px] pt-[30px]">
      <ul style="height: calc(100dvwh - 120px)" class="overflow-auto">
        <li v-for="(item, index) in getData(dataList)" :key="index" style="font-size: 14px; font-family: none">
          <span style="color: rgb(22 165 67)">
            <b>[{{ dateFormat(item?.timestamp) }}]</b>
          </span>
          <span v-if="item?.level == 'INFO'" class="ml-1" style="color: rgb(93 137 239)">
            <b>[ {{ item?.level }}]</b>
          </span>
          <span v-else-if="item?.level == 'ERROR'" class="ml-1" style="color: rgb(255 0 0)">
            <b>[ {{ item?.level }}]</b>
          </span>

          <span class="ml-1">
            <b>[{{ item?.traceId }}]</b>
          </span>

          <span class="ml-1" style="color: rgb(207 55 55)">
            <b>[{{ item?.thread }}]</b>
          </span>

          <span class="ml-1">
            <b>[{{ item?.className }}]</b>
          </span>

          <span class="ml-1">
            <b>- {{ item?.message }}</b>
          </span>
        </li>
      </ul>

      <el-empty v-if="!dataList || dataList.length == 0" class="h-full" />
      <time-layout v-if="openLogTime" ref="timeLayoutRef" />
    </div>
  </div>
</template>
<script setup>
import { useConfigStore } from "@repo/core";
import { nextTick, ref, onUnmounted, watch, computed, reactive, markRaw } from "vue";
import { dateFormat } from "@repo/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import Time from "./time.vue";
const TimeLayout = markRaw(Time);
const timeLayoutRef = ref(null);
const openLogTime = ref(false);
const openLog = async () => {
  openLogTime.value = true;
  await nextTick();
  timeLayoutRef.value.open();
};
// 引入Prism.js

const form = reactive({
  level: null,
  traceId: null
});
const sqlPre = ref();
const useConfigStoreObject = useConfigStore();
const socket = computed(() => {
  return useConfigStoreObject.socket; //需要监听的数据
});

const dataList = reactive([]);

const getData = data => {
  return data.filter(item => {
    return filter(item);
  });
};
const filter = row => {
  return ((!form.level || (form.level && row?.level == form.level)) && !form.traceId) || (form.traceId && row?.traceId?.includes(form.traceId));
};
const event = async row => {
  var item;
  try {
    item = JSON.parse(row?.data);
  } catch (error) {
    return;
  }
  if (!filter(item)) {
    return;
  }
  dataList.unshift(item);
  if (dataList.length > 10000) {
    dataList.pop();
  }
};
const getMessage = sql => {
  return sql;
};

watch(
  socket,
  (newValue, oldValue) => {
    if (newValue) {
      if (!socket.value) {
        socket.value = newValue;
      }
      newValue?.off("SUPER_ADMIN_EVENT_SQL_MESSAGE_LOG");
      newValue?.on("SUPER_ADMIN_EVENT_SQL_MESSAGE_LOG", event);
    }
    return newValue;
  },
  { deep: true, immediate: true }
);

onUnmounted(() => {
  socket.value?.off("SUPER_ADMIN_EVENT_SQL_MESSAGE_LOG");
});
</script>
<style scoped lang="scss">
.shadow {
  box-shadow: 2px 1px 5px 2px #999;
}
</style>
