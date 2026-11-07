<!--
  /**
   * 虚拟桌面 · 便签窗口
   *
   * <p>唯一一个<b>不碰远端</b>的应用：内容只存在浏览器 localStorage 里，
   * 用来临时记下排查过程中的 IP、命令、时间点，不需要（也不应该）
   * 往主机上写文件或走执行日志。</p>
   *
   * <p>一次编辑 400ms 后落盘，切走窗口或刷新页面都不丢；
   * 标题取正文第一行，省掉一个「标题」输入框。</p>
   */
  -->
<template>
  <div class="dnb">
    <div class="dnb__bar">
      <span class="dnb__title">便签</span>
      <span class="dnb__count">{{ notes.length }} 条 · 只存在本机浏览器</span>
      <span class="dnb__spacer" />
      <button type="button" class="dnb__btn" @click="create">
        <ReIcon name="Plus" :size="12" />
        <span>新建</span>
      </button>
      <button type="button" class="dnb__btn is-danger" :disabled="!current" @click="remove(activeId)">
        <ReIcon name="Delete" :size="12" />
        <span>删除</span>
      </button>
    </div>

    <div class="dnb__body">
      <aside class="dnb__list">
        <button
          v-for="n in notes"
          :key="n.id"
          type="button"
          class="dnb__item"
          :class="{ 'is-on': n.id === activeId }"
          @click="select(n.id)"
        >
          <b class="dnb__item-title">{{ titleOf(n) }}</b>
          <span class="dnb__item-time">{{ timeOf(n.updatedAt) }}</span>
        </button>
        <div v-if="!notes.length" class="dnb__item-empty">还没有便签</div>
      </aside>

      <div class="dnb__edit">
        <textarea
          v-if="current"
          ref="editorRef"
          v-model="draft"
          class="dnb__text"
          spellcheck="false"
          placeholder="随手记点什么…（第一行会作为标题）"
          @input="scheduleSave"
        />
        <div v-else class="dnb__empty">点右上角「新建」开一条便签</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { ElMessageBox } from "element-plus";

defineProps<{
  /** 主机标识（便签不按主机隔离，这里只为与其它应用保持同一套参数） */
  hostId: number;
  /** 主机名 */
  hostName?: string;
  /** 窗口是否激活（父级透传） */
  active?: boolean;
}>();

/** localStorage 键：便签是桌面工具，跨主机共享一份 */
const LS_KEY = "vdesk.notes";

/** 一条便签 */
interface NoteItem {
  /** 唯一标识 */
  id: string;
  /** 正文 */
  text: string;
  /** 最后修改时间（毫秒） */
  updatedAt: number;
}

const notes = ref<NoteItem[]>([]);
const activeId = ref("");
const draft = ref("");
const editorRef = ref<HTMLTextAreaElement | null>(null);
let saveTimer: number | undefined;

/** 当前选中的便签 */
const current = computed(() => notes.value.find((n) => n.id === activeId.value) ?? null);

/**
 * 便签标题：正文第一行，最长 18 个字。
 *
 * @param n 便签
 */
function titleOf(n: NoteItem): string {
  const first = n.text.split(/\r?\n/).find((l) => l.trim()) ?? "";
  const text = first.trim();
  if (!text) return "空便签";
  return text.length > 18 ? `${text.slice(0, 18)}…` : text;
}

/**
 * 时间展示：只到分钟，便签不需要秒。
 *
 * @param ts 毫秒时间戳
 */
function timeOf(ts: number): string {
  const d = new Date(ts);
  const p = (v: number) => String(v).padStart(2, "0");
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * 读本地存储。
 */
function load(): void {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const list = raw ? (JSON.parse(raw) as NoteItem[]) : [];
    notes.value = Array.isArray(list) ? list.filter((n) => n && typeof n.id === "string") : [];
  } catch {
    notes.value = [];
  }
  if (notes.value.length && !activeId.value) {
    select(notes.value[0].id);
  }
}

/**
 * 落盘。
 */
function persist(): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(notes.value));
  } catch {
    /* 存储写满时静默：便签丢了不影响远端，不打断用户 */
  }
}

/**
 * 选中一条便签。
 *
 * @param id 便签标识
 */
function select(id: string): void {
  flush();
  activeId.value = id;
  draft.value = notes.value.find((n) => n.id === id)?.text ?? "";
  void nextTick(() => editorRef.value?.focus());
}

/**
 * 新建一条便签并选中。
 */
function create(): void {
  flush();
  const item: NoteItem = { id: `n${Date.now()}`, text: "", updatedAt: Date.now() };
  notes.value = [item, ...notes.value];
  activeId.value = item.id;
  draft.value = "";
  persist();
  void nextTick(() => editorRef.value?.focus());
}

/**
 * 删除一条便签（先确认）。
 *
 * @param id 便签标识
 */
async function remove(id: string): Promise<void> {
  const item = notes.value.find((n) => n.id === id);
  if (!item) return;
  const ok = await ElMessageBox.confirm(`删除便签「${titleOf(item)}」？删除后不可恢复。`, "删除便签", {
    type: "warning",
    confirmButtonText: "删除",
    cancelButtonText: "取消",
  }).catch(() => false);
  if (!ok) return;
  notes.value = notes.value.filter((n) => n.id !== id);
  activeId.value = notes.value[0]?.id ?? "";
  draft.value = notes.value[0]?.text ?? "";
  persist();
}

/**
 * 编辑后延迟落盘：每敲一个字都写 localStorage 会拖慢输入。
 */
function scheduleSave(): void {
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(flush, 400);
}

/**
 * 立即把编辑框内容写回当前便签。
 */
function flush(): void {
  if (saveTimer) {
    window.clearTimeout(saveTimer);
    saveTimer = undefined;
  }
  const item = notes.value.find((n) => n.id === activeId.value);
  if (!item || item.text === draft.value) return;
  item.text = draft.value;
  item.updatedAt = Date.now();
  persist();
}

onMounted(load);
onBeforeUnmount(flush);
</script>

<style scoped>
.dnb {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  font-size: 12px;
  color: #d8d3e0;
  background: #16141c;
}

.dnb__bar {
  display: flex;
  flex: none;
  gap: 8px;
  align-items: center;
  height: 30px;
  padding: 0 10px;
  background: #1b1922;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.dnb__title {
  font-weight: 600;
  color: #efeaf7;
}

.dnb__count {
  font-size: 10.5px;
  color: #8f8a9b;
}

.dnb__spacer {
  flex: 1;
}

.dnb__btn {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  height: 21px;
  padding: 0 9px;
  font-size: 11px;
  color: #cfc9da;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 5px;
}

.dnb__btn:not(:disabled):hover {
  color: #fff;
  background: rgba(233, 84, 32, 0.28);
}

.dnb__btn.is-danger:not(:disabled):hover {
  background: rgba(255, 86, 48, 0.32);
}

.dnb__btn:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.dnb__body {
  display: flex;
  flex: 1;
  min-height: 0;
  padding: 9px 10px 10px;
}

.dnb__list {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 4px;
  width: 168px;
  padding-right: 8px;
  overflow-y: auto;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.dnb__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
  text-align: left;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid transparent;
  border-radius: 6px;
}

.dnb__item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.dnb__item.is-on {
  background: rgba(233, 84, 32, 0.22);
  border-color: rgba(233, 84, 32, 0.45);
}

.dnb__item-title {
  overflow: hidden;
  font-size: 11.5px;
  font-weight: 500;
  color: #e6e1ef;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dnb__item-time {
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 9.5px;
  color: #8f8a9b;
}

.dnb__item-empty {
  padding: 12px 8px;
  font-size: 11px;
  color: #7e7889;
}

.dnb__edit {
  display: flex;
  flex: 1;
  min-width: 0;
  padding-left: 10px;
}

.dnb__text {
  flex: 1;
  width: 100%;
  padding: 9px 10px;
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 12px;
  line-height: 1.6;
  color: #dcd7e6;
  resize: none;
  background: #100e15;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 7px;
  outline: none;
}

.dnb__empty {
  flex: 1;
  padding: 26px;
  font-size: 11.5px;
  color: #7e7889;
  text-align: center;
  background: #100e15;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 7px;
}
</style>
