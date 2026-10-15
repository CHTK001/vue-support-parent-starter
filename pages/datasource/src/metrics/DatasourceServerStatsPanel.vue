<template>
  <div class="ds-server-stats">
    <header class="ds-server-stats__head">
      <h3 class="ds-server-stats__title">其它信息</h3>
      <button
        v-if="isNginx"
        type="button"
        class="ds-server-stats__refresh"
        :disabled="nginxLoading"
        :title="nginxLoading ? '统计访问日志中' : '刷新 URL 指标'"
        @click="loadNginxUrlStats"
      >
        <span class="ds-server-stats__refresh-icon" :class="{ 'is-spinning': nginxLoading }">↻</span>
      </button>
      <span class="ds-server-stats__tag" :class="{ 'is-live': hasStats, 'is-waiting': isWaiting }">
        {{ tagText }}
      </span>
    </header>

    <template v-if="isJdbcMysql">
      <dl class="ds-server-stats__grid">
        <div v-for="row in rows" :key="row.label" class="ds-server-stats__item" :title="row.hint">
          <dt>{{ row.label }}</dt>
          <dd :class="{ mono: row.mono, 'is-empty': row.isEmpty }">{{ row.value }}</dd>
        </div>
      </dl>
      <p v-if="!hasStats" class="ds-server-stats__note">
        MySQL 不暴露宿主机 CPU，这里用活跃线程反映 SQL 侧负载
      </p>
    </template>

    <template v-else-if="isNginx">
      <dl class="ds-server-stats__grid">
        <div v-for="row in nginxRows" :key="row.label" class="ds-server-stats__item" :title="row.hint">
          <dt>{{ row.label }}</dt>
          <dd :class="{ mono: row.mono, 'is-empty': row.isEmpty }">{{ row.value }}</dd>
        </div>
      </dl>

      <div v-if="nginxTop?.paths?.length" class="ds-server-stats__url">
        <div class="ds-server-stats__url-title">URL Top <span>· 日志尾部 {{ numberText(nginxTop.scanned) }} 行</span></div>
        <ol class="ds-server-stats__url-list">
          <li v-for="p in nginxTop.paths.slice(0, 5)" :key="p.key" class="ds-server-stats__url-item">
            <span class="ds-server-stats__url-key mono" :title="p.key">{{ p.key }}</span>
            <span class="ds-server-stats__url-hit">{{ p.hits.toLocaleString("zh-CN") }}<i>{{ pctOfTop(p.hits) }}%</i></span>
          </li>
        </ol>
        <p v-if="nginxTop.message" class="ds-server-stats__note">{{ nginxTop.message }}</p>
      </div>
      <p v-else-if="nginxLoading" class="ds-server-stats__empty">正在统计访问日志…</p>
      <p v-else-if="nginxError" class="ds-server-stats__empty">{{ nginxError }}</p>
      <p v-else class="ds-server-stats__empty">暂无 URL 访问统计</p>
    </template>

    <p v-else class="ds-server-stats__empty">{{ unsupportedText }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { DatasourceMetricPoint } from "../api";
import {
  fetchNginxAccessTop,
  type NginxAccessTop,
} from "../api/nginx/api";

const props = defineProps<{
  /** 数据源 ID；nginx 类型用于实时拉取 URL 访问统计 */
  datasourceId?: number;
  /** 数据源类型键，如 jdbc / redis / nginx */
  type?: string;
  /** jdbc 类型时可能是完整 JDBC URL，也可能是普通库名 */
  url?: string | null;
  /** JDBC 驱动类名；用于识别 MySQL/MariaDB（库名形态时 URL 不含方言前缀） */
  driverClassName?: string | null;
  /** 最新采样点（含服务器指标） */
  latest?: DatasourceMetricPoint | null;
}>();

const isNginx = computed(() => props.type === "nginx");

const isJdbcMysql = computed(() => {
  const u = (props.url || "").trim().toLowerCase();
  const driver = (props.driverClassName || "").toLowerCase();
  if (props.type !== "jdbc") {
    return false;
  }
  if (u.startsWith("jdbc:")) {
    return u.startsWith("jdbc:mysql:") || u.startsWith("jdbc:mariadb:")
      || driver.includes("mysql") || driver.includes("mariadb");
  }
  // 台账只存主机/端口/库名时，后端统一按 jdbc:mysql 拼串（库名若直填完整 URL 走上面分支）
  return true;
});

const stats = computed(() => props.latest?.serverStats ?? null);
const hasStats = computed(() =>
  isJdbcMysql.value ? stats.value !== null && stats.value !== undefined
    : isNginx.value ? nginxTop.value !== null
      : false,
);
const isWaiting = computed(() => (isJdbcMysql.value || isNginx.value) && !hasStats.value);

const nginxTop = ref<NginxAccessTop | null>(null);
const nginxLoading = ref(false);
const nginxError = ref("");

async function loadNginxUrlStats(): Promise<void> {
  if (!isNginx.value || !props.datasourceId) {
    nginxTop.value = null;
    nginxError.value = "";
    return;
  }
  nginxLoading.value = true;
  nginxError.value = "";
  try {
    nginxTop.value = await fetchNginxAccessTop(props.datasourceId, 2000, 0, 5);
  } catch (e) {
    nginxTop.value = null;
    nginxError.value = e instanceof Error ? e.message : String(e);
  } finally {
    nginxLoading.value = false;
  }
}

watch(
  () => [props.type, props.datasourceId],
  () => { void loadNginxUrlStats(); },
  { immediate: true },
);

const tagText = computed(() => {
  if (isNginx.value) {
    if (nginxTop.value) return "Nginx / URL";
    if (nginxError.value) return "暂无 URL";
    if (nginxLoading.value) return "统计中";
    return "等待采集";
  }
  if (!isJdbcMysql.value) {
    return "暂未采集";
  }
  if (!props.latest) {
    return "等待采集";
  }
  return hasStats.value ? "MySQL / MariaDB" : "暂无指标";
});

const unsupportedText = computed(() =>
  props.latest ? "当前类型暂未采集服务器指标（仅支持 MySQL / MariaDB）" : "正在等待第一次采集（约 1 分钟内）",
);

function numberText(v: number | null | undefined): string {
  return v === null || v === undefined ? "—" : v.toLocaleString("zh-CN");
}

function formatSize(v: number | null | undefined): string {
  if (v === null || v === undefined || v < 0) return "—";
  if (v < 1024) return `${v} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let n = v;
  let i = -1;
  do {
    n /= 1024;
    i += 1;
  } while (n >= 1024 && i < units.length - 1);
  return `${Number(n.toFixed(1)).toLocaleString("zh-CN")} ${units[i]}`;
}

function pctOfTop(hits: number): number {
  const total = nginxTop.value?.total;
  if (!total || !hits) return 0;
  return Math.round((hits / total) * 1000) / 10;
}

const avgQps = computed<string>(() => {
  const q = stats.value?.questions;
  const u = stats.value?.uptimeSeconds;
  if (q === null || q === undefined || u === null || u === undefined || u <= 0) {
    return "—";
  }
  return Number((q / u).toFixed(1)).toLocaleString("zh-CN");
});

const uptimeText = computed<string>(() => {
  const s = stats.value?.uptimeSeconds;
  if (s === null || s === undefined || s < 0) {
    return "—";
  }
  const total = Math.floor(s);
  if (total < 60) {
    return `${total} 秒`;
  }
  const minutes = Math.floor(total / 60);
  if (minutes < 60) {
    return `${minutes} 分钟`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 48) {
    return `${hours} 小时 ${minutes % 60} 分`;
  }
  return `${Math.floor(hours / 24)} 天 ${hours % 24} 小时`;
});

const rows = computed(() => [
  {
    label: "慢查询数",
    value: numberText(stats.value?.slowQueries),
    hint: "服务器启动以来的累计慢查询数",
    mono: true,
    isEmpty: stats.value?.slowQueries === null || stats.value?.slowQueries === undefined,
  },
  {
    label: "活跃线程",
    value: numberText(stats.value?.threadsRunning),
    hint: "正在执行的线程数，MySQL 侧负载的近似指标",
    mono: true,
    isEmpty: stats.value?.threadsRunning === null || stats.value?.threadsRunning === undefined,
  },
  {
    label: "当前连接",
    value: numberText(props.latest?.connectionCount),
    hint: "本次采样时的客户端连接数",
    mono: true,
    isEmpty: props.latest?.connectionCount === null || props.latest?.connectionCount === undefined,
  },
  {
    label: "峰值连接",
    value: numberText(stats.value?.maxUsedConnections),
    hint: "服务器历史峰值客户端连接数",
    mono: true,
    isEmpty: stats.value?.maxUsedConnections === null || stats.value?.maxUsedConnections === undefined,
  },
  {
    label: "平均 QPS",
    value: avgQps.value,
    hint: "开机累计提问次数 ÷ 已运行秒数",
    mono: true,
    isEmpty: stats.value?.questions === null || stats.value?.questions === undefined,
  },
  {
    label: "运行时长",
    value: uptimeText.value,
    hint: "服务器本次启动后的运行时间",
    mono: false,
    isEmpty: stats.value?.uptimeSeconds === null || stats.value?.uptimeSeconds === undefined,
  },
]);

const nginxRows = computed(() => {
  const top = nginxTop.value;
  const errs = top ? (top.clientErrors ?? 0) + (top.serverErrors ?? 0) : null;
  const errorRate = top?.total ? Math.round((errs! / top.total) * 1000) / 10 : null;
  return [
    {
      label: "URL 请求",
      value: numberText(top?.total),
      hint: "本次扫描成功解析的访问日志行数",
      mono: true,
      isEmpty: top === null,
    },
    {
      label: "4xx",
      value: numberText(top?.clientErrors),
      hint: "客户端错误请求数",
      mono: true,
      isEmpty: top === null,
    },
    {
      label: "5xx",
      value: numberText(top?.serverErrors),
      hint: "服务端错误请求数",
      mono: true,
      isEmpty: top === null,
    },
    {
      label: "独立 IP",
      value: numberText(top?.uniqueIps),
      hint: "本次扫描覆盖到的独立客户端 IP 总数",
      mono: true,
      isEmpty: top === null,
    },
    {
      label: "出站流量",
      value: formatSize(top?.bytesSent),
      hint: "access log 中 $body_bytes_sent 之和（响应体字节）",
      mono: true,
      isEmpty: top === null || top?.bytesSent === null,
    },
    {
      label: "错误率",
      value: errorRate === null ? "—" : `${errorRate}%`,
      hint: "（4xx + 5xx）÷ 成功解析行数",
      mono: true,
      isEmpty: errorRate === null,
    },
  ];
});
</script>

<style scoped lang="scss">
.ds-server-stats {
  min-width: 0;
}

.ds-server-stats__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.ds-server-stats__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1f2430);
}

.ds-server-stats__refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-tertiary, #6b7280);
  cursor: pointer;

  &:hover {
    background: var(--bg-hover, #f2f3f7);
    color: var(--text-primary, #1f2430);
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
}

.ds-server-stats__refresh-icon {
  font-size: 15px;
  line-height: 1;

  &.is-spinning {
    animation: ds-server-stats-spin 0.9s linear infinite;
  }
}

@keyframes ds-server-stats-spin {
  to { transform: rotate(360deg); }
}

.ds-server-stats__tag {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-tertiary, #6b7280);

  &.is-live {
    color: var(--status-success, var(--el-color-success));
  }

  &.is-waiting {
    color: var(--text-tertiary, #6b7280);
  }
}

.ds-server-stats__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0 18px;
  margin: 0;
}

.ds-server-stats__item {
  min-width: 0;
  padding: 7px 0;
  border-bottom: 1px solid var(--border-subtle, #eef0f6);
}

.ds-server-stats__item dt {
  font-size: 12px;
  color: var(--text-secondary, #5c6270);
}

.ds-server-stats__item dd {
  margin: 3px 0 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1f2430);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.is-empty {
    color: var(--text-tertiary, #6b7280);
    font-weight: 400;
  }

  &.mono {
    font-variant-numeric: tabular-nums;
    font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  }
}

.ds-server-stats__url {
  margin-top: 6px;
}

.ds-server-stats__url-title {
  display: flex;
  gap: 4px;
  margin: 8px 0 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #5c6270);

  span {
    font-weight: 400;
    color: var(--text-tertiary, #6b7280);
  }
}

.ds-server-stats__url-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.ds-server-stats__url-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding: 4px 0;
  font-size: 12px;
  border-bottom: 1px solid var(--border-subtle, #eef0f6);
}

.ds-server-stats__url-key {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary, #1f2430);
}

.ds-server-stats__url-hit {
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary, #5c6270);

  i {
    margin-left: 6px;
    font-style: normal;
    color: var(--text-tertiary, #6b7280);
  }
}

.ds-server-stats__empty {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-tertiary, #6b7280);
}

.ds-server-stats__note {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-tertiary, #6b7280);
}

@media (max-width: 520px) {
  .ds-server-stats__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>