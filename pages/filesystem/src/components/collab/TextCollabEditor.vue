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
        <!-- 显式传 false：@click 会把 MouseEvent 当第一参数传进来，而第一参数是
             silent —— 直接写 @click="refreshSnapshot" 会让「手动刷新」被当成静默，
             冲突提示与成功提示都不会出现 -->
        <el-button size="small" text @click="refreshSnapshot(false)">刷新</el-button>
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
import {
  getFileCollab,
  getFileCollabVersion,
  saveFileCollabSnapshot,
  subscribeFileCollab,
} from "../../api/filestorageApi";
import { nextAutoSaveDelay, shouldPollCollab } from "../../utils/collabAutosave";

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
/** 本轮「首次变脏」的时刻：自动保存最长等待以它为起点 */
let dirtySince = 0;
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
  markDirty();
}

/** 自动保存定时器 */
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 标脏并安排一次延迟自动保存。
 *
 * <p>空闲延迟 + 最长等待：连续输入期间不发请求，但最多
 * {@link COLLAB_AUTOSAVE_MAX_WAIT_MS} 一定强制写一次（否则一直打字就永远不保存）。</p>
 *
 * <p>{@code dirtySince} 只在「本轮第一次变脏」时落笔，之后每次输入都按它重算剩余时间
 * —— 写成每次输入都重置 dirtySince 就等于永远等不到最长等待。</p>
 */
function markDirty(): void {
  const now = Date.now();
  if (!dirtyFlag) {
    dirtySince = now;
    dirtyFlag = true;
    if (saveState.value !== "saving") {
      saveState.value = "dirty";
      renderSaveStatus();
    }
  }
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    autoSaveTimer = null;
    void saveNow(true);
  }, nextAutoSaveDelay(dirtySince, now));
}

async function saveNow(auto = false): Promise<void> {
  if (saving.value) {
    // 已有保存在飞：等它结束后补一次，避免这次改动被漏掉
    if (dirtyFlag && !autoSaveTimer) {
      autoSaveTimer = setTimeout(() => {
        autoSaveTimer = null;
        void saveNow(true);
      }, 800);
    }
    return;
  }
  if (auto && !dirtyFlag) return;
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }
  saving.value = true;
  saveState.value = "saving";
  renderSaveStatus();
  try {
    const updated = await saveFileCollabSnapshot(props.collabId, text.value, currentVersion.value);
    currentVersion.value = updated.version;
    dirtyFlag = false;
    saveState.value = "saved";
    renderSaveStatus();
    if (!auto) message.success("已保存");
  } catch (e) {
    saveState.value = "conflict";
    renderSaveStatus();
    message.warning(e instanceof Error ? e.message : "保存失败（可能与他人冲突）");
  } finally {
    saving.value = false;
  }
}

/**
 * 拉最新内容并重放。
 *
 * @param silent       静默模式（轮询/SSE 触发时不打扰用户）
 * @param knownVersion 已知的最新版本（SSE 推送里带了版本号，省掉一次版本探针）
 */
async function refreshSnapshot(silent = false, knownVersion?: number): Promise<void> {
  try {
    // 有版本提示（SSE）就直接用，否则先只问版本号：没变就结束，不拉全文
    const version = knownVersion ?? (await getFileCollabVersion(props.collabId)).version;
    if (version === currentVersion.value) {
      return;
    }
    if (dirtyFlag) {
      if (!silent) {
        message.warning("本地有未保存改动，为避免覆盖他人内容请先保存或放弃本地改动");
      }
      return;
    }
    const latest = await getFileCollab(props.collabId);
    if (latest.version === currentVersion.value) {
      currentVersion.value = latest.version;
      return;
    }
    text.value = latest.snapshot ?? "";
    currentVersion.value = latest.version;
    saveState.value = "saved";
    renderSaveStatus();
    if (!silent) message.success(`已刷新到他人保存的版本 v${latest.version}`);
  } catch (e) {
    if (!silent) message.error(e instanceof Error ? e.message : "刷新内容失败");
  }
}

/** SSE 变更订阅的取消函数（卸载时调用） */
let unsubscribe: (() => void) | null = null;

onMounted(() => {
  // 主通道：SSE 变更推送 —— 别人一保存就立刻知道（不用等轮询）
  unsubscribe = subscribeFileCollab(props.collabId, (change) => {
    if (disposed || change.version <= currentVersion.value) {
      return;
    }
    void refreshSnapshot(true, change.version);
  });
  // 兜底通道：SSE 断连/被代理掐断时，每 15s 问一次版本号（几十字节）
  pollTimer = setInterval(() => {
    if (disposed || !shouldPollCollab(document.visibilityState === "visible", saving.value, dirtyFlag)) {
      return;
    }
    void refreshSnapshot(true);
  }, 15000);
});

onBeforeUnmount(() => {
  disposed = true;
  if (pollTimer) clearInterval(pollTimer);
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }
  // 离开前补一次保存，避免用户直接关标签页丢内容
  if (dirtyFlag && !saving.value) {
    void saveNow(true);
  }
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