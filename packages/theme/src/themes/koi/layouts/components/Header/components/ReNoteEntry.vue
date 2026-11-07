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

    <!-- 悬浮便条：窗口能力全在 ReFloatWindow，这里只提供内容与数据 -->
    <template v-for="note in notes" :key="note.id">
      <ReFloatWindow
        v-if="enabled"
        :win-id="note.id"
        :persist="NOTE_PERSIST"
        :dock-scale="NOTE_DOCK_SCALE"
        :guide-grid="NOTE_GUIDE_GRID"
        :model-value="true"
        :title="t('header.noteEntry.title')"
        :color="note.color"
        :x="note.x"
        :y="note.y"
        :width="note.w"
        :height="note.h"
        :min-width="MIN_W"
        :min-height="MIN_H"
        :confirm-close="confirmClose"
        :before-close="() => confirmDelete(note)"
        :confirm-close-message="t('header.noteEntry.confirmDelete')"
        :confirm-close-title="t('header.noteEntry.title')"
        :confirm-text="t('button.confirm')"
        :cancel-text="t('button.cancel')"
        :minimize-text="t('header.noteEntry.minimize')"
        :maximize-text="t('header.noteEntry.maximize')"
        :unmaximize-text="t('header.noteEntry.restore')"
        :fullscreen-text="t('header.noteEntry.fullscreen')"
        :exit-fullscreen-text="t('header.noteEntry.restore')"
        :close-text="t('header.noteEntry.close')"
        :restore-text="t('header.noteEntry.restore')"
        :dock-icon-only="true"
        edge-sides="all"
        @change="onNoteChange(note, $event)"
        @close="removeNote(note.id)"
      >
        <template #header>
          <span class="re-note-card__title">{{ t("header.noteEntry.title") }}</span>
        </template>

        <!-- 顶栏右侧：换色 -->
        <template #header-extra>
          <div class="re-note-card__colors">
            <button
              v-for="c in NOTE_COLORS"
              :key="c"
              type="button"
              class="re-note-card__color"
              :class="{ 'is-active': note.color === c }"
              :style="{ background: c }"
              :aria-label="c"
              @click.stop="setNoteColor(note.id, c)"
            />
          </div>
        </template>

        <!-- 最小化成浮标时的图标 -->
        <template #dock-icon>
          <el-icon :size="15"><Memo /></el-icon>
        </template>

        <textarea
          class="re-note-card__textarea"
          :placeholder="t('header.noteEntry.placeholder')"
          v-model="note.text"
          :maxlength="MAX_TEXT"
          @input="onNoteInput(note)"
        />
      </ReFloatWindow>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * 快捷便条（顶栏入口 + 悬浮便条）
 *
 * <p>只是 ReFloatWindow 的一个使用方：窗口行为（拖拽 / 缩放 / 最小化 / 最大化 / 全屏 /
 * 边缘收起 / 对齐辅助线 / 独占）全部由 `@repo/ui` 的 ReFloatWindow 提供，这里只负责
 * 内容和数据。</p>
 *
 * <p>持久化分两层：几何与最小化态由 ReFloatWindow 自己实时写 localStorage（拖拽中节流、
 * 松手立即写）；正文与配色由本组件写入 IndexedDB（输入时节流合并写、卸载 / 隐藏前冲刷）。</p>
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, toRaw } from "vue";
import { useI18n } from "vue-i18n";
import { Memo } from "@element-plus/icons-vue";
import { message, messageBox } from "@repo/core";
import { getConfig } from "@repo/config";
import ReFloatWindow from "@repo/ui/re-float-window";
import { createCoalescer, createNoteStore } from "@repo/utils";
import useAuthStore from "@repo/pinia/modules/auth";

const { t } = useI18n();

/** 便签背景色（低饱和度） */
const NOTE_COLORS = ["#FDE68A", "#BFDBFE", "#BBF7D0", "#FBCFE8", "#E9D5FF", "#FED7AA"];
/** 正文长度上限 */
const MAX_TEXT = 500;
/** 便条最小宽高（px） */
const MIN_W = 200;
const MIN_H = 140;
/** 新建便条默认宽高 */
const DEFAULT_W = 260;
const DEFAULT_H = 220;

/** 窗口几何实时持久化到 localStorage（刷新后回到同一位置） */
const NOTE_PERSIST = true;
/** 最小化图标的缩放倍率 */
const NOTE_DOCK_SCALE = 1;
/** 对齐辅助线：同类便条互相对齐 */
const NOTE_GUIDE_GRID = -1;

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

const authStore = useAuthStore();
const userId = computed(() => String(authStore.loginUser?.userId ?? authStore.loginUser?.id ?? "anonymous"));

/** 顶栏配置 */
const toolbarConfig = computed(() => getConfig().other?.toolbar);
/** 开关关闭时不显示悬浮便条（数据仍保存在 IndexedDB 中） */
const enabled = computed(() => toolbarConfig.value?.quickNote !== false);
/** 关闭便条是否二次确认（默认开启） */
const confirmClose = computed(() => toolbarConfig.value?.quickNoteConfirm !== false);

const notes = ref<Note[]>([]);

/** 按当前登录用户隔离的 IndexedDB store */
const saveStore = computed(() => createNoteStore(userId.value));

/**
 * 写入合并器：同一便条 400ms 内的多次写只落盘一次。
 * 正文输入 + 拖拽几何都走这里，避免 IO 风暴；按便条 id 分桶，多条互不影响。
 */
const writes = createCoalescer(400);

/** 立即写入单条便条（失败只告警，不打断交互） */
function writeNote(note: Note) {
  // IndexedDB 结构化克隆不接受 Vue 响应式代理，先取原始对象
  void saveStore.value
    .put(toRaw(note))
    .catch((err) => console.warn("[note-entry] 保存便条失败", err));
}

/** 排一次合并写（同一便条的多次调用会被合并） */
function save(note: Note) {
  writes.push(note.id, () => writeNote(note));
}

/** 取消某条便条的挂起写入（删除前调用，避免挂起写入把便条又写回来） */
function cancelSave(id: string) {
  writes.cancel(id);
}

/** 把挂起的写入立刻落库 */
function flushSaves() {
  writes.flush();
}

/** 正文变化后落库（输入过程中合并写，失焦 / 卸载时立即写） */
function persistNote(note: Note) {
  note.updatedAt = Date.now();
  save(note);
}

/** 给便条换色 */
function setNoteColor(id: string, color: string) {
  const note = notes.value.find((n) => n.id === id);
  if (!note) return;
  note.color = color;
  note.updatedAt = Date.now();
  // 换色是低频操作，直接落库
  writeNote(note);
}

/** 正文修改时写（合并写） */
function onNoteInput(note: Note) {
  persistNote(note);
}

/**
 * 窗口几何变化：拖拽中每帧都会来，这里只更新内存 + 排一次合并写；
 * 位置尺寸同时回填到 note 上，窗口重建 / 刷新后能落在同一处。
 */
function onNoteChange(note: Note, rect: { x: number; y: number; width: number; height: number }) {
  if (note.x === rect.x && note.y === rect.y && note.w === rect.width && note.h === rect.height) return;
  note.x = rect.x;
  note.y = rect.y;
  note.w = rect.width;
  note.h = rect.height;
  note.updatedAt = Date.now();
  save(note);
}

/** 从顶栏入口创建一条新便条 */
function createNote() {
  const index = notes.value.length;
  const color = NOTE_COLORS[index % NOTE_COLORS.length];
  const gap = 12;
  const note: Note = {
    id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    text: "",
    color,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    // 贴右下角、后建的向上错开；ReFloatWindow 会再按视口收敛
    x: window.innerWidth - DEFAULT_W - 16 - index * gap,
    y: window.innerHeight - DEFAULT_H - 16 - index * gap,
    w: DEFAULT_W,
    h: DEFAULT_H,
  };
  notes.value.push(note);
  writeNote(note);
}

/** 关闭确认：走 @repo/core 的 messageBox */
async function confirmDelete(note: Note): Promise<boolean> {
  // 有正文才值得确认；空便条直接关，少一次打断（confirmClose 关掉时永远直接关）
  if (!confirmClose.value || !note.text.trim()) return true;
  try {
    await messageBox.confirm(
      t("header.noteEntry.confirmDelete"),
      t("header.noteEntry.title"),
      t("button.confirm"),
      t("button.cancel"),
      "warning",
    );
    return true;
  } catch {
    return false;
  }
}

/** 删除一条便条 */
function removeNote(id: string) {
  const note = notes.value.find((n) => n.id === id);
  if (!note) return;
  cancelSave(id);
  notes.value = notes.value.filter((n) => n.id !== id);
  void saveStore.value.remove(id).catch((err) => console.warn("[note-entry] 删除便条失败", err));
  message.success(t("header.noteEntry.deleted"));
}

/** 从 IndexedDB 恢复便条 */
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

/** 页面隐藏 / 关闭前把挂起的写落库（比 beforeunload 更可靠，手机端也生效） */
function onVisibilityChange() {
  if (document.visibilityState === "hidden") flushSaves();
}

/** 输入框失焦时立刻落库，避免“刚输入就刷新”丢失最后一次 */
function onFocusOut(e: FocusEvent) {
  const el = e.target as HTMLElement | null;
  if (el && el.closest(".re-note-card__textarea")) flushSaves();
}

onMounted(() => {
  load();
  document.addEventListener("visibilitychange", onVisibilityChange);
  document.addEventListener("focusout", onFocusOut);
});

onBeforeUnmount(() => {
  flushSaves();
  document.removeEventListener("visibilitychange", onVisibilityChange);
  document.removeEventListener("focusout", onFocusOut);
});
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

/* 便条内部：标题 / 色板 / 正文 */
.re-note-card__title {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  color: var(--el-text-color-primary);
}

.re-note-card__colors {
  display: flex;
  align-items: center;
  gap: 3px;
}

.re-note-card__color {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  padding: 0;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: var(--el-radius-sm, 6px);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    transform: scale(1.12);
  }

  &.is-active {
    border-color: var(--el-color-primary);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  }
}

.re-note-card__textarea {
  display: block;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-height: 60px;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
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
</style>
