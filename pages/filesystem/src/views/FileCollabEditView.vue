<!--
  协同文档全屏编辑视图 —— 新浏览器标签页打开，顶部无返回，专注编辑。

  路由：/file-collabs/edit/:id
  能力：加载协同文档 → 按类型进入可编辑编辑器（excel=xlsx / word=docx，统一由
        office-engine 渲染；text=纯文本）。页面不提供返回按钮，关闭标签页即离开；
        保存由各编辑器内部定时异步完成。
-->

<template>
  <div v-if="loading" class="ce-loading">
    <ReLoader :loading="true" text="正在打开协同文档…" fullscreen />
  </div>
  <div v-else-if="!doc" class="ce-error">
    <span>{{ errorText || "文档不存在或已删除" }}</span>
  </div>
  <div v-else class="ce-page">
    <div class="ce-bar">
      <span class="ce-icon" v-html="collabIcon(doc)"></span>
      <span class="ce-name">{{ doc.fileName }}</span>
      <span class="ce-meta">{{ doc.path || "根目录" }} · v{{ doc.version }} · 自动保存</span>
    </div>
    <div class="ce-body">
      <FileCollabEditor
        v-if="doc.type === 'excel' || doc.type === 'word'"
        :collab-id="doc.id"
        :file-name="doc.fileName"
        :doc-type="doc.type"
        :initial-snapshot="snapshot"
        :initial-version="version"
      />
      <TextCollabEditor
        v-else
        :collab-id="doc.id"
        :file-name="doc.fileName"
        :initial-snapshot="snapshot"
        :initial-version="version"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import ReLoader from "@repo/ui/re-loader";
import FileCollabEditor from "../components/collab/FileCollabEditor.vue";
import TextCollabEditor from "../components/collab/TextCollabEditor.vue";
import { fileSvg } from "../utils/fileKind";
import { getFileCollab, type FileCollabInfo } from "../api/filestorageApi";

const route = useRoute();
const doc = ref<FileCollabInfo | null>(null);
const loading = ref(true);
const errorText = ref("");
const snapshot = ref("");
const version = ref(0);

function collabIcon(c: FileCollabInfo): string {
  const lower = (c.fileName || "").toLowerCase();
  if (c.type === "text" || lower.endsWith(".txt") || lower.endsWith(".md")) return fileSvg("a.txt", false);
  return fileSvg(c.fileName || "file.txt", false);
}

onMounted(async () => {
  const id = String(route.params.id ?? "");
  if (!id) {
    errorText.value = "缺少文档标识";
    loading.value = false;
    return;
  }
  try {
    const detail = await getFileCollab(id);
    if (detail.canWrite === false) {
      errorText.value = "当前账号没有该协同文档的编辑权限";
      doc.value = null;
      return;
    }
    doc.value = detail;
    snapshot.value = detail.snapshot ?? "";
    version.value = detail.version ?? 0;
  } catch (e) {
    errorText.value = (e as Error)?.message ?? "";
    doc.value = null;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.ce-loading,
.ce-error {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-bg-color-page, #f5f7fa);
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
}
.ce-page {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page, #f5f7fa);
}
.ce-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  background: var(--el-bg-color, #fff);
  border-bottom: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
}
.ce-icon { display: inline-flex; }
.ce-icon :deep(svg) { width: 22px; height: 22px; }
.ce-name { font-weight: 600; color: var(--text-primary, var(--el-text-color-primary, #303133)); }
.ce-meta {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ce-body {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}
.ce-body > * { flex: 1; min-width: 0; }
</style>
