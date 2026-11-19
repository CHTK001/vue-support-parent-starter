<!--
  请求映射（`/actuator/mappings`）

  Actuator 只给「这条路由挂在哪个处理器上」，请求次数 / 耗时 / 访问 IP 来自
  `/v2/server/api/stats`。两个数据源按「方法 + 路径」对齐，对不上的路由保留在表里、
  统计列显示为弱化横线 —— 从没被调用过的接口同样是有价值的信息。

  表格走 2A 底盘：映射条件钉在左边，行高跟全页密度档走，分页贴底。
  排序改成「整表排序再分页」：Actuator 端点不分页，前端切片后如果还让表格本地排序，
  点表头只会把当前 50 行重排，看着像排序失效。
-->
<template>
  <TabShell
    v-model="keyword"
    placeholder="过滤映射条件 / 处理器…"
    :count-text="`共 ${rows.length} 项`"
    :loading="loading"
    :error="error"
    :error-kind="errorKind"
    density
    auto-refresh
    :updated-at="updatedAt"
    @refresh="refresh"
  >
    <template #tools>
      <label class="act__tool">
        方法
        <ElSelect
          :model-value="methodFilter"
          size="small"
          clearable
          placeholder="全部"
          style="width: 100px"
          @change="(v: unknown) => setMethodFilter(String(v ?? ''))"
          @clear="setMethodFilter('')"
        >
          <ElOption v-for="method in HTTP_METHODS" :key="method" :label="method" :value="method" />
        </ElSelect>
      </label>
      <label class="act__tool">
        <ElSwitch v-model="onlyTraffic" size="small" />
        仅看有流量
      </label>
      <ElButton size="small" @click="openExchanges">最近请求</ElButton>
      <ElButton size="small" @click="exportCsv">导出 CSV</ElButton>
    </template>
    <div class="act-traffic">
      <div class="act-traffic__panel">
        <p class="act-traffic__title">热点接口 Top5<span class="act-traffic__sub">按请求次数 · 点击过滤表格</span></p>
        <ol v-if="hotEndpoints.length" class="act-traffic__list">
          <li v-for="(row, index) in hotEndpoints" :key="row.predicate" class="act-traffic__row" @click="searchMapping(row)">
            <span class="act-traffic__rank">{{ index + 1 }}</span>
            <span v-if="row.method" class="act-method" :class="`is-${row.method.toLowerCase()}`">{{ row.method }}</span>
            <span class="act-traffic__path" :title="row.predicate">{{ row.predicate }}</span>
            <span class="act-traffic__value">{{ row.count }} 次</span>
          </li>
        </ol>
        <div v-else class="act-traffic__empty">还没有接口被调用过</div>
      </div>
      <div class="act-traffic__panel">
        <p class="act-traffic__title">慢接口 Top5<span class="act-traffic__sub">按平均延迟 · 点击过滤表格</span></p>
        <ol v-if="slowEndpoints.length" class="act-traffic__list">
          <li v-for="(row, index) in slowEndpoints" :key="row.predicate" class="act-traffic__row" @click="searchMapping(row)">
            <span class="act-traffic__rank">{{ index + 1 }}</span>
            <span v-if="row.method" class="act-method" :class="`is-${row.method.toLowerCase()}`">{{ row.method }}</span>
            <span class="act-traffic__path" :title="row.predicate">{{ row.predicate }}</span>
            <span class="act-traffic__value"><ReTime :value="costMs(row.avgMs)" format="duration" placeholder="-" /></span>
          </li>
        </ol>
        <div v-else class="act-traffic__empty">还没有可比较的耗时数据</div>
      </div>
    </div>
    <div class="act-table-wrap">
      <ReTable
        :data="tableRows"
        :columns="columns"
        engine="element"
        :size="actuatorTableSize"
        :pagination="false"
        :toolbar="false"
        :settings="{ border: false }"
        :layout-table="{ fill: true }"
        class="act-table"
        @sort-change="onSortChange"
      >
        <template #col-predicate="{ row }">
          <span class="act-mapping">
            <span v-if="row.method" class="act-method" :class="`is-${String(row.method).toLowerCase()}`">{{ row.method }}</span>
            <span class="act-mapping__path">{{ row.predicate }}</span>
          </span>
        </template>
        <template #col-count="{ row }">
          <span :class="{ 'act-muted': !row.count }">{{ row.count }}</span>
        </template>
        <template #col-avgMs="{ row }">
          <span :class="{ 'act-muted': !row.count }">
            <ReTime v-if="row.count" :value="costMs(row.avgMs)" format="duration" placeholder="-" />
            <template v-else>-</template>
          </span>
        </template>
        <template #col-ips="{ row }">
          <span :class="{ 'act-muted': !row.ips }">{{ row.ips || "-" }}</span>
        </template>
      </ReTable>
      <ActTablePager v-model:page="page" v-model:page-size="pageSize" :total="total" />
    </div>

    <ElDrawer v-model="exVisible" title="最近 HTTP 请求样本" size="680px" class="act-exchange-drawer">
      <div class="act-exchange__ops">
        <ElButton size="small" :loading="exLoading" @click="loadExchanges">刷新样本</ElButton>
        <span class="act-exchange__hint">服务端默认只保留最近 100 条 · timeTaken 已换算为毫秒</span>
      </div>
      <div v-if="exError" class="act__empty is-error">{{ exError }}</div>
      <ReTable
        v-else
        :data="exchanges"
        :columns="exchangeColumns"
        engine="element"
        size="small"
        :pagination="false"
        :toolbar="false"
        :settings="{ border: false }"
        :layout-table="{ fill: true }"
        class="act-table"
      >
        <template #col-time="{ row }">{{ formatExchangeTime(row.timestamp) }}</template>
        <template #col-method="{ row }">
          <span v-if="row.method" class="act-method" :class="`is-${String(row.method).toLowerCase()}`">{{ row.method }}</span>
          <template v-else>-</template>
        </template>
        <template #col-uri="{ row }">{{ shortUri(row.uri) }}</template>
        <template #col-status="{ row }">
          <span class="act-exchange__status" :class="statusToneClass(Number(row.status))">{{ row.status || "-" }}</span>
        </template>
        <template #col-timeMs="{ row }">{{ row.timeMs }} ms</template>
      </ReTable>
    </ElDrawer>
  </TabShell>
</template>

<script setup lang="ts" name="ActuatorMappingsView">
/**
 * 请求映射页签。
 *
 * <p>统计接口只在拿到映射之后取一次：映射刷新（含切回页签的静默刷新）会更新
 * {@code updatedAt}，这里监听这个时间戳再取统计，保证两侧永远同一轮。</p>
 */
import { computed, ref, watch } from "vue";
import { ElButton, ElDrawer, ElMessage, ElOption, ElSelect, ElSwitch } from "element-plus";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import ReTime from "@repo/ui/re-time";
import { costMs } from "@repo/utils";
import TabShell from "../TabShell.vue";
import ActTablePager from "../ActTablePager.vue";
import { csvStamp, exportRowsToCsv } from "../csvExport";
import { useActuatorPanel } from "../useActuatorPanel";
import { actuatorTableSize, useActuatorPager } from "../useActuatorTable";
import {
  getHttpExchanges,
  getRestfulApiStats,
  matchRestfulStat,
  type HttpExchangeRow,
  type RestfulApiStats,
} from "../../api/actuatorCardApi";
import { isUnavailableError, unavailableHint } from "../../cards/useCardResource";

const { data, loading, error, errorKind, keyword, updatedAt, reload, hit } = useActuatorPanel("mappings");

/** RESTful 统计（拉失败时保持 undefined：统计列显示弱化横线，不影响映射本身） */
const stats = ref<RestfulApiStats | undefined>(undefined);

async function loadStats(): Promise<void> {
  try {
    stats.value = await getRestfulApiStats();
  } catch {
    // 统计是旁证数据：拿不到就不显示次数，不要把整页打成「加载失败」
    stats.value = undefined;
  }
}

/** 手动刷新 = 映射 + 统计一起重取；自动刷新（silent）走静默路径，失败不清空已渲染的映射 */
async function refresh(silent = false): Promise<void> {
  await Promise.all([reload(silent), loadStats()]);
}

// 映射数据每成功拉一次（首次加载 / 手动刷新 / 切回页签）就同步一次统计
watch(updatedAt, (ts) => {
  if (ts) void loadStats();
});

interface MappingRow {
  ctx: string;
  handler: string;
  predicate: string;
  /** 从 predicate 解析出的 HTTP 方法（解析不出为空串，不显示徽章） */
  method: string;
  count: number;
  avgMs: number;
  ips: string;
}

/** 仅看有流量：两千多条映射里没被调用过的长尾会淹没真正在跑的接口 */
const onlyTraffic = ref(false);

/** predicate 里的 HTTP 方法，如 `{GET [/api/x]}` → GET */
const HTTP_METHOD_RE = /\b(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|TRACE)\b/;

/** 方法筛选的候选（predicate 里能解析出的动词集合） */
const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS", "TRACE"];

/** 按方法筛选（空串 = 全部） */
const methodFilter = ref("");

function setMethodFilter(method: string): void {
  methodFilter.value = method ?? "";
}

/** 全量合并行（映射 × 统计，不过滤）：流量概览不受关键字 / 方法筛选影响，始终看全局 */
const baseRows = computed<MappingRow[]>(() => {
  const contexts = (data.value?.contexts as Record<string, unknown> | undefined) ?? {};
  const out: MappingRow[] = [];
  Object.entries(contexts).forEach(([ctx, context]) => {
    const dispatcher = (context as { mappings?: { dispatcherServlets?: Record<string, unknown[]> } } | null)?.mappings
      ?.dispatcherServlets;
    Object.values(dispatcher ?? {}).forEach((list) => {
      (list ?? []).forEach((item) => {
        const mapping = item as { predicate?: unknown; handler?: unknown };
        const predicate = String(mapping?.predicate ?? "");
        // 统计是纯函数匹配：这里只是查表，不发请求
        const stat = matchRestfulStat(predicate, stats.value);
        out.push({
          ctx,
          handler: String(mapping?.handler ?? "-"),
          predicate,
          method: (predicate.match(HTTP_METHOD_RE)?.[1] ?? "").toUpperCase(),
          count: stat?.count ?? 0,
          avgMs: stat?.avgMs ?? 0,
          ips: stat?.ips?.map((entry) => entry.ip).filter(Boolean).join("、") ?? "",
        });
      });
    });
  });
  return out;
});

const rows = computed<MappingRow[]>(() =>
  baseRows.value
    .filter((row) => hit(row.handler, row.predicate))
    .filter((row) => !methodFilter.value || row.method === methodFilter.value)
    .filter((row) => !onlyTraffic.value || row.count > 0),
);

/* ---------- 流量概览（纯前端聚合，不发请求） ---------- */

/** 热点接口 Top5：按请求次数倒序 */
const hotEndpoints = computed<MappingRow[]>(() =>
  baseRows.value
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5),
);

/** 慢接口 Top5：按平均延迟倒序（只看真实被调用过、耗时大于 0 的接口） */
const slowEndpoints = computed<MappingRow[]>(() =>
  baseRows.value
    .filter((row) => row.count > 0 && row.avgMs > 0)
    .sort((a, b) => b.avgMs - a.avgMs)
    .slice(0, 5),
);

/** 点概览行 → 把映射条件填进过滤词，表格立刻聚焦这条接口 */
function searchMapping(row: MappingRow): void {
  keyword.value = row.predicate;
}

/* ---------- 整表排序 → 分页 ---------- */

interface SortState {
  prop: string;
  order: "ascending" | "descending" | null;
}

const sort = ref<SortState>({ prop: "", order: null });

/** 排序作用在「过滤后的全量行」上，再交给分页切片 */
const sortedRows = computed<MappingRow[]>(() => {
  const { prop, order } = sort.value;
  if (!prop || !order) return rows.value;
  const direction = order === "ascending" ? 1 : -1;
  return [...rows.value].sort((a, b) => {
    const left = (a as unknown as Record<string, unknown>)[prop];
    const right = (b as unknown as Record<string, unknown>)[prop];
    if (typeof left === "number" && typeof right === "number") return (left - right) * direction;
    return String(left ?? "").localeCompare(String(right ?? "")) * direction;
  });
});

const { page, pageSize, total, pagedRows, resetPage } = useActuatorPager(sortedRows);
watch(keyword, resetPage);
watch(methodFilter, resetPage);
watch(onlyTraffic, resetPage);

/** 导出当前过滤 + 排序结果（全量，非当前页） */
function exportCsv(): void {
  exportRowsToCsv(
    `actuator-mappings-${csvStamp()}.csv`,
    ["方法", "映射条件", "处理器", "请求次数", "平均延迟(ms)", "访问 IP", "上下文"],
    sortedRows.value.map((row) => [row.method || "-", row.predicate, row.handler, row.count, row.avgMs, row.ips || "-", row.ctx]),
  );
  ElMessage.success(`已导出 ${sortedRows.value.length} 行`);
}

function onSortChange(payload: SortState): void {
  sort.value = payload;
  resetPage();
}

/** ReTable 的行类型是宽类型；一次性转换，避免模板里到处 as any */
const tableRows = computed(() => pagedRows.value as unknown as Record<string, unknown>[]);

const columns: ReTableColumn[] = [
  { prop: "predicate", label: "映射条件", minWidth: 320, fixed: "left", showOverflowTooltip: true, slot: "predicate" },
  { prop: "handler", label: "处理器", minWidth: 220, showOverflowTooltip: true },
  { prop: "count", label: "请求次数", width: 110, align: "right", sortable: "custom", slot: "count" },
  { prop: "avgMs", label: "平均延迟", width: 110, align: "right", sortable: "custom", slot: "avgMs" },
  { prop: "ips", label: "访问 IP", minWidth: 150, showOverflowTooltip: true, sortable: "custom", slot: "ips" },
  { prop: "ctx", label: "上下文", width: 110, align: "center", sortable: "custom" },
];

/* ---------- 最近 HTTP 请求样本（/actuator/httpexchanges，按需取数） ---------- */

const exVisible = ref(false);
const exLoading = ref(false);
const exError = ref("");
const exchanges = ref<HttpExchangeRow[]>([]);

const exchangeColumns: ReTableColumn[] = [
  { prop: "timestamp", label: "时间", width: 170, slot: "time" },
  { prop: "method", label: "方法", width: 84, align: "center", slot: "method" },
  { prop: "uri", label: "请求路径", minWidth: 300, showOverflowTooltip: true, slot: "uri" },
  { prop: "status", label: "状态码", width: 90, align: "center", slot: "status" },
  { prop: "timeMs", label: "耗时", width: 100, align: "right", slot: "timeMs" },
];

/** 打开抽屉；样本为空时才首取，之后点「刷新样本」手动更新（样本不是常驻数据） */
function openExchanges(): void {
  exVisible.value = true;
  if (!exchanges.value.length && !exError.value) void loadExchanges();
}

async function loadExchanges(): Promise<void> {
  exLoading.value = true;
  exError.value = "";
  try {
    exchanges.value = await getHttpExchanges();
  } catch (err) {
    exchanges.value = [];
    // 未暴露（404/405/501）给接入指引，其余给原始错误；样本是旁证数据，不影响映射表
    exError.value = isUnavailableError(err)
      ? unavailableHint("httpexchanges")
      : ((err as Error)?.message ?? "加载请求样本失败");
  } finally {
    exLoading.value = false;
  }
}

/** ISO-8601（UTC）→ 本地可读时间；解析失败退回原文 */
function formatExchangeTime(ts: unknown): string {
  const raw = String(ts ?? "");
  const ms = Date.parse(raw);
  return Number.isNaN(ms) ? raw || "-" : new Date(ms).toLocaleString("zh-CN", { hour12: false });
}

/** 完整 URI 去掉协议与主机，只留路径与查询串：短得多，也足够定位接口 */
function shortUri(uri: unknown): string {
  const raw = String(uri ?? "");
  const stripped = raw.replace(/^https?:\/\/[^/]+/i, "");
  return stripped || raw || "-";
}

/** 状态码配色：2xx 绿、3xx 蓝灰、4xx 橙、5xx / 未知 红 */
function statusToneClass(status: number): string {
  if (!status) return "is-unknown";
  if (status < 300) return "is-ok";
  if (status < 400) return "is-redirect";
  if (status < 500) return "is-warn";
  return "is-error";
}
</script>
