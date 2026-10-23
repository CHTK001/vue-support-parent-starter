<script setup lang="ts">
/**
 * RemoteNodeView —— 远程节点：在线执行器节点看板
 *
 * 数据来自执行器注册上报（GET /v2/scheduler/nodes）：节点标识、角色、长链地址与处理器清单。
 * 本页同时读 /summary 与 /executors 拼出本地节点卡与处理器注册表；今日执行作业来自当日日志，
 * 处理器关联作业数来自台账分页。这些接口失败只降级相应区域，不影响整页渲染。
 *
 * 页面结构：页首事实卡 + 说明注脚（取数失败时另出一条失败条）→ 节点卡片网格
 * （远程执行器 / 本地节点）→ 接入新执行器条带
 * → 处理器注册表。（无页头/hero，直接进入内容）
 */
import { computed, onActivated, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReIcon from "@repo/ui/re-icon";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import type { ReTableColumn } from "@repo/ui/re-table";
import { getSummary, listExecutors, listNodes, pageJobLogs, pageJobs } from "../api/jobApi";
import type { JobExecutor, JobLog, JobNode, JobRuntime, JobSummary } from "../types/job";
import { errText } from "../composables/useCollectView";
import { fmtMs } from "../utils/time";
import { resolveHostPath } from "../utils/hostPath";

defineOptions({ name: "CollectRemoteNode" });

const router = useRouter();

const nodes = ref<JobNode[]>([]);
const executors = ref<JobExecutor[]>([]);
const summary = ref<JobSummary | null>(null);
const todayLogs = ref<JobLog[]>([]);
const jobs = ref<JobRuntime[]>([]);
const loading = ref(false);
const error = ref("");
const logError = ref("");
const jobError = ref("");
const logTruncated = ref(false);
const jobTruncated = ref(false);
const docVisible = ref(false);
const copied = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;

const LOG_PAGE_SIZE = 500;
const LOG_MAX_PAGES = 4;
const JOB_PAGE_SIZE = 500;
const JOB_MAX_PAGES = 20;

interface ProcessorRow {
  name: string;
  nodeLabel: string;
  tone: "remote" | "local";
  typeLabel: string;
  jobCount: number;
  status: "在线" | "空闲";
}

/** 今日 0 点的时间戳，驱动“今日执行作业”与当日分桶 */
function todayStart(): number {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function isDispatchLog(log: JobLog): boolean {
  const code = String(log.executeCode ?? "").toUpperCase();
  return code === "SUCCESS" || code === "FAILURE";
}

async function loadTodayLogs(): Promise<JobLog[]> {
  const all: JobLog[] = [];
  for (let pageNum = 1; pageNum <= LOG_MAX_PAGES; pageNum++) {
    const page = await pageJobLogs({ pageNum, pageSize: LOG_PAGE_SIZE, startTime: todayStart() });
    const rows = Array.isArray(page?.data) ? page.data : [];
    all.push(...rows);
    const total = Number(page?.total ?? 0);
    if (rows.length < LOG_PAGE_SIZE || all.length >= total) {
      break;
    }
    if (pageNum === LOG_MAX_PAGES) {
      logTruncated.value = true;
    }
  }
  return all;
}

async function loadJobs(): Promise<JobRuntime[]> {
  const all: JobRuntime[] = [];
  for (let pageNum = 1; pageNum <= JOB_MAX_PAGES; pageNum++) {
    const page = await pageJobs({ pageNum, pageSize: JOB_PAGE_SIZE });
    const rows = Array.isArray(page?.data) ? page.data : [];
    all.push(...rows);
    const total = Number(page?.total ?? 0);
    if (rows.length < JOB_PAGE_SIZE || all.length >= total) {
      break;
    }
    if (pageNum === JOB_MAX_PAGES) {
      jobTruncated.value = true;
    }
  }
  return all;
}

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  logError.value = "";
  jobError.value = "";
  logTruncated.value = false;
  jobTruncated.value = false;
  try {
    const [sum, nodeList, executorList] = await Promise.all([
      getSummary().catch((e) => {
        error.value = errText(e);
        return null as JobSummary | null;
      }),
      listNodes().catch((e) => {
        error.value = errText(e);
        return [] as JobNode[];
      }),
      listExecutors().catch((e) => {
        error.value = errText(e);
        return [] as JobExecutor[];
      }),
    ]);
    summary.value = sum;
    nodes.value = nodeList;
    executors.value = executorList;

    const [today, jobList] = await Promise.all([
      loadTodayLogs().catch(() => {
        logError.value = "今日执行记录取数失败，计数与趋势按已读数据展示";
        return [] as JobLog[];
      }),
      loadJobs().catch(() => {
        jobError.value = "处理器关联作业取数失败，关联数显示为 0";
        return [] as JobRuntime[];
      }),
    ]);
    todayLogs.value = today;
    jobs.value = jobList;
  } catch (e) {
    error.value = errText(e);
  } finally {
    loading.value = false;
  }
}

let firstActivate = true;
onMounted(load);
onActivated(() => {
  if (firstActivate) {
    firstActivate = false;
    return;
  }
  void load();
});
onBeforeUnmount(() => {
  if (copyTimer) {
    clearTimeout(copyTimer);
  }
});

/** 在线节点口径：远程执行器 + 当前调度节点 */
const remoteCount = computed(() => nodes.value.length);

const localHandlers = computed(() => [
  ...new Set(executors.value.filter((item) => item.source !== "REMOTE").map((item) => item.name)),
]);

const todayDispatch = computed(() => todayLogs.value.filter(isDispatchLog).length);
const todayFailure = computed(() =>
  todayLogs.value.filter((log) => String(log.executeCode ?? "").toUpperCase() === "FAILURE").length,
);

/**
 * 页首事实项：原先写在一条横条的句子里（「……在线节点（远程 0 个），断开即消失……」），
 * 数值被说明文字夹在中间，扫一眼抓不到。拆成「标签 + 值」的小卡后，
 * 三个值横向等宽对齐，一眼能比大小。
 *
 * <p>「处理器注册」不列：下方注册表表头已经写了「共 N 个」，重复一遍只会让人怀疑两处口径不一致。</p>
 */
const nodeFacts = computed<{ label: string; value: string }[]>(() => [
  { label: "远程节点", value: `${remoteCount.value} 个` },
  { label: "本机处理器", value: `${localHandlers.value.length} 个` },
  { label: "今日派发", value: `${todayDispatch.value} 次` },
]);

function processorType(name: string, source: JobExecutor["source"]): string {
  if (name === "collect.self.check") {
    return "系统自检";
  }
  if (name.startsWith("collect-flow")) {
    return "流程";
  }
  if (/collect|github/i.test(name)) {
    return "采集";
  }
  if (/sync|order/i.test(name)) {
    return "同步";
  }
  if (/log/i.test(name)) {
    return "日志";
  }
  return source === "REMOTE" ? "远程" : "处理器";
}

function remoteNodeName(node: JobNode): string {
  return node.nodeId || node.clientId;
}

/** 处理器注册表：本地处理器 + 远程上报处理器，按远端在前、本机在后排序 */
const processorRows = computed<ProcessorRow[]>(() => {
  const jobCounts = new Map<string, number>();
  for (const job of jobs.value) {
    const key = job.jobKey ?? "";
    if (key) {
      jobCounts.set(key, (jobCounts.get(key) ?? 0) + 1);
    }
  }
  const rows: ProcessorRow[] = [];
  const seen = new Set<string>();
  const nodeOf = (name: string) => nodes.value.find((node) => (node.handlers ?? []).includes(name));

  for (const item of executors.value) {
    if (seen.has(item.name)) {
      continue;
    }
    seen.add(item.name);
    const node = nodeOf(item.name);
    const isRemote = item.source === "REMOTE" || Boolean(node);
    const jobCount = jobCounts.get(item.name) ?? 0;
    rows.push({
      name: item.name,
      nodeLabel: node
        ? `${remoteNodeName(node)} 远程`
        : `${summary.value?.nodeId || "本节点"} 本地`,
      tone: isRemote ? "remote" : "local",
      typeLabel: processorType(item.name, item.source),
      jobCount,
      status: jobCount > 0 ? "在线" : "空闲",
    });
  }

  for (const node of nodes.value) {
    for (const name of node.handlers ?? []) {
      if (seen.has(name)) {
        continue;
      }
      seen.add(name);
      const jobCount = jobCounts.get(name) ?? 0;
      rows.push({
        name,
        nodeLabel: `${remoteNodeName(node)} 远程`,
        tone: "remote",
        typeLabel: processorType(name, "REMOTE"),
        jobCount,
        status: jobCount > 0 ? "在线" : "空闲",
      });
    }
  }

  return rows;
});

const processorSummary = computed(() => {
  const idle = processorRows.value.filter((row) => row.status === "空闲").length;
  return idle > 0 ? `${idle} 个空闲` : "全部在线";
});

function remoteRowsOf(node: JobNode): { label: string; value: string; mono?: boolean }[] {
  return [
    { label: "长链地址", value: node.serverUrl || "—", mono: true },
    { label: "客户端", value: node.clientId, mono: true },
    { label: "上线时间", value: fmtMs(node.registeredAt), mono: true },
    { label: "上报处理器", value: String(node.handlerCount ?? (node.handlers || []).length), mono: true },
  ];
}

const localCardRows = computed(() => {
  const s = summary.value;
  return [
    { label: "节点类型", value: "本地节点（内置）" },
    { label: "分组", value: s?.group || "—" },
    { label: "扫描节奏", value: s ? `${s.scanIntervalMs} ms · 预读 ${s.preReadMs} ms` : "—" },
    { label: "今日派发", value: `${todayDispatch.value} 次 · 失败 ${todayFailure.value}` },
    { label: "本机处理器", value: String(localHandlers.value.length) },
  ];
});

const localNodeId = computed(() => summary.value?.nodeId || "本节点");
const localRoleLabel = computed(() => {
  const s = summary.value;
  if (!s) {
    return "SCHEDULER";
  }
  return s.leader ? `${s.role ?? "SCHEDULER"} · Leader` : (s.role ?? "SCHEDULER");
});

const accessCommand = computed(() => {
  const server = nodes.value[0]?.serverUrl || "tcp://127.0.0.1:18081";
  return `dataflow executor \\
  --server ${server} \\
  --token dfx_********`;
});

async function copyExecutorCommand(): Promise<void> {
  try {
    await navigator.clipboard.writeText(accessCommand.value);
    copied.value = true;
    if (copyTimer) {
      clearTimeout(copyTimer);
    }
    copyTimer = setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    copied.value = false;
  }
}

function go(path: string): void {
  void router.push(resolveHostPath(router, path));
}

function createJob(handler?: string): void {
  const query: Record<string, string> = { create: "1" };
  if (handler) {
    query.task = handler;
  }
  void router.push({ path: resolveHostPath(router, "/collect/job"), query });
}

const processorColumns: ReTableColumn[] = [
  { prop: "name", label: "处理器名称", minWidth: 190, slot: "name", showOverflowTooltip: true },
  { prop: "nodeLabel", label: "所在节点", minWidth: 180, slot: "node", showOverflowTooltip: true },
  { prop: "typeLabel", label: "类型", width: 100 },
  { prop: "jobCount", label: "关联作业", width: 100, align: "right" },
  { prop: "status", label: "状态", width: 90, slot: "status" },
];
</script>

<template>
  <div v-loading="loading" class="node-page">
    <!--
      概览事实：小卡片。原先是一条蓝底横条，把「远程 0 个」这个事实和
      「断开即消失 / 点标签建作业」这段说明挤在同一行里，事实反而最不显眼。
      现在数值单独成卡，说明降级为一行无底色注脚 —— 页面第一眼是数据，不是横幅。
    -->
    <div class="node-facts">
      <div v-for="fact in nodeFacts" :key="fact.label" class="node-fact">
        <span class="node-fact__label">{{ fact.label }}</span>
        <span class="node-fact__value">{{ fact.value }}</span>
      </div>
    </div>

    <p class="node-hint">
      <ReIcon name="Connection" :size="13" class="node-hint__icon" />
      <span>节点由执行器注册上报，断开即消失；点处理器标签可就地为它建一条调度作业。</span>
      <button v-if="nodes.length" type="button" class="node-hint__more" @click="go('/collect/job')">
        去调度作业 <ReIcon name="Right" :size="12" />
      </button>
    </p>

    <div v-if="error" class="node-banner node-banner--error">
      <ReIcon name="WarningFilled" :size="14" class="node-banner__error-icon" />
      <span>{{ error }}</span>
      <ReButton class="node-banner__retry" text size="small" @click="load">重试</ReButton>
    </div>

    <!-- 节点卡片网格 -->
    <div class="node-grid">
      <article v-for="node in nodes" :key="node.clientId" class="node-card node-card--remote">
        <header class="node-card__head">
          <div class="node-card__id">
            <span class="node-card__title" :title="remoteNodeName(node)">{{ remoteNodeName(node) }}</span>
            <span class="node-card__sub" :title="node.clientId">{{ node.clientId }}</span>
          </div>
          <div class="node-card__badges">
            <ReTag type="success" effect="plain" dot size="small">在线</ReTag>
            <ReTag type="info" effect="plain" size="small">{{ node.role || "EXECUTOR" }}</ReTag>
          </div>
        </header>

        <dl class="node-card__meta">
          <template v-for="row in remoteRowsOf(node)" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd :class="{ 'is-mono': row.mono }" :title="row.value">{{ row.value }}</dd>
          </template>
        </dl>

        <div v-if="(node.handlers || []).length" class="node-card__handlers">
          <ReTag
            v-for="handler in node.handlers"
            :key="handler"
            class="node-handler"
            role="button"
            tabindex="0"
            effect="plain"
            size="small"
            title="点击创建调度作业"
            @click="createJob(handler)"
            @keydown.enter.space="createJob(handler)"
          >
            {{ handler }}
          </ReTag>
        </div>
        <span v-else class="node-card__none">该节点未上报处理器</span>

        <footer class="node-card__foot">
          <ReButton
            type="primary"
            icon="Plus"
            :disabled="!(node.handlers || []).length"
            @click="createJob(node.handlers?.[0])"
          >
            创建调度作业
          </ReButton>
          <ReButton text @click="docVisible = true">接入文档</ReButton>
        </footer>
      </article>

      <article v-if="summary" class="node-card node-card--local">
        <header class="node-card__head">
          <div class="node-card__id">
            <span class="node-card__title" :title="localNodeId">{{ localNodeId }}</span>
            <span class="node-card__sub">{{ localRoleLabel }}</span>
          </div>
          <div class="node-card__badges">
            <ReTag type="success" effect="plain" dot size="small">在线</ReTag>
            <ReTag type="info" effect="plain" size="small">{{ localRoleLabel }}</ReTag>
          </div>
        </header>

        <dl class="node-card__meta">
          <template v-for="row in localCardRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </template>
        </dl>

        <div v-if="localHandlers.length" class="node-card__handlers">
          <ReTag
            v-for="handler in localHandlers"
            :key="handler"
            class="node-handler"
            role="button"
            tabindex="0"
            effect="plain"
            size="small"
            title="点击创建调度作业"
            @click="createJob(handler)"
            @keydown.enter.space="createJob(handler)"
          >
            {{ handler }}
          </ReTag>
        </div>
        <span v-else class="node-card__none">本机暂无已注册处理器</span>

        <footer class="node-card__foot">
          <ReButton type="success" icon="DataAnalysis" @click="go('/collect/job-overview')">
            调度总览
          </ReButton>
          <ReButton text @click="go('/collect/job')">调度作业</ReButton>
        </footer>
      </article>
    </div>

    <!--
      接入新执行器：横向条带，独立于上方节点网格。
      原来它是网格里的一张卡，与节点卡同排（align-items: stretch），
      于是它那 34px 图标 + 三行说明 + 命令块撑出的高度被摊到同排节点卡上，
      节点卡底部空出一大片。现在移出网格，节点卡只跟同构的节点卡比高度。
    -->
    <section class="node-access">
      <span class="node-access__icon">
        <ReIcon name="UploadFilled" :size="18" />
      </span>
      <div class="node-access__lead">
        <h3>接入新执行器</h3>
        <p>在另一台机器启动 Executor，凭接入令牌通过长链注册，即可远程下发作业。</p>
        <button type="button" class="node-access__link" @click="docVisible = true">
          查看接入文档 <ReIcon name="Right" :size="12" />
        </button>
      </div>
      <div class="node-access__code">
        <pre>{{ accessCommand }}</pre>
        <ReButton
          text
          size="small"
          type="primary"
          :icon="copied ? 'CircleCheck' : 'CopyDocument'"
          @click="copyExecutorCommand"
        >
          {{ copied ? "已复制" : "复制" }}
        </ReButton>
      </div>
    </section>

    <!-- 处理器注册表 -->
    <section class="node-registry">
      <header class="node-registry__head">
        <span class="node-registry__title">
          <ReIcon name="Cpu" :size="15" />
          <b>处理器注册表</b>
          <span class="node-registry__count">共 {{ processorRows.length }} 个 · {{ processorSummary }}</span>
        </span>
        <button type="button" class="node-registry__link" @click="go('/collect/job-log')">
          作业日志 <ReIcon name="Right" :size="12" />
        </button>
      </header>
      <div class="node-table">
        <ReTable
          :data="processorRows as unknown as Record<string, unknown>[]"
          :columns="processorColumns"
          row-key="name"
          :layout-table="{ minHeight: 0 }"
          empty-text="没有已注册处理器"
          :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
        >
          <template #name="{ row }">
            <span class="node-cell-mono">{{ row.name }}</span>
          </template>
          <template #node="{ row }">
            <span class="node-node-cell">
              <ReTag :type="row.tone === 'remote' ? 'primary' : 'success'" effect="plain" size="small">
                {{ row.tone === "remote" ? "远程" : "本地" }}
              </ReTag>
              <span>{{ row.nodeLabel }}</span>
            </span>
          </template>
          <template #status="{ row }">
            <ReTag :type="row.status === '在线' ? 'success' : 'info'" effect="plain" dot size="small">
              {{ row.status }}
            </ReTag>
          </template>
        </ReTable>
      </div>
      <p v-if="logError || jobError" class="node-registry__note">{{ logError || jobError }}</p>
      <p v-if="jobTruncated" class="node-registry__note">处理器关联作业超过已读台账上限，关联数按已读部分统计。</p>
    </section>

    <!-- 接入文档弹层 -->
    <ReDialog v-model="docVisible" title="执行器接入（job-starter）" width="860px" top="6vh" footer-hidden>
      <div class="node-doc">
        <div class="node-doc__block node-doc__block--dep">
          <h4 class="node-doc__h">依赖</h4>
          <p class="node-doc__lead">
            本页数据来自 <code>spring-support-job-starter</code> 的长链注册表
            （<code>com.chua.starter.job.support.sync.RemoteHandlerRegistry</code>），执行器注册上报由
            <code>ExecutorSyncBinder</code> 写、<code>SchedulerSyncBinder</code> 读。
            应用必须引入该 starter 并打开治理出口，否则 <code>/v2/scheduler/nodes</code> 根本不装配。
            该注册表只存在于调度中心进程内存，单机（SINGLE）与执行器（EXECUTOR）角色下恒为空。
          </p>
        </div>

        <h4 class="node-doc__h">调度中心（role=SCHEDULER）</h4>
        <pre class="node-doc__code"><code>plugin.job.role=SCHEDULER
plugin.job.manage.enable=true
plugin.job.sync.scheduler.listen-host=0.0.0.0
plugin.job.sync.scheduler.listen-port=18081
plugin.job.sync.scheduler.protocol=tcp</code></pre>

        <h4 class="node-doc__h">执行器（role=EXECUTOR）</h4>
        <pre class="node-doc__code"><code>plugin.job.role=EXECUTOR
plugin.job.sync.executor.server-url=tcp://调度中心地址:18081</code></pre>

        <h4 class="node-doc__h">plugin.job 配置项（JobProperties）</h4>
        <div class="node-doc__table-wrap">
          <table class="node-doc__table">
            <thead>
              <tr><th>配置项</th><th>默认值</th><th>说明</th></tr>
            </thead>
            <tbody>
              <tr><td><code>enable</code></td><td><code>true</code></td><td>模块总开关，关掉不装配任何调度 bean</td></tr>
              <tr><td><code>role</code></td><td><code>SINGLE</code></td><td>进程角色：SCHEDULER / EXECUTOR / SINGLE</td></tr>
              <tr><td><code>node-id</code></td><td><code>空</code></td><td>节点标识，留空按 主机名-pid 推导</td></tr>
              <tr><td><code>cluster.group</code></td><td><code>default</code></td><td>选主命名空间，同组内 Leader 唯一</td></tr>
              <tr><td><code>cluster.scan-interval-ms</code></td><td><code>1000</code></td><td>Leader 扫描间隔</td></tr>
              <tr><td><code>cluster.pre-read-ms</code></td><td><code>5000</code></td><td>预读时间窗</td></tr>
              <tr><td><code>cluster.lease-seconds</code></td><td><code>15</code></td><td>Leader 租约时长</td></tr>
              <tr><td><code>sync.in-memory</code></td><td><code>false</code></td><td>置 true 直接拒绝启动，不提供内存伪实现</td></tr>
              <tr class="is-key"><td><code>sync.scheduler.listen-host</code></td><td><code>0.0.0.0</code></td><td>调度中心长链监听地址</td></tr>
              <tr class="is-key"><td><code>sync.scheduler.listen-port</code></td><td><code>8081</code></td><td>调度中心长链监听端口</td></tr>
              <tr class="is-key"><td><code>sync.scheduler.protocol</code></td><td><code>tcp</code></td><td>长链协议，须与执行器 server-url 的 scheme 一致</td></tr>
              <tr class="is-key"><td><code>sync.executor.server-url</code></td><td><code>空</code></td><td>调度中心长链 URL，如 tcp://10.0.0.11:18081</td></tr>
              <tr><td><code>sync.executor.reconnect-base-ms</code></td><td><code>500</code></td><td>保留字段，当前实现未读取（重连为固定 5s 轮询）</td></tr>
              <tr><td><code>sync.executor.reconnect-max-ms</code></td><td><code>30000</code></td><td>保留字段，当前实现未读取</td></tr>
              <tr><td><code>pool.virtual</code></td><td><code>true</code></td><td>虚拟线程执行器；关掉回退平台线程池</td></tr>
              <tr><td><code>pool.core-size</code></td><td><code>16</code></td><td>平台线程池核心数（virtual=false 时生效）</td></tr>
              <tr><td><code>pool.max-size</code></td><td><code>64</code></td><td>平台线程池最大数</td></tr>
              <tr><td><code>pool.queue-size</code></td><td><code>128</code></td><td>平台线程池队列容量</td></tr>
              <tr><td><code>log.enabled</code></td><td><code>false</code></td><td>作业日志文件落盘开关</td></tr>
              <tr><td><code>log.base-path</code></td><td><code>./logs/job</code></td><td>日志根目录</td></tr>
              <tr><td><code>log.async</code></td><td><code>true</code></td><td>异步写入</td></tr>
              <tr><td><code>log.queue-size</code></td><td><code>4096</code></td><td>异步队列容量</td></tr>
              <tr><td><code>log.cleanup-enabled</code></td><td><code>false</code></td><td>日志自动清理开关</td></tr>
              <tr><td><code>log.cleanup-retention-days</code></td><td><code>30</code></td><td>日志保留天数</td></tr>
              <tr><td><code>log.cleanup-cron</code></td><td><code>0 0 0 * * ?</code></td><td>清理定时 cron</td></tr>
              <tr class="is-key"><td><code>manage.enable</code></td><td><code>false</code></td><td>装配 /v2/job/** 与 /v2/scheduler/** 治理出口</td></tr>
            </tbody>
          </table>
        </div>

        <ul class="node-doc__notes">
          <li>高亮的四行是让本页有数据的最小集合：调度中心开监听 + 治理出口，执行器指对地址。</li>
          <li>协议两端必须一致：<code>sync.scheduler.protocol</code> 与 <code>server-url</code> 的 scheme 不一致时，
            执行器连得上却注册不上，本页恒为空。</li>
          <li>执行器启动后 5 秒内上报一次，之后每 30 秒重连并续报，断开即从本页消失。</li>
          <li>本页数据只在调度中心进程内存，调度中心重启后由执行器重连自动补齐。</li>
        </ul>
      </div>
    </ReDialog>
  </div>
</template>

<style scoped>
/* 页面底：koi 令牌 + 宿主页色的兜底 */
.node-page {
  display: flex;
  flex-direction: column;
  gap: var(--cc-gap, 14px);
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
  background: var(--el-bg-color-page);
}

/* ============ 页首事实卡 ============ */
/*
 * 与节点卡同一套外壳令牌（--bg-container / --border-subtle / --radius-lg / --shadow-sm），
 * 只是内距更小、信息密度更低，与调度概览页的「状态卡」也是同一套语汇。
 * auto-fill 而非 auto-fit：卡片数固定三项，auto-fit 会把三张平分整行拉到近 390px，
 * 两个短词撑不满；auto-fill 保留空轨道，卡宽稳定在 200~290px。
 */
.node-facts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--cc-gap, 12px);
}

.node-fact {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  padding: 9px 14px;
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter));
  border-radius: var(--radius-lg, 12px);
  background: var(--bg-container, var(--el-bg-color, #ffffff));
  box-shadow: var(--shadow-sm, var(--el-box-shadow-lighter));
}

.node-fact__label {
  color: var(--text-tertiary, var(--el-text-color-secondary));
  font-size: 11.5px;
  line-height: 1.4;
}

/* 值都是「N 个 / N 次」这类短值，不换行：换行会把卡片撑散、破坏横向对齐 */
.node-fact__value {
  overflow: hidden;
  color: var(--text-primary, var(--el-text-color-primary));
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 说明注脚：刻意不给底色、不给边框。横幅已经拆成事实卡，
   这句只是补充读法，做成一行灰字就够了，再加个容器又变回原来那条横杠 */
.node-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 0 2px;
  color: var(--text-tertiary, var(--el-text-color-secondary));
  font-size: 12px;
  line-height: 1.6;
}

.node-hint__icon {
  flex: none;
  color: var(--text-tertiary, var(--el-text-color-secondary));
}

.node-hint__more {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex: none;
  margin-left: auto;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  color: var(--brand-500, var(--el-color-primary));
  white-space: nowrap;
}

.node-hint__more:hover {
  color: var(--brand-600, var(--el-color-primary));
  text-decoration: underline;
}

/* ============ 失败条 ============ */
/* 只剩失败态在用：取数失败要显眼，必须有底色，与上面刻意无底的说明注脚正好相反 */
.node-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--radius-md, 8px);
  border: 1px solid transparent;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--text-secondary, var(--el-text-color-regular));
}

.node-banner--error {
  background: color-mix(in srgb, var(--status-error, var(--el-color-danger)) 8%, var(--bg-container, var(--el-bg-color, #ffffff)));
  border-color: color-mix(in srgb, var(--status-error, var(--el-color-danger)) 25%, transparent);
  color: var(--status-error, var(--el-color-danger));
}

.node-banner__error-icon {
  flex: none;
}

.node-banner__retry {
  margin-left: auto;
}

/* ============ 节点卡片网格 ============ */
/*
 * auto-fill 而不是 auto-fit：节点数量是运行时决定的（本机 SINGLE 档恒为 1 个本地节点，
 * 远程执行器常常一个都没有）。auto-fit 会把空轨道折叠掉，剩下的卡片平分整行 —— 只有
 * 两张卡时每张能撑到 580px 上下，卡片里只有两行标签加几个小标签，稀疏得像块广告牌。
 * auto-fill 保留空轨道，卡宽稳定在 240~290px，节点多了自然往右排。
 */
.node-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--cc-gap, 12px);
  align-items: stretch;
}

@media (max-width: 1180px) {
  .node-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .node-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.node-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter));
  border-radius: var(--radius-lg, 12px);
  background: var(--bg-container, var(--el-bg-color, #ffffff));
  box-shadow: var(--shadow-sm, var(--el-box-shadow-lighter));
}

.node-card--remote {
  border-top: 3px solid var(--brand-500, var(--el-color-primary));
}

.node-card--local {
  border-top: 3px solid var(--status-success, var(--el-color-success));
}

.node-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.node-card__id {
  min-width: 0;
}

.node-card__title {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, var(--el-text-color-primary));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-card__sub {
  display: block;
  margin-top: 2px;
  max-width: 220px;
  font-size: 11.5px;
  color: var(--text-tertiary, var(--el-text-color-secondary));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-card__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}

/* 标签列压到 72px：四项都是四字标签（长链地址 / 客户端 / 上线时间 / 上报处理器），
   原先 92px 白占掉近三分之一卡宽，把值挤到右边一小条 */
.node-card__meta {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 5px 8px;
  margin: 0;
  font-size: 12.5px;
}

.node-card__meta dt {
  color: var(--text-tertiary, var(--el-text-color-secondary));
}

.node-card__meta dd {
  min-width: 0;
  margin: 0;
  color: var(--text-primary, var(--el-text-color-primary));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-card__meta dd.is-mono {
  font-family: var(--cc-font-num, ui-monospace, "Cascadia Mono", Consolas, monospace);
  font-variant-numeric: tabular-nums;
}

.node-card__handlers {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 84px;
  overflow: auto;
  padding: 2px 0;
}

.node-handler {
  cursor: pointer;
  outline: none;
  transition:
    border-color var(--cc-duration, 180ms) var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1)),
    color var(--cc-duration, 180ms) var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1));
}

.node-handler:hover {
  border-color: var(--brand-500, var(--el-color-primary));
  color: var(--brand-500, var(--el-color-primary));
}

.node-handler:focus-visible {
  box-shadow: var(--focus-ring, 0 0 0 3px color-mix(in srgb, var(--brand-500, var(--el-color-primary)) 18%, transparent));
}

.node-card__none {
  color: var(--text-tertiary, var(--el-text-color-secondary));
  font-size: 12.5px;
}

.node-card__foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

/* ============ 接入新执行器 ============ */
/* 横向条带：图标 + 文案在左，命令块在右，整体压到一行高，不与节点卡争版面 */
.node-access {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border: 1px dashed var(--border-default, var(--el-border-color));
  border-radius: var(--radius-lg, 12px);
  background: var(--bg-elevated, var(--el-bg-color-overlay));
}

.node-access__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md, 8px);
  color: var(--brand-500, var(--el-color-primary));
  background: color-mix(in srgb, var(--brand-500, var(--el-color-primary)) 12%, transparent);
}

.node-access__lead {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1 1 auto;
  min-width: 0;
}

.node-access h3 {
  margin: 0;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary, var(--el-text-color-primary));
}

.node-access p {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary, var(--el-text-color-regular));
}

.node-access__code {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 1 auto;
  width: min(440px, 42%);
  padding: 8px 10px;
  border-radius: var(--radius-md, 8px);
  background: var(--terminal-bg, #0d1117);
  color: var(--text-inverse, #f2f4f8);
  overflow: hidden;
}

.node-access__code pre {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-family: var(--cc-font-num, ui-monospace, "Cascadia Mono", Consolas, monospace);
  font-size: 11.5px;
  line-height: 1.6;
}

.node-access__link {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  color: var(--brand-500, var(--el-color-primary));
  white-space: nowrap;
}

/* 窄屏：命令块换行到下一行占满宽度，否则 440px 挤掉左侧文案 */
@media (max-width: 900px) {
  .node-access {
    flex-wrap: wrap;
  }

  .node-access__code {
    width: 100%;
  }
}

/* ============ 处理器注册表 ============ */
.node-registry {
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter));
  border-radius: var(--radius-lg, 12px);
  background: var(--bg-container, var(--el-bg-color, #ffffff));
  box-shadow: var(--shadow-sm, var(--el-box-shadow-lighter));
  overflow: hidden;
}

.node-registry__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-subtle, var(--el-border-color-lighter));
  flex-wrap: wrap;
}

.node-registry__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-primary, var(--el-text-color-primary));
}

.node-registry__title b {
  font-weight: 600;
}

.node-registry__count {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-tertiary, var(--el-text-color-secondary));
}

.node-registry__link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  color: var(--brand-500, var(--el-color-primary));
  white-space: nowrap;
}

.node-registry__link:hover {
  color: var(--brand-600, var(--el-color-primary));
  text-decoration: underline;
}

.node-table {
  padding: 0 12px 10px;
}

/* ReTable 自带卡片外壳，页面已有一层壳，这里拆掉避免双边框 */
.node-table :deep(.re-table) {
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.node-registry__note {
  margin: 0 16px 10px;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--text-tertiary, var(--el-text-color-secondary));
}

.node-cell-mono {
  font-family: var(--cc-font-num, ui-monospace, "Cascadia Mono", Consolas, monospace);
  font-size: 12.5px;
  color: var(--text-primary, var(--el-text-color-primary));
}

.node-node-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
}

.node-node-cell > span:last-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ============ 接入文档 ============ */
.node-doc {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 100%;
  overflow: auto;
}

.node-doc__h {
  margin: 0;
  color: var(--text-primary, var(--el-text-color-primary));
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
}

.node-doc__block--dep {
  padding: 12px 14px 12px 16px;
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter));
  border-left: 3px solid var(--brand-500, var(--el-color-primary));
  border-radius: var(--radius-md, 8px);
  background: var(--bg-fill, var(--el-fill-color-lighter));
}

.node-doc__block--dep .node-doc__h {
  margin-bottom: 6px;
}

.node-doc__lead {
  margin: 0;
  color: var(--text-secondary, var(--el-text-color-regular));
  font-size: 13.5px;
  line-height: 1.8;
}

.node-doc__code {
  margin: 0;
  padding: 12px 14px;
  border-radius: var(--radius-md, 8px);
  background: var(--terminal-bg, #0d1117);
  color: var(--text-inverse, #f2f4f8);
  font-family: var(--cc-font-num, ui-monospace, "Cascadia Mono", Consolas, monospace);
  font-size: 12.5px;
  line-height: 1.9;
  overflow-x: auto;
  white-space: pre;
}

.node-doc__table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter));
  border-radius: var(--radius-md, 8px);
}

.node-doc__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.node-doc__table th,
.node-doc__table td {
  padding: 8px 12px;
  text-align: left;
  vertical-align: top;
  white-space: nowrap;
  border-bottom: 1px solid var(--border-subtle, var(--el-border-color-lighter));
}

.node-doc__table th {
  position: sticky;
  top: 0;
  background: var(--bg-fill, var(--el-fill-color-light));
  color: var(--text-primary, var(--el-text-color-primary));
  font-weight: 600;
}

.node-doc__table td {
  color: var(--text-secondary, var(--el-text-color-regular));
}

.node-doc__table th:nth-child(1),
.node-doc__table td:nth-child(1) {
  width: 1%;
}

.node-doc__table th:nth-child(2),
.node-doc__table td:nth-child(2) {
  width: 1%;
}

.node-doc__table td:nth-child(3) {
  white-space: normal;
  min-width: 240px;
}

.node-doc__table tr.is-key td {
  background: color-mix(in srgb, var(--brand-500, var(--el-color-primary)) 8%, transparent);
}

.node-doc__table tr:last-child td {
  border-bottom: 0;
}

.node-doc__table code {
  padding: 1px 6px;
  border-radius: var(--radius-sm, 6px);
  background: var(--bg-fill, var(--el-fill-color));
  color: var(--text-primary, var(--el-text-color-primary));
  font-family: var(--cc-font-num, ui-monospace, "Cascadia Mono", Consolas, monospace);
  font-size: 12.5px;
}

.node-doc__notes {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding-left: 20px;
  color: var(--text-tertiary, var(--el-text-color-secondary));
  font-size: 13px;
  line-height: 1.8;
}

.node-doc__notes code {
  padding: 1px 5px;
  border-radius: var(--radius-sm, 6px);
  background: var(--bg-fill, var(--el-fill-color));
  color: var(--text-primary, var(--el-text-color-primary));
  font-family: var(--cc-font-num, ui-monospace, "Cascadia Mono", Consolas, monospace);
  font-size: 12px;
}

/* 尊重系统「减少动态效果」偏好：把本页的过渡全部关掉 */
@media (prefers-reduced-motion: reduce) {
  .node-card,
  .node-handler {
    transition: none;
  }
}
</style>