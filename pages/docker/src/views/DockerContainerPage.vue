<template>
  <section class="docker-page-shell">
    <header class="page-hero">
      <div>
        <small>DOCKER / CONTAINERS</small>
        <h1>容器管理</h1>
        <p>必须先选择服务器，再查看该服务器的容器卡片，并可执行进入容器或更新运行配置。</p>
      </div>
      <el-button :loading="loading" @click="loadContainers">刷新</el-button>
    </header>

    <article class="panel-card">
      <header class="panel-card__header">
        <div>
          <strong>筛选条件</strong>
          <p>支持服务器、仓库和关键字筛选。</p>
        </div>
      </header>
      <div class="toolbar-grid">
        <el-select
          v-model="selectedServerId"
          filterable
          clearable
          placeholder="请选择服务器"
          @change="handleFilterChange"
        >
          <el-option
            v-for="item in mergedOptions"
            :key="item.serverId"
            :label="`${item.serverName} (${item.host || '-'})`"
            :value="item.serverId"
          />
        </el-select>
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
          <el-button @click="openExecDialog(item)">进入容器</el-button>
          <el-button type="primary" @click="openUpdateDialog(item)">更新配置</el-button>
        </div>
      </article>

      <el-empty v-if="!containers.length && !loading" description="当前筛选条件下没有容器" />
    </div>
    <el-empty v-else description="先选择一台服务器" />

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
import { onMounted, ref } from "vue";
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

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const executing = ref(false);
const updating = ref(false);
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

const { mergedOptions, loadServers } = useDockerServerSelection();

const registryName = (registryId?: number) => {
  if (!registryId) {
    return "未匹配仓库";
  }
  return registries.value.find((item) => item.dockerRegistryId === registryId)?.registryName || "未匹配仓库";
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
      ...(selectedServerId.value ? { serverId: String(selectedServerId.value) } : {}),
      ...(selectedRegistryId.value ? { registryId: String(selectedRegistryId.value) } : {}),
      ...(keyword.value.trim() ? { keyword: keyword.value.trim() } : {}),
    },
  });
};

const loadContainers = async () => {
  if (!selectedServerId.value) {
    containers.value = [];
    return;
  }
  loading.value = true;
  try {
    const result = await listDockerContainers({
      serverId: selectedServerId.value,
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
  await syncRouteQuery();
  await loadContainers();
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

const parseKeyValueText = (input: string) => {
  return input
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
};

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
  await Promise.all([loadServers(), listDockerRegistries().then((res) => { registries.value = res.data || []; })]);
  selectedServerId.value = route.query.serverId ? Number(route.query.serverId) : undefined;
  selectedRegistryId.value = route.query.registryId ? Number(route.query.registryId) : undefined;
  keyword.value = route.query.keyword ? String(route.query.keyword) : "";
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
.resource-card {
  padding: 18px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(241, 245, 249, 0.88));
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.06);
}

.page-hero,
.panel-card__header,
.resource-card__header,
.resource-card__actions {
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.card-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.resource-card__meta {
  display: grid;
  gap: 8px;
  color: #64748b;
  font-size: 13px;
}

.label-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 960px) {
  .toolbar-grid,
  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
