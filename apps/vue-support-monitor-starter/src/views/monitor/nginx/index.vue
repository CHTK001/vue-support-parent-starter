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
        <el-tag type="success" class="type">{{ row.running ? "启动" : "暂停" }}</el-tag>
      </template>

      <template #title="{ row }">
        <el-text>{{ row.monitorMqttServerName }}</el-text>
      </template>

      <template #bottom="{ row }">
        <el-text>{{ row.createTime }}</el-text>
      </template>

      <template #option="{ row }">
        <el-button-group class="ml-[1px]">
          <el-button :icon="useRenderIcon('ri:align-vertically')" title="解析" size="small" @click.stop="handleBoradcast(row)" />
          <el-button :icon="useRenderIcon('ri:settings-3-line')" title="设置" size="small" @click.stop="handleSetting(row)" />
          <el-button v-if="row.running" type="danger" size="small" :icon="useRenderIcon('ri:stop-circle-line')" title="暂停" @click.stop="handleStop(row)" />
          <el-button v-else :icon="useRenderIcon('ri:play-circle-line')" title="启动" size="small" @click.stop="handleStart(row)" />
          <el-button :icon="useRenderIcon('ri:restart-fill')" title="重启" size="small" @click.stop="handleRestart(row)" />
        </el-button-group>
      </template>
    </ScArticleSlot>
    <Save ref="saveRef" @success="handlerSuccess" />
    <Boradcast ref="boradcastRef" @success="handlerSuccess" />
    <Setting ref="settingRef" @success="handlerSuccess" />
  </div>
</template>
<script setup>
import { fetchPageNginxConfig, fetchStartNginxConfig, fetchStopNginxConfig, fetchRestartNginxConfig } from "@/api/monitor/nginx";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message } from "@repo/utils";
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

const handleStart = async data => {
  fetchStartNginxConfig(data).then(res => {
    if (res.code === "00000") {
      message("启动成功", { type: "success" });
      data.running = true;
      return;
    }
    message(res.msg, { type: "error" });
  });
};
const handleRestart = async data => {
  fetchRestartNginxConfig(data).then(res => {
    if (res.code === "00000") {
      message("重启成功", { type: "success" });
      data.running = true;
      return;
    }
    message(res.msg, { type: "error" });
  });
};

const handleStop = async data => {
  fetchStopNginxConfig(data).then(res => {
    if (res.code === "00000") {
      message("暂停成功", { type: "success" });
      data.running = false;
      return;
    }
    message(res.msg, { type: "error" });
  });
};
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
