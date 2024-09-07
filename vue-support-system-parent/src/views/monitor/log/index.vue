<template>
  <div class="h-full relative" :style="{ width: width }">
    <div class="absolute" style="top: 1%; left: 0%; z-index: 1">
      <el-radio-group v-model="form.level">
        <el-radio-button value="" label="">全部</el-radio-button>
        <el-radio-button value="ERROR" label="">ERROR</el-radio-button>
        <el-radio-button value="INFO" label="">INFO</el-radio-button>
        <el-radio-button value="DEBUG" label="">DEBUG</el-radio-button>
      </el-radio-group>
      <!-- <el-button v-if="form.supoortBackup === true" circle type="primary" icon="el-icon-search" @click="doSearch" /> -->
      <!-- <el-button v-if="form.supoortBackup === true" circle type="primary" icon="sc-icon-download" @click="doDownload" /> -->
    </div>
    <div ref="containerRef" class="h-full overflow-auto">
      <ul>
        <li v-for="(item, index) in dataList" :key="index">
          {{ getMessage(item?.data) }}
        </li>
      </ul>

      <el-empty v-if="!dataList || dataList.length == 0" class="h-full" />
    </div>
  </div>

  <!-- <search-dialog v-if="searchDialogStatus" ref="searchDialogRef" /> -->
  <!-- <download-dialog v-if="downloadDialogStatus" ref="downloadDialogRef" /> -->
</template>
<script setup>
import { useConfigStore } from "@/store/modules/config";
import { nextTick, ref, onUnmounted, watch, computed, reactive } from "vue";
import { dateFormat } from "@/utils/date";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
// 引入Prism.js

const form = reactive({
  level: null
});
const sqlPre = ref();
const useConfigStoreObject = useConfigStore();
const socket = computed(() => {
  return useConfigStoreObject.socket; //需要监听的数据
});

const dataList = reactive([]);

const filter = row => {
  return form.level && row?.level == form.level;
};
const event = async row => {
  if (filter(row)) {
    return;
  }
  dataList.unshift(row);
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
      newValue?.off("SUPER_ADMIN_EVENT_SQL_MESSAGE:LOG");
      newValue?.on("SUPER_ADMIN_EVENT_SQL_MESSAGE:LOG", event);
    }
    return newValue;
  },
  { deep: true, immediate: true }
);

onUnmounted(() => {
  socket.value?.off("SUPER_ADMIN_EVENT_SQL_MESSAGE:LOG");
});
</script>
<style scoped lang="scss">
.shadow {
  box-shadow: 2px 1px 5px 2px #999;
}
</style>
