<template>
  <div class="page-card ai-page">
    <!-- Protocol Filter Cards -->
    <div class="filter-cards">
      <div v-for="proto in PROTOCOL_FILTERS" :key="proto.value" :class="['filter-card', { active: activeProtocol === proto.value }]" @click="activeProtocol = proto.value">
        <img :src="proto.logo" class="filter-logo" @error="($event.target as HTMLImageElement).style.display='none'" />
        <div class="filter-info">
          <span class="filter-name">{{ proto.label }}</span>
          <el-tag size="small" :type="proto.tagType">{{ proto.count }}</el-tag>
        </div>
      </div>
      <div :class="['filter-card', { active: activeProtocol === '' }]" @click="activeProtocol = ''">
        <div class="filter-logo all-icon"><el-icon><Grid /></el-icon></div>
        <div class="filter-info">
          <span class="filter-name">{{ t('ai.allProviders') }}</span>
          <el-tag size="small" type="info">{{ providerStore.providers.length }}</el-tag>
        </div>
      </div>
    </div>

    <div class="provider-content">
      <div class="provider-header">
        <h3>{{ t('menu.providers') }}</h3>
        <div class="header-actions">
          <el-button-group>
            <el-button :type="viewMode === 'card' ? 'primary' : ''" size="small" @click="viewMode = 'card'">
              <el-icon><Grid /></el-icon>
            </el-button>
            <el-button :type="viewMode === 'list' ? 'primary' : ''" size="small" @click="viewMode = 'list'">
              <el-icon><List /></el-icon>
            </el-button>
          </el-button-group>
          <el-button type="primary" size="small" @click="openDialog(null)">
            <el-icon><Plus /></el-icon> {{ t('ai.addProvider') }}
          </el-button>
        </div>
      </div>

      <!-- Card View -->
      <div v-if="viewMode === 'card'" class="provider-cards">
        <div v-for="provider in filteredProviders" :key="provider.id" class="provider-card">
          <div class="provider-card-header">
            <div class="provider-card-name">
              <img :src="getClientLogo(provider.clientId)" class="provider-client-logo" @error="handleLogoError" />
              <div>
                <div class="provider-name-row">
                  <span>{{ provider.name }}</span>
                  <el-tag size="small" :type="getProtocolType(provider.protocol)">{{ (provider.protocol || 'openai').toUpperCase() }}</el-tag>
                </div>
                <span class="provider-client-name">{{ getClientName(provider.clientId) }}</span>
              </div>
            </div>
            <div class="provider-card-actions">
              <el-switch :model-value="provider.isActive" @change="providerStore.toggleProvider(provider.id)" size="small" />
              <el-button size="small" text @click="openDialog(provider)"><el-icon><Edit /></el-icon></el-button>
              <el-button size="small" text type="danger" @click="handleDelete(provider.id)"><el-icon><Delete /></el-icon></el-button>
            </div>
          </div>
          <div class="provider-card-body">
            <div class="provider-field">
              <span class="field-label">{{ t('ai.apiBase') }}</span>
              <code class="field-value">{{ provider.apiBase }}</code>
            </div>
            <div class="provider-field">
              <span class="field-label">{{ t('ai.models') }} ({{ provider.models.length }})</span>
              <div class="model-tags">
                <el-tag v-for="m in provider.models.slice(0, 6)" :key="m" size="small" type="info">{{ provider.modelLabels?.[m] || m }}</el-tag>
                <el-tag v-if="provider.models.length > 6" size="small">+{{ provider.models.length - 6 }}</el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <el-table v-else :data="filteredProviders" style="width: 100%">
        <el-table-column width="60" align="center" :label="t('ai.enabled')">
          <template #default="{ row }">
            <el-switch :model-value="row.isActive" @change="providerStore.toggleProvider(row.id)" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="" width="46" align="center">
          <template #default="{ row }">
            <img :src="getClientLogo(row.clientId)" class="list-client-logo" @error="handleLogoError($event)" />
          </template>
        </el-table-column>
        <el-table-column :label="t('ai.providerName')" min-width="140">
          <template #default="{ row }">
            <div class="provider-name">
              <span class="provider-name-text">{{ row.name }}</span>
              <el-tag size="small" :type="getProtocolType(row.protocol)">{{ (row.protocol || 'openai').toUpperCase() }}</el-tag>
              <span class="client-tag">{{ getClientName(row.clientId) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('ai.apiBase')" min-width="200">
          <template #default="{ row }"><code class="api-base">{{ row.apiBase }}</code></template>
        </el-table-column>
        <el-table-column :label="t('ai.apiKey')" width="140">
          <template #default="{ row }">
            <span v-if="row.apiKey" class="key-masked">{{ maskKey(row.apiKey) }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('ai.models')" min-width="260">
          <template #default="{ row }">
            <div class="model-tags" v-if="row.models.length">
              <el-tag v-for="m in row.models.slice(0, 5)" :key="m" size="small" type="info">{{ row.modelLabels?.[m] || m }}</el-tag>
              <el-tag v-if="row.models.length > 5" size="small">+{{ row.models.length - 5 }}</el-tag>
            </div>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.actions')" width="140" align="center">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="openDialog(row)">{{ t('common.edit') }}</el-button>
            <el-button size="small" text type="danger" @click="handleDelete(row.id)">{{ t('common.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Add/Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="editing ? t('ai.editProvider') : t('ai.addProvider')" width="620px" destroy-on-close>
      <el-form label-width="100px">
        <el-form-item :label="t('ai.providerName')"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="Client">
          <el-select v-model="form.clientId" style="width: 100%">
            <el-option v-for="c in MCP_CLIENTS" :key="c.id" :label="c.name" :value="c.id">
              <span style="display:flex;align-items:center;gap:8px">
                <img :src="c.logo" style="width:18px;height:18px" @error="handleLogoError($event)" />
                {{ c.name }}
              </span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="t('ai.protocol')">
          <el-radio-group v-model="form.protocol">
            <el-radio-button value="openai">OpenAI</el-radio-button>
            <el-radio-button value="claude">Claude Code</el-radio-button>
            <el-radio-button value="gemini">Gemini</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('ai.apiBase')"><el-input v-model="form.apiBase" :placeholder="getApiBasePlaceholder(form.protocol)" /></el-form-item>
        <el-form-item :label="t('ai.apiKey')"><el-input v-model="form.apiKey" type="password" show-password placeholder="sk-..." /></el-form-item>
        <el-form-item :label="t('ai.models')">
          <div style="width: 100%">
            <div style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">
              <el-button size="small" @click="fetchModels" :loading="fetchingModels">
                <el-icon><Refresh /></el-icon> {{ t('ai.fetchModels') }}
              </el-button>
              <el-tag v-if="fetchedModelCount > 0" type="success" size="small">{{ t('ai.fetchedModels', { count: fetchedModelCount }) }}</el-tag>
              <el-button size="small" text type="primary" @click="addModelRow" style="margin-left: auto">
                <el-icon><Plus /></el-icon> {{ t('common.add') }}
              </el-button>
            </div>
            <div class="model-rows">
              <div v-for="(row, idx) in modelRows" :key="idx" class="model-row-item">
                <el-select v-model="row.id" filterable allow-create default-first-option style="flex:1" :placeholder="t('ai.modelIdPlaceholder')" @change="(v: string) => onModelIdChange(idx, v)">
                  <el-option v-for="m in availableModels" :key="m.id" :label="m.name" :value="m.id" />
                </el-select>
                <el-icon class="model-arrow"><ArrowRight /></el-icon>
                <el-input v-model="row.displayName" style="flex:1" :placeholder="row.id || t('ai.modelDisplayPlaceholder')" />
                <el-button text type="danger" size="small" @click="modelRows.splice(idx, 1)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSave">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Refresh, Grid, List, ArrowRight, Delete, Edit } from "@element-plus/icons-vue";
import { useProviderStore, getModelEntries, setModelsFromEntries, type ModelProvider, type ModelEntry, type ProviderProtocol } from "@/stores/provider";
import { MCP_CLIENTS } from "@/utils/mcp-config";
import { fetchModelsFromProvider, type ModelInfo } from "@/services";

const { t } = useI18n();
const providerStore = useProviderStore();

const dialogVisible = ref(false);
const editing = ref<ModelProvider | null>(null);
const activeProtocol = ref("");
const viewMode = ref<"card" | "list">("card");

const PROTOCOL_FILTERS = [
  { value: "openai", label: "GPT / OpenAI", logo: "/logos/gpt.svg", get count() { return providerStore.providers.filter((p) => p.protocol === "openai").length; }, tagType: "success" as const },
  { value: "claude", label: "Claude Code", logo: "/logos/claude.svg", get count() { return providerStore.providers.filter((p) => p.protocol === "claude").length; }, tagType: "warning" as const },
  { value: "gemini", label: "Gemini", logo: "/logos/gemini.svg", get count() { return providerStore.providers.filter((p) => p.protocol === "gemini").length; }, tagType: "info" as const },
];

const filteredProviders = computed(() => {
  if (!activeProtocol.value) return providerStore.providers;
  return providerStore.providers.filter((p) => p.protocol === activeProtocol.value);
});

const PROTOCOL_PRESETS: Record<ProviderProtocol, { apiBase: string; models: string[] }> = {
  openai: { apiBase: "https://api.openai.com/v1", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1", "o1-mini"] },
  claude: { apiBase: "https://api.anthropic.com", models: ["claude-sonnet-4-20250514", "claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"] },
  gemini: { apiBase: "https://generativelanguage.googleapis.com/v1", models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"] }
};

const form = ref({ name: "", apiBase: "", apiKey: "", protocol: "openai" as ProviderProtocol, clientId: "opencode" });
const modelRows = ref<ModelEntry[]>([]);
const availableModels = ref<ModelInfo[]>([]);
const fetchedModelCount = computed(() => availableModels.value.length);
const fetchingModels = ref(false);

function getClientLogo(clientId?: string): string {
  return MCP_CLIENTS.find(c => c.id === clientId)?.logo || MCP_CLIENTS[0].logo;
}
function getClientName(clientId?: string): string {
  return MCP_CLIENTS.find(c => c.id === clientId)?.name || "";
}
function getApiBasePlaceholder(protocol: ProviderProtocol) {
  return PROTOCOL_PRESETS[protocol]?.apiBase || "https://api.example.com/v1";
}
function maskKey(k: string) { return k.length <= 8 ? "****" : k.substring(0, 4) + "****" + k.substring(k.length - 4); }
function getProtocolType(protocol: ProviderProtocol) {
  const map: Record<ProviderProtocol, string> = { openai: "success", claude: "warning", gemini: "info" };
  return map[protocol] || "";
}
function handleLogoError(event: Event) { (event.target as HTMLImageElement).style.display = "none"; }

function addModelRow() {
  modelRows.value.push({ id: "", displayName: "" });
}

function onModelIdChange(idx: number, id: string) {
  if (!modelRows.value[idx].displayName) {
    modelRows.value[idx].displayName = id;
  }
}

function openDialog(provider: ModelProvider | null) {
  editing.value = provider;
  availableModels.value = [];
  if (provider) {
    form.value = { name: provider.name, apiBase: provider.apiBase, apiKey: provider.apiKey || "", protocol: provider.protocol || "openai", clientId: provider.clientId || "opencode" };
    modelRows.value = getModelEntries(provider);
  } else {
    form.value = { name: "", apiBase: PROTOCOL_PRESETS.openai.apiBase, apiKey: "", protocol: "openai", clientId: "opencode" };
    modelRows.value = PROTOCOL_PRESETS.openai.models.map((m) => ({ id: m, displayName: m }));
  }
  dialogVisible.value = true;
}

async function fetchModels() {
  if (!form.value.apiBase) { ElMessage.warning("Please enter API Base first"); return; }
  fetchingModels.value = true;
  availableModels.value = await fetchModelsFromProvider(form.value.apiBase, form.value.apiKey);
  fetchingModels.value = false;
  if (availableModels.value.length === 0) ElMessage.info("No models found or API unreachable");
}

async function handleDelete(id: string) {
  await ElMessageBox.confirm(t("common.confirm"), t("common.delete"), { type: "warning" });
  providerStore.removeProvider(id);
  ElMessage.success(t("common.delete"));
}

function handleSave() {
  if (!form.value.name || !form.value.apiBase) { ElMessage.warning("Name and API Base required"); return; }
  const provider: ModelProvider = {
    id: editing.value?.id || form.value.name.toLowerCase().replace(/\s+/g, "-"),
    name: form.value.name,
    apiBase: form.value.apiBase,
    apiKey: form.value.apiKey,
    models: [],
    isActive: editing.value?.isActive ?? true,
    protocol: form.value.protocol,
    clientId: form.value.clientId,
  };
  setModelsFromEntries(provider, modelRows.value.filter((r) => r.id.trim()));

  if (editing.value) {
    providerStore.updateProvider(editing.value.id, provider);
  } else {
    providerStore.addProvider(provider);
  }
  dialogVisible.value = false;
  ElMessage.success(t("common.save"));
}

onMounted(() => { /* providerStore.init() called from main.ts */ });
</script>

<style scoped>
.ai-page { height: calc(100vh - 100px); display: flex; flex-direction: column; }

.filter-cards { display: flex; gap: 12px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--el-border-color-lighter); }
.filter-card { display: flex; align-items: center; gap: 10px; padding: 12px 18px; background: var(--el-fill-color-lighter); border: 2px solid transparent; border-radius: 10px; cursor: pointer; transition: all 0.2s; min-width: 140px; }
.filter-card:hover { border-color: var(--el-color-primary-light-5); }
.filter-card.active { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.filter-logo { width: 32px; height: 32px; object-fit: contain; border-radius: 6px; }
.filter-logo.all-icon { width: 32px; height: 32px; background: var(--el-fill-color); display: flex; align-items: center; justify-content: center; border-radius: 6px; }
.filter-info { display: flex; flex-direction: column; gap: 2px; }
.filter-name { font-size: 13px; font-weight: 600; }

.provider-content { flex: 1; overflow: auto; }
.provider-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.provider-header h3 { margin: 0; font-size: 16px; flex: 1; }
.header-actions { display: flex; gap: 8px; align-items: center; }
.provider-name { display: flex; align-items: center; gap: 6px; }
.provider-name-text { font-weight: 500; }
.client-tag { font-size: 11px; color: var(--el-text-color-secondary); background: var(--el-fill-color-lighter); padding: 0 6px; border-radius: 3px; }
.list-client-logo { width: 26px; height: 26px; object-fit: contain; vertical-align: middle; }
.api-base { font-size: 11px; color: var(--el-text-color-secondary); background: var(--el-fill-color-lighter); padding: 2px 6px; border-radius: 4px; }
.key-masked { font-family: monospace; font-size: 11px; color: var(--el-text-color-secondary); }
.text-muted { color: var(--el-text-color-placeholder); }
.model-tags { display: flex; flex-wrap: wrap; gap: 4px; }

.model-rows { display: flex; flex-direction: column; gap: 8px; max-height: 300px; overflow-y: auto; }
.model-row-item { display: flex; align-items: center; gap: 6px; }
.model-arrow { color: var(--el-text-color-secondary); flex-shrink: 0; }

.provider-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; margin-top: 4px; }
.provider-card { background: #fff; border: 1px solid var(--el-border-color-lighter); border-radius: 10px; padding: 16px; transition: all .2s; }
.provider-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.06); transform: translateY(-1px); }
.provider-card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; gap: 12px; }
.provider-card-name { display: flex; align-items: center; gap: 10px; min-width: 0; }
.provider-client-logo { width: 36px; height: 36px; object-fit: contain; border-radius: 6px; flex-shrink: 0; }
.provider-name-row { display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 15px; }
.provider-client-name { font-size: 11px; color: var(--el-text-color-secondary); }
.provider-card-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
.provider-card-body { display: flex; flex-direction: column; gap: 10px; }
.provider-field { display: flex; flex-direction: column; gap: 4px; }
.field-label { font-size: 11px; color: var(--el-text-color-secondary); text-transform: uppercase; letter-spacing: .5px; }
.field-value { font-size: 12px; color: var(--el-text-color-primary); font-family: monospace; word-break: break-all; }
</style>