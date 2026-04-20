<template>
  <section class="docker-page-shell">
    <header class="page-hero">
      <div>
        <small>DOCKER / IMAGES</small>
        <h1>镜像管理</h1>
        <p>服务器模式筛选跟随服务器区域，组件模式保留聚合筛选视角。</p>
      </div>
      <div class="hero-actions">
        <el-tooltip content="刷新镜像列表" placement="top">
          <el-button circle :loading="loading" @click="loadImages">
            <IconifyIconOnline icon="ri:refresh-line" />
          </el-button>
        </el-tooltip>
        <el-tooltip content="拉取镜像" placement="top">
          <el-button
            circle
            :disabled="displayMode !== 'server'"
            @click="openPullDialog"
          >
            <IconifyIconOnline icon="ri:download-cloud-2-line" />
          </el-button>
        </el-tooltip>
        <el-tooltip content="导入镜像包" placement="top">
          <el-button
            circle
            type="primary"
            :disabled="displayMode !== 'server'"
            @click="openImportDialog"
          >
            <IconifyIconOnline icon="ri:inbox-archive-line" />
          </el-button>
        </el-tooltip>
      </div>
    </header>

    <article v-if="displayMode !== 'server'" class="panel-card">
      <header class="panel-card__header">
        <div>
          <strong>筛选条件</strong>
          <p>镜像模式会按镜像名和标签去重，附带服务器覆盖数量。</p>
        </div>
        <el-radio-group v-model="displayMode" size="small" @change="handleDisplayModeChange">
          <el-radio-button label="server" value="server">服务器模式</el-radio-button>
          <el-radio-button label="component" value="component">镜像模式</el-radio-button>
        </el-radio-group>
      </header>
      <div class="toolbar-grid">
        <el-select
          v-model="selectedRegistryId"
          clearable
          filterable
          placeholder="按仓库筛选"
          @change="handleFilterChange"
        >
          <el-option
            v-for="item in registries"
            :key="item.dockerRegistryId"
            :label="item.registryName"
            :value="item.dockerRegistryId"
          />
        </el-select>
        <el-input
          v-model="keyword"
          clearable
          placeholder="搜索镜像名、标签、镜像ID"
          @keyup.enter="handleFilterChange"
        />
      </div>
    </article>

    <section v-if="displayMode === 'server'" class="workspace-grid">
      <aside class="server-column">
        <article class="server-mode-filter">
          <small>展示模式</small>
          <el-radio-group v-model="displayMode" size="small" @change="handleDisplayModeChange">
            <el-radio-button label="server" value="server">服务器模式</el-radio-button>
            <el-radio-button label="component" value="component">镜像模式</el-radio-button>
          </el-radio-group>
        </article>
        <button
          v-for="item in mergedOptions"
          :key="item.serverId"
          type="button"
          class="server-card"
          :class="{ 'is-active': selectedServerId === item.serverId }"
          @click="selectServer(item.serverId)"
        >
          <strong>{{ item.serverName }}</strong>
          <span>{{ item.host || "-" }}</span>
          <small>{{ serverFilterHint(item.serverId) }}</small>
        </button>
      </aside>

      <div class="workspace-body">
        <article class="workspace-filter">
          <el-select
            v-model="selectedRegistryId"
            clearable
            filterable
            placeholder="按仓库筛选"
            @change="handleFilterChange"
          >
            <el-option
              v-for="item in registries"
              :key="item.dockerRegistryId"
              :label="item.registryName"
              :value="item.dockerRegistryId"
            />
          </el-select>
          <el-input
            v-model="keyword"
            clearable
            placeholder="搜索镜像名、标签、镜像ID"
            @keyup.enter="handleFilterChange"
          />
        </article>
        <div v-if="selectedServerId" class="card-grid">
          <article v-for="item in images" :key="item.imageId" class="resource-card">
            <header class="resource-card__header">
              <div>
                <strong>{{ item.imageName || item.imageId }}</strong>
                <p>{{ item.imageTag || "latest" }}</p>
              </div>
              <el-tag size="small" effect="light">{{ item.status || "-" }}</el-tag>
            </header>

            <div class="resource-card__meta">
              <span>镜像ID：{{ item.imageId }}</span>
              <span>大小：{{ formatSize(item.sizeBytes) }}</span>
              <span>仓库：{{ registryName(item.registryId) }}</span>
              <span>创建时间：{{ formatTime(item.createdAt) }}</span>
            </div>

            <div class="resource-card__actions">
              <el-tooltip content="导出镜像" placement="top">
                <el-button circle @click="openExportDialog(item)">
                  <IconifyIconOnline icon="ri:download-2-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="进入安装向导" placement="top">
                <el-button circle type="primary" @click="goInstall(item)">
                  <IconifyIconOnline icon="ri:rocket-line" />
                </el-button>
              </el-tooltip>
            </div>
          </article>

          <el-empty v-if="!images.length && !loading" description="当前服务器没有镜像" />
        </div>
        <el-empty v-else description="先选择一台服务器" />
      </div>
    </section>

    <div v-else class="card-grid">
      <article v-for="item in componentCards" :key="item.key" class="resource-card">
        <header class="resource-card__header">
          <div>
            <strong>{{ item.imageName || item.imageId }}</strong>
            <p>{{ item.imageTag || "latest" }}</p>
          </div>
          <div class="status-tags">
            <el-tag size="small" effect="light">{{ item.status || "-" }}</el-tag>
            <el-tag size="small" effect="light" type="success">
              {{ item.serverCount }} 台服务器
            </el-tag>
          </div>
        </header>
        <div class="resource-card__meta">
          <span>镜像ID：{{ item.imageId }}</span>
          <span>大小：{{ formatSize(item.sizeBytes) }}</span>
          <span>仓库：{{ registryName(item.registryId) }}</span>
          <span>服务器：{{ item.serverNames.join(" / ") || "-" }}</span>
        </div>
      </article>
      <el-empty v-if="!componentCards.length && !loading" description="当前筛选条件下没有镜像" />
    </div>

    <el-dialog v-model="pullDialogVisible" title="拉取镜像" width="560px">
      <el-form label-width="100px">
        <el-form-item label="服务器">
          <span>{{ currentServerLabel }}</span>
        </el-form-item>
        <el-form-item label="仓库">
          <el-select v-model="pullForm.registryId" clearable style="width: 100%">
            <el-option
              v-for="item in registries"
              :key="item.dockerRegistryId"
              :label="item.registryName"
              :value="item.dockerRegistryId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="镜像名">
          <el-input v-model="pullForm.imageName" placeholder="如 nginx 或 harbor.local/library/nginx" />
        </el-form-item>
        <el-form-item label="镜像标签">
          <el-input v-model="pullForm.imageTag" placeholder="latest" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pullDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="pulling" @click="submitPull">拉取</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="importDialogVisible" title="导入镜像" width="560px">
      <el-form label-width="100px">
        <el-form-item label="归档路径">
          <el-input v-model="importForm.archivePath" placeholder="/data/images/nginx.tar" />
        </el-form-item>
        <el-form-item label="镜像名">
          <el-input v-model="importForm.imageName" />
        </el-form-item>
        <el-form-item label="镜像标签">
          <el-input v-model="importForm.imageTag" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="importing" @click="submitImport">导入</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { useRoute, useRouter } from "vue-router";
import { message } from "@repo/utils";
import {
  exportDockerImage,
  importDockerImage,
  listDockerImages,
  listDockerRegistries,
  pullDockerImage,
} from "../api";
import type { DockerImageView, DockerRegistry } from "../types";
import { useDockerServerSelection } from "../composables/useDockerServerSelection";

type DisplayMode = "server" | "component";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const pulling = ref(false);
const importing = ref(false);
const displayMode = ref<DisplayMode>("server");
const selectedServerId = ref<number>();
const selectedRegistryId = ref<number>();
const keyword = ref("");
const images = ref<DockerImageView[]>([]);
const registries = ref<DockerRegistry[]>([]);
const pullDialogVisible = ref(false);
const importDialogVisible = ref(false);

const pullForm = ref({
  registryId: undefined as number | undefined,
  imageName: "",
  imageTag: "latest",
});

const importForm = ref({
  archivePath: "",
  imageName: "",
  imageTag: "latest",
});

type ServerFilterState = {
  selectedRegistryId?: number;
  keyword: string;
};

const { mergedOptions, loadServers } = useDockerServerSelection();
const serverFilters = ref<Record<number, ServerFilterState>>({});

const serverNameMap = computed(() => {
  const map = new Map<number, string>();
  mergedOptions.value.forEach((item) => {
    map.set(Number(item.serverId), item.serverName || String(item.serverId));
  });
  return map;
});

const componentCards = computed(() => {
  const map = new Map<string, DockerImageView & { serverIds: Set<number> }>();
  images.value.forEach((item) => {
    const key = `${item.imageName || item.imageId}:${item.imageTag || "latest"}`.toLowerCase();
    const current = map.get(key);
    if (!current) {
      map.set(key, { ...item, serverIds: new Set([Number(item.serverId || 0)]) });
      return;
    }
    current.serverIds.add(Number(item.serverId || 0));
  });
  return Array.from(map.entries()).map(([key, item]) => {
    const serverIds = Array.from(item.serverIds).filter((id) => id > 0);
    return {
      key,
      ...item,
      serverCount: serverIds.length,
      serverNames: serverIds.map((id) => serverNameMap.value.get(id) || String(id)),
    };
  });
});

const currentServerLabel = computed(
  () => mergedOptions.value.find((item) => item.serverId === selectedServerId.value)?.serverName || "-",
);

const ensureServerFilter = (serverId?: number) => {
  if (!serverId) {
    return {
      selectedRegistryId: selectedRegistryId.value,
      keyword: keyword.value,
    } satisfies ServerFilterState;
  }
  if (!serverFilters.value[serverId]) {
    serverFilters.value[serverId] = {
      selectedRegistryId: undefined,
      keyword: "",
    };
  }
  return serverFilters.value[serverId];
};

const persistCurrentServerFilter = () => {
  if (displayMode.value !== "server" || !selectedServerId.value) {
    return;
  }
  serverFilters.value[selectedServerId.value] = {
    selectedRegistryId: selectedRegistryId.value,
    keyword: keyword.value,
  };
};

const applyServerFilter = (serverId?: number) => {
  if (!serverId) {
    return;
  }
  const state = ensureServerFilter(serverId);
  selectedRegistryId.value = state.selectedRegistryId;
  keyword.value = state.keyword;
};

const serverFilterHint = (serverId: number) => {
  const state = serverFilters.value[serverId];
  if (!state) {
    return "默认筛选";
  }
  const count = (state.selectedRegistryId ? 1 : 0) + (state.keyword?.trim() ? 1 : 0);
  return count ? `已设 ${count} 项筛选` : "默认筛选";
};

const registryName = (registryId?: number) => {
  if (!registryId) {
    return "未匹配仓库";
  }
  return (
    registries.value.find((item) => item.dockerRegistryId === registryId)?.registryName ||
    "未匹配仓库"
  );
};

const formatTime = (value?: number) => {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString();
};

const formatSize = (value?: number) => {
  if (!value) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const syncRouteQuery = async () => {
  await router.replace({
    path: "/docker/images",
    query: {
      mode: displayMode.value,
      ...(displayMode.value === "server" && selectedServerId.value
        ? { serverId: String(selectedServerId.value) }
        : {}),
      ...(selectedRegistryId.value ? { registryId: String(selectedRegistryId.value) } : {}),
      ...(keyword.value.trim() ? { keyword: keyword.value.trim() } : {}),
    },
  });
};

const loadImages = async () => {
  if (displayMode.value === "server" && !selectedServerId.value) {
    images.value = [];
    return;
  }
  loading.value = true;
  try {
    const result = await listDockerImages({
      serverId: displayMode.value === "server" ? selectedServerId.value : undefined,
      registryId: selectedRegistryId.value,
      keyword: keyword.value.trim() || undefined,
    });
    images.value = result.data || [];
  } catch (error: any) {
    message(error?.message || error?.msg || "加载镜像失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const handleFilterChange = async () => {
  persistCurrentServerFilter();
  await syncRouteQuery();
  await loadImages();
};

const handleDisplayModeChange = async () => {
  if (displayMode.value === "server" && !selectedServerId.value) {
    selectedServerId.value = mergedOptions.value[0]?.serverId;
  }
  await handleFilterChange();
};

const selectServer = async (serverId: number) => {
  persistCurrentServerFilter();
  selectedServerId.value = serverId;
  applyServerFilter(serverId);
  await handleFilterChange();
};

const openPullDialog = () => {
  if (!selectedServerId.value) {
    message("请先选择服务器", { type: "warning" });
    return;
  }
  pullForm.value = {
    registryId: selectedRegistryId.value,
    imageName: "",
    imageTag: "latest",
  };
  pullDialogVisible.value = true;
};

const openImportDialog = () => {
  if (!selectedServerId.value) {
    message("请先选择服务器", { type: "warning" });
    return;
  }
  importForm.value = {
    archivePath: "",
    imageName: "",
    imageTag: "latest",
  };
  importDialogVisible.value = true;
};

const submitPull = async () => {
  if (!selectedServerId.value || !pullForm.value.imageName.trim()) {
    message("请填写镜像名", { type: "warning" });
    return;
  }
  pulling.value = true;
  try {
    const result = await pullDockerImage({
      serverId: selectedServerId.value,
      registryId: pullForm.value.registryId,
      imageName: pullForm.value.imageName.trim(),
      imageTag: pullForm.value.imageTag || undefined,
    });
    message(result.data.message || "拉取已提交", {
      type: result.data.status === "SUCCESS" ? "success" : "warning",
    });
    pullDialogVisible.value = false;
    await loadImages();
  } catch (error: any) {
    message(error?.message || error?.msg || "拉取镜像失败", { type: "error" });
  } finally {
    pulling.value = false;
  }
};

const submitImport = async () => {
  if (!selectedServerId.value || !importForm.value.archivePath.trim()) {
    message("请填写归档路径", { type: "warning" });
    return;
  }
  importing.value = true;
  try {
    const result = await importDockerImage({
      serverId: selectedServerId.value,
      archivePath: importForm.value.archivePath.trim(),
      imageName: importForm.value.imageName || undefined,
      imageTag: importForm.value.imageTag || undefined,
    });
    message(result.data.message || "导入已提交", {
      type: result.data.status === "SUCCESS" ? "success" : "warning",
    });
    importDialogVisible.value = false;
    await loadImages();
  } catch (error: any) {
    message(error?.message || error?.msg || "导入镜像失败", { type: "error" });
  } finally {
    importing.value = false;
  }
};

const openExportDialog = async (item: DockerImageView) => {
  if (!selectedServerId.value) {
    return;
  }
  try {
    const { value } = await ElMessageBox.prompt("请输入导出目标路径", "导出镜像", {
      inputPlaceholder: "/data/images/export.tar",
      inputValue: "/data/images/export.tar",
    });
    const result = await exportDockerImage({
      serverId: selectedServerId.value,
      imageId: item.imageId,
      outputPath: value,
    });
    message(result.data.message || "导出已提交", {
      type: result.data.status === "SUCCESS" ? "success" : "warning",
    });
  } catch {
    // ignore
  }
};

const goInstall = async (item: DockerImageView) => {
  await router.push({
    path: "/docker/install",
    query: {
      ...(selectedServerId.value ? { serverId: String(selectedServerId.value) } : {}),
      ...(item.registryId ? { registryId: String(item.registryId) } : {}),
      ...(item.imageName ? { imageName: item.imageName } : {}),
      ...(item.imageTag ? { imageTag: item.imageTag } : {}),
    },
  });
};

onMounted(async () => {
  await Promise.all([
    loadServers(),
    listDockerRegistries().then((res) => {
      registries.value = res.data || [];
    }),
  ]);
  displayMode.value = route.query.mode === "component" ? "component" : "server";
  selectedServerId.value =
    displayMode.value === "server" && route.query.serverId
      ? Number(route.query.serverId)
      : mergedOptions.value[0]?.serverId;
  if (displayMode.value === "server" && selectedServerId.value) {
    serverFilters.value[selectedServerId.value] = {
      selectedRegistryId: route.query.registryId ? Number(route.query.registryId) : undefined,
      keyword: route.query.keyword ? String(route.query.keyword) : "",
    };
    applyServerFilter(selectedServerId.value);
  } else {
    selectedRegistryId.value = route.query.registryId ? Number(route.query.registryId) : undefined;
    keyword.value = route.query.keyword ? String(route.query.keyword) : "";
  }
  await loadImages();
});
</script>

<style scoped lang="scss">
.docker-page-shell {
  display: grid;
  gap: 18px;
}

.page-hero,
.panel-card,
.resource-card,
.server-column {
  padding: 18px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(241, 245, 249, 0.88));
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.06);
}

.page-hero,
.panel-card__header,
.resource-card__header,
.resource-card__actions,
.hero-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.toolbar-grid,
.card-grid {
  display: grid;
  gap: 14px;
}

.toolbar-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.workspace-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: 280px minmax(0, 1fr);
}

.server-column {
  display: grid;
  gap: 10px;
  align-content: start;
}

.server-mode-filter {
  display: grid;
  gap: 8px;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(255, 255, 255, 0.82);
}

.server-mode-filter small {
  color: #64748b;
  font-size: 12px;
}

.server-card {
  display: grid;
  gap: 4px;
  text-align: left;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: #fff;
  cursor: pointer;
}

.server-card small {
  color: #94a3b8;
  font-size: 11px;
}

.server-card.is-active {
  border-color: rgba(59, 130, 246, 0.35);
  background: rgba(239, 246, 255, 0.72);
}

.workspace-body,
.card-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.workspace-filter {
  grid-column: 1 / -1;
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.resource-card__meta {
  display: grid;
  gap: 8px;
  color: #64748b;
  font-size: 13px;
}

.status-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 1080px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 960px) {
  .toolbar-grid,
  .workspace-filter,
  .workspace-body,
  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
