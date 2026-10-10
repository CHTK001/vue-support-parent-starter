<template>
  <div
    class="note-widget"
    :style="{
      background: themeStyle.bg,
      borderColor: themeStyle.border,
      '--note-header-bg': themeStyle.header,
      '--note-ink': themeStyle.ink ?? '',
    }"
  >
    <div v-if="!widget.hideTitle" class="note-widget__header">
      <div class="note-widget__title">
        <span>{{ widget.title }}</span>
        <span class="note-widget__count" v-if="notes.length">{{ notes.length }} 条</span>
      </div>
      <div class="note-widget__actions">
        <ReButton link type="primary" title="添加便签" @click="openAdd">
          <el-icon><Plus /></el-icon>
        </ReButton>
      </div>
    </div>

    <div class="note-widget__body" v-loading="loading">
      <ReEmpty v-if="!loading && !notes.length" description="暂无便签，点击右上角添加" :image-size="56" />
      <ul v-else class="note-widget__list">
        <li
          v-for="note in notes"
          :key="note.id"
          class="note-widget__item"
          @click="openEdit(note)"
        >
          <button
            type="button"
            class="note-widget__item-remove"
            title="删除便签"
            aria-label="删除便签"
            @click.stop="remove(note.id)"
          >
            <el-icon><Delete /></el-icon>
          </button>
          <div class="note-widget__item-text">{{ note.text }}</div>
          <div class="note-widget__item-foot">
            <span class="note-widget__item-time">{{ fmtTime(note.updatedAt) }}</span>
            <span class="note-widget__item-color" :style="{ background: note.color }" />
          </div>
        </li>
      </ul>
    </div>

    <!-- 新增 / 编辑 -->
    <ReDialog
      v-model="dialogVisible"
      :title="editing ? '编辑便签' : '添加便签'"
      :width="420"
      confirm-text="保存"
      cancel-text="取消"
      destroy-on-close
      :footer-hidden="false"
      @confirm="save"
      @cancel="dialogVisible = false"
    >
      <template #content>
        <el-form :model="form" label-position="top" size="default">
          <el-form-item label="内容" required>
            <ReInput
              v-model="form.text"
              type="textarea"
              :rows="5"
              maxlength="500"
              show-word-limit
              placeholder="记录点什么…"
            />
          </el-form-item>
          <el-form-item label="便签颜色">
            <div class="note-widget__colors">
              <button
                v-for="c in NOTE_COLORS"
                :key="c"
                type="button"
                class="note-widget__color"
                :class="{ 'is-active': form.color === c }"
                :style="{ background: c }"
                @click="form.color = c"
              >
                <el-icon v-if="form.color === c"><Check /></el-icon>
              </button>
            </div>
          </el-form-item>
        </el-form>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts" name="NoteWidget">

/**
 * 便签 widget（IndexedDB 持久化）
 *
 * 数据：按当前用户 ID 隔离的 IndexedDB 数据库（koi-home-note-{userId}）。
 * 每条便签包含：text / color / createdAt / updatedAt / id。
 */
import { message } from "@repo/core";
import { defineAsyncComponent, onMounted, ref, watch, computed } from "vue";
import { ElMessageBox } from "element-plus";
import { Plus, Check, Delete } from "@element-plus/icons-vue";
import { createNoteStore, type IndexedDBStore } from "@repo/utils";
import useAuthStore from "@repo/pinia/modules/auth";
import type { WidgetItem } from "../types";
import type { NoteTheme } from "../widgets";

const ReDialog = defineAsyncComponent(() => import("@repo/ui/re-dialog").then((m) => m.default));
const ReButton = defineAsyncComponent(() => import("@repo/ui/re-button").then((m) => m.default));
const ReInput = defineAsyncComponent(() => import("@repo/ui/re-input").then((m) => m.default));
const ReEmpty = defineAsyncComponent(() => import("@repo/ui/re-empty").then((m) => m.default));

/** 便签数据 */
interface Note {
  id: string;
  text: string;
  color: string;
  createdAt: number;
  updatedAt: number;
}

/** 可选便签色（低饱和度） */
const NOTE_COLORS = ["#FDE68A", "#BFDBFE", "#BBF7D0", "#FBCFE8", "#E9D5FF", "#FED7AA"];

/**
 * 便签外观主题 → 背景 / 边框 / 头部色 / 墨色（低饱和度）。
 *
 * `ink` 仅彩色主题需要：纸底是固定浅色，不随暗色模式变暗，
 * 标题文字若跟随 `--el-text-color-primary`（暗色下为浅色）会降到 1.01:1 完全不可见。
 * default 主题纸底本身是 token，暗色下会一起变暗，故不给 ink，回落到 primary。
 */
const THEME_STYLES: Record<NoteTheme, { bg: string; border: string; header: string; ink?: string }> = {
  default: { bg: "var(--el-fill-color-blank)", border: "var(--el-border-color-lighter)", header: "var(--el-bg-color)" },
  yellow: { bg: "#FEFCE8", border: "#FDE68A", header: "#FEF3C7", ink: "#3F3A2E" },
  blue: { bg: "#EFF6FF", border: "#BFDBFE", header: "#DBEAFE", ink: "#1E3A5F" },
  green: { bg: "#ECFDF5", border: "#A7F3D0", header: "#D1FAE5", ink: "#1F4D3D" },
  purple: { bg: "#F5F3FF", border: "#DDD6FE", header: "#EDE9FE", ink: "#3F3560" },
  peach: { bg: "#FFF1F2", border: "#FECDD3", header: "#FFE4E6", ink: "#5C2B33" },
};

const props = defineProps<{ widget: WidgetItem }>();

const authStore = useAuthStore();
const userId = computed(() => String(authStore.loginUser?.userId ?? authStore.loginUser?.id ?? "anonymous"));

/** 便签外观主题样式（喂给根容器 CSS 变量） */
const themeStyle = computed(() => {
  const theme = props.widget.noteConfig?.theme ?? "default";
  return THEME_STYLES[theme] ?? THEME_STYLES.default;
});

const notes = ref<Note[]>([]);
const loading = ref(true);
const errored = ref(false);

const dialogVisible = ref(false);
const editing = ref(false);
const form = ref<{ id?: string; text: string; color: string }>({
  text: "",
  color: NOTE_COLORS[0],
});

function getNoteStore(): IndexedDBStore {
  return createNoteStore(userId.value);
}

function load(): void {
  loading.value = true;
  errored.value = false;
  getNoteStore()
    .getAll<Note>()
    .then((list) => {
      notes.value = list.sort((a, b) => b.updatedAt - a.updatedAt);
    })
    .catch((err) => {
      errored.value = true;
      console.warn("[note-widget] load failed", err);
    })
    .finally(() => {
      loading.value = false;
    });
}

function openAdd(): void {
  editing.value = false;
  form.value = { text: "", color: NOTE_COLORS[0] };
  dialogVisible.value = true;
}

function openEdit(note: Note): void {
  editing.value = true;
  form.value = { id: note.id, text: note.text, color: note.color };
  dialogVisible.value = true;
}

async function save(): Promise<void> {
  const text = form.value.text.trim();
  if (!text) {
    message.warning("请输入内容");
    return;
  }
  const now = Date.now();
  const note: Note = {
    id: form.value.id ?? `note_${now}_${Math.random().toString(36).slice(2, 6)}`,
    text,
    color: form.value.color,
    createdAt: editing.value ? (notes.value.find((n) => n.id === form.value.id)?.createdAt ?? now) : now,
    updatedAt: now,
  };
  try {
    await getNoteStore().put(note);
    dialogVisible.value = false;
    load();
    message.success("已保存");
  } catch (err) {
    console.error(err);
    message.error("保存失败");
  }
}

async function remove(id: string): Promise<void> {
  try {
    await ElMessageBox.confirm("确认删除该便签？", "提示", { type: "warning" });
    await getNoteStore().remove(id);
    load();
    message.success("已删除");
  } catch (err) {
    if (err === "cancel") return;
    console.error(err);
    message.error("删除失败");
  }
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

onMounted(() => {
  load();
});

watch(userId, () => load());
</script>

<style lang="scss" scoped>
/* 统一规范：圆角只用令牌、字号最小 12px、间距 4/8 基准、过渡走 --el-transition-duration */
.note-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  min-height: 0;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-card-border-radius, var(--el-radius-lg, 12px));
  overflow: hidden;
  transition: background var(--el-transition-duration, 0.2s),
    border-color var(--el-transition-duration, 0.2s);
}

.note-widget__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 16px 8px;
  background: var(--note-header-bg, var(--el-bg-color));
}

/* 标题是唯一「直接坐在彩色纸底上」的文字。纸底在暗色下仍是浅色，
   若跟随 --el-text-color-primary（暗色下为浅色），实测降到 1.01:1，等于不可见。
   彩色主题给 ink 墨色；default 主题纸底本身是 token，不给 ink 即回落到 primary。
   注意：便签正文、计数、便笺条目各自有 token 底色，不要跟着改成 ink。 */
.note-widget__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--note-ink, var(--el-text-color-primary));
}

.note-widget__count {
  flex-shrink: 0;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-full, 9999px);
}

.note-widget__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0 16px 16px;
}

.note-widget__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.note-widget__item {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  cursor: pointer;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  transition: border-color var(--el-transition-duration, 0.2s),
    background var(--el-transition-duration, 0.2s);
}

.note-widget__item:hover {
  background: var(--el-fill-color-blank);
  border-color: var(--el-border-color);
}

/* 移除按钮默认隐藏，hover / 键盘聚焦时出现 —— 静止时列表更干净，
   但仍保留 tab 可达（:focus-visible 强制显形） */
.note-widget__item-remove {
  position: absolute;
  top: 8px;
  right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  cursor: pointer;
  opacity: 0;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-sm, 6px);
  transition: opacity var(--el-transition-duration, 0.2s),
    color var(--el-transition-duration, 0.2s),
    background var(--el-transition-duration, 0.2s);
}

.note-widget__item:hover .note-widget__item-remove,
.note-widget__item-remove:focus-visible {
  opacity: 1;
}

.note-widget__item-remove:hover {
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 12%, var(--el-fill-color-light));
}

.note-widget__item-remove:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

/* 正文右侧留出删除按钮的位置，hover 显形时才不会被压住 */
.note-widget__item-text {
  padding-right: 28px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.note-widget__item-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.note-widget__item-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.note-widget__item-color {
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  border-radius: var(--el-radius-full, 9999px);
}

.note-widget__colors {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.note-widget__color {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: var(--el-radius-sm, 6px);
  color: var(--el-color-white, #fff);
  transition: transform var(--el-transition-duration, 0.2s),
    border-color var(--el-transition-duration, 0.2s);
}

.note-widget__color:hover {
  transform: scale(1.08);
}

.note-widget__color:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.note-widget__color.is-active {
  border-color: var(--el-color-primary);
}
</style>