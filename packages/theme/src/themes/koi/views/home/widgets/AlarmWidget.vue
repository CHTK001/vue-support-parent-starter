<template>
  <div class="aw">
    <div v-if="!widget.hideTitle" class="aw__header">
      <div class="aw__title">
        <el-icon class="aw__title-icon"><AlarmClock /></el-icon>
        <span>{{ widget.title }}</span>
      </div>
      <button type="button" class="aw__add" title="添加闹钟" aria-label="添加闹钟" @click="openAdd">
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
            <el-switch :model-value="a.enabled" @change="toggle(a.id, $event === true)" />
            <button type="button" class="aw__item-del" :title="`删除闹钟 ${a.title}`" :aria-label="`删除闹钟 ${a.title}`" @click="remove(a.id)">
              <el-icon><Close /></el-icon>
            </button>
          </div>
        </div>
      </div>
    </div>

    <ReDialog
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
          <ReRadioGroup v-model="form.repeat">
            <ReRadio value="daily">每天</ReRadio>
            <ReRadio value="weekday">工作日</ReRadio>
            <ReRadio value="once">单次</ReRadio>
          </ReRadioGroup>
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
    </ReDialog>
  </div>
</template>

<script setup lang="ts" name="AlarmWidget">

import { message } from "@repo/core";
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { ElNotification } from "element-plus";
import { AlarmClock, Close, Plus } from "@element-plus/icons-vue";
import { IndexedDBStore } from "@repo/utils";
import { useMessageStore } from "@repo/pinia";
import useAuthStore from "@repo/pinia/modules/auth";
import type { WidgetItem } from "../types";
import ReDialog from "@repo/ui/re-dialog";
import { ReRadioGroup, ReRadio } from "@repo/ui/re-kit";

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
      message.info("闹钟已响铃完毕");
    } else if (msg.type === "disable") {
      const a = alarms.value.find((x) => x.id === msg.id);
      if (a) {
        a.enabled = false;
        if (msg.firedCount != null) a.firedCount = msg.firedCount;
        store.put(a).catch(() => undefined);
        message.info("闹钟已达次数上限，已停用");
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

/**
 * 保存闹钟（新建 / 编辑）
 *
 * <p>上一次修过这里之后又冒回来两个空子：
 *   <ol>
 *     <li>{@code form.time} 为空（用户清除了时间选择器）时，{@code form.time.getHours()} 直接抛出
 *         TypeError，前面的标题校验通过、后面的 `store.put` 还没执行，整个保存就中断了，
 *         用户看到的是点保存按钮没反应，控制台只有 TypeError。</li>
 *     <li>{@code store.put(alarm)} 没有 try/catch。IndexedDB 写入失败（配额满了 / 权限被拒绝 /
 *         数据库升级中）时，Promise 被静默丢弃，用户看到「已保存」的提示但数据没写进去。</li>
 *   </ol>
 * 两处都补上了拦截与日志。</p>
 */
async function save(): Promise<void> {
  const title = form.title.trim();
  if (!title) {
    message.warning("请输入闹钟标题");
    return;
  }
  // el-time-picker 允许清空，此时 form.time === null；强行读时分会 TypeError 中断整个保存
  const time = form.time instanceof Date ? form.time : null;
  if (!time || Number.isNaN(time.getTime())) {
    message.warning("请选择闹钟时间");
    return;
  }
  const hour = time.getHours();
  const minute = time.getMinutes();
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
  try {
    await store.put(alarm);
  } catch (e) {
    console.error("[alarm] 写入 IndexedDB 失败", e);
    message.error("闹钟保存失败，请检查浏览器存储权限");
    // 没写进去就别进编辑列表与 worker，留给用户重试
    return;
  }
  if (editingId.value) {
    const idx = alarms.value.findIndex((x) => x.id === editingId.value);
    if (idx >= 0) alarms.value[idx] = alarm;
  } else {
    alarms.value.push(alarm);
  }
  syncWorker();
  dialogVisible.value = false;
  message.success("已保存");
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
/* 统一规范：圆角只用令牌、字号最小 12px、间距 4/8 基准、过渡走 --el-transition-duration */
.aw {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  min-height: 0;
  background: var(--koi-widget-bg, var(--el-bg-color));
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-card-border-radius, var(--el-radius-lg, 12px));
  overflow: hidden;
}

.aw__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 16px 8px;
}

.aw__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.aw__title-icon {
  flex-shrink: 0;
  color: var(--el-color-primary);
}

.aw__add {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border: none;
  cursor: pointer;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  border-radius: var(--el-radius-sm, 6px);
  transition: background var(--el-transition-duration, 0.2s);
}

.aw__add:hover {
  background: color-mix(in srgb, var(--el-color-primary) 20%, transparent);
}

.aw__add:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.aw__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0 16px 16px;
}

.aw__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  font-size: 13px;
  color: var(--el-text-color-disabled);
}

.aw__empty-btn {
  margin-top: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 12px;
  color: var(--el-color-primary);
  background: transparent;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-sm, 6px);
  transition: background var(--el-transition-duration, 0.2s),
    border-color var(--el-transition-duration, 0.2s);
}

.aw__empty-btn:hover {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
}

.aw__empty-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
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
  padding: 12px 16px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  transition: border-color var(--el-transition-duration, 0.2s),
    background var(--el-transition-duration, 0.2s);
}

.aw__item:hover {
  background: var(--koi-widget-bg, var(--el-bg-color));
  border-color: var(--el-border-color);
}

/* 已关闭的闹钟整体弱化，但仍保持可读（opacity 过低会让文字对比度不达标） */
.aw__item--off {
  opacity: 0.6;
}

.aw__item-time {
  min-width: 60px;
  font-size: 22px;
  font-weight: 700;
  color: var(--el-color-primary);
  font-variant-numeric: tabular-nums;
}

.aw__item-time--off {
  color: var(--el-text-color-secondary);
}

.aw__item-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.aw__item-top {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.aw__item-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.aw__item-badge {
  flex-shrink: 0;
  padding: 2px 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-full, 9999px);
}

.aw__item-countdown {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}

.aw__item-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.aw__item-del {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  background: transparent;
  border-radius: var(--el-radius-sm, 6px);
  transition: background var(--el-transition-duration, 0.2s),
    color var(--el-transition-duration, 0.2s);
}

.aw__item-del:hover {
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
}

.aw__item-del:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-danger) 20%, transparent);
}
</style>