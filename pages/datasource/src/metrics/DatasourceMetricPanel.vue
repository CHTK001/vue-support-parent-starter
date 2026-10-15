<template>
  <div class="ds-metrics" :class="{ 'is-embedded': embedded }">
    <div v-if="!embedded" class="ds-metrics__bar">
      <div class="ds-metrics__stat">
        <span class="ds-metrics__stat-label">连通性</span>
        <span class="ds-metrics__stat-value" :class="statusClass">{{ statusText }}</span>
      </div>
      <div class="ds-metrics__stat">
        <span class="ds-metrics__stat-label">建连延迟</span>
        <span class="ds-metrics__stat-value mono">{{ connectText }}</span>
      </div>
      <div class="ds-metrics__stat">
        <span class="ds-metrics__stat-label">会话延迟</span>
        <span class="ds-metrics__stat-value mono">{{ sessionText }}</span>
      </div>
      <div class="ds-metrics__stat">
        <span class="ds-metrics__stat-label">链路</span>
        <span class="ds-metrics__stat-value">{{ tunneledText }}</span>
      </div>
      <div class="ds-metrics__spacer" />
      <span class="ds-metrics__stream" :class="streamClass">{{ streamText }}</span>
    </div>

    <p v-if="hint" class="ds-metrics__hint">{{ hint }}</p>

    <div v-if="points.length" class="ds-metrics__chart">
      <DatasourceMetricChart :points="points" :fill="embedded" />
      <p v-if="!embedded" class="ds-metrics__foot">
        共 {{ points.length }} 个采样点<span v-if="intervalSec">
          · 采样间隔约 {{ Math.round(intervalSec) }}s</span
        ><span v-if="points.length && points[points.length - 1]?.time">
          · 最新 {{ formatTime(points[points.length - 1]?.time) }}</span
        >
      </p>
    </div>
    <div v-else class="ds-metrics__empty">
      <ReEmpty :description="emptyText" :image-size="80" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 数据源监控指标面板：状态胶囊 + 延迟/连通性趋势图。
 *
 * <p><strong>采集是「有人看才采」</strong>，这一点必须让用户看得见，
 * 否则「打开页面图是空的」会被当成故障。所以无数据时显示的是后端给的
 * {@code message}（说明为什么空、什么时候会有），不是一句「暂无数据」。</p>
 *
 * <p><strong>SSE 与趋势查询的分工</strong>：趋势接口给首屏历史，SSE 给增量。
 * 反过来（首屏等 SSE）会让页面上半秒是空白；只用 SSE（不带历史）
 * 则切回看过的数据源时又要重新等采集。</p>
 *
 * @author CH
 * @since 4.0.0.43
 */
import { computed, onMounted, ref, toRef, watch } from "vue";
import ReEmpty from "@repo/ui/re-empty";
import DatasourceMetricChart from "./DatasourceMetricChart.vue";
import { useDatasourceMetricStream, type MetricStreamState } from "./useDatasourceMetricStream";
import {
  fetchDatasourceMetricTrend,
  type DatasourceMetricPoint,
  type DatasourceMetricPush,
} from "../api";

const props = defineProps<{
  /** 数据源 ID；为空时不采集也不显示 */
  datasourceId?: number;
  /**
   * 嵌入模式：概览页签的面板里只放图表本体。
   *
   * <p>概览已有统计卡承担「连通性/延迟」的当前值展示，嵌入时隐藏顶部
   * 状态胶囊与页脚，避免同一屏出现两份一样的数字。</p>
   */
  embedded?: boolean;
}>();

const emit = defineEmits<{
  /**
   * 最新采样点（含服务器指标）。随趋势首屏或 SSE 窗口更新而发出，
   * 供概览页的趋势下方「其它信息」面板消费同一个数据源。
   */
  (e: "latest", point: DatasourceMetricPoint | null): void;
}>();

const points = ref<DatasourceMetricPoint[]>([]);
/** 后端给的说明文案；无数据时说明原因，有数据时为 null */
const note = ref<string | null>(null);
/** 最近一次采集结果，用于顶部胶囊 */
const latest = ref<DatasourceMetricPush | null>(null);
/** 实际使用的采样间隔（秒），抽稀后与请求值不同，展示要用后端报的那个 */
const intervalSec = ref<number | null>(null);
const loadError = ref<string | null>(null);

const idRef = toRef(props, "datasourceId");

/**
 * 拉首屏历史。
 *
 * <p>失败不抛到界面：把 error 混进 note 就够了 —— 这一页不是「操作」页，
 * 拉不到历史不该弹一个红色的 toast 把用户从正在做的事里拽走。</p>
 */
async function loadTrend(): Promise<void> {
  const id = idRef.value;
  if (!id) {
    points.value = [];
    note.value = null;
    latest.value = null;
    return;
  }
  loadError.value = null;
  try {
    const trend = await fetchDatasourceMetricTrend(id);
    points.value = trend?.points ?? [];
    note.value = trend?.message ?? null;
    intervalSec.value = trend?.interval ?? null;
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : String(e);
    points.value = [];
    note.value = null;
  }
}

const { state, lastPushAt, close } = useDatasourceMetricStream(idRef, {
  onPush: push => {
    latest.value = push;
    // 采集失败时后端会推 success=null 并带上原因：那条原因要留在页面上，
    // 否则曲线停在旧点上，用户看到的是「一切正常」而实际是「已经测不出来了」
    if (push.message && push.success === null) {
      note.value = push.message;
    }
  },
  onPoints: incoming => {
    points.value = incoming;
  },
});

// 切换数据源：重新拉历史、清掉上一家的状态胶囊。
// 注意不 close()——useDatasourceMetricStream 内部按 id 自己重连，
// 这里再关一次会把刚建好的连接掐掉。
watch(idRef, () => {
  // 切换数据源时把上一个的胶囊与「最近更新」清掉：
  // 留着会让新数据源在首次推送之前显示上一个数据源的连通性与时间戳，
  // 那比显示「未判定」危险得多 —— 用户会以为刚查过且一切正常。
  latest.value = null;
  lastPushAt.value = null;
  intervalSec.value = null;
  void loadTrend();
});

// 最新点给概览页的「其它信息」面板；切数据源/清空时补发 null，避免残留上一家指标
watch(points, (v) => emit("latest", v.length ? v[v.length - 1] : null));

onMounted(loadTrend);

const statusText = computed(() => {
  const s = latest.value?.success;
  if (s === null || s === undefined) {
    return "未判定";
  }
  return s ? "连通" : "不通";
});

const statusClass = computed(() => {
  const s = latest.value?.success;
  if (s === null || s === undefined) {
    return "is-unknown";
  }
  return s ? "is-ok" : "is-bad";
});

const connectText = computed(() => {
  const v = latest.value?.connectLatencyMs;
  return v === null || v === undefined ? "—" : `${v} ms`;
});

const sessionText = computed(() => {
  const v = latest.value?.sessionLatencyMs;
  return v === null || v === undefined ? "—" : `${v} ms`;
});

/** 未判定时写「—」而不是「直连」：没测出来就不能断言它没走隧道 */
const tunneledText = computed(() => {
  const t = latest.value?.tunneled;
  if (t === null || t === undefined) {
    return "—";
  }
  return t ? "SSH 隧道" : "直连";
});

/** 采样时刻格式化；解析不了就原样返回，不吞成「—」（原样更利于排查） */
function formatTime(time: string): string {
  const v = Date.parse(time);
  return Number.isNaN(v) ? time : new Date(v).toLocaleString("zh-CN", { hour12: false });
}

const streamLabel = (s: MetricStreamState): string => {
  switch (s) {
    case "open":
      return "实时中";
    case "connecting":
      return "连接中";
    case "error":
      return "重连中";
    default:
      return "未连接";
  }
};

const streamText = computed(() => {
  const at = lastPushAt.value;
  return at ? `${streamLabel(state.value)} · 最近更新 ${at}` : streamLabel(state.value);
});

const streamClass = computed(() => `is-${state.value}`);

const hint = computed(() => {
  if (loadError.value) {
    return `首屏历史加载失败：${loadError.value}`;
  }
  return note.value;
});

const emptyText = computed(() => {
  if (loadError.value) {
    return "首屏历史加载失败";
  }
  if (note.value) {
    return note.value;
  }
  return "正在等待第一次采集（约 1 分钟内）";
});

defineExpose({ close });
</script>

<style scoped lang="scss">
.ds-metrics {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}

.ds-metrics__bar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle, var(--el-border-color-lighter));
}

.ds-metrics__stat {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.ds-metrics__stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ds-metrics__stat-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  &.is-ok {
    color: var(--status-success, var(--el-color-success));
  }

  &.is-bad {
    color: var(--status-error, var(--el-color-danger));
  }

  &.is-unknown {
    color: var(--el-text-color-secondary);
    font-weight: 400;
  }
}

.ds-metrics__spacer {
  flex: 1 1 auto;
}

.ds-metrics__stream {
  font-size: 12px;
  color: var(--el-text-color-secondary);

  &.is-open {
    color: var(--status-success, var(--el-color-success));
  }

  &.is-error {
    color: var(--status-warning, var(--el-color-warning));
  }
}

.ds-metrics__hint {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.ds-metrics__chart {
  margin-top: 8px;
  min-height: 0;
}

/* 嵌入模式：图占满面板剩余高度，而不是固定 200px 后底下留白 */
.ds-metrics.is-embedded .ds-metrics__chart {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
}

/* 图表脚注：点数/间隔/最新时刻。写清楚是必要的 —— 后端抽稀后返回的点不是原始
   采样数，不标出来用户会以为「中间丢数据」是 bug */
.ds-metrics__foot {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--el-text-color-tertiary, var(--el-text-color-secondary));
}

/* 与另两个页签等高：占位时吃满可用高度并居中，否则切页签内容区会跳 */
.ds-metrics__empty {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
}
</style>