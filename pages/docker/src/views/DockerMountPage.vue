<template>
  <section class="docker-page-shell">
    <header class="page-hero">
      <div>
        <small>DOCKER / MOUNTS</small>
        <h1>挂载管理</h1>
        <p>按服务器维护挂载映射，为安装向导和容器配置提供可复用的路径模板。</p>
      </div>
      <div class="hero-actions">
        <el-button :loading="loading" @click="loadMounts">刷新</el-button>
        <el-button type="primary" :disabled="!selectedServerId" @click="openEditor()">新增挂载</el-button>
      </div>
    </header>

    <article class="panel-card">
      <header class="panel-card__header">
        <div>
          <strong>筛选条件</strong>
          <p>必须先选择服务器，才展示该服务器的挂载映射。</p>
        </div>
      </header>
      <div class="toolbar-grid">
        <el-select
          v-model="selectedServerId"
          filterable
          clearable
          placeholder="请选择服务器"
          @change="loadMounts"
        >
          <el-option
            v-for="item in mergedOptions"
            :key="item.serverId"
            :label="`${item.serverName} (${item.host || '-'})`"
            :value="item.serverId"
          />
        </el-select>
        <el-input
          v-model="keyword"
          clearable
          placeholder="搜索挂载名、主机路径、容器路径"
          @keyup.enter="loadMounts"
        />
      </div>
    </article>

    <div v-if="selectedServerId" class="card-grid">
      <article v-for="item in mounts" :key="item.dockerMountId" class="resource-card">
        <header class="resource-card__header">
          <div>
            <strong>{{ item.mountName || item.hostPath }}</strong>
            <p>{{ item.mountType || "bind" }}</p>
          </div>
          <div class="status-tags">
            <el-tag size="small" effect="light">{{ item.sourceType || "manual" }}</el-tag>
            <el-tag size="small" effect="light" :type="item.readOnly ? 'warning' : 'success'">
              {{ item.readOnly ? "只读" : "读写" }}
            </el-tag>
          </div>
        </header>

        <div class="resource-card__meta">
          <span>主机路径：{{ item.hostPath }}</span>
          <span>容器路径：{{ item.containerPath }}</span>
          <span>启用状态：{{ item.enabled === false ? "停用" : "启用" }}</span>
        </div>

        <div class="resource-card__actions">
          <el-button @click="openEditor(item)">编辑</el-button>
          <el-button type="danger" plain @click="removeMount(item)">删除</el-button>
        </div>
      </article>

      <el-empty v-if="!mounts.length && !loading" description="当前服务器没有挂载映射" />
    </div>
    <el-empty v-else description="先选择一台服务器" />

    <el-dialog v-model="editorVisible" :title="editingId ? '编辑挂载' : '新增挂载'" width="620px">
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
          <el-input v-model="form.sourceType" placeholder="manual / install-sync" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editorVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveMount">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
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

const loading = ref(false);
const saving = ref(false);
const editorVisible = ref(false);
const editingId = ref<number>();
const selectedServerId = ref<number>();
const keyword = ref("");
const mounts = ref<DockerMount[]>([]);

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
  if (!selectedServerId.value) {
    mounts.value = [];
    return;
  }
  loading.value = true;
  try {
    const result = await listDockerMounts({
      serverId: selectedServerId.value,
      keyword: keyword.value.trim() || undefined,
    });
    mounts.value = result.data || [];
  } catch (error: any) {
    message(error?.message || error?.msg || "加载挂载失败", { type: "error" });
  } finally {
    loading.value = false;
  }
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
  if (!selectedServerId.value || !form.hostPath?.trim() || !form.containerPath?.trim()) {
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
  await ElMessageBox.confirm(`确认删除挂载【${item.mountName || item.hostPath}】吗？`, "删除挂载", {
    type: "warning",
  });
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

.card-grid {
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

@media (max-width: 960px) {
  .toolbar-grid,
  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
