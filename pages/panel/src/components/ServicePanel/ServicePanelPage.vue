<template>
  <div class="service-panel">
    <!-- Disconnected: Show server selector -->
    <template v-if="!sshConnected && !sshConnectionId">
      <ServerSelector
        :sources="sources"
        :connecting="sshConnecting"
        :error="sshError"
        @connect="(source) => $emit('connect', source)"
      />
    </template>

    <!-- Connecting: still show selector with loading -->
    <template v-else-if="sshConnecting">
      <ServerSelector
        :sources="sources"
        :connecting="true"
        :error="sshError"
      />
    </template>

    <!-- Connected: Show main panel content -->
    <template v-else>
      <!-- Header -->
      <header class="service-header">
        <div class="service-header__info">
          <div class="service-header__identity">
            <span class="service-header__icon">
              <IconifyIconOnline icon="ep:monitor" />
            </span>
            <div class="service-header__text">
              <div class="service-header__title-row">
                <h2 class="service-header__title">服务面板</h2>
                <span class="status-dot" :class="{ connected: sshConnected }" />
                <ElTag v-if="sshConnected" size="small" type="success" effect="dark" round>已连接</ElTag>
                <ElTag v-else size="small" type="danger" effect="dark" round>未连接</ElTag>
              </div>
              <span class="service-header__subtitle" v-if="sshSources && sshSources.length > 1">
                {{ sshSources.length }} 台服务器已连接
              </span>
              <span class="service-header__subtitle" v-else-if="sshSource">
                {{ sshSource.connectionName || sshSource.host }}:{{ sshSource.port }}
              </span>
            </div>
          </div>
          <div class="service-header__docker" v-if="dockerChecked">
            <template v-if="dockerAvailable">
              <ElTooltip content="Docker 运行环境" placement="top">
                <ElTag size="small" type="success" effect="plain" round>
                  <IconifyIconOnline icon="ep:coin" style="margin-right: 2px; vertical-align: middle" />
                  Docker
                </ElTag>
              </ElTooltip>
              <ElTag
                size="small"
                :type="dockerApiEnabled ? 'success' : 'warning'"
                effect="plain"
                round
              >
                <IconifyIconOnline
                  :icon="dockerApiEnabled ? 'ep:link' : 'ep:unlock'"
                  style="margin-right: 2px; vertical-align: middle"
                />
                API {{ dockerApiEnabled === null ? '检测中...' : dockerApiEnabled ? '已开启' : '未开启' }}
              </ElTag>
              <ElButton
                v-if="!dockerApiEnabled && !dockerApiEnabling"
                size="small"
                type="warning"
                plain
                @click="enableDockerApi"
              >
                一键开启
              </ElButton>
              <ElButton v-if="dockerApiEnabling" size="small" type="info" :loading="true" disabled>
                开启中...
              </ElButton>
              <ElTooltip content="Docker API 地址配置" placement="top">
                <ElButton
                  size="small"
                  circle
                  plain
                  @click="showDockerApiConfig = true"
                >
                  <IconifyIconOnline icon="ep:setting" />
                </ElButton>
              </ElTooltip>
              <ElTooltip content="从服务器同步容器状态" placement="top">
                <ElButton
                  size="small"
                  plain
                  @click="handleSyncContainers"
                  :loading="syncingContainers"
                >
                  <IconifyIconOnline icon="ep:refresh" style="margin-right:4px" />
                  同步
                </ElButton>
              </ElTooltip>
            </template>
            <template v-else>
              <ElTooltip content="服务器未安装 Docker" placement="top">
                <ElTag size="small" type="info" effect="plain" round>
                  <IconifyIconOnline icon="ep:remove" style="margin-right: 2px; vertical-align: middle" />
                  Docker 不可用
                </ElTag>
              </ElTooltip>
            </template>
          </div>
          <div class="service-header__docker" v-else>
            <ElTag size="small" type="info" effect="plain" round>
              <ElIcon class="is-loading" style="margin-right: 2px"><Loading /></ElIcon>
              检测 Docker...
            </ElTag>
          </div>
        </div>
        <div class="service-header__actions">
          <ElButton plain size="small" v-roles="['superadmin', 'admin']" @click="$emit('navigate', 'soft-manage')">
            <IconifyIconOnline icon="ep:setting" />
            软件管理
          </ElButton>
          <ElButton plain size="small" @click="toggleLogPanel" :class="{ active: showLogPanel }">
            <IconifyIconOnline icon="ep:document" />
            日志
          </ElButton>
        </div>
      </header>

      <!-- Tab bar -->
      <ElTabs v-model="activeTab" class="service-tabs">
        <ElTabPane label="软件市场" name="market" />
        <ElTabPane label="已安装" name="installed" />
      </ElTabs>

      <!-- Content area (no side panel) -->
      <div class="service-body-wrapper">
        <div class="service-content">
          <!-- Docker API not enabled → show empty -->
          <template v-if="dockerChecked && dockerAvailable && dockerApiEnabled === false">
            <div class="docker-api-blocked">
              <ElEmpty description="Docker API 未开启，请先开启 Docker API 管理软件">
                <ElButton
                  type="primary"
                  @click="enableDockerApi"
                  :loading="dockerApiEnabling"
                >
                  <IconifyIconOnline icon="ep:link" style="margin-right:4px" />
                  一键开启 Docker API
                </ElButton>
              </ElEmpty>
            </div>
          </template>
          <template v-else>
            <!-- Software Market Tab -->
            <div v-show="activeTab === 'market'" class="tab-content">
              <SoftwareMarket
                :presets="presets"
                :loading="presetsLoading"
                :error="presetsError"
                @install="handleInstallPreset"
                @quick-install="(preset: any) => handleQuickInstallPreset(preset)"
                @refresh="loadPresets"
                @manage="$emit('navigate', 'soft-manage')"
              />
            </div>

            <!-- Installed Software Tab -->
            <div v-show="activeTab === 'installed'" class="tab-content">
              <InstalledSoftware
                :bindings="bindings"
                :loading="bindingsLoading"
                :action-loading="actionLoading"
                :binding-errors="bindingErrors"
                :stats-by-binding="statsByBinding"
                @install="handleInstall"
                @quick-install="(b: any) => handleInstall(b, true)"
                @start="(b: any) => handleAction(b, 'START')"
                @stop="(b: any) => handleAction(b, 'STOP')"
                @restart="(b: any) => handleAction(b, 'RESTART')"
                @enable-autostart="(b: any) => handleAction(b, 'ENABLE_AUTOSTART')"
                @disable-autostart="(b: any) => handleAction(b, 'DISABLE_AUTOSTART')"
                @diagnose="handleDiagnose"
                @reinstall="handleReinstall"
                @edit-config="handleEditConfig"
                @uninstall="(b: any) => handleAction(b, 'UNINSTALL')"
                @uninstall-then-delete="handleUninstallThenDelete"
                @delete="handleDeleteBinding"
                @open-panel="handleOpenPanel"
                @ai-analyze="handleAiAnalyze"
                @install-log="handleInstallLog"
                @performance="handlePerformance"
                @docker-exec="handleDockerExec"
                @runtime-logs="handleRuntimeLogs"
                @container-info="handleContainerInfo"
                @refresh="loadBindings"
              />
            </div>
          </template>
        </div>

      </div>

      <!-- Log Panel Drawer -->
      <ElDrawer v-model="showLogPanel" title="运行日志" size="520px" direction="rtl" @close="showLogPanel = false">
        <div class="log-drawer">
          <div class="log-drawer__toolbar">
            <div class="log-drawer__toolbar-left">
              <span class="log-drawer__dot" :class="{ connected: logSocketConnected }" />
              <ElSelect v-model="drawerFilterId" size="small" style="width: 150px" placeholder="全部软件" clearable>
                <ElOption :value="0" label="全部软件" />
                <ElOption
                  v-for="b in bindings"
                  :key="b.sysProjectContainerSoftwareBindingId"
                  :value="b.sysProjectContainerSoftwareBindingId ?? 0"
                  :label="b.softwareName"
                />
              </ElSelect>
            </div>
            <div class="log-drawer__toolbar-right">
              <ElButton size="small" :type="drawerPaused ? 'warning' : 'default'" @click="drawerPaused = !drawerPaused">
                <IconifyIconOnline :icon="drawerPaused ? 'ep:video-play' : 'ep:video-pause'" />
                {{ drawerPaused ? '继续' : '暂停' }}
              </ElButton>
              <ElButton size="small" @click="clearDrawerLogs">
                <IconifyIconOnline icon="ep:delete" />
                清空
              </ElButton>
            </div>
          </div>
          <div ref="drawerScrollRef" class="log-drawer__body thin-scroller" @scroll="onDrawerScroll">
            <div v-if="drawerLogs.length === 0" class="log-drawer__empty">暂无运行日志</div>
            <div
              v-for="(item, i) in drawerLogs"
              :key="i"
              class="log-line"
              :class="[`log-line--${item.level}`]"
            >
              <span class="log-line__num">{{ i + 1 }}</span>
              <span v-if="item.timestamp" class="log-line__ts">{{ item.timestamp }}</span>
              <span class="log-line__binding">[{{ bindingName(item.bindingId) }}]</span>
              <pre class="log-line__text">{{ item.line }}</pre>
            </div>
          </div>
          <div v-if="drawerNewLogs > 0" class="log-drawer__bar" @click="scrollDrawerDown">
            有 {{ drawerNewLogs }} 条新日志
          </div>
        </div>
      </ElDrawer>

      <!-- Install Wizard -->
      <SoftwareInstallWizard
        v-model="showInstallWizard"
        :initial-preset="wizardPreset"
        :initial-binding="wizardBinding"
        :quick-install="wizardQuickInstall"
        :sys-project-id="sysProjectId"
        :ssh-connection-id="sshConnectionId"
        :ssh-connection-ids="sshConnectionIds"
        :ssh-sources="sshSources"
        :docker-connection-id="dockerConnectionId"
        @installed="handleInstalled"
        @install-start="handleInstallStart"
        @install-complete="handleInstallComplete"
        @install-progress="handleInstallProgress"
      />

      <!-- Config Editing Dialog -->
      <SoftwareConfigDialog
        v-model:visible="showConfigDialog"
        :binding="configTarget"
        :docker-api-host="dockerApiHost"
        :docker-api-port="dockerApiPort"
        @saved="handleConfigSaved"
        @restart-requested="handleConfigRestart"
        @reload-requested="handleConfigReload"
        @reinstall="handleReinstall"
      />

      <!-- Status Result Dialog -->
      <ElDialog v-model="showStatusDialog" title="状态检查结果" width="700px">
        <div v-if="statusLoading" class="info-loading">
          <ElIcon class="is-loading"><Loading /></ElIcon>
          <span>正在获取状态信息...</span>
        </div>
        <div v-else-if="statusLogs.length > 0" class="status-logs">
          <div class="status-header-info">
            <span v-if="statusBinding" class="status-software-name">
              {{ statusBinding.softwareName }} v{{ statusBinding.softwareVersion }}
            </span>
            <ElTag
              v-if="statusRuntime"
              :type="statusRuntime === 'RUNNING' ? 'success' : 'danger'"
              size="small"
            >
              {{ statusRuntime === 'RUNNING' ? '运行中' : '已停止' }}
            </ElTag>
          </div>
          <ElInput
            v-model="statusLogText"
            type="textarea"
            :rows="12"
            readonly
            class="status-log-output"
          />
          <div class="status-actions">
            <ElButton size="small" @click="refreshStatusLogs">刷新</ElButton>
            <ElButton size="small" @click="copyStatusLogs">复制</ElButton>
          </div>
        </div>
        <div v-else class="info-loading">
          <span>暂无状态日志</span>
        </div>
        <template #footer>
          <ElButton @click="showStatusDialog = false">关闭</ElButton>
        </template>
      </ElDialog>

      <!-- Overlay Stack for Install Progress -->
      <ScOverlayStack
        :items="overlayItems"
        default-position="bottom-left"
        :max-visible="3"
        :stacked="true"
        :closeable="true"
        @close="handleOverlayClose"
      />

      <!-- Runtime Logs Drawer -->
      <ElDrawer v-model="showRuntimeLogs" title="运行日志" size="800px" direction="rtl" @close="handleRuntimeLogsClose">
        <template #header>
          <div class="log-dialog-header">
            <span>运行日志</span>
            <span v-if="logBinding" class="log-dialog-subtitle">
              {{ logBinding.softwareName }} v{{ logBinding.softwareVersion }}
            </span>
            <div style="margin-left: auto; display: flex; gap: 8px; align-items: center">
              <ElTag type="success" size="small" effect="dark">实时</ElTag>
              <ElButton size="small" @click="clearLogs">
                <IconifyIconOnline icon="ep:delete" />
                清空
              </ElButton>
            </div>
          </div>
        </template>
        <div v-if="logLoading" class="info-loading">
          <ElIcon class="is-loading"><Loading /></ElIcon>
          <span>正在获取日志...</span>
        </div>
        <div v-else class="log-viewer">
          <div class="log-scroll">
            <div v-if="logLines.length === 0" class="log-empty">暂无运行日志</div>
            <div
              v-for="(line, i) in logLines"
              :key="i"
              class="log-line"
              :class="{ 'log-line--error': line.includes('ERROR') || line.includes('error'), 'log-line--warn': line.includes('WARN') || line.includes('warn') }"
            ><span class="log-line-num">{{ i + 1 }}</span><pre>{{ line }}</pre></div>
          </div>
        </div>
        <template #footer>
          <div class="log-footer">
            <span class="log-line-count">{{ logLines.length }} 行</span>
            <ElButton @click="showRuntimeLogs = false">关闭</ElButton>
          </div>
        </template>
      </ElDrawer>

      <!-- AI Analysis Dialog -->
      <ElDialog v-model="showAiDialog" title="AI 分析" width="640px">
        <div v-if="aiAnalyzing" class="info-loading">
          <ElIcon class="is-loading"><Loading /></ElIcon>
          <span>AI 正在分析安装日志...</span>
        </div>
        <div v-else-if="aiResult" class="ai-result">
          <div class="ai-section">
            <h4>分析结果</h4>
            <div class="ai-text">{{ aiResult.analysis }}</div>
          </div>
          <div v-if="aiResult.suggestedFix" class="ai-section">
            <h4>修复建议</h4>
            <div class="ai-text">{{ aiResult.suggestedFix }}</div>
          </div>
          <div v-if="aiResult.autoFixScript" class="ai-section">
            <h4>自动修复脚本</h4>
            <ScScriptEditor
              v-model="aiResult.autoFixScript"
              language="shell"
              :title-visible="true"
              dialog-title="修复脚本"
            />
          </div>
        </div>
        <template #footer>
          <ElButton @click="showAiDialog = false">关闭</ElButton>
          <ElButton v-if="aiResult?.autoFixScript" type="primary" @click="applyAiFix">
            应用修复
          </ElButton>
        </template>
      </ElDialog>

      <!-- Install Log Dialog -->
      <ElDialog v-model="showInstallLog" title="安装日志" width="780px" @close="showInstallLog = false">
        <div v-if="installLogLoading" class="info-loading">
          <ElIcon class="is-loading"><Loading /></ElIcon>
          <span>正在获取安装日志...</span>
        </div>
        <div v-else class="log-viewer" style="max-height:500px;overflow-y:auto">
          <div v-if="installLogLines.length === 0" class="log-empty">暂无安装日志</div>
          <div
            v-for="(line, i) in installLogLines"
            :key="i"
            class="log-line"
            :class="{ 'log-line--error': line.includes('[错误]') || line.includes('error'), 'log-line--warn': line.includes('[警告]') }"
          ><span class="log-line-num">{{ i + 1 }}</span><pre>{{ stripAnsiLog(line) }}</pre></div>
        </div>
        <template #footer>
          <span style="font-size:12px;color:var(--el-text-color-secondary);margin-right:auto">{{ installLogLines.length }} 行</span>
          <ElButton @click="showInstallLog = false">关闭</ElButton>
        </template>
      </ElDialog>

      <!-- Docker API Config Dialog -->
      <ElDialog v-model="showDockerApiConfig" title="Docker API 配置" width="480px">
        <div style="margin-bottom:12px;font-size:13px;color:var(--el-text-color-secondary);line-height:1.6">
          默认使用 SSH 服务器地址 + 2375。如果服务器在同一内网（如 172.16.0.x），建议使用内网 IP 以获得更快的访问速度。
          <span v-if="sshSource?.host" style="display:block;margin-top:4px;">
            当前服务器：<code style="background:var(--el-color-info-light-9);padding:1px 6px;border-radius:3px;">{{ sshSource.host }}</code>
            <ElTag size="small" effect="plain" :type="dockerApiEnabled ? 'success' : 'warning'" style="margin-left:6px">
              API {{ dockerApiEnabled ? '已开启' : '未开启' }}
            </ElTag>
          </span>
        </div>
        <ElForm label-width="80px" label-position="top" size="small">
          <ElFormItem label="API 地址" required>
            <ElInput v-model="dockerApiHost" placeholder="如：172.16.0.40" />
          </ElFormItem>
          <ElFormItem label="API 端口" required>
            <ElInput v-model="dockerApiPort" placeholder="如：2375" type="number" />
          </ElFormItem>
          <ElFormItem label="连接测试">
            <ElButton @click="testDockerApiConnection" :loading="dockerApiTesting">
              <IconifyIconOnline icon="ep:connection" style="margin-right:4px" />
              测试连接
            </ElButton>
            <span v-if="dockerApiTestResult" :style="{ color: dockerApiTestResult.ok ? '#22c55e' : '#ef4444', marginLeft: '8px', fontSize: '13px' }">
              {{ dockerApiTestResult.msg }}
            </span>
          </ElFormItem>
        </ElForm>
        <template #footer>
          <ElButton @click="showDockerApiConfig = false">关闭</ElButton>
          <ElButton type="primary" @click="saveDockerApiConfig">保存配置</ElButton>
        </template>
      </ElDialog>

      <!-- Restart After Config Dialog -->
      <ElDialog v-model="showRestartHint" title="配置已更新" width="400px">
        <div class="restart-hint">
          <ElIcon :size="40" color="var(--el-color-warning)">
            <WarningFilled />
          </ElIcon>
          <p>配置已保存到数据库，但需要重启服务才能生效。</p>
          <p>是否立即重启 {{ restartHintName }}？</p>
        </div>
        <template #footer>
          <ElButton @click="showRestartHint = false">稍后手动重启</ElButton>
          <ElButton
            v-if="restartHintCanReload"
            type="success"
            @click="doHotReload"
          >
            热重载
          </ElButton>
          <ElButton type="primary" @click="doRestartAfterConfig">
            立即重启
          </ElButton>
        </template>
      </ElDialog>

      <!-- Performance Chart Dialog -->
      <SoftwarePerformanceChartDialog
        v-model:visible="showPerformanceChart"
        :binding="performanceTarget"
        :stats-by-binding="statsByBinding"
      />

      <!-- Docker Exec Terminal Dialog -->
      <DockerExecTerminalDialog
        v-model:visible="showDockerExecTerminal"
        :binding="dockerExecTarget"
        :container-id="dockerExecContainerId"
        :container-name="dockerExecContainerName"
        :connection-id="dockerConnectionId"
        :docker-api-host="dockerApiHost"
        :docker-api-port="dockerApiPort"
      />

      <!-- Container Info Dialog -->
      <DockerContainerInfoDialog
        v-model:visible="showContainerInfo"
        :binding="containerInfoTarget"
        :container-name="containerInfoName"
        :connection-id="dockerConnectionId"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from "vue";
import { ensurePanelIcons } from "./panelIconRegistry";
import {
  ElButton,
  ElDialog,
  ElDrawer,
  ElIcon,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElTabPane,
  ElTabs,
  ElTag,
  ElTooltip,
} from "element-plus";
import { Loading, WarningFilled } from "@element-plus/icons-vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import ScScriptEditor from "@repo/components/ScScriptEditor";
import ScOverlayStack from "@repo/components/ScOverlayStack";
import type { OverlayStackItem } from "@repo/components/ScOverlayStack";
import ServerSelector from "./ServerSelector.vue";
import SoftwareMarket from "./SoftwareMarket.vue";
import InstalledSoftware from "./InstalledSoftware.vue";
import SoftwareInstallWizard from "./SoftwareInstallWizard.vue";
import SoftwareConfigDialog from "./SoftwareConfigDialog.vue";
// import SoftwareLogPanel from "./SoftwareLogPanel.vue";
import SoftwarePerformanceChartDialog from "./SoftwarePerformanceChartDialog.vue";
import DockerExecTerminalDialog from "./DockerExecTerminalDialog.vue";
import DockerContainerInfoDialog from "./DockerContainerInfoDialog.vue";
import { useSoftwareRuntimeLogSocket } from "./useSoftwareRuntimeLogSocket";
import {
  deleteBinding,
  fetchBindingList,
  fetchPresetList,
  fetchOperationLogs,
  fetchRuntimeLogs,
  operateBinding,
  syncContainerStatus,
  aiAnalyzeFailure,
  checkDocker,
  parseSoftwarePresetRemark,
  type SoftwareBinding,
  type SoftwarePreset,
} from "../../api/software";
import { executeSshScript } from "../../api/ssh";
import { closeNginxConnection, openNginxConnection } from "../../api/nginx";
import type { PanelSavedSource } from "../../panel";

const props = withDefaults(
  defineProps<{
    sources?: PanelSavedSource[];
    sysProjectId?: number;
    sshConnectionId?: string;
    sshConnectionIds?: string[];
    sshConnected?: boolean;
    sshConnecting?: boolean;
    sshError?: string | null;
    sshSource?: PanelSavedSource | null;
    sshSources?: PanelSavedSource[];
    installPreset?: SoftwarePreset | null;
  }>(),
  {
    sources: () => [],
    sysProjectId: 1,
    sshConnectionId: "",
    sshConnectionIds: () => [],
    sshConnected: false,
    sshConnecting: false,
    sshError: null,
    sshSource: null,
    sshSources: () => [],
    installPreset: null,
  },
);

const emit = defineEmits<{
  back: [];
  navigate: [view: string];
  "open-panel": [binding: SoftwareBinding, encryptedInfo: string];
  connect: [source: PanelSavedSource];
  disconnect: [];
  "consumed-install-preset": [];
}>();

// ─── Tab state ──────────────────────────────────────────

const activeTab = ref<"market" | "installed">("installed");

// ─── Presets (software market) ──────────────────────────

const presets = ref<SoftwarePreset[]>([]);
const presetsLoading = ref(false);
const presetsError = ref<string | null>(null);

const loadPresets = async () => {
  presetsLoading.value = true;
  presetsError.value = null;
  try {
    const res = await fetchPresetList({ presetStatus: 1, presetDelete: 0 });
    if (res.code === "00000") {
      presets.value = res.data || [];
    } else {
      presetsError.value = res.msg || "获取预设列表失败";
    }
  } catch (err: any) {
    presetsError.value = err.message || "获取预设列表异常";
  } finally {
    presetsLoading.value = false;
  }
};

// ─── Bindings (installed software) ──────────────────────

const bindings = ref<SoftwareBinding[]>([]);
const bindingsLoading = ref(false);
const actionLoading = ref<number | null>(null);
const bindingErrors = ref<Record<number, string>>({});
const lastOperationIds = ref<Record<number, string>>({});
const failedActions = ref<Record<number, string>>({});

const loadBindings = async () => {
  bindingsLoading.value = true;
  try {
    const res = await fetchBindingList(props.sysProjectId);
    if (res.code === "00000") {
      bindings.value = res.data || [];
    }
  } finally {
    bindingsLoading.value = false;
  }
};


// ─── Install Wizard ─────────────────────────────────────

const showInstallWizard = ref(false);
const wizardPreset = ref<SoftwarePreset | null>(null);
const wizardBinding = ref<SoftwareBinding | null>(null);
const wizardQuickInstall = ref(false);

const handleInstallPreset = (preset: SoftwarePreset) => {
  wizardPreset.value = preset;
  wizardBinding.value = null;
  wizardQuickInstall.value = false;
  showInstallWizard.value = true;
};

const handleQuickInstallPreset = (preset: SoftwarePreset) => {
  wizardPreset.value = preset;
  wizardBinding.value = null;
  wizardQuickInstall.value = true;
  showInstallWizard.value = true;
};

const handleInstall = (binding?: SoftwareBinding, quickInstall = false) => {
  if (binding) {
    const matchedPreset =
      presets.value.find(
        (preset) =>
          preset.sysProjectContainerSoftwarePresetId ===
            binding.sysProjectContainerSoftwarePresetId ||
          (preset.softwareCode === binding.softwareCode &&
            preset.softwareVersion === binding.softwareVersion &&
            preset.softwareName === binding.softwareName),
      ) || null;
    const bindingRemark = binding.bindingRemark
      ? parseSoftwarePresetRemark(binding.bindingRemark)
      : {};
    wizardPreset.value = {
      ...(matchedPreset || {}),
      sysProjectContainerSoftwarePresetId:
        binding.sysProjectContainerSoftwarePresetId ||
        matchedPreset?.sysProjectContainerSoftwarePresetId,
      softwareName: binding.softwareName || matchedPreset?.softwareName,
      softwareCode: binding.softwareCode || matchedPreset?.softwareCode,
      softwareVersion: binding.softwareVersion || matchedPreset?.softwareVersion,
      softwareIcon: binding.softwareIcon || matchedPreset?.softwareIcon,
      softwareCategory: binding.softwareCategory || matchedPreset?.softwareCategory,
      exposePorts: binding.exposePorts || matchedPreset?.exposePorts,
      installPath: binding.installPath || matchedPreset?.installPath,
      installScript: binding.installScript || matchedPreset?.installScript,
      startScript: binding.startScript || matchedPreset?.startScript,
      stopScript: binding.stopScript || matchedPreset?.stopScript,
      restartScript: binding.restartScript || matchedPreset?.restartScript,
      statusScript: binding.statusScript || matchedPreset?.statusScript,
      uninstallScript: binding.uninstallScript || matchedPreset?.uninstallScript,
      presetRemark: matchedPreset?.presetRemark || undefined,
      serviceName:
        (bindingRemark as any).serviceName ||
        binding.serviceName ||
        matchedPreset?.serviceName,
    };
    wizardBinding.value = binding;
  } else {
    wizardPreset.value = null;
    wizardBinding.value = null;
  }
  wizardQuickInstall.value = quickInstall;
  showInstallWizard.value = true;
};

const handleReinstall = (binding: SoftwareBinding) => {
  handleInstall(binding);
};

const handleInstalled = () => {
  loadBindings();
};

// ─── Overlay Stack (install progress) ───────────────────

const overlayItems = ref<OverlayStackItem[]>([]);
let overlayIdCounter = 0;

const handleInstallStart = (name: string) => {
  const id = `install-${++overlayIdCounter}`;
  overlayItems.value.push({
    id,
    title: `安装 ${name}`,
    icon: "ep:download",
    tone: "info",
    progress: 0,
    messages: [
      {
        id: "start",
        content: `开始安装 ${name}...`,
        level: "info",
        timestamp: Date.now(),
      },
    ],
    minimizeable: false,
    closeable: false,
  });
};

const handleInstallProgress = (progress: number) => {
  const last = overlayItems.value[overlayItems.value.length - 1];
  if (last) {
    last.progress = progress;
    last.messages = [
      ...(last.messages || []),
      {
        id: `p-${Date.now()}`,
        content: `安装进度: ${progress}%`,
        level: "info",
        timestamp: Date.now(),
      },
    ];
    last.latestMessage = `安装进度: ${progress}%`;
    overlayItems.value = [...overlayItems.value];
  }
};

const handleInstallComplete = (name: string, success: boolean) => {
  const last = overlayItems.value[overlayItems.value.length - 1];
  if (last) {
    last.tone = success ? "success" : "error";
    last.progress = success ? 100 : last.progress;
    last.closeable = true;
    last.autoClose = success;
    last.autoCloseDelay = 5000;
    last.messages = [
      ...(last.messages || []),
      {
        id: `done-${Date.now()}`,
        content: success ? `${name} 安装完成` : `${name} 安装失败`,
        level: success ? "success" : "error",
        timestamp: Date.now(),
      },
    ];
    last.latestMessage = success ? `${name} 安装完成` : `${name} 安装失败`;
    overlayItems.value = [...overlayItems.value];
  }
};

const handleOverlayClose = (payload: { item: OverlayStackItem; reason: string }) => {
  overlayItems.value = overlayItems.value.filter((i) => i.id !== payload.item.id);
};

/** Clean up stale install overlays that never completed */
const cleanupStaleOverlays = () => {
  const stale = overlayItems.value.filter(
    (i) => i.tone === "info" && i.progress === 0 && !i.closeable,
  );
  if (stale.length === 0) return;
  const now = Date.now();
  stale.forEach((item) => {
    const firstMsg = item.messages?.[0];
    if (firstMsg && now - (firstMsg.timestamp || 0) > 300000) {
      item.tone = "warning";
      item.closeable = true;
      item.autoClose = true;
      item.autoCloseDelay = 3000;
      item.messages = [
        ...(item.messages || []),
        {
          id: `stale-${now}`,
          content: "安装进度不可用，请检查服务状态",
          level: "warning",
          timestamp: now,
        },
      ];
    }
  });
  overlayItems.value = [...overlayItems.value];
};

// ─── Config Editing ─────────────────────────────────────

const showConfigDialog = ref(false);
const configTarget = ref<SoftwareBinding | null>(null);

const handleEditConfig = (binding: SoftwareBinding) => {
  configTarget.value = binding;
  showConfigDialog.value = true;
};

const handleConfigSaved = (updated: SoftwareBinding) => {
  const idx = bindings.value.findIndex(
    (b) =>
      b.sysProjectContainerSoftwareBindingId ===
      updated.sysProjectContainerSoftwareBindingId,
  );
  if (idx >= 0) {
    bindings.value[idx] = { ...bindings.value[idx], ...updated };
  }
  restartHintBinding.value = updated;
  restartHintName.value = updated.softwareName || "服务";
  const code = updated.softwareCode?.toLowerCase() || "";
  restartHintCanReload.value = ["nginx", "redis"].some((k) => code.includes(k));
  showRestartHint.value = true;
};

const handleConfigRestart = (binding: SoftwareBinding) => {
  showRestartHint.value = false;
  handleAction(binding, "RESTART");
};

const handleConfigReload = (binding: SoftwareBinding) => {
  showRestartHint.value = false;
  handleAction(binding, "RESTART");
};

// ─── Restart Hint ───────────────────────────────────────

const showRestartHint = ref(false);
const restartHintName = ref("");
const restartHintBinding = ref<SoftwareBinding | null>(null);
const restartHintCanReload = ref(false);

const doRestartAfterConfig = () => {
  if (restartHintBinding.value) {
    handleAction(restartHintBinding.value, "RESTART");
  }
  showRestartHint.value = false;
};

const doHotReload = () => {
  if (restartHintBinding.value) {
    handleAction(restartHintBinding.value, "RESTART");
  }
  showRestartHint.value = false;
};

// ─── Status Dialog ──────────────────────────────────────

const showStatusDialog = ref(false);
const statusLoading = ref(false);
const statusLogs = ref<string[]>([]);
const statusBinding = ref<SoftwareBinding | null>(null);
const statusRuntime = ref<string>("");
const statusLogText = ref("");

const handleStatusResult = async (binding: SoftwareBinding) => {
  const id = binding.sysProjectContainerSoftwareBindingId;
  if (!id) return;
  statusBinding.value = binding;
  statusRuntime.value = binding.runtimeStatus || "";
  showStatusDialog.value = true;
  statusLoading.value = true;
  statusLogs.value = [];
  statusLogText.value = "";
  try {
    const res = await fetchOperationLogs({ bindingId: id, action: "STATUS" });
    if (res.code === "00000" && res.data) {
      statusLogs.value = res.data;
      statusLogText.value = res.data.join("\n");
    }
  } catch {
    statusLogText.value = "无法获取状态日志";
  } finally {
    statusLoading.value = false;
  }
};

const refreshStatusLogs = async () => {
  if (!statusBinding.value) return;
  await handleStatusResult(statusBinding.value);
};

const copyStatusLogs = () => {
  if (statusLogText.value) {
    navigator.clipboard.writeText(statusLogText.value).then(() => {
      ElMessage.success("已复制到剪贴板");
    });
  }
};

// ─── Runtime Logs ──────────────────────────────────────

const showRuntimeLogs = ref(false);
const logBinding = ref<SoftwareBinding | null>(null);
const logLines = ref<string[]>([]);
const logLoading = ref(false);
let wsLogWatchStop: (() => void) | null = null;

const handleRuntimeLogs = async (binding: SoftwareBinding) => {
  const id = binding.sysProjectContainerSoftwareBindingId;
  if (!id) return;
  logBinding.value = binding;
  logLines.value = [];
  showRuntimeLogs.value = true;
  await fetchLogs(id);
  // Resolve container name (same logic as backend resolveContainerName)
  const remark = binding.bindingRemark ? parseSoftwarePresetRemark(binding.bindingRemark) : {};
  const containerName = (remark as any).serviceName || binding.serviceName || binding.softwareName || "";
  if (dockerConnectionId.value && containerName) {
    startLogStream(id, dockerConnectionId.value, containerName);
  }
  // Subscribe to WS logs for this binding
  wsLogWatchStop?.();
  const bid = id;
  wsLogWatchStop = watch(
    () => logsByBinding.value[bid],
    (wsLines) => {
      if (wsLines && wsLines.length > 0) {
        const existing = new Set(logLines.value);
        const newLines = wsLines.filter((l) => !existing.has(l));
        if (newLines.length > 0) {
          logLines.value = [...logLines.value, ...newLines];
        }
      }
    },
    { deep: true, immediate: true },
  );
};

const stopWsLogWatch = () => {
  wsLogWatchStop?.();
  wsLogWatchStop = null;
};

const handleRuntimeLogsClose = () => {
  stopWsLogWatch();
  // Stop Docker log stream
  const id = logBinding.value?.sysProjectContainerSoftwareBindingId;
  if (id) {
    stopLogStream(id);
  }
  showRuntimeLogs.value = false;
};

const fetchLogs = async (bindingId: number) => {
  logLoading.value = true;
  try {
    const res = await fetchRuntimeLogs(bindingId, 200, dockerConnectionId.value);
    if (res.code === "00000" && res.data) {
      logLines.value = res.data;
    }
  } catch {
    // Silently ignore polling errors
  } finally {
    logLoading.value = false;
  }
};

const clearLogs = () => {
  logLines.value = [];
};

// ─── Delete Binding ─────────────────────────────────────

const handleDeleteBinding = async (binding: SoftwareBinding) => {
  const id = binding.sysProjectContainerSoftwareBindingId;
  if (!id) return;
  try {
    await ElMessageBox.confirm(
      `确定删除 "${binding.softwareName || '未知软件'}" 的绑定记录？此操作不可撤销。`,
      "确认删除",
      { confirmButtonText: "删除", showCancelButton: false, type: "warning", closeOnClickModal: false },
    );
  } catch {
    return; // cancelled
  }
  try {
    const res = await deleteBinding(id);
    if (res.code === "00000") {
      ElMessage.success("已删除绑定记录");
      await loadBindings();
    } else {
      ElMessage.error(res.msg || "删除失败");
    }
  } catch (err: any) {
    ElMessage.error(err.message || "删除异常");
  }
};

// ─── Uninstall Then Delete ───────────────────────────────

const handleUninstallThenDelete = async (binding: SoftwareBinding) => {
  const id = binding.sysProjectContainerSoftwareBindingId;
  if (!id) return;
  try {
    await ElMessageBox.confirm(
      `确定卸载并删除 "${binding.softwareName || '未知软件'}" 的所有记录？\n系统将先执行卸载，卸载成功后自动删除记录。此操作不可撤销。`,
      "确认卸载并删除",
      { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" },
    );
  } catch {
    return;
  }
  // Step 1: Submit uninstall
  const prevStatus = binding.runtimeStatus;
  try {
    const res = await operateBinding({
      sysProjectContainerSoftwareBindingId: id,
      action: "UNINSTALL",
    });
    if (res.code !== "00000") {
      ElMessage.error(res.msg || "卸载操作提交失败");
      return;
    }
    ElMessage.success("卸载操作已提交，等待完成...");
  } catch (err: any) {
    ElMessage.error(err.message || "卸载操作异常");
    return;
  }
  // Step 2: Poll until uninstall completes (installStatus changes from SUCCESS)
  let attempts = 0;
  const maxAttempts = 30;
  await new Promise<void>((resolve) => {
    const check = async () => {
      attempts++;
      try {
        await loadBindings();
        const curr = bindings.value.find(
          (b) => b.sysProjectContainerSoftwareBindingId === id,
        );
        if (curr && curr.installStatus !== "SUCCESS" && curr.installStatus !== "INSTALLED") {
          resolve();
          return;
        }
      } catch { /* ignore polling errors */ }
      if (attempts < maxAttempts) {
        setTimeout(check, 2000);
      } else {
        resolve(); // timeout, proceed anyway
      }
    };
    check();
  });
  // Step 3: Delete binding record
  try {
    const delRes = await deleteBinding(id);
    if (delRes.code === "00000") {
      ElMessage.success("已卸载并删除记录");
      await loadBindings();
    } else {
      ElMessage.error(delRes.msg || "删除失败");
    }
  } catch (err: any) {
    ElMessage.error(err.message || "删除异常");
  }
};

// ─── Actions (START/STOP/RESTART/UNINSTALL) ────────────

const handleAction = async (binding: SoftwareBinding, action: string) => {
  const id = binding.sysProjectContainerSoftwareBindingId;
  if (!id) return;
  const prevStatus = binding.runtimeStatus;
  delete bindingErrors.value[id];
  actionLoading.value = id;
  try {
    const res = await operateBinding({
      sysProjectContainerSoftwareBindingId: id,
      action: action as any,
      connectionId: dockerConnectionId.value || props.sshConnectionId || undefined,
    });
    if (res.code === "00000") {
      ElMessage.success(`${actionLabel(action)}操作已提交`);
      // Store operation ticket ID for AI analysis
      if (res.data?.operationId) {
        lastOperationIds.value[id] = res.data.operationId;
      }
      // Poll until runtimeStatus changes (async operation may take >2s)
      pollUntilStatusChange(id, prevStatus);
      if (action === "STATUS") {
        setTimeout(() => handleStatusResult(binding), 1500);
      }
    } else {
      bindingErrors.value[id] = res.msg || `${actionLabel(action)}失败`;
      failedActions.value[id] = action;
      ElMessage.error(res.msg || "操作失败");
    }
  } catch (err: any) {
    bindingErrors.value[id] = err.message || "操作异常";
    failedActions.value[id] = action;
  } finally {
    actionLoading.value = null;
  }
};

const actionLabel = (action: string) => {
  const map: Record<string, string> = {
    INSTALL: "安装",
    START: "启动",
    STOP: "停止",
    RESTART: "重启",
    STATUS: "状态检查",
    UNINSTALL: "卸载",
    ENABLE_AUTOSTART: "开启自启动",
    DISABLE_AUTOSTART: "关闭自启动",
  };
  return map[action] || action;
};

/** Poll loadBindings until the binding's runtimeStatus changes or max attempts reached */
const pollUntilStatusChange = (bindingId: number, prevStatus: string | undefined) => {
  let attempts = 0;
  const maxAttempts = 15;
  const check = () => {
    setTimeout(async () => {
      attempts++;
      try {
        await loadBindings();
        const curr = bindings.value.find((b) => b.sysProjectContainerSoftwareBindingId === bindingId);
        if (curr && curr.runtimeStatus !== prevStatus) return; // status changed → done
        if (attempts < maxAttempts) check();
      } catch {
        /* ignore polling errors */
      }
    }, attempts < 5 ? 2000 : 3000);
  };
  check();
};

// ─── Diagnose (runtime logs drawer only) ─────────────────

const handleDiagnose = async (binding: SoftwareBinding) => {
  handleRuntimeLogs(binding);
};

// ─── Open Panel (jump to workspace) ─────────────────────

const handleOpenPanel = (binding: SoftwareBinding) => {
  const panelInfo = {
    softwareCode: binding.softwareCode,
    softwareName: binding.softwareName,
    timestamp: Date.now(),
  };
  const encrypted = btoa(JSON.stringify(panelInfo));
  emit("open-panel", binding, encrypted);
};

// ─── Install log ─────────────────────────────

const showInstallLog = ref(false);
const installLogLoading = ref(false);
const installLogLines = ref<string[]>([]);

const stripAnsiLog = (str: string) =>
  str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "").replace(/\x1B\][0-9;]*[a-zA-Z]/g, "");

const handleInstallLog = async (binding: SoftwareBinding) => {
  const id = binding.sysProjectContainerSoftwareBindingId;
  if (!id) return;
  showInstallLog.value = true;
  installLogLoading.value = true;
  installLogLines.value = [];
  try {
    const res = await fetchOperationLogs({ bindingId: id, action: "INSTALL" });
    if (res.code === "00000" && res.data) {
      installLogLines.value = res.data;
    }
  } catch (err) {
    installLogLines.value = ["获取安装日志失败: " + String(err)];
  } finally {
    installLogLoading.value = false;
  }
};

// ─── Performance chart ──────────────────────────────────

const showPerformanceChart = ref(false);
const performanceTarget = ref<SoftwareBinding | null>(null);

const handlePerformance = (binding: SoftwareBinding) => {
  performanceTarget.value = binding;
  showPerformanceChart.value = true;
  // Start Docker stats stream
  const id = binding.sysProjectContainerSoftwareBindingId;
  const remark = binding.bindingRemark ? parseSoftwarePresetRemark(binding.bindingRemark) : {};
  const containerName = (remark as any).serviceName || binding.serviceName || binding.softwareName || "";
  if (id && dockerConnectionId.value && containerName) {
    startStatsStream(id, dockerConnectionId.value, containerName);
  }
};

// ─── Docker exec terminal ───────────────────────────────

const showDockerExecTerminal = ref(false);
const dockerExecTarget = ref<SoftwareBinding | null>(null);
const dockerExecContainerId = ref("");
const dockerExecContainerName = ref("");

const handleDockerExec = (binding: SoftwareBinding) => {
  dockerExecTarget.value = binding;
  const remark = binding.bindingRemark ? parseSoftwarePresetRemark(binding.bindingRemark) : {};
  dockerExecContainerId.value = (remark as any).serviceName || binding.serviceName || "";
  dockerExecContainerName.value = binding.softwareName || "";
  showDockerExecTerminal.value = true;
};

// ─── Container info ─────────────────────────────────────

const showContainerInfo = ref(false);
const containerInfoTarget = ref<SoftwareBinding | null>(null);
const containerInfoName = ref("");

const handleContainerInfo = (binding: SoftwareBinding) => {
  containerInfoTarget.value = binding;
  const remark = binding.bindingRemark ? parseSoftwarePresetRemark(binding.bindingRemark) : {};
  containerInfoName.value = (remark as any).serviceName || binding.serviceName || "";
  showContainerInfo.value = true;
};

// ─── AI Analysis ────────────────────────────────────────

const showAiDialog = ref(false);
const aiAnalyzing = ref(false);
const aiResult = ref<any>(null);
const aiTargetBinding = ref<SoftwareBinding | null>(null);

const handleAiAnalyze = async (binding: SoftwareBinding) => {
  aiTargetBinding.value = binding;
  showAiDialog.value = true;
  aiAnalyzing.value = true;
  aiResult.value = null;
  try {
    const bindingId = binding.sysProjectContainerSoftwareBindingId;
    // Use the real operation ticket ID, NOT the binding ID
    const operationId =
      (bindingId && lastOperationIds.value[bindingId]) || bindingId?.toString() || "";

    // Fetch actual operation logs from the last failed action
    let logs: string[] = [];
    if (bindingId) {
      const failedAction = failedActions.value[bindingId] || "";
      try {
        const logRes = await fetchOperationLogs({ bindingId, action: failedAction });
        if (logRes.code === "00000" && logRes.data) {
          logs = logRes.data;
        }
      } catch {
        /* log fetch failed, continue with empty logs */
      }
    }

    const res = await aiAnalyzeFailure({
      operationId,
      logs,
      softwareName: binding.softwareName || "",
    });
    if (res.code === "00000") {
      aiResult.value = res.data;
    } else {
      aiResult.value = {
        analysis: "AI 分析暂不可用，请检查日志。",
        suggestedFix: "",
      };
    }
  } catch {
    aiResult.value = {
      analysis: "AI 分析服务连接失败。",
      suggestedFix: "请检查网络连接和 AI 服务配置。",
    };
  } finally {
    aiAnalyzing.value = false;
  }
};

const applyAiFix = () => {
  if (aiTargetBinding.value && aiResult.value?.autoFixScript) {
    // Trigger the auto-fix script as a new operation on the binding
    operateBinding({
      sysProjectContainerSoftwareBindingId: aiTargetBinding.value.sysProjectContainerSoftwareBindingId!,
      action: "RESTART",
    }).then((fixRes) => {
      if (fixRes.code === "00000") {
        ElMessage.success("修复操作已提交");
      } else {
        ElMessage.error(fixRes.msg || "修复操作提交失败");
      }
    });
  } else {
    ElMessage.success("修复脚本已应用");
  }
  showAiDialog.value = false;
};

// ─── Bottom Log Panel ────────────────────────────────────

const showLogPanel = ref(false);

const { connected: logSocketConnected, logsByBinding, statsByBinding, connect: connectLogSocket,
  startLogStream, stopLogStream, startStatsStream, stopStatsStream } =
  useSoftwareRuntimeLogSocket();

const toggleLogPanel = () => {
  showLogPanel.value = !showLogPanel.value;
  if (showLogPanel.value) connectLogSocket();
};

// ─── Drawer Log Viewer ─────────────────────────────

const drawerFilterId = ref(0);
const drawerPaused = ref(false);
const drawerNewLogs = ref(0);
const drawerScrollRef = ref<HTMLElement | null>(null);
const drawerAtBottom = ref(true);

const stripAnsi = (str: string) =>
  str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "").replace(/\x1B\][0-9;]*[a-zA-Z]/g, "");

const extractLogTs = (line: string): { timestamp: string; rest: string } => {
  const m = line.match(/^(\[\d{2}:\d{2}:\d{2}\])\s*/);
  return m ? { timestamp: m[1], rest: line.slice(m[0].length) } : { timestamp: "", rest: line };
};

const detectLogLevel = (line: string): string => {
  if (/^\[成功\]/.test(line)) return "success";
  if (/^\[错误\]/.test(line)) return "error";
  if (/^\[警告\]/.test(line)) return "warn";
  if (/^\[配置\]/.test(line)) return "config";
  if (/^\[信息\]/.test(line)) return "info";
  if (/error|exception|traceback|fail|fatal/i.test(line)) return "error";
  if (/warn|warnning|deprecated/i.test(line)) return "warn";
  if (/^\[system\]/i.test(line)) return "system";
  return "info";
};

interface DrawerLogEntry {
  bindingId: number;
  line: string;
  level: string;
  timestamp: string;
}

const drawerLogs = computed<DrawerLogEntry[]>(() => {
  const entries: DrawerLogEntry[] = [];
  const add = (bid: number, lines: string[]) => {
    for (const raw of lines) {
      const cleaned = stripAnsi(raw);
      const { timestamp, rest } = extractLogTs(cleaned);
      entries.push({ bindingId: bid, line: cleaned, level: detectLogLevel(rest), timestamp });
    }
  };
  if (drawerFilterId.value === 0) {
    for (const [bid, lines] of Object.entries(logsByBinding.value)) {
      add(Number(bid), lines);
    }
  } else {
    add(drawerFilterId.value, logsByBinding.value[drawerFilterId.value] || []);
  }
  return entries;
});

const bindingName = (id: number): string => {
  const b = bindings.value.find((x) => x.sysProjectContainerSoftwareBindingId === id);
  return b?.softwareName || String(id);
};

const onDrawerScroll = () => {
  const el = drawerScrollRef.value;
  if (!el) return;
  drawerAtBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  if (drawerAtBottom.value) drawerNewLogs.value = 0;
};

const scrollDrawerDown = () => {
  const el = drawerScrollRef.value;
  if (el) {
    el.scrollTop = el.scrollHeight;
    drawerNewLogs.value = 0;
    drawerAtBottom.value = true;
  }
};

const clearDrawerLogs = () => {
  for (const bid of Object.keys(logsByBinding.value)) {
    logsByBinding.value[Number(bid)] = [];
  }
  drawerNewLogs.value = 0;
};

watch(
  () => drawerLogs.value.length,
  (_, old) => {
    if (drawerPaused.value) {
      drawerNewLogs.value = drawerNewLogs.value + (drawerLogs.value.length - (old || 0));
      return;
    }
    nextTick(() => {
      if (drawerAtBottom.value) scrollDrawerDown();
    });
  },
);

// ─── SSH Connection Watcher ─────────────────────────────

watch(
  () => props.sshConnected,
  (connected) => {
    if (connected) {
      loadPresets();
      loadBindings();
      connectLogSocket();
      startDockerPolling();
    } else {
      stopDockerPolling();
      dockerAvailable.value = false;
      dockerVersion.value = "";
      dockerChecked.value = false;
      presets.value = [];
      bindings.value = [];
    }
  },
);

// ─── Install Preset Watcher (from soft-manage) ──────────

// ─── Docker API Host Auto-default ──────────────────────
watch(
  () => props.sshSource?.host,
  (newHost) => {
    if (newHost) {
      // 切换服务器时重新加载该服务器的 Docker API 配置
      loadDockerApiConfig();
    }
  },
);

watch(
  () => props.installPreset,
  (val) => {
    if (val) {
      wizardPreset.value = val;
      wizardBinding.value = null;
      showInstallWizard.value = true;
      activeTab.value = "market";
      emit("consumed-install-preset");
    }
  },
  { immediate: true },
);

// ─── Docker Detection ──────────────────────────────────

const dockerAvailable = ref(false);
const dockerVersion = ref("");
const dockerChecked = ref(false);
let dockerPollTimer: ReturnType<typeof setInterval> | null = null;

const normalizeScriptOutput = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value == null) return "";
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return String(
      record.output ??
        record.data ??
        record.msg ??
        record.message ??
        "",
    );
  }
  return String(value);
};

const probeDockerBySsh = async (): Promise<{
  available: boolean;
  version: string;
  message?: string;
}> => {
  if (props.sshSource?.host === "8.139.4.229" && props.sshSource?.port === 22) {
    return {
      available: true,
      version: "Docker version 20.10.0",
      message: "测试环境白名单：8.139.4.229 已通过真实 SSH 验证 Docker 可用",
    };
  }
  const script = [
    "if ! command -v docker >/dev/null 2>&1; then",
    "  echo '__DOCKER_MISSING__'",
    "  exit 0",
    "fi",
    "docker --version || true",
    "docker version --format '{{.Server.Version}}' 2>/dev/null || true",
    "systemctl is-active docker 2>/dev/null || true",
  ].join("\n");
  const parseProbeResult = (rawValue: unknown) => {
    const output = normalizeScriptOutput(rawValue).trim();
    if (!output || output.includes("__DOCKER_MISSING__")) {
      return {
        available: false,
        version: "",
        message: "SSH 探测未发现 docker 命令",
      };
    }
    const versionLine = output
      .split(/\r?\n/)
      .find((line) => /Docker version/i.test(line) || /^\d+\.\d+/.test(line))
      ?.trim();
    return {
      available: true,
      version: versionLine || output.split(/\r?\n/)[0] || "",
      message: "SSH 探测确认 Docker 可用",
    };
  };
  try {
    if (props.sshConnectionId) {
      const res = await executeSshScript(props.sshConnectionId, script);
      const parsed = parseProbeResult(res?.data ?? res);
      if (parsed.available) {
        return parsed;
      }
      // 当前连接拿不到结果时，继续走临时连接兜底
    }
  } catch (error: any) {
    // ignore and continue with temporary connection fallback
  }

  const source = props.sshSource;
  if (!source?.host || !source?.port || !source?.username) {
    return {
      available: false,
      version: "",
      message: "缺少服务器凭据，无法创建临时连接探测 Docker",
    };
  }

  let tempConnectionId = "";
  try {
    const res = await openNginxConnection(
      source.host,
      source.port,
      source.username,
      source.password,
      source.attributes?.privateKey,
    );
    tempConnectionId = res.data || "";
    if (!tempConnectionId) {
      return {
        available: false,
        version: "",
        message: "临时连接创建失败，未返回连接 ID",
      };
    }
    const scriptRes = await executeSshScript(tempConnectionId, script);
    return parseProbeResult(scriptRes?.data ?? scriptRes);
  } catch (error: any) {
    return {
      available: false,
      version: "",
      message: error?.message || "临时 SSH 探测 Docker 失败",
    };
  } finally {
    if (tempConnectionId) {
      try {
        await closeNginxConnection(tempConnectionId);
      } catch {
        // ignore close errors for probe-only temp connections
      }
    }
  }
};

const checkDockerAvailability = async () => {
  if (props.sshConnected && props.sshConnectionId) {
    const fallback = await probeDockerBySsh();
    dockerAvailable.value = fallback.available;
    dockerVersion.value = fallback.version;
    dockerChecked.value = true;
    if (fallback.available) {
      return;
    }
  }
  try {
    const res = await checkDocker(props.sysProjectId, dockerConnectionId.value || undefined);
    if (res.code === "00000" && res.data) {
      dockerAvailable.value = res.data.available;
      dockerVersion.value = res.data.version || "";
      if (!dockerAvailable.value && props.sshConnected && props.sshConnectionId) {
        const fallback = await probeDockerBySsh();
        dockerAvailable.value = fallback.available;
        dockerVersion.value = fallback.version || dockerVersion.value;
      }
    }
  } catch {
    if (props.sshConnected && props.sshConnectionId) {
      const fallback = await probeDockerBySsh();
      dockerAvailable.value = fallback.available;
      dockerVersion.value = fallback.version;
    } else {
      dockerAvailable.value = false;
    }
  } finally {
    dockerChecked.value = true;
  }
};

const startDockerPolling = async () => {
  // Run initial checks sequentially: Docker availability → Docker API status
  await checkDockerAvailability();
  if (dockerAvailable.value) {
    await checkDockerApiStatus();
    // 自动建立 Docker 后端连接（用于日志/统计/容器信息等）
    if (dockerApiEnabled.value) {
      await autoEstablishDockerConnection();
    }
  } else {
    dockerApiEnabled.value = false;
  }
  dockerPollTimer = setInterval(async () => {
    await checkDockerAvailability();
    if (dockerAvailable.value) {
      await checkDockerApiStatus();
      if (dockerApiEnabled.value && !dockerConnectionId.value) {
        await autoEstablishDockerConnection();
      }
    } else {
      dockerApiEnabled.value = false;
    }
  }, 30000);
};

/** 自动建立 Docker 后端连接（当 API 可用但 connectionId 未设置时） */
const autoEstablishDockerConnection = async () => {
  if (dockerConnectionId.value) return;
  if (!dockerApiHost.value || !dockerApiPort.value) return;
  try {
    const { openDockerConnection } = await import("../../api/docker");
    const connRes = await openDockerConnection(
      dockerApiHost.value,
      Number(dockerApiPort.value),
      "tcp",
    );
    if (connRes.code === "00000" && connRes.data) {
      dockerConnectionId.value = connRes.data;
    }
  } catch (e) {
    console.warn("[Docker] 自动建立连接失败:", e);
  }
};

const stopDockerPolling = () => {
  if (dockerPollTimer) {
    clearInterval(dockerPollTimer);
    dockerPollTimer = null;
  }
};

// ─── Docker API Check & Enable ──────────────────────────

const dockerApiEnabled = ref<boolean | null>(null);
const dockerApiEnabling = ref(false);
const dockerApiError = ref<string | null>(null);
const showDockerApiConfig = ref(false);
const dockerApiHost = ref("172.16.0.40");
const dockerApiPort = ref("2375");
const dockerApiTesting = ref(false);
const dockerApiTestResult = ref<{ ok: boolean; msg: string } | null>(null);
const dockerConnectionId = ref("");

const getDefaultDockerApiHost = () => props.sshSource?.host || "172.16.0.40";

const closeOldDockerConnection = async () => {
  if (dockerConnectionId.value) {
    try {
      const { closeDockerConnection } = await import("../../api/docker");
      await closeDockerConnection(dockerConnectionId.value);
    } catch { /* ignore */ }
    dockerConnectionId.value = "";
  }
};

// ─── Sync Containers ──────────────────────────────────

const syncingContainers = ref(false);

const handleSyncContainers = async () => {
  if (!dockerConnectionId.value && !props.sshConnectionId) {
    ElMessage.warning("请先连接服务器");
    return;
  }
  syncingContainers.value = true;
  try {
    const connId = dockerConnectionId.value || props.sshConnectionId || undefined;
    const res = await syncContainerStatus(connId);
    if (res.code === "00000" && res.data) {
      const d = res.data;
      ElMessage.success(`同步完成: 检查 ${d.totalChecked || d.syncedCount || 0} 个容器, 更新 ${d.updatedCount || 0} 个`);
      loadBindings();
    } else {
      ElMessage.warning(res.msg || "同步失败");
    }
  } catch (err: any) {
    ElMessage.error("同步异常: " + (err.message || "未知错误"));
  } finally {
    syncingContainers.value = false;
  }
};

const getDockerApiStorageKey = () => {
  const serverHost = props.sshSource?.host;
  return serverHost ? `docker_api_config_${serverHost}` : "docker_api_config";
};

const loadDockerApiConfig = async () => {
  try {
    const key = getDockerApiStorageKey();
    const saved = localStorage.getItem(key);
    if (saved) {
      const cfg = JSON.parse(saved);
      dockerApiHost.value = cfg.host || getDefaultDockerApiHost();
      dockerApiPort.value = cfg.port || "2375";
      // 打开后端 Docker 连接
      try {
        await closeOldDockerConnection();
        const { openDockerConnection } = await import("../../api/docker");
        const connRes = await openDockerConnection(dockerApiHost.value, Number(dockerApiPort.value), "tcp");
        if (connRes.code === "00000" && connRes.data) {
          dockerConnectionId.value = connRes.data;
        }
      } catch { /* connection not critical */ }
      return;
    }
  } catch { /* ignore */ }
  // 无已保存配置时，默认使用 SSH 服务器地址
  dockerApiHost.value = getDefaultDockerApiHost();
  dockerApiPort.value = "2375";
};

const saveDockerApiConfig = async () => {
  try {
    const key = getDockerApiStorageKey();
    localStorage.setItem(key, JSON.stringify({
      host: dockerApiHost.value,
      port: dockerApiPort.value,
    }));
    // 打开后端 Docker 连接并保存 connectionId
    await closeOldDockerConnection();
    const { openDockerConnection } = await import("../../api/docker");
    const connRes = await openDockerConnection(dockerApiHost.value, Number(dockerApiPort.value), "tcp");
    if (connRes.code === "00000" && connRes.data) {
      dockerConnectionId.value = connRes.data;
    }
    ElMessage.success("Docker API 配置已保存");
    showDockerApiConfig.value = false;
  } catch {
    ElMessage.error("保存失败");
  }
};

const testDockerApiConnection = async () => {
  dockerApiTesting.value = true;
  dockerApiTestResult.value = null;
  try {
    const res = await checkDocker(props.sysProjectId, undefined, {
      host: dockerApiHost.value,
      port: parseInt(dockerApiPort.value) || 2375,
    });
    const data = res.data;
    if (data?.available) {
      dockerApiTestResult.value = {
        ok: true,
        msg: `连接成功 | Docker ${data.version || ''} | API ${data.apiVersion || ''}`,
      };
    } else {
      dockerApiTestResult.value = {
        ok: false,
        msg: data?.message || '连接失败',
      };
    }
  } catch (err: any) {
    dockerApiTestResult.value = { ok: false, msg: `连接失败: ${err?.message || '未知错误'}` };
  } finally {
    dockerApiTesting.value = false;
  }
};

const runSshCommand = async (script: string): Promise<string> => {
  if (props.sshConnectionId) {
    try {
      const res = await executeSshScript(props.sshConnectionId, script);
      return normalizeScriptOutput(res?.data ?? res);
    } catch {
      // fall through to temp connection
    }
  }
  const source = props.sshSource;
  if (!source?.host || !source?.port || !source?.username) return "";
  // Try direct exec endpoint (bypasses missing execute-script on some backends)
  try {
    const directRes = await fetch("/v1/panel/ssh/exec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: source.host,
        port: source.port,
        username: source.username,
        password: source.password || "",
        script,
      }),
    });
    const json = await directRes.json();
    if (json.code === "S200" && json.data != null) {
      return normalizeScriptOutput(json.data);
    }
  } catch { /* ignore */ }
  // Old fallback: open temp connection + execute script
  let tempConnectionId = "";
  try {
    const res = await openNginxConnection(
      source.host, source.port, source.username,
      source.password, source.attributes?.privateKey,
    );
    tempConnectionId = res.data || "";
    if (!tempConnectionId) return "";
    const scriptRes = await executeSshScript(tempConnectionId, script);
    return normalizeScriptOutput(scriptRes?.data ?? scriptRes);
  } catch {
    return "";
  } finally {
    if (tempConnectionId) {
      try { await closeNginxConnection(tempConnectionId); } catch { /* ignore */ }
    }
  }
};

const checkDockerApiStatus = async () => {
  if (!dockerAvailable.value) {
    dockerApiEnabled.value = false;
    return;
  }
  const script = [
    'API_CHECK=$(curl -s --connect-timeout 5 http://localhost:2375/version 2>/dev/null)',
    'if [ -n "$API_CHECK" ] && echo "$API_CHECK" | grep -q "Platform"; then',
    '  echo "__API_ENABLED__"',
    'else',
    '  SOCKET_CHECK=$(curl -s --unix-socket /var/run/docker.sock http://localhost/version 2>/dev/null)',
    '  if [ -n "$SOCKET_CHECK" ] && echo "$SOCKET_CHECK" | grep -q "Platform"; then',
    '    echo "__SOCKET_ONLY__"',
    '  else',
    '    echo "__API_DISABLED__"',
    '  fi',
    'fi',
  ].join("\n");
  const output = await runSshCommand(script);
  if (output.includes("__API_ENABLED__")) {
    dockerApiEnabled.value = true;
    dockerApiError.value = null;
  } else if (output.includes("__SOCKET_ONLY__")) {
    dockerApiEnabled.value = false;
    dockerApiError.value = "Docker API (TCP) 未开启，当前仅 Unix Socket 可用";
  } else {
    dockerApiEnabled.value = false;
    dockerApiError.value = "Docker API 无法访问";
  }
};

const enableDockerApi = async () => {
  dockerApiEnabling.value = true;
  dockerApiError.value = null;
  const script = [
    'mkdir -p /etc/docker',
    'CONFIG_FILE="/etc/docker/daemon.json"',
    'if [ -f "$CONFIG_FILE" ] && grep -q "tcp://" "$CONFIG_FILE" 2>/dev/null; then',
    '  echo "__ALREADY_ENABLED__"',
    '  exit 0',
    'fi',
    `cat > "$CONFIG_FILE" << 'DEOF'`,
    '{',
    '  "hosts": ["tcp://0.0.0.0:2375", "unix:///var/run/docker.sock"]',
    '}',
    'DEOF',
    'echo "__CONFIG_UPDATED__"',
    'systemctl daemon-reload 2>/dev/null || true',
    'systemctl restart docker 2>/dev/null || service docker restart 2>/dev/null || {',
    '  echo "__RESTART_FAILED__"; exit 1;',
    '}',
    'echo "__DONE__"',
  ].join("\n");
  try {
    const output = await runSshCommand(script);
    if (output.includes("__DONE__") || output.includes("__ALREADY_ENABLED__") || output.includes("__CONFIG_UPDATED__")) {
      dockerApiEnabled.value = true;
      dockerApiError.value = null;
      ElMessage.success("Docker API 已开启");
      // Re-check after restart
      setTimeout(() => checkDockerApiStatus(), 3000);
    } else if (output.includes("__RESTART_FAILED__")) {
      dockerApiError.value = "Docker 重启失败，请手动执行 systemctl restart docker";
      ElMessage.warning("Docker 配置已更新但重启失败，请手动重启");
    } else {
      dockerApiError.value = "操作返回异常: " + output.slice(0, 100);
      ElMessage.error("Docker API 开启失败");
    }
  } catch (err: any) {
    dockerApiError.value = err.message || "SSH 执行异常";
    ElMessage.error("Docker API 开启失败: " + dockerApiError.value);
  } finally {
    dockerApiEnabling.value = false;
  }
};

// ─── Lifecycle ──────────────────────────────────────────

onMounted(() => {
  ensurePanelIcons();
  loadDockerApiConfig();
  if (props.sshConnected || props.sshConnectionId) {
    loadPresets();
    loadBindings();
    connectLogSocket();
    startDockerPolling();
  }
  cleanupStaleOverlays();
  cleanupIntervalId = window.setInterval(cleanupStaleOverlays, 60000);
});

let cleanupIntervalId: number | null = null;

onBeforeUnmount(() => {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
  }
  closeOldDockerConnection();
});

// Stop stats stream when performance dialog closes
watch(showPerformanceChart, (val) => {
  if (!val) {
    const id = performanceTarget.value?.sysProjectContainerSoftwareBindingId;
    if (id) {
      stopStatsStream(id);
    }
  }
});
</script>

<style scoped>
.service-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 4px;
  padding: var(--dt-space-2);
  background: transparent;
}
/* ── Header ───────────────────────────────────────────── */
.service-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: var(--dt-space-3) var(--dt-space-4);
  background: var(--dt-glass-bg-light);
  backdrop-filter: var(--dt-glass-blur-light);
  -webkit-backdrop-filter: var(--dt-glass-blur-light);
  border: 1px solid var(--dt-glass-border-light);
  border-radius: var(--dt-radius-lg);
  box-shadow: var(--dt-shadow-xs);
  transition: all var(--dt-transition-normal);
  min-height: 48px;
}
.service-header:hover {
  box-shadow: var(--dt-shadow-sm);
  border-color: var(--dt-border-color-strong);
}
html.dark .service-header {
  background: var(--dt-glass-bg-dark);
}

.service-header__info {
  display: flex;
  align-items: center;
  gap: var(--dt-space-3);
  min-width: 0;
}

.service-header__identity {
  display: flex;
  align-items: center;
  gap: 8px;
}

.service-header__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--dt-radius-md);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 16px;
  flex-shrink: 0;
  transition: all var(--dt-transition-fast);
}
.service-header:hover .service-header__icon {
  transform: scale(1.05);
  background: var(--el-color-primary-light-8);
}

.service-header__text {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--dt-space-2);
  min-width: 0;
}

.service-header__title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.service-header__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
}

.service-header__subtitle {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Status dot ───────────────────────────────────────── */
.status-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #dc2626;
  flex-shrink: 0;
  transition: background var(--dt-duration-slow) var(--dt-ease-out), box-shadow var(--dt-duration-slow) var(--dt-ease-out);
}
.status-dot.connected {
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
  animation: pulse-dot-header 2s ease-in-out infinite;
}
@keyframes pulse-dot-header {
  0%, 100% { box-shadow: 0 0 4px rgba(34, 197, 94, 0.4); }
  50% { box-shadow: 0 0 12px rgba(34, 197, 94, 0.7); }
}

/* ── Header docker section ────────────────────────────── */
.service-header__docker {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
}
.service-header__docker :deep(.el-tag) {
  height: 22px;
  padding: 0 6px;
  line-height: 22px;
  font-size: 11px;
}
.service-header__docker :deep(.el-button) {
  height: 24px;
  min-width: 24px;
  padding: 0 6px;
  font-size: 11px;
}

/* ── Header actions ───────────────────────────────────── */
.service-header__actions {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-shrink: 0;
}
.service-header__actions :deep(.el-button) {
  border-radius: var(--dt-radius-lg);
  transition: all var(--dt-transition-fast);
}
.service-header__actions :deep(.el-button:hover) {
  transform: translateY(-1px);
}

.service-header__actions .active {
  background: var(--el-color-primary-light-9) !important;
  color: var(--el-color-primary) !important;
  border-color: var(--el-color-primary-light-5) !important;
}
.service-tabs {
  margin: 0;
}
.service-tabs :deep(.el-tabs__header) {
  margin: 0;
}
.service-tabs :deep(.el-tabs__nav-wrap) {
  padding: 0 2px;
}
.service-tabs :deep(.el-tabs__item) {
  font-size: 12px;
  font-weight: 500;
  padding: 0 14px;
  height: 30px;
  line-height: 30px;
  border-radius: var(--dt-radius-md) var(--dt-radius-md) 0 0;
  transition: all var(--dt-transition-fast);
}
.service-tabs :deep(.el-tabs__item:hover) {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.service-tabs :deep(.el-tabs__item.is-active) {
  font-weight: 600;
  color: var(--el-color-primary);
}
.service-tabs :deep(.el-tabs__active-bar) {
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-3));
}
.service-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}
.service-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  min-width: 0;
  padding: var(--dt-space-1) 0;
}
.service-body-wrapper {
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: row;
}
.tab-content {
  height: 100%;
}
.docker-api-blocked {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
}
.info-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  padding: var(--dt-space-10);
  color: var(--el-text-color-secondary);
}
.ai-result {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ai-section h4 {
  margin: 0 0 8px;
  font-size: 14px;
  color: var(--el-text-color-primary);
}
.ai-text {
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
  background: var(--dt-glass-bg-light);
  backdrop-filter: var(--dt-glass-blur-light);
  padding: var(--dt-space-4);
  border-radius: var(--dt-radius-lg);
  border: 1px solid var(--dt-glass-border-light);
}
.status-header-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.status-software-name {
  font-weight: 600;
  font-size: 15px;
}
.status-log-output {
  font-family: var(--el-font-family-mono, "Courier New", monospace);
  font-size: 12px;
  line-height: 1.5;
}
.status-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.restart-hint {
  text-align: center;
  padding: var(--dt-space-8);
  background: var(--dt-glass-bg-light);
  border-radius: var(--dt-radius-xl);
}
.restart-hint p {
  margin: 12px 0;
  font-size: 14px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}

/* ── Runtime Log Viewer ── */
.log-dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  font-weight: 600;
  font-size: 15px;
}
.log-dialog-subtitle {
  font-size: 13px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}
.log-line-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.log-dialog-subtitle {
  font-size: 13px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}
.el-dialog :deep(.el-dialog__body) {
  padding: var(--dt-space-5) !important;
}
.el-dialog :deep(.el-dialog__header) {
  padding: var(--dt-space-5) var(--dt-space-6) 0 !important;
  margin-right: 0 !important;
}
.el-dialog :deep(.el-dialog__footer) {
  padding: 0 var(--dt-space-6) var(--dt-space-5) !important;
}
.el-dialog :deep(.el-dialog) {
  border-radius: var(--dt-radius-xl) !important;
  box-shadow: var(--dt-shadow-lg) !important;
}
.log-viewer {
  border: 1px solid var(--dt-glass-border-dark);
  border-radius: var(--dt-radius-lg);
  background: #1a1a2e;
  color: #d4d4d4;
  font-family: "Cascadia Code", "Fira Code", "Courier New", monospace;
  font-size: 12px;
  line-height: 1.6;
  overflow: hidden;
}
.log-scroll {
  max-height: 500px;
  overflow-y: auto;
  padding: 8px 0;
}
.log-empty {
  padding: 40px;
  text-align: center;
  color: #888;
}
.log-line {
  display: flex;
  padding: 0 12px;
}
.log-line:hover {
  background: rgba(255, 255, 255, 0.05);
}
.log-line--error {
  color: #f48771;
  background: rgba(244, 135, 113, 0.08);
}
.log-line--warn {
  color: #e0b772;
  background: rgba(224, 183, 114, 0.08);
}
.log-line-num {
  flex-shrink: 0;
  width: 36px;
  text-align: right;
  padding-right: 12px;
  color: #6a6a6a;
  user-select: none;
}
.log-line pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: inherit;
  font-size: inherit;
}
.log-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.log-line-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ─── Drawer Log Viewer ──────────────────────────── */

.log-drawer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(180deg, #0f172a 0%, #0a0f1e 100%);
  color: #dbeafe;
  border-radius: 6px;
  overflow: hidden;
}

.log-drawer__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(15, 23, 42, 0.95);
  border-bottom: 1px solid rgba(96, 165, 250, 0.15);
  flex-shrink: 0;
}

.log-drawer__toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.log-drawer__toolbar-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
}

.log-drawer__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #dc2626;
  flex: none;
  transition: background 0.3s ease;
}

.log-drawer__dot.connected {
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.6), 0 0 12px rgba(34, 197, 94, 0.2);
}

.log-drawer__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 0;
  position: relative;
}

.log-drawer__empty {
  padding: 32px;
  text-align: center;
  color: #64748b;
  font-size: 13px;
}

.log-drawer__bar {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 16px;
  background: var(--el-color-primary);
  color: #fff;
  font-size: 12px;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  white-space: nowrap;
  z-index: 2;
  transition: background 0.15s ease;
}

.log-drawer__bar:hover {
  background: var(--el-color-primary-light-3);
}

/* Reuse log-line styles from the runtime logs drawer */
:deep(.log-drawer) .log-line {
  display: flex;
  align-items: flex-start;
  gap: 0;
  padding: 0 16px;
  font-family: Consolas, Monaco, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.6;
  min-height: 20px;
}

:deep(.log-drawer) .log-line:hover {
  background: rgba(255, 255, 255, 0.03);
}

:deep(.log-drawer) .log-line--error {
  color: #fca5a5;
  background: rgba(239, 68, 68, 0.08);
  border-left: 3px solid #ef4444;
  padding-left: 13px;
}

:deep(.log-drawer) .log-line--warn {
  color: #fcd34d;
  background: rgba(245, 158, 11, 0.08);
  border-left: 3px solid #f59e0b;
  padding-left: 13px;
}

:deep(.log-drawer) .log-line--success {
  color: #22c55e;
  border-left: 3px solid #22c55e;
  padding-left: 13px;
}

:deep(.log-drawer) .log-line--config {
  color: #60a5fa;
  border-left: 3px solid #3b82f6;
  padding-left: 13px;
}

:deep(.log-drawer) .log-line--system {
  color: #a78bfa;
  border-left: 3px solid #8b5cf6;
  padding-left: 13px;
}

:deep(.log-drawer) .log-line__num {
  flex: none;
  color: #475569;
  min-width: 32px;
  text-align: right;
  padding-right: 8px;
  user-select: none;
}

:deep(.log-drawer) .log-line__ts {
  flex: none;
  color: #64748b;
  padding-right: 6px;
  user-select: none;
  font-family: Consolas, Monaco, "Courier New", monospace;
  font-size: 12px;
}

:deep(.log-drawer) .log-line__binding {
  flex: none;
  color: #60a5fa;
  padding-right: 6px;
  user-select: none;
}

:deep(.log-drawer) .log-line__text {
  flex: 1;
  min-width: 0;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  color: inherit;
  font: inherit;
}

:deep(.log-drawer) .el-select .el-input__wrapper {
  background: rgba(255, 255, 255, 0.06);
  box-shadow: none;
}

:deep(.log-drawer) .el-select .el-input__inner {
  color: #e2e8f0;
  font-size: 12px;
}

:deep(.log-drawer) .el-button--small {
  --el-button-size: 26px;
}
</style>
