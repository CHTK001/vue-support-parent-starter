<template>
  <div class="page-card">
    <div class="page-header">
      <h2>{{ t("clients.title") }}</h2>
      <div class="page-header-actions">
        <el-tooltip :content="t('clients.scanAll')" placement="top">
          <el-button @click="scanAll" circle>
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <el-alert
      :title="t('clients.defaultClient') + ': ' + defaultClientName"
      type="info"
      show-icon
      :closable="false"
      style="margin-bottom: 20px"
    />

    <div class="client-cards">
      <div
        v-for="client in clients"
        :key="client.id"
        :class="['client-card', { 'is-default': settings.state.defaultClient === client.id }]"
      >
        <div class="card-header">
          <div class="client-logo">
            <img :src="client.logo" :alt="client.name" @error="handleLogoError($event, client)" />
          </div>
          <div class="client-info">
            <div class="client-name">
              {{ client.name }}
              <el-tag v-if="settings.state.defaultClient === client.id" type="success" size="small">
                Default
              </el-tag>
              <el-tag type="" size="small" effect="plain">
                {{ client.type }}
              </el-tag>
            </div>
            <div class="client-path" :title="getClientPath(client)">
              {{ getClientPath(client) }}
            </div>
          </div>
          <div class="client-status">
            <el-tag
              :type="statusMap[client.id] === 'found' ? 'success' : 'info'"
              size="small"
            >
              {{ statusMap[client.id] === 'found' ? t('clients.found') : t('clients.notFound') }}
            </el-tag>
          </div>
        </div>
        <div class="card-links">
          <el-button size="small" text type="primary" @click="goToMcp(client)">
            <el-icon><Connection /></el-icon> MCP
          </el-button>
          <el-button size="small" text type="success" @click="goToSkills(client)">
            <el-icon><Promotion /></el-icon> Skills
          </el-button>
        </div>
        <div class="card-actions">
          <el-tooltip :content="t('mcp.scan')" placement="top">
            <el-button size="small" circle @click="scanClient(client)">
              <el-icon><Search /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip :content="t('clients.setDefault')" placement="top">
            <el-button
              size="small"
              circle
              type="primary"
              :disabled="settings.state.defaultClient === client.id"
              @click="setDefault(client.id)"
            >
              <el-icon><Star /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { Refresh, Search, Star, Connection, Promotion } from "@element-plus/icons-vue";
import { MCP_CLIENTS, getClientConfigPath } from "@/utils/mcp-config";
import { useSettingsStore } from "@/stores/settings";
import { scanSingleClient, detectInstalledClients } from "@/services";

const { t } = useI18n();
const router = useRouter();
const settings = useSettingsStore();
const clients = MCP_CLIENTS;
const statusMap = reactive<Record<string, string>>({});

const defaultClientName = computed(() => {
  const client = MCP_CLIENTS.find((c) => c.id === settings.state.defaultClient);
  return client ? client.name : "None";
});

function getClientPath(client: (typeof MCP_CLIENTS)[0]) {
  return getClientConfigPath(client);
}

function setDefault(clientId: string) {
  settings.setDefaultClient(clientId);
  ElMessage.success("Default client updated");
}

async function scanClient(client: (typeof MCP_CLIENTS)[0]) {
  try {
    const configPaths = [getClientConfigPath(client)];
    const result = await scanSingleClient(client.id, configPaths);
    statusMap[client.id] = result.found ? "found" : "not-found";
    ElMessage.success(result.found ? t("clients.found") : t("clients.notFound"));
  } catch {
    statusMap[client.id] = "not-found";
    ElMessage.warning(t("clients.scanWebMode"));
  }
}

async function scanAll() {
  try {
    const results = await detectInstalledClients();
    results.forEach((r) => {
      statusMap[r.id] = r.installed ? "found" : "not-found";
    });
    ElMessage.success(t("clients.scanned"));
  } catch {
    clients.forEach((c) => { statusMap[c.id] = "not-found"; });
    ElMessage.warning(t("clients.scanWebMode"));
  }
}

function goToMcp(client: (typeof MCP_CLIENTS)[0]) {
  settings.setDefaultClient(client.id);
  router.push("/mcp/manager");
}

function goToSkills(client: (typeof MCP_CLIENTS)[0]) {
  settings.setDefaultClient(client.id);
  router.push("/skills/manager");
}

function handleLogoError(event: Event, client: (typeof MCP_CLIENTS)[0]) {
  const img = event.target as HTMLImageElement;
  img.style.display = "none";
  const parent = img.parentElement;
  if (parent) {
    parent.innerHTML = `<span style="font-size: 24px">${client.icon}</span>`;
  }
}
</script>

<style scoped>
.client-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.client-card {
  background: #ffffff;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
}

.client-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.client-card.is-default {
  border-color: var(--el-color-success);
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.client-logo {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.client-logo img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.client-info {
  flex: 1;
  min-width: 0;
}

.client-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.client-path {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-family: monospace;
  margin-top: 4px;
  word-break: break-all;
  line-height: 1.4;
  max-height: 2.8em;
  overflow: hidden;
  text-overflow: ellipsis;
}

.client-status {
  flex-shrink: 0;
}

.card-links {
  display: flex;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--el-border-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 8px;
}

.card-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
