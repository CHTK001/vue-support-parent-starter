<template>
  <section class="docker-page-shell">
    <header class="page-hero">
      <div>
        <small>DOCKER / CONNECTIONS</small>
        <h1>连接配置</h1>
        <p>按服务器维护 `server_docker` 配置，并直接进行探活验证。</p>
      </div>
      <el-button :loading="loading" @click="loadPageData">刷新</el-button>
    </header>

    <div class="page-grid">
      <article class="panel-card">
        <header class="panel-card__header">
          <div>
            <strong>服务器列表</strong>
            <p>先选择服务器，再配置 Docker 连接方式。</p>
          </div>
        </header>

        <el-select
          v-model="selectedServerId"
          filterable
          clearable
          placeholder="请选择服务器"
          style="width: 100%"
          @change="handleServerChange"
        >
          <el-option
            v-for="item in mergedOptions"
            :key="item.serverId"
            :label="`${item.serverName} (${item.host || '-'})`"
            :value="item.serverId"
          />
        </el-select>

        <div class="server-list">
          <button
            v-for="item in mergedOptions"
            :key="item.serverId"
            type="button"
            class="server-chip"
            :class="{ 'is-active': item.serverId === selectedServerId }"
            @click="selectedServerId = item.serverId; handleServerChange(item.serverId)"
          >
            <strong>{{ item.serverName }}</strong>
            <div class="server-chip__meta">
              <span>{{ item.host || "-" }}</span>
              <el-tag
                size="small"
                effect="light"
                :type="resolveCapabilityTagType(item.serverId)"
              >
                {{ resolveCapabilityLabel(item.serverId) }}
              </el-tag>
            </div>
          </button>
        </div>

        <div v-if="selectedCapability" class="server-capability">
          <div>
            <label>可连通</label>
            <strong>{{ selectedCapability.dockerConnectable ? "是" : "否" }}</strong>
          </div>
          <div>
            <label>Docker 版本</label>
            <strong>{{ selectedCapability.dockerVersion || "-" }}</strong>
          </div>
          <div>
            <label>运行时类型</label>
            <strong>{{ selectedCapability.runtimeType || "-" }}</strong>
          </div>
          <div>
            <label>探活耗时</label>
            <strong>{{ selectedCapability.probeLatencyMs || 0 }} ms</strong>
          </div>
        </div>
      </article>

      <article class="panel-card">
        <header class="panel-card__header">
          <div>
            <strong>连接表单</strong>
            <p>支持 `api / local / ssh` 三种连接方式。</p>
          </div>
          <div class="header-actions">
            <el-button :disabled="!selectedServerId" :loading="probing" @click="probeConnection">
              探活
            </el-button>
            <el-button type="primary" :disabled="!selectedServerId" :loading="saving" @click="saveConnection">
              保存
            </el-button>
          </div>
        </header>

        <el-form label-width="110px">
          <el-form-item label="连接类型">
            <el-select v-model="form.connectionType" style="width: 100%">
              <el-option label="API" value="api" />
              <el-option label="Local" value="local" />
              <el-option label="SSH" value="ssh" />
            </el-select>
          </el-form-item>
          <el-form-item label="Docker Host">
            <el-input v-model="form.dockerHost" placeholder="tcp host，api 模式可选覆盖服务器地址" />
          </el-form-item>
          <el-form-item label="Docker Port">
            <el-input-number v-model="form.dockerPort" :min="1" :max="65535" style="width: 100%" />
          </el-form-item>
          <el-form-item label="Socket 路径">
            <el-input v-model="form.socketPath" placeholder="如 /var/run/docker.sock" />
          </el-form-item>
          <el-form-item label="用户名">
            <el-input v-model="form.username" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="form.password" type="password" show-password />
          </el-form-item>
          <el-form-item label="证书路径">
            <el-input v-model="form.certPath" />
          </el-form-item>
          <el-form-item label="TLS">
            <el-switch v-model="form.tlsEnabled" />
          </el-form-item>
          <el-form-item label="超时(ms)">
            <el-input-number v-model="form.connectTimeoutMs" :min="1000" :max="120000" :step="1000" style="width: 100%" />
          </el-form-item>
          <el-form-item label="启用">
            <el-switch v-model="form.enabled" />
          </el-form-item>
        </el-form>
      </article>
    </div>

    <article v-if="probeResult" class="panel-card">
      <header class="panel-card__header">
        <div>
          <strong>探活结果</strong>
          <p>用于确认当前 `server_docker` 配置能否正常访问 Docker。</p>
        </div>
      </header>
      <div class="probe-grid">
        <div>
          <label>连接结果</label>
          <strong>{{ probeResult.success ? "成功" : "失败" }}</strong>
        </div>
        <div>
          <label>实际类型</label>
          <strong>{{ probeResult.connectionType || "-" }}</strong>
        </div>
        <div>
          <label>Docker 版本</label>
          <strong>{{ probeResult.dockerVersion || "-" }}</strong>
        </div>
        <div>
          <label>耗时</label>
          <strong>{{ probeResult.latencyMs || 0 }} ms</strong>
        </div>
      </div>
      <pre class="probe-console">{{ probeResult.output || probeResult.message || "-" }}</pre>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { message } from "@repo/utils";
import {
  getDockerServerConnection,
  listDockerServerCapabilities,
  probeDockerServerConnection,
  saveDockerServerConnection,
} from "../api";
import type {
  DockerServerCapabilityView,
  DockerServerConnectionConfig,
  DockerServerConnectionProbeView,
} from "../types";
import { useDockerServerSelection } from "../composables/useDockerServerSelection";

const loading = ref(false);
const saving = ref(false);
const probing = ref(false);
const selectedServerId = ref<number>();
const probeResult = ref<DockerServerConnectionProbeView | null>(null);
const capabilities = ref<DockerServerCapabilityView[]>([]);

const form = reactive<DockerServerConnectionConfig>({
  serverId: 0,
  connectionType: "api",
  dockerPort: 2375,
  socketPath: "/var/run/docker.sock",
  tlsEnabled: false,
  connectTimeoutMs: 30000,
  enabled: true,
});

const { mergedOptions, loadServers } = useDockerServerSelection();
const selectedCapability = computed(() =>
  capabilities.value.find(item => item.serverId === selectedServerId.value),
);

const resetForm = (serverId?: number) => {
  form.serverId = serverId || 0;
  form.connectionType = "api";
  form.dockerHost = "";
  form.dockerPort = 2375;
  form.socketPath = "/var/run/docker.sock";
  form.username = "";
  form.password = "";
  form.privateKey = "";
  form.tlsEnabled = false;
  form.certPath = "";
  form.connectTimeoutMs = 30000;
  form.enabled = true;
  form.metadataJson = "";
};

const handleServerChange = async (serverId?: number) => {
  probeResult.value = null;
  if (!serverId) {
    resetForm();
    return;
  }
  resetForm(serverId);
  try {
    const result = await getDockerServerConnection(serverId);
    if (result.data) {
      Object.assign(form, result.data, { serverId });
    }
  } catch {
    // 未配置时保持默认表单即可。
  }
};

const loadCapabilities = async () => {
  try {
    const result = await listDockerServerCapabilities();
    capabilities.value = result.data || [];
  } catch {
    capabilities.value = [];
  }
};

const resolveCapability = (serverId?: number) =>
  capabilities.value.find(item => item.serverId === serverId);

const resolveCapabilityLabel = (serverId?: number) => {
  const capability = resolveCapability(serverId);
  if (!capability) {
    return "未知";
  }
  if (!capability.dockerConfigured) {
    return "未配置";
  }
  if (capability.dockerConnectable) {
    return "可用";
  }
  return "不可用";
};

const resolveCapabilityTagType = (serverId?: number) => {
  const capability = resolveCapability(serverId);
  if (!capability) {
    return "info";
  }
  if (!capability.dockerConfigured) {
    return "warning";
  }
  if (capability.dockerConnectable) {
    return "success";
  }
  return "danger";
};

const loadPageData = async () => {
  loading.value = true;
  try {
    await Promise.all([loadServers(), loadCapabilities()]);
    if (!selectedServerId.value && mergedOptions.value.length) {
      selectedServerId.value = mergedOptions.value[0].serverId;
    }
    if (selectedServerId.value) {
      await handleServerChange(selectedServerId.value);
    }
  } finally {
    loading.value = false;
  }
};

const saveConnection = async () => {
  if (!selectedServerId.value) {
    message("请先选择服务器", { type: "warning" });
    return;
  }
  saving.value = true;
  try {
    await saveDockerServerConnection(selectedServerId.value, {
      ...form,
      serverId: selectedServerId.value,
    });
    await loadCapabilities();
    message("连接配置已保存", { type: "success" });
  } catch (error: any) {
    message(error?.message || error?.msg || "保存连接配置失败", { type: "error" });
  } finally {
    saving.value = false;
  }
};

const probeConnection = async () => {
  if (!selectedServerId.value) {
    message("请先选择服务器", { type: "warning" });
    return;
  }
  probing.value = true;
  try {
    await saveDockerServerConnection(selectedServerId.value, {
      ...form,
      serverId: selectedServerId.value,
    });
    const result = await probeDockerServerConnection(selectedServerId.value);
    probeResult.value = result.data || null;
    await loadCapabilities();
    message(probeResult.value?.success ? "探活成功" : "探活失败", {
      type: probeResult.value?.success ? "success" : "error",
    });
  } catch (error: any) {
    message(error?.message || error?.msg || "连接探活失败", { type: "error" });
  } finally {
    probing.value = false;
  }
};

onMounted(loadPageData);
</script>

<style scoped lang="scss">
.docker-page-shell {
  display: grid;
  gap: 18px;
}

.page-hero,
.panel-card {
  padding: 18px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(241, 245, 249, 0.88));
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.06);
}

.page-hero,
.panel-card__header,
.header-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.page-grid {
  display: grid;
  grid-template-columns: minmax(280px, 0.9fr) minmax(0, 1.1fr);
  gap: 16px;
}

.server-list {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.server-chip {
  text-align: left;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(248, 250, 252, 0.88);
}

.server-chip.is-active {
  border-color: rgba(14, 165, 233, 0.34);
  box-shadow: 0 14px 26px rgba(14, 165, 233, 0.1);
}

.server-chip strong {
  display: block;
  color: #0f172a;
}

.server-chip span,
.page-hero small,
.panel-card__header p {
  color: #64748b;
}

.server-chip__meta {
  margin-top: 4px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.server-capability {
  margin-top: 12px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(248, 250, 252, 0.7);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.server-capability label {
  display: block;
  color: #64748b;
  font-size: 12px;
}

.server-capability strong {
  color: #0f172a;
}

.probe-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.probe-grid label {
  display: block;
  color: #64748b;
  font-size: 12px;
}

.probe-grid strong {
  color: #0f172a;
}

.probe-console {
  margin: 16px 0 0;
  padding: 16px;
  border-radius: 18px;
  background: linear-gradient(180deg, #020617, #111827);
  color: #dbeafe;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 960px) {
  .page-grid,
  .probe-grid,
  .server-capability {
    grid-template-columns: 1fr;
  }
}
</style>
