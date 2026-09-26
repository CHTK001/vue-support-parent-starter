<template>
  <div class="ngx-overview" v-loading="loading">
    <!-- 运行状态横幅 -->
    <div class="ngx-banner" :class="bannerClass">
      <div class="ngx-banner-left">
        <span class="ngx-dot" />
        <div class="ngx-banner-text">
          <div class="ngx-banner-title">
            {{ runningText }}
            <span v-if="overview?.version?.version" class="ngx-banner-ver mono">
              {{ overview.version.version }}
            </span>
          </div>
          <div class="ngx-banner-sub">
            <template v-if="overview?.masterPid">
              master PID {{ overview.masterPid }}
              <template v-if="overview.uptimeText"> · 已运行 {{ overview.uptimeText }}</template>
            </template>
            <template v-else>未读到 master 进程信息</template>
          </div>
        </div>
      </div>
      <NginxLifecycleBar :datasource-id="datasourceId" :running="overview?.running" @changed="emit('changed')" />
    </div>

    <!-- 核心指标 -->
    <div class="ngx-kpis">
      <div class="ngx-kpi c-brand">
        <div class="ngx-kpi-label">活跃连接</div>
        <div class="ngx-kpi-value">{{ overview?.status?.activeConnections ?? "—" }}</div>
      </div>
      <div class="ngx-kpi c-blue">
        <div class="ngx-kpi-label">累计请求</div>
        <div class="ngx-kpi-value">{{ formatNumber(overview?.status?.requests) }}</div>
      </div>
      <div class="ngx-kpi c-violet">
        <div class="ngx-kpi-label">配置文件</div>
        <div class="ngx-kpi-value">{{ overview?.configFileCount ?? "—" }}</div>
        <div class="ngx-kpi-extra">{{ formatSize(overview?.configTotalSize) }}</div>
      </div>
      <div class="ngx-kpi c-amber">
        <div class="ngx-kpi-label">日志文件</div>
        <div class="ngx-kpi-value">{{ overview?.logFiles?.length ?? "—" }}</div>
        <div class="ngx-kpi-extra">总计 {{ formatSize(totalLogSize) }}</div>
      </div>
    </div>

    <div class="ngx-grid">
      <!-- 连接状态分布 -->
      <ReCard :radius="12" shadow="never" class="ngx-card">
        <template #header>
          <div class="ngx-card-head">
            <span>连接状态分布</span>
            <span v-if="overview?.status?.source" class="ngx-card-sub mono" :title="overview.status.source">
              {{ overview.status.source }}
            </span>
          </div>
        </template>
        <template v-if="overview?.status?.available">
          <div class="ngx-bar">
            <div
              class="ngx-bar-seg is-reading"
              :style="{ flexGrow: Math.max(overview.status.reading ?? 0, 0.001) }"
              :title="`读取请求头 ${overview.status.reading ?? 0}`"
            />
            <div
              class="ngx-bar-seg is-writing"
              :style="{ flexGrow: Math.max(overview.status.writing ?? 0, 0.001) }"
              :title="`正在处理 ${overview.status.writing ?? 0}`"
            />
            <div
              class="ngx-bar-seg is-waiting"
              :style="{ flexGrow: Math.max(overview.status.waiting ?? 0, 0.001) }"
              :title="`空闲等待 ${overview.status.waiting ?? 0}`"
            />
          </div>
          <div class="ngx-legend">
            <span><i class="is-reading" />读取 {{ overview.status.reading ?? 0 }}</span>
            <span><i class="is-writing" />处理 {{ overview.status.writing ?? 0 }}</span>
            <span><i class="is-waiting" />等待 {{ overview.status.waiting ?? 0 }}</span>
          </div>
          <div class="ngx-meta">
            <span>接受 {{ formatNumber(overview.status.accepts) }}</span>
            <span>处理 {{ formatNumber(overview.status.handled) }}</span>
          </div>
        </template>
        <template v-else>
          <div class="ngx-hint">
            <ReIcon name="Warning" :size="14" />
            <div>
              <div class="ngx-hint-title">未取到 stub_status 实时数据</div>
              <div class="ngx-hint-body">{{ overview?.status?.message || "未知原因" }}</div>
              <div class="ngx-hint-body">
                需要在配置里加 <code>stub_status;</code> 并配一个只允许内网访问的 location，详见「模板库」。
              </div>
            </div>
          </div>
        </template>
      </ReCard>

      <!-- 站点与端口 -->
      <ReCard :radius="12" shadow="never" class="ngx-card">
        <template #header><span>站点与端口</span></template>
        <div class="ngx-label">监听端口</div>
        <div v-if="overview?.listenPorts?.length" class="ngx-tags">
          <ReTag
            v-for="p in overview.listenPorts"
            :key="p"
            size="small"
            :type="p === 443 || p === 8443 ? 'success' : p === 80 || p === 8080 ? 'info' : 'warning'"
          >
            {{ p }}
          </ReTag>
        </div>
        <div v-else class="ngx-dim">未从配置里解析到 listen 指令</div>

        <div class="ngx-label">主配置</div>
        <div class="ngx-mono ngx-break">{{ overview?.configPath || "—" }}</div>
        <div class="ngx-label">配置根目录</div>
        <div class="ngx-mono ngx-break">{{ overview?.configRoot || "—" }}</div>
      </ReCard>

      <!-- 巡检提示 -->
      <ReCard :radius="12" shadow="never" class="ngx-card">
        <template #header>
          <div class="ngx-card-head">
            <span>巡检提示</span>
            <ReTag v-if="overview?.issues?.length" size="small" type="warning">
              {{ overview.issues.length }} 条
            </ReTag>
            <ReTag v-else size="small" type="success">一切正常</ReTag>
          </div>
        </template>
        <ul v-if="overview?.issues?.length" class="ngx-issues">
          <li v-for="(issue, i) in overview.issues" :key="i">{{ issue }}</li>
        </ul>
        <div v-else class="ngx-dim">未发现问题：进程在跑、配置语法通过、实时状态可读。</div>
      </ReCard>

      <!-- 编译参数 -->
      <ReCard :radius="12" shadow="never" class="ngx-card">
        <template #header>
          <div class="ngx-card-head">
            <span>编译参数</span>
            <span class="ngx-card-sub">决定本机能用哪些模块与指令</span>
          </div>
        </template>
        <pre class="ngx-conf">{{ overview?.version?.configureArguments || "—" }}</pre>
      </ReCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import NginxLifecycleBar from "./NginxLifecycleBar.vue";
import { fetchNginxOverview, type NginxOverview } from "../../nginx/api";

const props = defineProps<{
  /** 加载中的状态由父级控制 */
  loading: boolean;
  /** 数据源 ID */
  datasourceId?: number;
  /** 总览数据 */
  overview: NginxOverview | null;
}>();

const emit = defineEmits<{
  (e: "changed"): void;
}>();

const runningText = computed(() => {
  const r = props.overview?.running;
  if (r === "RUNNING") {
    return "运行中";
  }
  if (r === "STOPPED") {
    return "已停止";
  }
  return "状态未知";
});

const bannerClass = computed(() => {
  const r = props.overview?.running;
  if (r === "RUNNING") {
    return "is-running";
  }
  if (r === "STOPPED") {
    return "is-stopped";
  }
  return "is-unknown";
});

const totalLogSize = computed(() =>
  (props.overview?.logFiles || []).reduce((sum, f) => sum + (f.size || 0), 0),
);

/** 千分位；空值显示为破折号 */
function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) {
    return "—";
  }
  return n.toLocaleString("en-US");
}

/** 字节数转可读文本 */
function formatSize(bytes: number | null | undefined): string {
  if (!bytes) {
    return "—";
  }
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

defineExpose({ formatSize, formatNumber, fetchNginxOverview });
</script>

<style scoped lang="scss">
.ngx-overview {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 状态横幅 */
.ngx-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 14px 18px;
  border-radius: var(--el-border-radius-lg, 12px);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);

  &.is-running {
    border-color: color-mix(in srgb, var(--el-color-success) 30%, transparent);
    background: color-mix(in srgb, var(--el-color-success) 6%, var(--el-bg-color));
  }

  &.is-stopped {
    border-color: color-mix(in srgb, var(--el-color-danger) 30%, transparent);
    background: color-mix(in srgb, var(--el-color-danger) 6%, var(--el-bg-color));
  }
}

.ngx-banner-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ngx-dot {
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  background: var(--el-color-info);

  .is-running & {
    background: var(--el-color-success);
    animation: ngx-breathe 1.8s ease-in-out infinite;
  }

  .is-stopped & {
    background: var(--el-color-danger);
  }
}

@keyframes ngx-breathe {
  0%,
  100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--el-color-success) 45%, transparent);
  }
  50% {
    box-shadow: 0 0 0 6px color-mix(in srgb, var(--el-color-success) 0%, transparent);
  }
}

.ngx-banner-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.ngx-banner-ver {
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.ngx-banner-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

/* KPI */
.ngx-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.ngx-kpi {
  position: relative;
  padding: 14px 16px 14px 18px;
  border-radius: var(--el-border-radius-lg, 12px);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  overflow: hidden;

  /* 语义色左条：色值全部走令牌，不写死 */
  &::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
  }

  &.c-brand::before {
    background: var(--metric-cpu, var(--el-color-primary));
  }
  &.c-blue::before {
    background: var(--metric-net, var(--el-color-primary));
  }
  &.c-violet::before {
    background: var(--el-color-primary);
  }
  &.c-amber::before {
    background: var(--el-color-warning);
  }
}

.ngx-kpi-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ngx-kpi-value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.25;
  margin-top: 4px;
  font-variant-numeric: tabular-nums;
}

.ngx-kpi-extra {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 卡片网格 */
.ngx-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 12px;
}

.ngx-card {
  padding: 14px 16px;
}

.ngx-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ngx-card-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 400;
}

.ngx-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin: 10px 0 4px;

  &:first-of-type {
    margin-top: 0;
  }
}

.ngx-dim {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.ngx-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}

.ngx-break {
  word-break: break-all;
}

.ngx-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* 连接分布条 */
.ngx-bar {
  display: flex;
  height: 10px;
  border-radius: 9999px;
  overflow: hidden;
  background: var(--el-fill-color-light);
}

.ngx-bar-seg {
  min-width: 2px;
  transition: flex-grow 0.4s ease;

  &.is-reading {
    background: var(--el-color-primary);
  }
  &.is-writing {
    background: var(--el-color-warning);
  }
  &.is-waiting {
    background: var(--el-color-success);
  }
}

.ngx-legend {
  display: flex;
  gap: 14px;
  margin-top: 10px;
  font-size: 12px;
  color: var(--el-text-color-regular);

  i {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 2px;
    margin-right: 4px;

    &.is-reading {
      background: var(--el-color-primary);
    }
    &.is-writing {
      background: var(--el-color-warning);
    }
    &.is-waiting {
      background: var(--el-color-success);
    }
  }
}

.ngx-meta {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 提示块 */
.ngx-hint {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: var(--el-text-color-regular);

  code {
    padding: 1px 4px;
    border-radius: 4px;
    background: var(--el-fill-color-light);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  }
}

.ngx-hint-title {
  font-weight: 600;
  color: var(--el-color-warning);
  margin-bottom: 4px;
}

.ngx-hint-body {
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.ngx-issues {
  margin: 0;
  padding-left: 18px;
  font-size: 12.5px;
  line-height: 1.75;
  color: var(--el-text-color-regular);

  li::marker {
    color: var(--el-color-warning);
  }
}

.ngx-conf {
  margin: 0;
  max-height: 180px;
  overflow: auto;
  padding: 10px 12px;
  border-radius: var(--el-border-radius-base, 6px);
  background: var(--el-fill-color-light);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11.5px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--el-text-color-regular);
}
</style>
