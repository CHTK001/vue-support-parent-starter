<template>
  <div class="page-card ai-page">
    <BackButton to="/ai/config" />

    <!-- Active Client Config -->
    <div v-if="activeClient" class="client-config">
      <div class="config-header">
        <el-popover placement="bottom-start" :width="240" trigger="click">
          <template #reference>
            <div class="header-client-info">
              <img :src="activeClient.logo" class="config-logo" @error="handleLogoError($event)" />
              <div class="config-title">
                <h3>{{ activeClient.name }} {{ t('ai.configuration') }}</h3>
                <span class="config-path">{{ activeClient.configPaths }}</span>
              </div>
            </div>
          </template>
          <div style="display:flex;flex-direction:column;gap:4px;max-height:300px;overflow-y:auto">
            <div v-for="c in installedClients" :key="c.id"
              :class="['client-row', { active: c.id === activeClientId }]"
              @click="selectClient(c); activeTab = 'mcp'">
              <img :src="c.logo" class="row-logo" @error="handleLogoError($event)" />
              <span>{{ c.name }}</span>
              <el-tag v-if="c.id === activeClientId" size="small" type="success" style="margin-left:auto">当前</el-tag>
            </div>
          </div>
        </el-popover>
        <el-tooltip :content="t('ai.scanClients')" placement="top">
          <el-button circle size="small" @click="scanClients" :loading="scanning">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="导出客户端 ZIP 备份" placement="top">
          <el-button circle size="small" @click="exportClientBackup">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </el-button>
        </el-tooltip>
        <el-tooltip content="导入客户端 ZIP 备份" placement="top">
          <el-button circle size="small" @click="triggerImport">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </el-button>
        </el-tooltip>
        <input ref="importInput" type="file" accept=".zip" style="display:none" @change="handleImportFile" />
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
              <el-button v-if="mcpInstallLabel === 'uninstall'" size="small" type="danger" @click="uninstallMcp" :disabled="selectedMcpCount === 0">
                {{ t('ai.uninstall') }} ({{ selectedMcpCount }})
              </el-button>
              <el-button v-else size="small" type="primary" @click="installMcp" :disabled="selectedMcpCount === 0">
                {{ t('ai.install') }} ({{ selectedMcpCount }})
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
              <el-button v-if="skillInstallLabel === 'uninstall'" size="small" type="danger" @click="uninstallSkills" :disabled="selectedSkillCount === 0">
                {{ t('ai.uninstall') }} ({{ selectedSkillCount }})
              </el-button>
              <el-button v-else size="small" type="primary" @click="installSkills" :disabled="selectedSkillCount === 0">
                {{ t('ai.install') }} ({{ selectedSkillCount }})
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

      </el-tabs>

      <!-- JSON floating popover button -->
      <div class="json-float-btn">
        <el-popover placement="left" :width="520" v-model:visible="jsonVisible" popper-class="json-float-popper">
          <template #reference>
            <el-button :type="jsonVisible ? 'primary' : 'default'" plain circle size="small">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H6a2 2 0 00-2 2v3a2 2 0 01-2 2 2 2 0 012 2v3a2 2 0 002 2h2M16 3h2a2 2 0 012 2v3a2 2 0 012 2 2 2 0 01-2 2v3a2 2 0 01-2 2h-2"/></svg>
            </el-button>
          </template>
          <div class="json-float-content">
            <div class="json-float-toolbar">
              <span class="json-float-title">JSON</span>
              <div>
                <el-button size="small" text @click="copyJson"><el-icon><CopyDocument /></el-icon> {{ t('ai.copy') }}</el-button>
                <el-button size="small" text @click="downloadCurrentJson"><el-icon><Download /></el-icon> {{ t('ai.download') }}</el-button>
              </div>
            </div>
            <pre class="json-float-body"><code>{{ jsonOutput }}</code></pre>
          </div>
        </el-popover>
      </div>
    </div>

    <div v-else class="no-client">
      <div v-if="installedClients.length > 0" class="no-client-inner">
        <el-button type="primary" size="large" @click="selectClient(installedClients[0]); activeTab = 'mcp'">
          {{ installedClients[0].name }}
        </el-button>
      </div>
      <div v-else>
        <el-button disabled size="large">未检测到客户端</el-button>
      </div>
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { Refresh, FolderChecked, Download, CopyDocument, RefreshRight } from "@element-plus/icons-vue";
import { useMcpStore } from "@/stores/mcp";
import { useSkillsStore } from "@/stores/skills";
import { useSettingsStore } from "@/stores/settings";
import { listAgentClients, detectInstalledClients, scanAgentClient, exportBackup, importBackup, deleteMcpServer, deleteSkill, type AgentClientData } from "@/services";
import { downloadJson as downloadJsonFile } from "@/utils/mcp-config";

const { t } = useI18n();
const mcpStore = useMcpStore();
const skillsStore = useSkillsStore();
const settings = useSettingsStore();

const activeClientId = ref(settings.state.defaultClient || "claude-desktop");
const activeTab = ref("mcp");
const jsonVisible = ref(false);
const mcpSearch = ref("");
const skillSearch = ref("");
const scanning = ref(false);
const importing = ref(false);

interface ClientInfo extends AgentClientData {}
const installedClients = ref<ClientInfo[]>([]);

const activeClient = computed(() => installedClients.value.find((c) => c.id === activeClientId.value));
const selectedMcpCount = computed(() => mcpStore.selectedCount);
const selectedSkillCount = computed(() => skillsStore.selectedCount);

// Track original selection to determine install vs uninstall
const originalMcpIds = ref<Set<string>>(new Set());
const originalSkillIds = ref<Set<string>>(new Set());

const mcpInstallLabel = computed(() => {
  if (mcpStore.selectedCount === 0) return "install";
  for (const id of mcpStore.selectedIds) {
    if (!originalMcpIds.value.has(id)) return "install";
  }
  return "uninstall";
});
const skillInstallLabel = computed(() => {
  if (skillsStore.selectedCount === 0) return "install";
  for (const id of skillsStore.selectedIds) {
    if (!originalSkillIds.value.has(id)) return "install";
  }
  return "uninstall";
});

const jsonOutput = computed(() => {
  if (activeTab.value === "mcp") return mcpStore.mcpJsonOutput;
  if (activeTab.value === "skills") return JSON.stringify(skillsStore.generateSkillsJson(), null, 2);
  return "{}";
});

function selectClient(client: AgentClientData) { activeClientId.value = client.id; settings.setDefaultClient(client.id); loadClientData(client.id); }

function getCategoryType(category: string) {
  const map: Record<string, string> = { filesystem: "", database: "success", search: "warning", cloud: "info", devtools: "danger", ai: "success", code: "success", ui: "warning", other: "info" };
  return map[category] || "";
}

function handleLogoError(event: Event) { (event.target as HTMLImageElement).style.display = "none"; }

async function scanClients() {
  scanning.value = true;
  const all = await listAgentClients();
  const installed = all.filter(c => c.installed);
  if (installed.length === 0) {
    const defaultId = settings.state.defaultClient;
    await detectInstalledClients();
    const retry = await listAgentClients();
    const fallback = retry.find(c => c.id === defaultId) || retry[0] || all[0];
    if (fallback) { fallback.installed = true; installed.push(fallback); }
  }
  installedClients.value = installed.length > 0 ? installed : all.slice(0, 1);
  if (activeClientId.value && !installedClients.value.find(c => c.id === activeClientId.value)) {
    activeClientId.value = installedClients.value[0]?.id || "";
  }
  scanning.value = false;
  if (activeClientId.value) loadClientData(activeClientId.value);
}

async function loadClientData(clientId: string) {
  await Promise.all([mcpStore.loadFromClient(clientId), skillsStore.loadFromClient(clientId)]);

  // Fallback: scan actual client config if no saved data
  if (mcpStore.selectedCount === 0 && skillsStore.selectedCount === 0) {
    try {
      const result = await scanAgentClient(clientId, "all");
      if (result?.found) {
        if (result?.mcpServers) {
          for (const s of result.mcpServers) {
            const match = mcpStore.allServers.find(b => b.id === s.name || b.name === s.name);
            if (match && !mcpStore.isSelected(match.id)) mcpStore.toggleServer(match.id);
          }
        }
        if (result?.skills) {
          skillsStore.addSkills(result.skills.map((s: any) => ({
            id: s.name,
            name: s.name,
            description: s.description || "",
            path: s.path || "",
            enabled: s.enabled !== false,
            category: s.category || "other"
          })));
          for (const s of result.skills) {
            if (!skillsStore.isSelected(s.name)) skillsStore.toggleSkill(s.name);
          }
        }
      }
    } catch { /* scan failed */ }
  }

  originalMcpIds.value = new Set(mcpStore.selectedIds);
  originalSkillIds.value = new Set(skillsStore.selectedIds);
}

// MCP Install / Uninstall
async function installMcp() {
  await mcpStore.persistToClient(activeClientId.value);
  const client = installedClients.value.find((c) => c.id === activeClientId.value);
  if (client) client.installed = true;
  originalMcpIds.value = new Set(mcpStore.selectedIds);
  ElMessage.success("MCP 已安装");
}

async function uninstallMcp() {
  for (const id of mcpStore.selectedIds) {
    await deleteMcpServer(id);
  }
  mcpStore.deselectAll();
  originalMcpIds.value = new Set(mcpStore.selectedIds);
  ElMessage.success("MCP 已卸载");
}

// Skills Install / Uninstall
async function installSkills() {
  await skillsStore.persistToClient(activeClientId.value);
  originalSkillIds.value = new Set(skillsStore.selectedIds);
  ElMessage.success("Skills 已安装");
}

async function uninstallSkills() {
  for (const id of skillsStore.selectedIds) {
    await deleteSkill(id);
  }
  skillsStore.deselectAll();
  originalSkillIds.value = new Set(skillsStore.selectedIds);
  ElMessage.success("Skills 已卸载");
}

// Client ZIP backup/import
const importInput = ref<HTMLInputElement>();

async function exportClientBackup() {
  try {
    const data = await exportBackup(activeClientId.value, true);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${activeClientId.value}-backup.json`; a.click();
    URL.revokeObjectURL(url);
    ElMessage.success("备份已下载");
  } catch (e) {
    ElMessage.error("导出失败");
  }
}

function triggerImport() { importInput.value?.click(); }

async function handleImportFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  importing.value = true;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    await importBackup(activeClientId.value, data);
    await loadClientData(activeClientId.value);
    ElMessage.success("导入成功");
  } catch {
    ElMessage.error("导入失败");
  }
  importing.value = false;
  (e.target as HTMLInputElement).value = "";
}

function copyJson() { navigator.clipboard.writeText(jsonOutput.value).then(() => ElMessage.success("Copied")); }
function downloadCurrentJson() { downloadJsonFile(jsonOutput.value, activeTab.value === "mcp" ? "mcp.json" : "skills.json"); ElMessage.success("Downloaded"); }

onMounted(() => scanClients());
</script>

<style scoped>
.ai-page { height: calc(100vh - 100px); display: flex; flex-direction: column; }

/* ── Client Config Area ── */
.client-config { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; }
.config-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.header-client-info { display: flex; align-items: center; gap: 12px; cursor: pointer; flex: 1; }
.config-logo { width: 28px; height: 28px; object-fit: contain; }
.config-title { flex: 1; }
.config-title h3 { margin: 0; font-size: 15px; font-weight: 600; }
.config-path { font-size: 11px; color: var(--el-text-color-secondary); font-family: var(--nexus-data-font); }

/* ── Client Popover Row ── */
.client-row { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 6px; cursor: pointer; transition: background 0.12s; font-size: 13px; }
.client-row:hover { background: var(--el-fill-color); }
.client-row.active { background: var(--el-color-primary-light-9); }
.row-logo { width: 22px; height: 22px; object-fit: contain; }

/* ── Tabs ── */
.config-tabs { flex: 1; overflow: hidden; }
.config-tabs :deep(.el-tabs__content) { flex: 1; overflow: auto; }
.config-tabs :deep(.el-tab-pane) { height: 100%; }

/* ── Toolbar ── */
.tab-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.toolbar-right { margin-left: auto; display: flex; gap: 8px; align-items: center; }

/* ── Server cells ── */
.server-cell { display: flex; align-items: center; gap: 8px; }
.server-icon { font-size: 18px; }
.server-name { font-size: 13px; font-weight: 500; }
.server-desc { font-size: 11px; color: var(--el-text-color-secondary); }
.pkg-name { font-size: 11px; color: var(--el-text-color-secondary); font-family: var(--nexus-data-font); }
.text-muted { color: var(--el-text-color-placeholder); }

/* ── JSON Float Button ── */
.json-float-btn {
  position: fixed;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
}
.json-float-btn .el-button { backdrop-filter: blur(8px); background: var(--el-bg-color-overlay); border: 1px solid var(--el-border-color); }
.json-float-btn .el-button:hover { background: var(--el-color-primary-light-9); border-color: var(--el-color-primary); }
.json-float-content { display: flex; flex-direction: column; max-height: 60vh; }
.json-float-toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; }
.json-float-toolbar > div { margin-left: auto; display: flex; gap: 4px; }
.json-float-title { font-weight: 600; }
.json-float-body {
  flex: 1; overflow: auto; margin: 0;
  font-size: 12px; line-height: 1.6;
  font-family: var(--nexus-data-font);
  background: var(--nexus-code-bg); color: var(--nexus-code-text);
  padding: 12px; border-radius: 8px;
  white-space: pre-wrap; word-break: break-all;
}

.no-client { flex: 1; display: flex; align-items: center; justify-content: center; }
:deep(.clickable-row) { cursor: pointer; }
</style>

<style>
.json-float-popper { padding: 12px !important; }
</style>
