<template>
  <div class="page-card">
    <div class="page-header">
      <h2>{{ t("menu.clientManage") }}</h2>
      <el-button type="primary" @click="scanAll" :loading="scanning">
        <el-icon><Refresh /></el-icon> {{ t("ai.scanClients") }}
      </el-button>
    </div>

    <div class="client-cards">
      <div v-for="client in clients" :key="client.id" :class="['client-card', { installed: client.installed }]">
        <div class="card-top">
          <img :src="client.logo" class="card-logo" @error="($event.target as HTMLImageElement).style.display='none'" />
          <div class="card-info">
            <div class="card-name">{{ client.name }}</div>
            <div class="card-path" :title="client.homeDir">{{ client.homeDir }}</div>
          </div>
          <el-tag :type="client.installed ? 'success' : 'info'" size="small" effect="dark">
            {{ client.installed ? t("ai.installed") : t("ai.notDetected") }}
          </el-tag>
        </div>
        <div class="card-bottom" v-if="client.installed">
          <span class="card-stat">MCP: {{ client.mcpCount }} {{ t("ai.servers") }}</span>
          <span class="card-stat">Skills: {{ client.skillCount }}</span>
        </div>
        <div class="card-bottom" v-else>
          <span class="card-hint">{{ t("ai.notDetectedHint") }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { Refresh } from "@element-plus/icons-vue";
import { detectInstalledClients, type DetectedClient } from "@/services";

const { t } = useI18n();
const scanning = ref(false);
const clients = ref<DetectedClient[]>([]);

async function scanAll() {
  scanning.value = true;
  clients.value = await detectInstalledClients();
  scanning.value = false;
}

onMounted(() => scanAll());
</script>

<style scoped>
.client-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; margin-top: 16px; }
.client-card { background: #fff; border: 1px solid var(--el-border-color-lighter); border-radius: 10px; padding: 18px; transition: all 0.2s; }
.client-card.installed { border-color: var(--el-color-success-light-5); background: linear-gradient(135deg, #f0fdf4, #fff); }
.client-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-1px); }
.card-top { display: flex; align-items: center; gap: 14px; }
.card-logo { width: 44px; height: 44px; object-fit: contain; flex-shrink: 0; border-radius: 8px; background: var(--el-fill-color-lighter); padding: 4px; }
.card-info { flex: 1; min-width: 0; }
.card-name { font-size: 15px; font-weight: 600; color: var(--el-text-color-primary); }
.card-path { font-size: 11px; color: var(--el-text-color-secondary); font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 3px; background: var(--el-fill-color-lighter); padding: 2px 8px; border-radius: 4px; display: inline-block; max-width: 100%; }
.card-bottom { display: flex; gap: 20px; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--el-border-color-lighter); font-size: 13px; color: var(--el-text-color-secondary); }
.card-stat { font-weight: 500; }
.card-hint { font-size: 12px; color: var(--el-text-color-placeholder); font-style: italic; }
</style>
