<!--
  协同文本编辑器 —— 纯文本协同编辑（快照式，type = text）。

  快照 = 纯文本字符串；版本乐观锁 + 5s 轮询兜底（与 Word/Excel 编辑器同契约）。
  简单 textarea，右下角显示字符数。
-->

<template>
  <div class="tc-editor">
    <div class="tc-editor-bar">
      <span class="tc-editor-title">{{ fileName }}</span>
      <span class="tc-editor-status" :class="saveState">{{ saveStatusText }}</span>
      <span class="tc-editor-ver">版本 v{{ currentVersion }}</span>
      <div class="tc-editor-actions">
        <el-button size="small" text @click="refreshSnapshot">刷新</el-button>
        <el-button size="small" :loading="saving" type="primary" @click="saveNow">保存</el-button>
      </div>
    </div>
    <div class="tc-editor-body">
      <textarea
        v-model="text"
        class="tc-editor-area"
        spellcheck="false"
        placeholder="在此输入协作内容…"
        @input="onInput"
      />
      <span class="tc-editor-count">{{ text.length }} 字符</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { message } from "@repo/core";
import { getFileCollab, saveFileCollabSnapshot, type FileCollabInfo } from "../../api/filestorageApi";

const props = defineProps<{
  /** 协同文档号 */
  collabId: string;
  /** 展示文件名 */
  fileName: string;
}>();

const initialSnapshot = defineModel<string>("initialSnapshot", { default: "" });
const initialVersion = defineModel<number>("initialVersion", { default: 0 });

const text = ref(initialSnapshot.value);
const currentVersion = ref(initialVersion.value);
const saving = ref(false);
const saveState = ref<"saved" | "dirty" | "saving" | "conflict">("saved");
const saveStatusText = ref(`已同步 · v${initialVersion.value}`);

let dirtyFlag = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let disposed = false;

function renderSaveStatus(): void {
  switch (saveState.value) {
    case "saved": saveStatusText.value = `已同步 · v${currentVersion.value}`; break;
    case "dirty": saveStatusText.value = "有未保存改动"; break;
    case "saving": saveStatusText.value = "保存中…"; break;
    case "conflict": saveStatusText.value = "保存冲突，请刷新"; break;
  }
}

function onInput(): void {
  if (saveState.value === "saved" && !dirtyFlag) {
    dirtyFlag = true;
    saveState.value = "dirty";
    renderSaveStatus();
  }
}

async function saveNow(): Promise<void> {
  if (saving.value) return;
  saving.value = true;
  saveState.value = "saving";
  renderSaveStatus();
  try {
    const updated = await saveFileCollabSnapshot(props.collabId, text.value, currentVersion.value);
    currentVersion.value = updated.version;
    dirtyFlag = false;
    saveState.value = "saved";
    renderSaveStatus();
  } catch (e) {
    saveState.value = "conflict";
    renderSaveStatus();
    message.warning(e instanceof Error ? e.message : "保存失败（可能与他人冲突）");
  } finally {
    saving.value = false;
  }
}

async function refreshSnapshot(): Promise<void> {
  try {
    const latest: FileCollabInfo = await getFileCollab(props.collabId);
    if (latest.version === currentVersion.value) {
      currentVersion.value = latest.version;
      return;
    }
    if (dirtyFlag) {
      message.warning("本地有未保存改动，为避免覆盖他人内容请先保存或放弃本地改动");
      return;
    }
    text.value = latest.snapshot ?? "";
    currentVersion.value = latest.version;
    saveState.value = "saved";
    renderSaveStatus();
    message.success(`已刷新到他人保存的版本 v${latest.version}`);
  } catch (e) {
    message.error(e instanceof Error ? e.message : "刷新内容失败");
  }
}

onMounted(() => {
  pollTimer = setInterval(() => {
    if (disposed || saveState.value === "saving") return;
    void refreshSnapshot();
  }, 5000);
});

onBeforeUnmount(() => {
  disposed = true;
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<style scoped>
.tc-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 480px;
  overflow: hidden;
  border-radius: var(--radius-md, 10px);
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  background: var(--el-bg-color, #fff);
}
.tc-editor-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  flex-wrap: wrap;
}
.tc-editor-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tc-editor-status {
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--brand-500, #409eff);
  color: #fff;
}
.tc-editor-status.saving { background: var(--metric-cpu, #409eff); }
.tc-editor-status.dirty { background: var(--status-warning, #e6a23c); }
.tc-editor-status.conflict { background: var(--status-error, #f56c6c); }
.tc-editor-ver {
  font-size: 12px;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
  font-variant-numeric: tabular-nums;
  margin-left: auto;
}
.tc-editor-actions { display: flex; align-items: center; gap: 4px; }
.tc-editor-body {
  flex: 1;
  min-height: 0;
  display: flex;
  position: relative;
}
.tc-editor-area {
  flex: 1;
  min-height: 0;
  width: 100%;
  border: 0;
  outline: 0;
  resize: none;
  padding: 16px 20px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
  background: var(--el-bg-color, #fff);
  font-family: var(--font-sans, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif);
}
.tc-editor-area::placeholder { color: var(--text-tertiary, var(--el-text-color-placeholder, #c0c4cc)); }
.tc-editor-count {
  position: absolute;
  right: 10px;
  bottom: 8px;
  font-size: 12px;
  color: var(--text-tertiary, var(--el-text-color-placeholder, #c0c4cc));
  pointer-events: none;
}
</style>