<template>
  <!-- ── Config Dialog (pre-install config) ── -->
  <ElDialog
    v-if="!showProgress"
    v-model="wizardVisible"
    title=""
    width="720px"
    :close-on-click-modal="false"
    :show-close="installStatus !== 'installing'"
    class="install-config-dialog"
    @closed="handleClosed"
  >
    <div class="install-config">
      <!-- Preset icon + name -->
      <div class="config-header">
        <div class="config-icon">
          <SoftwareIcon
            :icon="selectedPreset?.softwareIcon"
            style="font-size: 36px; color: var(--el-color-primary)"
            fallback="ep:box"
          />
        </div>
        <div class="config-header-info">
          <div class="config-title">{{ selectedPreset?.softwareName || '安装软件' }}</div>
          <div class="config-version">v{{ selectedPreset?.softwareVersion || '-' }}</div>
        </div>
      </div>

      <ElForm label-width="120px" label-position="right" size="small">
        <ElFormItem label="服务名称" required :error="serviceNameError">
          <ElInput v-model="serviceName" placeholder="请输入服务名称（不可重复）" @blur="validateServiceName" />
        </ElFormItem>

        <ElFormItem label="镜像">
          <ElInput v-model="dockerImage" placeholder="如 mysql:8.0" :disabled="true" />
        </ElFormItem>

        <ElFormItem label="端口映射">
          <div class="kv-list">
            <div class="kv-row kv-header" style="margin-bottom:2px">
              <span style="width:100px;text-align:center;font-size:11px;color:var(--el-text-color-secondary)">宿主机端口</span>
              <span style="width:12px;text-align:center" />
              <span style="width:100px;text-align:center;font-size:11px;color:var(--el-text-color-secondary)">容器端口</span>
              <span style="width:28px" />
            </div>
            <div v-for="(pm, i) in portMappings" :key="i" class="kv-row">
              <ElInput v-model="pm.hostPort" placeholder="宿主机" type="number" style="width:100px" />
              <span class="kv-sep">:</span>
              <ElInput v-model="pm.containerPort" placeholder="容器" type="number" style="width:100px" />
              <ElButton size="small" text type="danger" @click="portMappings.splice(i, 1)">×</ElButton>
            </div>
            <ElButton size="small" @click="portMappings.push({ hostPort: 0, containerPort: 0 })">+ 添加</ElButton>
          </div>
        </ElFormItem>

        <ElFormItem label="环境变量">
          <div class="kv-list">
            <div v-for="(env, i) in dockerEnvEntries" :key="i" class="kv-row">
              <ElInput v-model="env.key" placeholder="KEY" style="width:140px" />
              <ElInput v-model="env.value" placeholder="VALUE" style="width:200px" />
              <ElButton size="small" text type="danger" @click="dockerEnvEntries.splice(i, 1)">×</ElButton>
            </div>
            <ElButton size="small" @click="dockerEnvEntries.push({ key: '', value: '' })">+ 添加</ElButton>
          </div>
        </ElFormItem>

        <ElFormItem label="卷挂载">
          <div class="kv-list">
            <div class="kv-row kv-header" style="margin-bottom:2px">
              <span style="width:160px;text-align:center;font-size:11px;color:var(--el-text-color-secondary)">宿主机路径</span>
              <span style="width:160px;text-align:center;font-size:11px;color:var(--el-text-color-secondary)">容器路径</span>
              <span style="flex:1;min-width:0" />
              <span style="width:28px" />
            </div>
            <div v-for="(vol, i) in dockerVolumeMappings" :key="i" class="kv-row">
              <ElInput v-model="vol.hostPath" placeholder="宿主机路径" style="width:160px" />
              <ElInput v-model="vol.containerPath" placeholder="容器路径" style="width:160px" />
              <ElCheckbox v-model="vol.readOnly" label="只读" size="small" />
              <ElButton size="small" text type="danger" @click="dockerVolumeMappings.splice(i, 1)">×</ElButton>
            </div>
            <ElButton size="small" @click="dockerVolumeMappings.push({ hostPath: '', containerPath: '', readOnly: false })">+ 添加</ElButton>
          </div>
        </ElFormItem>
      </ElForm>
    </div>

    <template #footer>
      <ElButton type="primary" circle @click="startInstall" :loading="installStatus === 'installing'" :disabled="!serviceName.trim()" style="float:right">
            <IconifyIconOnline icon="ep:download" />
          </ElButton>
    </template>
  </ElDialog>

  <!-- ── Mobile-style Install Progress Overlay ── -->
  <ElDialog
    v-else
    v-model="wizardVisible"
    title=""
    width="680px"
    :close-on-click-modal="false"
    :show-close="installStatus !== 'installing'"
    class="install-progress-dialog"
    @closed="handleClosed"
  >
    <div class="mobile-install">
      <!-- App-icon-style rounded square (hidden on success, shown in success-left instead) -->
      <div v-if="installStatus !== 'success'" class="app-icon-frame" :class="{ 'is-error': installStatus === 'error' }">
        <div class="app-icon-progress">
          <svg class="progress-ring" viewBox="0 0 120 120">
            <circle class="progress-bg" cx="60" cy="60" r="54" />
            <circle
              class="progress-bar"
              cx="60" cy="60" r="54"
              :style="{ strokeDashoffset: progressOffset }"
            />
          </svg>
        </div>
        <div class="app-icon-center">
          <IconifyIconOnline
            v-if="installStatus === 'error'"
            icon="ep:warning-filled"
            style="font-size: 48px; color: #ef4444"
          />
          <SoftwareIcon
            v-else
            :icon="selectedPreset?.softwareIcon"
            style="font-size: 40px; color: var(--el-color-primary)"
            fallback="ep:box"
          />
        </div>
      </div>

      <!-- Software name + version -->
      <div class="app-install-name">
        {{ selectedPreset?.softwareName || '安装中...' }}
        <ElTag v-if="props.quickInstall" size="small" type="warning" effect="dark" style="margin-left: 6px; vertical-align: middle">快速安装</ElTag>
      </div>
      <div class="app-install-version" v-if="selectedPreset?.softwareVersion">
        v{{ selectedPreset.softwareVersion }}
      </div>

      <!-- Status text -->
      <div class="app-install-status" :class="installStatus">
        <template v-if="installStatus === 'installing'">
          <ElIcon class="is-loading" style="margin-right: 4px"><Loading /></ElIcon>
          正在安装... {{ installProgress }}%
        </template>
        <template v-else-if="installStatus === 'success'">
          <IconifyIconOnline icon="ep:success-filled" style="margin-right: 4px; color:#22c55e" />
          安装完成
        </template>
        <template v-else-if="installStatus === 'error'">
          <IconifyIconOnline icon="ep:warning-filled" style="margin-right: 4px; color:#ef4444" />
          安装失败
        </template>
      </div>

      <!-- Collapsible log (hidden on success, shown in success-layout instead) -->
      <ElCollapse v-if="installStatus !== 'success'" v-model="logOpen" class="install-log-collapse">
        <ElCollapseItem title="安装日志" name="log">
          <div ref="logViewerRef" class="mobile-log-viewer" @scroll="handleLogScroll">
            <div v-for="(line, idx) in installLogs" :key="idx" class="log-line" :class="logLevelClass(line)">
              <span class="log-line__text">{{ stripAnsi(line) }}</span>
            </div>
            <div v-if="installLogs.length === 0" class="log-placeholder">等待日志...</div>
          </div>
        </ElCollapseItem>
      </ElCollapse>

      <!-- Success: log + summary side by side, full-width button below -->
      <div v-if="installStatus === 'success'" class="success-layout">
        <div class="success-log-area">
          <ElCollapse v-model="logOpen" class="install-log-collapse">
            <ElCollapseItem title="安装日志" name="log">
              <div ref="logViewerRef" class="mobile-log-viewer" @scroll="handleLogScroll">
                <div v-for="(line, idx) in installLogs" :key="idx" class="log-line" :class="logLevelClass(line)">
                  <span class="log-line__text">{{ stripAnsi(line) }}</span>
                </div>
                <div v-if="installLogs.length === 0" class="log-placeholder">等待日志...</div>
              </div>
            </ElCollapseItem>
          </ElCollapse>
        </div>
        <div class="success-summary-area">
          <div class="install-summary">
            <div class="summary-title">
              <IconifyIconOnline icon="ep:info-filled" style="margin-right:4px" />
              安装摘要
            </div>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="summary-label">软件</span>
                <span class="summary-value">{{ selectedPreset?.softwareName }} v{{ selectedPreset?.softwareVersion }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">安装模式</span>
                <span class="summary-value">Docker</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">服务名称</span>
                <span class="summary-value">{{ serviceName }}</span>
              </div>
              <div class="summary-item" v-if="dockerImage">
                <span class="summary-label">镜像</span>
                <span class="summary-value">{{ dockerImage }}</span>
              </div>
              <div class="summary-item" v-if="portMappings.length > 0">
                <span class="summary-label">端口映射</span>
                <span class="summary-value">{{ formatPortMappings(portMappings) }}</span>
              </div>
              <div class="summary-item" v-if="dockerVolumeMappings.length > 0">
                <span class="summary-label">卷挂载</span>
                <span class="summary-value">{{ dockerVolumeMappings.length }} 个</span>
              </div>
              <div class="summary-item" v-if="dockerEnvEntries.length > 0">
                <span class="summary-label">环境变量</span>
                <span class="summary-value">{{ dockerEnvEntries.filter(e => e.key).map(e => e.key).join(', ') }}</span>
              </div>
            </div>
            <ElButton size="small" text @click="copySummary">
              <IconifyIconOnline icon="ep:copy-document" style="margin-right:4px" />
              复制摘要
            </ElButton>
          </div>
        </div>
      </div>

      <!-- Success actions -->
      <div v-if="installStatus === 'success'" class="install-actions">
        <ElButton type="primary" @click="handleFinish" style="width:100%">
          <IconifyIconOnline icon="ep:check" style="margin-right:4px" />
          完成
        </ElButton>
      </div>

      <!-- Error actions -->
      <div v-if="installStatus === 'error'" class="install-actions">
        <ElButton type="warning" @click="handleAiAnalyze" :loading="aiAnalyzing" style="width:100%">
          <IconifyIconOnline icon="ep:ai" style="margin-right:4px" />
          AI 分析失败原因
        </ElButton>

        <!-- ── Error Recovery Guide ── -->
        <details class="error-guide">
          <summary class="error-guide__summary">
            <IconifyIconOnline icon="ep:help-filled" style="margin-right:4px; color: #f59e0b" />
            常见失败原因排查
          </summary>
          <div class="error-guide__body">
            <label class="error-guide__item">
              <input type="checkbox" />
              <span>端口冲突：检查宿主机端口 {{ formatPortMappings(portMappings) }} 是否已被占用</span>
            </label>
            <label class="error-guide__item">
              <input type="checkbox" />
              <span>Docker 镜像拉取失败：检查镜像 "{{ dockerImage || 'nginx' }}" 是否存在，或网络是否可达</span>
            </label>
            <label class="error-guide__item">
              <input type="checkbox" />
              <span>Docker 守护进程未运行：在服务器执行 <code>systemctl status docker</code> 检查</span>
            </label>
            <label class="error-guide__item">
              <input type="checkbox" />
              <span>服务名称冲突：服务名 "{{ serviceName }}" 可能已被占用</span>
            </label>
            <label class="error-guide__item">
              <input type="checkbox" />
              <span>卷挂载路径无效：检查宿主机路径是否存在且有正确权限</span>
            </label>
            <div class="error-guide__hint">
              <IconifyIconOnline icon="ep:warning" style="margin-right:4px" />
              勾选上述项逐一排查，或使用 AI 分析获取详细诊断
            </div>
          </div>
        </details>

        <div class="error-action-row">
          <ElButton @click="handleRetry" style="flex:1">重试</ElButton>
          <ElButton @click="handleFinish" style="flex:1">关闭</ElButton>
        </div>
      </div>
    </div>
  </ElDialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onScopeDispose, ref, watch } from "vue";
import {
  ElButton,
  ElCheckbox,
  ElCollapse,
  ElCollapseItem,
  ElDialog,
  ElForm,
  ElFormItem,
  ElIcon,
  ElInput,
  ElMessage,
  ElTag,
} from "element-plus";
import { Loading } from "@element-plus/icons-vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import SoftwareIcon from "./SoftwareIcon.vue";
import {
  aiAnalyzeFailure,
  checkRequirements,
  fetchOperationLogs,
  fetchPresetList,
  getPresetSuggestions,
  importPreset,
  operateBinding,
  updateBinding,
  type PortMapping,
  type SoftwareBinding,
  type SoftwarePreset,
  type VolumeMapping,
} from "../../api/software";
import { useSoftwareRuntimeLogSocket } from "./useSoftwareRuntimeLogSocket";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    initialPreset?: SoftwarePreset | null;
    initialBinding?: SoftwareBinding | null;
    sysProjectId?: number;
    sshConnectionId?: string;
    quickInstall?: boolean;
  }>(),
  { initialPreset: null, initialBinding: null, sysProjectId: 1, sshConnectionId: "", quickInstall: false },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  installed: [binding: SoftwareBinding];
  "install-start": [name: string];
  "install-complete": [name: string, success: boolean];
  "install-progress": [progress: number];
}>();

const wizardVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

// ─── Config state ───────────────────────────────────────────

const selectedPreset = ref<SoftwarePreset | null>(null);
const serviceName = ref("");
const serviceNameError = ref("");
watch(serviceName, () => { serviceNameError.value = ""; });
const dockerImage = ref("");
const defaultImage = ref("");
const portMappings = ref<PortMapping[]>([]);
const dockerEnvEntries = ref<{ key: string; value: string }[]>([]);
const dockerVolumeMappings = ref<VolumeMapping[]>([]);

// ─── Install state ──────────────────────────────────────────

const showProgress = ref(false);
const installProgress = ref(0);
const installStatus = ref<"idle" | "installing" | "success" | "error">("idle");
const installLogs = ref<string[]>([]);
const logOpen = ref<string[]>(["log"]);
const aiAnalyzing = ref(false);
const logViewerRef = ref<HTMLElement | null>(null);
const logAtBottom = ref(true);
const lastOperationId = ref("");
const binding = ref<SoftwareBinding | null>(null);
const runtimeLogSocket = useSoftwareRuntimeLogSocket();

const CIRCUMFERENCE = 2 * Math.PI * 54; // ~339.292

const progressOffset = computed(() => {
  const pct = Math.min(100, Math.max(0, installProgress.value));
  return CIRCUMFERENCE - (CIRCUMFERENCE * pct) / 100;
});

const restoreDefaultImage = () => {
  if (defaultImage.value) dockerImage.value = defaultImage.value;
};

const validateServiceName = async () => {
  serviceNameError.value = "";
  const name = serviceName.value.trim();
  if (!name) {
    serviceNameError.value = "请输入服务名称";
    return;
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name)) {
    serviceNameError.value = "服务名称只能包含字母、数字、点、下划线和连字符";
    return;
  }
  try {
    const res = await checkRequirements({
      serviceName: name,
      softwareName: selectedPreset.value?.softwareName,
      installMode: "DOCKER",
      excludeBindingId: binding.value?.sysProjectContainerSoftwareBindingId || undefined,
    });
    if (res.code === "00000" && res.data) {
      if (res.data.serviceNameAvailable === false) {
        serviceNameError.value = `服务名称 "${name}" 已被占用`;
      }
    }
  } catch { /* ignore */ }
};

const stripAnsi = (str: string) =>
  str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "").replace(/\x1B\][0-9;]*[a-zA-Z]/g, "");

const logLevelClass = (line: string): string => {
  if (/^\[错误\]/.test(line)) return "log-line--error";
  if (/^\[警告\]/.test(line)) return "log-line--warn";
  if (/^\[成功\]/.test(line)) return "log-line--success";
  if (/^\[配置\]/.test(line)) return "log-line--config";
  if (/^\[信息\]/.test(line)) return "log-line--info";
  return "";
};

const fmtTime = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `[${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}]`;
};

const handleLogScroll = () => {
  const el = logViewerRef.value;
  if (!el) return;
  logAtBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
};

const pushLog = (line: string) => {
  const stamped = /^\[\d{2}:\d{2}:\d{2}\]/.test(line) ? line : `${fmtTime(new Date())} ${line}`;
  installLogs.value.push(stamped);
  const bid = binding.value?.sysProjectContainerSoftwareBindingId;
  if (bid) {
    runtimeLogSocket.pushBindingLog(bid, stamped);
  }
};

// ─── HTTP polling fallback for install logs ──────────────────

const logPollCtx = { timer: null as ReturnType<typeof setInterval> | null, done: false };

const startLogPolling = (bindingId: number, operationId?: string) => {
  stopLogPolling();
  logPollCtx.done = false;
  const poll = async () => {
    if (logPollCtx.done || installStatus.value !== "installing") {
      stopLogPolling();
      return;
    }
    try {
      const res = await fetchOperationLogs({
        bindingId,
        action: "INSTALL",
        operationId,
      });
      if (res.code === "00000" && res.data?.length) {
        const existing = new Set(installLogs.value);
        const newLines = res.data.filter((l: string) => !existing.has(l));
        if (newLines.length) {
          for (const l of newLines) pushLog(l);
        }
      }
    } catch { /* ignore polling errors */ }
  };
  // Poll immediately, then every 2s
  poll();
  logPollCtx.timer = setInterval(poll, 2000);
};

const stopLogPolling = () => {
  logPollCtx.done = true;
  if (logPollCtx.timer) {
    clearInterval(logPollCtx.timer);
    logPollCtx.timer = null;
  }
};

// Stop polling when install completes; auto-expand log on success
watch(installStatus, (val) => {
  if (val === "success" || val === "error") stopLogPolling();
  if (val === "success") {
    logOpen.value = ["log"];
  }
});

// 安装日志自动滚动（用户未手动上滚时始终滚动到底部）
watch(installLogs, () => {
  nextTick(() => {
    if (logAtBottom.value) {
      const el = logViewerRef.value;
      if (el) el.scrollTop = el.scrollHeight;
    }
  });
}, { deep: true });

// ─── WebSocket watchers ─────────────────────────────────────

watch(
  () => runtimeLogSocket.logsByBinding.value,
  (byBinding) => {
    const bid = binding.value?.sysProjectContainerSoftwareBindingId;
    if (!bid || !byBinding[bid]) return;
    const lines = byBinding[bid];
    if (lines.length === 0) return;
    const existingSet = new Set(installLogs.value);
    const newLines = lines.filter((l) => !existingSet.has(l));
    if (newLines.length > 0) {
      installLogs.value = [...installLogs.value, ...newLines];
    }
  },
  { deep: true },
);

watch(
  () => runtimeLogSocket.progressByBinding.value,
  (byBinding) => {
    const bid = binding.value?.sysProjectContainerSoftwareBindingId;
    if (!bid) return;
    const val = byBinding[bid];
    if (typeof val === "number" && val > 0) {
      installProgress.value = val;
      emit("install-progress", val);
    }
  },
  { deep: true },
);

watch(
  () => runtimeLogSocket.statusByBinding.value,
  (byBinding) => {
    const bid = binding.value?.sysProjectContainerSoftwareBindingId;
    if (!bid) return;
    const status = byBinding[bid];
    if (status === "success") {
      installStatus.value = "success";
      installProgress.value = 100;
      emit("install-progress", 100);
      emit("install-complete", selectedPreset.value?.softwareName || "", true);
    } else if (status === "error") {
      installStatus.value = "error";
      emit("install-complete", selectedPreset.value?.softwareName || "", false);
    }
  },
  { deep: true },
);

onScopeDispose(() => {
  stopLogPolling();
  runtimeLogSocket.disconnect();
});

// ─── Initialize from preset ─────────────────────────────────

const initializeFromPreset = (preset: SoftwarePreset) => {
  selectedPreset.value = preset;
  serviceName.value = preset.serviceName || preset.softwareCode || preset.softwareName || "";

  const sug = getPresetSuggestions(preset.softwareCode) || getPresetSuggestions(preset.softwareName);

  // Image
  const presetImage = dockerImageFromRemark(preset);
  dockerImage.value = presetImage || sug?.image || "";
  defaultImage.value = dockerImage.value;

  // Ports
  const portStr = preset.exposePorts || sug?.ports || "";
  portMappings.value = parsePortMappings(portStr);

  // Env vars
  dockerEnvEntries.value = [];
  const presetEnv = dockerEnvFromRemark(preset);
  const mergedEnv = { ...(sug?.env || {}), ...presetEnv };
  for (const [key, value] of Object.entries(mergedEnv)) {
    dockerEnvEntries.value.push({ key, value: String(value) });
  }

  // Volumes
  dockerVolumeMappings.value = [];
  const presetVols = dockerVolumesFromRemark(preset);
  const mergedVols = [...(presetVols.length > 0 ? presetVols : sug?.volumes || [])];
  for (const vol of mergedVols) {
    dockerVolumeMappings.value.push({ ...vol });
  }
};

const parsePortMappings = (exposePorts: string): PortMapping[] => {
  if (!exposePorts) return [];
  return exposePorts
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      if (p.includes(":")) {
        const [hostPort, containerPort] = p.split(":");
        return { hostPort: parseInt(hostPort) || 0, containerPort: parseInt(containerPort) || 0 };
      }
      const port = parseInt(p) || 0;
      return { hostPort: port, containerPort: port };
    });
};

const formatPortMappings = (mappings: PortMapping[]) =>
  mappings
    .filter((item) => item.hostPort > 0 || item.containerPort > 0)
    .map((item) => `${item.hostPort}:${item.containerPort}`)
    .join(",");

const dockerImageFromRemark = (preset: SoftwarePreset): string => {
  try {
    const remark = JSON.parse(preset.presetRemark || "{}");
    return remark.dockerDefaults?.image || "";
  } catch {
    return "";
  }
};

const dockerEnvFromRemark = (preset: SoftwarePreset): Record<string, string> => {
  try {
    const remark = JSON.parse(preset.presetRemark || "{}");
    return remark.dockerDefaults?.env || {};
  } catch {
    return {};
  }
};

const dockerVolumesFromRemark = (preset: SoftwarePreset): VolumeMapping[] => {
  try {
    const remark = JSON.parse(preset.presetRemark || "{}");
    return remark.dockerDefaults?.volumeMappings || [];
  } catch {
    return [];
  }
};

// ─── Install flow ───────────────────────────────────────────

const startInstall = async () => {
  const preset = selectedPreset.value;
  if (!preset || !serviceName.value.trim()) return;

  // ─── Pre-install validation ─────────────────────────────
  const exposePorts = formatPortMappings(portMappings.value);
  try {
    const checkRes = await checkRequirements({
      exposePorts: exposePorts || undefined,
      softwareName: preset.softwareName,
      serviceName: serviceName.value,
      dockerImage: dockerImage.value || undefined,
      installMode: "DOCKER",
      excludeBindingId: binding.value?.sysProjectContainerSoftwareBindingId || undefined,
    });
    if (checkRes.code === "00000" && checkRes.data) {
      const data = checkRes.data;
      const issues: string[] = [];
      if (!data.portAvailable && data.conflictPorts?.length) {
        issues.push(`端口冲突: ${data.conflictPorts.join(", ")}`);
      }
      if (data.alreadyInstalled) {
        issues.push(`"${preset.softwareName}" 已安装，请勿重复安装`);
      }
      if (data.serviceNameAvailable === false) {
        issues.push(`服务名称 "${serviceName.value}" 已被占用`);
      }
      if (data.containerNameAvailable === false) {
        issues.push(`Docker 容器名 "${serviceName.value}" 已被占用`);
      }
      if (data.daemonAvailable === false) {
        issues.push(`Docker 守护进程不可达`);
      }
      if (data.conflictVolumes?.length) {
        issues.push(`卷路径冲突: ${data.conflictVolumes.join(", ")}`);
      }
      if (issues.length > 0) {
        // Log detailed check results before blocking
        pushLog("── 环境检测结果 ──");
        pushLog(`[信息] Docker 守护进程: ${data.daemonAvailable ? '✓' : '✗'}`);
        pushLog(`[信息] Docker 镜像: ${data.imageAvailable ? '✓' : '✗'}`);
        pushLog(`[信息] 端口可用: ${data.portAvailable ? '✓' : '✗'}`);
        pushLog(`[信息] 容器名可用: ${data.containerNameAvailable !== false ? '✓' : '✗'}`);
        if (data.conflictVolumes?.length) {
          pushLog(`[警告] 卷路径冲突: ${data.conflictVolumes.join(", ")}`);
        }
        ElMessage.warning(issues.join("；"));
        return;
      }
    }
    // checkRequirements 接口不可用时仅警告，不阻止安装
  } catch (e: any) {
    console.warn("checkRequirements 调用失败，跳过前置检查:", e?.message);
  }

  showProgress.value = true;
  installStatus.value = "installing";
  installProgress.value = 0;
  installLogs.value = [];

  try {
    pushLog("[信息] 正在导入预设...");

    const importRes = await importPreset({
      sysProjectId: props.sysProjectId,
      sysProjectContainerSoftwarePresetId: preset.sysProjectContainerSoftwarePresetId!,
      serviceName: serviceName.value,
      exposePorts: exposePorts || preset.exposePorts,
      bindingRemark: JSON.stringify({
        installMode: "DOCKER",
        serviceName: serviceName.value,
        dockerImage: dockerImage.value,
        port: exposePorts,
      }),
    });

    if (importRes.code !== "00000") {
      installStatus.value = "error";
      pushLog(`[错误] 导入预设失败: ${importRes.msg}`);
      return;
    }

    let savedBinding = importRes.data!;

    const env: Record<string, string> = {};
    for (const e of dockerEnvEntries.value) {
      if (e.key?.trim()) env[e.key.trim()] = e.value;
    }
    const vols = dockerVolumeMappings.value.filter((v) => v.hostPath && v.containerPath);

    const updatePayload: Partial<SoftwareBinding> = {
      sysProjectContainerSoftwareBindingId: savedBinding.sysProjectContainerSoftwareBindingId,
      exposePorts: exposePorts || preset.exposePorts,
      serviceName: serviceName.value,
      bindingRemark: JSON.stringify({
        installMode: "DOCKER",
        serviceName: serviceName.value,
        dockerImage: dockerImage.value,
        dockerEnv: env,
        dockerVolumeMappings: vols,
        port: exposePorts,
      }),
    };

    await updateBinding(updatePayload);
    binding.value = { ...savedBinding, ...updatePayload };

    // Print config to log
    if (exposePorts) pushLog(`[配置] 端口映射: ${exposePorts}`);
    for (const e of dockerEnvEntries.value.filter((e) => e.key?.trim())) {
      pushLog(`[配置] 环境变量: ${e.key}=${e.value}`);
    }
    for (const v of vols) {
      pushLog(`[配置] 卷映射: ${v.hostPath} → ${v.containerPath}${v.readOnly ? " (只读)" : ""}`);
    }
    pushLog(`[配置] 服务名称: ${serviceName.value}`);
    pushLog(`[配置] Docker 镜像: ${dockerImage.value}`);

    const opRes = await operateBinding({
      sysProjectContainerSoftwareBindingId: savedBinding.sysProjectContainerSoftwareBindingId!,
      action: "INSTALL",
      connectionId: props.sshConnectionId || undefined,
    });

    if (opRes.code === "00000") {
      const ticket = opRes.data;
      pushLog("[成功] 安装任务已提交");
      if (ticket?.operationId) {
        lastOperationId.value = ticket.operationId;
      }
      emit("installed", savedBinding);
      emit("install-start", preset.softwareName || "");

      // Start HTTP polling fallback for logs (when WS unavailable)
      startLogPolling(
        savedBinding.sysProjectContainerSoftwareBindingId!,
        ticket?.operationId,
      );
    } else {
      installStatus.value = "error";
      pushLog(`[错误] ${opRes.msg || "安装失败"}`);
    }
  } catch (err: any) {
    installStatus.value = "error";
    pushLog(`[错误] ${err?.message || "安装过程异常"}`);
  }
};

const handleAiAnalyze = async () => {
  if (!binding.value) return;
  aiAnalyzing.value = true;
  try {
    const res = await aiAnalyzeFailure({
      operationId: lastOperationId.value || binding.value.sysProjectContainerSoftwareBindingId?.toString() || "",
      logs: installLogs.value,
      softwareName: binding.value.softwareName || "",
    });
    if (res.code === "00000") {
      pushLog("--- AI 分析结果 ---");
      pushLog(res.data?.analysis || "无法分析");
      if (res.data?.suggestedFix) pushLog(`[建议] ${res.data.suggestedFix}`);
      if (res.data?.autoFixScript) {
        pushLog("--- 自动修复脚本 ---");
        pushLog(res.data.autoFixScript);
      }
    } else {
      ElMessage.warning("AI 分析暂不可用");
    }
  } finally {
    aiAnalyzing.value = false;
  }
};

const handleRetry = () => {
  showProgress.value = false;
  installStatus.value = "idle";
  installProgress.value = 0;
  installLogs.value = [];
  binding.value = null;
};

const handleFinish = () => {
  wizardVisible.value = false;
};

const copySummary = async () => {
  const preset = selectedPreset.value;
  const lines = [
    `## 安装摘要: ${preset?.softwareName || ''}`,
    ``,
    `- **软件**: ${preset?.softwareName || ''} v${preset?.softwareVersion || '-'}`,
    `- **安装模式**: Docker`,
    `- **服务名称**: ${serviceName.value}`,
  ];
  if (dockerImage.value) lines.push(`- **镜像**: ${dockerImage.value}`);
  if (portMappings.value.length > 0) {
    lines.push(`- **端口映射**: ${formatPortMappings(portMappings.value)}`);
  }
  if (dockerVolumeMappings.value.length > 0) {
    const volStr = dockerVolumeMappings.value
      .filter(v => v.hostPath && v.containerPath)
      .map(v => `${v.hostPath} → ${v.containerPath}${v.readOnly ? ' (只读)' : ''}`)
      .join('; ');
    lines.push(`- **卷挂载**: ${volStr}`);
  }
  if (dockerEnvEntries.value.length > 0) {
    const envKeys = dockerEnvEntries.value.filter(e => e.key).map(e => e.key);
    lines.push(`- **环境变量**: ${envKeys.join(', ')}`);
  }
  try {
    await navigator.clipboard.writeText(lines.join('\n'));
    ElMessage.success('摘要已复制到剪贴板');
  } catch {
    ElMessage.warning('复制失败，请手动复制');
  }
};

const handleClosed = () => {
  showProgress.value = false;
  installStatus.value = "idle";
  installProgress.value = 0;
  installLogs.value = [];
  binding.value = null;
  selectedPreset.value = null;
  serviceName.value = "";
  dockerImage.value = "";
  portMappings.value = [];
  dockerEnvEntries.value = [];
  dockerVolumeMappings.value = [];
};

// ─── Watchers for initial preset ────────────────────────────

watch(
  () => props.initialPreset,
  (val) => {
    if (val) {
      initializeFromPreset(val);
    }
  },
  { immediate: true },
);

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      runtimeLogSocket.connect();
      if (props.initialPreset) {
        initializeFromPreset(props.initialPreset);
        // Quick install: skip config dialog, start install immediately
        if (props.quickInstall) {
          showProgress.value = true;
          nextTick(() => startInstall());
        }
      }
    }
  },
  { immediate: true },
);
</script>

<style scoped>
/* ─── Config Dialog ─────────────────────────────────────── */

.install-config-dialog :deep(.el-dialog__body) {
  padding: 20px 24px !important;
}
.install-config-dialog :deep(.el-dialog__header) {
  display: none;
}
.install-config-dialog :deep(.el-dialog--center) {
  --el-dialog-content-font-size: 14px;
}

.config-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}
.config-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: var(--el-color-primary-light-9);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.12);
}
.config-header-info {
  min-width: 0;
}
.config-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.config-version {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.kv-list {
  width: 100%;
}
.kv-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.kv-sep {
  color: var(--el-text-color-secondary);
  font-weight: 600;
}

/* ─── Progress Dialog (mobile-style) ─────────────────────── */

.install-progress-dialog {
  --el-dialog-width: 680px;
}
.install-progress-dialog :deep(.el-dialog__body) {
  padding: 32px 24px 20px !important;
  text-align: center;
}
.install-progress-dialog :deep(.el-dialog__header) {
  display: none;
}

.mobile-install {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

/* ─── App-icon-style frame with circular progress ────────── */

.app-icon-frame {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 28px;
  background: linear-gradient(135deg, var(--el-color-primary-light-8), var(--el-color-primary-light-9));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(64, 158, 255, 0.15);
  transition: all 0.4s ease;
}
.app-icon-frame.is-success {
  background: linear-gradient(135deg, #22c55e, #4ade80);
  box-shadow: 0 8px 32px rgba(34, 197, 94, 0.2);
}
.app-icon-frame.is-error {
  background: linear-gradient(135deg, #ef4444, #f87171);
  box-shadow: 0 8px 32px rgba(239, 68, 68, 0.2);
}

.app-icon-progress {
  position: absolute;
  inset: -6px;
}

.progress-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}
.progress-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.15);
  stroke-width: 4;
}
.progress-bar {
  fill: none;
  stroke: #fff;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-dasharray: 339.292;
  transition: stroke-dashoffset 0.5s ease-out;
}

.app-icon-center {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 28px;
  overflow: hidden;
}

/* ─── Status text ────────────────────────────────────────── */

.app-install-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-top: 4px;
}
.app-install-version {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.app-install-status {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  padding: 6px 16px;
  border-radius: 20px;
  background: var(--el-fill-color-light);
}
.app-install-status.installing {
  color: var(--el-color-primary);
}
.app-install-status.success {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}
.app-install-status.error {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* ─── Log viewer (within collapse) ──────────────────────── */

.install-log-collapse {
  width: 100%;
  margin-top: 4px;
}
.mobile-log-viewer {
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: monospace;
  font-size: 11px;
  padding: 8px 10px;
  border-radius: 8px;
  max-height: 180px;
  overflow-y: auto;
  text-align: left;
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.5;
}
.log-line--error {
  color: #fca5a5;
  border-left: 3px solid #ef4444;
  padding-left: 6px;
  background: rgba(239, 68, 68, 0.08);
}
.log-line--warn {
  color: #fcd34d;
  border-left: 3px solid #f59e0b;
  padding-left: 6px;
}
.log-line--success {
  color: #22c55e;
  border-left: 3px solid #22c55e;
  padding-left: 6px;
}
.log-line--config {
  color: #60a5fa;
  border-left: 3px solid #3b82f6;
  padding-left: 6px;
}
.log-line--info {
  color: #d4d4d4;
  padding-left: 6px;
}
.log-placeholder {
  color: #888;
  font-style: italic;
}

/* ─── Action buttons ─────────────────────────────────────── */

.install-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}
.error-action-row {
  display: flex;
  gap: 8px;
}

/* ─── Success layout (log left + summary right) ──────────── */

.success-layout {
  display: flex;
  flex-direction: row;
  gap: 12px;
  width: 100%;
  margin-top: 8px;
}
.success-log-area {
  flex: 1;
  min-width: 0;
}
.success-log-area .install-log-collapse {
  margin-top: 0;
}
.success-log-area .mobile-log-viewer {
  max-height: 220px;
}
.success-summary-area {
  width: 280px;
  flex-shrink: 0;
}

/* ─── Install Summary ──────────────────────────────────────── */

.install-summary {
  width: 100%;
  background: rgba(34, 197, 94, 0.06);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 10px;
  padding: 12px 14px;
  text-align: left;
}

.summary-title {
  font-size: 13px;
  font-weight: 600;
  color: #22c55e;
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.summary-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.summary-item {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 12px;
  line-height: 1.6;
}

.summary-label {
  flex: none;
  color: var(--el-text-color-secondary);
  min-width: 64px;
  font-size: 11px;
}

.summary-value {
  color: var(--el-text-color-primary);
  word-break: break-all;
}

/* ─── Error Recovery Guide ─────────────────────────────────── */

.error-guide {
  width: 100%;
  background: rgba(245, 158, 11, 0.06);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 10px;
  text-align: left;
  font-size: 12px;
}

.error-guide__summary {
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 600;
  color: #f59e0b;
  display: flex;
  align-items: center;
  user-select: none;
}

.error-guide__body {
  padding: 0 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.error-guide__item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  cursor: pointer;
  line-height: 1.5;
  color: var(--el-text-color-regular);
}

.error-guide__item input[type="checkbox"] {
  margin-top: 2px;
  flex: none;
}

.error-guide__item code {
  background: rgba(0, 0, 0, 0.08);
  padding: 0 4px;
  border-radius: 3px;
  font-size: 11px;
}

.error-guide__hint {
  display: flex;
  align-items: center;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
  padding-top: 6px;
  border-top: 1px solid rgba(245, 158, 11, 0.15);
}
</style>
