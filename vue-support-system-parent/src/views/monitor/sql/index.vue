<template>
  <div class="h-full relative" :style="{ width: width }">
    <div class="absolute" style="top: 1%; left: 0%; z-index: 1">
      <!-- <el-button v-if="form.supoortBackup === true" circle type="primary" icon="el-icon-search" @click="doSearch" /> -->
      <!-- <el-button v-if="form.supoortBackup === true" circle type="primary" icon="sc-icon-download" @click="doDownload" /> -->
      <el-button v-if="isOpen" class="sidebar-custom shadow" circle type="primary" :icon="useRenderIcon('ri:eye-2-fill')" @click="formatOpen(false)" />
      <el-button v-else circle class="sidebar-custom shadow" type="primary" :icon="useRenderIcon('ri:eye-close-fill')" @click="formatOpen(true)" />
    </div>
    <div ref="containerRef" class="h-full overflow-auto">
      <ul>
        <li v-for="(item, index) in dataList" :key="index">
          <el-card style="width: 100%">
            <el-tag>
              {{ dateFormat(item?.timestamp) }}
            </el-tag>
            <pre ref="sqlPre" class="language-sql line-numbers inline-color"> <code class="language-sql line-numbers inline-color"> {{ getMessage(item?.data) }} </code> </pre>
          </el-card>
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

const sqlPre = ref();
const useConfigStoreObject = useConfigStore();
const socket = computed(() => {
  return useConfigStoreObject.socket; //需要监听的数据
});

const dataList = reactive([]);

const isOpen = ref(false);
const formatOpen = open => {
  isOpen.value = open;
};
const event = async row => {
  dataList.unshift(row);
  if (dataList.length > 10000) {
    dataList.pop();
  }
  highlightSQL();
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
      newValue?.off("SUPER_ADMIN_EVENT_SQL_MESSAGE");
      newValue?.on("SUPER_ADMIN_EVENT_SQL_MESSAGE", event);
    }
    return newValue;
  },
  { deep: true, immediate: true }
);

onUnmounted(() => {
  socket.value?.off("SUPER_ADMIN_EVENT_SQL_MESSAGE");
});
</script>
<style scoped lang="scss">
.shadow {
  box-shadow: 2px 1px 5px 2px #999;
}
</style>
