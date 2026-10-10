<template>
  <div class="dsm tel-page">
    <!-- 顶栏：与 Redis/ZK/etcd 等控制台同款（左=图标+标题+运行状态；右=模式/实例/操作） -->
    <!-- 顶部工具条：卡片视觉（圆角/透明边框/双层投影）走 re-surface 统一底座 -->
    <div class="dsm-toolbar re-surface">
      <div class="dsm-toolbar-left">
        <ReIcon name="Connection" :size="18" class="dsm-title-icon dsm-nginx-icon" />
        <span class="dsm-title">Nginx 服务管理</span>
        <span class="ngm-state" :class="stateClass">
          <i class="ngm-state-dot" />
          {{ statusText }}
        </span>
        <span v-if="metaText" class="ngm-meta">{{ metaText }}</span>
      </div>

      <div class="dsm-toolbar-right">
        <div class="dsm-seg ngm-mode" role="group" aria-label="使用模式">
          <button
            type="button"
            data-testid="ngm-mode-standard"
            :class="{ 'is-active': mode === 'standard' }"
            @click="mode = 'standard'"
          >
            标准
          </button>
          <button
            type="button"
            data-testid="ngm-mode-newbie"
            :class="{ 'is-active': mode === 'newbie' }"
            @click="mode = 'newbie'"
          >
            新人
          </button>
        </div>

        <div class="dsm-db-select">
          <ReSelect
            :model-value="datasourceId"
            placeholder="选择实例"
            @change="onSwitchSource"
          >
            <ReOption
              v-for="d in sources"
              :key="d.id"
              :value="d.id"
              :label="d.name || `${d.host}:${d.port || 22}`"
            />
          </ReSelect>
        </div>

        <ReButton
          layout="square"
          icon="Refresh"
          tip="刷新"
          data-testid="ngm-btn-refresh"
          :loading="overviewLoading"
          @click="reloadOverview"
        />

        <NginxLifecycleBar
          :datasource-id="datasourceId"
          :running="overview?.running"
          @changed="onLifecycleChanged"
        />
      </div>
    </div>

    <!-- 新人模式引导条 -->
    <ReAlert v-if="isNewbie" type="success" class="ngm-guide">
      <template #title>
        <div class="ngm-guide-body">
          <div>
            <strong>第一次用？</strong>
            建议按这个顺序：
            <a class="ngm-link" @click="goTab('template')">① 挑模板生成配置</a>
            →
            <a class="ngm-link" @click="goTab('config')">② 在表单模式里微调</a>
            →
            <a class="ngm-link" @click="goTab('overview')">③ 看总览确认状态</a>
            →
            点顶部「重载」生效。
          </div>
          <div class="ngm-guide-sub">
            任何一步不确定，都可以先点「校验配置」——它只做语法检查，不会动正在跑的服务。
          </div>
        </div>
      </template>
    </ReAlert>

    <MiddlewareGap v-if="gap" :text="gap" />

    <div v-else class="dsm-body">
      <!-- 左侧菜单（统一皮肤：对齐 Redis/etcd 侧栏列表样式） -->
      <aside class="dsm-sidebar ngm-nav">
        <div class="dsm-view-bar">
          <span class="ngm-nav-title">NGINX 控制台</span>
        </div>
        <div class="ngm-nav-list">
          <button
            v-for="t in tabs"
            :key="t.name"
            class="ngm-nav-item"
            :class="{ active: activeTab === t.name }"
            type="button"
            @click="goTab(t.name)"
          >
            <ReIcon :name="t.icon" :size="14" class="ngm-nav-icon" />
            <span>{{ t.label }}</span>
          </button>
        </div>
      </aside>

      <!-- 内容区 -->
      <section class="ngm-main">
        <NginxOverviewPanel
          v-if="activeTab === 'overview'"
          :loading="overviewLoading"
          :datasource-id="datasourceId"
          :overview="overview"
          :load-error="overviewError"
          :endpoint="endpointText"
          @changed="reloadOverview"
        />
        <NginxSitePanel
          v-else-if="activeTab === 'site'"
          :datasource-id="datasourceId"
          @edit="onEditSite"
        />
        <NginxConfigPanel
          v-else-if="activeTab === 'config'"
          ref="configPanel"
          :datasource-id="datasourceId"
          :newbie="isNewbie"
          :focus-node-path="focusNodePath"
          @changed="reloadOverview"
        />
        <NginxLogPanel v-else-if="activeTab === 'log'" :datasource-id="datasourceId" />
        <NginxBackupPanel
          v-else-if="activeTab === 'backup'"
          :datasource-id="datasourceId"
          @changed="reloadOverview"
        />
        <NginxTemplatePanel
          v-else-if="activeTab === 'template'"
          :datasource-id="datasourceId"
          @saved="onTemplateSaved"
        />
        <NgxLayoutPanel v-else-if="activeTab === 'layout'" :datasource-id="datasourceId" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import ReButton from "@repo/ui/re-button";
import ReIcon from "@repo/ui/re-icon";
import ReSelect from "@repo/ui/re-select";
import { ReAlert, ReOption } from "@repo/ui/re-kit";
// 卡片视觉统一底座（16px 圆角/透明边框/双层投影，见 packages/ui shared/re-surface.css）
import "@repo/ui/surface";
import MiddlewareGap from "../../components/console/MiddlewareGap.vue";
import NginxLifecycleBar from "../../components/console/NginxLifecycleBar.vue";
import NginxOverviewPanel from "../../components/console/NginxOverviewPanel.vue";
import NginxSitePanel from "../../components/console/NginxSitePanel.vue";
import NginxConfigPanel from "../../components/console/NginxConfigPanel.vue";
import NginxLogPanel from "../../components/console/NginxLogPanel.vue";
import NginxBackupPanel from "../../components/console/NginxBackupPanel.vue";
import NginxTemplatePanel from "../../components/console/NginxTemplatePanel.vue";
import NgxLayoutPanel from "../../components/console/nginx/NgxLayoutPanel.vue";
import { useMiddlewareSource } from "../../utils/middlewareSource";
import { fetchNginxOverview, fetchNginxSources, type NginxOverview, type NginxSite } from "../../api/nginx/api";

type Instance = InstanceType<typeof NginxConfigPanel>;

const { datasourceId, source, gap, bind, ready } = useMiddlewareSource();

/** 使用模式：新人模式会打开中文说明、引导条，并把默认页签落在模板库 */
const mode = ref<"standard" | "newbie">("standard");
const isNewbie = computed(() => mode.value === "newbie");

/** 左侧菜单条目 */
const tabs = computed(() => [
  { name: "overview", label: "总览", icon: "HomeFilled" },
  { name: "site", label: "站点", icon: "Link" },
  { name: "config", label: "配置", icon: "Tools" },
  { name: "log", label: "日志", icon: "Document" },
  { name: "backup", label: "备份", icon: "Files" },
  { name: "template", label: "模板库", icon: "Grid" },
  { name: "layout", label: "自定义布局", icon: "DataBoard" },
]);

const activeTab = ref("overview");
const sources = ref<Awaited<ReturnType<typeof fetchNginxSources>>>([]);
const overview = ref<NginxOverview | null>(null);
const overviewLoading = ref(false);
/** 总览加载失败原因；非空时面板显示错误而不是「一切正常」 */
const overviewError = ref("");
const configPanel = ref<Instance | null>(null);
/** 从站点页签跳转过来时要定位的节点；由 NginxConfigPanel 消费后清空 */
const focusNodePath = ref<string | null>(null);

/**
 * 顶栏状态文案。
 *
 * <p>必须把「还没取到」「取失败了」「取到了但状态字段为空」分成三态。
 * 早先只判 RUNNING / STOPPED，剩下全回落成「状态未知」，于是首屏加载的那一秒
 * 也显示「状态未知」——和「nginx 真的停了」视觉上完全一样，排查时极易误判。
 * 加载中显示「加载中」，取失败显示「未取到数据」，都带各自的语义色。</p>
 */
const statusText = computed(() => {
  const r = overview.value?.running;
  if (r === "RUNNING") {
    return "运行中";
  }
  if (r === "STOPPED") {
    return "已停止";
  }
  if (overviewError.value) {
    return "未取到数据";
  }
  if (overviewLoading.value && !overview.value) {
    return "加载中";
  }
  return "状态未知";
});

const stateClass = computed(() => {
  const r = overview.value?.running;
  if (r === "RUNNING") {
    return "is-running";
  }
  if (r === "STOPPED") {
    return "is-stopped";
  }
  if (overviewError.value) {
    return "is-error";
  }
  if (overviewLoading.value && !overview.value) {
    return "is-loading";
  }
  return "is-unknown";
});

/** 版本 / PID / 运行时长，拼成一行元信息并进顶栏 */
const metaText = computed(() => {
  const o = overview.value;
  if (!o) {
    return "";
  }
  const parts: string[] = [];
  if (o.version?.version) {
    parts.push(o.version.version);
  }
  if (o.masterPid) {
    parts.push(`PID ${o.masterPid}`);
  }
  if (o.uptimeText) {
    parts.push(`已运行 ${o.uptimeText}`);
  }
  return parts.join(" · ");
});

/** 实例接入点，形如 host:port，供总览 Hero 的「监听地址」使用 */
const endpointText = computed(() => {
  const s = source.value;
  if (!s) {
    return "";
  }
  return `${s.host}:${s.port || 22}`;
});

/** 跳到配置页签并定位到指定站点 */
async function onEditSite(site: NginxSite) {
  focusNodePath.value = site.nodePath;
  activeTab.value = "config";
  // 等配置面板挂载并读到新的 focusNodePath
  await nextTick();
  await configPanel.value?.openFile(site.file);
}

async function onSwitchSource(id: number) {
  datasourceId.value = id;
  overview.value = null;
  await bind("nginx");
  if (datasourceId.value) {
    await reloadOverview();
  }
}

async function reloadOverview() {
  if (!datasourceId.value) {
    return;
  }
  overviewLoading.value = true;
  overviewError.value = "";
  try {
    overview.value = await fetchNginxOverview(datasourceId.value);
    ready();
  } catch (e) {
    // 原来这里是空 catch，总览取不到时页面仍显示「状态未知 / 一切正常」，
    // 既骗人又让「按状态显示按钮」这类逻辑拿不到 running。改成留痕 + 上报。
    overviewError.value = (e as Error)?.message || String(e);
    overview.value = null;
    console.error("[nginx] 总览加载失败", datasourceId.value, e);
    ElMessage.error(`总览加载失败：${overviewError.value}`);
  } finally {
    overviewLoading.value = false;
  }
}

function onLifecycleChanged() {
  reloadOverview();
}

function onTemplateSaved() {
  reloadOverview();
  // 模板写入后直接跳到配置页，方便立刻检查
  activeTab.value = "config";
}

function goTab(name: string) {
  activeTab.value = name;
}

watch(mode, m => {
  // 新人模式默认落在模板库，标准模式落在总览
  activeTab.value = m === "newbie" ? "template" : "overview";
});

onMounted(async () => {
  try {
    sources.value = (await fetchNginxSources()) || [];
  } catch {
    // 列表拿不到时下拉为空，不影响已选数据源的使用
  }
  await bind("nginx");
  if (datasourceId.value) {
    await reloadOverview();
  }
});
</script>

<style scoped lang="scss">
/* 整页：与 Redis/ZK/etcd 控制台同款 dsm 壳。
   色值全部走 koi 设计令牌（--brand-* / --text-* / --border-* / --bg-*），暗色自动覆盖。
   背景用 --bg-fill 铺底（用户要求非白底）：白卡片落在浅灰画布上，边界一眼可分。 */
.dsm {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  background: var(--bg-fill);
}

/* ============ 顶栏 ============ */
/* 顶部工具条：视觉（圆角/边框/投影/底色/内距）由模板上的 re-surface 类统一提供
   （16px 圆角、透明边框 + 双层柔光投影），这里只留布局——不再自写一套卡片壳防漂移 */
.dsm-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
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

.dsm-nginx-icon {
  color: #009639;
}

.dsm-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.dsm-toolbar-right :deep(.rs-btn) {
  margin: 0;
}

.dsm-db-select {
  width: 200px;
  flex-shrink: 0;
}

/* 标准/新人 切换：复用统一分段控件样式（同 Redis 字符串视图切换） */
.dsm-seg {
  display: inline-flex;
  border: 1px solid var(--border-default);
  border-radius: 6px;
  overflow: hidden;
  background: var(--bg-elevated);
}

.dsm-seg button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 12px;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-right: 1px solid var(--border-default);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.dsm-seg button:last-child {
  border-right: none;
}

.dsm-seg button:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.dsm-seg button.is-active {
  background: var(--brand-50);
  color: var(--brand-600);
  font-weight: 600;
}

/* 运行状态胶囊：五种状态各自语义色 */
.ngm-state {
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

  /* 加载中：品牌色 + 呼吸动画，与「已停止」的红色明确区分开 */
  &.is-loading {
    color: var(--brand-500);
    background: color-mix(in srgb, var(--brand-500) 12%, transparent);
    border-color: color-mix(in srgb, var(--brand-500) 32%, transparent);
  }

  /* 取数失败：橙红警示，明确区别于「运行中/已停止」这两个真实状态 */
  &.is-error {
    color: var(--status-warning);
    background: color-mix(in srgb, var(--status-warning) 12%, transparent);
    border-color: color-mix(in srgb, var(--status-warning) 32%, transparent);
  }
}

/* 加载中状态点做呼吸动画，静止的灰点容易被当成「卡住了」 */
.ngm-state.is-loading .ngm-state-dot {
  animation: ngm-pulse 1.2s ease-in-out infinite;
}

@keyframes ngm-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.25;
  }
}

.ngm-state-dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: currentColor;
}

.ngm-meta {
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ============ 主体：左菜单 + 内容 ============ */
.dsm-body {
  display: flex;
  flex: 1;
  gap: 6px;
  overflow: hidden;
}

/* 左侧菜单：外层用 dsm-sidebar（边框/圆角/底色），条目皮肤对齐 dsm-tree-node */
.ngm-nav {
  width: 180px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-container);
  overflow: hidden;
}

/* 侧栏标题行：与 Redis/etcd 控制台 dsm-view-bar 同款 */
.dsm-view-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.ngm-nav-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text-tertiary);
}

.ngm-nav-list {
  flex: 1;
  padding: 6px 0;
  overflow-y: auto;
}

.ngm-nav-item {
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

.ngm-nav-icon {
  flex-shrink: 0;
}

.ngm-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
}

/* 各子面板是 .ngm-main 的直接子元素，自身按内容高度收缩。
   铺满后 v-loading 的 .el-loading-mask（position:absolute; inset:0 贴在面板根元素上）
   才能盖住整块内容区，而不是只盖住上半截。
   .ngm-main 是 .dsm-body 的 flex 子项、.dsm 有 height:100%，所以这里的百分比高度能解析；
   面板内容更高时按内容撑开并由 .ngm-main 滚动。 */
.ngm-main > * {
  min-height: 100%;
}

/* ============ 新人引导 ============ */
.ngm-guide {
  margin: 0 0 16px;
}

.ngm-guide-body {
  font-size: 13px;
  line-height: 1.8;
}

.ngm-guide-sub {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.ngm-link {
  color: var(--brand-500);
  cursor: pointer;
  text-decoration: underline;
  margin: 0 2px;
}
</style>
