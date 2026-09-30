<template>
  <div
    class="note-widget"
    :style="{
      background: themeStyle.bg,
      borderColor: themeStyle.border,
      '--note-header-bg': themeStyle.header,
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
            aria-label="删除"
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
import { defineAsyncComponent, onMounted, ref, watch, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
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

/** 便签外观主题 → 背景 / 边框 / 头部色（低饱和度） */
const THEME_STYLES: Record<NoteTheme, { bg: string; border: string; header: string }> = {
  default: { bg: "var(--el-fill-color-blank)", border: "var(--el-border-color-lighter)", header: "var(--el-bg-color)" },
  yellow: { bg: "#FEFCE8", border: "#FDE68A", header: "#FEF3C7" },
  blue: { bg: "#EFF6FF", border: "#BFDBFE", header: "#DBEAFE" },
  green: { bg: "#ECFDF5", border: "#A7F3D0", header: "#D1FAE5" },
  purple: { bg: "#F5F3FF", border: "#DDD6FE", header: "#EDE9FE" },
  peach: { bg: "#FFF1F2", border: "#FECDD3", header: "#FFE4E6" },
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
    ElMessage.warning("请输入内容");
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
    ElMessage.success("已保存");
  } catch (err) {
    console.error(err);
    ElMessage.error("保存失败");
  }
}

async function remove(id: string): Promise<void> {
  try {
    await ElMessageBox.confirm("确认删除该便签？", "提示", { type: "warning" });
    await getNoteStore().remove(id);
    load();
    ElMessage.success("已删除");
  } catch (err) {
    if (err === "cancel") return;
    console.error(err);
    ElMessage.error("删除失败");
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
.note-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  min-height: 0;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  overflow: hidden;
  transition: background 0.2s, border-color 0.2s;
}

.note-widget__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: var(--note-header-bg, var(--el-bg-color));
}

.note-widget__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.note-widget__count {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  padding: 2px 8px;
  border-radius: 999px;
}

.note-widget__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 8px 12px 12px;
}

.note-widget__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.note-widget__item {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-bg-color);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.note-widget__item:hover {
  border-color: var(--el-border-color);
  background: var(--el-fill-color-blank);
}

.note-widget__item-remove {
  position: absolute;
  top: 6px;
  right: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s, background 0.15s;
}

.note-widget__item:hover .note-widget__item-remove {
  opacity: 1;
}

.note-widget__item-remove:hover {
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 12%, var(--el-fill-color-light));
}

.note-widget__item-text {
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
}

.note-widget__item-time {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.note-widget__item-color {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.note-widget__colors {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.note-widget__color {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-white, #fff);
  transition: transform 0.15s, border-color 0.15s;
  padding: 0;
}

.note-widget__color:hover {
  transform: scale(1.08);
}

.note-widget__color.is-active {
  border-color: var(--el-color-primary);
}
</style>