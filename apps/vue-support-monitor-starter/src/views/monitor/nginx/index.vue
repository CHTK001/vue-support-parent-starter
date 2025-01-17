<template>
  <div class="p-2">
    <el-header class="flex !justify-end">
      <el-button :icon="useRenderIcon('ep:plus')" class="btn-text" @click="handleRowClick({}, 'add')" />
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
        <div>
          <el-button :icon="useRenderIcon('ri:align-vertically')" title="解析" size="small" @click.stop="handleBoradcast(row)" />
          <el-button :icon="useRenderIcon('ri:settings-3-line')" title="设置" size="small" @click.stop="handleSetting(row)" />
          <el-button v-if="row.monitorMqttServerStatus == 1" type="danger" size="small" :icon="useRenderIcon('ri:stop-circle-line')" @click.stop="handleStop(row)" />
          <el-button v-else :icon="useRenderIcon('ri:play-circle-line')" size="small" @click.stop="handleStart(row)" />
        </div>
      </template>
    </ScArticleSlot>
    <Save ref="saveRef" @success="handlerSuccess" />
    <Boradcast ref="boradcastRef" @success="handlerSuccess" />
    <Setting ref="settingRef" @success="handlerSuccess" />
  </div>
</template>
<script setup>
import { fetchPageNginxConfig } from "@/api/monitor/nginx";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { defineAsyncComponent, nextTick, ref } from "vue";
const ScArticleSlot = defineAsyncComponent(() => import("@repo/components/ScArticleSlot/index.vue"));
const Save = defineAsyncComponent({
  loader: () => import("./save.vue"),
  delay: 1000
});
const Boradcast = defineAsyncComponent({
  loader: () => import("./analysis.vue"),
  delay: 1000
});
const Setting = defineAsyncComponent({
  loader: () => import("./http.vue"),
  delay: 1000
});

const saveRef = ref();
const boradcastRef = ref();
const settingRef = ref();
const articleRef = ref();

const handlerSuccess = async () => {
  articleRef.value.refresh();
};
const handleRowClick = async (data, mode) => {
  nextTick(() => {
    saveRef.value.handleOpen(mode || "edit", data);
  });
};
const handleBoradcast = async (data, mode) => {
  nextTick(() => {
    boradcastRef.value.handleOpen(mode || "edit", data);
  });
};
const handleSetting = async (data, mode) => {
  nextTick(() => {
    settingRef.value.handleOpen(mode || "edit", data);
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
