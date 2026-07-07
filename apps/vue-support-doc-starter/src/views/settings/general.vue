<template>
  <div class="page-card">
    <div class="page-header">
      <h2>{{ t("settings.general") }}</h2>
    </div>

    <div class="settings-grid">
      <div class="setting-section">
        <div class="section-head">
          <div class="section-icon app-icon">A</div>
          <div>
            <h3>基础设置</h3>
            <p class="section-desc">应用名称与数据目录</p>
          </div>
        </div>
        <div class="form-compact">
          <div class="field-row">
            <span class="field-label">{{ t('settings.appName') }}</span>
            <el-input v-model="settings.state.appName" style="width:240px" />
          </div>
          <div class="field-row">
            <span class="field-label">数据目录</span>
            <div class="dir-picker">
              <el-input v-model="settings.state.dataDir" placeholder="~/.local/share/mcp-manager" readonly />
              <el-button size="small" @click="selectDataDir">浏览</el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="setting-section">
        <div class="section-head">
          <div class="section-icon server-icon">W</div>
          <div>
            <h3>Web 服务</h3>
            <p class="section-desc">HTTP 服务配置与状态</p>
          </div>
        </div>
        <div class="form-compact">
          <div class="field-row">
            <span class="field-label">端口</span>
            <el-input-number v-model="settings.state.webServerPort" :min="1024" :max="65535" style="width:160px" size="small" />
          </div>
          <div class="field-row">
            <span class="field-label">API 端口</span>
            <el-input-number v-model="apiPort" :min="1" :max="65535" style="width:160px" size="small" @change="updateApiPort" />
          </div>
          <div class="field-row">
            <span class="field-label">状态</span>
            <div class="status-group">
              <el-tag :type="serverRunning ? 'success' : 'danger'" size="small">
                {{ serverRunning ? '运行中' : '已停止' }}
              </el-tag>
              <span v-if="serverRunning" class="server-url">http://localhost:{{ settings.state.webServerPort }}</span>
              <el-button v-if="serverRunning" size="small" type="danger" plain @click="stopServer">停止</el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="setting-section">
        <div class="section-head">
          <div class="section-icon token-icon">T</div>
          <div>
            <h3>Token 显示</h3>
            <p class="section-desc">用量统计的数字换算方式</p>
          </div>
        </div>
        <div class="form-compact">
          <div class="field-row">
            <span class="field-label">换算方式</span>
            <el-select v-model="settings.state.tokenDisplay" style="width:200px" size="small">
              <el-option label="自动 (K/M/B/T)" value="auto" />
              <el-option label="原始数字" value="raw" />
              <el-option label="千 (K)" value="k" />
              <el-option label="百万 (M)" value="m" />
              <el-option label="十亿 (B)" value="b" />
            </el-select>
          </div>
        </div>
      </div>
    </div>
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
  input.onchange = () => {
    if (input.files?.length) {
      settings.state.dataDir = input.files[0].path || input.files[0].webkitRelativePath.split("/")[0];
    }
  };
  input.click();
}

async function checkServerStatus() { serverRunning.value = await webServerStatus(); }

async function stopServer() {
  try { await webServerStop(); serverRunning.value = false; ElMessage.success("Web server stopped"); }
  catch { ElMessage.error("Failed to stop"); }
}

onMounted(async () => { checkServerStatus(); statusTimer = setInterval(checkServerStatus, 5000); });
onUnmounted(() => { if (statusTimer) clearInterval(statusTimer); });
</script>

<style scoped>
.settings-grid { display: flex; flex-direction: column; gap: 20px; }
.setting-section { background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter); border-radius: 12px; padding: 20px; }
.section-head { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
.section-head h3 { margin: 0; font-size: 15px; font-weight: 600; }
.section-desc { font-size: 12px; color: var(--el-text-color-secondary); margin: 2px 0 0; }
.section-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: #fff; flex-shrink: 0; }
.app-icon { background: linear-gradient(135deg, #667eea, #764ba2); }
.server-icon { background: linear-gradient(135deg, #4facfe, #00f2fe); }
.token-icon { background: linear-gradient(135deg, #f093fb, #f5576c); }
.form-compact { display: flex; flex-direction: column; gap: 12px; }
.field-row { display: flex; align-items: center; gap: 16px; }
.field-label { font-size: 13px; color: var(--el-text-color-secondary); min-width: 80px; }
.dir-picker { display: flex; gap: 8px; flex: 1; }
.dir-picker .el-input { flex: 1; }
.status-group { display: flex; align-items: center; gap: 8px; }
.server-url { font-size: 12px; color: var(--el-color-primary); font-family: monospace; }
</style>
