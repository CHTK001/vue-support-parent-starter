<template>
  <div class="page-card">
    <div class="page-header">
      <h2>{{ t("settings.ai") }}</h2>
    </div>

    <el-form label-width="160px" style="max-width: 560px">
      <el-form-item :label="t('settings.defaultProvider')">
        <el-select v-model="selectedProviderId" filterable style="width: 100%" @change="onProviderChange">
          <el-option v-for="p in providers" :key="p.id" :label="p.name" :value="p.id">
            <span style="display:flex;align-items:center;gap:8px">
              <img :src="getClientLogo(p.clientId)" style="width:18px;height:18px" />
              <span>{{ p.name }}</span>
              <el-tag size="small" type="info">{{ p.protocol?.toUpperCase() }}</el-tag>
            </span>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item :label="t('settings.defaultModel')" v-if="selectedProvider">
        <el-select v-model="selectedModel" filterable allow-create default-first-option style="width: 100%">
          <el-option v-for="m in selectedProvider.models" :key="m" :label="m" :value="m" />
        </el-select>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useProviderStore } from "@/stores/provider";
import { useSettingsStore } from "@/stores/settings";
import { MCP_CLIENTS } from "@/utils/mcp-config";

const { t } = useI18n();
const providerStore = useProviderStore();
const settings = useSettingsStore();

const providers = computed(() => providerStore.providers.filter((p) => p.isActive));
const selectedProviderId = ref(settings.state.defaultProvider || "");
const selectedModel = ref(settings.state.defaultModel || "");

const selectedProvider = computed(() => providers.value.find((p) => p.id === selectedProviderId.value));

watch(selectedProviderId, (val) => { settings.updateSettings({ defaultProvider: val }); });
watch(selectedModel, (val) => { settings.updateSettings({ defaultModel: val }); });

function getClientLogo(clientId?: string): string {
  return MCP_CLIENTS.find(c => c.id === clientId)?.logo || MCP_CLIENTS[0].logo;
}

function onProviderChange(id: string) {
  const p = providers.value.find((x) => x.id === id);
  if (p && p.models.length && !p.models.includes(selectedModel.value)) {
    selectedModel.value = p.models[0];
  }
}
</script>