<template>
  <div class="page-card ai-page">
    <!-- Client Cards Header -->
    <div class="client-cards-header">
      <div class="client-cards-scroll">
        <div
          v-for="client in installedClients"
          :key="client.id"
          :class="['client-card-item', { active: activeClientId === client.id }]"
          @click="selectClient(client)"
        >
          <img :src="client.logo" class="card-logo" @error="handleLogoError($event)" />
          <div class="card-info">
            <span class="card-name">{{ client.name }}</span>
            <el-tag v-if="client.installed" type="success" size="small">{{ t('ai.installed') }}</el-tag>
            <el-tag v-else type="info" size="small">{{ t('ai.notDetected') }}</el-tag>
          </div>
        </div>
      </div>
      <el-tooltip :content="t('ai.scanClients')" placement="top">
        <el-button circle size="small" @click="scanClients" :loading="scanning">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </el-tooltip>
    </div>

    <!-- Active Client Config -->
    <div v-if="activeClient" class="client-config">
      <div class="config-header">
        <img :src="activeClient.logo" class="config-logo" @error="handleLogoError($event)" />
        <div class="config-title">
          <h3>{{ activeClient.name }} {{ t('ai.configuration') }}</h3>
          <span class="config-path">{{ activeClient.configPath }}</span>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="config-tabs">
        <!-- MCP Tab -->
        <el-tab-pane :label="'MCP (' + selectedMcpCount + ')'" name="mcp">
          <div class="tab-toolbar">
            <el-input v-model="mcpSearch" :placeholder="t('ai.searchMcp')" clearable prefix-icon="Search" style="width: 220px" />
            <div class="toolbar-right">
              <el-button size="small" @click="mcpStore.selectAll">{{ t('ai.selectAll') }}</el-button>
              <el-button size="small" @click="mcpStore.deselectAll">{{ t('ai.deselectAll') }}</el-button>
              <el-divider direction="vertical" />
              <el-button size="small" type="primary" @click="updateMcp">
                <el-icon><RefreshRight /></el-icon> {{ t('ai.update') }}
              </el-button>
              <el-button size="small" @click="backupMcp">
                <el-icon><FolderChecked /></el-icon> {{ t('ai.backup') }}
              </el-button>
            </div>
          </div>
          <el-table :data="mcpStore.filteredServers" style="width: 100%" max-height="calc(100vh - 380px)" @row-click="(row: any) => mcpStore.toggleServer(row.id)" row-class-name="clickable-row">
            <el-table-column width="40" align="center">
              <template #default="{ row }">
                <el-checkbox :model-value="mcpStore.isSelected(row.id)" @click.stop @change="mcpStore.toggleServer(row.id)" />
              </template>
            </el-table-column>
            <el-table-column :label="t('ai.serverName')" min-width="180">
              <template #default="{ row }">
                <div class="server-cell">
                  <span class="server-icon">{{ row.icon }}</span>
                  <div>
                    <div class="server-name">{{ row.name }}</div>
                    <div class="server-desc">{{ row.description }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="t('ai.category')" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="getCategoryType(row.category)">{{ row.category }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="t('ai.package')" width="160">
              <template #default="{ row }">
                <code v-if="row.npm" class="pkg-name">{{ row.npm }}</code>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- Skills Tab -->
        <el-tab-pane :label="'Skills (' + selectedSkillCount + ')'" name="skills">
          <div class="tab-toolbar">
            <el-input v-model="skillSearch" :placeholder="t('ai.searchSkills')" clearable prefix-icon="Search" style="width: 220px" />
            <div class="toolbar-right">
              <el-button size="small" @click="skillsStore.selectAll">{{ t('ai.selectAll') }}</el-button>
              <el-button size="small" @click="skillsStore.deselectAll">{{ t('ai.deselectAll') }}</el-button>
              <el-divider direction="vertical" />
              <el-button size="small" type="primary" @click="updateSkills">
                <el-icon><RefreshRight /></el-icon> {{ t('ai.update') }}
              </el-button>
              <el-button size="small" @click="backupSkills">
                <el-icon><FolderChecked /></el-icon> {{ t('ai.backup') }}
              </el-button>
            </div>
          </div>
          <el-table :data="skillsStore.filteredSkills" style="width: 100%" max-height="calc(100vh - 380px)" @row-click="(row: any) => skillsStore.toggleSkill(row.id)" row-class-name="clickable-row">
            <el-table-column width="40" align="center">
              <template #default="{ row }">
                <el-checkbox :model-value="skillsStore.isSelected(row.id)" @click.stop @change="skillsStore.toggleSkill(row.id)" />
              </template>
            </el-table-column>
            <el-table-column :label="t('ai.skillName')" min-width="180">
              <template #default="{ row }">
                <div class="server-name">{{ row.name }}</div>
                <div class="server-desc">{{ row.description }}</div>
              </template>
            </el-table-column>
            <el-table-column :label="t('ai.category')" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="getCategoryType(row.category)">{{ row.category }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="t('ai.enabled')" width="70" align="center">
              <template #default="{ row }">
                <el-switch :model-value="row.enabled" @click.stop @change="skillsStore.toggleEnabled(row.id)" size="small" />
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- Providers Tab -->
        <el-tab-pane :label="t('ai.providers')" name="providers">
          <div class="tab-toolbar">
            <el-button size="small" type="primary" @click="openProviderDialog">
              <el-icon><Plus /></el-icon> {{ t('ai.addProvider') }}
            </el-button>
          </div>
          <el-table :data="providerStore.providers" style="width: 100%">
            <el-table-column width="50" align="center">
              <template #default="{ row }">
                <el-radio :model-value="providerStore.activeProviderId" :value="row.id" @change="providerStore.setActiveProvider(row.id)" />
              </template>
            </el-table-column>
            <el-table-column :label="t('ai.providerName')" min-width="120">
              <template #default="{ row }">
                <div class="provider-name">
                  <span class="provider-dot" :style="{ background: row.isActive ? '#67C23A' : '#909399' }"></span>
                  {{ row.name }}
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="t('ai.apiBase')" min-width="180">
              <template #default="{ row }">
                <code class="api-base">{{ row.apiBase }}</code>
              </template>
            </el-table-column>
            <el-table-column :label="t('ai.apiKey')" width="120">
              <template #default="{ row }">
                <span v-if="row.apiKey" class="key-masked">{{ maskKey(row.apiKey) }}</span>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column :label="t('ai.models')" min-width="200">
              <template #default="{ row }">
                <div class="model-tags">
                  <el-tag v-for="m in row.models.slice(0, 3)" :key="m" size="small" type="info">{{ m }}</el-tag>
                  <el-tag v-if="row.models.length > 3" size="small">+{{ row.models.length - 3 }}</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column width="60" align="center">
              <template #default="{ row }">
                <el-switch :model-value="row.isActive" @change="providerStore.toggleProvider(row.id)" size="small" />
              </template>
            </el-table-column>
            <el-table-column :label="t('common.actions')" width="120" align="center">
              <template #default="{ row }">
                <el-button size="small" text type="primary" @click="editProvider(row)">{{ t('common.edit') }}</el-button>
                <el-button size="small" text type="danger" @click="deleteProvider(row.id)">{{ t('common.delete') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- JSON Preview Tab -->
        <el-tab-pane label="JSON" name="json">
          <div class="json-preview">
            <div class="json-toolbar">
              <el-button size="small" text @click="copyJson"><el-icon><CopyDocument /></el-icon> {{ t('ai.copy') }}</el-button>
              <el-button size="small" text @click="downloadCurrentJson"><el-icon><Download /></el-icon> {{ t('ai.download') }}</el-button>
            </div>
            <pre><code>{{ jsonOutput }}</code></pre>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <div v-else class="no-client">
      <el-empty :description="t('ai.selectClient')" />
    </div>

    <!-- Provider Dialog -->
    <el-dialog v-model="providerDialogVisible" :title="editingProvider ? t('ai.editProvider') : t('ai.addProvider')" width="480px" destroy-on-close>
      <el-form label-width="90px">
        <el-form-item :label="t('ai.providerName')"><el-input v-model="providerForm.name" /></el-form-item>
        <el-form-item :label="t('ai.apiBase')"><el-input v-model="providerForm.apiBase" placeholder="https://api.example.com/v1" /></el-form-item>
        <el-form-item :label="t('ai.apiKey')"><el-input v-model="providerForm.apiKey" type="password" show-password placeholder="sk-..." /></el-form-item>
        <el-form-item :label="t('ai.models')"><el-input v-model="providerForm.modelsStr" type="textarea" :rows="4" :placeholder="t('ai.modelsPlaceholder')" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="providerDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveProvider">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage, ElMessageBox } from "element-plus";
import { Refresh, FolderChecked, Download, CopyDocument, Plus, RefreshRight } from "@element-plus/icons-vue";
import { useMcpStore } from "@/stores/mcp";
import { useSkillsStore } from "@/stores/skills";
import { useProviderStore, type ModelProvider } from "@/stores/provider";
import { useSettingsStore } from "@/stores/settings";
import { MCP_CLIENTS, getClientConfigPath, exportToJson, downloadJson as downloadJsonFile } from "@/utils/mcp-config";

const { t } = useI18n();
const mcpStore = useMcpStore();
const skillsStore = useSkillsStore();
const providerStore = useProviderStore();
const settings = useSettingsStore();

const activeClientId = ref(settings.state.defaultClient || "claude-desktop");
const activeTab = ref("mcp");
const mcpSearch = ref("");
const skillSearch = ref("");
const scanning = ref(false);

interface ClientInfo { id: string; name: string; logo: string; installed: boolean; configPath: string; mcpData?: string; skillsData?: string; }
const installedClients = ref<ClientInfo[]>([]);

const activeClient = computed(() => installedClients.value.find((c) => c.id === activeClientId.value));
const selectedMcpCount = computed(() => mcpStore.selectedCount);
const selectedSkillCount = computed(() => skillsStore.selectedCount);

const jsonOutput = computed(() => {
  if (activeTab.value === "mcp") return mcpStore.mcpJsonOutput;
  if (activeTab.value === "skills") return JSON.stringify(skillsStore.generateSkillsJson(), null, 2);
  return "{}";
});

function selectClient(client: ClientInfo) { activeClientId.value = client.id; settings.setDefaultClient(client.id); loadClientData(client.id); }

function getCategoryType(category: string) {
  const map: Record<string, string> = { filesystem: "", database: "success", search: "warning", cloud: "info", devtools: "danger", ai: "success", code: "success", ui: "warning", other: "info" };
  return map[category] || "";
}

function maskKey(key: string) { return key.length <= 8 ? "****" : key.substring(0, 4) + "****" + key.substring(key.length - 4); }
function handleLogoError(event: Event) { (event.target as HTMLImageElement).style.display = "none"; }

async function scanClients() {
  scanning.value = true;
  installedClients.value = MCP_CLIENTS.map((client) => ({
    id: client.id, name: client.name, logo: client.logo,
    installed: !!localStorage.getItem(`mcp-client-${client.id}`),
    configPath: getClientConfigPath(client)
  }));
  scanning.value = false;
}

function loadClientData(clientId: string) {
  const mcpData = localStorage.getItem(`mcp-data-${clientId}`);
  const skillsData = localStorage.getItem(`skills-data-${clientId}`);
  if (mcpData) { try { mcpStore.loadPreset(JSON.parse(mcpData)); } catch {} }
  if (skillsData) { try { skillsStore.addSkills(JSON.parse(skillsData)); } catch {} }
}

// MCP Operations
function updateMcp() {
  const data = JSON.stringify(mcpStore.selectedServers);
  localStorage.setItem(`mcp-data-${activeClientId.value}`, data);
  localStorage.setItem(`mcp-client-${activeClientId.value}`, "true");
  const client = installedClients.value.find((c) => c.id === activeClientId.value);
  if (client) client.installed = true;
  ElMessage.success("MCP updated for " + activeClient.value?.name);
}

function backupMcp() {
  const data = mcpStore.mcpJsonOutput;
  downloadJsonFile(data, `${activeClientId.value}-mcp-backup.json`);
  ElMessage.success("MCP backup downloaded");
}

// Skills Operations
function updateSkills() {
  const data = JSON.stringify(skillsStore.selectedSkills);
  localStorage.setItem(`skills-data-${activeClientId.value}`, data);
  ElMessage.success("Skills updated for " + activeClient.value?.name);
}

function backupSkills() {
  const data = JSON.stringify(skillsStore.generateSkillsJson(), null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `${activeClientId.value}-skills-backup.json`; a.click();
  URL.revokeObjectURL(url);
  ElMessage.success("Skills backup downloaded");
}

// Provider Operations
const providerDialogVisible = ref(false);
const editingProvider = ref<ModelProvider | null>(null);
const providerForm = ref({ name: "", apiBase: "", apiKey: "", modelsStr: "" });

function openProviderDialog() { editingProvider.value = null; providerForm.value = { name: "", apiBase: "", apiKey: "", modelsStr: "" }; providerDialogVisible.value = true; }
function editProvider(p: ModelProvider) { editingProvider.value = p; providerForm.value = { name: p.name, apiBase: p.apiBase, apiKey: p.apiKey || "", modelsStr: p.models.join("\n") }; providerDialogVisible.value = true; }

async function deleteProvider(id: string) {
  await ElMessageBox.confirm(t("common.confirm"), t("common.delete"), { type: "warning" });
  providerStore.removeProvider(id);
  ElMessage.success(t("common.delete"));
}

function saveProvider() {
  const models = providerForm.value.modelsStr.split("\n").map((m) => m.trim()).filter(Boolean);
  if (editingProvider.value) {
    providerStore.updateProvider(editingProvider.value.id, { name: providerForm.value.name, apiBase: providerForm.value.apiBase, apiKey: providerForm.value.apiKey, models });
  } else {
    const id = providerForm.value.name.toLowerCase().replace(/\s+/g, "-");
    providerStore.addProvider({ id, name: providerForm.value.name, apiBase: providerForm.value.apiBase, apiKey: providerForm.value.apiKey, models, isActive: true } as ModelProvider);
  }
  providerDialogVisible.value = false;
  ElMessage.success(t("common.save"));
}

function copyJson() { navigator.clipboard.writeText(jsonOutput.value).then(() => ElMessage.success("Copied")); }
function downloadCurrentJson() { downloadJsonFile(jsonOutput.value, activeTab.value === "mcp" ? "mcp.json" : "skills.json"); ElMessage.success("Downloaded"); }

onMounted(() => scanClients());
</script>

<style scoped>
.ai-page { height: calc(100vh - 100px); display: flex; flex-direction: column; }
.client-cards-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--el-border-color-lighter); }
.client-cards-scroll { flex: 1; display: flex; gap: 12px; overflow-x: auto; padding: 4px 0; }
.client-card-item { display: flex; align-items: center; gap: 10px; padding: 10px 16px; background: var(--el-fill-color-lighter); border: 2px solid transparent; border-radius: 8px; cursor: pointer; transition: all 0.2s; flex-shrink: 0; min-width: 150px; }
.client-card-item:hover { border-color: var(--el-color-primary-light-5); }
.client-card-item.active { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.card-logo { width: 28px; height: 28px; object-fit: contain; }
.card-info { display: flex; flex-direction: column; gap: 2px; }
.card-name { font-size: 13px; font-weight: 500; }
.client-config { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.config-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.config-logo { width: 32px; height: 32px; object-fit: contain; }
.config-title { flex: 1; }
.config-title h3 { margin: 0; font-size: 16px; }
.config-path { font-size: 11px; color: var(--el-text-color-secondary); font-family: monospace; }
.config-tabs { flex: 1; overflow: hidden; }
.config-tabs :deep(.el-tabs__content) { flex: 1; overflow: auto; }
.config-tabs :deep(.el-tab-pane) { height: 100%; }
.tab-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.toolbar-right { margin-left: auto; display: flex; gap: 8px; align-items: center; }
.server-cell { display: flex; align-items: center; gap: 8px; }
.server-icon { font-size: 18px; }
.server-name { font-size: 13px; font-weight: 500; }
.server-desc { font-size: 11px; color: var(--el-text-color-secondary); }
.pkg-name { font-size: 11px; color: var(--el-text-color-secondary); font-family: monospace; }
.text-muted { color: var(--el-text-color-placeholder); }
.provider-name { display: flex; align-items: center; gap: 6px; font-weight: 500; }
.provider-dot { width: 8px; height: 8px; border-radius: 50%; }
.api-base { font-size: 11px; color: var(--el-text-color-secondary); background: var(--el-fill-color-lighter); padding: 2px 6px; border-radius: 4px; }
.key-masked { font-family: monospace; font-size: 11px; color: var(--el-text-color-secondary); }
.model-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.json-preview { display: flex; flex-direction: column; height: 100%; }
.json-toolbar { display: flex; gap: 8px; margin-bottom: 8px; }
.json-preview pre { flex: 1; overflow: auto; margin: 0; font-size: 12px; line-height: 1.6; font-family: monospace; background: var(--el-fill-color-lighter); padding: 12px; border-radius: 4px; white-space: pre-wrap; word-break: break-all; }
.no-client { flex: 1; display: flex; align-items: center; justify-content: center; }
:deep(.clickable-row) { cursor: pointer; }
</style>
