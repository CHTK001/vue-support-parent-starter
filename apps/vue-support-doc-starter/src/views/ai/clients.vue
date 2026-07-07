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
.client-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 12px; margin-top: 16px; }

/* ── Client Card ── */
.client-card {
  position: relative;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: var(--card-radius);
  padding: 16px 16px 16px 20px;
  transition: all 0.2s;
  overflow: hidden;
}
.client-card::before {
  content: ""; position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px; background: var(--el-border-color); border-radius: 0 2px 2px 0;
  transition: background 0.2s;
}
.client-card.installed {
  border-color: var(--el-color-success-light-5);
}
.client-card.installed::before {
  background: var(--nexus-stripe-emerald);
}
.client-card:hover { box-shadow: var(--shadow-sm); }

.card-top { display: flex; align-items: center; gap: 12px; }
.card-logo { width: 36px; height: 36px; object-fit: contain; flex-shrink: 0; border-radius: 8px; background: var(--el-fill-color); padding: 3px; }
.card-info { flex: 1; min-width: 0; }
.card-name { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
.card-path {
  font-size: 11px; color: var(--el-text-color-secondary);
  font-family: var(--nexus-data-font);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-top: 3px; background: var(--el-fill-color); padding: 2px 8px;
  border-radius: 4px; display: inline-block; max-width: 100%;
}
.card-bottom {
  display: flex; gap: 20px; margin-top: 12px; padding-top: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
  font-size: 12px; color: var(--el-text-color-secondary);
}
.card-stat { font-weight: 500; }
.card-hint { font-size: 12px; color: var(--el-text-color-placeholder); font-style: italic; }
</style>
