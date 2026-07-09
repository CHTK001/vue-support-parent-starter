<template>
  <div class="page-card">
    <BackButton to="/dashboard" />

    <div class="page-header">
      <h2>{{ t("settings.general") }}</h2>
    </div>

    <CardNav :items="settingsNav" />

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
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";

import { ElMessage } from "element-plus";
import { useSettingsStore } from "@/stores/settings";
import { webServerStatus, webServerStop } from "@/services";

interface NavItem { name: string; desc: string; path: string; icon: string; }

const { t } = useI18n();
const settings = useSettingsStore();

const navIcons = {
  general: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
  sync: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>',
  clients: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
  mcpskills: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
};

const settingsNav = computed<NavItem[]>(() => [
  { name: t('menu.settingsGeneral'), desc: '通用设置', path: '/settings/general', icon: navIcons.general },
  { name: t('menu.settingsSync'), desc: '同步配置', path: '/settings/sync', icon: navIcons.sync },
  { name: t('menu.settingsClients'), desc: '客户端管理', path: '/settings/clients', icon: navIcons.clients },
  { name: 'MCP / Skills', desc: 'MCP 与 Skills 配置', path: '/settings/mcpskills', icon: navIcons.mcpskills },
]);

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
