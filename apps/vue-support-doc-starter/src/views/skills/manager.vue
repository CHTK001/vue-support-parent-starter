<template>
  <div class="page-card">
    <div class="page-header">
      <div class="page-header-left">
        <h2>{{ t("skills.title") }}</h2>
        <el-select
          v-model="settings.state.defaultClient"
          :placeholder="t('clients.selectClient')"
          size="small"
          style="width: 180px"
        >
          <el-option
            v-for="client in MCP_CLIENTS"
            :key="client.id"
            :label="client.name"
            :value="client.id"
          >
            <div class="client-option">
              <img :src="client.logo" class="option-logo" @error="handleLogoError($event, client)" />
              <span>{{ client.name }}</span>
            </div>
          </el-option>
        </el-select>
      </div>
      <div class="page-header-actions">
        <el-tooltip :content="t('skills.importSkills')" placement="top">
          <el-button @click="importDialogVisible = true" circle :disabled="!hasClient">
            <el-icon><Upload /></el-icon>
          </el-button>
        </el-tooltip>
        <el-dropdown trigger="click" @command="handleExport">
          <el-tooltip :content="t('skills.export')" placement="top">
            <el-button type="success" circle :disabled="!hasClient">
              <el-icon><Download /></el-icon>
            </el-button>
          </el-tooltip>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="json">skills.json</el-dropdown-item>
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
      <el-col :span="14">
        <div class="filter-bar">
          <el-input
            v-model="store.searchQuery"
            :placeholder="t('skills.search')"
            clearable
            prefix-icon="Search"
            style="width: 240px"
          />
          <el-radio-group v-model="store.activeCategory" size="small">
            <el-radio-button value="all">All</el-radio-button>
            <el-radio-button value="code">Code</el-radio-button>
            <el-radio-button value="ui">UI</el-radio-button>
            <el-radio-button value="search">Search</el-radio-button>
            <el-radio-button value="devops">DevOps</el-radio-button>
          </el-radio-group>
          <div class="filter-right">
            <el-button size="small" @click="store.selectAll">{{ t("mcp.selectAll") }}</el-button>
            <el-button size="small" @click="store.deselectAll">{{ t("mcp.deselectAll") }}</el-button>
          </div>
        </div>

        <el-table
          :data="store.filteredSkills"
          style="width: 100%"
          max-height="calc(100vh - 280px)"
          @row-click="(row) => store.toggleSkill(row.id)"
          row-class-name="clickable-row"
        >
          <el-table-column width="50" align="center">
            <template #default="{ row }">
              <el-checkbox
                :model-value="store.isSelected(row.id)"
                @click.stop
                @change="store.toggleSkill(row.id)"
              />
            </template>
          </el-table-column>
          <el-table-column :label="t('skills.skillName')" min-width="160">
            <template #default="{ row }">
              <div>
                <div style="font-weight: 500">{{ row.name }}</div>
                <div style="font-size: 12px; color: var(--el-text-color-secondary)">
                  {{ row.author }} v{{ row.version }}
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="t('skills.skillDesc')" min-width="220">
            <template #default="{ row }">
              <span style="font-size: 13px; color: var(--el-text-color-regular)">
                {{ row.description }}
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="t('skills.skillCategory')" width="90" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="getCategoryType(row.category)">
                {{ row.category }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('clients.status')" width="80" align="center">
            <template #default="{ row }">
              <el-switch
                :model-value="row.enabled"
                @click.stop
                @change="store.toggleEnabled(row.id)"
                size="small"
              />
            </template>
          </el-table-column>
        </el-table>
      </el-col>

      <el-col :span="10">
        <div class="json-panel">
          <div class="json-panel-header">
            <span class="json-title">skills.json</span>
            <div class="json-actions">
              <el-tag type="info" size="small" style="margin-right: 8px">
                {{ t("skills.selectedCount", { count: store.selectedCount }) }}
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
            <pre><code>{{ skillsJsonOutput }}</code></pre>
          </div>
        </div>
      </el-col>
    </el-row>

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
              v-for="client in MCP_CLIENTS"
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

    <!-- Import Dialog -->
    <el-dialog
      v-model="importDialogVisible"
      :title="t('skills.importTitle')"
      width="520px"
      destroy-on-close
    >
      <el-button @click="scanLocal" style="margin-bottom: 16px">
        <el-icon><Search /></el-icon> {{ t("skills.scanLocal") }}
      </el-button>
      <div v-if="scanResults.length > 0">
        <el-divider content-position="left">
          {{ t("skills.foundSkills", { count: scanResults.length }) }}
        </el-divider>
        <el-checkbox-group v-model="selectedForImport">
          <div v-for="(skill, idx) in scanResults" :key="idx" class="scan-item">
            <el-checkbox :value="idx">{{ skill.name }}</el-checkbox>
            <el-tag size="small">{{ skill.category }}</el-tag>
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
          {{ t("skills.importBtn", { count: selectedForImport.length }) }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage, ElMessageBox } from "element-plus";
import { Upload, Download, CopyDocument, Search } from "@element-plus/icons-vue";
import { useSkillsStore } from "@/stores/skills";
import { useSettingsStore } from "@/stores/settings";
import { MCP_CLIENTS } from "@/utils/mcp-config";
import type { SkillInfo } from "@/resources/skills-list";
import { scanLocalSkills } from "@/services";

const { t } = useI18n();
const store = useSkillsStore();
const settings = useSettingsStore();

const hasClient = computed(() => !!settings.state.defaultClient);

const importDialogVisible = ref(false);
const actionDialogVisible = ref(false);
const actionType = ref<"backup" | "replace">("backup");
const actionTarget = ref("claude-desktop");
const scanResults = ref<SkillInfo[]>([]);
const selectedForImport = ref<number[]>([]);

const skillsJsonOutput = computed(() => JSON.stringify(store.generateSkillsJson(), null, 2));

function getCategoryType(category: string) {
  const map: Record<string, string> = {
    code: "",
    ui: "success",
    search: "warning",
    data: "info",
    devops: "danger",
    other: "info"
  };
  return map[category] || "";
}

function copyJson() {
  navigator.clipboard.writeText(skillsJsonOutput.value).then(() => {
    ElMessage.success(t("skills.copied"));
  }).catch(() => {
    ElMessage.error(t("skills.copyFailed"));
  });
}

function handleExport(command: string) {
  const content = skillsJsonOutput.value;
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "skills.json";
  a.click();
  URL.revokeObjectURL(url);
  ElMessage.success(t("skills.exportSuccess", { file: "skills.json" }));
}

function handleDownload() {
  handleExport("json");
}

async function scanLocal() {
  scanResults.value = [];
  selectedForImport.value = [];
  try {
    const skillDirs = ["~/.agents/skills"];
    const results = await scanLocalSkills(skillDirs);
    scanResults.value = results.map((entry) => ({
      id: entry.name,
      name: entry.name,
      description: entry.description || "",
      category: entry.category || "other",
      path: entry.path || "",
      enabled: true,
    }));
    ElMessage.success(t("skills.foundSkills", { count: scanResults.value.length }));
  } catch {
    ElMessage.warning(t("skills.scanWebMode"));
  }
}

function importScanned() {
  const entries = selectedForImport.value.map((i) => scanResults.value[i]);
  store.addSkills(entries);
  importDialogVisible.value = false;
  scanResults.value = [];
  selectedForImport.value = [];
  ElMessage.success(t("skills.importSuccess"));
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

defineExpose({ openActionDialog });
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
