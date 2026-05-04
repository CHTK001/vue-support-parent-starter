<template>
  <ElDialog
    v-model="wizardVisible"
    title="软件安装向导"
    width="860px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div class="wizard-steps">
      <div
        v-for="(step, idx) in steps"
        :key="idx"
        class="wizard-step"
        :class="{ active: currentStep === idx, completed: currentStep > idx }"
      >
        <div class="step-indicator">
          <IconifyIconOnline v-if="currentStep > idx" icon="ep:check" />
          <span v-else>{{ idx + 1 }}</span>
        </div>
        <span class="step-label">{{ step }}</span>
      </div>
    </div>

    <div class="wizard-body">
      <div v-if="currentStep === 0" class="step-content">
        <h4 class="step-title">选择要安装的软件</h4>
        <ElInput
          v-model="presetSearch"
          placeholder="搜索软件..."
          clearable
          style="margin-bottom: 12px"
        />
        <div class="preset-select-list">
          <div
            v-for="preset in filteredPresets"
            :key="preset.sysProjectContainerSoftwarePresetId"
            class="preset-select-item"
            :class="{ selected: selectedPreset?.sysProjectContainerSoftwarePresetId === preset.sysProjectContainerSoftwarePresetId }"
            @click="handleSelectPreset(preset)"
          >
            <IconifyIconOnline
              :icon="preset.softwareIcon || 'ep:box'"
              style="font-size: 24px"
            />
            <div>
              <div class="preset-item-name">{{ preset.softwareName }}</div>
              <div class="preset-item-version">{{ preset.softwareVersion }}</div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="currentStep === 1 && selectedPreset" class="step-content">
        <div class="step-header">
          <h4 class="step-title" style="margin: 0">
            基础信息
            <ElTag
              size="small"
              :type="activeMode === 'DOCKER' ? 'warning' : 'info'"
              style="margin-left: 8px"
            >
              {{ activeMode === "DOCKER" ? "Docker" : "System" }}
            </ElTag>
          </h4>
        </div>

        <ElForm label-width="140px" label-position="top">
          <ElFormItem label="安装模式" required>
            <div class="mode-select">
              <div
                class="mode-card"
                :class="{ selected: activeMode === 'SYSTEM' }"
                @click="activateMode('SYSTEM')"
              >
                <IconifyIconOnline icon="ep:monitor" style="font-size: 28px" />
                <div>
                  <div class="mode-card-title">系统安装</div>
                  <div class="mode-card-desc">按系统服务方式安装，适合本机部署</div>
                </div>
              </div>
              <div
                class="mode-card"
                :class="{ selected: activeMode === 'DOCKER', disabled: dockerModeDisabled }"
                @click="activateMode('DOCKER')"
              >
                <IconifyIconOnline icon="ep:ship" style="font-size: 28px" />
                <div>
                  <div class="mode-card-title">Docker 安装</div>
                  <div class="mode-card-desc">按容器方式安装，支持多实例</div>
                </div>
              </div>
            </div>
            <div v-if="!presetSupportsDocker" class="form-tip">
              当前软件预设仅支持 System 安装，Docker 不作为此类环境软件的安装模式。
            </div>
            <div v-else-if="dockerUnavailable" class="form-tip">
              当前环境未检测到 Docker，可先维护预设，安装时暂不可选 Docker 模式。
            </div>
          </ElFormItem>

          <ElFormItem :label="activeMode === 'DOCKER' ? '容器名称' : '服务名称'" required>
            <ElInput
              v-model="activeDraft.serviceName"
              :placeholder="activeMode === 'DOCKER' ? 'Docker 容器名' : 'system 服务名'"
            />
          </ElFormItem>

          <ElFormItem label="安装路径">
            <ElInput
              v-model="activeDraft.installPath"
              :placeholder="`/usr/local/${selectedPreset.softwareCode || ''}`"
            />
          </ElFormItem>

          <ElFormItem label="端口映射">
            <div class="dynamic-list">
              <div
                v-for="(mapping, index) in activeDraft.portMappings"
                :key="`${activeMode}-${index}`"
                class="dynamic-list-row"
              >
                <ElInput
                  v-model="mapping.hostPort"
                  placeholder="主机端口"
                  style="width: 120px"
                  type="number"
                />
                <span style="color: var(--el-text-color-secondary)">:</span>
                <ElInput
                  v-model="mapping.containerPort"
                  placeholder="目标端口"
                  style="width: 120px"
                  type="number"
                />
                <ElButton
                  size="small"
                  type="danger"
                  :icon="Delete"
                  @click="activeDraft.portMappings.splice(index, 1)"
                />
              </div>
              <ElButton
                size="small"
                @click="activeDraft.portMappings.push({ hostPort: 0, containerPort: 0 })"
              >
                添加端口映射
              </ElButton>
            </div>
          </ElFormItem>

          <ElFormItem label="开机自启">
            <ElSwitch v-model="activeDraft.autoStart" />
          </ElFormItem>

          <ElFormItem v-if="hasConfigFields" label="配置字段">
            <div class="dynamic-field-list">
              <ElFormItem
                v-for="(field, idx) in configFieldDefs"
                :key="`${activeMode}-${field.fieldKey}-${idx}`"
                :label="field.fieldLabel"
                :required="field.requiredFlag"
                class="dynamic-field-item"
              >
                <ElInput
                  v-if="field.componentType === 'input' || field.componentType === 'password'"
                  v-model="activeDraft.dynamicValues[field.fieldKey]"
                  :type="field.componentType === 'password' ? 'password' : 'text'"
                  :placeholder="field.description || field.fieldLabel"
                />
                <ElInputNumber
                  v-else-if="field.componentType === 'number'"
                  v-model="activeDraft.dynamicValues[field.fieldKey]"
                  style="width: 100%"
                />
                <ElSwitch
                  v-else-if="field.componentType === 'switch'"
                  v-model="activeDraft.dynamicValues[field.fieldKey]"
                />
                <ElSelect
                  v-else-if="field.componentType === 'select'"
                  v-model="activeDraft.dynamicValues[field.fieldKey]"
                  :placeholder="field.description"
                >
                  <ElOption
                    v-for="opt in field.options || []"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </ElSelect>
                <div v-if="field.description" class="form-tip">{{ field.description }}</div>
              </ElFormItem>
            </div>
          </ElFormItem>
        </ElForm>
      </div>

      <div v-if="currentStep === 2 && selectedPreset" class="step-content">
        <div class="step-header">
          <div>
            <h4 class="step-title" style="margin: 0">
              脚本配置
              <ElTag
                size="small"
                :type="activeMode === 'DOCKER' ? 'warning' : 'info'"
                style="margin-left: 8px"
              >
                {{ activeMode === "DOCKER" ? "Docker" : "System" }}
              </ElTag>
            </h4>
            <div class="form-tip" style="margin-top: 8px">
              当前编辑的是本次安装任务的脚本副本，不会改动软件预设；恢复默认将回到预设脚本内容。
            </div>
          </div>
          <ElButton plain @click="restoreModeScriptsToPreset">恢复默认脚本</ElButton>
        </div>

        <ElAlert
          v-if="activeMode === 'SYSTEM'"
          title="System 模式必须完整填写安装、启动、停止、重启、状态、卸载脚本。"
          type="info"
          :closable="false"
          style="margin-bottom: 12px"
        />
        <ElAlert
          v-else
          title="Docker 模式必须完整填写六类脚本；若选择 Dockerfile 模式，还必须填写 Dockerfile 内容。"
          type="warning"
          :closable="false"
          style="margin-bottom: 12px"
        />

        <ElForm label-width="140px" label-position="top">
          <template v-if="activeMode === 'DOCKER'">
            <ElFormItem label="Docker 执行方式" required>
              <ElRadioGroup v-model="dockerDraft.scriptMode">
                <ElRadio value="script">脚本</ElRadio>
                <ElRadio value="dockerfile">Dockerfile</ElRadio>
              </ElRadioGroup>
            </ElFormItem>

            <ElFormItem label="Docker 镜像名" required>
              <ElInput
                v-model="dockerDraft.dockerImage"
                placeholder="预设会给默认值，用户可按需修改"
              />
              <div class="form-tip">
                默认取软件预设中的 Docker 镜像名，你可以在当前安装任务里覆盖。
              </div>
            </ElFormItem>

            <ElFormItem v-if="dockerDraft.scriptMode === 'dockerfile'" label="Dockerfile" required>
              <ScScriptEditor
                v-model="dockerDraft.dockerfileContent"
                language="dockerfile"
                label="Dockerfile"
                dialog-title="Dockerfile"
              />
            </ElFormItem>
          </template>

          <ElTabs v-model="scriptEditorTab" type="card">
            <ElTabPane
              v-for="item in scriptTabItems"
              :key="item.key"
              :label="item.label"
              :name="item.key"
            >
              <ScScriptEditor
                v-model="activeDraft.scripts[item.key]"
                language="shell"
                :label="item.label"
                :dialog-title="item.label"
              />
            </ElTabPane>
          </ElTabs>
        </ElForm>
      </div>

      <div v-if="currentStep === 3" class="step-content">
        <h4 class="step-title">安装前检查</h4>
        <div v-if="checking" class="checking">
          <ElIcon class="is-loading"><Loading /></ElIcon>
          <span>检查安装条件...</span>
        </div>
        <div v-else-if="checkResult" class="check-result">
          <div class="check-item" :class="checkResult.portAvailable ? 'pass' : 'fail'">
            <IconifyIconOnline
              :icon="checkResult.portAvailable ? 'ep:success-filled' : 'ep:warning-filled'"
            />
            <span>
              端口检查：{{
                checkResult.portAvailable
                  ? "可用"
                  : "冲突端口: " + (checkResult.conflictPorts?.join(", ") || "未知")
              }}
            </span>
          </div>
          <div class="check-item" :class="!checkResult.alreadyInstalled ? 'pass' : 'warn'">
            <IconifyIconOnline
              :icon="!checkResult.alreadyInstalled ? 'ep:success-filled' : 'ep:warning-filled'"
            />
            <span>
              安装检测：{{
                checkResult.alreadyInstalled
                  ? "已安装（可继续重装）"
                  : activeMode === "DOCKER"
                    ? "未安装（Docker 允许多实例）"
                    : "未安装"
              }}
            </span>
          </div>
          <div
            class="check-item"
            :class="checkResult.serviceNameAvailable !== false ? 'pass' : 'fail'"
          >
            <IconifyIconOnline
              :icon="checkResult.serviceNameAvailable !== false ? 'ep:success-filled' : 'ep:warning-filled'"
            />
            <span>
              服务名检查：{{
                checkResult.serviceNameAvailable !== false ? "可用" : "服务名已存在"
              }}
            </span>
          </div>
          <div class="check-item pass">
            <IconifyIconOnline icon="ep:success-filled" />
            <span>目标系统：{{ checkResult.serverOs || "未知" }}</span>
          </div>
        </div>
      </div>

      <div v-if="currentStep === 4" class="step-content">
        <h4 class="step-title">正在安装...</h4>
        <ElProgress
          :percentage="installProgress"
          :status="
            installStatus === 'error'
              ? 'exception'
              : installStatus === 'success'
                ? 'success'
                : undefined
          "
          :stroke-width="12"
          style="margin-bottom: 16px"
        />
        <div class="install-log">
          <div v-for="(line, idx) in installLogs" :key="idx" class="log-line">
            {{ stripAnsi(line) }}
          </div>
          <div v-if="installLogs.length === 0" class="log-placeholder">等待安装日志...</div>
        </div>
      </div>
    </div>

    <template #footer>
      <ElButton
        v-if="currentStep > 0 && currentStep < steps.length - 1 && installStatus !== 'installing'"
        @click="prevStep"
      >
        上一步
      </ElButton>
      <ElButton v-if="currentStep < steps.length - 2" type="primary" @click="nextStep">
        下一步
      </ElButton>
      <ElButton v-if="currentStep === steps.length - 2" type="primary" @click="nextStep">
        开始安装
      </ElButton>
      <template v-if="currentStep === steps.length - 1">
        <template v-if="installStatus === 'installing'">
          <ElButton type="danger" @click="handleCancel">取消安装</ElButton>
        </template>
        <template v-else>
          <ElButton
            v-if="installStatus === 'error'"
            type="warning"
            @click="handleAiAnalyze"
            :loading="aiAnalyzing"
          >
            AI 分析失败原因
          </ElButton>
          <ElButton v-if="installStatus === 'error'" type="primary" @click="handleRetry">
            重试安装
          </ElButton>
          <ElButton v-if="installStatus === 'success'" type="primary" @click="handleFinish">
            完成
          </ElButton>
          <ElButton @click="handleFinish">关闭</ElButton>
        </template>
      </template>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { computed, onMounted, onScopeDispose, ref, watch } from "vue";
import {
  ElAlert,
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElIcon,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElProgress,
  ElRadio,
  ElRadioGroup,
  ElSelect,
  ElSwitch,
  ElTag,
} from "element-plus";
import { Delete, Loading } from "@element-plus/icons-vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import ScScriptEditor from "@repo/components/ScScriptEditor";
import {
  aiAnalyzeFailure,
  checkRequirements,
  createEmptyScriptSet,
  fetchPresetList,
  getPresetModeConfigFields,
  getPresetSupportedModes,
  getPresetModeScripts,
  importPreset,
  normalizeDockerScriptMode,
  operateBinding,
  parseSoftwarePresetRemark,
  updateBinding,
  type ConfigFieldDef,
  type DockerScriptMode,
  type InstallMode,
  type SoftwareBinding,
  type SoftwarePreset,
  type SoftwareScriptSet,
} from "../../api/software";
import { useSoftwareInstallSocket } from "./useSoftwareInstallSocket";

type ScriptFieldKey = keyof SoftwareScriptSet;
type PortMapping = { hostPort: number; containerPort: number };
type VolumeMapping = { hostPath: string; containerPath: string; readOnly: boolean };
type DraftMode = InstallMode;

interface BaseModeDraft {
  initialized: boolean;
  serviceName: string;
  installPath: string;
  autoStart: boolean;
  portMappings: PortMapping[];
  dynamicValues: Record<string, any>;
  scripts: SoftwareScriptSet;
}

interface SystemModeDraft extends BaseModeDraft {}

interface DockerModeDraft extends BaseModeDraft {
  dockerImage: string;
  scriptMode: DockerScriptMode;
  dockerfileContent: string;
  dockerRegistryId: number | null;
  dockerNetwork: string;
  dockerEnvEntries: { key: string; value: string }[];
  dockerVolumeMappings: VolumeMapping[];
}

const scriptTabItems: { key: ScriptFieldKey; label: string }[] = [
  { key: "installScript", label: "安装脚本" },
  { key: "startScript", label: "启动脚本" },
  { key: "stopScript", label: "停止脚本" },
  { key: "restartScript", label: "重启脚本" },
  { key: "statusScript", label: "状态检测脚本" },
  { key: "uninstallScript", label: "卸载脚本" },
];

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    initialPreset?: SoftwarePreset | null;
    initialBinding?: SoftwareBinding | null;
    sysProjectId?: number;
    dockerAvailable?: boolean;
  }>(),
  { initialPreset: null, initialBinding: null, sysProjectId: 1, dockerAvailable: true },
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

const steps = ["选择软件", "基础信息", "脚本配置", "安装检查", "执行安装"];
const currentStep = ref(0);
const presetSearch = ref("");
const presets = ref<SoftwarePreset[]>([]);
const selectedPreset = ref<SoftwarePreset | null>(null);
const checking = ref(false);
const checkResult = ref<any>(null);
const installProgress = ref(0);
const installStatus = ref<"idle" | "installing" | "success" | "error">("idle");
const installLogs = ref<string[]>([]);
const binding = ref<SoftwareBinding | null>(null);
const aiAnalyzing = ref(false);
const lastOperationId = ref("");
const activeMode = ref<DraftMode>("SYSTEM");
const scriptEditorTab = ref<ScriptFieldKey>("installScript");

const createBaseDraft = (): BaseModeDraft => ({
  initialized: false,
  serviceName: "",
  installPath: "",
  autoStart: false,
  portMappings: [],
  dynamicValues: {},
  scripts: createEmptyScriptSet(),
});

const createSystemDraft = (): SystemModeDraft => ({
  ...createBaseDraft(),
});

const createDockerDraft = (): DockerModeDraft => ({
  ...createBaseDraft(),
  dockerImage: "",
  scriptMode: "script",
  dockerfileContent: "",
  dockerRegistryId: null,
  dockerNetwork: "bridge",
  dockerEnvEntries: [],
  dockerVolumeMappings: [],
});

const systemDraft = ref<SystemModeDraft>(createSystemDraft());
const dockerDraft = ref<DockerModeDraft>(createDockerDraft());

const installSocket = useSoftwareInstallSocket();

const dockerUnavailable = computed(() => props.dockerAvailable === false);
const presetSupportsDocker = computed(() =>
  getPresetSupportedModes(selectedPreset.value).includes("DOCKER"),
);
const dockerModeDisabled = computed(
  () => dockerUnavailable.value || !presetSupportsDocker.value,
);

const activeDraft = computed<BaseModeDraft>(() =>
  activeMode.value === "DOCKER" ? dockerDraft.value : systemDraft.value,
);

const configFieldDefs = computed<ConfigFieldDef[]>(() =>
  getPresetModeConfigFields(selectedPreset.value, activeMode.value),
);

const hasConfigFields = computed(() => configFieldDefs.value.length > 0);

const filteredPresets = computed(() => {
  if (!presetSearch.value) return presets.value;
  const kw = presetSearch.value.toLowerCase();
  return presets.value.filter(
    (p) =>
      p.softwareName?.toLowerCase().includes(kw) ||
      p.softwareCode?.toLowerCase().includes(kw),
  );
});

const parseBindingRemarkSafe = (remark?: string | null): Record<string, any> => {
  if (!remark) return {};
  try {
    const parsed = JSON.parse(remark);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const stripAnsi = (str: string) =>
  str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "").replace(/\x1B\][0-9;]*[a-zA-Z]/g, "");

watch(installSocket.lines, (newLines) => {
  if (newLines.length > 0) {
    const prefixLen = installLogs.value.findIndex((l) =>
      l.startsWith("[信息] 正在连接实时日志"),
    );
    const prefix = prefixLen >= 0 ? installLogs.value.slice(0, prefixLen + 1) : [];
    installLogs.value = [...prefix, ...newLines];
  }
});

watch(installSocket.progress, (val) => {
  if (val > 0) {
    installProgress.value = val;
    emit("install-progress", val);
  }
});

watch(installSocket.resultStatus, (status) => {
  if (status === "success") {
    installStatus.value = "success";
    installProgress.value = 100;
    emit("install-progress", 100);
    emit("install-complete", selectedPreset.value?.softwareName || "", true);
  } else if (status === "error") {
    installStatus.value = "error";
    emit("install-complete", selectedPreset.value?.softwareName || "", false);
  }
});

onScopeDispose(() => {
  installSocket.disconnect();
});

const parsePortMappings = (exposePorts: string): PortMapping[] => {
  if (!exposePorts) return [];
  return exposePorts
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      if (p.includes(":")) {
        const [hostPort, containerPort] = p.split(":");
        return {
          hostPort: parseInt(hostPort) || 0,
          containerPort: parseInt(containerPort) || 0,
        };
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

const buildDynamicDefaults = (mode: InstallMode) => {
  const values: Record<string, any> = {};
  const fields = getPresetModeConfigFields(selectedPreset.value, mode);
  for (const field of fields) {
    if (field.defaultValue !== undefined) {
      values[field.fieldKey] = field.defaultValue;
    } else if (field.componentType === "switch") {
      values[field.fieldKey] = false;
    } else {
      values[field.fieldKey] = "";
    }
  }
  return values;
};

const mergeDynamicValues = (
  defaults: Record<string, any>,
  source?: Record<string, any>,
) => {
  if (!source) return defaults;
  return {
    ...defaults,
    ...source,
  };
};

const initializeModeDraftFromPreset = (
  mode: InstallMode,
  options?: {
    force?: boolean;
    bindingRemark?: Record<string, any>;
    bindingData?: SoftwareBinding | null;
  },
) => {
  const preset = selectedPreset.value;
  if (!preset) return;
  const force = !!options?.force;
  const remark = parseSoftwarePresetRemark(preset.presetRemark);
  const bindingRemark = options?.bindingRemark || {};
  const bindingData = options?.bindingData || null;

  if (mode === "SYSTEM") {
    if (systemDraft.value.initialized && !force) return;
    const defaults = buildDynamicDefaults("SYSTEM");
    systemDraft.value = {
      initialized: true,
      serviceName:
        bindingRemark.serviceName ||
        bindingData?.serviceName ||
        preset.serviceName ||
        preset.softwareCode ||
        preset.softwareName ||
        "",
      installPath: bindingData?.installPath || preset.installPath || "",
      autoStart: !!bindingRemark.autoStart,
      portMappings: parsePortMappings(bindingData?.exposePorts || preset.exposePorts || ""),
      dynamicValues: mergeDynamicValues(defaults, bindingRemark.dynamicValues),
      scripts:
        bindingRemark.modeScripts?.SYSTEM
          ? { ...createEmptyScriptSet(), ...bindingRemark.modeScripts.SYSTEM }
          : getPresetModeScripts(preset, "SYSTEM"),
    };
    return;
  }

  if (dockerDraft.value.initialized && !force) return;
  const defaults = buildDynamicDefaults("DOCKER");
  dockerDraft.value = {
    initialized: true,
    serviceName:
      bindingRemark.serviceName ||
      bindingData?.serviceName ||
      preset.serviceName ||
      preset.softwareCode ||
      preset.softwareName ||
      "",
    installPath: bindingData?.installPath || preset.installPath || "",
    autoStart: !!bindingRemark.autoStart,
    portMappings: parsePortMappings(bindingData?.exposePorts || preset.exposePorts || ""),
    dynamicValues: mergeDynamicValues(defaults, bindingRemark.dynamicValues),
    scripts:
      bindingRemark.modeScripts?.DOCKER
        ? { ...createEmptyScriptSet(), ...bindingRemark.modeScripts.DOCKER }
        : getPresetModeScripts(preset, "DOCKER"),
    dockerImage:
      bindingRemark.dockerImage || remark.dockerDefaults?.image || "",
    scriptMode: normalizeDockerScriptMode(
      bindingRemark.dockerMode || remark.dockerDefaults?.scriptMode,
    ),
    dockerfileContent:
      bindingRemark.dockerfileContent ||
      remark.dockerDefaults?.dockerfileContent ||
      "",
    dockerRegistryId:
      bindingRemark.dockerRegistryId !== undefined
        ? bindingRemark.dockerRegistryId
        : null,
    dockerNetwork: bindingRemark.dockerNetwork || "bridge",
    dockerEnvEntries: Object.entries(bindingRemark.dockerEnv || {}).map(
      ([key, value]) => ({ key, value: String(value) }),
    ),
    dockerVolumeMappings: (bindingRemark.dockerVolumeMappings || []).map(
      (item: any) => ({
        hostPath: item.hostPath || "",
        containerPath: item.containerPath || "",
        readOnly: !!item.readOnly,
      }),
    ),
  };
};

const activateMode = (mode: InstallMode) => {
  if (mode === "DOCKER" && !presetSupportsDocker.value) {
    ElMessage.warning("当前软件预设仅支持 System 安装");
    return;
  }
  if (mode === "DOCKER" && dockerUnavailable.value) {
    ElMessage.warning("当前环境未检测到 Docker，无法选择 Docker 安装模式");
    return;
  }
  initializeModeDraftFromPreset(mode);
  activeMode.value = mode;
};

watch(
  () => props.dockerAvailable,
  (available) => {
    if (available !== false) {
      return;
    }
    if (activeMode.value === "DOCKER") {
      activeMode.value = "SYSTEM";
    }
  },
  { immediate: true },
);

const handleSelectPreset = (preset: SoftwarePreset) => {
  selectedPreset.value = preset;
};

const restoreModeScriptsToPreset = () => {
  const preset = selectedPreset.value;
  if (!preset) return;
  const defaultScripts = getPresetModeScripts(preset, activeMode.value);
  activeDraft.value.scripts = { ...defaultScripts };
  if (activeMode.value === "DOCKER" && dockerDraft.value.scriptMode === "dockerfile") {
    const remark = parseSoftwarePresetRemark(preset.presetRemark);
    dockerDraft.value.dockerfileContent = remark.dockerDefaults?.dockerfileContent || "";
  }
  ElMessage.success("已恢复当前模式的预设默认脚本");
};

const getActivePortString = () => formatPortMappings(activeDraft.value.portMappings);

const validateBaseConfig = () => {
  if (!activeDraft.value.serviceName?.trim()) {
    ElMessage.warning("请填写服务名称");
    return false;
  }
  return true;
};

const validateScripts = () => {
  for (const item of scriptTabItems) {
    if (!activeDraft.value.scripts[item.key]?.trim()) {
      ElMessage.warning(`请填写${item.label}`);
      return false;
    }
  }
  if (activeMode.value === "DOCKER") {
    if (!dockerDraft.value.dockerImage.trim()) {
      ElMessage.warning("请填写 Docker 镜像名");
      return false;
    }
    if (
      dockerDraft.value.scriptMode === "dockerfile" &&
      !dockerDraft.value.dockerfileContent.trim()
    ) {
      ElMessage.warning("请填写 Dockerfile 内容");
      return false;
    }
  }
  return true;
};

const runCheck = async () => {
  checking.value = true;
  try {
    const res = await checkRequirements({
      exposePorts: getActivePortString(),
      softwareName: selectedPreset.value?.softwareName,
      serviceName: activeDraft.value.serviceName,
      installMode: activeMode.value,
    });
    if (res.code === "00000") {
      checkResult.value = res.data;
    } else {
      checkResult.value = {
        portAvailable: true,
        alreadyInstalled: false,
        serverOs: "linux",
      };
    }
  } catch {
    checkResult.value = {
      portAvailable: true,
      alreadyInstalled: false,
      serverOs: "linux",
    };
  } finally {
    checking.value = false;
  }
};

const buildBindingRemark = () => {
  const active = activeDraft.value;
  const modeScripts = {
    SYSTEM: { ...systemDraft.value.scripts },
    DOCKER: { ...dockerDraft.value.scripts },
  };
  const remark: Record<string, any> = {
    installMode: activeMode.value,
    port: getActivePortString(),
    autoStart: active.autoStart,
    serviceName: active.serviceName,
    dynamicValues: { ...active.dynamicValues },
    modeScripts,
  };
  if (activeMode.value === "DOCKER") {
    const env: Record<string, string> = {};
    for (const entry of dockerDraft.value.dockerEnvEntries) {
      if (entry.key?.trim()) {
        env[entry.key.trim()] = entry.value;
      }
    }
    remark.dockerMode = dockerDraft.value.scriptMode;
    remark.dockerImage = dockerDraft.value.dockerImage;
    remark.dockerRegistryId = dockerDraft.value.dockerRegistryId;
    remark.dockerNetwork = dockerDraft.value.dockerNetwork;
    remark.dockerfileContent = dockerDraft.value.dockerfileContent;
    remark.dockerEnv = env;
    remark.dockerVolumeMappings = dockerDraft.value.dockerVolumeMappings.filter(
      (item) => item.hostPath && item.containerPath,
    );
    remark.dockerPortMappings = dockerDraft.value.portMappings.filter(
      (item) => item.hostPort && item.containerPort,
    );
  }
  return remark;
};

const startInstall = async () => {
  if (!selectedPreset.value) return;
  installStatus.value = "installing";
  installProgress.value = 0;
  installLogs.value = [];
  try {
    const preset = selectedPreset.value;
    const active = activeDraft.value;
    const exposePorts = getActivePortString();

    installLogs.value.push("[信息] 正在导入预设...");
    const importRemark = {
      installMode: activeMode.value,
      serviceName: active.serviceName,
      port: exposePorts,
    };
    const importRes = await importPreset({
      sysProjectId: props.sysProjectId,
      sysProjectContainerSoftwarePresetId: preset.sysProjectContainerSoftwarePresetId!,
      serviceName: active.serviceName,
      exposePorts: exposePorts || preset.exposePorts,
      bindingRemark: JSON.stringify(importRemark),
    });
    if (importRes.code !== "00000") {
      installStatus.value = "error";
      installLogs.value.push(`[错误] 导入预设失败: ${importRes.msg}`);
      binding.value = {
        softwareName: preset.softwareName,
        softwareCode: preset.softwareCode,
        softwareVersion: preset.softwareVersion,
      } as SoftwareBinding;
      return;
    }

    let savedBinding = importRes.data!;
    const updatePayload: Partial<SoftwareBinding> = {
      sysProjectContainerSoftwareBindingId: savedBinding.sysProjectContainerSoftwareBindingId,
      exposePorts: exposePorts || preset.exposePorts,
      installPath: active.installPath || preset.installPath,
      serviceName: active.serviceName,
      installScript: active.scripts.installScript,
      startScript: active.scripts.startScript,
      stopScript: active.scripts.stopScript,
      restartScript: active.scripts.restartScript,
      statusScript: active.scripts.statusScript,
      uninstallScript: active.scripts.uninstallScript,
      bindingRemark: JSON.stringify(buildBindingRemark()),
    };

    const updateRes = await updateBinding(updatePayload);
    if (updateRes.code !== "00000") {
      installLogs.value.push(`[警告] 更新配置失败: ${updateRes.msg}，将使用默认配置`);
    } else {
      installLogs.value.push("[信息] 配置与脚本已更新");
      savedBinding = { ...savedBinding, ...updatePayload };
    }

    binding.value = savedBinding;
    const opRes = await operateBinding({
      sysProjectContainerSoftwareBindingId: savedBinding.sysProjectContainerSoftwareBindingId!,
      action: "INSTALL",
    });
    if (opRes.code === "00000") {
      const ticket = opRes.data;
      installLogs.value.push("[成功] 安装任务已提交");
      installLogs.value.push(`[信息] 任务ID: ${ticket?.operationId}`);
      if (ticket?.message) {
        installLogs.value.push(`[信息] ${ticket.message}`);
      }
      if (ticket?.operationId) {
        lastOperationId.value = ticket.operationId;
        installLogs.value.push("[信息] 正在连接实时日志...");
        installSocket.connect(ticket.operationId);
      }
      emit("installed", savedBinding);
      emit("install-start", savedBinding.softwareName || preset.softwareName || "");
      return;
    }
    installStatus.value = "error";
    installLogs.value.push(`[错误] ${opRes.msg || "安装失败"}`);
    emit("install-complete", preset.softwareName || "", false);
  } catch (err: any) {
    installStatus.value = "error";
    installLogs.value.push(`[错误] ${err?.message || "安装过程异常"}`);
  }
};

const nextStep = async () => {
  if (currentStep.value === 0) {
    if (!selectedPreset.value) {
      ElMessage.warning("请选择一个软件预设");
      return;
    }
    const initialBindingRemark = parseBindingRemarkSafe(props.initialBinding?.bindingRemark);
    initializeModeDraftFromPreset("SYSTEM", {
      force: true,
      bindingRemark: initialBindingRemark,
      bindingData: props.initialBinding,
    });
    initializeModeDraftFromPreset("DOCKER", {
      force: true,
      bindingRemark: initialBindingRemark,
      bindingData: props.initialBinding,
    });
    const initialMode = initialBindingRemark.installMode;
    activeMode.value =
      initialMode === "DOCKER" && presetSupportsDocker.value ? "DOCKER" : "SYSTEM";
  } else if (currentStep.value === 1) {
    if (!validateBaseConfig()) return;
  } else if (currentStep.value === 2) {
    if (!validateScripts()) return;
    await runCheck();
  } else if (currentStep.value === steps.length - 2) {
    await startInstall();
  }
  currentStep.value++;
};

const prevStep = () => {
  if (currentStep.value > 0) currentStep.value--;
};

const handleCancel = () => {
  installSocket.disconnect();
  installStatus.value = "idle";
  installLogs.value.push("[信息] 用户取消安装");
};

const handleAiAnalyze = async () => {
  if (!binding.value) return;
  aiAnalyzing.value = true;
  try {
    const res = await aiAnalyzeFailure({
      operationId:
        lastOperationId.value ||
        binding.value.sysProjectContainerSoftwareBindingId?.toString() ||
        "",
      logs: installLogs.value,
      softwareName: binding.value.softwareName || "",
    });
    if (res.code === "00000") {
      installLogs.value.push("--- AI 分析结果 ---");
      installLogs.value.push(res.data?.analysis || "无法分析");
      if (res.data?.suggestedFix) {
        installLogs.value.push(`[建议] ${res.data.suggestedFix}`);
      }
      if (res.data?.autoFixScript) {
        installLogs.value.push("--- 自动修复脚本 ---");
        installLogs.value.push(res.data.autoFixScript);
      }
    } else {
      ElMessage.warning("AI 分析暂不可用");
    }
  } finally {
    aiAnalyzing.value = false;
  }
};

const resetWizard = () => {
  currentStep.value = 0;
  presetSearch.value = "";
  selectedPreset.value = null;
  activeMode.value = "SYSTEM";
  scriptEditorTab.value = "installScript";
  systemDraft.value = createSystemDraft();
  dockerDraft.value = createDockerDraft();
  installStatus.value = "idle";
  installProgress.value = 0;
  installLogs.value = [];
  checkResult.value = null;
  binding.value = null;
  aiAnalyzing.value = false;
  lastOperationId.value = "";
};

const handleRetry = () => {
  resetWizard();
};

const handleFinish = () => {
  wizardVisible.value = false;
};

const handleClosed = () => {
  resetWizard();
};

watch(
  () => props.initialPreset,
  (val) => {
    if (!val) return;
    selectedPreset.value = val;
    currentStep.value = 1;
    const bindingRemark = parseBindingRemarkSafe(props.initialBinding?.bindingRemark);
    initializeModeDraftFromPreset("SYSTEM", {
      force: true,
      bindingRemark,
      bindingData: props.initialBinding,
    });
    initializeModeDraftFromPreset("DOCKER", {
      force: true,
      bindingRemark,
      bindingData: props.initialBinding,
    });
    activeMode.value =
      bindingRemark?.installMode === "DOCKER" && presetSupportsDocker.value
        ? "DOCKER"
        : "SYSTEM";
  },
  { immediate: true },
);

onMounted(async () => {
  const res = await fetchPresetList({ presetStatus: 1, presetDelete: 0 });
  if (res.code === "00000") {
    presets.value = res.data || [];
  }
});
</script>

<style scoped>
.wizard-steps {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 24px;
  padding: 16px 0;
}
.wizard-step {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.wizard-step.active {
  color: var(--el-color-primary);
  font-weight: 600;
}
.wizard-step.completed {
  color: var(--el-color-success);
}
.step-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  font-size: 12px;
  font-weight: 600;
}
.wizard-step.active .step-indicator {
  background: var(--el-color-primary);
  color: #fff;
}
.wizard-step.completed .step-indicator {
  background: var(--el-color-success);
  color: #fff;
}
.step-content {
  min-height: 360px;
}
.step-title {
  margin: 0 0 16px;
  font-size: 16px;
}
.step-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.preset-select-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
}
.preset-select-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}
.preset-select-item:hover {
  border-color: var(--el-color-primary-light-5);
}
.preset-select-item.selected {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.preset-item-name {
  font-weight: 500;
  font-size: 14px;
}
.preset-item-version {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.mode-select {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.mode-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.mode-card.selected {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.mode-card.disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.mode-card-title {
  font-weight: 600;
}
.mode-card-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
.dynamic-list {
  width: 100%;
}
.dynamic-list-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.dynamic-field-list {
  width: 100%;
}
.dynamic-field-item {
  margin-bottom: 12px;
}
.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 6px;
}
.checking {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 24px;
  justify-content: center;
}
.check-result {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.check-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
}
.check-item.pass {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}
.check-item.fail {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}
.check-item.warn {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}
.install-log {
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: monospace;
  font-size: 12px;
  padding: 12px;
  border-radius: 6px;
  max-height: 320px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
.log-line {
  line-height: 1.6;
}
.log-placeholder {
  color: #888;
  font-style: italic;
}
</style>
