<template>
  <ScDialog
    v-model="visible"
    :title="`配置预览 — ${project?.projectName ?? ''}`"
    width="800px"
    destroy-on-close
  >
    <div class="config-toolbar">
      <span class="config-path">{{ project?.configPath || '未配置路径' }}</span>
      <ScButton size="small" plain @click="load">
        <IconifyIconOnline icon="ep:refresh" />
        刷新
      </ScButton>
      <ScButton size="small" plain @click="copyContent">
        <IconifyIconOnline icon="ep:copy-document" />
        复制
      </ScButton>
    </div>

    <div v-if="loading" v-loading="true" class="loading-area" />
    <el-empty v-else-if="!content" description="暂无配置内容或路径未配置" :image-size="60" />
    <pre v-else class="config-content thin-scroller">{{ content }}</pre>

    <template #footer>
      <ScButton @click="visible = false">关闭</ScButton>
    </template>
  </ScDialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { IconifyIconOnline } from "@repo/components";
import { message } from "@repo/utils";
import type { SysProject } from "../../api/manage/project";
import { fetchProjectConfig } from "../../api/manage/project";

const visible = ref(false);
const project = ref<SysProject | null>(null);
const content = ref("");
const loading = ref(false);

const load = async () => {
  if (!project.value?.projectId) return;
  loading.value = true;
  try {
    const res = await fetchProjectConfig(project.value.projectId);
    content.value = res.code === "00000" ? (res.data ?? "") : "";
  } finally {
    loading.value = false;
  }
};

const copyContent = async () => {
  if (!content.value) return;
  await navigator.clipboard.writeText(content.value);
  message("已复制到剪贴板", { type: "success" });
};

const open = (p: SysProject) => {
  project.value = p;
  content.value = "";
  visible.value = true;
  load();
};

defineExpose({ open });
</script>

<style scoped lang="scss">
.config-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.config-path {
  flex: 1;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.loading-area { height: 200px; }
.config-content {
  background: #1e293b;
  color: #e2e8f0;
  font-family: "Fira Code", "Consolas", monospace;
  font-size: 13px;
  line-height: 1.7;
  padding: 16px;
  border-radius: 10px;
  max-height: 480px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
