<template>
  <div class="page-card">
    <div class="page-header">
      <h2>{{ t("settings.general") }}</h2>
    </div>

    <el-form label-width="160px" style="max-width: 560px">
      <el-form-item :label="t('settings.appName')">
        <el-input v-model="settings.state.appName" />
      </el-form-item>
      <el-form-item :label="t('settings.dataDir') || 'Data Directory'">
        <div class="dir-picker">
          <el-input v-model="settings.state.dataDir" placeholder="Default: ~/.local/share/mcp-manager" readonly />
          <el-button @click="selectDataDir" icon="FolderOpened">{{ t("common.browse") || "Browse" }}</el-button>
        </div>
      </el-form-item>
    </el-form>

    <el-divider />

    <!-- Web Server Section -->
    <div class="section-header">
      <h3>{{ t("settings.webServer") || "Web Server" }}</h3>
      <p class="section-desc">
        {{ t("settings.webServerDesc") || "HTTP server for browser access to data and system functions." }}
      </p>
    </div>

    <el-form label-width="160px" style="max-width: 560px">
      <!-- Desktop: auto-start toggle -->
      <el-form-item v-if="isDesktop" :label="t('settings.webAutoStart') || 'Auto-start on launch'">
        <el-switch v-model="settings.state.webAutoStart" />
      </el-form-item>

      <!-- Desktop: port control -->
      <el-form-item v-if="isDesktop" :label="t('settings.webServerPort') || 'Port'">
        <el-input-number
          v-model="settings.state.webServerPort"
          :min="1024"
          :max="65535"
          style="width: 160px"
        />
      </el-form-item>

      <!-- Web mode: readonly port info -->
      <el-form-item v-else :label="t('settings.webServerPort') || 'Port'">
        <span class="readonly-value">{{ settings.state.webServerPort }}</span>
        <span class="web-hint">{{ t("settings.webPortHint") || "Configure port in desktop app settings" }}</span>
      </el-form-item>

      <!-- API 端口 -->
      <el-form-item label="API 端口">
        <el-input-number v-model="apiPort" :min="1" :max="65535" style="width: 160px" @change="updateApiPort" />
      </el-form-item>

      <!-- Status -->
      <el-form-item>
        <template #label>
          <span>{{ t("settings.webServerStatus") || "Status" }}</span>
        </template>
        <div class="server-status">
          <el-tag :type="serverRunning ? 'success' : 'danger'" size="small">
            {{ serverRunning ? (t("common.running") || "Running") : (t("common.stopped") || "Stopped") }}
          </el-tag>
          <span v-if="serverRunning" class="server-url">
            http://localhost:{{ settings.state.webServerPort }}
          </span>
          <el-button
            v-if="serverRunning"
            size="small"
            type="danger"
            @click="stopServer"
            style="margin-left: 12px"
          >
            {{ t("settings.stopServer") || "Stop" }}
          </el-button>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { useSettingsStore } from "@/stores/settings";
import { webServerStatus, webServerStop } from "@/services";

const { t } = useI18n();
const settings = useSettingsStore();

const isDesktop = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
const serverRunning = ref(false);
const apiPort = ref(Number(settings.state.apiPort) || 8080);
let statusTimer: ReturnType<typeof setInterval> | null = null;

function updateApiPort(val: number) {
  settings.state.apiPort = String(val || 8080);
}

function selectDataDir() {
  const input = document.createElement("input");
  input.type = "file";
  (input as any).webkitdirectory = true;
  (input as any).nwdirectory = true;
  input.onchange = () => {
    if (input.files?.length) {
      settings.state.dataDir = input.files[0].path || input.files[0].webkitRelativePath.split("/")[0];
    }
  };
  input.click();
}

async function checkServerStatus() {
  serverRunning.value = await webServerStatus();
}

async function stopServer() {
  try {
    await webServerStop();
    serverRunning.value = false;
    ElMessage.success("Web server stopped");
  } catch (e: any) {
    ElMessage.error(`Failed to stop web server: ${e}`);
  }
}

onMounted(async () => {
  checkServerStatus();
  statusTimer = setInterval(checkServerStatus, 5000);
});

onUnmounted(() => {
  if (statusTimer) clearInterval(statusTimer);
});
</script>

<style scoped>
.section-header {
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0 0 4px;
  font-size: 16px;
}

.section-desc {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.server-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dir-picker {
  display: flex;
  gap: 8px;
  width: 100%;
}
.dir-picker .el-input { flex: 1; }

.server-url {
  font-size: 12px;
  color: var(--el-color-primary);
  font-family: monospace;
}
</style>