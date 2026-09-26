<template>
  <div class="ngm">
    <!-- 顶部：数据源 + 使用模式 + 生命周期 -->
    <div class="ngm-top">
      <div class="ngm-top-left">
        <h2 class="ngm-title">Nginx 控制台</h2>
        <ReRadioGroup v-model="mode" size="small">
          <ReRadioButton value="standard">标准模式</ReRadioButton>
          <ReRadioButton value="newbie">新人模式</ReRadioButton>
        </ReRadioGroup>
        <span v-if="source" class="ngm-source">
          <ReIcon name="Monitor" :size="13" />
          {{ source.name || source.host }}
          <span class="mono">{{ source.host }}:{{ source.port || 22 }}</span>
        </span>
      </div>

      <div class="ngm-top-right">
        <ReSelect
          :model-value="datasourceId"
          size="small"
          style="width: 200px"
          placeholder="选择数据源"
          @change="onSwitchSource"
        >
          <ReOption
            v-for="d in sources"
            :key="d.id"
            :value="d.id"
            :label="d.name || `${d.host}:${d.port || 22}`"
          />
        </ReSelect>
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

    <ReTab v-else v-model="activeTab" class="ngm-tabs" :tabs="tabs">
      <template #overview>
        <NginxOverviewPanel
          :loading="overviewLoading"
          :datasource-id="datasourceId"
          :overview="overview"
          @changed="reloadOverview"
        />
      </template>

      <template #site>
        <NginxSitePanel :datasource-id="datasourceId" @edit="onEditSite" />
      </template>

      <template #config>
        <NginxConfigPanel
          ref="configPanel"
          :datasource-id="datasourceId"
          :newbie="isNewbie"
          :focus-node-path="focusNodePath"
          @changed="reloadOverview"
        />
      </template>

      <template #log>
        <NginxLogPanel :datasource-id="datasourceId" />
      </template>

      <template #backup>
        <NginxBackupPanel :datasource-id="datasourceId" @changed="reloadOverview" />
      </template>

      <template #template>
        <NginxTemplatePanel :datasource-id="datasourceId" @saved="onTemplateSaved" />
      </template>
    </ReTab>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
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

const tabs = computed(() => {
  const base = [
    { name: "overview", label: "总览", icon: "DataLine" },
    { name: "site", label: "站点", icon: "Link" },
    { name: "config", label: "配置", icon: "Setting" },
    { name: "log", label: "日志", icon: "Document" },
    { name: "backup", label: "备份", icon: "CopyDocument" },
    { name: "template", label: "模板库", icon: "Grid" },
  ];
  return base;
});

const activeTab = ref("overview");
const sources = ref<Awaited<ReturnType<typeof fetchNginxSources>>>([]);
const overview = ref<NginxOverview | null>(null);
const overviewLoading = ref(false);
const configPanel = ref<Instance | null>(null);
/** 从站点页签跳转过来时要定位的节点；由 NginxConfigPanel 消费后清空 */
const focusNodePath = ref<string | null>(null);

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
  try {
    overview.value = await fetchNginxOverview(datasourceId.value);
    ready();
  } catch {
    // 缺口提示由各子面板自己处理，总览失败不阻断其它页签
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
.ngm {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: calc(100vh - 120px);
  min-height: 0;
}

.ngm-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.ngm-top-left,
.ngm-top-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.ngm-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.ngm-source {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--el-text-color-secondary);

  .mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    color: var(--el-text-color-placeholder);
  }
}

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

.ngm-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
