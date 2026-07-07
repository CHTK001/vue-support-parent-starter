<template>
  <div class="page-card">
    <div class="page-header">
      <h2>{{ t("provider.title") }}</h2>
      <div class="page-header-actions">
        <el-tooltip :content="t('provider.addProvider')" placement="top">
          <el-button @click="openAddDialog" circle type="primary">
            <el-icon><Plus /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <el-table :data="store.providers" style="width: 100%">
      <el-table-column width="50" align="center">
        <template #default="{ row }">
          <el-radio
            :model-value="store.activeProviderId"
            :value="row.id"
            @change="store.setActiveProvider(row.id)"
          />
        </template>
      </el-table-column>
      <el-table-column :label="t('provider.name')" min-width="120">
        <template #default="{ row }">
          <div class="provider-name">
            <span class="provider-icon" :style="{ background: row.isActive ? '#67C23A' : '#909399' }"></span>
            {{ row.name }}
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="t('provider.apiBase')" min-width="200">
        <template #default="{ row }">
          <code class="api-base">{{ row.apiBase }}</code>
        </template>
      </el-table-column>
      <el-table-column :label="t('provider.apiKey')" min-width="180">
        <template #default="{ row }">
          <div v-if="row.apiKey" class="api-key-masked">
            {{ maskKey(row.apiKey) }}
          </div>
          <span v-else class="text-muted">{{ t('provider.notSet') }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('provider.models')" min-width="200">
        <template #default="{ row }">
          <div class="model-tags">
            <el-tag v-for="m in row.models.slice(0, 3)" :key="m" size="small" type="info">
              {{ m }}
            </el-tag>
            <el-tag v-if="row.models.length > 3" size="small" type="info">
              +{{ row.models.length - 3 }}
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="t('provider.status')" width="80" align="center">
        <template #default="{ row }">
          <el-switch
            :model-value="row.isActive"
            @change="store.toggleProvider(row.id)"
            size="small"
          />
        </template>
      </el-table-column>
      <el-table-column :label="t('common.actions')" width="120" align="center">
        <template #default="{ row }">
          <el-button size="small" text type="primary" @click="openEditDialog(row)">
            {{ t('common.edit') }}
          </el-button>
          <el-button size="small" text type="danger" @click="handleDelete(row.id)">
            {{ t('common.delete') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingProvider ? t('provider.editProvider') : t('provider.addProvider')"
      width="500px"
      destroy-on-close
    >
      <el-form label-width="100px">
        <el-form-item :label="t('provider.name')">
          <el-input v-model="form.name" :placeholder="t('provider.namePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('provider.apiBase')">
          <el-input v-model="form.apiBase" placeholder="https://api.example.com/v1" />
        </el-form-item>
        <el-form-item :label="t('provider.apiKey')">
          <el-input v-model="form.apiKey" type="password" show-password :placeholder="t('provider.apiKeyPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('provider.models')">
          <el-input
            v-model="form.modelsStr"
            type="textarea"
            :rows="4"
            :placeholder="t('provider.modelsPlaceholder')"
          />
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
import { ref, reactive } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import { useProviderStore, type ModelProvider } from "@/stores/provider";

const { t } = useI18n();
const store = useProviderStore();

const dialogVisible = ref(false);
const editingProvider = ref<ModelProvider | null>(null);

const form = reactive({
  name: "",
  apiBase: "",
  apiKey: "",
  modelsStr: ""
});

function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return key.substring(0, 4) + "****" + key.substring(key.length - 4);
}

function openAddDialog() {
  editingProvider.value = null;
  form.name = "";
  form.apiBase = "";
  form.apiKey = "";
  form.modelsStr = "";
  dialogVisible.value = true;
}

function openEditDialog(provider: ModelProvider) {
  editingProvider.value = provider;
  form.name = provider.name;
  form.apiBase = provider.apiBase;
  form.apiKey = provider.apiKey || "";
  form.modelsStr = provider.models.join("\n");
  dialogVisible.value = true;
}

function handleSave() {
  const models = form.modelsStr
    .split("\n")
    .map((m) => m.trim())
    .filter(Boolean);

  if (!form.name || !form.apiBase) {
    ElMessage.warning("Name and API Base are required");
    return;
  }

  if (editingProvider.value) {
    store.updateProvider(editingProvider.value.id, {
      name: form.name,
      apiBase: form.apiBase,
      apiKey: form.apiKey,
      models
    });
  } else {
    const id = form.name.toLowerCase().replace(/\s+/g, "-");
    store.addProvider({
      id,
      name: form.name,
      apiBase: form.apiBase,
      apiKey: form.apiKey,
      models,
      isActive: true
    });
  }

  dialogVisible.value = false;
  ElMessage.success(t("common.save"));
}

async function handleDelete(id: string) {
  await ElMessageBox.confirm(t("common.confirm"), t("common.delete"), { type: "warning" });
  store.removeProvider(id);
  ElMessage.success(t("common.delete"));
}
</script>

<style scoped>
.provider-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.provider-icon {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.api-base {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--nexus-data-font);
}

.api-key-masked {
  font-family: var(--nexus-data-font);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.text-muted {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.model-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
