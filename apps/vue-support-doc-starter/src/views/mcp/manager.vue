<template>
  <div class="page-card">
    <div class="page-header">
      <div class="page-header-left">
        <h2>{{ t("mcp.title") }}</h2>
        <el-select
          v-model="settings.state.defaultClient"
          :placeholder="t('clients.selectClient')"
          size="small"
          style="width: 180px"
        >
          <el-option
            v-for="client in clients"
            :key="client.id"
            :label="client.name"
            :value="client.id"
          >
            <div class="client-option">
              <el-image :src="client.logo" class="option-logo" style="width:20px;height:20px">
                <template #error><span>{{ client.icon }}</span></template>
              </el-image>
              <span>{{ client.name }}</span>
            </div>
          </el-option>
        </el-select>
      </div>
      <div class="page-header-actions">
        <el-tooltip :content="t('mcp.importLocal')" placement="top">
          <el-button @click="importDialogVisible = true" circle :disabled="!hasClient">
            <el-icon><Upload /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip :content="t('skills.backup')" placement="top">
          <el-button type="warning" @click="openActionDialog('backup')" circle :disabled="!hasClient">
            <el-icon><FolderChecked /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip :content="t('skills.replace')" placement="top">
          <el-button type="danger" @click="openActionDialog('replace')" circle :disabled="!hasClient">
            <el-icon><Switch /></el-icon>
          </el-button>
        </el-tooltip>
        <el-dropdown trigger="click" @command="handleExport">
          <el-tooltip :content="t('mcp.export')" placement="top">
            <el-button type="success" circle :disabled="!hasClient">
              <el-icon><Download /></el-icon>
            </el-button>
          </el-tooltip>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="claude">{{ t("mcp.exportClaude") }}</el-dropdown-item>
              <el-dropdown-item command="vscode">{{ t("mcp.exportVSCode") }}</el-dropdown-item>
              <el-dropdown-item command="generic">{{ t("mcp.exportGeneric") }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <el-alert
      v-if="!hasClient"
      :title="t('clients.pleaseSelectClient')"
      type="warning"
      show-icon
      :closable="false"
      style="margin-bottom: 16px"
    />

    <el-row :gutter="16">
      <!-- Left: Server List -->
      <el-col :span="14">
        <div class="filter-bar">
          <el-input
            v-model="store.searchQuery"
            :placeholder="t('mcp.search')"
            clearable
            prefix-icon="Search"
            style="width: 240px"
          />
          <el-radio-group v-model="store.activeCategory" size="small">
            <el-radio-button value="all">All</el-radio-button>
            <el-radio-button value="filesystem">File</el-radio-button>
            <el-radio-button value="database">DB</el-radio-button>
            <el-radio-button value="search">Search</el-radio-button>
            <el-radio-button value="cloud">Cloud</el-radio-button>
            <el-radio-button value="devtools">Dev</el-radio-button>
            <el-radio-button value="ai">AI</el-radio-button>
          </el-radio-group>
          <div class="filter-right">
            <el-button size="small" @click="store.selectAll">{{ t("mcp.selectAll") }}</el-button>
            <el-button size="small" @click="store.deselectAll">{{ t("mcp.deselectAll") }}</el-button>
          </div>
        </div>

        <el-table
          :data="store.filteredServers"
          style="width: 100%"
          max-height="calc(100vh - 280px)"
          @row-click="(row) => store.toggleServer(row.id)"
          row-class-name="clickable-row"
        >
          <el-table-column width="50" align="center">
            <template #default="{ row }">
              <el-checkbox
                :model-value="store.isSelected(row.id)"
                @click.stop
                @change="store.toggleServer(row.id)"
              />
            </template>
          </el-table-column>
          <el-table-column :label="t('mcp.servers')" min-width="200">
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
          <el-table-column :label="t('mcp.category')" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="getCategoryType(row.category)">
                {{ row.category }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('mcp.package')" width="180">
            <template #default="{ row }">
              <span class="package-name" v-if="row.npm">{{ row.npm }}</span>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column :label="t('mcp.stars')" width="80" align="center">
            <template #default="{ row }">
              <span v-if="row.stars">⭐ {{ formatStars(row.stars) }}</span>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
        </el-table>
      </el-col>

      <!-- Right: JSON Preview -->
      <el-col :span="10">
        <div class="json-panel">
          <div class="json-panel-header">
            <span class="json-title">mcp.json</span>
            <div class="json-actions">
              <el-tag type="info" size="small" style="margin-right: 8px">
                {{ t("mcp.selectedCount", { count: store.selectedCount }) }}
              </el-tag>
              <el-button size="small" text @click="copyJson">
                <el-icon><CopyDocument /></el-icon>
              </el-button>
              <el-button size="small" text @click="handleDownload">
                <el-icon><Download /></el-icon>
              </el-button>
            </div>
          </div>
          <div class="json-content">
            <pre><code>{{ store.mcpJsonOutput }}</code></pre>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- Import Dialog -->
    <el-dialog
      v-model="importDialogVisible"
      :title="t('mcp.importTitle')"
      width="560px"
      destroy-on-close
    >
      <div class="import-clients-grid">
        <div v-for="client in clients" :key="client.id" class="import-client-card">
          <div class="import-client-logo">
            <el-image :src="client.logo" :alt="client.name" style="width:28px;height:28px">
              <template #error><span style="font-size:24px">{{ client.icon }}</span></template>
            </el-image>
          </div>
          <div class="import-client-name">{{ client.name }}</div>
          <el-button size="small" @click="scanClient(client)">{{ t("mcp.scan") }}</el-button>
        </div>
      </div>
      <div v-if="scanResults.length > 0" class="scan-results">
        <el-divider content-position="left">
          {{ t("mcp.foundServers", { count: scanResults.length }) }}
        </el-divider>
        <el-checkbox-group v-model="selectedForImport">
          <div v-for="(entry, idx) in scanResults" :key="idx" class="scan-item">
            <el-checkbox :value="idx" :label="entry.name">
              {{ entry.name }}
            </el-checkbox>
            <el-tag size="small">{{ entry.source }}</el-tag>
          </div>
        </el-checkbox-group>
      </div>
      <template #footer>
        <el-button @click="importDialogVisible = false">{{ t("common.cancel") }}</el-button>
        <el-button
          type="primary"
          :disabled="selectedForImport.length === 0"
          @click="importScanned"
        >
          {{ t("mcp.importBtn", { count: selectedForImport.length }) }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Backup / Replace Dialog -->
    <el-dialog
      v-model="actionDialogVisible"
      :title="actionType === 'backup' ? t('skills.backup') : t('skills.replace')"
      width="420px"
      destroy-on-close
    >
      <div v-if="actionType === 'replace'">
        <el-alert
          :title="t('skills.replaceConfirm')"
          type="warning"
          show-icon
          :closable="false"
          style="margin-bottom: 16px"
        />
      </div>
      <el-form label-width="100px">
        <el-form-item :label="actionType === 'backup' ? t('skills.backupTo') : t('skills.replaceTo')">
          <el-select v-model="actionTarget" style="width: 100%">
            <el-option
              v-for="client in clients"
              :key="client.id"
              :label="client.name"
              :value="client.id"
            >
              <span>{{ client.icon }} {{ client.name }}</span>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="actionDialogVisible = false">{{ t("common.cancel") }}</el-button>
        <el-button type="primary" @click="executeAction">
          {{ t("common.confirm") }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage, ElMessageBox } from "element-plus";
import { Download, Upload, CopyDocument, ArrowDown, FolderChecked, Switch } from "@element-plus/icons-vue";
import { useMcpStore } from "@/stores/mcp";
import { useSettingsStore } from "@/stores/settings";
import { exportToJson, downloadJson } from "@/utils/mcp-config";
import type { LocalMcpEntry } from "@/utils/mcp-config";
import { listAgentClients, scanAgentClient, type AgentClientData } from "@/services";

const { t } = useI18n();
const store = useMcpStore();
const settings = useSettingsStore();

const clients = ref<AgentClientData[]>([]);

const hasClient = computed(() => !!settings.state.defaultClient);

const currentClient = computed(() => {
  return clients.value.find((c) => c.id === settings.state.defaultClient);
});

const importDialogVisible = ref(false);
const actionDialogVisible = ref(false);
const actionType = ref<"backup" | "replace">("backup");
const actionTarget = ref("claude-desktop");
const scanResults = ref<LocalMcpEntry[]>([]);
const selectedForImport = ref<number[]>([]);

function getCategoryType(category: string) {
  const map: Record<string, string> = {
    filesystem: "",
    database: "success",
    search: "warning",
    cloud: "info",
    devtools: "danger",
    communication: "",
    ai: "success",
    productivity: "warning",
    other: "info"
  };
  return map[category] || "";
}

function formatStars(stars: number) {
  return stars >= 1000 ? (stars / 1000).toFixed(1) + "k" : stars;
}

async function copyJson() {
  try {
    await navigator.clipboard.writeText(store.mcpJsonOutput);
    ElMessage.success(t("mcp.copied"));
  } catch {
    ElMessage.error(t("mcp.copyFailed"));
  }
}

function handleExport(format: "claude" | "vscode" | "generic") {
  const content = exportToJson(store.selectedServers, format);
  const filename = format === "claude" ? "claude_desktop_config.json" : "mcp.json";
  downloadJson(content, filename);
  ElMessage.success(t("mcp.exportSuccess", { file: filename }));
}

function handleDownload() {
  downloadJson(store.mcpJsonOutput, "mcp.json");
  ElMessage.success(t("mcp.downloadSuccess"));
}

async function scanClient(client: AgentClientData) {
  scanResults.value = [];
  selectedForImport.value = [];
  try {
    const result = await scanAgentClient(client.id);
    scanResults.value = result.mcpServers ?? [];
    if (result.found) {
      ElMessage.success(t("mcp.foundServers", { count: scanResults.value.length }));
    } else {
      ElMessage.info(t("mcp.notFound"));
    }
  } catch {
    ElMessage.warning(t("mcp.scanWebMode"));
  }
}

function importScanned() {
  const entries = selectedForImport.value.map((i) => scanResults.value[i]);
  store.addLocalMcps(entries);
  importDialogVisible.value = false;
  scanResults.value = [];
  selectedForImport.value = [];
  ElMessage.success(t("mcp.importSuccess"));
}

function openActionDialog(type: "backup" | "replace") {
  actionType.value = type;
  actionTarget.value = "claude-desktop";
  actionDialogVisible.value = true;
}

async function executeAction() {
  if (actionType.value === "replace") {
    await ElMessageBox.confirm(
      t("skills.replaceConfirm"),
      t("common.confirm"),
      { type: "warning" }
    );
  }
  actionDialogVisible.value = false;
  ElMessage.success(
    actionType.value === "backup" ? t("skills.backupSuccess") : t("skills.replaceSuccess")
  );
}

onMounted(async () => {
  try {
    clients.value = await listAgentClients();
  } catch {
    clients.value = [];
  }
});
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-right {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.server-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.server-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.server-name {
  font-size: 14px;
  font-weight: 500;
}

.server-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.package-name {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-family: monospace;
}

.text-muted {
  color: var(--el-text-color-placeholder);
}

.json-panel {
  background: #ffffff;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 220px);
}

.json-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--el-border-color);
  background: var(--el-fill-color-lighter);
}

.json-title {
  font-family: monospace;
  font-size: 13px;
}

.json-actions {
  display: flex;
  align-items: center;
}

.json-content {
  flex: 1;
  overflow: auto;
  padding: 12px 16px;
}

.json-content pre {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.import-clients-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.import-client-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.import-client-card:hover {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

.import-client-logo {
  width: 40px;
  height: 40px;
  background: #ffffff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.import-client-logo img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.import-client-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.scan-results {
  margin-top: 16px;
}

.scan-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
}

:deep(.clickable-row) {
  cursor: pointer;
}
</style>
