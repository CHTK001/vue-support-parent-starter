<template>
  <div class="page-card ai-page">
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
        <div v-for="provider in providerStore.providers" :key="provider.id" class="provider-card">
          <div class="provider-card-header">
            <div class="provider-card-name">
              <img :src="getClientLogo(provider.clientId)" class="provider-client-logo" @error="($event.target as HTMLImageElement).style.display='none'" />
              <div>
                <div class="provider-name-row">
                  <span>{{ provider.name }}</span>
                  <el-tag size="small" :type="getProtocolType(provider.protocol)">{{ provider.protocol.toUpperCase() }}</el-tag>
                </div>
                <span class="provider-client-name">{{ getClientName(provider.clientId) }}</span>
              </div>
            </div>
            <div class="provider-card-actions" @click.stop>
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
              <span class="field-label">{{ t('ai.apiKey') }}</span>
              <span class="field-value">{{ provider.apiKey ? maskKey(provider.apiKey) : '-' }}</span>
            </div>
            <div class="provider-field">
              <span class="field-label">{{ t('ai.models') }} ({{ provider.models.length }})</span>
              <div class="model-tags">
                <el-tag v-for="m in provider.models.slice(0, 6)" :key="m" size="small" type="info">{{ m }}</el-tag>
                <el-tag v-if="provider.models.length > 6" size="small">+{{ provider.models.length - 6 }}</el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <el-table v-else :data="providerStore.providers" style="width: 100%">
        <el-table-column width="36" align="center">
          <template #default="{ row }">
            <el-switch :model-value="row.isActive" @change="providerStore.toggleProvider(row.id)" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="" width="40">
          <template #default="{ row }">
            <img :src="getClientLogo(row.clientId)" class="list-client-logo" @error="($event.target as HTMLImageElement).style.display='none'" />
          </template>
        </el-table-column>
        <el-table-column :label="t('ai.providerName')" min-width="140">
          <template #default="{ row }">
            <div class="provider-name">
              <span>{{ row.name }}</span>
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
        <el-table-column :label="t('ai.models')" min-width="250">
          <template #default="{ row }">
            <div class="model-tags">
              <el-tag v-for="m in row.models.slice(0, 4)" :key="m" size="small" type="info">{{ m }}</el-tag>
              <el-tag v-if="row.models.length > 4" size="small">+{{ row.models.length - 4 }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.actions')" width="120" align="center">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="openDialog(row)">{{ t('common.edit') }}</el-button>
            <el-button size="small" text type="danger" @click="handleDelete(row.id)">{{ t('common.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Add/Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="editing ? t('ai.editProvider') : t('ai.addProvider')" width="560px" destroy-on-close>
      <el-form label-width="100px">
        <el-form-item :label="t('ai.providerName')"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="Client">
          <el-select v-model="form.clientId" style="width: 100%">
            <el-option v-for="c in MCP_CLIENTS" :key="c.id" :label="c.name" :value="c.id">
              <span style="display:flex;align-items:center;gap:8px">
                <img :src="c.logo" style="width:18px;height:18px" @error="($event.target as HTMLImageElement).style.display='none'" />
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
            <div style="display: flex; gap: 8px; margin-bottom: 8px">
              <el-button size="small" @click="fetchModels" :loading="fetchingModels">
                <el-icon><Refresh /></el-icon> {{ t('ai.fetchModels') }}
              </el-button>
              <el-tag v-if="fetchedModelCount > 0" type="success" size="small">{{ t('ai.fetchedModels', { count: fetchedModelCount }) }}</el-tag>
            </div>
            <el-select v-model="form.selectedModels" multiple filterable allow-create default-first-option :placeholder="t('ai.modelsPlaceholder')" style="width: 100%">
              <el-option v-for="m in availableModels" :key="m.id" :label="m.name" :value="m.id" />
            </el-select>
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
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Edit, Delete, Grid, List, Refresh } from "@element-plus/icons-vue";
import { useProviderStore, type ModelProvider, type ProviderProtocol } from "@/stores/provider";
import { MCP_CLIENTS } from "@/utils/mcp-config";
import { fetchModelsFromProvider, type ModelInfo } from "@/services";

const { t } = useI18n();
const providerStore = useProviderStore();

const viewMode = ref<"card" | "list">("card");
const dialogVisible = ref(false);
const editing = ref<ModelProvider | null>(null);
const form = ref({ name: "", apiBase: "", apiKey: "", protocol: "openai" as ProviderProtocol, clientId: "opencode", selectedModels: [] as string[] });

const PROTOCOL_PRESETS: Record<ProviderProtocol, { apiBase: string; models: string[] }> = {
  openai: { apiBase: "https://api.openai.com/v1", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1", "o1-mini"] },
  claude: { apiBase: "https://api.anthropic.com", models: ["claude-sonnet-4-20250514", "claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"] },
  gemini: { apiBase: "https://generativelanguage.googleapis.com/v1", models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"] }
};

function getClientLogo(clientId?: string): string {
  return MCP_CLIENTS.find(c => c.id === clientId)?.logo || MCP_CLIENTS[0].logo;
}

function getClientName(clientId?: string): string {
  return MCP_CLIENTS.find(c => c.id === clientId)?.name || "";
}

function getApiBasePlaceholder(protocol: ProviderProtocol) {
  return PROTOCOL_PRESETS[protocol]?.apiBase || "https://api.example.com/v1";
}

const availableModels = ref<ModelInfo[]>([]);
const fetchedModelCount = computed(() => availableModels.value.length);
const fetchingModels = ref(false);

function maskKey(k: string) { return k.length <= 8 ? "****" : k.substring(0, 4) + "****" + k.substring(k.length - 4); }

function getProtocolType(protocol: ProviderProtocol) {
  const map: Record<ProviderProtocol, string> = { openai: "success", claude: "warning", gemini: "info" };
  return map[protocol] || "";
}

function openDialog(provider: ModelProvider | null) {
  editing.value = provider;
  availableModels.value = [];
  if (provider) {
    form.value = { name: provider.name, apiBase: provider.apiBase, apiKey: provider.apiKey || "", protocol: provider.protocol || "openai", clientId: provider.clientId || "opencode", selectedModels: [...provider.models] };
  } else {
    form.value = { name: "", apiBase: PROTOCOL_PRESETS.openai.apiBase, apiKey: "", protocol: "openai", clientId: "opencode", selectedModels: [...PROTOCOL_PRESETS.openai.models] };
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
  const models = form.value.selectedModels;
  if (editing.value) {
    providerStore.updateProvider(editing.value.id, { name: form.value.name, apiBase: form.value.apiBase, apiKey: form.value.apiKey, models, protocol: form.value.protocol, clientId: form.value.clientId });
  } else {
    const id = form.value.name.toLowerCase().replace(/\s+/g, "-");
    providerStore.addProvider({ id, name: form.value.name, apiBase: form.value.apiBase, apiKey: form.value.apiKey, models, isActive: true, protocol: form.value.protocol, clientId: form.value.clientId } as ModelProvider);
  }
  dialogVisible.value = false;
  ElMessage.success(t("common.save"));
}
</script>

<style scoped>
.ai-page { height: calc(100vh - 100px); display: flex; flex-direction: column; }
.provider-content { flex: 1; overflow: auto; }
.provider-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.provider-header h3 { margin: 0; font-size: 16px; flex: 1; }
.header-actions { display: flex; gap: 8px; align-items: center; }

.provider-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
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

.provider-name { display: flex; align-items: center; gap: 6px; font-weight: 500; }
.client-tag { font-size: 11px; color: var(--el-text-color-secondary); background: var(--el-fill-color-lighter); padding: 0 6px; border-radius: 3px; }
.list-client-logo { width: 22px; height: 22px; object-fit: contain; }
.api-base { font-size: 11px; color: var(--el-text-color-secondary); background: var(--el-fill-color-lighter); padding: 2px 6px; border-radius: 4px; }
.key-masked { font-family: monospace; font-size: 11px; color: var(--el-text-color-secondary); }
.text-muted { color: var(--el-text-color-placeholder); }
.model-tags { display: flex; flex-wrap: wrap; gap: 4px; }
</style>
