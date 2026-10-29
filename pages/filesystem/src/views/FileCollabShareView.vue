<!--
  协同分享只读视图 —— 全屏展示，无返回栏（按分享需求「全屏显示，不再有返回」）。

  路由：/file-collabs/share/:id
  能力：加载协同文档 → 按类型渲染只读内容（word/text 直接渲染快照；excel 用
        FileCollabEditor 全屏打开）。页面不提供返回按钮，浏览器后退可离开。
-->

<template>
  <div v-if="loading" class="cs-loading">
    <ReLoader :loading="true" text="正在打开分享文档…" fullscreen />
  </div>
  <div v-else-if="!doc" class="cs-error">
    <span>文档不存在或已删除</span>
  </div>
  <div v-else class="cs-page">
    <div class="cs-bar">
      <span class="cs-title" v-html="collabIcon(doc)"></span>
      <span class="cs-name">{{ doc.fileName }}</span>
      <span class="cs-meta">{{ doc.path || "根目录" }} · {{ visibilityLabel(doc) }} · v{{ doc.version }}</span>
    </div>
    <div class="cs-body">
      <FileCollabEditor
        v-if="doc.type === 'excel'"
        :collab-id="doc.id"
        :file-name="doc.fileName"
        readonly
        :initial-snapshot="doc.snapshot"
        :initial-version="doc.version"
      />
      <div v-else-if="doc.type === 'word'" class="cs-html" v-html="doc.snapshot" />
      <pre v-else class="cs-text">{{ doc.snapshot }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import ReLoader from "@repo/ui/re-loader";
import FileCollabEditor from "../components/collab/FileCollabEditor.vue";
import { getFileCollab, type FileCollabInfo } from "../api/filestorageApi";
import { fileSvg } from "../utils/fileKind";

const route = useRoute();
const doc = ref<FileCollabInfo | null>(null);
const loading = ref(true);

function collabIcon(c: FileCollabInfo): string {
  const lower = (c.fileName || "").toLowerCase();
  if (c.type === "text" || lower.endsWith(".txt") || lower.endsWith(".md")) return fileSvg("a.txt", false);
  return fileSvg(c.fileName || "file.txt", false);
}

function visibilityLabel(c: FileCollabInfo): string {
  return c.visibility === "PUBLIC" ? "公开" : `私有（${c.allowedUserIds?.length ?? 0} 人）`;
}

onMounted(async () => {
  const id = String(route.params.id ?? "");
  if (!id) {
    loading.value = false;
    return;
  }
  try {
    doc.value = await getFileCollab(id);
  } catch {
    doc.value = null;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.cs-loading, .cs-error {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-bg-color-page, #f5f7fa);
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
}
.cs-page {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page, #f5f7fa);
}
.cs-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  background: var(--el-bg-color, #fff);
  border-bottom: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
}
.cs-title { display: inline-flex; }
.cs-title :deep(svg) { width: 22px; height: 22px; }
.cs-name { font-weight: 600; color: var(--text-primary, var(--el-text-color-primary, #303133)); }
.cs-meta {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cs-body {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}
.cs-body > * { flex: 1; min-width: 0; }
.cs-html {
  flex: 1;
  overflow-y: auto;
  padding: 20px 28px;
  background: #fff;
  line-height: 1.7;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
}
.cs-text {
  margin: 0;
  flex: 1;
  overflow-y: auto;
  padding: 20px 28px;
  background: #fff;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--font-mono, "JetBrains Mono", Consolas, monospace);
  font-size: 13px;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
}
</style>