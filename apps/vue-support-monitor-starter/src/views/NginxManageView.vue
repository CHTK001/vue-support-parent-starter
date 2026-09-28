<template>
  <div class="ngm">
    <!-- 顶栏：面包屑 + 状态 + 实例元信息 + 实例选择 + 生命周期（对应 UI 图 2-7 顶栏） -->
    <div class="ngm-topbar">
      <div class="ngm-crumb">
        <span class="ngm-crumb-root">数据源中心</span>
        <span class="ngm-crumb-sep">/</span>
        <span class="ngm-crumb-cur">{{ source?.name || source?.host || "Nginx 控制台" }}</span>
        <span class="ngm-state" :class="stateClass">
          <i class="ngm-state-dot" />
          {{ statusText }}
        </span>
        <span class="ngm-meta">
          <template v-if="overview?.version?.version">{{ overview.version.version }}</template>
          <template v-if="overview?.masterPid"> · PID {{ overview.masterPid }}</template>
          <template v-if="overview?.uptimeText"> · 已运行 {{ overview.uptimeText }}</template>
        </span>
      </div>

      <div class="ngm-actions">
        <ReRadioGroup v-model="mode" >
          <ReRadioButton value="standard">标准</ReRadioButton>
          <ReRadioButton value="newbie">新人</ReRadioButton>
        </ReRadioGroup>

        <ReSelect
          :model-value="datasourceId"

          style="width: 170px"
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

        <ReButton show-text icon="Refresh" @click="reloadOverview">刷新</ReButton>

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

    <div v-else class="ngm-body">
      <!-- 左侧竖导航（对应 UI 图左侧 NGINX 控制台菜单） -->
      <aside class="ngm-nav">
        <div class="ngm-nav-title">
          <ReIcon name="Position" :size="16" />
          <span>NGINX 控制台</span>
        </div>
        <button
          v-for="t in tabs"
          :key="t.name"
          class="ngm-nav-item"
          :class="{ 'is-active': activeTab === t.name }"
          type="button"
          @click="goTab(t.name)"
        >
          <ReIcon :name="t.icon" :size="15" />
          <span>{{ t.label }}</span>
        </button>
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
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import MiddlewareGap from "../components/MiddlewareGap.vue";
import NginxLifecycleBar from "../components/nginx/NginxLifecycleBar.vue";
import NginxOverviewPanel from "../components/nginx/NginxOverviewPanel.vue";
import NginxSitePanel from "../components/nginx/NginxSitePanel.vue";
import NginxConfigPanel from "../components/nginx/NginxConfigPanel.vue";
import NginxLogPanel from "../components/nginx/NginxLogPanel.vue";
import NginxBackupPanel from "../components/nginx/NginxBackupPanel.vue";
import NginxTemplatePanel from "../components/nginx/NginxTemplatePanel.vue";
import { useMiddlewareSource } from "../utils/middlewareSource";
import { fetchNginxOverview, fetchNginxSources, type NginxOverview, type NginxSite } from "../nginx/api";

type Instance = InstanceType<typeof NginxConfigPanel>;

const { datasourceId, source, gap, bind, ready } = useMiddlewareSource();

/** 使用模式：新人模式会打开中文说明、引导条，并把默认页签落在模板库 */
const mode = ref<"standard" | "newbie">("standard");
const isNewbie = computed(() => mode.value === "newbie");

/** 左侧竖导航条目 */
const tabs = computed(() => [
  { name: "overview", label: "总览", icon: "HomeFilled" },
  { name: "site", label: "站点", icon: "Link" },
  { name: "config", label: "配置", icon: "Tools" },
  { name: "log", label: "日志", icon: "Document" },
  { name: "backup", label: "备份", icon: "Files" },
  { name: "template", label: "模板库", icon: "Grid" },
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
/* 整页：纵向 flex，间距与主机资产一致。
   色值全部走 koi / Element 令牌，暗色由 html.dark 自动覆盖。 */
.ngm {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: calc(100vh - 120px);
  min-height: 0;
}

/* ============ 顶栏 ============ */
.ngm-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 14px;
  border-radius: var(--el-border-radius-lg, 12px);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.ngm-crumb {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 13px;
}

.ngm-crumb-root {
  color: var(--el-text-color-secondary);
}

.ngm-crumb-sep {
  color: var(--el-text-color-placeholder);
}

.ngm-crumb-cur {
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 运行状态胶囊：绿/红/灰三态 */
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
    color: var(--el-color-success);
    background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
    border-color: color-mix(in srgb, var(--el-color-success) 32%, transparent);
  }

  &.is-stopped {
    color: var(--el-color-danger);
    background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
    border-color: color-mix(in srgb, var(--el-color-danger) 32%, transparent);
  }

  &.is-unknown {
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-light);
    border-color: var(--el-border-color-lighter);
  }

  /* 加载中：中性灰蓝 + 呼吸动画，与「已停止」的红色明确区分开 */
  &.is-loading {
    color: var(--el-color-info);
    background: color-mix(in srgb, var(--el-color-info) 12%, transparent);
    border-color: color-mix(in srgb, var(--el-color-info) 32%, transparent);
  }

  /* 取数失败：橙红警示，明确区别于「运行中/已停止」这两个真实状态 */
  &.is-error {
    color: var(--el-color-warning);
    background: color-mix(in srgb, var(--el-color-warning) 12%, transparent);
    border-color: color-mix(in srgb, var(--el-color-warning) 32%, transparent);
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
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.ngm-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* ============ 主体：左导航 + 内容 ============ */
.ngm-body {
  display: flex;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

.ngm-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 168px;
  flex: 0 0 168px;
  padding: 10px 8px;
  border-radius: var(--el-border-radius-lg, 12px);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  overflow: auto;
}

.ngm-nav-title {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px 10px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 6px;
}

/* 导航项：激活态复用 koi 菜单令牌，保证与侧边栏风格一致 */
.ngm-nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 9px 10px;
  border: 0;
  border-radius: var(--el-border-radius-base, 6px);
  background: transparent;
  font-size: 13px;
  text-align: left;
  color: var(--el-menu-text-color, var(--el-text-color-regular));
  cursor: pointer;
  transition: background-color 0.18s var(--el-transition-function-ease-in-out-bezier, ease),
    color 0.18s var(--el-transition-function-ease-in-out-bezier, ease);

  &:hover {
    background: var(--el-menu-hover-bg-color, var(--el-fill-color-light));
    color: var(--el-menu-hover-text-color, var(--el-color-primary));
  }

  &.is-active {
    background: var(--el-menu-active-bg-color, var(--el-color-primary-light-9));
    color: var(--el-menu-active-text-color, var(--el-color-primary));
    font-weight: 600;
  }
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
   .ngm-main 是 .ngm-body 的 flex 子项、.ngm 有 height: calc(100vh - 120px)，
   所以这里的百分比高度能解析；面板内容更高时按内容撑开并由 .ngm-main 滚动。 */
.ngm-main > * {
  min-height: 100%;
}

/* ============ 新人引导 ============ */
.ngm-guide {
  margin: 0;
}

.ngm-guide-body {
  font-size: 13px;
  line-height: 1.8;
}

.ngm-guide-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.ngm-link {
  color: var(--el-color-primary);
  cursor: pointer;
  text-decoration: underline;
  margin: 0 2px;
}
</style>
