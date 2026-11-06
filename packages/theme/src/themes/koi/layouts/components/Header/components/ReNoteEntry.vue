<template>
  <!-- 单根节点：ReToolbar 会对条目施加 v-if / v-show，fragment 根节点会让指令失效 -->
  <div class="re-note-entry">
    <!-- 顶栏入口：点击创建一条新的悬浮便条 -->
    <button
      type="button"
      class="re-note-entry__btn"
      :aria-label="t('header.noteEntry.label')"
      @click="createNote"
    >
      <el-icon :size="17"><Memo /></el-icon>
      <span v-if="notes.length" class="re-note-entry__badge">{{ notes.length }}</span>
    </button>

    <!-- 悬浮便条：Teleport 到 body，始终在视口最顶层 -->
    <Teleport to="body">
      <div v-if="enabled" class="re-note-layer">
        <div
          v-for="note in notes"
          :key="note.id"
          class="re-note-card"
          :data-note-id="note.id"
          :style="noteStyle(note)"
          @pointerdown="onCardPointerDown"
        >
          <div class="re-note-card__header">
            <div class="re-note-card__title">
              <span>{{ t('header.noteEntry.title') }}</span>
              <span class="re-note-card__count" v-if="notes.length">{{ notes.length }} {{ t('header.noteEntry.count') }}</span>
            </div>
            <div class="re-note-card__actions">
              <div class="re-note-card__colors">
                <button
                  v-for="c in NOTE_COLORS"
                  :key="c"
                  type="button"
                  class="re-note-card__color"
                  :class="{ 'is-active': note.color === c }"
                  :style="{ background: c }"
                  @click.stop="setNoteColor(note.id, c)"
                />
              </div>
              <button type="button" class="re-note-card__close" @click.stop="closeNote(note.id)">
                <el-icon :size="14"><Close /></el-icon>
              </button>
            </div>
          </div>
          <div class="re-note-card__body">
            <textarea
              class="re-note-card__textarea"
              :placeholder="t('header.noteEntry.placeholder')"
              v-model="note.text"
              :maxlength="MAX_TEXT"
              rows="5"
              @pointerdown.stop
              @input="onNoteInput(note)"
            />
          </div>
          <!-- 拖拽缩放手柄：8 个方向 -->
          <div
            v-for="h in RESIZE_HANDLES"
            :key="h"
            class="re-note-card__resizer"
            :class="`is-${h}`"
            :data-handle="h"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
/**
 * 快捷便条（顶栏入口 + 悬浮便条）
 *
 * <p>组件由 ReToolbar 在工具栏中渲染（见 headerItems.ts `quickNote` 条目）。
 * 点击按钮创建便条，便条通过 Teleport 到 body，以最高 z-index 浮动于页面之上；
 * 数据通过 IndexedDB `createNoteStore(userId)` 持久化，与同用户的其他便签共享数据库
 * （DB 名 `koi-home-note-{userId}`，store `notes`，keyPath `id`）。</p>
 *
 * <p>功能：
 * - 一条以上便条同时存在，各自可拖拽 / 缩放
 * - 新建便条自动轮换背景色，支持点击便条顶部的色块换色
 * - 拖拽、缩放、换色、编辑正文时写入 IndexedDB（防抖保存）
 * - `other.toolbar.quickNote` 关闭时不再显示，但不删数据
 * </p>
 */
import { ref, computed, onMounted, onBeforeUnmount, reactive, toRaw } from "vue";
import { useI18n } from "vue-i18n";
import { Close, Memo } from "@element-plus/icons-vue";
import { message, messageBox } from "@repo/core";
import { getConfig } from "@repo/config";
import { createNoteStore } from "@repo/utils";
import useAuthStore from "@repo/pinia/modules/auth";

const { t } = useI18n();

/** 便签背景色（低饱和度，与 NoteWidget 一致） */
const NOTE_COLORS = ["#FDE68A", "#BFDBFE", "#BBF7D0", "#FBCFE8", "#E9D5FF", "#FED7AA"];
/** 正文长度上限 */
const MAX_TEXT = 500;
/** 便条最小宽高（px） */
const MIN_W = 180;
const MIN_H = 140;
/** 新建便条默认宽高 */
const DEFAULT_W = 240;
const DEFAULT_H = 200;
/** 窗口内所有悬浮便条的公共 z-index 层 */
const Z_INDEX = 99990;
/** 当前置顶便条的 z-index 层 */
const Z_INDEX_TOP = Z_INDEX + 10;

/** 便条数据模型（与 IndexedDB store notes 的 keyPath `id` 对齐） */
interface Note {
  /** 主键 */
  id: string;
  /** 正文 */
  text: string;
  /** 背景色 */
  color: string;
  /** 创建 / 最后修改时间 */
  createdAt: number;
  updatedAt: number;
  /** 左上角坐标、宽高（px） */
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 拖拽/缩放手柄方向 */
const RESIZE_HANDLES = ["n", "ne", "e", "se", "s", "sw", "w", "nw"] as const;

const authStore = useAuthStore();
const userId = computed(() => String(authStore.loginUser?.userId ?? authStore.loginUser?.id ?? "anonymous"));

/** 顶栏配置（reactive 对象，与 ReToolbar 取法一致） */
const toolbarConfig = computed(() => getConfig().other?.toolbar);
/** 开关关闭时不显示悬浮便条（数据仍保存在 IndexedDB 中） */
const enabled = computed(() => {
  const cfg = toolbarConfig.value;
  return cfg?.quickNote !== false;
});

const notes = ref<Note[]>([]);
/** 当前堆叠在顶层的便条 id */
const frontId = ref("");

/** 按当前登录用户隔离的 IndexedDB store（userId 变化时自动切换） */
const saveStore = computed(() => createNoteStore(userId.value));

/** 每条便条独立的防抖定时器：按 id 分桶，互不取消 */
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

/** 立即写入单条便条（失败只告警，不打断交互） */
function writeNote(note: Note) {
  // IndexedDB 结构化克隆不接受 Vue 响应式代理，先取原始对象
  void saveStore.value
    .put(toRaw(note))
    .catch((err) => console.warn("[note-entry] 保存便条失败", err));
}

/**
 * 防抖写库：同一便条 400ms 内的多次修改只写最后一次，避免拖拽时 IO 风暴。
 * 按便条 id 分桶，避免多条便条互相取消；闭包每次求值 `saveStore.value`，
 * 所以写库始终落当前登录用户。
 */
function save(note: Note) {
  const prev = saveTimers.get(note.id);
  if (prev) clearTimeout(prev);
  saveTimers.set(
    note.id,
    setTimeout(() => {
      saveTimers.delete(note.id);
      writeNote(note);
    }, 400),
  );
}

/** 取消某条便条的挂起写入（删除前调用，避免挂起写入把便条又写回来） */
function cancelSave(id: string) {
  const timer = saveTimers.get(id);
  if (timer) clearTimeout(timer);
  saveTimers.delete(id);
}

/** 卸载前把挂起的写入立即落库，避免丢失最后一次编辑 */
function flushSaves() {
  saveTimers.forEach((timer, id) => {
    clearTimeout(timer);
    const note = notes.value.find((n) => n.id === id);
    if (note) writeNote(note);
  });
  saveTimers.clear();
}

/** 内嵌样式同步到便条 DOM（定位 / 显隐 / 颜色 / 堆叠顺序） */
function noteStyle(note: Note) {
  return {
    left: `${note.x}px`,
    top: `${note.y}px`,
    width: `${note.w}px`,
    height: `${note.h}px`,
    zIndex: note.id === frontId.value ? Z_INDEX_TOP : Z_INDEX,
    background: note.color,
  };
}

function setFront(id: string) {
  frontId.value = id;
}

/** 给便条换色 */
function setNoteColor(id: string, color: string) {
  const note = notes.value.find((n) => n.id === id);
  if (!note) return;
  note.color = color;
  note.updatedAt = Date.now();
  save(note);
}

/** 正文修改时写（防抖），确保输入不丢失 */
function onNoteInput(note: Note) {
  note.updatedAt = Date.now();
  save(note);
}

/** 写一条新便条（从顶栏入口创建） */
function createNote() {
  const index = notes.value.length;
  const color = NOTE_COLORS[index % NOTE_COLORS.length];
  const note: Note = {
    id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    text: "",
    color,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    x: calcPosition(index).x,
    y: calcPosition(index).y,
    w: DEFAULT_W,
    h: DEFAULT_H,
  };
  notes.value.push(note);
  setFront(note.id);
  writeNote(note);
}

/** 删除一条便条 */
function closeNote(id: string) {
  const note = notes.value.find((n) => n.id === id);
  if (!note) return;
  void messageBox
    .confirm(
      t("header.noteEntry.confirmDelete"),
      t("header.noteEntry.title"),
      t("button.confirm"),
      t("button.cancel"),
      "warning",
    )
    .then(() => {
      cancelSave(id);
      notes.value = notes.value.filter((n) => n.id !== id);
      if (frontId.value === id) frontId.value = "";
      void saveStore.value.remove(id).catch((err) => console.warn("[note-entry] 删除便条失败", err));
      message.success(t("header.noteEntry.deleted"));
    })
    .catch(() => {
      // 取消：无操作
    });
}

/** 按视口右下角为锚点扩散排列便条（后建的注意放在先建之上） */
function calcPosition(index: number): { x: number; y: number } {
  const gap = 12;
  return {
    x: clampX(window.innerWidth - DEFAULT_W - 16 - index * gap),
    y: clampY(window.innerHeight - DEFAULT_H - 16 - index * gap),
  };
}

/** 定位上限（左侧/上侧边界 16px、右侧/下侧边界 16px + 最小宽度） */
function clampX(value: number): number {
  const min = 16;
  return Math.min(Math.max(value, min), window.innerWidth - min - MIN_W);
}

function clampY(value: number): number {
  const min = 16;
  return Math.min(Math.max(value, min), window.innerHeight - min - MIN_H);
}

/** 把便条收拢到视口内（主键不变，宽高取最小值） */
function clampNote(note: Note) {
  note.x = clampX(note.x);
  note.y = clampY(note.y);
  note.w = Math.max(MIN_W, note.w);
  note.h = Math.max(MIN_H, note.h);
  note.updatedAt = Date.now();
  save(note);
}

/** 从 IndexedDB 恢复便条（已静态同步为 reactive） */
function load() {
  void saveStore.value
    .getAll<Note>()
    .then((list) => {
      notes.value = list.map((n) => reactive(n));
    })
    .catch((err) => {
      console.warn("[note-entry] 加载便条失败", err);
      notes.value = [];
    });
}

/** 拖拽/缩放状态 */
const dragState = ref({
  active: false,
  note: null as Note | null,
  mode: "idle" as "idle" | "drag" | "resize",
  handle: "" as string,
  startPointerX: 0,
  startPointerY: 0,
  startNoteX: 0,
  startNoteY: 0,
  startNoteW: 0,
  startNoteH: 0,
});

function onCardPointerDown(e: PointerEvent) {
  const target = e.target as HTMLElement;
  // 正文编辑 / 切换颜色 / 关闭按钮：不对卡片产生拖拽或缩放
  if (
    target.closest(".re-note-card__textarea") ||
    target.closest(".re-note-card__colors") ||
    target.closest(".re-note-card__close")
  ) {
    return;
  }

  const card = e.currentTarget as HTMLElement;
  const handle = target.closest(".re-note-card__resizer");
  const header = target.closest(".re-note-card__header");
  const noteId = card.dataset.noteId;
  const note = notes.value.find((n) => n.id === noteId);
  if (!note) return;
  setFront(note.id);
  card.setPointerCapture(e.pointerId);

  if (handle) {
    startResize(note, handle.dataset.handle ?? "se", e);
  } else if (header) {
    startDrag(note, e);
  }
}

function startDrag(note: Note, e: PointerEvent) {
  dragState.value = {
    active: true,
    note,
    mode: "drag",
    handle: "",
    startPointerX: e.clientX,
    startPointerY: e.clientY,
    startNoteX: note.x,
    startNoteY: note.y,
    startNoteW: note.w,
    startNoteH: note.h,
  };
  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", onPointerUp);
  document.addEventListener("pointercancel", onPointerUp);
}

function startResize(note: Note, handle: string, e: PointerEvent) {
  dragState.value = {
    active: true,
    note,
    mode: "resize",
    handle,
    startPointerX: e.clientX,
    startPointerY: e.clientY,
    startNoteX: note.x,
    startNoteY: note.y,
    startNoteW: note.w,
    startNoteH: note.h,
  };
  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", onPointerUp);
  document.addEventListener("pointercancel", onPointerUp);
}

function onPointerMove(e: PointerEvent) {
  const state = dragState.value;
  if (!state.active) return;
  const note = state.note;
  if (!note) return;
  const dx = e.clientX - state.startPointerX;
  const dy = e.clientY - state.startPointerY;
  const x0 = state.startNoteX;
  const y0 = state.startNoteY;
  const w0 = state.startNoteW;
  const h0 = state.startNoteH;

  if (state.mode === "drag") {
    note.x = clampX(x0 + dx);
    note.y = clampY(y0 + dy);
  } else {
    const handle = state.handle;
    switch (handle) {
      case "n": note.y = clampY(y0 + dy); note.h = Math.max(MIN_H, h0 - dy); dragEnd(note); break;
      case "s": note.h = Math.max(MIN_H, h0 + dy); dragEnd(note); break;
      case "e": note.w = Math.max(MIN_W, w0 + dx); dragEnd(note); break;
      case "w": note.x = clampX(x0 + dx); note.w = Math.max(MIN_W, w0 - dx); dragEnd(note); break;
      case "nw": note.x = clampX(x0 + dx); note.y = clampY(y0 + dy); note.w = Math.max(MIN_W, w0 - dx); note.h = Math.max(MIN_H, h0 - dy); dragEnd(note); break;
      case "ne": note.y = clampY(y0 + dy); note.w = Math.max(MIN_W, w0 + dx); note.h = Math.max(MIN_H, h0 - dy); dragEnd(note); break;
      case "se": note.w = Math.max(MIN_W, w0 + dx); note.h = Math.max(MIN_H, h0 + dy); dragEnd(note); break;
      case "sw": note.x = clampX(x0 + dx); note.w = Math.max(MIN_W, w0 - dx); note.h = Math.max(MIN_H, h0 + dy); dragEnd(note); break;
      default: break;
    }
  }
}

/** 边角拖拽时更新变化时间并落库 */
function dragEnd(note: Note) {
  note.updatedAt = Date.now();
  save(note);
}

function onPointerUp() {
  const state = dragState.value;
  if (!state.active) return;
  const { note } = state;
  state.active = false;
  document.removeEventListener("pointermove", onPointerMove);
  document.removeEventListener("pointerup", onPointerUp);
  document.removeEventListener("pointercancel", onPointerUp);
  if (note) {
    note.updatedAt = Date.now();
    save(note);
  }
}

onMounted(() => {
  load();
  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  dragState.value.active = false;
  flushSaves();
  document.removeEventListener("pointermove", onPointerMove);
  document.removeEventListener("pointerup", onPointerUp);
  document.removeEventListener("pointercancel", onPointerUp);
  window.removeEventListener("resize", onResize);
});

/** 窗口改变大小时把便条重新收拢到视口内 */
function onResize() {
  notes.value.forEach(clampNote);
}
</script>

<style lang="scss" scoped>
.re-note-entry {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.re-note-entry__btn {
  --btn-size: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--btn-size);
  height: var(--btn-size);
  padding: 0;
  color: var(--el-text-color-secondary);
  background: transparent;
  border: none;
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  position: relative;
  transition:
    color 0.2s ease,
    background 0.2s ease;

  &:hover {
    color: var(--el-text-color-primary);
    background: var(--el-fill-color-light);
  }

  &:active {
    transform: scale(0.94);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 22%, transparent);
  }

  .el-icon {
    transition: transform 0.2s ease;
  }

  &:hover .el-icon {
    transform: scale(1.1);
  }

  &:active .el-icon {
    transform: scale(0.9);
  }
}

.re-note-entry__badge {
  position: absolute;
  top: 1px;
  right: 1px;
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  font-size: 9px;
  font-weight: 700;
  line-height: 14px;
  color: var(--el-color-white);
  text-align: center;
  background: var(--el-color-danger);
  border-radius: var(--el-radius-full, 9999px);
  border: 1px solid var(--el-fill-color-blank);
}

.re-note-layer {
  position: fixed;
  inset: 0;
  z-index: var(--z-index-quick-notes, 99990);
  /* 整层不拦截指针，只有便条卡片（pointer-events: auto）可交互，避免挡住页面 */
  pointer-events: none;
}

.re-note-card {
  position: absolute;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  border-radius: var(--el-radius-lg, 12px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  --ink: #333;
  filter: brightness(0.95);
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  }
}

.re-note-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.3);
  border-top: 1px solid rgba(0, 0, 0, 0.04);
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  user-select: none;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.re-note-card__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink, #333);
}

.re-note-card__count {
  margin-left: 8px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--ink, #333);
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-full, 9999px);
}

.re-note-card__actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.re-note-card__colors {
  display: flex;
  align-items: center;
  gap: 4px;
}

.re-note-card__color {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: var(--el-radius-sm, 6px);
  color: var(--el-color-white, #fff);
  transition: transform 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  }
}

.re-note-card__color.is-active {
  border-color: var(--el-color-primary);
}

.re-note-card__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  color: var(--ink, #333);
  background: transparent;
  border: none;
  border-radius: var(--el-radius-full, 9999px);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.4);
    color: var(--el-color-danger);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  }
}

.re-note-card__body {
  flex: 1;
  min-height: 0;
  padding: 0 12px 12px;
  overflow: hidden;
}

.re-note-card__textarea {
  display: block;
  width: 100%;
  height: 100%;
  padding: 8px 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--ink, #333);
  background: transparent;
  border: none;
  resize: none;
  outline: none;
  overflow-y: auto;
  caret-color: var(--el-text-color-primary);

  &::placeholder {
    color: rgba(0, 0, 0, 0.3);
    transition: opacity 0.2s ease;
  }

  &:focus::placeholder {
    opacity: 0;
  }
}

/* 拖拽/缩放手柄：只保留不可见热区，不绘制任何视觉元素（避免边缘出现色块/圆点） */
.re-note-card__resizer {
  position: absolute;
  z-index: 2;
  background: transparent;
}

.is-e {
  top: 25%;
  right: -5px;
  width: 10px;
  height: 50%;
  cursor: e-resize;
}

.is-s {
  bottom: -5px;
  left: 25%;
  width: 50%;
  height: 10px;
  cursor: s-resize;
}

.is-w {
  top: 25%;
  left: -5px;
  width: 10px;
  height: 50%;
  cursor: w-resize;
}

.is-n {
  top: -5px;
  left: 25%;
  width: 50%;
  height: 10px;
  cursor: n-resize;
}

.is-ne,
.is-nw,
.is-sw,
.is-se {
  width: 12px;
  height: 12px;
}

.is-ne {
  top: -6px;
  right: -6px;
}

.is-nw {
  top: -6px;
  left: -6px;
}

.is-sw {
  bottom: -6px;
  left: -6px;
}

.is-se {
  bottom: -6px;
  right: -6px;
}
</style>
