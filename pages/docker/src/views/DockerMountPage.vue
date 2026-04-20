<template>
  <section class="docker-page-shell">
    <header class="page-hero">
      <div>
        <small>DOCKER / MOUNTS</small>
        <h1>挂载管理</h1>
        <p>服务器模式筛选跟随服务器区域，映射模式保留聚合视图。</p>
      </div>
      <div class="hero-actions">
        <el-tooltip content="刷新挂载列表" placement="top">
          <el-button circle :loading="loading" @click="loadMounts">
            <IconifyIconOnline icon="ri:refresh-line" />
          </el-button>
        </el-tooltip>
        <el-tooltip content="新增挂载" placement="top">
          <el-button
          circle
          type="primary"
          :disabled="displayMode !== 'server' || !selectedServerId"
          @click="openEditor()"
        >
          <IconifyIconOnline icon="ri:folder-add-line" />
        </el-button>
        </el-tooltip>
      </div>
    </header>

    <article v-if="displayMode !== 'server'" class="panel-card">
      <header class="panel-card__header">
        <div>
          <strong>筛选条件</strong>
          <p>映射模式会按挂载配置去重并统计覆盖服务器数量。</p>
        </div>
        <el-radio-group
          v-model="displayMode"
          size="small"
          @change="handleDisplayModeChange"
        >
          <el-radio-button label="server" value="server"
            >服务器模式</el-radio-button
          >
          <el-radio-button label="component" value="component"
            >映射模式</el-radio-button
          >
        </el-radio-group>
      </header>
      <div class="toolbar-grid">
        <el-input
          v-model="keyword"
          clearable
          placeholder="搜索挂载名、主机路径、容器路径"
          @keyup.enter="handleFilterChange"
        />
      </div>
    </article>

    <section v-if="displayMode === 'server'" class="workspace-grid">
      <aside class="server-column">
        <article class="server-mode-filter">
          <small>展示模式</small>
          <el-radio-group
            v-model="displayMode"
            size="small"
            @change="handleDisplayModeChange"
          >
            <el-radio-button label="server" value="server"
              >服务器模式</el-radio-button
            >
            <el-radio-button label="component" value="component"
              >映射模式</el-radio-button
            >
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
          <el-input
            v-model="keyword"
            clearable
            placeholder="搜索挂载名、主机路径、容器路径"
            @keyup.enter="handleFilterChange"
          />
        </article>
        <div v-if="selectedServerId" class="card-grid">
          <article
            v-for="item in mounts"
            :key="item.dockerMountId"
            class="resource-card"
          >
            <header class="resource-card__header">
              <div>
                <strong>{{ item.mountName || item.hostPath }}</strong>
                <p>{{ item.mountType || "bind" }}</p>
              </div>
              <div class="status-tags">
                <el-tag size="small" effect="light">{{
                  item.sourceType || "manual"
                }}</el-tag>
                <el-tag
                  size="small"
                  effect="light"
                  :type="item.readOnly ? 'warning' : 'success'"
                >
                  {{ item.readOnly ? "只读" : "读写" }}
                </el-tag>
              </div>
            </header>

            <div class="resource-card__meta">
              <span>主机路径：{{ item.hostPath }}</span>
              <span>容器路径：{{ item.containerPath }}</span>
              <span
                >启用状态：{{ item.enabled === false ? "停用" : "启用" }}</span
              >
            </div>

            <div class="resource-card__actions">
              <el-tooltip content="编辑挂载" placement="top">
                <el-button circle @click="openEditor(item)">
                  <IconifyIconOnline icon="ri:edit-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="删除挂载" placement="top">
                <el-button circle type="danger" plain @click="removeMount(item)"
                  ><IconifyIconOnline icon="ri:delete-bin-6-line" /></el-button
                >
              </el-tooltip>
            </div>
          </article>

          <el-empty
            v-if="!mounts.length && !loading"
            description="当前服务器没有挂载映射"
          />
        </div>
        <el-empty v-else description="先选择一台服务器" />
      </div>
    </section>

    <div v-else class="card-grid">
      <article
        v-for="item in componentCards"
        :key="item.key"
        class="resource-card"
      >
        <header class="resource-card__header">
          <div>
            <strong>{{ item.mountName || item.hostPath }}</strong>
            <p>{{ item.mountType || "bind" }}</p>
          </div>
          <div class="status-tags">
            <el-tag size="small" effect="light">{{
              item.sourceType || "manual"
            }}</el-tag>
            <el-tag
              size="small"
              effect="light"
              :type="item.readOnly ? 'warning' : 'success'"
            >
              {{ item.readOnly ? "只读" : "读写" }}
            </el-tag>
            <el-tag size="small" effect="light" type="success">
              {{ item.serverCount }} 台服务器
            </el-tag>
          </div>
        </header>

        <div class="resource-card__meta">
          <span>主机路径：{{ item.hostPath }}</span>
          <span>容器路径：{{ item.containerPath }}</span>
          <span>启用状态：{{ item.enabled === false ? "停用" : "启用" }}</span>
          <span>服务器：{{ item.serverNames.join(" / ") || "-" }}</span>
        </div>
      </article>
      <el-empty
        v-if="!componentCards.length && !loading"
        description="当前筛选条件下没有挂载映射"
      />
    </div>

    <el-dialog
      v-model="editorVisible"
      :title="editingId ? '编辑挂载' : '新增挂载'"
      width="620px"
    >
      <el-form label-width="110px">
        <el-form-item label="挂载名称">
          <el-input v-model="form.mountName" />
        </el-form-item>
        <el-form-item label="主机路径">
          <el-input v-model="form.hostPath" placeholder="/data/app" />
        </el-form-item>
        <el-form-item label="容器路径">
          <el-input v-model="form.containerPath" placeholder="/app/data" />
        </el-form-item>
        <el-form-item label="挂载类型">
          <el-select v-model="form.mountType" style="width: 100%">
            <el-option label="bind" value="bind" />
            <el-option label="volume" value="volume" />
            <el-option label="tmpfs" value="tmpfs" />
          </el-select>
        </el-form-item>
        <el-form-item label="只读">
          <el-switch v-model="form.readOnly" />
        </el-form-item>
        <el-form-item label="来源类型">
          <el-input
            v-model="form.sourceType"
            placeholder="manual / install-sync"
          />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editorVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveMount"
          >保存</el-button
        >
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { message } from "@repo/utils";
import {
  createDockerMount,
  deleteDockerMount,
  listDockerMounts,
  updateDockerMount,
} from "../api";
import type { DockerMount } from "../types";
import { useDockerServerSelection } from "../composables/useDockerServerSelection";

type DisplayMode = "server" | "component";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const saving = ref(false);
const editorVisible = ref(false);
const editingId = ref<number>();
const displayMode = ref<DisplayMode>("server");
const selectedServerId = ref<number>();
const keyword = ref("");
const mounts = ref<DockerMount[]>([]);
const serverKeywordFilters = ref<Record<number, string>>({});

const form = reactive<DockerMount>({
  serverId: 0,
  mountName: "",
  hostPath: "",
  containerPath: "",
  mountType: "bind",
  readOnly: false,
  sourceType: "manual",
  enabled: true,
});

const { mergedOptions, loadServers } = useDockerServerSelection();

const serverNameMap = computed(() => {
  const map = new Map<number, string>();
  mergedOptions.value.forEach((item) => {
    map.set(Number(item.serverId), item.serverName || String(item.serverId));
  });
  return map;
});

const componentCards = computed(() => {
  const map = new Map<string, DockerMount & { serverIds: Set<number> }>();
  mounts.value.forEach((item) => {
    const key =
      `${item.hostPath}:${item.containerPath}:${item.mountType || "bind"}:${item.readOnly ? "ro" : "rw"}`.toLowerCase();
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
      serverNames: serverIds.map(
        (id) => serverNameMap.value.get(id) || String(id),
      ),
    };
  });
});

const persistCurrentServerFilter = () => {
  if (displayMode.value !== "server" || !selectedServerId.value) {
    return;
  }
  serverKeywordFilters.value[selectedServerId.value] = keyword.value;
};

const applyServerFilter = (serverId?: number) => {
  if (!serverId) {
    return;
  }
  keyword.value = serverKeywordFilters.value[serverId] || "";
};

const serverFilterHint = (serverId: number) => {
  const current = serverKeywordFilters.value[serverId];
  return current?.trim() ? "关键词筛选中" : "默认筛选";
};

const syncRouteQuery = async () => {
  await router.replace({
    path: "/docker/mounts",
    query: {
      mode: displayMode.value,
      ...(displayMode.value === "server" && selectedServerId.value
        ? { serverId: String(selectedServerId.value) }
        : {}),
      ...(keyword.value.trim() ? { keyword: keyword.value.trim() } : {}),
    },
  });
};

const resetForm = () => {
  editingId.value = undefined;
  form.serverId = selectedServerId.value || 0;
  form.mountName = "";
  form.hostPath = "";
  form.containerPath = "";
  form.mountType = "bind";
  form.readOnly = false;
  form.sourceType = "manual";
  form.enabled = true;
  form.metadataJson = "";
};

const loadMounts = async () => {
  if (displayMode.value === "server" && !selectedServerId.value) {
    mounts.value = [];
    return;
  }
  loading.value = true;
  try {
    const result = await listDockerMounts({
      serverId:
        displayMode.value === "server" ? selectedServerId.value : undefined,
      keyword: keyword.value.trim() || undefined,
    });
    mounts.value = result.data || [];
  } catch (error: any) {
    message(error?.message || error?.msg || "加载挂载失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const handleFilterChange = async () => {
  persistCurrentServerFilter();
  await syncRouteQuery();
  await loadMounts();
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

const openEditor = (item?: DockerMount) => {
  if (!selectedServerId.value) {
    message("请先选择服务器", { type: "warning" });
    return;
  }
  resetForm();
  if (item?.dockerMountId) {
    editingId.value = item.dockerMountId;
    Object.assign(form, item);
  }
  editorVisible.value = true;
};

const saveMount = async () => {
  if (
    !selectedServerId.value ||
    !form.hostPath?.trim() ||
    !form.containerPath?.trim()
  ) {
    message("主机路径和容器路径不能为空", { type: "warning" });
    return;
  }
  saving.value = true;
  try {
    const payload: DockerMount = {
      ...form,
      serverId: selectedServerId.value,
      mountName: form.mountName?.trim() || undefined,
      hostPath: form.hostPath.trim(),
      containerPath: form.containerPath.trim(),
      mountType: form.mountType || "bind",
      sourceType: form.sourceType?.trim() || "manual",
    };
    if (editingId.value) {
      await updateDockerMount(editingId.value, payload);
    } else {
      await createDockerMount(payload);
    }
    message("挂载已保存", { type: "success" });
    editorVisible.value = false;
    await loadMounts();
  } catch (error: any) {
    message(error?.message || error?.msg || "挂载保存失败", { type: "error" });
  } finally {
    saving.value = false;
  }
};

const removeMount = async (item: DockerMount) => {
  if (!item.dockerMountId) {
    return;
  }
  await ElMessageBox.confirm(
    `确认删除挂载【${item.mountName || item.hostPath}】吗？`,
    "删除挂载",
    {
      type: "warning",
    },
  );
  try {
    await deleteDockerMount(item.dockerMountId);
    message("挂载已删除", { type: "success" });
    await loadMounts();
  } catch (error: any) {
    message(error?.message || error?.msg || "挂载删除失败", { type: "error" });
  }
};

onMounted(async () => {
  await loadServers();
  displayMode.value = route.query.mode === "component" ? "component" : "server";
  selectedServerId.value =
    displayMode.value === "server" && route.query.serverId
      ? Number(route.query.serverId)
      : mergedOptions.value[0]?.serverId;
  if (displayMode.value === "server" && selectedServerId.value) {
    serverKeywordFilters.value[selectedServerId.value] = route.query.keyword
      ? String(route.query.keyword)
      : "";
    applyServerFilter(selectedServerId.value);
  } else {
    keyword.value = route.query.keyword ? String(route.query.keyword) : "";
  }
  await loadMounts();
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
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.97),
    rgba(241, 245, 249, 0.88)
  );
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
  grid-template-columns: 1fr;
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
  grid-template-columns: 1fr;
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
  .workspace-body,
  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
