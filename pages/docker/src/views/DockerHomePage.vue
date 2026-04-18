<template>
  <section class="docker-home-shell">
    <header class="docker-hero">
      <div>
        <small>DOCKER / HOME</small>
        <h1>Docker 工作台</h1>
        <p>主区展示服务器、仓库、镜像和容器汇总，左侧保持全局检索结果，方便快速定位资源。</p>
      </div>
      <div class="docker-hero__actions">
        <el-button :loading="loadingSummary" @click="loadSummary">刷新概览</el-button>
      </div>
    </header>

    <ScLayout
      v-model="activeRailTab"
      class="docker-home-layout"
      left-enabled
      :left-width="360"
      :left-min-width="280"
      :rail-width="52"
      :rail-tabs="railTabs"
    >
      <template #left>
        <section class="search-panel">
          <header class="search-panel__header">
            <div>
              <strong>全局检索</strong>
              <p>支持检索容器、镜像，并尽量识别所属仓库。</p>
            </div>
            <el-button link type="primary" @click="searchKeyword = ''">清空</el-button>
          </header>

          <div class="search-panel__bar">
            <el-input
              v-model="searchKeyword"
              clearable
              placeholder="搜索容器、镜像、镜像ID"
              @keyup.enter="runSearch"
            />
            <el-button type="primary" :loading="searching" @click="runSearch">检索</el-button>
          </div>

          <div class="search-panel__results">
            <template v-if="searchResults.length">
              <article
                v-for="item in searchResults"
                :key="`${item.type}-${item.recordId}`"
                class="search-result-card"
                @click="openSearchResult(item)"
              >
                <header>
                  <el-tag size="small" effect="light">
                    {{ item.type === "container" ? "容器" : "镜像" }}
                  </el-tag>
                  <span>{{ item.status || "-" }}</span>
                </header>
                <strong>{{ item.title || "-" }}</strong>
                <p>{{ item.subtitle || item.description || "-" }}</p>
                <div class="search-result-card__meta">
                  <span>服务器：{{ item.serverName || item.serverId || "-" }}</span>
                  <span>仓库：{{ item.registryName || "未匹配仓库" }}</span>
                </div>
              </article>
            </template>
            <el-empty v-else description="暂无检索结果" />
          </div>
        </section>
      </template>

      <template #default>
        <section class="dashboard-stage">
          <div class="summary-grid">
            <article v-for="card in summaryCards" :key="card.label" class="summary-card">
              <small>{{ card.label }}</small>
              <strong>{{ card.value }}</strong>
              <p>{{ card.description }}</p>
            </article>
          </div>

          <section class="dashboard-panel">
            <header class="dashboard-panel__header">
              <div>
                <strong>当前状态</strong>
                <p>已接入服务器与同步数据概览。</p>
              </div>
            </header>
            <div class="state-grid">
              <article class="state-card">
                <span>已配置连接</span>
                <strong>{{ summary.connectedServerCount || 0 }} / {{ summary.serverCount || 0 }}</strong>
                <p>优先配置 `server_docker` 后再同步镜像和容器数据。</p>
              </article>
              <article class="state-card">
                <span>同步数据量</span>
                <strong>{{ (summary.imageCount || 0) + (summary.containerCount || 0) }}</strong>
                <p>镜像与容器数据已经落库，可供检索与后续页面直接使用。</p>
              </article>
            </div>
          </section>
        </section>
      </template>
    </ScLayout>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import ScLayout from "@repo/components/ScLayout";
import { message } from "@repo/utils";
import { getDockerDashboardSummary, searchDockerDashboard } from "../api";
import type { DockerDashboardSummaryView, DockerSearchItemView } from "../types";

const router = useRouter();
const activeRailTab = ref("search");
const loadingSummary = ref(false);
const searching = ref(false);
const searchKeyword = ref("");
const summary = ref<DockerDashboardSummaryView>({});
const searchResults = ref<DockerSearchItemView[]>([]);

const railTabs = [{ name: "search", label: "检索", title: "全局检索" }];

const summaryCards = computed(() => [
  {
    label: "服务器",
    value: summary.value.serverCount || 0,
    description: "来自 @pages/server 的可用服务器数量",
  },
  {
    label: "仓库",
    value: summary.value.registryCount || 0,
    description: "仅记录型 Docker 仓库配置",
  },
  {
    label: "镜像",
    value: summary.value.imageCount || 0,
    description: "已同步入库的镜像数量",
  },
  {
    label: "容器",
    value: summary.value.containerCount || 0,
    description: "已同步入库的容器数量",
  },
  {
    label: "挂载",
    value: summary.value.mountCount || 0,
    description: "服务器挂载映射定义数量",
  },
  {
    label: "网络",
    value: summary.value.networkCount || 0,
    description: "服务器网络映射定义数量",
  },
]);

const loadSummary = async () => {
  loadingSummary.value = true;
  try {
    const result = await getDockerDashboardSummary();
    summary.value = result.data || {};
  } catch (error: any) {
    message(error?.message || error?.msg || "加载工作台汇总失败", { type: "error" });
  } finally {
    loadingSummary.value = false;
  }
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
      message("没有匹配结果，可从安装向导直接开始部署", { type: "info" });
    }
  } catch (error: any) {
    message(error?.message || error?.msg || "全局检索失败", { type: "error" });
  } finally {
    searching.value = false;
  }
};

const openSearchResult = async (item: DockerSearchItemView) => {
  if (item.type === "container") {
    await router.push({
      path: "/docker/containers",
      query: {
        ...(item.serverId ? { serverId: String(item.serverId) } : {}),
        ...(item.recordId ? { keyword: item.recordId } : {}),
      },
    });
    return;
  }
  await router.push({
    path: "/docker/images",
    query: {
      ...(item.serverId ? { serverId: String(item.serverId) } : {}),
      ...(item.registryId ? { registryId: String(item.registryId) } : {}),
      ...(item.recordId ? { keyword: item.recordId } : {}),
    },
  });
};

onMounted(async () => {
  await loadSummary();
});
</script>

<style scoped lang="scss">
.docker-home-shell {
  display: grid;
  gap: 18px;
}

.docker-hero,
.summary-card,
.dashboard-panel,
.search-panel,
.state-card {
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(241, 245, 249, 0.88));
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.06);
}

.docker-hero,
.dashboard-panel,
.search-panel {
  padding: 18px;
}

.docker-hero {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.docker-hero small,
.search-panel__header p,
.dashboard-panel__header p,
.summary-card p,
.state-card p {
  color: #64748b;
}

.docker-hero h1,
.search-panel__header strong,
.dashboard-panel__header strong {
  margin: 0;
  color: #0f172a;
}

.docker-home-layout {
  min-height: calc(100vh - 240px);
}

.search-panel {
  display: grid;
  gap: 14px;
  height: 100%;
}

.search-panel__header,
.search-panel__bar {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.search-panel__bar {
  align-items: stretch;
}

.search-panel__results {
  display: grid;
  gap: 10px;
  align-content: start;
}

.search-result-card {
  padding: 14px;
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.14);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.search-result-card:hover {
  transform: translateY(-1px);
  border-color: rgba(14, 165, 233, 0.28);
  box-shadow: 0 12px 24px rgba(14, 165, 233, 0.08);
}

.search-result-card header,
.search-result-card__meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  color: #64748b;
  font-size: 12px;
}

.search-result-card strong {
  display: block;
  margin-top: 8px;
  color: #0f172a;
}

.search-result-card p {
  margin: 6px 0 0;
  color: #475569;
  line-height: 1.7;
}

.dashboard-stage {
  display: grid;
  gap: 16px;
}

.summary-grid,
.state-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.summary-card,
.state-card {
  padding: 18px;
}

.summary-card small,
.state-card span {
  color: #64748b;
}

.summary-card strong,
.state-card strong {
  display: block;
  margin-top: 10px;
  font-size: 30px;
  color: #0f172a;
}

@media (max-width: 960px) {
  .summary-grid,
  .state-grid {
    grid-template-columns: 1fr;
  }

  :deep(.docker-home-layout.sc-layout) {
    grid-template-columns: 1fr !important;
    grid-template-rows: auto auto auto;
  }
}
</style>
