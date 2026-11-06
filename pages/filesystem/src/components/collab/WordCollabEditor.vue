<!--
  协同 Word 编辑器 —— 富文本 HTML 协同编辑（快照式）。

  快照 = 富文本 HTML 字符串（与后端 FileCollabStore 的 word 快照契约一致，
  后端注释即「word = 富文本 HTML」）；旧版纯文本快照打开时按纯文本转义显示，
  保存后升级为 HTML。

  职责与 FileCollabEditor（Univer 表格）一致：版本乐观锁 + 5s 轮询兜底。
  工具栏提供基础格式（加粗/斜体/下划线/标题/列表），不做重型排版。
-->

<template>
  <div class="wc-editor">
    <div class="wc-editor-bar">
      <span class="wc-editor-title">{{ fileName }}</span>
      <span class="wc-editor-status" :class="saveState">{{ saveStatusText }}</span>
      <span class="wc-editor-ver">版本 v{{ currentVersion }}</span>
      <div class="wc-editor-actions">
        <el-button size="small" text @click="importDocx">导入 docx</el-button>
        <el-button size="small" text @click="downloadDocx">下载 docx</el-button>
        <!-- 显式传 false：@click 会把 MouseEvent 当 silent 传进去，导致「手动刷新」
             被当成静默（冲突/成功提示都不出现） -->
        <el-button size="small" text @click="refreshSnapshot(false)">刷新</el-button>
        <el-button size="small" :loading="saving" type="primary" @click="saveNow">保存</el-button>
      </div>
    </div>
    <div class="wc-editor-toolbar">
      <button type="button" class="wc-tb-btn wc-tb-bold" title="加粗" @mousedown.prevent="exec('bold')"><b>B</b></button>
      <button type="button" class="wc-tb-btn wc-tb-italic" title="斜体" @mousedown.prevent="exec('italic')"><i>I</i></button>
      <button type="button" class="wc-tb-btn wc-tb-u" title="下划线" @mousedown.prevent="exec('underline')"><u>U</u></button>
      <span class="wc-editor-tb-sep" />
      <button type="button" class="wc-tb-btn" title="标题1" @mousedown.prevent="formatBlock('h1')">H1</button>
      <button type="button" class="wc-tb-btn" title="标题2" @mousedown.prevent="formatBlock('h2')">H2</button>
      <button type="button" class="wc-tb-btn" title="正文" @mousedown.prevent="formatBlock('p')">正文</button>
      <span class="wc-editor-tb-sep" />
      <button type="button" class="wc-tb-btn" title="无序列表" @mousedown.prevent="exec('insertUnorderedList')">• 列表</button>
      <button type="button" class="wc-tb-btn" title="有序列表" @mousedown.prevent="exec('insertOrderedList')">1. 列表</button>
    </div>
    <div
      ref="editorRef"
      class="wc-editor-body"
      contenteditable="true"
      spellcheck="false"
      @input="onInput"
      @blur="onBlur"
    />
    <input ref="docxInputRef" type="file" accept=".docx,.doc" style="display: none" @change="onDocxPicked" />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  getFileCollab,
  getFileCollabVersion,
  saveFileCollabSnapshot,
  subscribeFileCollab,
} from "../../api/filestorageApi";
import { nextAutoSaveDelay, shouldPollCollab } from "../../utils/collabAutosave";
import { docxFileName, htmlToDocxBlob } from "../../utils/collabDocx";

const props = defineProps<{
  /** 协同文档号 */
  collabId: string;
  /** 展示文件名 */
  fileName: string;
}>();

/** 初始快照（打开时的最新内容，父组件传入避免首帧空窗） */
const initialSnapshot = defineModel<string>("initialSnapshot", { default: "" });
/** 初始版本号 */
const initialVersion = defineModel<number>("initialVersion", { default: 0 });

/** 编辑器内容 DOM */
const editorRef = ref<HTMLElement | null>(null);
/** docx 文件输入（隐藏） */
const docxInputRef = ref<HTMLInputElement | null>(null);

/** 当前已加载版本号（乐观锁基准） */
const currentVersion = ref(initialVersion.value);
/** 保存中 */
const saving = ref(false);
/** 保存状态 */
const saveState = ref<"saved" | "dirty" | "saving" | "conflict">("saved");
const saveStatusText = ref(`已同步 · v${initialVersion.value}`);

/** 是否已有未保存改动 */
let dirtyFlag = false;
/** 本轮「首次变脏」的时刻：自动保存最长等待以它为起点 */
let dirtySince = 0;
/** 轮询定时器 */
let pollTimer: ReturnType<typeof setInterval> | null = null;
/** 卸载标记 */
let disposed = false;

/** 打开时把快照注入编辑区：旧纯文本快照（无 HTML 标记）按纯文本转义，避免样式裸奔 */
function renderSnapshot(snapshot: string): void {
  const el = editorRef.value;
  if (!el) return;
  const looksHtml = /<\/?[a-z][\s\S]*>/i.test(snapshot);
  el.innerHTML = looksHtml ? snapshot : snapshot.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderSaveStatus(): void {
  switch (saveState.value) {
    case "saved": saveStatusText.value = `已同步 · v${currentVersion.value}`; break;
    case "dirty": saveStatusText.value = "有未保存改动"; break;
    case "saving": saveStatusText.value = "保存中…"; break;
    case "conflict": saveStatusText.value = "保存冲突，请刷新"; break;
  }
}

/** 输入即标脏，并安排一次空闲自动保存（停下约 3s 才写，不阻塞打字） */
function onInput(): void {
  markDirty();
}

/** 失焦时如果脏，提示未保存（不自动保存，避免打断用户思路） */
function onBlur(): void {
  if (dirtyFlag && saveState.value === "dirty") {
    renderSaveStatus();
  }
}

/** 取编辑区 HTML（空文档返回空串） */
function contentHtml(): string {
  const el = editorRef.value;
  if (!el) return "";
  return el.innerHTML.trim();
}

/** 工具栏命令 */
function exec(command: string): void {
  document.execCommand(command, false);
  editorRef.value?.focus();
  onInput();
}

function formatBlock(tag: "h1" | "h2" | "p"): void {
  document.execCommand("formatBlock", false, tag);
  editorRef.value?.focus();
  onInput();
}

/** 自动保存定时器 */
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 标脏并安排一次延迟自动保存。
 *
 * <p>空闲延迟 + 最长等待：连续输入期间不发请求，但最多
 * {@link COLLAB_AUTOSAVE_MAX_WAIT_MS} 一定强制写一次（否则一直打字就永远不保存）。
 * {@code dirtySince} 只在本轮第一次变脏时落笔，之后每次输入按它重算剩余时间。</p>
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

/** 立即保存当前内容（版本乐观锁） */
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
    const updated = await saveFileCollabSnapshot(props.collabId, contentHtml(), currentVersion.value);
    currentVersion.value = updated.version;
    dirtyFlag = false;
    saveState.value = "saved";
    renderSaveStatus();
    if (!auto) ElMessage.success("已保存");
  } catch (e) {
    saveState.value = "conflict";
    renderSaveStatus();
    ElMessage.warning(e instanceof Error ? e.message : "保存失败（可能与他人冲突）");
  } finally {
    saving.value = false;
  }
}

/**
 * 从服务器拉最新内容并重放。
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
        ElMessage.warning("本地有未保存改动，为避免覆盖他人内容请先保存或放弃本地改动");
      }
      return;
    }
    const latest = await getFileCollab(props.collabId);
    if (latest.version === currentVersion.value) {
      currentVersion.value = latest.version;
      return;
    }
    renderSnapshot(latest.snapshot ?? "");
    currentVersion.value = latest.version;
    saveState.value = "saved";
    renderSaveStatus();
    if (!silent) ElMessage.success(`已刷新到他人保存的版本 v${latest.version}`);
  } catch (e) {
    if (!silent) ElMessage.error(e instanceof Error ? e.message : "刷新内容失败");
  }
}

/** 导入 docx：mammoth 转 HTML 后直接进入编辑区 */
function importDocx(): void {
  docxInputRef.value?.click();
}

async function onDocxPicked(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  try {
    const mammoth = await import("mammoth");
    const buffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
    renderSnapshot(result.value || "");
    dirtyFlag = true;
    saveState.value = "dirty";
    renderSaveStatus();
    ElMessage.success("docx 内容已导入，点击「保存」写入协同");
  } catch (err) {
    ElMessage.error(`docx 解析失败：${(err as Error)?.message ?? err}`);
  }
}

/** 下载：当前 HTML 快照导出为真正的 .docx（jszip 手写最小 OOXML，Word/WPS 可直接打开） */
async function downloadDocx(): Promise<void> {
  try {
    const blob = await htmlToDocxBlob(contentHtml());
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = docxFileName(props.fileName);
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (e) {
    ElMessage.error(`docx 导出失败：${(e as Error)?.message ?? e}`);
  }
}

/** SSE 变更订阅的取消函数（卸载时调用） */
let unsubscribe: (() => void) | null = null;

onMounted(async () => {
  await nextTick();
  renderSnapshot(initialSnapshot.value);
  // 主通道：SSE 变更推送 —— 别人一保存就立刻知道（不用等轮询）
  unsubscribe = subscribeFileCollab(props.collabId, (change) => {
    if (disposed || change.version <= currentVersion.value) {
      return;
    }
    void refreshSnapshot(true, change.version);
  });
  // 兜底通道（SSE 断连时保同步）：15s 一次，只问版本号（几十字节）。
  // 此前是每 5s 拉一次**整份内容**，而且不跳过「本地有未保存改动」的情形 ——
  // 一边打字一边每 5s 下载全文并解析，就是编辑器卡顿的直接来源。
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
});
</script>

<style scoped>
.wc-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 480px;
  overflow: hidden;
  border-radius: var(--radius-md, 10px);
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  background: var(--el-bg-color, #fff);
}
.wc-editor-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  flex-wrap: wrap;
}
.wc-editor-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.wc-editor-status {
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--brand-500, #409eff);
  color: #fff;
}
.wc-editor-status.saving { background: var(--metric-cpu, #409eff); }
.wc-editor-status.dirty { background: var(--status-warning, #e6a23c); }
.wc-editor-status.conflict { background: var(--status-error, #f56c6c); }
.wc-editor-ver {
  font-size: 12px;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
  font-variant-numeric: tabular-nums;
  margin-left: auto;
}
.wc-editor-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
.wc-editor-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-bottom: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  flex-wrap: wrap;
}
.wc-tb-btn {
  border: 0;
  background: transparent;
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 13px;
  line-height: 1.4;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
  cursor: pointer;
  transition: background 0.15s ease;
}
.wc-tb-btn:hover { background: var(--brand-50, var(--el-fill-color-light, #f5f7fa)); }
.wc-tb-bold b { font-weight: 700; }
.wc-tb-italic i { font-style: italic; }
.wc-tb-u u { text-decoration: underline; }
.wc-editor-tb-sep {
  width: 1px;
  height: 16px;
  background: var(--el-border-color-lighter, #e8ebf0);
  margin: 0 4px;
}
.wc-editor-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 20px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
  background: var(--el-bg-color, #fff);
  font-family: var(--font-sans, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif);
  outline: none;
}
.wc-editor-body:empty::before {
  content: "在此输入协作内容…";
  color: var(--text-tertiary, var(--el-text-color-placeholder, #c0c4cc));
}
.wc-editor-body h1, .wc-editor-body h2 { margin: 0.4em 0; }
.wc-editor-body p { margin: 0.3em 0; }
</style>
