<template>
  <div class="aw">
    <div v-if="!widget.hideTitle" class="aw__header">
      <div class="aw__title">
        <el-icon class="aw__title-icon"><AlarmClock /></el-icon>
        <span>{{ widget.title }}</span>
      </div>
      <button type="button" class="aw__add" title="添加闹钟" @click="openAdd">
        <el-icon><Plus /></el-icon>
      </button>
    </div>

    <div class="aw__body" v-loading="loading">
      <div v-if="!alarms.length && !loading" class="aw__empty">
        <el-icon :size="28"><AlarmClock /></el-icon>
        <span>暂无闹钟</span>
        <button type="button" class="aw__empty-btn" @click="openAdd">添加一个</button>
      </div>
      <div v-else class="aw__list">
        <div v-for="a in alarms" :key="a.id" class="aw__item" :class="{ 'aw__item--off': !a.enabled }">
          <div class="aw__item-time" :class="{ 'aw__item-time--off': !a.enabled }">
            {{ pad(a.hour) }}:{{ pad(a.minute) }}
          </div>
          <div class="aw__item-main">
            <div class="aw__item-top">
              <span class="aw__item-title">{{ a.title }}</span>
              <span class="aw__item-badge">{{ repeatLabel(a.repeat) }}</span>
            </div>
            <div class="aw__item-countdown">{{ a.enabled ? countdownText(a) : "已停用" }}</div>
          </div>
          <div class="aw__item-actions">
            <el-switch :model-value="a.enabled" @change="toggle(a.id, $event)" />
            <button type="button" class="aw__item-del" title="删除" @click="remove(a.id)">
              <el-icon><Close /></el-icon>
            </button>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑闹钟' : '添加闹钟'"
      width="400px"
      :close-on-click-modal="false"
      append-to-body
      @close="dialogVisible = false"
    >
      <el-form label-width="60px" label-position="left">
        <el-form-item label="标题">
          <el-input v-model="form.title" maxlength="20" placeholder="闹钟标题" />
        </el-form-item>
        <el-form-item label="时间">
          <el-time-picker v-model="form.time" :format="'HH:mm'" style="width:100%" />
        </el-form-item>
        <el-form-item label="重复">
          <el-radio-group v-model="form.repeat">
            <el-radio value="daily">每天</el-radio>
            <el-radio value="weekday">工作日</el-radio>
            <el-radio value="once">单次</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="次数">
          <el-select v-model="form.repeatCount" style="width: 100%">
            <el-option :value="1" label="1 次" />
            <el-option :value="3" label="3 次" />
            <el-option :value="5" label="5 次" />
            <el-option :value="0" label="无限" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="AlarmWidget">

import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { ElMessage, ElNotification } from "element-plus";
import { AlarmClock, Close, Plus } from "@element-plus/icons-vue";
import { IndexedDBStore } from "@repo/utils";
import { useMessageStore } from "@repo/pinia";
import useAuthStore from "@repo/pinia/modules/auth";
import type { WidgetItem } from "../types";

const props = defineProps<{ widget: WidgetItem }>();

interface Alarm {
  id: string;
  title: string;
  hour: number;
  minute: number;
  repeat: "daily" | "weekday" | "once";
  enabled: boolean;
  repeatCount?: number;
  fired?: boolean;
  firedCount?: number;
}

const authStore = useAuthStore();
const messageStore = useMessageStore();
const userId = computed(() => String(authStore.loginUser?.userId ?? authStore.loginUser?.id ?? "anonymous"));

const store = new IndexedDBStore({
  dbName: `koi-home-alarm-${userId.value}`,
  storeName: "alarms",
  keyPath: "id",
  version: 1,
});

const alarms = ref<Alarm[]>([]);
const loading = ref(true);
const dialogVisible = ref(false);
const editingId = ref<string | null>(null);

const form = reactive({
  title: "",
  time: new Date(),
  repeat: "daily" as Alarm["repeat"],
  repeatCount: 1,
});

const tick = ref(0);
let tickTimer: ReturnType<typeof setInterval> | null = null;
let worker: Worker | null = null;

function pad(n: number): string {
  return n < 10 ? "0" + n : String(n);
}

function repeatLabel(r: string): string {
  if (r === "daily") return "每天";
  if (r === "weekday") return "工作日";
  return "单次";
}

function countdownText(a: Alarm): string {
  if (a.repeat === "once" && a.fired) return "已响铃";
  const now = new Date();
  const target = new Date();
  target.setHours(a.hour, a.minute, 0, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  const diff = target.getTime() - now.getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return "还剩 " + h + " 小时 " + m + " 分钟";
  if (m > 0) return "还剩 " + m + " 分钟";
  return "即将响铃";
}

function createWorker(): void {
  if (worker) return;
  worker = new Worker(new URL("./alarm.worker.ts", import.meta.url));
  worker.onmessage = (e: MessageEvent) => {
    const msg = e.data;
    if (msg.type === "fire") {
      const title = msg.title || "闹钟提醒";
      const content = title + " - " + pad(msg.hour) + ":" + pad(msg.minute);
      messageStore.push({
        subject: "闹钟提醒",
        content,
        module: "message",
        event: "push",
        sendTime: new Date().toISOString(),
      });
      ElNotification({
        title: "闹钟提醒",
        message: content,
        type: "success",
        duration: 6000,
      });
      if (msg.firedCount != null) {
        const a = alarms.value.find((x) => x.id === msg.id);
        if (a) { a.firedCount = msg.firedCount; store.put(a).catch(() => undefined); }
      }
    } else if (msg.type === "delete") {
      const idx = alarms.value.findIndex((x) => x.id === msg.id);
      if (idx >= 0) alarms.value.splice(idx, 1);
      store.remove(msg.id).catch(() => undefined);
      ElMessage.info("闹钟已响铃完毕");
    } else if (msg.type === "disable") {
      const a = alarms.value.find((x) => x.id === msg.id);
      if (a) {
        a.enabled = false;
        if (msg.firedCount != null) a.firedCount = msg.firedCount;
        store.put(a).catch(() => undefined);
        ElMessage.info("闹钟已达次数上限，已停用");
      }
    }
  };
}

function syncWorker(): void {
  worker?.postMessage({
    type: "sync",
    list: alarms.value.map((a) => ({ ...a })),
  });
}

async function load(): Promise<void> {
  loading.value = true;
  try {
    alarms.value = await store.getAll<Alarm>();
    syncWorker();
  } catch (e) {
    console.warn("[alarm] load failed", e);
  } finally {
    loading.value = false;
  }
}

async function toggle(id: string, val: boolean): Promise<void> {
  const a = alarms.value.find((x) => x.id === id);
  if (!a) return;
  a.enabled = val;
  await store.put(a);
  syncWorker();
}

async function remove(id: string): Promise<void> {
  alarms.value = alarms.value.filter((x) => x.id !== id);
  await store.remove(id);
  syncWorker();
}

function openAdd(): void {
  editingId.value = null;
  form.title = "";
  form.time = new Date();
  form.time.setHours(9, 0, 0, 0);
  form.repeat = "daily";
  form.repeatCount = 1;
  dialogVisible.value = true;
}

async function save(): Promise<void> {
  const title = form.title.trim();
  if (!title) {
    ElMessage.warning("请输入闹钟标题");
    return;
  }
  const hour = form.time.getHours();
  const minute = form.time.getMinutes();
  const now = Date.now();
  const alarm: Alarm = {
    id: editingId.value ?? `alarm_${now}_${Math.random().toString(36).slice(2, 6)}`,
    title,
    hour,
    minute,
    repeat: form.repeat,
    repeatCount: form.repeatCount,
    enabled: true,
    fired: false,
  };
  await store.put(alarm);
  if (editingId.value) {
    const idx = alarms.value.findIndex((x) => x.id === editingId.value);
    if (idx >= 0) alarms.value[idx] = alarm;
  } else {
    alarms.value.push(alarm);
  }
  syncWorker();
  dialogVisible.value = false;
  ElMessage.success("已保存");
}

onMounted(async () => {
  createWorker();
  await load();
  worker?.postMessage({ type: "start" });
  tickTimer = setInterval(() => { tick.value = Date.now(); }, 1000);
});

onBeforeUnmount(() => {
  worker?.postMessage({ type: "stop" });
  worker?.terminate();
  worker = null;
  if (tickTimer) clearInterval(tickTimer);
});
</script>

<style lang="scss" scoped>
.aw {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  min-height: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  overflow: hidden;
}

.aw__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
}

.aw__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.aw__title-icon {
  color: var(--el-color-primary);
}

.aw__add {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  color: var(--el-color-primary);
  cursor: pointer;
  transition: background 0.15s;
}

.aw__add:hover {
  background: color-mix(in srgb, var(--el-color-primary) 18%, transparent);
}

.aw__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0 12px 12px;
}

.aw__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  color: var(--el-text-color-disabled);
  font-size: 13px;
}

.aw__empty-btn {
  margin-top: 4px;
  padding: 6px 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: transparent;
  color: var(--el-color-primary);
  cursor: pointer;
  font-size: 12px;
  transition: background 0.15s;
}

.aw__empty-btn:hover {
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
}

.aw__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.aw__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-blank);
  transition: border-color 0.15s, background 0.15s;
}

.aw__item:hover {
  border-color: var(--el-border-color);
}

.aw__item--off {
  opacity: 0.55;
}

.aw__item-time {
  font-size: 22px;
  font-weight: 700;
  color: var(--el-color-primary);
  font-variant-numeric: tabular-nums;
  min-width: 60px;
}

.aw__item-time--off {
  color: var(--el-text-color-secondary);
}

.aw__item-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.aw__item-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.aw__item-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.aw__item-badge {
  flex-shrink: 0;
  font-size: 10px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  padding: 2px 8px;
  border-radius: 999px;
}

.aw__item-countdown {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.aw__item-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.aw__item-del {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.aw__item-del:hover {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}
</style>