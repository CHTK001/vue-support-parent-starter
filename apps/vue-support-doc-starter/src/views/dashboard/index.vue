<template>
  <div class="page-card">
    <div class="page-header">
      <h2>{{ t("menu.dashboard") }}</h2>
    </div>
    <el-row :gutter="16">
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>{{ t("dashboard.totalServers") }}</template>
          <div class="stat-number">{{ mcpStore.totalCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>{{ t("dashboard.selected") }}</template>
          <div class="stat-number">{{ mcpStore.selectedCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>{{ t("dashboard.imported") }}</template>
          <div class="stat-number">0</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>{{ t("dashboard.clients") }}</template>
          <div class="stat-number">{{ MCP_CLIENTS.length }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>{{ t("menu.skills") }}</template>
          <div class="stat-number">{{ skillsStore.totalCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>{{ t('clients.defaultClient') }}</template>
          <div class="default-client" v-if="defaultClient">
            <img :src="defaultClient.logo" class="default-client-logo" @error="($event.target as HTMLImageElement).style.display='none'" />
            <span>{{ defaultClient.name }}</span>
          </div>
          <div class="stat-text" v-else>{{ t('common.noData') }}</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useMcpStore } from "@/stores/mcp";
import { useSkillsStore } from "@/stores/skills";
import { useSettingsStore } from "@/stores/settings";
import { MCP_CLIENTS } from "@/utils/mcp-config";

const { t } = useI18n();
const mcpStore = useMcpStore();
const skillsStore = useSkillsStore();
const settings = useSettingsStore();

const defaultClient = computed(() => {
  return MCP_CLIENTS.find((c) => c.id === settings.state.defaultClient) || null;
});
</script>

<style scoped>
.stat-number {
  font-size: 32px;
  font-weight: 600;
  color: var(--el-color-primary);
  text-align: center;
  padding: 10px 0;
}

.stat-text {
  font-size: 18px;
  text-align: center;
  padding: 10px 0;
}

.default-client {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 0;
  font-size: 18px;
  font-weight: 500;
}

.default-client-logo {
  width: 24px;
  height: 24px;
  object-fit: contain;
  border-radius: 4px;
}
</style>
