<template>
  <div class="page-card">
    <BackButton to="/dashboard" />

    <div class="page-header">
      <h2>{{ t("clients.title") }}</h2>
      <div class="page-header-actions">
        <el-button type="primary" size="small" @click="scanAll" :loading="scanning">
          <el-icon><Search /></el-icon> {{ t('clients.scanAll') }}
        </el-button>
      </div>
    </div>

    <CardNav :items="settingsNav" />

    <el-alert
      :title="t('clients.defaultClient') + ': ' + defaultClientName"
      type="info"
      show-icon
      :closable="false"
      style="margin-bottom: 20px"
    />

    <div class="client-cards" v-loading="loading">
      <div
        v-for="client in clients"
        :key="client.id"
        :class="['client-card', { 'is-default': settings.state.defaultClient === client.id, 'is-disabled': !client.enabled }]"
      >
        <div class="card-header">
          <div class="client-logo">
            <el-image :src="client.logo" :alt="client.name" style="width:28px;height:28px">
              <template #error>
                <span style="font-size:22px;line-height:1">{{ client.icon || "🔧" }}</span>
              </template>
            </el-image>
          </div>
          <div class="client-info">
            <div class="client-name">
              {{ client.name }}
              <el-tag v-if="client.installed" type="success" size="small" effect="plain">
                {{ t('clients.found') }}
              </el-tag>
              <el-tag v-if="settings.state.defaultClient === client.id" type="success" size="small">
                {{ t('clients.defaultClient') }}
              </el-tag>
              <el-tag size="small" effect="plain">
                {{ client.type }}
              </el-tag>
              <el-tag v-if="!client.enabled" type="danger" size="small">已禁用</el-tag>
            </div>
            <div class="client-path" :title="getClientPath(client)">
              {{ getClientPath(client) }}
            </div>
          </div>
          <div class="client-status">
            <el-tag
              :type="client.scanStatus === 'found' ? 'success' : 'info'"
              size="small"
            >
              {{ client.scanStatus === 'found' ? t('clients.found') : t('clients.notFound') }}
            </el-tag>
          </div>
        </div>
        <div class="card-links">
          <el-button size="small" text type="primary" @click="goToMcp(client)" :disabled="!client.enabled">
            <el-icon><Connection /></el-icon> MCP
          </el-button>
          <el-button size="small" text type="success" @click="goToSkills(client)" :disabled="!client.enabled">
            <el-icon><Promotion /></el-icon> Skills
          </el-button>
        </div>
        <div class="card-actions">
          <el-popover placement="bottom-end" :width="160" trigger="click">
            <template #reference>
              <el-button size="small" circle><el-icon><MoreFilled /></el-icon></el-button>
            </template>
            <div class="action-menu">
              <div class="action-item" @click="scanClient(client)">
                <el-icon><Search /></el-icon> 扫描
              </div>
              <div class="action-item" @click="openEdit(client)">
                <el-icon><Edit /></el-icon> 编辑路径
              </div>
              <div class="action-item" @click="toggleEnabled(client)">
                <el-icon><component :is="client.enabled ? 'Remove' : 'Check'" /></el-icon>
                {{ client.enabled ? '禁用' : '启用' }}
              </div>
              <div class="action-item" :class="{ disabled: settings.state.defaultClient === client.id }" @click="setDefault(client.id)">
                <el-icon><Star /></el-icon> 设为默认
              </div>
            </div>
          </el-popover>
        </div>
      </div>
    </div>

    <el-dialog v-model="editVisible" :title="t('clients.editTitle', { name: editClient?.name })" width="560px" destroy-on-close>
      <el-form v-if="editClient" label-width="100px" size="small">
        <el-form-item :label="t('clients.editConfigPath')">
          <el-input v-model="editForm.configPaths" placeholder="%USERPROFILE%/.config/agent/mcp.json" />
        </el-form-item>
        <el-form-item :label="t('clients.editHomeDir')">
          <el-input v-model="editForm.homeDir" placeholder="%USERPROFILE%/.config/agent" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="editVisible = false">{{ t('clients.editCancel') }}</el-button>
        <el-button size="small" type="primary" @click="saveEdit" :loading="saving">{{ t('clients.editSave') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { Search, Star, Connection, Promotion, Edit, MoreFilled } from "@element-plus/icons-vue";
import { useSettingsStore } from "@/stores/settings";
import { listAgentClients, scanAgentClient, scanAllClients, updateAgentClientConfig, toggleAgentClientEnabled, type AgentClientData } from "@/services";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const settings = useSettingsStore();

const navIcons = {
  general: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
  sync: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>',
  clients: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
  mcpskills: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
};

const settingsNav = computed(() => [
  { name: t('menu.settingsGeneral'), desc: '通用设置', path: '/settings/general', icon: navIcons.general },
  { name: t('menu.settingsSync'), desc: '同步配置', path: '/settings/sync', icon: navIcons.sync },
  { name: t('menu.settingsClients'), desc: '客户端管理', path: '/settings/clients', icon: navIcons.clients },
  { name: 'MCP / Skills', desc: 'MCP 与 Skills 配置', path: '/settings/mcpskills', icon: navIcons.mcpskills },
]);

const clients = ref<AgentClientData[]>([]);
const loading = ref(false);
const scanning = ref(false);
const scanningId = ref("");
const saving = ref(false);
const editVisible = ref(false);
const editClient = ref<AgentClientData | null>(null);
const editForm = reactive({ configPaths: "", homeDir: "" });

const defaultClientName = computed(() => {
  const c = clients.value.find((c) => c.id === settings.state.defaultClient);
  return c ? c.name : "None";
});

function getConfigPath(configPaths: string): string {
  try {
    const paths = JSON.parse(configPaths);
    const platform = navigator.userAgent.includes("Win") ? "win32" : navigator.userAgent.includes("Mac") ? "darwin" : "linux";
    return paths[platform] || paths.win32 || "";
  } catch {
    return configPaths;
  }
}

function getClientPath(client: AgentClientData): string {
  const p = getConfigPath(client.configPaths);
  return p || (client as any).homeDir || "";
}

function setDefault(clientId: string) {
  settings.setDefaultClient(clientId);
  ElMessage.success(t("clients.defaultClient") + " updated");
}

async function loadClients() {
  loading.value = true;
  try {
    clients.value = await listAgentClients();
  } catch {
    clients.value = [];
  } finally {
    loading.value = false;
  }
}

async function scanClient(client: AgentClientData) {
  scanningId.value = client.id;
  try {
    const result: any = await scanAgentClient(client.id);
    const found = result?.found === true;
    client.scanStatus = found ? "found" : "not-found";
    client.installed = found;
    ElMessage.success(found ? t("clients.found") : t("clients.notFound"));
  } catch {
    client.scanStatus = "not-found";
    client.installed = false;
    ElMessage.info(t("clients.notFound"));
  } finally {
    scanningId.value = "";
  }
}

async function scanAll() {
  scanning.value = true;
  try {
    await scanAllClients();
    await loadClients();
    ElMessage.success(t("clients.scanned"));
  } catch {
    ElMessage.success(t("clients.scanned"));
  } finally {
    scanning.value = false;
    scanningId.value = "";
  }
}

function goToMcp(client: AgentClientData) {
  settings.setDefaultClient(client.id);
  router.push("/ai/config");
}

function goToSkills(client: AgentClientData) {
  settings.setDefaultClient(client.id);
  router.push("/ai/config");
}

function openEdit(client: AgentClientData) {
  editClient.value = client;
  editForm.configPaths = client.configPaths || "";
  editForm.homeDir = client.homeDir || "";
  editVisible.value = true;
}

async function saveEdit() {
  if (!editClient.value) return;
  saving.value = true;
  try {
    await updateAgentClientConfig(editClient.value.id, editForm.configPaths, editForm.homeDir);
    editClient.value.configPaths = editForm.configPaths;
    editClient.value.homeDir = editForm.homeDir;
    ElMessage.success(t("clients.editSaved"));
    editVisible.value = false;
  } catch {
    ElMessage.error(t("clients.editFailed"));
  } finally {
    saving.value = false;
  }
}

async function toggleEnabled(client: AgentClientData) {
  const newVal = !client.enabled;
  try {
    await toggleAgentClientEnabled(client.id, newVal);
    client.enabled = newVal;
  } catch {
    ElMessage.error("切换失败");
  }
}

onMounted(() => loadClients());
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

.client-card.is-disabled {
  opacity: 0.5;
  background: var(--el-fill-color-lighter);
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

.action-menu { display: flex; flex-direction: column; gap: 2px; }
.action-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; transition: background .15s; }
.action-item:hover { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
.action-item.disabled { opacity: .4; cursor: not-allowed; }
.action-item .el-icon { font-size: 15px; }
</style>
