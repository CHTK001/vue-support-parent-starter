<template>
  <div class="page-card ai-page">
    <div class="client-cards-header">
      <div class="client-cards-scroll">
        <div v-for="client in installedClients" :key="client.id" :class="['client-card-item', { active: activeClientId === client.id }]" @click="selectClient(client)">
          <img :src="client.logo" class="card-logo" @error="($event.target as HTMLImageElement).style.display='none'" />
          <div class="card-info">
            <span class="card-name">{{ client.name }}</span>
            <el-tag type="success" size="small">已安装</el-tag>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeClient" class="client-config">
      <div class="config-header">
        <img :src="activeClient.logo" class="config-logo" @error="($event.target as HTMLImageElement).style.display='none'" />
        <div class="config-title">
          <h3>{{ activeClient.name }} {{ t('ai.configuration') }}</h3>
          <span class="config-path">{{ activeClient.homeDir }}</span>
        </div>
        <div class="config-actions">
          <el-button size="small" @click="backupCurrent"><el-icon><FolderChecked /></el-icon> {{ t('ai.backup') }}</el-button>
          <el-button size="small" type="primary" @click="exportCurrent"><el-icon><Download /></el-icon> {{ t('ai.export') }}</el-button>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane :label="'MCP (' + selectedMcpCount + ')'" name="mcp">
          <div class="tab-toolbar">
            <el-input v-model="mcpSearch" :placeholder="t('ai.searchMcp')" clearable prefix-icon="Search" style="width: 220px" />
            <div class="toolbar-right">
              <el-button size="small" @click="mcpStore.selectAll">{{ t('ai.selectAll') }}</el-button>
              <el-button size="small" @click="mcpStore.deselectAll">{{ t('ai.deselectAll') }}</el-button>
              <el-divider direction="vertical" />
              <el-button size="small" type="primary" @click="updateMcp"><el-icon><RefreshRight /></el-icon> {{ t('ai.update') }}</el-button>
              <el-button size="small" @click="backupMcp"><el-icon><FolderChecked /></el-icon> {{ t('ai.backup') }}</el-button>
            </div>
          </div>
          <el-table :data="mcpStore.filteredServers" style="width: 100%" max-height="calc(100vh - 380px)" @row-click="(row: any) => mcpStore.toggleServer(row.id)" row-class-name="clickable-row">
            <el-table-column width="40" align="center">
              <template #default="{ row }"><el-checkbox :model-value="mcpStore.isSelected(row.id)" @click.stop @change="mcpStore.toggleServer(row.id)" /></template>
            </el-table-column>
            <el-table-column :label="t('ai.serverName')" min-width="180">
              <template #default="{ row }">
                <div class="server-cell"><span class="server-icon">{{ row.icon }}</span><div><div class="server-name">{{ row.name }}</div><div class="server-desc">{{ row.description }}</div></div></div>
              </template>
            </el-table-column>
            <el-table-column :label="t('ai.category')" width="90">
              <template #default="{ row }"><el-tag size="small" :type="getCategoryType(row.category)">{{ row.category }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('ai.package')" width="160">
              <template #default="{ row }"><code v-if="row.npm" class="pkg-name">{{ row.npm }}</code><span v-else class="text-muted">-</span></template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane :label="'Skills (' + selectedSkillCount + ')'" name="skills">
          <div class="tab-toolbar">
            <el-input v-model="skillSearch" :placeholder="t('ai.searchSkills')" clearable prefix-icon="Search" style="width: 220px" />
            <div class="toolbar-right">
              <el-button size="small" @click="skillsStore.selectAll">{{ t('ai.selectAll') }}</el-button>
              <el-button size="small" @click="skillsStore.deselectAll">{{ t('ai.deselectAll') }}</el-button>
              <el-divider direction="vertical" />
              <el-button size="small" type="primary" @click="updateSkills"><el-icon><RefreshRight /></el-icon> {{ t('ai.update') }}</el-button>
              <el-button size="small" @click="backupSkills"><el-icon><FolderChecked /></el-icon> {{ t('ai.backup') }}</el-button>
            </div>
          </div>
          <el-table :data="skillsStore.filteredSkills" style="width: 100%" max-height="calc(100vh - 380px)" @row-click="(row: any) => skillsStore.toggleSkill(row.id)" row-class-name="clickable-row">
            <el-table-column width="40" align="center">
              <template #default="{ row }"><el-checkbox :model-value="skillsStore.isSelected(row.id)" @click.stop @change="skillsStore.toggleSkill(row.id)" /></template>
            </el-table-column>
            <el-table-column :label="t('ai.skillName')" min-width="180">
              <template #default="{ row }"><div class="server-name">{{ row.name }}</div><div class="server-desc">{{ row.description }}</div></template>
            </el-table-column>
            <el-table-column :label="t('ai.category')" width="90">
              <template #default="{ row }"><el-tag size="small" :type="getCategoryType(row.category)">{{ row.category }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('ai.enabled')" width="70" align="center">
              <template #default="{ row }"><el-switch :model-value="row.enabled" @click.stop @change="skillsStore.toggleEnabled(row.id)" size="small" /></template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>
    <div v-else class="no-client"><el-empty :description="t('ai.selectClient')" /></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { FolderChecked, Download, RefreshRight } from "@element-plus/icons-vue";
import { useMcpStore } from "@/stores/mcp";
import { useSkillsStore } from "@/stores/skills";
import { useSettingsStore } from "@/stores/settings";
import { MCP_CLIENTS, getClientHomeDir, downloadJson as downloadJsonFile } from "@/utils/mcp-config";
import { detectInstalledClients, type DetectedClient } from "@/services";

const { t } = useI18n();
const mcpStore = useMcpStore();
const skillsStore = useSkillsStore();
const settings = useSettingsStore();

const activeClientId = ref(settings.state.defaultClient || "");
const activeTab = ref("mcp");
const mcpSearch = ref("");
const skillSearch = ref("");

interface ClientInfo { id: string; name: string; logo: string; homeDir: string; installed: boolean; }
const installedClients = ref<ClientInfo[]>([]);
const activeClient = computed(() => installedClients.value.find((c) => c.id === activeClientId.value));
const selectedMcpCount = computed(() => mcpStore.selectedCount);
const selectedSkillCount = computed(() => skillsStore.selectedCount);

function selectClient(client: ClientInfo) { activeClientId.value = client.id; settings.setDefaultClient(client.id); loadClientData(client.id); }
function getCategoryType(cat: string) { const m: Record<string, string> = { filesystem: "", database: "success", search: "warning", cloud: "info", devtools: "danger", ai: "success", code: "success", ui: "warning", other: "info" }; return m[cat] || ""; }

async function loadClientData(id: string) {
  await mcpStore.loadFromClient(id);
  await skillsStore.loadFromClient(id);
}

async function updateMcp() { await mcpStore.persistToClient(activeClientId.value); ElMessage.success("MCP updated"); }
function backupMcp() { downloadJsonFile(mcpStore.mcpJsonOutput, `${activeClientId.value}-mcp-backup.json`); ElMessage.success("MCP backup downloaded"); }
async function updateSkills() { await skillsStore.persistToClient(activeClientId.value); ElMessage.success("Skills updated"); }
function backupSkills() { downloadJsonFile(JSON.stringify(skillsStore.generateSkillsJson(), null, 2), `${activeClientId.value}-skills-backup.json`); ElMessage.success("Skills backup downloaded"); }

onMounted(async () => {
  const detected = await detectInstalledClients();
  installedClients.value = detected.filter((c) => c.installed);
  if (!activeClientId.value && installedClients.value.length > 0) { activeClientId.value = installedClients.value[0].id; }
  if (activeClientId.value) loadClientData(activeClientId.value);
});
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
.config-actions { display: flex; gap: 8px; }
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
.no-client { flex: 1; display: flex; align-items: center; justify-content: center; }
:deep(.clickable-row) { cursor: pointer; }
</style>
