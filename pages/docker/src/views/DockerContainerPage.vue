<template>
  <section class="docker-page-shell">
    <header class="page-hero">
      <div>
        <small>DOCKER / CONTAINERS</small>
        <h1>容器管理</h1>
        <p>服务器模式筛选下沉到服务器工作区，组件模式保留聚合筛选。</p>
      </div>
      <div class="hero-actions">
        <el-tooltip content="刷新容器列表" placement="top">
          <el-button circle :loading="loading" @click="loadContainers">
            <IconifyIconOnline icon="ri:refresh-line" />
          </el-button>
        </el-tooltip>
      </div>
    </header>

    <article v-if="displayMode !== 'server'" class="panel-card">
      <header class="panel-card__header">
        <div>
          <strong>筛选条件</strong>
          <p>容器模式会自动去重并统计覆盖服务器数量。</p>
        </div>
        <el-radio-group v-model="displayMode" size="small" @change="handleDisplayModeChange">
          <el-radio-button label="server" value="server">服务器模式</el-radio-button>
          <el-radio-button label="component" value="component">容器模式</el-radio-button>
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
          placeholder="搜索容器名、镜像名、容器ID"
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
            <el-radio-button label="component" value="component">容器模式</el-radio-button>
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
            placeholder="搜索容器名、镜像名、容器ID"
            @keyup.enter="handleFilterChange"
          />
        </article>
        <div v-if="selectedServerId" class="card-grid">
          <article v-for="item in containers" :key="item.containerId" class="resource-card">
            <header class="resource-card__header">
              <div>
                <strong>{{ item.containerName || item.containerId }}</strong>
                <p>{{ item.imageName || "-" }}:{{ item.imageTag || "-" }}</p>
              </div>
              <el-tag size="small" effect="light">{{ item.status || "-" }}</el-tag>
            </header>

            <div class="resource-card__meta">
              <span>容器ID：{{ item.containerId }}</span>
              <span>端口：{{ item.ports || "-" }}</span>
              <span>仓库：{{ registryName(item.registryId) }}</span>
              <span>创建时间：{{ formatTime(item.createdAt) }}</span>
            </div>

            <div v-if="item.labels && Object.keys(item.labels).length" class="label-row">
              <el-tag
                v-for="(value, key) in item.labels"
                :key="`${item.containerId}-${key}`"
                size="small"
                effect="plain"
              >
                {{ key }}={{ value }}
              </el-tag>
            </div>

            <div class="resource-card__actions">
              <el-tooltip content="进入容器" placement="top">
                <el-button circle @click="openExecDialog(item)">
                  <IconifyIconOnline icon="ri:terminal-box-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="更新配置" placement="top">
                <el-button circle type="primary" @click="openUpdateDialog(item)">
                  <IconifyIconOnline icon="ri:settings-3-line" />
                </el-button>
              </el-tooltip>
            </div>
          </article>
          <el-empty v-if="!containers.length && !loading" description="当前服务器没有容器" />
        </div>
        <el-empty v-else description="请选择一台服务器" />
      </div>
    </section>

    <div v-else class="card-grid">
      <article v-for="item in componentCards" :key="item.key" class="resource-card">
        <header class="resource-card__header">
          <div>
            <strong>{{ item.containerName || item.containerId || "-" }}</strong>
            <p>{{ item.imageName || "-" }}:{{ item.imageTag || "-" }}</p>
          </div>
          <div class="status-tags">
            <el-tag size="small" effect="light">{{ item.status || "-" }}</el-tag>
            <el-tag size="small" effect="light" type="success">
              {{ item.serverCount }} 台服务器
            </el-tag>
          </div>
        </header>
        <div class="resource-card__meta">
          <span>容器ID：{{ item.containerId }}</span>
          <span>端口：{{ item.ports || "-" }}</span>
          <span>仓库：{{ registryName(item.registryId) }}</span>
          <span>服务器：{{ item.serverNames.join(" / ") || "-" }}</span>
        </div>
      </article>
      <el-empty v-if="!componentCards.length && !loading" description="当前筛选条件下没有容器" />
    </div>

    <el-dialog v-model="execDialogVisible" title="进入容器" width="560px">
      <el-form label-width="100px">
        <el-form-item label="容器">
          <span>{{ activeContainer?.containerName || activeContainer?.containerId || "-" }}</span>
        </el-form-item>
        <el-form-item label="命令">
          <el-input
            v-model="execForm.commandText"
            type="textarea"
            :rows="4"
            placeholder="例如 /bin/sh 或 sh -lc 'echo hello'"
          />
        </el-form-item>
        <el-form-item label="工作目录">
          <el-input v-model="execForm.workDir" placeholder="/app" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="execDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="executing" @click="submitExec">执行</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="updateDialogVisible" title="更新容器配置" width="640px">
      <el-form label-width="120px">
        <el-form-item label="重启策略">
          <el-select v-model="updateForm.restartPolicy" clearable style="width: 100%">
            <el-option label="always" value="always" />
            <el-option label="unless-stopped" value="unless-stopped" />
            <el-option label="on-failure" value="on-failure" />
            <el-option label="no" value="no" />
          </el-select>
        </el-form-item>
        <el-form-item label="CPU 限制">
          <el-input v-model="updateForm.cpuLimit" placeholder="如 1.5" />
        </el-form-item>
        <el-form-item label="内存限制">
          <el-input v-model="updateForm.memoryLimit" placeholder="如 512m" />
        </el-form-item>
        <el-form-item label="环境变量">
          <el-input
            v-model="updateForm.envText"
            type="textarea"
            :rows="4"
            placeholder="每行 KEY=VALUE"
          />
        </el-form-item>
        <el-form-item label="端口映射">
          <el-input
            v-model="updateForm.portMappingsText"
            type="textarea"
            :rows="3"
            placeholder="每行一个映射，如 8080:80/tcp"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="updateDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="updating" @click="submitUpdate">提交</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { message } from "@repo/utils";
import {
  execDockerContainer,
  listDockerContainers,
  listDockerRegistries,
  updateDockerContainerConfig,
} from "../api";
import type {
  DockerContainerConfigUpdateRequest,
  DockerContainerView,
  DockerRegistry,
} from "../types";
import { useDockerServerSelection } from "../composables/useDockerServerSelection";

type DisplayMode = "server" | "component";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const executing = ref(false);
const updating = ref(false);
const displayMode = ref<DisplayMode>("server");
const selectedServerId = ref<number>();
const selectedRegistryId = ref<number>();
const keyword = ref("");
const containers = ref<DockerContainerView[]>([]);
const registries = ref<DockerRegistry[]>([]);
const activeContainer = ref<DockerContainerView | null>(null);
const execDialogVisible = ref(false);
const updateDialogVisible = ref(false);

const execForm = ref({
  commandText: "",
  workDir: "",
});

const updateForm = ref({
  restartPolicy: "",
  cpuLimit: "",
  memoryLimit: "",
  envText: "",
  portMappingsText: "",
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
  const map = new Map<
    string,
    DockerContainerView & { serverIds: Set<number> }
  >();
  containers.value.forEach((item) => {
    const key = String(
      item.containerName || `${item.imageName || ""}:${item.imageTag || ""}` || item.containerId,
    ).toLowerCase();
    const current = map.get(key);
    if (!current) {
      map.set(key, {
        ...item,
        serverIds: new Set([Number(item.serverId || 0)]),
      });
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

const syncRouteQuery = async () => {
  await router.replace({
    path: "/docker/containers",
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

const loadContainers = async () => {
  if (displayMode.value === "server" && !selectedServerId.value) {
    containers.value = [];
    return;
  }
  loading.value = true;
  try {
    const result = await listDockerContainers({
      serverId: displayMode.value === "server" ? selectedServerId.value : undefined,
      registryId: selectedRegistryId.value,
      keyword: keyword.value.trim() || undefined,
    });
    containers.value = result.data || [];
  } catch (error: any) {
    message(error?.message || error?.msg || "加载容器失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const handleFilterChange = async () => {
  persistCurrentServerFilter();
  await syncRouteQuery();
  await loadContainers();
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

const openExecDialog = (item: DockerContainerView) => {
  activeContainer.value = item;
  execForm.value = {
    commandText: "/bin/sh",
    workDir: "",
  };
  execDialogVisible.value = true;
};

const openUpdateDialog = (item: DockerContainerView) => {
  activeContainer.value = item;
  updateForm.value = {
    restartPolicy: "",
    cpuLimit: "",
    memoryLimit: "",
    envText: "",
    portMappingsText: "",
  };
  updateDialogVisible.value = true;
};

const splitCommand = (input: string) => {
  const matches = input.match(/"[^"]*"|'[^']*'|\S+/g) || [];
  return matches.map((item) => item.replace(/^['"]|['"]$/g, ""));
};

const parseKeyValueText = (input: string) =>
  input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, line) => {
      const index = line.indexOf("=");
      if (index > 0) {
        acc[line.slice(0, index).trim()] = line.slice(index + 1).trim();
      }
      return acc;
    }, {});

const parseLineList = (input: string) =>
  input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const submitExec = async () => {
  if (!activeContainer.value?.containerId) {
    return;
  }
  const command = splitCommand(execForm.value.commandText);
  if (!command.length) {
    message("请输入执行命令", { type: "warning" });
    return;
  }
  executing.value = true;
  try {
    const result = await execDockerContainer(activeContainer.value.containerId, {
      command,
      workDir: execForm.value.workDir || undefined,
    });
    message(result.data.message || "执行成功", {
      type: result.data.status === "SUCCESS" ? "success" : "error",
    });
    execDialogVisible.value = false;
  } catch (error: any) {
    message(error?.message || error?.msg || "进入容器失败", { type: "error" });
  } finally {
    executing.value = false;
  }
};

const submitUpdate = async () => {
  if (!activeContainer.value?.containerId) {
    return;
  }
  const payload: DockerContainerConfigUpdateRequest = {
    restartPolicy: updateForm.value.restartPolicy || undefined,
    cpuLimit: updateForm.value.cpuLimit || undefined,
    memoryLimit: updateForm.value.memoryLimit || undefined,
    env: parseKeyValueText(updateForm.value.envText),
    portMappings: parseLineList(updateForm.value.portMappingsText),
  };
  updating.value = true;
  try {
    const result = await updateDockerContainerConfig(activeContainer.value.containerId, payload);
    message(result.data.message || "配置更新已提交", {
      type: result.data.status === "SUCCESS" ? "success" : "warning",
    });
    updateDialogVisible.value = false;
    await loadContainers();
  } catch (error: any) {
    message(error?.message || error?.msg || "更新容器配置失败", { type: "error" });
  } finally {
    updating.value = false;
  }
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
  await loadContainers();
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

.label-row,
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
