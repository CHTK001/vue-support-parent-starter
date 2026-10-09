<template>
  <div class="dsm tel-page">
    <!-- 顶栏 -->
    <div class="dsm-toolbar">
      <div class="dsm-toolbar-left">
        <ReIcon name="DataLine" :size="18" class="dsm-title-icon dsm-prom-icon" />
        <span class="dsm-title">Prometheus 服务管理</span>
        <span class="prm-state" :class="stateClass">
          <i class="prm-state-dot" />
          {{ statusText }}
        </span>
        <span v-if="metaText" class="prm-meta">{{ metaText }}</span>
      </div>

      <div class="dsm-toolbar-right">
        <div class="dsm-db-select">
          <ReSelect :model-value="datasourceId" data-testid="prm-select-source" placeholder="选择实例" @change="onSwitchSource">
            <ReOption
              v-for="d in sources"
              :key="d.id"
              :value="d.id"
              :label="d.name || `${d.host}:${d.port || 9090}`"
            />
          </ReSelect>
        </div>

        <ReButton
          layout="square"
          icon="Refresh"
          tip="刷新"
          data-testid="prm-btn-refresh"
          :loading="overviewLoading"
          @click="reloadOverview"
        />
      </div>
    </div>

    <MiddlewareGap v-if="gap" :text="gap" />

    <div v-else class="dsm-body">
      <!-- 左侧菜单 -->
      <aside class="dsm-sidebar prm-nav">
        <div class="dsm-view-bar">
          <span class="prm-nav-title">PROMETHEUS 控制台</span>
        </div>
        <div class="prm-nav-list">
          <button
            v-for="t in tabs"
            :key="t.name"
            class="prm-nav-item"
            :class="{ active: activeTab === t.name }"
            type="button"
            :data-testid="`prm-tab-${t.name}`"
            @click="goTab(t.name)"
          >
            <ReIcon :name="t.icon" :size="14" class="prm-nav-icon" />
            <span>{{ t.label }}</span>
          </button>
        </div>
      </aside>

      <!-- 内容区 -->
      <section class="prm-main">
        <PromOverviewPanel
          v-if="activeTab === 'overview'"
          v-loading="overviewLoading"
          :loading="overviewLoading"
          :data="overview"
        />
        <PromQueryPanel v-else-if="activeTab === 'query'" :datasource-id="datasourceId" />
        <PromMonitorPanel v-else-if="activeTab === 'monitor'" :datasource-id="datasourceId" />
        <PromConfigPanel v-else-if="activeTab === 'config'" :datasource-id="datasourceId" />
        <PromLayoutPanel v-else-if="activeTab === 'layout'" :datasource-id="datasourceId" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts" name="PrometheusManageView">
/**
 * Prometheus 控制台：总览 / 查询 / 监控 / 配置 / 自定义看板。
 */
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import ReButton from "@repo/ui/re-button";
import ReIcon from "@repo/ui/re-icon";
import ReSelect from "@repo/ui/re-select";
import { ReOption } from "@repo/ui/re-kit";
import MiddlewareGap from "../../components/console/MiddlewareGap.vue";
import PromOverviewPanel from "../../components/console/prometheus/PromOverviewPanel.vue";
import PromQueryPanel from "../../components/console/prometheus/PromQueryPanel.vue";
import PromMonitorPanel from "../../components/console/prometheus/PromMonitorPanel.vue";
import PromConfigPanel from "../../components/console/prometheus/PromConfigPanel.vue";
import PromLayoutPanel from "../../components/console/prometheus/PromLayoutPanel.vue";
import { useMiddlewareSource } from "../../utils/middlewareSource";
import { fetchPrometheusOverview, fetchPrometheusSources, type PromOverview } from "../../api/prometheus/api";

const { datasourceId, source, gap, bind, ready, fail } = useMiddlewareSource();

const tabs = [
  { name: "overview", label: "总览", icon: "Odometer" },
  { name: "query", label: "查询", icon: "Search" },
  { name: "monitor", label: "监控", icon: "Monitor" },
  { name: "config", label: "配置", icon: "Setting" },
  { name: "layout", label: "自定义布局", icon: "Grid" },
] as const;

const activeTab = ref<(typeof tabs)[number]["name"]>("overview");

const sources = ref<Awaited<ReturnType<typeof fetchPrometheusSources>>>([]);
const overview = ref<PromOverview | null>(null);
const overviewLoading = ref(false);

/** 顶栏状态：可达 / 不可达 / 加载中 / 未知 */
const statusText = computed(() => {
  if (overviewLoading.value) {
    return "加载中";
  }
  if (!overview.value) {
    return "状态未知";
  }
  return overview.value.reachable ? "运行中" : "不可达";
});

const stateClass = computed(() => ({
  "is-running": !overviewLoading.value && overview.value?.reachable === true,
  "is-stopped": !overviewLoading.value && overview.value?.reachable === false,
  "is-unknown": !overviewLoading.value && !overview.value,
  "is-loading": overviewLoading.value,
}));

/** 版本信息进顶栏 */
const metaText = computed(() => {
  const o = overview.value;
  if (!o) {
    return "";
  }
  const parts: string[] = [];
  if (o.version) {
    parts.push(`v${o.version}`);
  }
  if (o.revision) {
    parts.push(o.revision.slice(0, 8));
  }
  if (source.value) {
    parts.push(`${source.value.host}:${source.value.port || 9090}`);
  }
  return parts.join(" · ");
});

function goTab(name: (typeof tabs)[number]["name"]): void {
  activeTab.value = name;
}

async function reloadOverview(): Promise<void> {
  if (!datasourceId.value) {
    overview.value = null;
    return;
  }
  overviewLoading.value = true;
  try {
    overview.value = await fetchPrometheusOverview(datasourceId.value);
    ready();
  } catch (e) {
    overview.value = null;
    fail(e, "/ms/monitor/prometheus/overview");
    ElMessage.error(`总览加载失败：${(e as Error)?.message ?? e}`);
  } finally {
    overviewLoading.value = false;
  }
}

async function onSwitchSource(id: number): Promise<void> {
  datasourceId.value = id;
  overview.value = null;
  await bind("prometheus");
  if (datasourceId.value) {
    await reloadOverview();
  }
}

onMounted(async () => {
  try {
    sources.value = (await fetchPrometheusSources()) || [];
  } catch {
    // 列表拿不到时下拉为空，不影响已选数据源的使用
  }
  await bind("prometheus");
  if (datasourceId.value) {
    await reloadOverview();
  }
});
</script>

<style scoped lang="scss">
/* 整页：与 nginx 控制台同款 dsm 壳（用户要求：背景非白 + 6px 间距） */
.dsm {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  background: var(--bg-fill);
}

.dsm-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 16px;
}

.dsm-toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.dsm-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.dsm-prom-icon {
  color: #e6522c;
}

.dsm-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.dsm-db-select {
  width: 200px;
  flex-shrink: 0;
}

/* 运行状态胶囊：与 nginx 同款五态 */
.prm-state {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 9px;
  border-radius: 9999px;
  font-size: 12px;
  line-height: 18px;
  border: 1px solid transparent;
  white-space: nowrap;

  &.is-running {
    color: var(--status-success);
    background: color-mix(in srgb, var(--status-success) 12%, transparent);
    border-color: color-mix(in srgb, var(--status-success) 32%, transparent);
  }

  &.is-stopped {
    color: var(--status-error);
    background: color-mix(in srgb, var(--status-error) 12%, transparent);
    border-color: color-mix(in srgb, var(--status-error) 32%, transparent);
  }

  &.is-unknown {
    color: var(--text-secondary);
    background: var(--bg-fill);
    border-color: var(--border-subtle);
  }

  &.is-loading {
    color: var(--brand-500);
    background: color-mix(in srgb, var(--brand-500) 12%, transparent);
    border-color: color-mix(in srgb, var(--brand-500) 32%, transparent);
  }
}

.prm-state-dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: currentColor;
}

.prm-meta {
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 主体布局（对齐 nginx：侧栏白卡片 + 6px 间距） */
.dsm-body {
  display: flex;
  flex: 1;
  gap: 6px;
  overflow: hidden;
  min-height: 0;
}

.prm-nav {
  width: 180px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-container);
  overflow: hidden;
}

.dsm-view-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.prm-nav-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text-tertiary);
}

.prm-nav-list {
  flex: 1;
  padding: 6px 0;
  overflow-y: auto;
}

.prm-nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 6px 12px;
  border: 0;
  background: transparent;
  font-size: 13px;
  text-align: left;
  color: var(--text-primary);
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: var(--bg-hover);
  }

  &.active {
    background: var(--brand-50);
    color: var(--brand-600);
    font-weight: 600;
  }
}

.prm-nav-icon {
  flex-shrink: 0;
}

.prm-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
}

.prm-main > * {
  min-height: 100%;
}
</style>