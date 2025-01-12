<template>
  <div class="p-2">
    <el-header class="flex !justify-end" @click="handleRowClick({}, 'add')">
      <el-button :icon="useRenderIcon('ep:plus')" class="btn-text" />
    </el-header>
    <ScArticleSlot ref="articleRef" :url="fetchPageNginxConfig" :rowClick="handleRowClick">
      <template #top="{ row }">
        <el-icon :size="98" class="cover" color="green">
          <component :is="useRenderIcon('simple-icons:nginx')" />
        </el-icon>
        <el-tag type="success" class="type">{{ row.monitorMqttServerStatus == 1 ? "启动" : "暂停" }}</el-tag>
      </template>

      <template #title="{ row }">
        <el-text>{{ row.monitorMqttServerName }}</el-text>
      </template>

      <template #bottom="{ row }">
        <el-text>{{ row.createTime }}</el-text>
      </template>

      <template #option="{ row }">
        <el-button v-if="row.monitorMqttServerStatus == 1" type="danger" size="small" :icon="useRenderIcon('ri:stop-circle-line')" @click.stop="handleStop(row)" />
        <el-button v-else :icon="useRenderIcon('ri:play-circle-line')" size="small" @click.stop="handleStart(row)" />
      </template>
    </ScArticleSlot>
    <Save ref="saveRef" @success="handlerSuccess" />
  </div>
</template>
<script setup>
import { fetchPageNginxConfig } from "@/api/monitor/nginx";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { defineAsyncComponent, nextTick, ref } from "vue";
const ScArticleSlot = defineAsyncComponent(() => import("@repo/components/ScArticleSlot/index.vue"));
const Save = defineAsyncComponent(() => import("./save.vue"));

const saveRef = ref();
const articleRef = ref();

const handlerSuccess = async () => {
  articleRef.value.refresh();
};
const handleRowClick = async (data, mode) => {
  nextTick(() => {
    saveRef.value.handleOpen(mode || "edit", data);
  });
};
</script>
<style scoped>
.cover {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.type {
  position: absolute;
  top: 5px;
  right: 5px;
  padding: 5px 4px;
  font-size: 12px;
  color: #000 !important;
}
</style>
