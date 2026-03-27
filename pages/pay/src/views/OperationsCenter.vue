<template>
  <section class="view">
    <div class="hero-grid">
      <article class="hero-card hero-card--focus">
        <p>运营中心</p>
        <strong>{{ callbackAudits.length }}</strong>
        <span>当前主线支付的回调策略和任务调度都在这里集中可见、可改、可触发。</span>
      </article>
      <article class="hero-card">
        <p>严格 scoped 回调</p>
        <strong>{{ strictScopedCount }}</strong>
        <span>默认生成且不会被固定地址覆盖的回调数量。</span>
      </article>
      <article class="hero-card">
        <p>启用中的任务</p>
        <strong>{{ enabledTaskCount }}</strong>
        <span>可运行时调整 cron、启停和手动触发。</span>
      </article>
      <article class="hero-card">
        <p>待处理异常</p>
        <strong>{{ pendingNotifyErrorCount }}</strong>
        <span>回调异常支持管理台快速重试。</span>
      </article>
    </div>

    <el-card class="panel shell-card" shadow="never">
      <template #header>
        <div class="panel__header">
          <div>
            <p class="panel__eyebrow">Operations Center</p>
            <h3>支付运营诊断与调度中心</h3>
          </div>
          <el-button text @click="loadAll">刷新全部</el-button>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="ops-tabs">
        <el-tab-pane label="回调诊断" name="diagnostics">
          <div class="diagnostics-grid">
            <el-card class="sub-panel" shadow="never">
              <template #header>
                <div class="sub-panel__header">
                  <div>
                    <p class="panel__eyebrow">Callback Audit</p>
                    <h4>回调动态拼接审计</h4>
                  </div>
                </div>
              </template>

              <el-table :data="callbackAudits" border class="table">
                <el-table-column prop="callbackName" label="回调类型" width="160" />
                <el-table-column prop="recommendedPattern" label="推荐路径" min-width="260" />
                <el-table-column prop="scopedIdentifier" label="绑定业务号" width="120" />
                <el-table-column label="严格 scoped" width="120">
                  <template #default="{ row }">
                    <el-tag :type="row.strictScoped ? 'success' : 'warning'">
                      {{ row.strictScoped ? "是" : "否" }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="effectivePriority" label="实际优先级" min-width="260" show-overflow-tooltip />
                <el-table-column prop="notes" label="结论" min-width="280" show-overflow-tooltip />
              </el-table>
            </el-card>

            <el-card class="sub-panel" shadow="never">
              <template #header>
                <div class="sub-panel__header">
                  <div>
                    <p class="panel__eyebrow">Order Numbering</p>
                    <h4>订单编号处理策略</h4>
                  </div>
                </div>
              </template>

              <div class="strategy-list">
                <article v-for="item in orderStrategies" :key="item.businessType" class="strategy-card">
                  <span class="strategy-card__tag">{{ item.businessType }}</span>
                  <h5>{{ item.fieldName }}</h5>
                  <p>{{ item.generationRule }}</p>
                  <p><strong>调用方覆盖：</strong>{{ item.callerOverrideField }}</p>
                  <p><strong>幂等规则：</strong>{{ item.idempotentRule }}</p>
                  <p><strong>补充说明：</strong>{{ item.notes }}</p>
                </article>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <el-tab-pane label="调度任务" name="scheduler">
          <el-card class="sub-panel" shadow="never">
            <template #header>
              <div class="sub-panel__header">
                <div>
                  <p class="panel__eyebrow">Dynamic Scheduler</p>
                  <h4>运行时任务调度</h4>
                </div>
              </div>
            </template>

            <el-table :data="schedulerTasks" border class="table">
              <el-table-column prop="taskName" label="任务" width="160" />
              <el-table-column prop="description" label="说明" min-width="220" show-overflow-tooltip />
              <el-table-column label="Cron 表达式" min-width="220">
                <template #default="{ row }">
                  <el-input v-model="schedulerDrafts[row.taskKey].cronExpression" placeholder="请输入 cron" />
                </template>
              </el-table-column>
              <el-table-column label="启用" width="100">
                <template #default="{ row }">
                  <el-switch v-model="schedulerDrafts[row.taskKey].enabled" />
                </template>
              </el-table-column>
              <el-table-column label="已调度" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.scheduled ? 'success' : 'info'">{{ row.scheduled ? "运行中" : "已停止" }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="nextExecutionTime" label="下次执行" width="180" />
              <el-table-column label="最近结果" width="120">
                <template #default="{ row }">
                  <el-tag :type="taskStatusType(row.lastRunStatus)">{{ SchedulerRunStatusMap[row.lastRunStatus || ""] || row.lastRunStatus || "-" }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="lastRunMessage" label="最近消息" min-width="220" show-overflow-tooltip />
              <el-table-column label="操作" width="180" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" :loading="savingTaskKey === row.taskKey" @click="saveTask(row.taskKey)">
                    保存
                  </el-button>
                  <el-button link type="success" :loading="triggeringTaskKey === row.taskKey" @click="triggerTask(row.taskKey)">
                    立即执行
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="回调异常" name="notify">
          <div class="diagnostics-grid">
            <el-card class="sub-panel" shadow="never">
              <template #header>
                <div class="sub-panel__header">
                  <div>
                    <p class="panel__eyebrow">Notify Errors</p>
                    <h4>回调异常重试台</h4>
                  </div>
                </div>
              </template>

              <el-form :inline="true" :model="errorSearchForm" class="toolbar">
                <el-form-item label="通知类型">
                  <el-input v-model="errorSearchForm.notifyType" placeholder="如 WECHAT_PAY" clearable />
                </el-form-item>
                <el-form-item label="状态">
                  <el-input v-model="errorSearchForm.status" placeholder="如 PENDING" clearable />
                </el-form-item>
                <el-form-item label="订单号">
                  <el-input v-model="errorSearchForm.orderNo" placeholder="订单号" clearable />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="loadNotifyErrors(1)">查询</el-button>
                  <el-button @click="resetNotifyErrors">重置</el-button>
                </el-form-item>
              </el-form>

              <el-table :data="notifyErrors" v-loading="notifyErrorLoading" border class="table">
                <el-table-column prop="notifyType" label="通知类型" width="150" />
                <el-table-column prop="orderNo" label="订单号" min-width="180" />
                <el-table-column prop="refundNo" label="退款号" min-width="180" />
                <el-table-column prop="errorType" label="异常类型" width="140" />
                <el-table-column prop="errorMessage" label="异常信息" min-width="240" show-overflow-tooltip />
                <el-table-column label="重试进度" width="120">
                  <template #default="{ row }">
                    {{ row.retryCount || 0 }}/{{ row.maxRetryCount || 0 }}
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="120" />
                <el-table-column prop="nextRetryTime" label="下次重试" width="180" />
                <el-table-column label="操作" width="120" fixed="right">
                  <template #default="{ row }">
                    <el-button link type="danger" :loading="retryingErrorId === row.id" @click="retryError(row.id)">
                      立即重试
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>

              <el-pagination
                v-model:current-page="notifyErrorPagination.page"
                v-model:page-size="notifyErrorPagination.size"
                :total="notifyErrorPagination.total"
                :page-sizes="[5, 10, 20]"
                layout="total, sizes, prev, pager, next"
                class="pager"
                @current-change="loadNotifyErrors"
                @size-change="handleNotifyErrorSizeChange"
              />
            </el-card>

            <el-card class="sub-panel" shadow="never">
              <template #header>
                <div class="sub-panel__header">
                  <div>
                    <p class="panel__eyebrow">Notify Logs</p>
                    <h4>最近回调日志</h4>
                  </div>
                </div>
              </template>

              <el-form :inline="true" :model="logSearchForm" class="toolbar">
                <el-form-item label="通知类型">
                  <el-input v-model="logSearchForm.notifyType" placeholder="如 ALIPAY_PAY" clearable />
                </el-form-item>
                <el-form-item label="处理状态">
                  <el-input v-model="logSearchForm.processStatus" placeholder="如 SUCCESS" clearable />
                </el-form-item>
                <el-form-item label="订单号">
                  <el-input v-model="logSearchForm.orderNo" placeholder="订单号" clearable />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="loadNotifyLogs(1)">查询</el-button>
                  <el-button @click="resetNotifyLogs">重置</el-button>
                </el-form-item>
              </el-form>

              <el-table :data="notifyLogs" v-loading="notifyLogLoading" border class="table">
                <el-table-column prop="notifyType" label="通知类型" width="150" />
                <el-table-column prop="channelType" label="渠道" width="100" />
                <el-table-column prop="orderNo" label="订单号" min-width="180" />
                <el-table-column prop="refundNo" label="退款号" min-width="180" />
                <el-table-column prop="processStatus" label="处理状态" width="120" />
                <el-table-column prop="retryCount" label="重试次数" width="100" />
                <el-table-column prop="processResult" label="结果" min-width="220" show-overflow-tooltip />
                <el-table-column prop="receivedTime" label="接收时间" width="180" />
              </el-table>

              <el-pagination
                v-model:current-page="notifyLogPagination.page"
                v-model:page-size="notifyLogPagination.size"
                :total="notifyLogPagination.total"
                :page-sizes="[5, 10, 20]"
                layout="total, sizes, prev, pager, next"
                class="pager"
                @current-change="loadNotifyLogs"
                @size-change="handleNotifyLogSizeChange"
              />
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  getNotifyErrors,
  getNotifyLogs,
  getPaymentOpsOverview,
  getSchedulerTasks,
  retryNotifyError,
  triggerSchedulerTask,
  updateSchedulerTask,
} from "../api/payment";
import type {
  PaymentCallbackAudit,
  PaymentNotifyError,
  PaymentNotifyLog,
  PaymentOrderNumberStrategy,
  PaymentSchedulerTask,
} from "../types/payment";
import { SchedulerRunStatusMap } from "../types/payment";

const activeTab = ref("diagnostics");
const savingTaskKey = ref("");
const triggeringTaskKey = ref("");
const retryingErrorId = ref<number | null>(null);

const callbackAudits = ref<PaymentCallbackAudit[]>([]);
const orderStrategies = ref<PaymentOrderNumberStrategy[]>([]);
const schedulerTasks = ref<PaymentSchedulerTask[]>([]);
const notifyErrors = ref<PaymentNotifyError[]>([]);
const notifyLogs = ref<PaymentNotifyLog[]>([]);

const notifyErrorLoading = ref(false);
const notifyLogLoading = ref(false);

const schedulerDrafts = reactive<Record<string, { cronExpression: string; enabled: boolean }>>({});

const errorSearchForm = reactive({
  notifyType: "",
  status: "PENDING",
  orderNo: "",
});

const logSearchForm = reactive({
  notifyType: "",
  processStatus: "",
  orderNo: "",
});

const notifyErrorPagination = reactive({
  page: 1,
  size: 5,
  total: 0,
});

const notifyLogPagination = reactive({
  page: 1,
  size: 5,
  total: 0,
});

const strictScopedCount = computed(() => callbackAudits.value.filter((item) => item.strictScoped).length);
const enabledTaskCount = computed(() => schedulerTasks.value.filter((item) => item.enabled).length);
const pendingNotifyErrorCount = computed(() => notifyErrors.value.filter((item) => item.status === "PENDING").length);

async function loadOverview() {
  const res = await getPaymentOpsOverview();
  callbackAudits.value = res.data.callbackAudits || [];
  orderStrategies.value = res.data.orderNumberStrategies || [];
}

async function loadSchedulerTasks() {
  const res = await getSchedulerTasks();
  schedulerTasks.value = res.data;
  schedulerTasks.value.forEach((item) => {
    schedulerDrafts[item.taskKey] = {
      cronExpression: item.cronExpression,
      enabled: item.enabled,
    };
  });
}

async function saveTask(taskKey: string) {
  const draft = schedulerDrafts[taskKey];
  if (!draft) {
    return;
  }
  savingTaskKey.value = taskKey;
  try {
    await updateSchedulerTask(taskKey, draft);
    ElMessage.success("调度任务配置已更新");
    await loadSchedulerTasks();
  } finally {
    savingTaskKey.value = "";
  }
}

async function triggerTask(taskKey: string) {
  triggeringTaskKey.value = taskKey;
  try {
    await triggerSchedulerTask(taskKey);
    ElMessage.success("任务已触发");
    await loadSchedulerTasks();
    await loadNotifyErrors(notifyErrorPagination.page);
    await loadNotifyLogs(notifyLogPagination.page);
  } finally {
    triggeringTaskKey.value = "";
  }
}

async function loadNotifyErrors(page = notifyErrorPagination.page) {
  notifyErrorLoading.value = true;
  notifyErrorPagination.page = page;
  try {
    const res = await getNotifyErrors({
      pageNum: notifyErrorPagination.page,
      pageSize: notifyErrorPagination.size,
      notifyType: errorSearchForm.notifyType || undefined,
      status: errorSearchForm.status || undefined,
      orderNo: errorSearchForm.orderNo || undefined,
    });
    notifyErrors.value = res.data.records;
    notifyErrorPagination.total = res.data.total;
  } finally {
    notifyErrorLoading.value = false;
  }
}

async function loadNotifyLogs(page = notifyLogPagination.page) {
  notifyLogLoading.value = true;
  notifyLogPagination.page = page;
  try {
    const res = await getNotifyLogs({
      pageNum: notifyLogPagination.page,
      pageSize: notifyLogPagination.size,
      notifyType: logSearchForm.notifyType || undefined,
      processStatus: logSearchForm.processStatus || undefined,
      orderNo: logSearchForm.orderNo || undefined,
    });
    notifyLogs.value = res.data.records;
    notifyLogPagination.total = res.data.total;
  } finally {
    notifyLogLoading.value = false;
  }
}

async function retryError(id: number) {
  retryingErrorId.value = id;
  try {
    await retryNotifyError(id);
    ElMessage.success("回调异常已发起重试");
    await Promise.all([loadNotifyErrors(notifyErrorPagination.page), loadNotifyLogs(notifyLogPagination.page)]);
  } finally {
    retryingErrorId.value = null;
  }
}

async function loadAll() {
  await Promise.all([
    loadOverview(),
    loadSchedulerTasks(),
    loadNotifyErrors(),
    loadNotifyLogs(),
  ]);
}

function resetNotifyErrors() {
  errorSearchForm.notifyType = "";
  errorSearchForm.status = "PENDING";
  errorSearchForm.orderNo = "";
  loadNotifyErrors(1);
}

function resetNotifyLogs() {
  logSearchForm.notifyType = "";
  logSearchForm.processStatus = "";
  logSearchForm.orderNo = "";
  loadNotifyLogs(1);
}

function handleNotifyErrorSizeChange(size: number) {
  notifyErrorPagination.size = size;
  loadNotifyErrors(1);
}

function handleNotifyLogSizeChange(size: number) {
  notifyLogPagination.size = size;
  loadNotifyLogs(1);
}

function taskStatusType(status?: string) {
  if (status === "SUCCESS") {
    return "success";
  }
  if (status === "FAILED") {
    return "danger";
  }
  if (status === "RUNNING") {
    return "warning";
  }
  return "info";
}

onMounted(loadAll);
</script>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1.4fr repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.hero-card,
.panel,
.sub-panel {
  border: none;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(58, 39, 24, 0.08);
}

.hero-card {
  padding: 20px 22px;
  background: linear-gradient(160deg, rgba(255, 247, 236, 0.96) 0%, rgba(255, 255, 255, 0.92) 100%);
}

.hero-card--focus {
  background:
    radial-gradient(circle at top right, rgba(208, 154, 88, 0.3), transparent 32%),
    linear-gradient(140deg, #221710 0%, #4c301d 52%, #a8672d 100%);
  color: #f7efe3;
}

.hero-card p,
.hero-card span {
  margin: 0;
}

.hero-card p {
  color: #8e6945;
}

.hero-card--focus p,
.hero-card--focus span,
.hero-card--focus strong {
  color: #f7efe3;
}

.hero-card strong {
  display: block;
  margin: 10px 0 12px;
  font-size: 34px;
  color: #291b12;
}

.hero-card span {
  line-height: 1.7;
  color: #705847;
}

.shell-card {
  background:
    linear-gradient(180deg, rgba(255, 251, 244, 0.96) 0%, rgba(255, 248, 239, 0.9) 100%);
}

.panel__header,
.sub-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.panel__eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #c18244;
}

.panel__header h3,
.sub-panel__header h4 {
  margin: 0;
  font-family: "STZhongsong", "Noto Serif SC", Georgia, serif;
}

.panel__header h3 {
  font-size: 26px;
}

.sub-panel__header h4 {
  font-size: 22px;
}

.ops-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: rgba(131, 95, 62, 0.12);
}

.ops-tabs :deep(.el-tabs__item) {
  height: 42px;
  font-weight: 600;
}

.diagnostics-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.strategy-list {
  display: grid;
  gap: 14px;
}

.strategy-card {
  padding: 18px 20px;
  border-radius: 20px;
  background:
    linear-gradient(150deg, rgba(255, 255, 255, 0.95) 0%, rgba(246, 235, 220, 0.94) 100%);
  border: 1px solid rgba(132, 91, 52, 0.08);
}

.strategy-card__tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(191, 132, 69, 0.12);
  color: #8a5421;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.strategy-card h5 {
  margin: 12px 0;
  font-size: 20px;
  color: #27180f;
}

.strategy-card p {
  margin: 8px 0 0;
  line-height: 1.75;
  color: #6e5946;
}

.table {
  border-radius: 18px;
  overflow: hidden;
}

.toolbar {
  margin-bottom: 18px;
}

.pager {
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1320px) {
  .hero-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1080px) {
  .diagnostics-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }
}
</style>
