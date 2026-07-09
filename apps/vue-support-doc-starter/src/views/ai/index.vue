<template>
  <div class="page-card ai-page">
    <BackButton to="/ai/config" />

    <div class="ai-layout">
      <!-- Left: Client Sidebar -->
      <div class="ai-sidebar">
        <div class="sidebar-header">
          <span class="sidebar-title">客户端</span>
          <el-tooltip content="扫描客户端" placement="top">
            <el-button circle size="small" @click="scanClients" :loading="scanning">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
        <div class="sidebar-list">
          <div v-for="c in installedClients" :key="c.id" class="sidebar-item" :class="{ active: c.id === activeClientId, installed: c.installed }" @click="selectClient(c)">
            <img :src="c.logo" class="item-logo" @error="($event.target as HTMLImageElement).style.display='none'" />
            <div class="item-info">
              <div class="item-name">{{ c.name }}</div>
              <div class="item-path" :title="c.homeDir">{{ c.homeDir }}</div>
            </div>
            <el-tag v-if="c.installed" size="small" type="success" effect="dark" class="item-tag">在线</el-tag>
          </div>
          <el-empty v-if="!installedClients.length && !scanning" description="未检测到客户端" :image-size="30" class="mt-4" />
        </div>
        <div class="sidebar-footer">
          <el-button text size="small" @click="$router.push('/ai/clients')">
            <el-icon><Setting /></el-icon> 管理客户端
          </el-button>
        </div>
      </div>

      <!-- Right: Main Content -->
      <div class="ai-main" v-if="activeClient">
        <div class="main-head">
          <div class="main-client-info">
            <img :src="activeClient.logo" class="main-logo" @error="($event.target as HTMLImageElement).style.display='none'" />
            <div>
              <div class="main-title">{{ activeClient.name }} 配置</div>
              <div class="main-path">{{ activeClient.configPaths }}</div>
            </div>
          </div>
          <div class="main-actions">
            <el-button size="small" @click="syncFromClient" :loading="syncing">
              <el-icon><RefreshRight /></el-icon> 同步
            </el-button>
            <el-button size="small" @click="saveToClient" :loading="saving">
              <el-icon><FolderChecked /></el-icon> 保存
            </el-button>
          </div>
        </div>

        <el-tabs v-model="activeTab" class="main-tabs">
          <!-- MCP Tab -->
          <el-tab-pane :label="'MCP (' + mcpInstalledCount + '/' + mcpTotalCount + ')'" name="mcp">
            <div class="tab-toolbar">
              <el-input v-model="mcpSearch" placeholder="搜索 MCP 服务器…" clearable prefix-icon="Search" style="width: 220px" />
              <div class="toolbar-right">
                <el-button size="small" @click="mcpSelectAll">全选</el-button>
                <el-button size="small" @click="mcpDeselectAll">取消</el-button>
                <el-divider direction="vertical" />
                <el-button size="small" type="primary" @click="installMcp" :disabled="!mcpSelectedCount" :loading="mcpInstalling">
                  安装 ({{ mcpSelectedCount }})
                </el-button>
              </div>
            </div>
            <el-table :data="filteredMcp" style="width: 100%" max-height="calc(100vh - 380px)" @row-click="toggleMcp" row-class-name="clickable-row">
              <el-table-column width="40" align="center">
                <template #default="{ row }">
                  <el-checkbox :model-value="mcpSelected.has(row.id)" @click.stop @change="toggleMcp(row)" />
                </template>
              </el-table-column>
              <el-table-column label="服务器" min-width="180">
                <template #default="{ row }">
                  <div class="server-cell">
                    <span class="server-icon">{{ row.icon }}</span>
                    <div>
                      <div class="server-name">
                        {{ row.name }}
                        <el-tag v-if="installedMcpNames.has(row.npm || row.name)" size="small" type="success" class="ml-1">已装</el-tag>
                      </div>
                      <div class="server-desc">{{ row.description }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="分类" width="90">
                <template #default="{ row }">
                  <el-tag size="small" :type="getCategoryType(row.category)">{{ row.category }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="包名" width="180">
                <template #default="{ row }">
                  <code v-if="row.npm" class="pkg-name">{{ row.npm }}</code>
                  <span v-else class="text-muted">-</span>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <!-- Skills Tab -->
          <el-tab-pane :label="'Skills (' + skills.length + ')'" name="skills">
            <div class="tab-toolbar">
              <el-input v-model="skillSearch" placeholder="搜索 Skills…" clearable prefix-icon="Search" style="width: 220px" />
              <div class="toolbar-right">
                <el-button size="small" @click="syncSkills" :loading="syncingSkills">
                  <el-icon><Refresh /></el-icon> 同步
                </el-button>
              </div>
            </div>
            <el-table :data="filteredSkills" style="width: 100%" max-height="calc(100vh - 380px)" row-class-name="clickable-row">
              <el-table-column label="名称" min-width="180">
                <template #default="{ row }">
                  <div class="server-name">{{ row.name }}</div>
                  <div class="server-desc">{{ row.description }}</div>
                </template>
              </el-table-column>
              <el-table-column label="分类" width="90">
                <template #default="{ row }">
                  <el-tag size="small" :type="getCategoryType(row.category || '')">{{ row.category }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="启用" width="70" align="center">
                <template #default="{ row }">
                  <el-switch :model-value="!!row.enabled" @click.stop @change="toggleSkillEnabled(row)" size="small" />
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </div>

      <div v-else class="ai-main ai-main-empty">
        <el-empty description="未检测到 AI 客户端，请先扫描" :image-size="60" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { Refresh, RefreshRight, FolderChecked, Setting } from "@element-plus/icons-vue";
import { useMcpStore } from "@/stores/mcp";
import { useSkillsStore } from "@/stores/skills";
import { useSettingsStore } from "@/stores/settings";
import { useProviderStore } from "@/stores/provider";
import { BUILTIN_MCP_SERVERS, type McpServerInfo } from "@/resources/mcp-list";
import { BUILTIN_SKILLS } from "@/resources/skills-list";
import {
  listAgentClients, scanAgentClient, saveClientConfig, getClientConfig,
  type AgentClientData, type SkillEntry
} from "@/services";

const router = useRouter();
const { t } = useI18n();
const mcpStore = useMcpStore();
const skillsStore = useSkillsStore();
const settings = useSettingsStore();
const providerStore = useProviderStore();

const activeTab = ref("mcp");
const mcpSearch = ref("");
const skillSearch = ref("");
const scanning = ref(false);
const syncing = ref(false);
const saving = ref(false);
const mcpInstalling = ref(false);
const syncingSkills = ref(false);

// ── Clients ──
const installedClients = ref<AgentClientData[]>([]);
const activeClientId = ref(settings.state.defaultClient || "");

const activeClient = computed(() => installedClients.value.find(c => c.id === activeClientId.value));

const mcpSelected = ref(new Set<string>());
const installedMcpNames = ref(new Set<string>());
const skills = ref<SkillEntry[]>([]);

// ── Computed ──
const filteredMcp = computed(() => {
  const q = mcpSearch.value.toLowerCase().trim();
  if (!q) return BUILTIN_MCP_SERVERS;
  return BUILTIN_MCP_SERVERS.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q) ||
    (s.npm || '').toLowerCase().includes(q)
  );
});
const filteredSkills = computed(() => {
  const q = skillSearch.value.toLowerCase().trim();
  if (!q) return skills.value;
  return skills.value.filter(s =>
    s.name.toLowerCase().includes(q) ||
    (s.description || '').toLowerCase().includes(q)
  );
});
const mcpSelectedCount = computed(() => mcpSelected.value.size);
const mcpTotalCount = computed(() => BUILTIN_MCP_SERVERS.length);
const mcpInstalledCount = computed(() => installedMcpNames.value.size);

// ── Methods ──
function getCategoryType(category: string) {
  const map: Record<string, string> = { filesystem: "", database: "success", search: "warning", cloud: "info", devtools: "danger", ai: "success", code: "success", communication: "warning", productivity: "info", utility: "", security: "danger" };
  return map[category] || "";
}

function selectClient(client: AgentClientData) {
  activeClientId.value = client.id;
  settings.setDefaultClient(client.id);
  loadClientMcp();
}

async function scanClients() {
  scanning.value = true;
  try {
    const all = await listAgentClients();
    installedClients.value = all.filter(c => c.installed);
    if (!installedClients.value.length) {
      // Fallback: show all as potential
      installedClients.value = all.map(c => ({ ...c, installed: true }));
    }
    if (activeClientId.value && !installedClients.value.find(c => c.id === activeClientId.value)) {
      activeClientId.value = installedClients.value[0]?.id || "";
    }
    if (activeClientId.value) await loadClientMcp();
  } catch {
    installedClients.value = [];
  } finally {
    scanning.value = false;
  }
}

async function loadClientMcp() {
  const clientId = activeClientId.value;
  if (!clientId) return;
  installedMcpNames.value = new Set();
  mcpSelected.value = new Set();

  try {
    // Try scanning actual config file
    const result = await scanAgentClient(clientId, "mcp");
    if (result?.mcpServers?.length) {
      const names = new Set<string>();
      for (const s of result.mcpServers) {
        names.add(s.name);
        // Try to match with built-in servers
        const match = BUILTIN_MCP_SERVERS.find(b => b.id === s.name || b.name === s.name || b.npm === s.name);
        if (match) names.add(match.npm || match.name);
      }
      installedMcpNames.value = names;
    }
  } catch { /* scan failed */ }

  // Also try loading from saved config
  try {
    const config = await getClientConfig(clientId);
    if (config?.mcpJson) {
      const parsed = JSON.parse(config.mcpJson);
      if (parsed.mcpServers) {
        Object.keys(parsed.mcpServers).forEach(name => installedMcpNames.value.add(name));
      }
    }
  } catch { /* saved config failed */ }

  // Load skills from backend
  try {
    const { listSkills } = await import("@/services");
    const savedSkills = await listSkills(clientId);
    if (savedSkills?.length) {
      skills.value = savedSkills;
    } else {
      skills.value = BUILTIN_SKILLS.map(s => ({
        name: s.name, description: s.description,
        category: s.category, enabled: s.enabled ?? true,
        clientId
      }));
    }
  } catch {
    skills.value = BUILTIN_SKILLS.map(s => ({
      name: s.name, description: s.description,
      category: s.category, enabled: s.enabled ?? true,
      clientId
    }));
  }
}

function toggleMcp(row: McpServerInfo) {
  const id = row.id;
  if (mcpSelected.value.has(id)) mcpSelected.value.delete(id);
  else mcpSelected.value.add(id);
  mcpSelected.value = new Set(mcpSelected.value);
}

function mcpSelectAll() {
  const available = filteredMcp.value.filter(s => !installedMcpNames.value.has(s.npm || s.name));
  mcpSelected.value = new Set(available.map(s => s.id));
}
function mcpDeselectAll() { mcpSelected.value = new Set(); }

async function installMcp() {
  if (!activeClientId.value) { ElMessage.warning("请先选择客户端"); return; }
  mcpInstalling.value = true;
  let success = 0;
  const selected = BUILTIN_MCP_SERVERS.filter(s => mcpSelected.value.has(s.id));

  // Read existing client config
  let existingMcp: Record<string, any> = {};
  try {
    const config = await getClientConfig(activeClientId.value);
    if (config?.mcpJson) {
      const parsed = JSON.parse(config.mcpJson);
      if (parsed.mcpServers) existingMcp = parsed.mcpServers;
    }
  } catch { /* start fresh */ }

  for (const srv of selected) {
    const name = srv.npm || srv.name;
    existingMcp[name] = {
      command: srv.command || "npx",
      args: srv.args || [srv.npm || ""],
      env: srv.env || undefined
    };
    installedMcpNames.value.add(name);
    success++;
  }

  // Save updated config to backend
  try {
    const now = new Date().toISOString();
    const existing = await getClientConfig(activeClientId.value).catch(() => null);
    await saveClientConfig({
      id: activeClientId.value,
      name: activeClient.name || activeClientId.value,
      mcpJson: JSON.stringify({ mcpServers: existingMcp }, null, 2),
      skillsJson: existing?.skillsJson || "{}",
      createdAt: existing?.createdAt || now,
      updatedAt: now
    });
  } catch { /* save failed */ }

  mcpInstalling.value = false;
  mcpSelected.value = new Set();
  ElMessage.success(`已安装 ${success} 个 MCP 服务器`);
}

async function syncFromClient() {
  if (!activeClientId.value) return;
  syncing.value = true;
  await loadClientMcp();
  syncing.value = false;
  ElMessage.success("已从客户端同步配置");
}

async function saveToClient() {
  if (!activeClientId.value) return;
  saving.value = true;
  await loadClientMcp();
  saving.value = false;
  ElMessage.success("配置已保存");
}

async function toggleSkillEnabled(sk: SkillEntry) {
  const newVal = !sk.enabled;
  sk.enabled = newVal;
  try {
    const { saveSkill } = await import("@/services");
    await saveSkill(sk);
  } catch { /* save failed */ }
}

async function syncSkills() {
  if (!activeClientId.value) return;
  syncingSkills.value = true;
  try {
    const { listSkills, saveSkill } = await import("@/services");
    const saved = await listSkills(activeClientId.value);
    if (saved?.length) {
      skills.value = saved;
    } else {
      // Save built-in skills to backend
      for (const s of BUILTIN_SKILLS) {
        await saveSkill({
          name: s.name, description: s.description,
          category: s.category, enabled: s.enabled ?? true,
          clientId: activeClientId.value
        });
      }
      skills.value = BUILTIN_SKILLS.map(s => ({
        name: s.name, description: s.description,
        category: s.category, enabled: s.enabled ?? true,
        clientId: activeClientId.value
      }));
    }
    ElMessage.success(`已同步 ${skills.value.length} 个 Skills`);
  } catch {
    ElMessage.error("同步 Skills 失败");
  } finally {
    syncingSkills.value = false;
  }
}

onMounted(async () => {
  await providerStore.init();
  await settings.initFromBackend();
  await scanClients();
});
</script>

<style scoped>
.ai-page { height: calc(100vh - 100px); }

.ai-layout { display: flex; gap: 16px; height: 100%; margin-top: 12px; }

/* ── Sidebar ── */
.ai-sidebar { width: 220px; flex-shrink: 0; background: var(--el-bg-color); border: 1px solid var(--el-border-color); border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; }
.sidebar-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 14px 8px; }
.sidebar-title { font-size: 13px; font-weight: 600; color: var(--el-text-color-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
.sidebar-list { flex: 1; overflow-y: auto; padding: 4px 8px; display: flex; flex-direction: column; gap: 2px; }
.sidebar-item { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 8px; cursor: pointer; transition: background 0.1s; }
.sidebar-item:hover { background: var(--el-color-primary-light-9); }
.sidebar-item.active { background: var(--el-color-primary-light-9); }
.sidebar-item.installed { border-left: 3px solid var(--el-color-success); }
.item-logo { width: 24px; height: 24px; object-fit: contain; flex-shrink: 0; border-radius: 4px; }
.item-info { flex: 1; min-width: 0; }
.item-name { font-size: 13px; font-weight: 500; }
.item-path { font-size: 10px; color: var(--el-text-color-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.item-tag { flex-shrink: 0; }
.sidebar-footer { border-top: 1px solid var(--el-border-color-lighter); padding: 8px; display: flex; justify-content: center; }

/* ── Main Content ── */
.ai-main { flex: 1; background: var(--el-bg-color); border: 1px solid var(--el-border-color); border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; padding: 16px; }
.ai-main-empty { align-items: center; justify-content: center; }

.main-head { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.main-client-info { display: flex; align-items: center; gap: 10px; flex: 1; }
.main-logo { width: 28px; height: 28px; object-fit: contain; border-radius: 6px; }
.main-title { font-size: 15px; font-weight: 600; }
.main-path { font-size: 11px; color: var(--el-text-color-secondary); font-family: var(--nexus-data-font); }
.main-actions { display: flex; gap: 6px; }

.main-tabs { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.main-tabs :deep(.el-tabs__content) { flex: 1; overflow: auto; }
.main-tabs :deep(.el-tab-pane) { height: 100%; }

.tab-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.toolbar-right { margin-left: auto; display: flex; gap: 8px; align-items: center; }

.server-cell { display: flex; align-items: center; gap: 8px; }
.server-icon { font-size: 18px; }
.server-name { font-size: 13px; font-weight: 500; }
.server-desc { font-size: 11px; color: var(--el-text-color-secondary); }
.pkg-name { font-size: 11px; color: var(--el-text-color-secondary); font-family: var(--nexus-data-font); }
.text-muted { color: var(--el-text-color-placeholder); }
.ml-1 { margin-left: 4px; }
.mt-4 { margin-top: 16px; }

:deep(.clickable-row) { cursor: pointer; }
</style>
