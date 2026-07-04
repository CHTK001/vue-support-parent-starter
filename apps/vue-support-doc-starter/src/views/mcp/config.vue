<template>
  <div class="page-card">
    <div class="page-header">
      <h2>{{ t("menu.mcpConfig") }}</h2>
      <div class="page-header-actions">
        <el-button type="primary" @click="saveConfig">
          <el-icon><Check /></el-icon> {{ t("common.save") }}
        </el-button>
      </div>
    </div>
    <el-input
      v-model="configContent"
      type="textarea"
      :rows="30"
      :placeholder="t('mcp.noServers')"
      style="font-family: monospace"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { useMcpStore } from "@/stores/mcp";

const { t } = useI18n();
const store = useMcpStore();
const configContent = ref(store.mcpJsonOutput);

function saveConfig() {
  try {
    JSON.parse(configContent.value);
    ElMessage.success(t("common.save"));
  } catch {
    ElMessage.error(t("mcp.invalidJson"));
  }
}
</script>
