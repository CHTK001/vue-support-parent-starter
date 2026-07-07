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
          <el-button size="small" @click="importBackup"><el-icon><Upload /></el-icon> {{ t('ai.import') }}</el-button>
          <el-button size="small" @click="backupCurrent"><el-icon><FolderChecked /></el-icon> {{ t('ai.backup') }}</el-button>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="config-tabs" lazy>
        <el-tab-pane :label="'MCP (' + installedMcpCount + '/' + mcpStore.totalCount + ')'" name="mcp">
          <div class="tab-toolbar">
            <el-input v-model="mcpStore.searchQuery" :placeholder="t('ai.searchMcp')" clearable prefix-icon="Search" style="width: 220px" />
            <div class="toolbar-right">
              <span style="font-size:12px;color:var(--el-text-color-secondary)">勾选安装 / 勾选卸载</span>
            </div>
          </div>
          <el-table :data="displayServers" style="width: 100%" max-height="calc(100vh - 380px)" row-class-name="clickable-row">
            <el-table-column width="40" align="center">
              <template #default="{ row }">
                <el-checkbox :model-value="mcpStore.isSelected(row.id)" @click.prevent="toggleInstallMcp(row)" />
              </template>
            </el-table-column>
            <el-table-column :label="t('ai.serverName')" min-width="200">
              <template #default="{ row }">
                <div class="server-cell">
                  <span class="server-icon">{{ row.icon }}</span>
                  <div>
                    <div class="server-name">
                      {{ row.name }}
                      <el-tag v-if="mcpStore.isSelected(row.id)" type="success" size="small" style="margin-left:6px">已安装</el-tag>
                    </div>
                    <div class="server-desc">{{ row.description }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="t('ai.category')" width="90">
              <template #default="{ row }"><el-tag size="small" :type="getCategoryType(row.category)">{{ row.category }}</el-tag></template>
            </el-table-column>
            <el-table-column label="命令" min-width="160">
              <template #default="{ row }"><code v-if="row.command" class="pkg-name">{{ row.command }} {{ row.args?.slice(0,2).join(' ') }}</code><span v-else class="text-muted">-</span></template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane :label="'Skills (' + installedSkillCount + '/' + skillsStore.totalCount + ')'" name="skills">
          <div class="tab-toolbar">
            <el-input v-model="skillsStore.searchQuery" :placeholder="t('ai.searchSkills')" clearable prefix-icon="Search" style="width: 220px" />
            <div class="toolbar-right">
              <span style="font-size:12px;color:var(--el-text-color-secondary)">勾选安装 / 勾选卸载</span>
            </div>
          </div>
          <el-table :data="displaySkills" style="width: 100%" max-height="calc(100vh - 380px)" row-class-name="clickable-row">
            <el-table-column width="40" align="center">
              <template #default="{ row }">
                <el-checkbox :model-value="skillsStore.isSelected(row.id)" @click.prevent="toggleInstallSkill(row)" />
              </template>
            </el-table-column>
            <el-table-column :label="t('ai.skillName')" min-width="250">
              <template #default="{ row }">
                <div class="server-name">
                  {{ row.name }}
                  <el-tag v-if="skillsStore.isSelected(row.id)" type="success" size="small" style="margin-left:6px">已安装</el-tag>
                </div>
                <div class="server-desc">{{ row.description }}</div>
              </template>
            </el-table-column>
            <el-table-column :label="t('ai.category')" width="90">
              <template #default="{ row }"><el-tag size="small" :type="getCategoryType(row.category)">{{ row.category }}</el-tag></template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>
    <div v-else class="no-client"><el-empty :description="t('ai.selectClient')" /></div>

    <el-dialog v-model="importDialogVisible" title="导入配置" width="420px" destroy-on-close>
      <div style="text-align:center;padding:20px">
        <el-upload ref="uploadRef" accept=".json" :auto-upload="false" :show-file-list="false" :on-change="handleFileChange">
          <el-button type="primary" size="large"><el-icon><Upload /></el-icon> 选择 JSON 文件</el-button>
        </el-upload>
        <p style="margin-top:12px;font-size:12px;color:var(--el-text-color-secondary)">上传备份的 JSON 文件，恢复 MCP 和 Skills 配置到当前客户端</p>
      </div>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="doImport" :loading="importing" :disabled="!importFile">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage, ElMessageBox } from "element-plus";
import { FolderChecked, Download, Upload } from "@element-plus/icons-vue";
import { useMcpStore } from "@/stores/mcp";
import { useSkillsStore } from "@/stores/skills";
import { useSettingsStore } from "@/stores/settings";
import { listAgentClients, listMcpServers, listSkills, saveMcpServer, deleteMcpServer, saveSkill, deleteSkill, exportBackup, importBackup, type McpServerEntry, type SkillEntry } from "@/services";
import type { McpServerInfo } from "@/resources/mcp-list";
import type { SkillInfo } from "@/resources/skills-list";

const { t } = useI18n();
const mcpStore = useMcpStore();
const skillsStore = useSkillsStore();
const settings = useSettingsStore();

const activeClientId = ref(settings.state.defaultClient || "");
const activeTab = ref("mcp");
const importDialogVisible = ref(false);
const importFile = ref<File | null>(null);
const importing = ref(false);
const dataLoading = ref(false);

interface ClientInfo { id: string; name: string; logo: string; homeDir: string; installed: boolean; }
const installedClients = ref<ClientInfo[]>([]);
const activeClient = computed(() => installedClients.value.find((c) => c.id === activeClientId.value));

function selectClient(client: ClientInfo) {
  activeClientId.value = client.id;
  settings.setDefaultClient(client.id);
}

function getCategoryType(cat: string) {
  const m: Record<string, string> = { filesystem: "", database: "success", search: "warning", cloud: "info", devtools: "danger", ai: "success", code: "success", ui: "warning", other: "info" };
  return m[cat] || "";
}

async function loadClientData(id: string) {
  dataLoading.value = true;
  const timeout = new Promise(resolve => setTimeout(resolve, 10000));
  await Promise.race([
    (async () => {
      const [installedMcps, installedSkills] = await Promise.all([
        listMcpServers(id).catch(() => [] as McpServerEntry[]),
        listSkills(id).catch(() => [] as SkillEntry[])
      ]);
      mcpStore.selectedIds.clear();
      skillsStore.selectedIds.clear();
      const mcpNames = new Set(installedMcps.map(m => m.name));
      for (const s of mcpStore.allServers) {
        if (mcpNames.has(s.name)) mcpStore.selectedIds.add(s.id);
      }
      const skillNames = new Set(installedSkills.map(s => s.name));
      for (const s of skillsStore.allSkills) {
        if (skillNames.has(s.name)) skillsStore.selectedIds.add(s.id);
      }
    })(),
    timeout
  ]);
  dataLoading.value = false;
}

const installedMcpCount = computed(() => mcpStore.selectedCount);
const installedSkillCount = computed(() => skillsStore.selectedCount);

const displayServers = computed(() => {
  const filtered = mcpStore.filteredServers;
  return [...filtered].sort((a, b) => {
    const ia = mcpStore.isSelected(a.id) ? 1 : 0;
    const ib = mcpStore.isSelected(b.id) ? 1 : 0;
    return ib - ia;
  });
});

const displaySkills = computed(() => {
  const filtered = skillsStore.filteredSkills;
  return [...filtered].sort((a, b) => {
    const ia = skillsStore.isSelected(a.id) ? 1 : 0;
    const ib = skillsStore.isSelected(b.id) ? 1 : 0;
    return ib - ia;
  });
});

async function toggleInstallMcp(server: McpServerInfo) {
  const installed = mcpStore.isSelected(server.id);
  try {
    if (installed) {
      const dbMcps = await listMcpServers(activeClientId.value);
      const target = dbMcps.find(m => m.name === server.name);
      if (target?.id) await deleteMcpServer(target.id);
      mcpStore.selectedIds.delete(server.id);
      ElMessage.success(`已卸载 ${server.name}`);
    } else {
      await saveMcpServer({
        name: server.name,
        description: server.description,
        category: server.category,
        command: server.command,
        args: JSON.stringify(server.args),
        env: server.env ? JSON.stringify(server.env) : undefined,
        enabled: true,
        clientId: activeClientId.value
      });
      mcpStore.selectedIds.add(server.id);
      ElMessage.success(`已安装 ${server.name}`);
    }
  } catch (e: any) {
    ElMessage.error((installed ? "卸载" : "安装") + "失败: " + (e.message || ""));
  }
}

async function toggleInstallSkill(skill: SkillInfo) {
  const installed = skillsStore.isSelected(skill.id);
  try {
    if (installed) {
      const dbSkills = await listSkills(activeClientId.value);
      const target = dbSkills.find(s => s.name === skill.name);
      if (target?.id) await deleteSkill(target.id);
      skillsStore.selectedIds.delete(skill.id);
      ElMessage.success(`已卸载 ${skill.name}`);
    } else {
      await saveSkill({
        name: skill.name,
        description: skill.description,
        category: skill.category,
        path: skill.path,
        enabled: true,
        clientId: activeClientId.value
      });
      skillsStore.selectedIds.add(skill.id);
      ElMessage.success(`已安装 ${skill.name}`);
    }
  } catch (e: any) {
    ElMessage.error((installed ? "卸载" : "安装") + "失败: " + (e.message || ""));
  }
}

async function backupCurrent() {
  const data = await exportBackup(activeClientId.value, true);
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${activeClientId.value}-backup.json`;
  a.click();
  URL.revokeObjectURL(url);
  ElMessage.success("备份已下载");
}

function handleFileChange(file: any) {
  importFile.value = file.raw || file;
}

async function doImport() {
  if (!importFile.value || !activeClientId.value) return;
  importing.value = true;
  try {
    const text = await importFile.value.text();
    const data = JSON.parse(text);
    const result = await importBackup(activeClientId.value, data);
    ElMessage.success(`导入完成: ${result.mcpImported} MCP, ${result.skillsImported} Skills`);
    importDialogVisible.value = false;
    importFile.value = null;
    if (activeClientId.value) loadClientData(activeClientId.value);
  } catch (e: any) {
    ElMessage.error("导入失败: " + (e.message || "未知错误"));
  } finally {
    importing.value = false;
  }
}

watch(activeClientId, (newId) => {
  if (newId) loadClientData(newId);
});

onMounted(async () => {
  try {
    const clients = await listAgentClients();
    installedClients.value = clients.filter(c => c.installed).map(c => ({
      id: c.id, name: c.name, logo: c.logo, homeDir: c.homeDir, installed: c.installed
    }));
  } catch { installedClients.value = []; }
  if (!activeClientId.value && installedClients.value.length > 0) {
    activeClientId.value = installedClients.value[0].id;
  }
});
</script>

<style scoped>
.ai-page { height: calc(100vh - 100px); display: flex; flex-direction: column; }

/* ── Client Cards Header ── */
.client-cards-header {
  display: flex; align-items: center; gap: 12px; margin-bottom: 14px;
  padding-bottom: 14px; border-bottom: 1px solid var(--el-border-color-lighter);
}
.client-cards-scroll { display: flex; gap: 8px; overflow-x: auto; padding: 4px 0; }
.client-cards-scroll::-webkit-scrollbar { height: 3px; }

/* ── Client Card ── */
.client-card-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px 10px 18px;
  background: var(--el-bg-color); border: 1px solid var(--el-border-color);
  border-radius: 8px; cursor: pointer; transition: all 0.2s;
  flex-shrink: 0; min-width: 140px; position: relative;
}
.client-card-item::before {
  content: ""; position: absolute; left: 0; top: 6px; bottom: 6px;
  width: 3px; border-radius: 0 2px 2px 0;
  background: transparent; transition: background 0.2s;
}
.client-card-item:hover { border-color: var(--el-color-primary-light-5); }
.client-card-item.active {
  border-color: var(--el-color-primary);
  background: var(--nexus-accent-glow);
}
.client-card-item.active::before { background: var(--nexus-stripe-teal); }

.card-logo { width: 24px; height: 24px; object-fit: contain; }
.card-info { display: flex; flex-direction: column; gap: 2px; }
.card-name { font-size: 13px; font-weight: 500; }

/* ── Client Config Area ── */
.client-config { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.config-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.config-logo { width: 28px; height: 28px; object-fit: contain; }
.config-title { flex: 1; }
.config-title h3 { margin: 0; font-size: 15px; font-weight: 600; }
.config-path { font-size: 11px; color: var(--el-text-color-secondary); font-family: var(--nexus-data-font); }
.config-actions { display: flex; gap: 8px; }

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
.no-client { flex: 1; display: flex; align-items: center; justify-content: center; }
:deep(.clickable-row) { cursor: pointer; }
</style>
