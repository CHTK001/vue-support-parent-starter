<!--
  性能剖析（Profile）—— 对齐 SkyWalking 的 Profile 页面。

  SkyWalking 的剖析是「按需采样」而不是常开：
    1. 先对某个服务的某个端点开一个任务（多慢才采、采多久、最多采几次）；
    2. agent 命中阈值的请求会抓线程栈；
    3. 任务结束后把多段采样交给 OAP 做树形聚合，得到「时间花在哪个栈帧」。

  因此本页是三段式下钻：任务列表 → 该任务采到的慢请求（segment）→ 栈分析（火焰条）。
  这与 SkyWalking UI 的交互一致，只是把「新建任务」省了：
  建任务需要写 OAP，本系统是只读观测方（见 OtnlEngine 的只读约定）。
-->
<template>
  <ApmGate v-slot="{ status }">
    <div class="apm-bar apm-toolbar">
      <ReSelect
        v-model="service"
        :options="serviceOptions"
        placeholder="选择服务（必选）"
        filterable
        style="width: 260px"
        @change="loadTasks"
      />
      <ReInput v-model="endpoint" placeholder="端点名（留空 = 该服务全部端点）" clearable style="width: 300px" @keyup.enter="loadTasks" />
      <ReButton icon="Search" type="primary" :loading="loading" @click="loadTasks">查询</ReButton>
      <span class="apm-bar__spacer" />
      <span class="apm-count">{{ tasks.length }} 个剖析任务</span>
      <ReButton icon="Refresh" :loading="loading" title="刷新" @click="loadTasks" />
    </div>

    <ReSkeleton v-if="loading && !tasks.length" :rows="6" animated />

    <!-- 没选服务与「任务为空」是两件事，措辞分开 -->
    <div v-else-if="!service" class="apm-empty-card">
      <span class="apm-empty-card__icon"><ReIcon name="Aim" :size="22" /></span>
      <div class="apm-empty-card__title">先选择一个服务</div>
      <p class="apm-empty-card__desc">
        剖析是按服务开启的。选中服务后，这里会列出它的剖析任务、采样片段与栈分析。
      </p>
    </div>

    <div v-else-if="!tasks.length" class="apm-empty-card">
      <span class="apm-empty-card__icon"><ReIcon name="Timer" :size="22" /></span>
      <div class="apm-empty-card__title">该服务没有剖析任务</div>
      <p class="apm-empty-card__desc">剖析需要先在 SkyWalking 侧对端点创建任务；本系统只读观测，不会替你创建。</p>
    </div>

    <template v-else>
      <ReCard v-for="task in tasks" :key="task.id" :radius="12" shadow="never" class="profile-card">
        <div class="profile-head">
          <ReTag :type="taskRunning(task) ? 'primary' : 'info'" round>
            {{ taskRunning(task) ? "进行中" : "已结束" }}
          </ReTag>
          <span class="apm-mono">{{ task.endpointName || "（全部端点）" }}</span>
          <span class="apm-bar__spacer" />
          <span class="apm-muted">{{ fmtTime(task.startTime) }} 开始 · 持续 {{ task.durationMinutes }} 分钟</span>
        </div>

        <div class="apm-kv profile-meta">
          <div class="apm-kv__row"><span class="apm-kv__key">触发阈值</span>{{ fmtMs(task.minDurationThreshold) }}</div>
          <div class="apm-kv__row"><span class="apm-kv__key">转储间隔</span>{{ task.dumpPeriod > 0 ? fmtMs(task.dumpPeriod) : "每次调用" }}</div>
          <div class="apm-kv__row"><span class="apm-kv__key">采样上限</span>{{ fmtNum(task.maxSamplingCount) }} 次</div>
          <div class="apm-kv__row">
            <span class="apm-kv__key">响应实例</span>{{ task.instanceCount }} 个
            <span v-if="task.instanceNames?.length" class="apm-muted">（{{ task.instanceNames.join("、") }}）</span>
          </div>
        </div>

        <div class="apm-bar">
          <ReButton size="small" icon="List" :loading="segmentsLoading[task.id]" @click="loadSegments(task.id)">
            采样片段
          </ReButton>
          <ReButton size="small" type="primary" icon="TrendCharts" :loading="analysisLoading[task.id]" @click="loadAnalysis(task.id)">
            栈分析
          </ReButton>
        </div>

        <!-- 采样片段 -->
        <template v-if="segmentsOf(task.id).length">
          <div class="profile-sub">采样片段</div>
          <ReTable
            :data="segmentsOf(task.id) as unknown as Record<string, unknown>[]"
            :columns="segmentColumns"
            engine="element"
            :settings="{ border: false }"
            :config="{ pagination: { enable: true, pageSize: 5 }, toolbar: { enable: false } }"
            empty-text="该任务没有采到慢请求"
            :layout-table="{ maxHeight: 320 }"
            :table-id="`apm-profile-segments-${task.id}`"
          >
            <template #empty="{ description }">
              <span class="apm-table-empty">{{ description }}</span>
            </template>
            <template #col-traceId="{ row }">
              <span class="apm-mono">{{ shortTrace(row.traceId) }}</span>
            </template>
            <template #col-endpointNames="{ row }">
              <span class="apm-mono">{{ (row.endpointNames || []).join("、") || "—" }}</span>
            </template>
            <template #col-durationMs="{ row }">
              <span class="apm-mono" :class="latencyClass(row.durationMs)">{{ fmtMs(row.durationMs) }}</span>
            </template>
            <template #col-startTime="{ row }">
              <span class="apm-muted">{{ fmtTime(row.startTime) }}</span>
            </template>
          </ReTable>
        </template>

        <!-- 栈分析（火焰条） -->
        <template v-if="analysisOf(task.id)">
          <div class="profile-sub">
            栈分析
            <span v-if="analysisOf(task.id)?.tip" class="apm-muted">· {{ analysisOf(task.id)?.tip }}</span>
          </div>

          <ReEmpty v-if="!flamesOf(task.id).length" :image-size="60" description="该任务没有可分析的栈数据" />
          <div v-else class="profile-flame">
            <div v-for="row in flamesOf(task.id)" :key="row.key" class="profile-flame__row">
              <span class="profile-flame__sig apm-mono" :style="{ paddingLeft: `${row.depth * 14}px` }" :title="row.signature">
                {{ row.signature }}
              </span>
              <div class="profile-flame__track">
                <div class="profile-flame__bar" :style="{ width: `${row.percent}%` }" />
                <div class="profile-flame__bar is-self" :style="{ width: `${row.selfPercent}%` }" />
              </div>
              <span class="profile-flame__ms apm-mono">{{ fmtMs(row.durationMs) }}</span>
              <span class="profile-flame__ms apm-mono apm-muted">自身 {{ fmtMs(row.selfDurationMs) }}</span>
            </div>
          </div>
        </template>
      </ReCard>
    </template>

    <div v-if="!status.capabilities.includes('profiles')" class="apm-muted">
      引擎 {{ status.name }} 不支持性能剖析（SkyWalking 9.x 起才提供 Profile 协议）。
    </div>
  </ApmGate>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { message } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReCard from "@repo/ui/re-card";
import ReEmpty from "@repo/ui/re-empty";
import ReIcon from "@repo/ui/re-icon";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import type { ReTableColumn } from "@repo/ui/re-table";
import ApmGate from "../components/ApmGate.vue";
import { getProfileAnalysis, listProfileTasks, listProfiledSegments, listServices } from "../api/apmApi";
import type { ApmProfileAnalysis, ApmProfileStack, ApmProfileTask, ApmProfiledSegment } from "../api/apmApi";
import { useApmStatus } from "../composables/useApmStatus";
import { fmtMs, fmtNum, fmtTime, latencyClass } from "../utils/format";

const { present, ensure } = useApmStatus();

const services = ref<string[]>([]);
const service = ref("");
const endpoint = ref("");
const tasks = ref<ApmProfileTask[]>([]);
const loading = ref(false);

/** taskId → 片段列表 */
const segments = reactive<Record<string, ApmProfiledSegment[]>>({});
const segmentsLoading = reactive<Record<string, boolean>>({});

/** taskId → 分析结果 */
const analyses = reactive<Record<string, ApmProfileAnalysis>>({});
const analysisLoading = reactive<Record<string, boolean>>({});

const serviceOptions = computed(() => services.value.map((s) => ({ label: s, value: s })));

const segmentColumns: ReTableColumn[] = [
  { prop: "traceId", label: "链路", minWidth: 150, slot: "traceId" },
  { prop: "instanceName", label: "实例", minWidth: 160 },
  { prop: "endpointNames", label: "端点", minWidth: 180, slot: "endpointNames" },
  { prop: "durationMs", label: "耗时", width: 100, align: "right", slot: "durationMs", sortable: true },
  { prop: "spanCount", label: "Span", width: 80, align: "right" },
  { prop: "startTime", label: "开始时间", width: 170, slot: "startTime" },
];

/** 一个火焰条行：按深度展开的栈帧，宽度按「相对根节点耗时」的百分比 */
interface FlameRow {
  key: string;
  depth: number;
  signature: string;
  durationMs: number;
  selfDurationMs: number;
  percent: number;
  selfPercent: number;
}

function taskRunning(task: ApmProfileTask): boolean {
  if (!task.startTime || !task.durationMinutes) {
    return false;
  }
  return Date.now() < task.startTime + task.durationMinutes * 60_000;
}

function segmentsOf(taskId: string): ApmProfiledSegment[] {
  return segments[taskId] ?? [];
}

function analysisOf(taskId: string): ApmProfileAnalysis | null {
  return analyses[taskId] ?? null;
}

/** 链路 ID 太长，表格里只显示尾部 8 位（完整值在 title 里） */
function shortTrace(traceId: string): string {
  if (!traceId) {
    return "—";
  }
  return traceId.length > 12 ? `…${traceId.slice(-12)}` : traceId;
}

/**
 * 把 OAP 的栈树摊平成火焰条行。
 *
 * <p>宽度基准取「同一棵树根节点的耗时」而不是全局最大值 —— 多棵树的根耗时可能差一个量级，
 * 用全局最大值会把小的那棵压成一条线，看起来像没采到数据。</p>
 */
function flamesOf(taskId: string): FlameRow[] {
  const analysis = analyses[taskId];
  if (!analysis?.trees?.length) {
    return [];
  }
  const rows: FlameRow[] = [];
  for (const [index, tree] of analysis.trees.entries()) {
    const base = Math.max(1, tree.durationMs);
    const walk = (node: ApmProfileStack, depth: number, path: string) => {
      rows.push({
        key: `${index}-${path}`,
        depth,
        signature: node.codeSignature || "(unknown)",
        durationMs: node.durationMs,
        selfDurationMs: node.selfDurationMs,
        percent: Math.min(100, (node.durationMs / base) * 100),
        selfPercent: Math.min(100, (node.selfDurationMs / base) * 100),
      });
      for (const [childIndex, child] of (node.children ?? []).entries()) {
        walk(child, depth + 1, `${path}.${childIndex}`);
      }
    };
    walk(tree, 0, "0");
  }
  return rows;
}

async function loadServices() {
  try {
    services.value = ((await listServices({})) || []).map((s) => s.name);
  } catch {
    services.value = [];
  }
}

async function loadTasks() {
  await ensure();
  if (!present.value) {
    return;
  }
  if (!service.value) {
    tasks.value = [];
    return;
  }
  loading.value = true;
  try {
    tasks.value =
      (await listProfileTasks({
        service: service.value,
        endpoint: endpoint.value || undefined,
      })) || [];
    // 任务列表刷新后，旧的片段 / 分析结果可能对不上任务，清掉重取
    for (const key of Object.keys(segments)) {
      delete segments[key];
    }
    for (const key of Object.keys(analyses)) {
      delete analyses[key];
    }
  } catch (e) {
    tasks.value = [];
    message.error(`加载剖析任务失败：${(e as Error)?.message ?? e}`);
  } finally {
    loading.value = false;
  }
}

async function loadSegments(taskId: string) {
  segmentsLoading[taskId] = true;
  try {
    segments[taskId] = (await listProfiledSegments(taskId)) || [];
    if (!segments[taskId].length) {
      message.info("该任务没有采到慢请求（可能是阈值过高或任务刚开始）");
    }
  } catch (e) {
    segments[taskId] = [];
    message.error(`加载采样片段失败：${(e as Error)?.message ?? e}`);
  } finally {
    segmentsLoading[taskId] = false;
  }
}

async function loadAnalysis(taskId: string) {
  analysisLoading[taskId] = true;
  try {
    analyses[taskId] = await getProfileAnalysis(taskId);
  } catch (e) {
    analyses[taskId] = { taskId, tip: `分析失败：${(e as Error)?.message ?? e}`, trees: [] };
  } finally {
    analysisLoading[taskId] = false;
  }
}

/** 当前路由（服务详情页可以带 ?service=xxx 跳过来，直接进到该服务的剖析任务） */
const route = useRoute();

onMounted(async () => {
  await loadServices();
  // 用 useRoute 而不是手解 location.hash：hash 模式下 query 在 # 之后，
  // 手解会把 `#/apm/profiles?service=a` 与 `#/apm/profiles?service=a&x=1` 当成两种格式。
  const preset = firstQuery(route.query.service);
  if (preset) {
    service.value = preset;
    await loadTasks();
  }
});

/** query 值可能是 string | string[] | null，统一取第一个非空值 */
function firstQuery(value: unknown): string {
  if (Array.isArray(value)) {
    return String(value[0] ?? "");
  }
  return value ? String(value) : "";
}

// keepAlive 下同一路由复用组件：从服务详情再点「性能剖析」跳另一个服务时，
// onMounted 不会再跑，必须监听 query 变化才换得过去。
watch(
  () => route.query.service,
  (value) => {
    const next = firstQuery(value);
    if (next && next !== service.value) {
      service.value = next;
      endpoint.value = "";
      loadTasks();
    }
  },
);
</script>

<style scoped>
.profile-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.profile-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.profile-meta {
  margin: 0;
}

.profile-sub {
  margin-top: 4px;
  font-size: 13px;
  font-weight: 600;
}

.profile-flame {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.profile-flame__row {
  display: grid;
  grid-template-columns: minmax(200px, 40%) 1fr 76px 96px;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.profile-flame__sig {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-flame__track {
  position: relative;
  height: 14px;
  border-radius: 3px;
  background: var(--bg-fill-secondary, var(--el-fill-color));
  overflow: hidden;
}

.profile-flame__bar {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 3px;
  background: color-mix(in srgb, var(--el-color-primary) 35%, transparent);
}

.profile-flame__bar.is-self {
  background: var(--el-color-primary);
}

.profile-flame__ms {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
