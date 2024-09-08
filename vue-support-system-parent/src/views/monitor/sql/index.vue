<template>
  <div class="h-full relative">
    <div class="absolute" style="top: 1%; left: 0%; z-index: 1">
      <el-button class="sidebar-custom shadow" circle type="primary" :icon="useRenderIcon('simple-icons:logitech')" @click="openLog(false)" />
      <el-button v-if="isOpen" class="sidebar-custom shadow" circle type="primary" :icon="useRenderIcon('ri:eye-2-fill')" @click="formatOpen(false)" />
      <el-button v-else circle class="sidebar-custom shadow" type="primary" :icon="useRenderIcon('ri:eye-close-fill')" @click="formatOpen(true)" />
    </div>
    <div ref="containerRef" class="h-full overflow-auto">
      <ul>
        <li v-for="(item, index) in dataList" :key="index">
          <el-card class="w-full mt-[10px] !pd-[10px]">
            <el-tag>
              {{ dateFormat(item?.timestamp) }}
            </el-tag>
            <pre ref="sqlPre" class="language-sql line-numbers inline-color"> <code class="language-sql line-numbers inline-color"> {{ getMessage(item?.sql) }} </code> </pre>
          </el-card>
        </li>
      </ul>
      <el-empty v-if="!dataList || dataList.length == 0" class="h-full" />
      <time-layout v-if="openLogTime" ref="timeLayoutRef" />
    </div>
  </div>
</template>
<script setup>
import { useConfigStore } from "@/store/modules/config";
import { nextTick, ref, onUnmounted, watch, computed, reactive, markRaw } from "vue";
import { format } from "sql-formatter";
import { dateFormat } from "@/utils/date";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
// 引入Prism.js
import Prism from "prismjs";
// 引入SQL语言插件
import "prismjs/components/prism-sql.min.js";
import "prismjs/themes/prism-tomorrow.min.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.min.css";
import "prismjs/plugins/line-highlight/prism-line-highlight.min.css";
import "prismjs/plugins/inline-color/prism-inline-color.min.css";
import Time from "./time.vue";

const TimeLayout = markRaw(Time);
const sqlPre = ref();
const useConfigStoreObject = useConfigStore();
const socket = computed(() => {
  return useConfigStoreObject.socket; //需要监听的数据
});

const dataList = reactive([]);

const openLog = async () => {
  openLogTime.value = true;
  await nextTick();
  timeLayoutRef.value.open();
};
const isOpen = ref(false);
const timeLayoutRef = ref(null);
const openLogTime = ref(false);
const formatOpen = open => {
  isOpen.value = open;
  highlightSQL();
};
const event = async row => {
  try {
    const item = JSON.parse(row?.data);
    if (item?.sql) {
      dataList.unshift(item);
      if (dataList.length > 10000) {
        dataList.pop();
      }
      highlightSQL();
    }
  } catch (error) {}
};
const getMessage = sql => {
  return isOpen.value ? format(sql) : sql;
};
const highlightSQL = async () => {
  setTimeout(async () => {
    Prism.highlightAll();
    await nextTick;
    try {
      Prism.highlightElement(sqlPre);
    } catch (error) {}
  }, 300);
};

watch(
  socket,
  (newValue, oldValue) => {
    if (newValue) {
      if (!socket.value) {
        socket.value = newValue;
      }
      newValue?.off("SUPER_ADMIN_EVENT_SQL_MESSAGE_SQL");
      newValue?.on("SUPER_ADMIN_EVENT_SQL_MESSAGE_SQL", event);
    }
    return newValue;
  },
  { deep: true, immediate: true }
);

onUnmounted(() => {
  socket.value?.off("SUPER_ADMIN_EVENT_SQL_MESSAGE_SQL");
});
</script>
<style scoped lang="scss">
.shadow {
  box-shadow: 2px 1px 5px 2px #999;
}
</style>
