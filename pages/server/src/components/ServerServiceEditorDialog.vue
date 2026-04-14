<template>
  <el-dialog
    :model-value="modelValue"
    width="1240px"
    destroy-on-close
    :title="dialogTitle"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="server-service-editor">
      <div class="server-service-editor__hero">
        <div>
          <strong>{{ draft.serviceName || "未命名服务" }}</strong>
          <p>
            {{ draft.serverName || "未选择服务器" }} /
            {{ draft.serviceType || "SERVER_SERVICE" }} /
            {{ draft.installPath || "未配置安装目录" }}
          </p>
        </div>
        <div class="server-service-editor__hero-meta">
          <span class="server-service-editor__chip">
            {{ executionProvider || "等待选择执行通道" }}
          </span>
          <span class="server-service-editor__chip">{{
            draft.runtimeStatus || "UNKNOWN"
          }}</span>
        </div>
      </div>

      <div class="server-service-editor__tips">
        <span class="server-service-editor__chip is-primary">
          自动检测优先走 SPI: 本机 / SSH / WinRM
        </span>
        <span class="server-service-editor__chip">
          {{
            draft.serverServiceId
              ? "当前服务已保存，可继续推送配置或调用 AI 草稿"
              : "新增服务先保存，再调用 AI 生成与推送配置"
          }}
        </span>
        <span class="server-service-editor__chip">
          {{ aiEnabled ? "AI 已接入" : aiUnavailableReason || "AI 未激活" }}
        </span>
      </div>

      <div
        v-if="templateOptions?.length"
        class="server-service-editor__templates"
      >
        <span class="server-service-editor__templates-label">快捷模板</span>
        <el-button
          v-for="item in templateOptions"
          :key="item.key"
          plain
          size="small"
          @click="emit('apply-template', item.key)"
        >
          {{ item.label }}
        </el-button>
      </div>

      <el-tabs v-model="activeTab" class="server-service-editor__tabs">
        <el-tab-pane label="基础字段" name="basic">
          <el-form label-position="top" class="server-service-editor__form">
            <div class="server-service-editor__section">
              <div class="server-service-editor__three-column">
                <el-form-item label="服务名称">
                  <ScInput
                    v-model="draft.serviceName"
                    placeholder="如 nginx / redis / demo-api"
                  />
                </el-form-item>
                <el-form-item label="服务类型">
                  <ScSelect
                    v-model="draft.serviceType"
                    layout="icon"
                    :options="normalizedServiceTypeOptions"
                    class="server-service-editor__type-select"
                  />
                </el-form-item>
                <el-form-item label="启用状态">
                  <el-switch v-model="draft.enabled" />
                </el-form-item>
              </div>

              <div class="server-service-editor__three-column">
                <el-form-item label="安装目录">
                  <ScInput
                    v-model="draft.installPath"
                    placeholder="例如 /opt/nginx 或 C:/service/demo"
                  />
                </el-form-item>
                <el-form-item label="运行状态">
                  <ScInput v-model="draft.runtimeStatus" />
                </el-form-item>
                <el-form-item label="描述">
                  <ScInput
                    v-model="draft.description"
                    placeholder="简要说明当前服务职责"
                  />
                </el-form-item>
              </div>

              <div class="server-service-editor__two-column">
                <el-form-item label="配置路径 JSON / 每行一个">
                  <ScInput
                    v-model="draft.configPathsJson"
                    type="textarea"
                    :rows="6"
                    placeholder='["/etc/nginx/nginx.conf"]'
                  />
                </el-form-item>
                <el-form-item label="日志路径 JSON / 每行一个">
                  <ScInput
                    v-model="draft.logPathsJson"
                    type="textarea"
                    :rows="6"
                    placeholder='["/var/log/nginx/access.log"]'
                  />
                </el-form-item>
              </div>

              <el-form-item label="配置模板">
                <ScAiTextarea
                  v-model="draft.configTemplate"
                  :rows="10"
                  :ai-enabled="aiEnabled"
                  :provider-label="executionProvider"
                  task-title="AI 服务配置模板"
                  :context="configTemplateAiContext"
                  :build-prompt="buildConfigTemplatePrompt"
                  placeholder="在这里维护服务模板配置，保存后可一键推送到服务器。"
                />
              </el-form-item>
            </div>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="生命周期脚本" name="scripts">
          <div class="server-service-editor__script-grid">
            <ServerScriptComposer
              v-model="draft.initScript"
              title="初始化脚本"
              description="准备运行目录、权限、依赖环境。"
              :shortcuts="initShortcuts"
              :spi-label="executionProvider"
              :can-generate-ai="canGenerateAi"
              :ai-enabled="aiEnabled"
              :ai-unavailable-reason="aiUnavailableReason"
              :ai-tooltip="aiGenerateTooltip"
              :ai-context="serviceScriptAiContext"
              :language="scriptLanguage"
              @generate-ai="emit('generate-ai-draft', cloneDraft())"
            />
            <ServerScriptComposer
              v-model="draft.installScript"
              title="安装脚本"
              description="用于安装软件、解压产物或注册必要组件。"
              :shortcuts="installShortcuts"
              :spi-label="executionProvider"
              :can-generate-ai="canGenerateAi"
              :ai-enabled="aiEnabled"
              :ai-unavailable-reason="aiUnavailableReason"
              :ai-tooltip="aiGenerateTooltip"
              :ai-context="serviceScriptAiContext"
              :language="scriptLanguage"
              @generate-ai="emit('generate-ai-draft', cloneDraft())"
            />
            <ServerScriptComposer
              v-model="draft.detectScript"
              title="检测脚本"
              description="自动检测优先走 SPI，脚本用于补充状态探测。"
              :shortcuts="detectShortcuts"
              :spi-label="executionProvider"
              :can-generate-ai="canGenerateAi"
              :ai-enabled="aiEnabled"
              :ai-unavailable-reason="aiUnavailableReason"
              :ai-tooltip="aiGenerateTooltip"
              :ai-context="serviceScriptAiContext"
              :language="scriptLanguage"
              @generate-ai="emit('generate-ai-draft', cloneDraft())"
            />
            <ServerScriptComposer
              v-model="draft.statusScript"
              title="状态脚本"
              description="用于读取运行状态，适合 systemd、Windows 服务、容器等。"
              :shortcuts="statusShortcuts"
              :spi-label="executionProvider"
              :can-generate-ai="canGenerateAi"
              :ai-enabled="aiEnabled"
              :ai-unavailable-reason="aiUnavailableReason"
              :ai-tooltip="aiGenerateTooltip"
              :ai-context="serviceScriptAiContext"
              :language="scriptLanguage"
              @generate-ai="emit('generate-ai-draft', cloneDraft())"
            />
            <ServerScriptComposer
              v-model="draft.startScript"
              title="启动脚本"
              description="用于拉起服务进程。"
              :shortcuts="startShortcuts"
              :spi-label="executionProvider"
              :can-generate-ai="canGenerateAi"
              :ai-enabled="aiEnabled"
              :ai-unavailable-reason="aiUnavailableReason"
              :ai-tooltip="aiGenerateTooltip"
              :ai-context="serviceScriptAiContext"
              :language="scriptLanguage"
              @generate-ai="emit('generate-ai-draft', cloneDraft())"
            />
            <ServerScriptComposer
              v-model="draft.stopScript"
              title="停止脚本"
              description="用于优雅停止或强制终止服务。"
              :shortcuts="stopShortcuts"
              :spi-label="executionProvider"
              :can-generate-ai="canGenerateAi"
              :ai-enabled="aiEnabled"
              :ai-unavailable-reason="aiUnavailableReason"
              :ai-tooltip="aiGenerateTooltip"
              :ai-context="serviceScriptAiContext"
              :language="scriptLanguage"
              @generate-ai="emit('generate-ai-draft', cloneDraft())"
            />
            <ServerScriptComposer
              v-model="draft.restartScript"
              title="重启脚本"
              description="建议复用系统原生命令，避免重复拼接脚本。"
              :shortcuts="restartShortcuts"
              :spi-label="executionProvider"
              :can-generate-ai="canGenerateAi"
              :ai-enabled="aiEnabled"
              :ai-unavailable-reason="aiUnavailableReason"
              :ai-tooltip="aiGenerateTooltip"
              :ai-context="serviceScriptAiContext"
              :language="scriptLanguage"
              @generate-ai="emit('generate-ai-draft', cloneDraft())"
            />
            <ServerScriptComposer
              v-model="draft.uninstallScript"
              title="卸载脚本"
              description="清理服务、目录和附属注册信息。"
              :shortcuts="uninstallShortcuts"
              :spi-label="executionProvider"
              :can-generate-ai="canGenerateAi"
              :ai-enabled="aiEnabled"
              :ai-unavailable-reason="aiUnavailableReason"
              :ai-tooltip="aiGenerateTooltip"
              :ai-context="serviceScriptAiContext"
              :language="scriptLanguage"
              @generate-ai="emit('generate-ai-draft', cloneDraft())"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="注册与编排" name="register">
          <div class="server-service-editor__script-grid">
            <ServerScriptComposer
              v-model="draft.registerScript"
              title="注册脚本"
              description="把服务注册到操作系统或代理层。"
              :shortcuts="registerShortcuts"
              :spi-label="executionProvider"
              :can-generate-ai="canGenerateAi"
              :ai-enabled="aiEnabled"
              :ai-unavailable-reason="aiUnavailableReason"
              :ai-tooltip="aiGenerateTooltip"
              :ai-context="serviceScriptAiContext"
              :language="scriptLanguage"
              @generate-ai="emit('generate-ai-draft', cloneDraft())"
            />
            <ServerScriptComposer
              v-model="draft.unregisterScript"
              title="取消注册脚本"
              description="清理 systemd、Windows Service 或代理注册。"
              :shortcuts="unregisterShortcuts"
              :spi-label="executionProvider"
              :can-generate-ai="canGenerateAi"
              :ai-enabled="aiEnabled"
              :ai-unavailable-reason="aiUnavailableReason"
              :ai-tooltip="aiGenerateTooltip"
              :ai-context="serviceScriptAiContext"
              :language="scriptLanguage"
              @generate-ai="emit('generate-ai-draft', cloneDraft())"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="AI 诊断" name="ai">
          <article class="server-service-editor__ai-card">
            <header>
              <div>
                <strong>最近 AI 诊断</strong>
                <p>{{ executionProvider || "等待选择执行通道" }}</p>
              </div>
              <div class="server-service-editor__ai-actions">
                <span
                  v-if="draft.latestAiProvider"
                  class="server-service-editor__chip"
                >
                  {{ draft.latestAiProvider }}
                </span>
                <el-tooltip :content="publishTooltip">
                  <el-button
                    circle
                    plain
                    :disabled="!canPublishConfig"
                    :loading="publishing"
                    @click="emit('publish-config', cloneDraft())"
                  >
                    <IconifyIconOnline icon="ri:upload-cloud-2-line" />
                  </el-button>
                </el-tooltip>
                <el-tooltip :content="aiGenerateTooltip">
                  <el-button
                    circle
                    plain
                    :disabled="!canGenerateAi"
                    :loading="generating"
                    @click="emit('generate-ai-draft', cloneDraft())"
                  >
                    <IconifyIconOnline icon="ri:ai-generate-2" />
                  </el-button>
                </el-tooltip>
              </div>
            </header>
            <p>
              <span>原因</span>
              {{ draft.latestAiReason || "暂无失败原因" }}
            </p>
            <p>
              <span>方案</span>
              {{ draft.latestAiSolution || "暂无处理方案" }}
            </p>
            <p>
              <span>修复脚本</span>
              {{ draft.latestAiFixScript || "暂无修复脚本" }}
            </p>
            <small v-if="aiEnabled">
              已接入 AI 失败分析与脚本草稿能力；自动检测仍优先走 SPI。
            </small>
            <small v-else>
              {{
                aiUnavailableReason ||
                "当前未启用可用 AI，仍可通过 SPI 与手工脚本维护服务。"
              }}
            </small>
          </article>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <div class="server-service-editor__footer">
        <el-button @click="emit('update:modelValue', false)">取消</el-button>
        <el-button
          type="primary"
          :loading="saving"
          @click="emit('submit', cloneDraft())"
        >
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import ScAiTextarea, {
  type ScAiTextareaPayload,
} from "@repo/components/ScAiTextarea";
import ScInput from "@repo/components/ScInput/index.vue";
import ScSelect from "@repo/components/ScSelect/index.vue";
import type { ServerHost, ServerService } from "../api";
import ServerScriptComposer, {
  type ServerScriptShortcut,
} from "./ServerScriptComposer.vue";

const createEmptyForm = (): ServerService => ({
  serverServiceId: undefined,
  serverId: undefined,
  serviceCode: "",
  serviceName: "",
  serviceType: "",
  installPath: "",
  runtimeStatus: "UNKNOWN",
  configPathsJson: "",
  logPathsJson: "",
  configTemplate: "",
  initScript: "",
  installScript: "",
  uninstallScript: "",
  detectScript: "",
  registerScript: "",
  unregisterScript: "",
  startScript: "",
  stopScript: "",
  restartScript: "",
  statusScript: "",
  enabled: true,
  description: "",
  metadataJson: "",
  latestAiReason: "",
  latestAiSolution: "",
  latestAiFixScript: "",
  latestAiProvider: "",
  latestAiModel: "",
});

const normalizeForm = (value?: ServerService | null): ServerService => ({
  ...createEmptyForm(),
  ...(value || {}),
});

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    saving?: boolean;
    aiEnabled?: boolean;
    aiUnavailableReason?: string;
    executionProvider?: string;
    serviceTypeOptions?: Array<{ label: string; value: string }>;
    templateOptions?: Array<{ key: string; label: string }>;
    generating?: boolean;
    publishing?: boolean;
    form: ServerService;
    host?: ServerHost | null;
  }>(),
  {
    saving: false,
    aiEnabled: false,
    aiUnavailableReason: "",
    executionProvider: "",
    serviceTypeOptions: () => [],
    templateOptions: () => [],
    generating: false,
    publishing: false,
    host: null,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "update:form": [value: ServerService];
  submit: [value: ServerService];
  "publish-config": [value: ServerService];
  "generate-ai-draft": [value: ServerService];
  "apply-template": [key: string];
}>();

const activeTab = ref("basic");
const draft = reactive<ServerService>(normalizeForm(props.form));
const lastSnapshot = ref("");

const serializeForm = (value: ServerService) =>
  JSON.stringify(normalizeForm(value));

const syncDraft = (value?: ServerService | null) => {
  const next = normalizeForm(value);
  Object.assign(draft, next);
  lastSnapshot.value = serializeForm(next);
};

watch(
  () => serializeForm(props.form),
  () => {
    syncDraft(props.form);
  },
  { immediate: true },
);

watch(
  () => serializeForm(draft),
  (snapshot) => {
    if (snapshot === lastSnapshot.value) {
      return;
    }
    lastSnapshot.value = snapshot;
    emit("update:form", JSON.parse(snapshot) as ServerService);
  },
);

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      syncDraft(props.form);
      return;
    }
    activeTab.value = "basic";
  },
  { immediate: true },
);

const cloneDraft = () =>
  normalizeForm(JSON.parse(serializeForm(draft)) as ServerService);

const dialogTitle = computed(() =>
  draft.serverServiceId ? "编辑服务器服务" : "新增服务器服务",
);

const canPublishConfig = computed(() => Boolean(draft.serverServiceId));
const canGenerateAi = computed(
  () => props.aiEnabled && Boolean(draft.serverServiceId),
);

const publishTooltip = computed(() =>
  canPublishConfig.value
    ? "推送当前配置模板到服务器"
    : "请先保存服务后再推送配置",
);

const aiGenerateTooltip = computed(() => {
  if (!props.aiEnabled) {
    return props.aiUnavailableReason || "AI 能力未激活";
  }
  if (!draft.serverServiceId) {
    return "请先保存服务后，再调用 AI 生成脚本草稿";
  }
  return "使用 AI 生成当前服务草稿";
});

const scriptLanguage = computed(() =>
  props.host?.serverType === "WINRM" ||
  props.executionProvider.includes("WinRM") ||
  props.executionProvider.includes("Windows")
    ? "powershell"
    : "shell",
);

const serviceScriptAiContext = computed(() => ({
  host: props.host
    ? {
        serverName: props.host.serverName,
        serverType: props.host.serverType,
        osType: props.host.osType,
        architecture: props.host.architecture,
        host: props.host.host,
        port: props.host.port,
        username: props.host.username,
        password: props.host.password,
        privateKey: props.host.privateKey,
        baseDirectory: props.host.baseDirectory,
      }
    : null,
  service: {
    serviceCode: draft.serviceCode,
    serviceName: draft.serviceName,
    serviceType: draft.serviceType,
    installPath: draft.installPath,
    runtimeStatus: draft.runtimeStatus,
    description: draft.description,
    configPathsJson: draft.configPathsJson,
    logPathsJson: draft.logPathsJson,
  },
  tools: ["spi", "local", "ssh", "winrm", "winvim"],
  targets: [
    "init",
    "install",
    "detect",
    "status",
    "start",
    "stop",
    "restart",
    "register",
    "unregister",
    "uninstall",
    "config",
    "logs",
  ],
}));

const configTemplateAiContext = computed(() => ({
  ...serviceScriptAiContext.value,
  configTemplate: draft.configTemplate,
}));

const normalizedServiceTypeOptions = computed(() =>
  props.serviceTypeOptions.map((item) => {
    const key = String(item.value || "").toUpperCase();
    const meta =
      {
        SYSTEMD_SERVICE: {
          icon: "ri:settings-3-line",
          description: "Linux systemd 托管服务",
        },
        WINDOWS_SERVICE: {
          icon: "ri:windows-line",
          description: "Windows Service 托管服务",
        },
        SPRING_BOOT_APP: {
          icon: "ri:spring-line",
          description: "Java / Spring Boot 应用进程",
        },
        NGINX: {
          icon: "ri:service-line",
          description: "Nginx 站点与代理服务",
        },
        DOCKER_CONTAINER: {
          icon: "ri:docker-line",
          description: "Docker 容器运行服务",
        },
      }[key] || {
        icon: "ri:apps-2-line",
        description: item.label,
      };
    return {
      ...item,
      icon: (item as { icon?: string }).icon || meta.icon,
      description: (item as { description?: string }).description || meta.description,
    };
  }),
);

const buildConfigTemplatePrompt = (payload: ScAiTextareaPayload) =>
  [
    `请为服务器服务“${draft.serviceName || "demo-service"}”生成配置模板内容。`,
    `服务类型：${draft.serviceType || "SERVER_SERVICE"}`,
    `安装目录：${draft.installPath || "-"}`,
    `脚本语言：${scriptLanguage.value}`,
    payload.instruction
      ? `额外要求：${payload.instruction}`
      : "额外要求：请输出能直接保存和下发的配置模板，必要时保留注释。",
    payload.context
      ? `上下文：\n${JSON.stringify(payload.context, null, 2)}`
      : "",
    payload.content ? `当前模板：\n${payload.content}` : "当前模板为空。",
    payload.mode === "append"
      ? "输出要求：只返回需要追加的配置片段。"
      : "输出要求：返回完整配置模板，不要 Markdown 代码块。",
  ]
    .filter(Boolean)
    .join("\n\n");

const scriptContext = computed(() => {
  const serviceName = draft.serviceName?.trim() || "demo-service";
  const installPath = draft.installPath?.trim() || "/opt/demo-service";
  const jarName = `${serviceName}.jar`;
  const isWindows =
    props.executionProvider.includes("WinRM") ||
    props.executionProvider.includes("Windows");
  const serviceUnit = `${serviceName}.service`;
  const configPath = isWindows
    ? `${installPath}\\conf\\${serviceName}.conf`
    : `${installPath}/conf/${serviceName}.conf`;
  return {
    isWindows,
    serviceName,
    installPath,
    jarName,
    serviceUnit,
    configPath,
  };
});

const buildShortcuts = (
  windowsSnippet: string,
  unixSnippet: string,
  extra?: ServerScriptShortcut[],
) => [
  {
    key: "system",
    label: scriptContext.value.isWindows ? "Windows" : "Linux",
    snippet: scriptContext.value.isWindows ? windowsSnippet : unixSnippet,
    mode: "replace" as const,
  },
  ...(extra || []),
];

const initShortcuts = computed<ServerScriptShortcut[]>(() =>
  buildShortcuts(
    `New-Item -ItemType Directory -Force -Path "${scriptContext.value.installPath}"\nNew-Item -ItemType Directory -Force -Path "${scriptContext.value.installPath}\\logs"`,
    `mkdir -p ${scriptContext.value.installPath}/logs ${scriptContext.value.installPath}/conf`,
  ),
);

const installShortcuts = computed<ServerScriptShortcut[]>(() =>
  buildShortcuts(
    `Set-Location "${scriptContext.value.installPath}"\nExpand-Archive -Force package.zip .`,
    `cd ${scriptContext.value.installPath}\nunzip -o package.zip`,
  ),
);

const detectShortcuts = computed<ServerScriptShortcut[]>(() =>
  buildShortcuts(
    `Get-Service -Name "${scriptContext.value.serviceName}" -ErrorAction SilentlyContinue`,
    `systemctl status ${scriptContext.value.serviceUnit} || pgrep -af '${scriptContext.value.serviceName}'`,
    [
      {
        key: "docker",
        label: "Docker",
        snippet: `docker inspect -f '{{.State.Status}}' ${scriptContext.value.serviceName}`,
        mode: "replace",
      },
    ],
  ),
);

const statusShortcuts = computed<ServerScriptShortcut[]>(() =>
  buildShortcuts(
    `Get-Service -Name "${scriptContext.value.serviceName}"`,
    `systemctl status ${scriptContext.value.serviceUnit}`,
    [
      {
        key: "springboot",
        label: "Spring Boot",
        snippet: scriptContext.value.isWindows
          ? `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*${scriptContext.value.jarName}*' }`
          : `pgrep -af '${scriptContext.value.jarName}'`,
        mode: "replace",
      },
      {
        key: "docker",
        label: "Docker",
        snippet: `docker inspect -f '{{.State.Status}}' ${scriptContext.value.serviceName}`,
        mode: "replace",
      },
    ],
  ),
);

const startShortcuts = computed<ServerScriptShortcut[]>(() =>
  buildShortcuts(
    `Start-Service -Name "${scriptContext.value.serviceName}"`,
    `systemctl start ${scriptContext.value.serviceUnit}`,
    [
      {
        key: "springboot",
        label: "Spring Boot",
        snippet: scriptContext.value.isWindows
          ? `Start-Process -FilePath "java" -ArgumentList '-jar','${scriptContext.value.jarName}' -WorkingDirectory '${scriptContext.value.installPath}'`
          : `cd ${scriptContext.value.installPath} && nohup java -jar ${scriptContext.value.jarName} >> logs/${scriptContext.value.serviceName}.log 2>&1 &`,
        mode: "replace",
      },
      {
        key: "nginx",
        label: "Nginx",
        snippet: scriptContext.value.isWindows ? "nginx.exe" : "nginx",
        mode: "replace",
      },
      {
        key: "docker",
        label: "Docker",
        snippet: `docker start ${scriptContext.value.serviceName}`,
        mode: "replace",
      },
    ],
  ),
);

const stopShortcuts = computed<ServerScriptShortcut[]>(() =>
  buildShortcuts(
    `Stop-Service -Name "${scriptContext.value.serviceName}"`,
    `systemctl stop ${scriptContext.value.serviceUnit}`,
    [
      {
        key: "springboot",
        label: "Spring Boot",
        snippet: scriptContext.value.isWindows
          ? `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*${scriptContext.value.jarName}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`
          : `pkill -f '${scriptContext.value.jarName}'`,
        mode: "replace",
      },
      {
        key: "nginx",
        label: "Nginx",
        snippet: scriptContext.value.isWindows
          ? "nginx.exe -s stop"
          : "nginx -s stop",
        mode: "replace",
      },
      {
        key: "docker",
        label: "Docker",
        snippet: `docker stop ${scriptContext.value.serviceName}`,
        mode: "replace",
      },
    ],
  ),
);

const restartShortcuts = computed<ServerScriptShortcut[]>(() =>
  buildShortcuts(
    `Restart-Service -Name "${scriptContext.value.serviceName}"`,
    `systemctl restart ${scriptContext.value.serviceUnit}`,
    [
      {
        key: "nginx",
        label: "Nginx",
        snippet: scriptContext.value.isWindows
          ? "nginx.exe -s reload"
          : "nginx -s reload",
        mode: "replace",
      },
      {
        key: "docker",
        label: "Docker",
        snippet: `docker restart ${scriptContext.value.serviceName}`,
        mode: "replace",
      },
    ],
  ),
);

const uninstallShortcuts = computed<ServerScriptShortcut[]>(() =>
  buildShortcuts(
    `Remove-Item -Recurse -Force "${scriptContext.value.installPath}"`,
    `rm -rf ${scriptContext.value.installPath}`,
  ),
);

const registerShortcuts = computed<ServerScriptShortcut[]>(() =>
  buildShortcuts(
    `New-Service -Name "${scriptContext.value.serviceName}" -BinaryPathName "${scriptContext.value.installPath}\\${scriptContext.value.serviceName}.exe"`,
    `cat > /etc/systemd/system/${scriptContext.value.serviceUnit} <<'EOF'\n[Unit]\nDescription=${scriptContext.value.serviceName}\nAfter=network.target\n\n[Service]\nWorkingDirectory=${scriptContext.value.installPath}\nExecStart=/usr/bin/java -jar ${scriptContext.value.installPath}/${scriptContext.value.jarName}\nRestart=always\n\n[Install]\nWantedBy=multi-user.target\nEOF\nsystemctl daemon-reload\nsystemctl enable ${scriptContext.value.serviceUnit}`,
    [
      {
        key: "nginx-config",
        label: "Nginx 配置",
        snippet: `# config path\n${scriptContext.value.configPath}`,
      },
    ],
  ),
);

const unregisterShortcuts = computed<ServerScriptShortcut[]>(() =>
  buildShortcuts(
    `sc.exe delete "${scriptContext.value.serviceName}"`,
    `systemctl disable ${scriptContext.value.serviceUnit}\nrm -f /etc/systemd/system/${scriptContext.value.serviceUnit}\nsystemctl daemon-reload`,
  ),
);
</script>

<style scoped lang="scss">
.server-service-editor {
  display: grid;
  gap: 18px;
}

.server-service-editor__hero,
.server-service-editor__hero-meta,
.server-service-editor__templates,
.server-service-editor__two-column,
.server-service-editor__three-column,
.server-service-editor__footer,
.server-service-editor__ai-card header,
.server-service-editor__ai-actions,
.server-service-editor__tips {
  display: flex;
}

.server-service-editor__hero {
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 22px;
  background:
    radial-gradient(
      circle at top left,
      color-mix(in srgb, var(--el-color-primary) 12%, transparent),
      transparent 56%
    ),
    color-mix(in srgb, var(--el-bg-color-page) 82%, white);
}

.server-service-editor__hero strong {
  display: block;
  font-size: 17px;
}

.server-service-editor__hero p {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
}

.server-service-editor__hero-meta {
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.server-service-editor__chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-fill-color-light) 88%, white);
  color: var(--el-text-color-regular);
  font-size: 12px;
}

.server-service-editor__chip.is-primary {
  background: color-mix(in srgb, var(--el-color-primary) 12%, white);
  color: var(--el-color-primary-dark-2);
}

.server-service-editor__tips {
  gap: 8px;
  flex-wrap: wrap;
}

.server-service-editor__tabs :deep(.el-tabs__content) {
  overflow: visible;
}

.server-service-editor__templates {
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.server-service-editor__templates-label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-service-editor__form {
  min-width: 0;
}

.server-service-editor__section {
  padding: 18px;
  border-radius: 22px;
  background: color-mix(in srgb, var(--el-bg-color-page) 82%, white);
  margin-bottom: 16px;
}

.server-service-editor__two-column,
.server-service-editor__three-column {
  gap: 14px;
}

.server-service-editor__two-column :deep(.el-form-item),
.server-service-editor__three-column :deep(.el-form-item) {
  flex: 1;
  min-width: 0;
}

.server-service-editor__type-select :deep(.icon-selector-flex) {
  gap: 8px;
}

.server-service-editor__type-select :deep(.icon-selector-item) {
  width: 46px;
  height: 46px;
}

.server-service-editor__script-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.server-service-editor__ai-card {
  display: grid;
  gap: 10px;
  padding: 18px;
  border-radius: 22px;
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--el-color-warning) 12%, white),
      transparent 70%
    ),
    color-mix(in srgb, var(--el-bg-color-page) 84%, white);
  border: 1px solid color-mix(in srgb, var(--el-color-warning) 20%, transparent);
}

.server-service-editor__ai-card header {
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.server-service-editor__ai-card header p {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-service-editor__ai-actions {
  align-items: center;
  gap: 10px;
}

.server-service-editor__ai-card small {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-service-editor__ai-card p {
  margin: 0;
  line-height: 1.65;
}

.server-service-editor__ai-card p span {
  display: inline-flex;
  min-width: 48px;
  color: var(--el-text-color-secondary);
}

.server-service-editor__footer {
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 1280px) {
  .server-service-editor__three-column,
  .server-service-editor__script-grid {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>
