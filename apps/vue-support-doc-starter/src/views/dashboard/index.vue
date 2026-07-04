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
          <div class="stat-number">6</div>
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
          <template #header>Default Client</template>
          <div class="stat-text">{{ defaultClientName }}</div>
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

const defaultClientName = computed(() => {
  const client = MCP_CLIENTS.find((c) => c.id === settings.state.defaultClient);
  return client ? `${client.icon} ${client.name}` : "None";
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
</style>
