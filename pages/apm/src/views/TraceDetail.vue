<!--
  链路瀑布 —— 对齐 SkyWalking UI 的 Trace 详情视图。

  这是 APM 里最需要「自绘」的一页：一条链路的 span 有父子关系、有本地/远程之分、
  还有起止时间重叠，表格画不出来。做法是最朴素也最可靠的「横向时间轴条」：

    每一行 = 一个 span，条子的 left = (span.start - trace.start) / trace.duration，
    宽度 = span.duration / trace.duration。

  缩进按 parentSpanId 的层级计算（同一 segment 内），跨服务的调用用 info 色区分，
  失败的 span 用红色。点击行展开该 span 的标签与事件（logs）。

  时间轴对齐用「整条链路的 [min(start), max(end)]」而不是 trace.start/duration：
  SkyWalking 返回的 trace 起止偶尔不含最外层 span 的异步尾部，
  用 span 的并集作为分母才不会出现「条子超出右边界」。
-->
<template>
  <ApmGate>
    <ReSectionHead :description="traceId ? `Trace ${traceId}` : '未指定链路'">
      <template #title>链路详情</template>
      <template #actions>
        <ReButton icon="Back" show-text @click="goBack">返回列表</ReButton>
        <ReButton icon="Refresh" show-text :loading="loading" @click="load">刷新</ReButton>
      </template>
    </ReSectionHead>

    <ReEmpty v-if="!traceId" :image-size="70" description="缺少 traceId，请从链路列表点行进入" />

    <template v-else>
      <ReSkeleton v-if="loading && !trace" :rows="8" animated />

      <ReEmpty v-else-if="!trace" :image-size="70" description="链路不存在或已过保留期（OAP 默认 3 天）" />

      <template v-else>
        <!-- 摘要 -->
        <div class="apm-kpis">
          <ReStatCard
            size="compact"
            title="总耗时"
            :value="fmtMs(trace.durationMs)"
            :desc="`${trace.spanCount} 个 span`"
            :icon="Timer"
            :icon-color="trace.error ? 'var(--el-color-danger)' : 'var(--el-color-primary)'"
          />
          <ReStatCard
            size="compact"
            title="状态"
            :value="trace.error ? '失败' : '成功'"
            :desc="errorSpans.length ? `${errorSpans.length} 个 span 报错` : '全部 span 正常'"
            :icon="CircleCheck"
            :icon-color="trace.error ? 'var(--el-color-danger)' : 'var(--el-color-success)'"
          />
          <ReStatCard
            size="compact"
            title="涉及服务"
            :value="serviceCount"
            desc="链路经过的服务数"
            :icon="Connection"
            icon-color="var(--el-color-info)"
          />
          <ReStatCard
            size="compact"
            title="开始时间"
            :value="fmtClock(trace.startTime)"
            :desc="fmtTime(trace.startTime)"
            :icon="Clock"
            icon-color="var(--el-color-info)"
          />
        </div>

        <!-- 瀑布 -->
        <ReCard :radius="12" shadow="never">
          <template #header>
            <div class="apm-card-head">
              <span class="apm-card-h">Span 瀑布</span>
              <div class="apm-bar" style="gap: 8px">
                <el-checkbox v-model="showAll" label="显示内部 span" />
                <span class="apm-count">{{ visibleSpans.length }} / {{ spans.length }}</span>
              </div>
            </div>
          </template>

          <div class="apm-waterfall">
            <div
              v-for="span in visibleSpans"
              :key="`${span.segmentId || ''}:${span.spanId}`"
              :class="['apm-waterfall__row', { 'is-error': span.error }]"
              :style="{ paddingLeft: 6 + span.depth * 14 + 'px' }"
              @click="toggle(span)"
            >
              <div class="apm-waterfall__name" :title="span.endpointName || span.serviceName || ''">
                <span class="apm-muted apm-mono">{{ span.component || span.layer || "—" }}</span>
                <span>{{ span.endpointName || span.serviceName || span.spanId }}</span>
              </div>
              <div class="apm-waterfall__track" :title="`${fmtMs(span.durationMs)} @ ${fmtClock(span.startTime)}`">
                <i
                  :class="['apm-waterfall__bar', { 'is-error': span.error, 'is-remote': !span.parentSpanId }]"
                  :style="{ left: span.leftPercent + '%', width: span.widthPercent + '%' }"
                />
              </div>
              <div class="apm-waterfall__ms">{{ fmtMs(span.durationMs) }}</div>
            </div>
          </div>
        </ReCard>

        <!-- 选中 span 的详情 -->
        <ReCard v-if="selected" :radius="12" shadow="never">
          <template #header>
            <div class="apm-card-head">
              <span class="apm-card-h">
                Span 详情
                <ReTag v-if="selected.error" type="danger" size="small" style="margin-left: 8px">ERROR</ReTag>
              </span>
              <span class="apm-mono apm-muted">{{ selected.spanId }}</span>
            </div>
          </template>

          <div class="apm-kv">
            <div class="apm-kv__row"><span class="apm-kv__key">服务</span>{{ selected.serviceName || "—" }}</div>
            <div class="apm-kv__row"><span class="apm-kv__key">实例</span>{{ selected.instanceName || "—" }}</div>
            <div class="apm-kv__row"><span class="apm-kv__key">端点</span>{{ selected.endpointName || "—" }}</div>
            <div class="apm-kv__row"><span class="apm-kv__key">组件</span>{{ selected.component || "—" }}</div>
            <div class="apm-kv__row"><span class="apm-kv__key">层</span>{{ selected.layer || "—" }}</div>
            <div class="apm-kv__row"><span class="apm-kv__key">类型</span>{{ selected.type || "—" }}</div>
            <div class="apm-kv__row"><span class="apm-kv__key">对端</span>{{ selected.peer || "—" }}</div>
            <div class="apm-kv__row">
              <span class="apm-kv__key">开始</span>{{ fmtTime(selected.startTime) }}
            </div>
            <div class="apm-kv__row"><span class="apm-kv__key">耗时</span>{{ fmtMs(selected.durationMs) }}</div>
            <div class="apm-kv__row">
              <span class="apm-kv__key">父 Span</span>{{ selected.parentSpanId || "（根）" }}
            </div>
          </div>

          <template v-if="selected.tags?.length">
            <h4 class="apm-sub-h">标签</h4>
            <div class="apm-kv">
              <div v-for="tag in selected.tags" :key="tag.key" class="apm-kv__row">
                <span class="apm-kv__key">{{ tag.key }}</span>{{ tag.value }}
              </div>
            </div>
          </template>

          <template v-if="selected.logs?.length">
            <h4 class="apm-sub-h">事件（{{ selected.logs.length }}）</h4>
            <div v-for="(log, i) in selected.logs" :key="i" class="apm-kv apm-span-log">
              <div class="apm-kv__row">
                <span class="apm-kv__key">{{ fmtTime(log.time) }}</span>
                <span v-for="tag in log.tags" :key="tag.key" class="apm-mono">
                  {{ tag.key }}={{ tag.value }}
                </span>
              </div>
            </div>
          </template>
        </ReCard>

        <!-- 原始数据：出问题时要能复制给后端排查 -->
        <ReCard :radius="12" shadow="never">
          <template #header><span class="apm-card-h">原始数据</span></template>
          <el-collapse>
            <el-collapse-item title="展开 JSON" name="json">
              <pre class="apm-json">{{ prettyTrace }}</pre>
            </el-collapse-item>
          </el-collapse>
        </ReCard>
      </template>
    </template>
  </ApmGate>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Back, CircleCheck, Clock, Connection, Timer } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReCard from "@repo/ui/re-card";
import ReEmpty from "@repo/ui/re-empty";
import ReSectionHead from "@repo/ui/re-section-head";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReStatCard from "@repo/ui/re-stat-card";
import ReTag from "@repo/ui/re-tag";
import ApmGate from "../components/ApmGate.vue";
import { getTrace } from "../api/apmApi";
import type { ApmSpan, ApmTrace } from "../api/apmApi";
import { fmtClock, fmtMs, fmtTime } from "../utils/format";
import { ROUTE_PREFIX } from "../config";

const route = useRoute();
const router = useRouter();

/** 带排版信息的 span（缩进层级 + 百分比位置） */
interface LayoutSpan extends ApmSpan {
  depth: number;
  leftPercent: number;
  widthPercent: number;
}

const traceId = ref(String(route.query.traceId ?? ""));
const trace = ref<ApmTrace | null>(null);
const loading = ref(false);
const showAll = ref(true);
const selectedId = ref("");
const selected = ref<LayoutSpan | null>(null);

/**
 * span 排序与缩进：
 * 先按开始时间排（时间轴的自然顺序），再按 parentSpanId 求层级。
 * 找不到父的 span 视为根（SkyWalking 的跨段调用必然如此），层级给 0。
 */
const spans = computed<LayoutSpan[]>(() => {
  const list = trace.value?.spans ?? [];
  if (!list.length) {
    return [];
  }
  const start = Math.min(...list.map((s) => s.startTime));
  const ends = list.map((s) => (s.endTime > 0 ? s.endTime : s.startTime + s.durationMs));
  const end = Math.max(...ends, ...list.map((s) => s.startTime + s.durationMs));
  const total = Math.max(1, end - start);

  // 层级：spanId → 下标；同一 spanId 可能跨 segment 重复，key 用 segmentId:spanId
  const key = (s: ApmSpan) => `${s.segmentId || ""}:${s.spanId}`;
  const parents = new Map<string, string>();
  for (const s of list) {
    if (s.parentSpanId) {
      parents.set(key(s), `${s.segmentId || ""}:${s.parentSpanId}`);
    }
  }
  const depthOf = (s: ApmSpan, seen = new Set<string>()): number => {
    const k = key(s);
    if (seen.has(k)) {
      return 0;
    }
    seen.add(k);
    const parentKey = parents.get(k);
    if (!parentKey) {
      return 0;
    }
    const parent = list.find((p) => key(p) === parentKey);
    return parent ? Math.min(12, depthOf(parent, seen) + 1) : 0;
  };

  return [...list]
    .sort((a, b) => a.startTime - b.startTime || b.durationMs - a.durationMs)
    .map((s) => {
      const offset = Math.max(0, s.startTime - start);
      const duration = Math.max(s.durationMs, 1);
      return {
        ...s,
        depth: depthOf(s),
        leftPercent: Math.min(100, (offset / total) * 100),
        widthPercent: Math.max(0.4, Math.min(100, (duration / total) * 100)),
      };
    });
});

/** 「显示内部 span」关闭时只留跨服务调用与根 span，避免上千个内部 span 糊成一片 */
const visibleSpans = computed(() => {
  if (showAll.value) {
    return spans.value;
  }
  return spans.value.filter((s) => !s.parentSpanId || s.error);
});

const errorSpans = computed(() => spans.value.filter((s) => s.error));
const serviceCount = computed(() => new Set(spans.value.map((s) => s.serviceName).filter(Boolean)).size);
const prettyTrace = computed(() => JSON.stringify(trace.value, null, 2));

/** 点行选中/取消选中 */
function toggle(span: LayoutSpan) {
  if (selectedId.value === span.spanId) {
    selectedId.value = "";
    selected.value = null;
    return;
  }
  selectedId.value = span.spanId;
  selected.value = span;
}

async function load() {
  if (!traceId.value) {
    return;
  }
  loading.value = true;
  try {
    trace.value = await getTrace(traceId.value);
    selectedId.value = "";
    selected.value = null;
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push(`${ROUTE_PREFIX}/traces`);
}

onMounted(load);
</script>

<style scoped>
.apm-sub-h {
  margin: 14px 0 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, var(--el-text-color-regular));
}

.apm-span-log {
  grid-template-columns: 1fr;
  padding: 4px 0;
  border-top: 1px dashed var(--border-subtle, var(--el-border-color-lighter));
}

.apm-json {
  margin: 0;
  max-height: 420px;
  overflow: auto;
  padding: 10px;
  border-radius: 8px;
  background: var(--code-background, var(--el-fill-color-light));
  color: var(--code-foreground, var(--el-text-color-regular));
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  font-size: 12px;
  line-height: 1.5;
}
</style>
