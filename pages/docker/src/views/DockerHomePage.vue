<template>
  <section class="docker-home-shell">
    <header class="docker-home-hero">
      <div>
        <small>DOCKER / WORKSPACE</small>
        <h1>Docker 工作台</h1>
        <p>检索、统计和资源管理都收敛在一个主视图里，右侧切换工作区。</p>
      </div>
      <div class="docker-home-hero__actions">
        <el-input
          class="docker-search-trigger__input"
          readonly
          placeholder="点击输入框打开全局检索"
          @click="openSearchDialog"
          @focus="openSearchDialog"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
        <el-tooltip content="刷新统计数据" placement="top">
          <ScButton circle plain :loading="loadingSummary" @click="loadSummary">
            <IconifyIconOnline icon="ri:refresh-line" />
          </ScButton>
        </el-tooltip>
      </div>
    </header>

    <div class="docker-home-grid">
      <section class="docker-stage">
        <article class="docker-workspace-panel">
          <header class="docker-workspace-panel__header">
            <div>
              <small>{{ activeWorkspaceMeta.eyebrow }}</small>
              <strong>{{ activeWorkspaceMeta.title }}</strong>
              <p>{{ activeWorkspaceMeta.subtitle }}</p>
            </div>
            <el-tooltip content="切回统计页" placement="top">
              <ScButton
                circle
                type="primary"
                plain
                :disabled="activeWorkspace === 'stats'"
                @click="openWorkspace('stats')"
              >
                <IconifyIconOnline icon="ri:dashboard-line" />
              </ScButton>
            </el-tooltip>
          </header>
          <div class="docker-workspace-panel__body">
            <section v-if="activeWorkspace === 'stats'" class="docker-overview-panel">
              <div class="docker-overview-kpi">
                <article class="docker-kpi-card">
                  <small>服务器</small>
                  <strong>{{ summary.serverCount || 0 }}</strong>
                  <span>已纳管节点</span>
                </article>
                <article class="docker-kpi-card">
                  <small>可连接</small>
                  <strong>{{ summary.connectedServerCount || 0 }}</strong>
                  <span>在线 Docker 主机</span>
                </article>
              </div>
              <div class="docker-stat-grid">
                <button
                  v-for="card in summaryCards"
                  :key="card.key"
                  type="button"
                  class="docker-stat-card"
                  @click="openWorkspace(card.key)"
                >
                  <span class="docker-stat-card__icon">
                    <IconifyIconOnline :icon="card.icon" />
                  </span>
                  <small>{{ card.label }}</small>
                  <strong>{{ card.value }}</strong>
                  <span>{{ card.description }}</span>
                </button>
              </div>
            </section>
            <component v-else :is="activeWorkspaceMeta.component" />
          </div>
        </article>
      </section>

      <aside class="docker-tabs-rail">
        <ScTabs
          v-model="activeWorkspace"
          tab-position="right"
          class="docker-tabs-rail__tabs"
        >
          <ScTabPane
            v-for="tab in workspaceTabs"
            :key="tab.name"
            :label="tab.title"
            :name="tab.name"
          >
            <article class="docker-tabs-rail__summary">
              <strong>{{ tab.title }}</strong>
              <span>{{ tab.count }}</span>
              <p>{{ tab.description }}</p>
            </article>
          </ScTabPane>
        </ScTabs>
      </aside>
    </div>

    <ScDialog
      v-model="searchDialogVisible"
      title="Docker 全局检索"
      width="860px"
      layout="simple"
    >
      <section class="docker-search-dialog">
        <div class="docker-search-dialog__bar">
          <el-input
            ref="searchInputRef"
            v-model="searchKeyword"
            clearable
            placeholder="检索容器名、镜像名、镜像ID"
            @keyup.enter="runSearch"
          >
            <template #prefix>
              <IconifyIconOnline icon="ri:search-line" />
            </template>
          </el-input>
          <el-tooltip content="开始检索" placement="top">
            <ScButton circle type="primary" :loading="searching" @click="runSearch">
              <IconifyIconOnline icon="ri:search-line" />
            </ScButton>
          </el-tooltip>
        </div>
        <div v-if="searchResults.length" class="docker-search-dialog__summary">
          <el-tag size="small" effect="plain" round>
            结果 {{ searchResults.length }}
          </el-tag>
          <el-tag size="small" effect="plain" round>
            容器 {{ containerResultCount }}
          </el-tag>
          <el-tag size="small" effect="plain" round>
            镜像 {{ imageResultCount }}
          </el-tag>
        </div>
        <div class="docker-search-dialog__results">
          <article
            v-for="item in searchResults"
            :key="`${item.type}-${item.recordId}`"
            class="docker-search-card"
            @click="openSearchResult(item)"
          >
            <header>
              <span class="docker-search-card__type">
                {{ item.type === "container" ? "容器" : "镜像" }}
              </span>
              <small>{{ item.status || "等待同步" }}</small>
            </header>
            <strong>{{ item.title || "-" }}</strong>
            <p>{{ item.subtitle || item.description || "-" }}</p>
          </article>
          <el-empty
            v-if="!searchResults.length && !searching"
            description="输入关键字后开始检索"
          />
        </div>
      </section>
    </ScDialog>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import ScButton from "@repo/components/ScButton/index.vue";
import { ScTabs, ScTabPane } from "@repo/components/ScTabs";
import { message } from "@repo/utils";
import { getDockerDashboardSummary, searchDockerDashboard } from "../api";
import type { DockerDashboardSummaryView, DockerSearchItemView } from "../types";
import DockerContainerPage from "./DockerContainerPage.vue";
import DockerImagePage from "./DockerImagePage.vue";
import DockerMountPage from "./DockerMountPage.vue";
import DockerNetworkPage from "./DockerNetworkPage.vue";
import DockerRegistryPage from "./DockerRegistryPage.vue";

type DockerWorkspaceKey =
  | "stats"
  | "registries"
  | "images"
  | "containers"
  | "mounts"
  | "networks";

const activeWorkspace = ref<DockerWorkspaceKey>("stats");
const loadingSummary = ref(false);
const searching = ref(false);
const searchDialogVisible = ref(false);
const searchKeyword = ref("");
const summary = ref<DockerDashboardSummaryView>({});
const searchResults = ref<DockerSearchItemView[]>([]);
const searchInputRef = ref<any>();

const workspaceRegistry = {
  stats: {
    title: "统计总览",
    subtitle: "所有核心统计和工作区跳转都集中在这里。",
    eyebrow: "OVERVIEW",
    component: null,
  },
  registries: {
    title: "仓库管理",
    subtitle: "仓库卡片和软件列表一致，维护基础配置即可。",
    eyebrow: "REGISTRY",
    component: DockerRegistryPage,
  },
  images: {
    title: "镜像管理",
    subtitle: "按当前模式查看镜像数据和服务器覆盖关系。",
    eyebrow: "IMAGES",
    component: DockerImagePage,
  },
  containers: {
    title: "容器管理",
    subtitle: "支持服务器模式与组件模式统一展示。",
    eyebrow: "CONTAINERS",
    component: DockerContainerPage,
  },
  mounts: {
    title: "映射管理",
    subtitle: "聚焦挂载映射关系，按模式切换查看。",
    eyebrow: "MOUNTS",
    component: DockerMountPage,
  },
  networks: {
    title: "网络管理",
    subtitle: "网络定义和关联关系统一在这里管理。",
    eyebrow: "NETWORKS",
    component: DockerNetworkPage,
  },
} as const;

const activeWorkspaceMeta = computed(
  () => workspaceRegistry[activeWorkspace.value] || workspaceRegistry.stats,
);

const summaryCards = computed(
  () =>
    [
      {
        key: "registries",
        label: "仓库",
        value: summary.value.registryCount || 0,
        description: "仓库来源",
        icon: "ri:database-2-line",
      },
      {
        key: "images",
        label: "镜像",
        value: summary.value.imageCount || 0,
        description: "镜像资产",
        icon: "ri:image-2-line",
      },
      {
        key: "containers",
        label: "容器",
        value: summary.value.containerCount || 0,
        description: "运行实例",
        icon: "ri:box-3-line",
      },
      {
        key: "mounts",
        label: "映射",
        value: summary.value.mountCount || 0,
        description: "挂载模板",
        icon: "ri:folder-transfer-line",
      },
      {
        key: "networks",
        label: "网络",
        value: summary.value.networkCount || 0,
        description: "网络定义",
        icon: "ri:node-tree",
      },
    ] as Array<{
      key: Exclude<DockerWorkspaceKey, "stats">;
      label: string;
      value: number;
      description: string;
      icon: string;
    }>,
);

const containerResultCount = computed(
  () => searchResults.value.filter((item) => item.type === "container").length,
);

const imageResultCount = computed(
  () => searchResults.value.filter((item) => item.type !== "container").length,
);

const workspaceTabs = computed(() => {
  const total =
    (summary.value.registryCount || 0) +
    (summary.value.imageCount || 0) +
    (summary.value.containerCount || 0) +
    (summary.value.mountCount || 0) +
    (summary.value.networkCount || 0);
  return [
    ...summaryCards.value.map((item) => ({
      name: item.key as DockerWorkspaceKey,
      title: item.label,
      count: item.value,
      description: item.description,
    })),
    {
      name: "stats" as DockerWorkspaceKey,
      title: "统计页",
      count: total,
      description: "核心指标 + 快速跳转",
    },
  ];
});

const loadSummary = async () => {
  loadingSummary.value = true;
  try {
    const result = await getDockerDashboardSummary();
    summary.value = result.data || {};
  } catch (error: any) {
    message(error?.message || error?.msg || "加载工作台汇总失败", {
      type: "error",
    });
  } finally {
    loadingSummary.value = false;
  }
};

const openSearchDialog = () => {
  searchDialogVisible.value = true;
  nextTick(() => {
    searchInputRef.value?.focus?.();
  });
};

const runSearch = async () => {
  if (!searchKeyword.value.trim()) {
    searchResults.value = [];
    return;
  }
  searching.value = true;
  try {
    const result = await searchDockerDashboard({
      keyword: searchKeyword.value.trim(),
      limit: 20,
    });
    searchResults.value = result.data || [];
    if (!searchResults.value.length) {
      message("没有匹配结果，请切换标签继续查看。", {
        type: "info",
      });
    }
  } catch (error: any) {
    message(error?.message || error?.msg || "全局检索失败", { type: "error" });
  } finally {
    searching.value = false;
  }
};

const openWorkspace = (key: DockerWorkspaceKey) => {
  activeWorkspace.value = key;
};

const openSearchResult = (item: DockerSearchItemView) => {
  if (item.type === "container") {
    openWorkspace("containers");
  } else {
    openWorkspace("images");
  }
  searchDialogVisible.value = false;
};

loadSummary();
</script>

<style scoped lang="scss">
.docker-home-shell {
  display: grid;
  gap: 16px;
}

.docker-home-hero,
.docker-workspace-panel,
.docker-tabs-rail {
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94));
  box-shadow: 0 14px 26px rgba(15, 23, 42, 0.06);
}

.docker-home-hero {
  padding: 18px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.docker-home-hero__actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.docker-search-trigger__input {
  width: 320px;
}

.docker-search-trigger__input :deep(.el-input__wrapper) {
  cursor: pointer;
}

.docker-home-hero small {
  color: #64748b;
  letter-spacing: 0.16em;
  font-size: 11px;
}

.docker-home-hero h1 {
  margin: 8px 0 0;
  color: #0f172a;
}

.docker-home-hero p {
  margin: 8px 0 0;
  color: #64748b;
}

.docker-home-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: minmax(0, 1fr) 360px;
}

.docker-stage {
  display: grid;
  gap: 14px;
}

.docker-workspace-panel {
  padding: 14px;
}

.docker-workspace-panel__header {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 12px;
}

.docker-workspace-panel__header small {
  color: #64748b;
  font-size: 11px;
  letter-spacing: 0.14em;
}

.docker-workspace-panel__header strong {
  color: #0f172a;
}

.docker-workspace-panel__header p {
  margin: 8px 0 0;
  color: #64748b;
}

.docker-workspace-panel__body {
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.78);
}

.docker-overview-panel {
  padding: 12px;
  display: grid;
  gap: 14px;
}

.docker-overview-kpi {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.docker-kpi-card {
  display: grid;
  gap: 6px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(241, 245, 249, 0.9));
}

.docker-kpi-card small,
.docker-stat-card small {
  color: #64748b;
}

.docker-kpi-card strong,
.docker-stat-card strong {
  color: #0f172a;
  font-size: 28px;
}

.docker-kpi-card span,
.docker-stat-card span {
  color: #64748b;
  font-size: 12px;
}

.docker-stat-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.docker-stat-card {
  display: grid;
  gap: 6px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  text-align: left;
  background: #fff;
  cursor: pointer;
}

.docker-stat-card:hover {
  border-color: rgba(59, 130, 246, 0.36);
  background: rgba(239, 246, 255, 0.72);
}

.docker-stat-card__icon {
  display: inline-flex;
  width: 28px;
  height: 28px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  color: #0369a1;
  background: rgba(14, 165, 233, 0.12);
}

.docker-tabs-rail {
  padding: 12px;
}

.docker-tabs-rail__summary {
  display: grid;
  gap: 8px;
  padding: 6px;
}

.docker-tabs-rail__summary strong {
  color: #0f172a;
}

.docker-tabs-rail__summary span {
  color: #2563eb;
  font-size: 28px;
  font-weight: 700;
}

.docker-tabs-rail__summary p {
  margin: 0;
  color: #64748b;
  line-height: 1.65;
}

.docker-search-dialog {
  display: grid;
  gap: 12px;
}

.docker-search-dialog__bar {
  display: flex;
  gap: 10px;
  align-items: center;
}

.docker-search-dialog__summary {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.docker-search-dialog__results {
  display: grid;
  gap: 8px;
  max-height: 420px;
  overflow: auto;
}

.docker-search-card {
  display: grid;
  gap: 6px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  cursor: pointer;
}

.docker-search-card:hover {
  border-color: rgba(59, 130, 246, 0.36);
  background: rgba(239, 246, 255, 0.72);
}

.docker-search-card__type {
  display: inline-flex;
  min-height: 22px;
  align-items: center;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(14, 165, 233, 0.1);
  color: #0369a1;
  font-size: 12px;
  font-weight: 600;
}

@media (max-width: 1280px) {
  .docker-home-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 960px) {
  .docker-stat-grid,
  .docker-overview-kpi {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .docker-home-hero,
  .docker-search-dialog__bar {
    flex-direction: column;
    align-items: stretch;
  }

  .docker-search-trigger__input {
    width: 100%;
  }
}
</style>
