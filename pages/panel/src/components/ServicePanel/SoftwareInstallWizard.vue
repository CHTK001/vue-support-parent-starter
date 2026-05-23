<template>
  <!-- ── Step 1: Config Dialog ── -->
  <ElDialog
    v-if="wizardStep === 'config'"
    v-model="wizardVisible"
    title=""
    width="720px"
    :close-on-click-modal="false"
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

        <ElCollapse v-model="configCollapseActive" class="config-collapse">
          <ElCollapseItem title="端口映射" name="ports">
            <template #title>
              <span>端口映射</span>
              <ElTag size="small" type="info" style="margin-left:6px">{{ portMappings.length }}</ElTag>
            </template>
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
          </ElCollapseItem>

          <ElCollapseItem name="env">
            <template #title>
              <span>环境变量</span>
              <ElTag size="small" type="info" style="margin-left:6px">{{ dockerEnvEntries.length }}</ElTag>
            </template>
            <div class="kv-list">
              <div v-for="(env, i) in dockerEnvEntries" :key="i" class="kv-row">
                <div class="kv-env-wrap">
                  <div class="kv-env-inputs">
                    <ElInput v-model="env.key" placeholder="KEY" style="width:140px" />
                    <ElInput v-model="env.value" placeholder="VALUE" style="width:200px" />
                    <ElButton size="small" text type="danger" @click="dockerEnvEntries.splice(i, 1)">×</ElButton>
                  </div>
                  <div v-if="env.description" class="kv-env-desc">{{ env.description }}</div>
                </div>
              </div>
              <ElButton size="small" @click="dockerEnvEntries.push({ key: '', value: '' })">+ 添加</ElButton>
            </div>
          </ElCollapseItem>

          <ElCollapseItem name="volumes">
            <template #title>
              <span>卷挂载</span>
              <ElTag size="small" type="info" style="margin-left:6px">{{ dockerVolumeMappings.length }}</ElTag>
            </template>
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
          </ElCollapseItem>
        </ElCollapse>

        <!-- 镜像仓库选择 -->
        <div class="config-option-row">
          <div class="config-option-label">镜像仓库</div>
          <ElSelect v-model="selectedRegistryId" placeholder="默认（Docker Hub）" clearable size="small" style="width:100%">
            <ElOption label="默认（Docker Hub）" :value="undefined" />
            <ElOption v-for="r in registryList" :key="r.id" :label="r.registryName" :value="r.id">
              <span>{{ r.registryName }}</span>
              <code style="float:right;font-size:11px;color:var(--el-text-color-secondary)">{{ r.registryUrl }}</code>
            </ElOption>
          </ElSelect>
        </div>

        <!-- 安全选项 -->
        <div class="seccomp-option">
          <div class="seccomp-option-inner">
            <ElSwitch v-model="enableSeccompUnconfined" size="small" />
            <span class="seccomp-label">seccomp=unconfined（受限 Docker 环境）</span>
          </div>
          <div class="seccomp-option-inner">
            <ElSwitch v-model="enablePrivileged" size="small" />
            <span class="seccomp-label">--privileged（特权模式，ulimit/线程受限环境）</span>
          </div>
        </div>

        <!-- 选择安装服务器（多服务器时显示） -->
        <div v-if="props.sshConnectionIds && props.sshConnectionIds.length > 1" class="server-select-section">
          <div class="server-select-label">
            <IconifyIconOnline icon="ep:connection" style="margin-right: 4px" />
            目标服务器
            <ElTag size="small" type="info" style="margin-left: 6px">已连接 {{ props.sshConnectionIds.length }} 台</ElTag>
          </div>
          <ElCheckboxGroup v-model="selectedTargetConnectionIds" class="server-select-list">
            <label
              v-for="(src, i) in (props.sshSources || [])"
              :key="src.connectionId || i"
              class="server-select-item"
              :class="{ checked: selectedTargetConnectionIds.includes(src.connectionId || props.sshConnectionIds[i]) }"
            >
              <ElCheckbox :value="src.connectionId || props.sshConnectionIds[i]">
                <span class="server-select-item-name">{{ src.connectionName || src.host }}:{{ src.port }}</span>
              </ElCheckbox>
            </label>
          </ElCheckboxGroup>
        </div>
      </ElForm>
    </div>

    <template #footer>
      <div class="config-footer-row">
        <ElButton @click="wizardVisible = false">取消</ElButton>
        <ElButton type="primary" @click="goToEnvCheck" :disabled="!serviceName.trim()">
          <IconifyIconOnline icon="ep:download" style="margin-right:4px" />
          安装
        </ElButton>
      </div>
    </template>
  </ElDialog>

  <!-- ── Step 2: Environment Check Dialog ── -->
  <ElDialog
    v-if="wizardStep === 'check'"
    v-model="wizardVisible"
    title=""
    width="620px"
    :close-on-click-modal="false"
    class="install-check-dialog"
    @closed="handleClosed"
  >
    <div class="check-page">
      <div class="check-header">
        <SoftwareIcon
          :icon="selectedPreset?.softwareIcon"
          style="font-size: 32px; color: var(--el-color-primary)"
          fallback="ep:box"
        />
        <div class="check-header-info">
          <div class="check-title">{{ selectedPreset?.softwareName || '安装软件' }} v{{ selectedPreset?.softwareVersion || '-' }}</div>
          <div class="check-subtitle">服务名称: {{ serviceName }}</div>
        </div>
      </div>

      <div class="check-body">
        <div class="check-section-title">
          <IconifyIconOnline icon="ep:monitor" style="margin-right:4px" />
          环境检查
          <ElTag v-if="envCheckStatus === 'checking'" size="small" type="warning" effect="plain" style="margin-left:8px">检查中...</ElTag>
          <ElTag v-else-if="envCheckStatus === 'pass'" size="small" type="success" effect="plain" style="margin-left:8px">通过</ElTag>
          <ElTag v-else-if="envCheckStatus === 'fail'" size="small" type="danger" effect="plain" style="margin-left:8px">未通过</ElTag>
        </div>

        <div class="check-list">
          <div v-for="(r, i) in envCheckResults" :key="i" class="check-item" :class="'check-item--' + r.type">
            <div class="check-item-icon">
              <IconifyIconOnline v-if="r.type === 'success'" icon="ep:circle-check-filled" style="color:#22c55e" />
              <IconifyIconOnline v-else-if="r.type === 'error'" icon="ep:circle-close-filled" style="color:#ef4444" />
              <IconifyIconOnline v-else-if="r.type === 'warn'" icon="ep:warning-filled" style="color:#e6a23c" />
              <IconifyIconOnline v-else icon="ep:info-filled" style="color:#909399" />
            </div>
            <span class="check-item-text">{{ r.text }}</span>
          </div>
          <div v-if="envCheckLoading" class="check-item check-item--loading">
            <ElIcon class="is-loading"><Loading /></ElIcon>
            <span>正在检查环境...</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="config-footer-row" v-if="!envCheckLoading">
        <ElButton v-if="envCheckStatus === 'fail'" @click="wizardStep = 'config'">返回修改</ElButton>
        <ElButton v-else @click="wizardStep = 'config'">返回</ElButton>
        <ElButton type="primary" @click="startInstall" :disabled="envCheckStatus !== 'pass'">
          <IconifyIconOnline icon="ep:download" style="margin-right:4px" />
          开始安装
        </ElButton>
      </div>
    </template>
  </ElDialog>

  <!-- ── Step 3: Install Progress Overlay ── -->
  <ElDialog
    v-if="wizardStep === 'install'"
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
                <span
                  class="summary-value"
                  :title="dockerEnvEntries.filter(e => e.key).map(e => e.description ? `${e.key}: ${e.description}` : e.key).join('\n')"
                >{{ dockerEnvEntries.filter(e => e.key).map(e => e.key).join(', ') }}</span>
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
  ElCheckboxGroup,
  ElCollapse,
  ElCollapseItem,
  ElDialog,
  ElForm,
  ElFormItem,
  ElIcon,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElSwitch,
  ElTag,
} from "element-plus";
import { Loading } from "@element-plus/icons-vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import SoftwareIcon from "./SoftwareIcon.vue";
import type { PanelSavedSource } from "../../panel";
import {
  aiAnalyzeFailure,
  batchOperate,
  checkRequirements,
  fetchPresetList,
  fetchRegistryList,
  getPresetSuggestions,
  importPreset,
  operateBinding,
  updateBinding,
  type DockerRegistry,
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
    sshConnectionIds?: string[];
    sshSources?: PanelSavedSource[];
    dockerConnectionId?: string;
    quickInstall?: boolean;
  }>(),
  { initialPreset: null, initialBinding: null, sysProjectId: 1, sshConnectionId: "", sshConnectionIds: () => [], sshSources: () => [], dockerConnectionId: "", quickInstall: false },
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
  set: (val) => {
    if (!val && wizardStep.value === 'install' && installStatus.value === 'installing') return;
    emit("update:modelValue", val);
  },
});

// ─── Wizard step ───────────────────────────────────────────
const wizardStep = ref<"config" | "check" | "install">("config");

// ─── Config state ───────────────────────────────────────────

const selectedPreset = ref<SoftwarePreset | null>(null);
const serviceName = ref("");
const serviceNameError = ref("");
watch(serviceName, () => { serviceNameError.value = ""; });
const dockerImage = ref("");
const defaultImage = ref("");
const portMappings = ref<PortMapping[]>([]);
const dockerEnvEntries = ref<{ key: string; value: string; description?: string }[]>([]);
const dockerVolumeMappings = ref<VolumeMapping[]>([]);

// ─── Multi-server target selection ────────────────────────
const selectedTargetConnectionIds = ref<string[]>([]);

// When sshConnectionIds changes, default to selecting all
watch(() => props.sshConnectionIds, (ids) => {
  if (ids && ids.length > 0) {
    selectedTargetConnectionIds.value = [...ids];
  }
}, { immediate: true });

// Collapse state for Step 1 config: env vars collapse by default if > 4 entries
const configCollapseActive = ref<string[]>(["ports", "volumes"]);

watch(dockerEnvEntries, (entries) => {
  const hasEnv = configCollapseActive.value.includes("env");
  if (entries.length > 4 && hasEnv) {
    configCollapseActive.value = configCollapseActive.value.filter(n => n !== "env");
  } else if (entries.length <= 4 && !hasEnv) {
    configCollapseActive.value = [...configCollapseActive.value, "env"];
  }
}, { deep: true, immediate: true });

// Seccomp 安全选项开关
const enableSeccompUnconfined = ref(false);

// 镜像仓库列表和选择
const registryList = ref<DockerRegistry[]>([]);
const selectedRegistryId = ref<number | undefined>(undefined);
const enablePrivileged = ref(false);

// ─── Install state ──────────────────────────────────────────

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

// ─── Environment check state ────────────────────────────────

const envCheckStatus = ref<"idle" | "checking" | "pass" | "fail">("idle");
const envCheckLoading = ref(false);
const envCheckResults = ref<{ type: "success" | "error" | "warn" | "info"; text: string }[]>([]);
const envCheckData = ref<any>(null);

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
      sysProjectId: props.sysProjectId,
      excludeBindingId: binding.value?.sysProjectContainerSoftwareBindingId || undefined,
      connectionId: props.dockerConnectionId || undefined,
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

// 安装完成时自动展开日志
watch(installStatus, (val) => {
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
  runtimeLogSocket.disconnect();
});

// ─── Initialize from preset ─────────────────────────────────

const initializeFromPreset = (preset: SoftwarePreset) => {
  selectedPreset.value = preset;
  serviceName.value = preset.serviceName || preset.softwareCode || preset.softwareName || "";

  const sug = getPresetSuggestions(preset.softwareCode) || getPresetSuggestions(preset.softwareName);

  // Image - append default tag if image has no tag
  const presetImage = dockerImageFromRemark(preset);
  let rawImage = presetImage || sug?.image || "";
  if (rawImage && !rawImage.includes(":")) {
    const tags = sug?.tags || [];
    const versionTag = preset.softwareVersion || tags[0] || "";
    if (versionTag) rawImage += ":" + versionTag;
  }
  dockerImage.value = rawImage;
  defaultImage.value = rawImage;

  // Ports
  const portStr = preset.exposePorts || sug?.ports || "";
  portMappings.value = parsePortMappings(portStr);

  // Env vars
  dockerEnvEntries.value = [];
  const presetEnv = dockerEnvFromRemark(preset);
  const mergedEnv = { ...(sug?.env || {}), ...presetEnv };
  const presetDescs = dockerEnvDescsFromRemark(preset);
  const mergedDescs = { ...(sug?.envDescriptions || {}), ...presetDescs };
  for (const [key, value] of Object.entries(mergedEnv)) {
    dockerEnvEntries.value.push({ key, value: String(value), description: mergedDescs[key] });
  }

  // Volumes
  dockerVolumeMappings.value = [];
  const presetVols = dockerVolumesFromRemark(preset);
  const mergedVols = [...(presetVols.length > 0 ? presetVols : sug?.volumes || [])];
  for (const vol of mergedVols) {
    dockerVolumeMappings.value.push({ ...vol });
  }

  // Privileged mode from preset defaults
  try {
    const remark = JSON.parse(preset.presetRemark || "{}");
    if (remark.dockerDefaults?.privileged) {
      enablePrivileged.value = true;
    }
  } catch {}
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

const dockerEnvDescsFromRemark = (preset: SoftwarePreset): Record<string, string> => {
  try {
    const remark = JSON.parse(preset.presetRemark || "{}");
    return remark.dockerDefaults?.envDescriptions || {};
  } catch {
    return {};
  }
};

// ─── Go to env check step ──────────────────────────────────

const goToEnvCheck = () => {
  wizardStep.value = "check";
  runEnvCheck();
};

// ─── Environment check ──────────────────────────────────────

const runEnvCheck = async () => {
  const preset = selectedPreset.value;
  if (!preset || !serviceName.value.trim()) return;

  envCheckStatus.value = "checking";
  envCheckLoading.value = true;
  envCheckResults.value = [];

  const results: { type: "success" | "error" | "warn" | "info"; text: string }[] = [];
  const exposePorts = formatPortMappings(portMappings.value);

  try {
    const checkRes = await checkRequirements({
      exposePorts: exposePorts || undefined,
      softwareName: preset.softwareName,
      serviceName: serviceName.value,
      dockerImage: dockerImage.value || undefined,
      installMode: "DOCKER",
      sysProjectId: props.sysProjectId,
      excludeBindingId: binding.value?.sysProjectContainerSoftwareBindingId || undefined,
      connectionId: props.dockerConnectionId || undefined,
    });

    if (checkRes.code === "00000" && checkRes.data) {
      const data = checkRes.data;
      envCheckData.value = data;

      // Docker daemon
      if (data.daemonAvailable !== false) {
        results.push({ type: "success", text: `Docker 守护进程可连接${data.daemonMessage ? ' (' + data.daemonMessage + ')' : ''}` });
      } else {
        results.push({ type: "error", text: `Docker 守护进程不可达${data.daemonMessage ? ': ' + data.daemonMessage : ''}` });
      }

      // Docker image
      results.push({ type: data.imageAvailable !== false ? "success" : "warn", text: `Docker 镜像 ${dockerImage.value} ${data.imageAvailable !== false ? '存在' : '不存在（安装时自动拉取）'}` });

      // Port
      if (data.portAvailable) {
        results.push({ type: "success", text: `端口可用: ${exposePorts || '无'}` });
      } else if (data.conflictPorts?.length) {
        results.push({ type: "error", text: `端口冲突: ${data.conflictPorts.join(", ")}` });
      }

      // Service name
      if (data.serviceNameAvailable !== false) {
        results.push({ type: "success", text: `服务名称 "${serviceName.value}" 可用` });
      } else {
        results.push({ type: "error", text: `服务名称 "${serviceName.value}" 已被占用` });
      }

      // Container name
      if (data.containerNameAvailable !== false) {
        results.push({ type: "success", text: `Docker 容器名 "${serviceName.value}" 可用` });
      } else {
        results.push({ type: "error", text: `Docker 容器名 "${serviceName.value}" 已被占用` });
      }

      // Volumes
      if (data.conflictVolumes?.length) {
        results.push({ type: "warn", text: `卷路径冲突: ${data.conflictVolumes.join(", ")}` });
      }

      // Env vars
      const filledEnvs = dockerEnvEntries.value.filter(e => e.key?.trim());
      if (filledEnvs.length > 0) {
        results.push({ type: "success", text: `环境变量: ${filledEnvs.length} 个已配置` });
      }

      // Seccomp
      if (enableSeccompUnconfined.value) {
        results.push({ type: "info", text: "安全选项: seccomp=unconfined 已启用" });
      }

      // Determine pass/fail
      const errors = results.filter(r => r.type === "error");
      if (errors.length === 0) {
        envCheckStatus.value = "pass";
        results.push({ type: "success", text: "── 环境检查通过，可以安装 ──" });
      } else {
        envCheckStatus.value = "fail";
        results.push({ type: "info", text: `发现 ${errors.length} 个问题，请修复后重新检查` });
      }
    } else {
      envCheckStatus.value = "fail";
      results.push({ type: "error", text: `检查失败: ${checkRes.msg || "未知错误"}` });
    }
  } catch (e: any) {
    envCheckStatus.value = "fail";
    results.push({ type: "error", text: `检查异常: ${e?.message || "网络错误"}` });
  } finally {
    envCheckResults.value = results;
    envCheckLoading.value = false;
  }
};

// ─── Install flow (after env check passes) ──────────────────

const startInstall = async () => {
  const preset = selectedPreset.value;
  if (!preset || !serviceName.value.trim()) return;
  if (envCheckStatus.value !== "pass" && !props.quickInstall) return;

  const exposePorts = formatPortMappings(portMappings.value);

  wizardStep.value = "install";
  installStatus.value = "installing";
  installProgress.value = 0;
  installLogs.value = [];

  // Build Docker config once
  const env: Record<string, string> = {};
  for (const e of dockerEnvEntries.value) {
    if (e.key?.trim()) env[e.key.trim()] = e.value;
  }
  const vols = dockerVolumeMappings.value.filter((v) => v.hostPath && v.containerPath);

  const fullBindingRemark = JSON.stringify({
    installMode: "DOCKER",
    serviceName: serviceName.value,
    dockerImage: dockerImage.value,
    dockerEnv: env,
    dockerVolumeMappings: vols,
    dockerPortMappings: portMappings.value.filter(p => p.hostPort > 0 || p.containerPort > 0),
    port: exposePorts,
    ...(enableSeccompUnconfined.value ? { dockerSecurityOpts: ["seccomp=unconfined"] } : {}),
    ...(enablePrivileged.value ? { privileged: true } : {}),
    ...(selectedRegistryId.value ? { registryId: selectedRegistryId.value } : {}),
  });

  // Print config to log
  if (exposePorts) pushLog(`[配置] 端口映射: ${exposePorts}`);
  for (const e of dockerEnvEntries.value.filter((e) => e.key?.trim())) {
    const desc = e.description ? ` (${e.description})` : '';
    pushLog(`[配置] 环境变量: ${e.key}=${e.value}${desc}`);
  }
  for (const v of vols) {
    pushLog(`[配置] 卷映射: ${v.hostPath} → ${v.containerPath}${v.readOnly ? " (只读)" : ""}`);
  }
  pushLog(`[配置] 服务名称: ${serviceName.value}`);
  pushLog(`[配置] Docker 镜像: ${dockerImage.value}`);
  if (enablePrivileged.value) pushLog(`[配置] 特权模式: --privileged 已启用`);
  if (selectedRegistryId.value) {
    const reg = registryList.value.find(r => r.id === selectedRegistryId.value);
    if (reg) pushLog(`[配置] 镜像仓库: ${reg.registryName} (${reg.registryUrl})`);
  }

  // ─── 多服务器批量安装 ─────────────────────────────────────
  const effectiveTargets = selectedTargetConnectionIds.value.length > 0
    ? selectedTargetConnectionIds.value
    : [props.sshConnectionId];

  if (effectiveTargets.length > 1) {
    try {
      pushLog("[信息] 正在批量导入预设并安装...");

      const serverNames = effectiveTargets.map(connId => {
        const src = (props.sshSources || []).find(s => (s.connectionId || "") === connId);
        return src ? `${src.connectionName || src.host}:${src.port}` : connId.substring(0, 8);
      });
      pushLog(`[批量安装] 正在向 ${effectiveTargets.length} 台服务器安装: ${serverNames.join(", ")}`);

      const batchRes = await batchOperate({
        sysProjectId: props.sysProjectId,
        sysProjectContainerSoftwarePresetId: preset.sysProjectContainerSoftwarePresetId!,
        action: "INSTALL",
        targets: effectiveTargets.map((connId, i) => ({
          connectionId: connId,
          serviceName: serviceName.value,
          exposePorts: exposePorts || preset.exposePorts,
          bindingRemark: fullBindingRemark,
        })),
      });

      if (batchRes.code === "00000") {
        const results = batchRes.data || [];
        let successCount = 0;
        let failCount = 0;
        results.forEach((r: any, i: number) => {
          const name = serverNames[i] || `服务器${i + 1}`;
          if (r.success !== false) {
            pushLog(`[成功] ${name}: 安装任务已提交`);
            successCount++;
          } else {
            pushLog(`[错误] ${name}: ${r.error || "安装失败"}`);
            failCount++;
          }
        });
        if (failCount === 0) {
          pushLog(`[完成] 全部 ${successCount} 台服务器安装任务已提交`);
        } else {
          pushLog(`[完成] ${successCount} 台成功, ${failCount} 台失败`);
          if (successCount === 0) installStatus.value = "error";
        }
        emit("installed", {} as SoftwareBinding);
        emit("install-start", preset.softwareName || "");
      } else {
        installStatus.value = "error";
        pushLog(`[错误] 批量安装失败: ${batchRes.msg || "未知错误"}`);
      }
    } catch (err: any) {
      installStatus.value = "error";
      pushLog(`[错误] ${err?.message || "批量安装过程异常"}`);
    }
    return;
  }

  // ─── 单服务器安装（原有逻辑）──────────────────────────────
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

    // 保留 Dockerfile 模式需要的字段（后端 addBindingByPreset 从 preset.install_script 设置）
    let savedDockerfileContent: string | undefined;
    let savedDockerMode: string | undefined;
    try {
      const savedRemark = JSON.parse(savedBinding.bindingRemark || '{}');
      if (savedRemark.dockerfileContent) savedDockerfileContent = savedRemark.dockerfileContent;
      if (savedRemark.dockerMode) savedDockerMode = savedRemark.dockerMode;
    } catch {}

    const updatePayload: Partial<SoftwareBinding> = {
      sysProjectContainerSoftwareBindingId: savedBinding.sysProjectContainerSoftwareBindingId,
      exposePorts: exposePorts || preset.exposePorts,
      serviceName: serviceName.value,
      bindingRemark: JSON.stringify({
        ...JSON.parse(fullBindingRemark),
        ...(savedDockerMode ? { dockerMode: savedDockerMode } : {}),
        ...(savedDockerfileContent ? { dockerfileContent: savedDockerfileContent } : {}),
      }),
    };

    await updateBinding(updatePayload);
    binding.value = { ...savedBinding, ...updatePayload };

    const singleConnId = effectiveTargets[0] || props.sshConnectionId;
    const opRes = await operateBinding({
      sysProjectContainerSoftwareBindingId: savedBinding.sysProjectContainerSoftwareBindingId!,
      action: "INSTALL",
      connectionId: singleConnId || undefined,
    });

    if (opRes.code === "00000") {
      const ticket = opRes.data;
      pushLog("[成功] 安装任务已提交");
      if (ticket?.operationId) {
        lastOperationId.value = ticket.operationId;
      }
      emit("installed", savedBinding);
      emit("install-start", preset.softwareName || "");
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
  wizardStep.value = "config";
  envCheckStatus.value = "idle";
  envCheckResults.value = [];
  envCheckData.value = null;
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
  wizardStep.value = "config";
  envCheckStatus.value = "idle";
  envCheckResults.value = [];
  envCheckData.value = null;
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
  registryList.value = [];
  selectedRegistryId.value = undefined;
  enablePrivileged.value = false;
};

const loadRegistries = async () => {
  try {
    const res = await fetchRegistryList({ enabled: true });
    if (res.code === "00000") {
      registryList.value = res.data || [];
    }
  } catch { /* ignore */ }
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
  async (val) => {
    if (val) {
      runtimeLogSocket.connect();
      await loadRegistries();
      if (props.initialPreset) {
        initializeFromPreset(props.initialPreset);
        // Quick install: skip config dialog, start install immediately
        if (props.quickInstall) {
          wizardStep.value = "install";
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

/* ── Check Dialog ── */

.check-page {
  padding: 0 4px;
}

.check-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  margin-bottom: 16px;
}

.check-header-info {
  min-width: 0;
}

.check-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.check-subtitle {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.check-body {
  min-height: 180px;
}

.check-section-title {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
}

.check-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.check-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  line-height: 1.5;
  padding: 6px 8px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
}

.check-item-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.check-item-text {
  min-width: 0;
}

.check-item--success { color: #16a34a; }
.check-item--error   { color: #dc2626; }
.check-item--warn    { color: #d97706; }
.check-item--info    { color: var(--el-text-color-secondary); }

.check-item--loading {
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ── Config footer buttons ── */

.config-footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.config-footer-right {
  display: flex;
  gap: 8px;
}

/* ── Collapse sections in Step 1 ── */

.config-collapse {
  width: 100%;
}
.config-collapse :deep(.el-collapse-item__header) {
  font-size: 13px;
  font-weight: 600;
  padding-left: 4px;
}
.config-collapse :deep(.el-collapse-item__content) {
  padding-bottom: 8px;
}

/* ── Env var description text ── */

.kv-env-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
}
.kv-env-inputs {
  display: flex;
  align-items: center;
  gap: 6px;
}
.kv-env-desc {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  padding-left: 4px;
  line-height: 1.4;
}

/* ── Seccomp option toggle ── */

.seccomp-option {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}
.seccomp-option-inner {
  display: flex;
  align-items: center;
  gap: 8px;
}
.seccomp-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ── Config option row (registry selector) ── */

.config-option-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}
.config-option-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  min-width: 70px;
}

/* ── Server selection section ── */

.server-select-section {
  margin-top: 16px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}
.server-select-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}
.server-select-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}
.server-select-item {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--el-bg-color);
  border: 1px solid transparent;
  transition: all 0.2s ease;
  cursor: pointer;
}
.server-select-item:hover {
  border-color: var(--el-color-primary-light-7);
  background: var(--el-color-primary-light-9);
}
.server-select-item.checked {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}
.server-select-item-name {
  font-size: 13px;
  font-weight: 500;
  margin-left: 4px;
}

html.dark .server-select-section {
  background: rgba(30, 35, 55, 0.6);
  border-color: rgba(148, 163, 184, 0.12);
}
html.dark .server-select-item {
  background: rgba(20, 25, 45, 0.5);
}
html.dark .server-select-item:hover,
html.dark .server-select-item.checked {
  background: rgba(99, 102, 241, 0.12);
}
</style>
