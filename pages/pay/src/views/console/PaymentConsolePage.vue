<template>
  <PmPageShell page-class="payment-console-page">
    <PmSurface
      :eyebrow="eyebrow"
      :title="title"
      :description="description"
    >
      <template #actions>
        <ScButton @click="settingsVisible = true">接口设置</ScButton>
        <ScButton type="primary" @click="loadAll">刷新全局</ScButton>
      </template>
    </PmSurface>

    <PmStatGrid>
      <PmStatCard label="回调策略" hint="当前模块可见的回调拼接策略">
        <template #value>{{ callbackAudits.length }}</template>
      </PmStatCard>
      <PmStatCard label="严格 Scoped" hint="不会被固定地址覆盖的回调">
        <template #value>{{ strictScopedCount }}</template>
      </PmStatCard>
      <PmStatCard label="启用任务" hint="可直接调整 cron 与触发">
        <template #value>{{ enabledTaskCount }}</template>
      </PmStatCard>
      <PmStatCard label="待处理异常" hint="最近 6 条异常中的待处理项">
        <template #value>{{ pendingNotifyErrorCount }}</template>
      </PmStatCard>
    </PmStatGrid>

    <section class="payment-console-grid">
      <PmPanel title="回调诊断" description="展示 payment 模块当前生效的回调策略与覆盖顺序。">
        <div class="spring-table-shell">
          <table class="spring-table">
            <thead>
              <tr><th>类型</th><th>推荐路径</th><th>优先级</th><th>结论</th></tr>
            </thead>
            <tbody>
              <tr v-if="loadingOverview"><td colspan="4" class="spring-empty-cell">正在加载运营概览...</td></tr>
              <tr v-else-if="!callbackAudits.length"><td colspan="4" class="spring-empty-cell">当前没有回调诊断数据。</td></tr>
              <tr v-for="item in callbackAudits" v-else :key="item.callbackType">
                <td>{{ item.callbackName || item.callbackType || "-" }}</td>
                <td>{{ item.recommendedPattern || "-" }}</td>
                <td>{{ item.effectivePriority || "-" }}</td>
                <td>{{ item.notes || "-" }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </PmPanel>

      <PmPanel title="订单编号策略" description="统一展示核心业务的编号生成与幂等规则。">
        <div class="payment-strategy-list">
          <article v-if="loadingOverview" class="spring-detail-item">正在加载编号策略...</article>
          <article v-for="item in orderStrategies" v-else :key="item.businessType" class="payment-strategy-card">
            <span class="spring-chip payment-strategy-chip">{{ item.businessType || "未命名业务" }}</span>
            <h3>{{ item.fieldName || "-" }}</h3>
            <p>{{ item.generationRule || "-" }}</p>
            <p><strong>幂等规则：</strong>{{ item.idempotentRule || "-" }}</p>
          </article>
          <article v-if="!loadingOverview && !orderStrategies.length" class="spring-detail-item">当前没有订单编号策略数据。</article>
        </div>
      </PmPanel>
    </section>

    <section class="payment-console-wide">
      <PmPanel title="运行时调度任务" description="可直接保存 cron、启停任务并立即触发。">
        <template #head-actions>
          <ScButton type="text" @click="loadSchedulerTasks">{{ loadingScheduler ? "加载中..." : "刷新任务" }}</ScButton>
        </template>
        <div class="spring-table-shell">
          <table class="spring-table">
            <thead>
              <tr><th>任务</th><th>Cron</th><th>启用</th><th>下次执行</th><th>最近结果</th><th>操作</th></tr>
            </thead>
            <tbody>
              <tr v-if="loadingScheduler"><td colspan="6" class="spring-empty-cell">正在加载调度任务...</td></tr>
              <tr v-else-if="!schedulerTasks.length"><td colspan="6" class="spring-empty-cell">当前没有可管理的调度任务。</td></tr>
              <tr v-for="task in schedulerTasks" v-else :key="task.taskKey || task.taskName">
                <td>
                  <div class="spring-table-title">
                    <span class="spring-title-strong">{{ task.taskName || "-" }}</span>
                    <span class="spring-muted-line">{{ task.taskKey || "-" }}</span>
                  </div>
                </td>
                <td><input v-model.trim="schedulerDrafts[task.taskKey].cronExpression" type="text" placeholder="请输入 cron"></td>
                <td><input v-model="schedulerDrafts[task.taskKey].enabled" type="checkbox"></td>
                <td>{{ formatDateTime(task.nextExecutionTime) || "-" }}</td>
                <td>{{ task.lastRunStatus || "-" }}</td>
                <td class="payment-inline-actions-cell">
                  <ScButton :disabled="savingTaskKey === task.taskKey" @click="saveTask(task.taskKey)">{{ savingTaskKey === task.taskKey ? "保存中..." : "保存" }}</ScButton>
                  <ScButton type="primary" :disabled="triggeringTaskKey === task.taskKey" @click="triggerTask(task.taskKey)">{{ triggeringTaskKey === task.taskKey ? "执行中..." : "立即执行" }}</ScButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </PmPanel>

      <aside class="payment-console-aside">
        <PmPanel title="最近回调异常" description="展示最近 6 条异常，并支持直接重试。">
          <template #head-actions>
            <ScButton type="text" @click="loadNotifyErrors">{{ loadingNotifyErrors ? "加载中..." : "刷新异常" }}</ScButton>
          </template>
          <div class="spring-log-list">
            <div v-if="loadingNotifyErrors" class="spring-empty-state">正在加载回调异常...</div>
            <div v-else-if="!notifyErrors.length" class="spring-empty-state">当前没有回调异常。</div>
            <article v-for="item in notifyErrors" v-else :key="item.id" class="spring-log-card">
              <div class="spring-log-card-head">
                <div class="spring-table-title">
                  <span class="spring-title-strong">{{ item.notifyType || "未知类型" }}</span>
                  <span class="spring-muted-line">{{ item.orderNo || item.refundNo || "-" }}</span>
                </div>
                <ScButton type="danger" :disabled="retryingErrorId === item.id" @click="retryError(item.id)">
                  {{ retryingErrorId === item.id ? "重试中..." : "重试" }}
                </ScButton>
              </div>
              <p>{{ item.errorMessage || "暂无异常信息" }}</p>
              <p class="spring-muted-line">状态 {{ item.status || "-" }} · 下次 {{ formatDateTime(item.nextRetryTime) || "-" }}</p>
            </article>
          </div>
        </PmPanel>

        <PmPanel title="最近回调日志" description="展示最近 6 条处理日志与结果。">
          <template #head-actions>
            <ScButton type="text" @click="loadNotifyLogs">{{ loadingNotifyLogs ? "加载中..." : "刷新日志" }}</ScButton>
          </template>
          <div class="spring-log-list">
            <div v-if="loadingNotifyLogs" class="spring-empty-state">正在加载回调日志...</div>
            <div v-else-if="!notifyLogs.length" class="spring-empty-state">当前没有回调日志。</div>
            <article v-for="item in notifyLogs" v-else :key="item.id" class="spring-log-card">
              <div class="spring-log-card-head">
                <div class="spring-table-title">
                  <span class="spring-title-strong">{{ item.notifyType || "未知类型" }}</span>
                  <span class="spring-muted-line">{{ item.channelType || "-" }} · {{ formatDateTime(item.receivedTime) || "-" }}</span>
                </div>
                <span class="spring-chip" :class="upper(item.processStatus) === 'SUCCESS' ? 'spring-success' : ''">{{ item.processStatus || "-" }}</span>
              </div>
              <p>{{ item.processResult || "暂无处理结果" }}</p>
            </article>
          </div>
        </PmPanel>
      </aside>
    </section>

    <el-dialog v-model="settingsVisible" title="接口设置" width="480px" destroy-on-close>
      <form @submit.prevent="saveSettings">
        <div class="pm-form-grid">
          <div class="pm-form-span-2">
            <el-form-item label="API 根路径">
              <el-input v-model.trim="settings.apiRoot" type="text" placeholder="../api/ops/" />
            </el-form-item>
          </div>
          <el-form-item label="Header 名称">
            <el-input v-model.trim="settings.authHeaderName" type="text" placeholder="可选" />
          </el-form-item>
          <el-form-item label="Header 值">
            <el-input v-model.trim="settings.authHeaderValue" type="password" placeholder="可选" />
          </el-form-item>
        </div>
        <div class="pm-dialog-footer">
          <ScButton @click="settingsVisible = false">取消</ScButton>
          <ScButton type="primary" native-type="submit">保存设置</ScButton>
        </div>
      </form>
    </el-dialog>

    <div class="spring-toast-stack">
      <div v-for="toast in toasts" :key="toast.id" class="spring-toast" :class="`spring-${toast.type}`">{{ toast.message }}</div>
    </div>
  </PmPageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ScButton } from "@repo/components/ScButton";
import PmPageShell from "../../components/layout/PmPageShell.vue";
import PmSurface from "../../components/layout/PmSurface.vue";
import PmStatGrid from "../../components/layout/PmStatGrid.vue";
import PmStatCard from "../../components/layout/PmStatCard.vue";
import PmPanel from "../../components/layout/PmPanel.vue";

const props = withDefaults(defineProps<{ title?: string; description?: string; eyebrow?: string; defaultApiRoot?: string; storageKey?: string; }>(), {
  title: "Payment Operations Console",
  description: "在 Spring 模块内直接查看支付回调、动态任务与通知异常，无需额外前端工程。",
  eyebrow: "Payment Starter",
  defaultApiRoot: "../api/ops/",
  storageKey: "spring.pages.payment-console.settings",
});

const loadingOverview = ref(false);
const loadingScheduler = ref(false);
const loadingNotifyErrors = ref(false);
const loadingNotifyLogs = ref(false);
const settingsVisible = ref(false);
const savingTaskKey = ref("");
const triggeringTaskKey = ref("");
const retryingErrorId = ref<number | null>(null);
const callbackAudits = ref<Record<string, any>[]>([]);
const orderStrategies = ref<Record<string, any>[]>([]);
const schedulerTasks = ref<Record<string, any>[]>([]);
const notifyErrors = ref<Record<string, any>[]>([]);
const notifyLogs = ref<Record<string, any>[]>([]);
const schedulerDrafts = reactive<Record<string, { cronExpression: string; enabled: boolean }>>({});
const settings = reactive(loadSettings());
const toasts = ref<{ id: number; message: string; type: "success" | "error" | "info" }[]>([]);
let toastSeed = 0;

const strictScopedCount = computed(() => callbackAudits.value.filter((item) => Boolean(item.strictScoped)).length);
const enabledTaskCount = computed(() => schedulerTasks.value.filter((item) => Boolean(item.enabled)).length);
const pendingNotifyErrorCount = computed(() => notifyErrors.value.filter((item) => upper(item.status) === "PENDING").length);

onMounted(async () => {
  await loadAll();
});

async function loadAll() {
  await Promise.all([loadOverview(), loadSchedulerTasks(), loadNotifyErrors(), loadNotifyLogs()]);
}

async function loadOverview() {
  loadingOverview.value = true;
  try {
    const payload = await request("overview");
    callbackAudits.value = normalizeArray(payload?.callbackAudits);
    orderStrategies.value = normalizeArray(payload?.orderNumberStrategies);
  } catch (error) {
    callbackAudits.value = [];
    orderStrategies.value = [];
    notify(resolveError(error, "加载运营概览失败"), "error");
  } finally {
    loadingOverview.value = false;
  }
}

async function loadSchedulerTasks() {
  loadingScheduler.value = true;
  try {
    schedulerTasks.value = normalizeArray(await request("scheduler/tasks"));
    Object.keys(schedulerDrafts).forEach((key) => delete schedulerDrafts[key]);
    for (const task of schedulerTasks.value) {
      const taskKey = trim(task.taskKey);
      if (!taskKey) continue;
      schedulerDrafts[taskKey] = { cronExpression: trim(task.cronExpression), enabled: Boolean(task.enabled) };
    }
  } catch (error) {
    schedulerTasks.value = [];
    notify(resolveError(error, "加载调度任务失败"), "error");
  } finally {
    loadingScheduler.value = false;
  }
}

async function saveTask(taskKey: string) {
  const normalizedTaskKey = trim(taskKey);
  if (!normalizedTaskKey || !schedulerDrafts[normalizedTaskKey]) return;
  savingTaskKey.value = normalizedTaskKey;
  try {
    await request(`scheduler/tasks/${encodeURIComponent(normalizedTaskKey)}`, {
      method: "PUT",
      body: JSON.stringify(schedulerDrafts[normalizedTaskKey]),
    });
    notify("调度任务配置已更新", "success");
    await loadSchedulerTasks();
  } catch (error) {
    notify(resolveError(error, "保存调度任务失败"), "error");
  } finally {
    savingTaskKey.value = "";
  }
}

async function triggerTask(taskKey: string) {
  const normalizedTaskKey = trim(taskKey);
  if (!normalizedTaskKey) return;
  triggeringTaskKey.value = normalizedTaskKey;
  try {
    await request(`scheduler/tasks/${encodeURIComponent(normalizedTaskKey)}/trigger`, { method: "POST" });
    notify("任务已触发", "success");
    await Promise.all([loadSchedulerTasks(), loadNotifyErrors(), loadNotifyLogs()]);
  } catch (error) {
    notify(resolveError(error, "触发任务失败"), "error");
  } finally {
    triggeringTaskKey.value = "";
  }
}

async function loadNotifyErrors() {
  loadingNotifyErrors.value = true;
  try {
    const payload = await request("notify/error/page?pageNum=1&pageSize=6&status=PENDING");
    notifyErrors.value = normalizeArray(payload?.records);
  } catch (error) {
    notifyErrors.value = [];
    notify(resolveError(error, "加载回调异常失败"), "error");
  } finally {
    loadingNotifyErrors.value = false;
  }
}

async function loadNotifyLogs() {
  loadingNotifyLogs.value = true;
  try {
    const payload = await request("notify/log/page?pageNum=1&pageSize=6");
    notifyLogs.value = normalizeArray(payload?.records);
  } catch (error) {
    notifyLogs.value = [];
    notify(resolveError(error, "加载回调日志失败"), "error");
  } finally {
    loadingNotifyLogs.value = false;
  }
}

async function retryError(id: number) {
  if (!Number.isFinite(id)) return;
  retryingErrorId.value = id;
  try {
    await request(`notify/error/${id}/retry`, { method: "POST" });
    notify("回调异常已发起重试", "success");
    await Promise.all([loadNotifyErrors(), loadNotifyLogs()]);
  } catch (error) {
    notify(resolveError(error, "回调异常重试失败"), "error");
  } finally {
    retryingErrorId.value = null;
  }
}

function saveSettings() {
  settings.apiRoot = trim(settings.apiRoot) || props.defaultApiRoot;
  settings.authHeaderName = trim(settings.authHeaderName);
  settings.authHeaderValue = trim(settings.authHeaderValue);
  localStorage.setItem(props.storageKey, JSON.stringify(settings));
  settingsVisible.value = false;
  notify("接口设置已保存", "success");
  void loadAll();
}

async function request(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers || {});
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (trim(settings.authHeaderName) && trim(settings.authHeaderValue)) headers.set(trim(settings.authHeaderName), trim(settings.authHeaderValue));
  const response = await fetch(buildApiUrl(path), { credentials: "include", ...init, headers });
  const text = await response.text();
  const payload = text ? safeJsonParse(text) : null;
  if (!response.ok) throw new Error(resolveMessage(payload) || `请求失败: ${response.status}`);
  if (payload && typeof payload === "object" && "code" in payload) {
    const code = String(payload.code ?? "");
    if (!["00000", "200", "0"].includes(code)) throw new Error(resolveMessage(payload) || `业务请求失败: ${code}`);
    return "data" in payload ? payload.data : payload;
  }
  return payload;
}

function buildApiUrl(path: string) {
  const root = trim(settings.apiRoot) || props.defaultApiRoot;
  const normalized = root.endsWith("/") ? root : `${root}/`;
  return new URL(path.replace(/^\/+/, ""), new URL(normalized, window.location.href)).toString();
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(props.storageKey);
    const parsed = raw ? JSON.parse(raw) : {};
    return { apiRoot: trim(parsed.apiRoot) || props.defaultApiRoot, authHeaderName: trim(parsed.authHeaderName), authHeaderValue: trim(parsed.authHeaderValue) };
  } catch {
    return { apiRoot: props.defaultApiRoot, authHeaderName: "", authHeaderValue: "" };
  }
}

function notify(message: string, type: "success" | "error" | "info") {
  const id = ++toastSeed;
  toasts.value.push({ id, message, type });
  window.setTimeout(() => { toasts.value = toasts.value.filter((item) => item.id !== id); }, 3200);
}

function normalizeArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function formatDateTime(value?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value).replace("T", " ") : parsed.toLocaleString("zh-CN", { hour12: false });
}

function resolveMessage(payload: any) {
  if (!payload) return "";
  if (typeof payload === "string") return payload;
  return payload.message || payload.msg || payload.error || "";
}

function safeJsonParse(value: string) {
  try { return JSON.parse(value); } catch { return value; }
}

function resolveError(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function trim(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function upper(value: unknown) {
  return trim(value).toUpperCase();
}
</script>

<style scoped>
.payment-console-page {
  background: linear-gradient(180deg, #eef7f6 0%, #f7f8fa 220px, #f7f8fa 100%);
}

.payment-console-page :deep(.pm-surface) {
  background:
    radial-gradient(circle at top right, rgba(214, 134, 55, 0.18), transparent 28%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 248, 242, 0.9));
}

.payment-console-page :deep(.pm-stat-card:first-child) {
  background:
    radial-gradient(circle at top right, rgba(255, 196, 144, 0.36), transparent 34%),
    linear-gradient(140deg, #402518 0%, #8f552d 54%, #d18b44 100%);
}

.payment-console-page :deep(.pm-stat-card:first-child .pm-stat-card__label),
.payment-console-page :deep(.pm-stat-card:first-child .pm-stat-card__value),
.payment-console-page :deep(.pm-stat-card:first-child .pm-stat-card__hint) {
  color: #fff4eb;
}

.payment-console-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 22px;
}

.payment-console-wide {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(320px, 0.9fr);
  gap: 18px;
  margin-top: 22px;
}

.payment-console-aside {
  display: grid;
  gap: 18px;
}

.payment-strategy-list {
  display: grid;
  gap: 14px;
}

.payment-strategy-card {
  padding: 18px;
  border: 1px solid rgba(210, 129, 47, 0.12);
  border-radius: 12px;
  background: rgba(255, 250, 245, 0.92);
}

.payment-strategy-card h3 {
  margin: 12px 0 8px;
}

.payment-strategy-card p {
  margin: 6px 0 0;
  color: #667085;
}

.payment-strategy-chip {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 12px;
  background: rgba(210, 129, 47, 0.12);
  color: #b76716;
}

.payment-inline-actions-cell {
  white-space: nowrap;
}

.payment-inline-actions-cell > * + * {
  margin-left: 8px;
}

@media (max-width: 1120px) {
  .payment-console-grid,
  .payment-console-wide {
    grid-template-columns: 1fr;
  }
}
</style>
