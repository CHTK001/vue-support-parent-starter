<template>
  <section class="docker-page-shell">
    <header class="page-hero">
      <div>
        <small>DOCKER / NETWORKS</small>
        <h1>网络管理</h1>
        <p>按服务器维护网络映射，为安装向导与容器网络配置提供统一入口。</p>
      </div>
      <div class="hero-actions">
        <el-button :loading="loading" @click="loadNetworks">刷新</el-button>
        <el-button type="primary" :disabled="!selectedServerId" @click="openEditor()">新增网络</el-button>
      </div>
    </header>

    <article class="panel-card">
      <header class="panel-card__header">
        <div>
          <strong>筛选条件</strong>
          <p>必须先选择服务器，才展示该服务器的网络映射。</p>
        </div>
      </header>
      <div class="toolbar-grid">
        <el-select
          v-model="selectedServerId"
          filterable
          clearable
          placeholder="请选择服务器"
          @change="loadNetworks"
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
          placeholder="搜索网络名、驱动、CIDR"
          @keyup.enter="loadNetworks"
        />
      </div>
    </article>

    <div v-if="selectedServerId" class="card-grid">
      <article v-for="item in networks" :key="item.dockerNetworkId" class="resource-card">
        <header class="resource-card__header">
          <div>
            <strong>{{ item.networkName }}</strong>
            <p>{{ item.driver || "bridge" }}</p>
          </div>
          <div class="status-tags">
            <el-tag size="small" effect="light">{{ item.sourceType || "manual" }}</el-tag>
            <el-tag size="small" effect="light" :type="item.internalNetwork ? 'warning' : 'success'">
              {{ item.internalNetwork ? "内部网络" : "普通网络" }}
            </el-tag>
          </div>
        </header>

        <div class="resource-card__meta">
          <span>子网：{{ item.subnetCidr || "-" }}</span>
          <span>网关：{{ item.gatewayIp || "-" }}</span>
          <span>可附着：{{ item.attachable === false ? "否" : "是" }}</span>
          <span>启用状态：{{ item.enabled === false ? "停用" : "启用" }}</span>
        </div>

        <div class="resource-card__actions">
          <el-button @click="openEditor(item)">编辑</el-button>
          <el-button type="danger" plain @click="removeNetwork(item)">删除</el-button>
        </div>
      </article>

      <el-empty v-if="!networks.length && !loading" description="当前服务器没有网络映射" />
    </div>
    <el-empty v-else description="先选择一台服务器" />

    <el-dialog v-model="editorVisible" :title="editingId ? '编辑网络' : '新增网络'" width="620px">
      <el-form label-width="110px">
        <el-form-item label="网络名称">
          <el-input v-model="form.networkName" />
        </el-form-item>
        <el-form-item label="驱动类型">
          <el-select v-model="form.driver" style="width: 100%">
            <el-option label="bridge" value="bridge" />
            <el-option label="host" value="host" />
            <el-option label="overlay" value="overlay" />
            <el-option label="macvlan" value="macvlan" />
          </el-select>
        </el-form-item>
        <el-form-item label="子网 CIDR">
          <el-input v-model="form.subnetCidr" placeholder="172.18.0.0/16" />
        </el-form-item>
        <el-form-item label="网关 IP">
          <el-input v-model="form.gatewayIp" placeholder="172.18.0.1" />
        </el-form-item>
        <el-form-item label="可附着">
          <el-switch v-model="form.attachable" />
        </el-form-item>
        <el-form-item label="内部网络">
          <el-switch v-model="form.internalNetwork" />
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
        <el-button type="primary" :loading="saving" @click="saveNetwork">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { message } from "@repo/utils";
import {
  createDockerNetwork,
  deleteDockerNetwork,
  listDockerNetworks,
  updateDockerNetwork,
} from "../api";
import type { DockerNetwork } from "../types";
import { useDockerServerSelection } from "../composables/useDockerServerSelection";

const loading = ref(false);
const saving = ref(false);
const editorVisible = ref(false);
const editingId = ref<number>();
const selectedServerId = ref<number>();
const keyword = ref("");
const networks = ref<DockerNetwork[]>([]);

const form = reactive<DockerNetwork>({
  serverId: 0,
  networkName: "",
  driver: "bridge",
  subnetCidr: "",
  gatewayIp: "",
  attachable: true,
  internalNetwork: false,
  sourceType: "manual",
  enabled: true,
});

const { mergedOptions, loadServers } = useDockerServerSelection();

const resetForm = () => {
  editingId.value = undefined;
  form.serverId = selectedServerId.value || 0;
  form.networkName = "";
  form.driver = "bridge";
  form.subnetCidr = "";
  form.gatewayIp = "";
  form.attachable = true;
  form.internalNetwork = false;
  form.sourceType = "manual";
  form.enabled = true;
  form.metadataJson = "";
};

const loadNetworks = async () => {
  if (!selectedServerId.value) {
    networks.value = [];
    return;
  }
  loading.value = true;
  try {
    const result = await listDockerNetworks({
      serverId: selectedServerId.value,
      keyword: keyword.value.trim() || undefined,
    });
    networks.value = result.data || [];
  } catch (error: any) {
    message(error?.message || error?.msg || "加载网络失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const openEditor = (item?: DockerNetwork) => {
  if (!selectedServerId.value) {
    message("请先选择服务器", { type: "warning" });
    return;
  }
  resetForm();
  if (item?.dockerNetworkId) {
    editingId.value = item.dockerNetworkId;
    Object.assign(form, item);
  }
  editorVisible.value = true;
};

const saveNetwork = async () => {
  if (!selectedServerId.value || !form.networkName?.trim()) {
    message("网络名称不能为空", { type: "warning" });
    return;
  }
  saving.value = true;
  try {
    const payload: DockerNetwork = {
      ...form,
      serverId: selectedServerId.value,
      networkName: form.networkName.trim(),
      driver: form.driver || "bridge",
      subnetCidr: form.subnetCidr?.trim() || undefined,
      gatewayIp: form.gatewayIp?.trim() || undefined,
      sourceType: form.sourceType?.trim() || "manual",
    };
    if (editingId.value) {
      await updateDockerNetwork(editingId.value, payload);
    } else {
      await createDockerNetwork(payload);
    }
    message("网络已保存", { type: "success" });
    editorVisible.value = false;
    await loadNetworks();
  } catch (error: any) {
    message(error?.message || error?.msg || "网络保存失败", { type: "error" });
  } finally {
    saving.value = false;
  }
};

const removeNetwork = async (item: DockerNetwork) => {
  if (!item.dockerNetworkId) {
    return;
  }
  await ElMessageBox.confirm(`确认删除网络【${item.networkName}】吗？`, "删除网络", {
    type: "warning",
  });
  try {
    await deleteDockerNetwork(item.dockerNetworkId);
    message("网络已删除", { type: "success" });
    await loadNetworks();
  } catch (error: any) {
    message(error?.message || error?.msg || "网络删除失败", { type: "error" });
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
