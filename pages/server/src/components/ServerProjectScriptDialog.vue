<template>
  <ScDialog
    :model-value="modelValue"
    width="1180px"
    destroy-on-close
    hide-header
    :title="dialogTitle"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="server-project-script-dialog">
      <header class="server-project-script-dialog__hero">
        <div>
          <strong>{{ draft.serviceName || "未绑定服务" }}</strong>
          <p>
            {{ draft.installPath || "未配置安装目录" }} /
            {{ executionProvider || "SPI 自动路由" }}
          </p>
        </div>
        <div class="server-project-script-dialog__chips">
          <span class="server-project-script-dialog__chip">
            {{ draft.runtimeStatus || "UNKNOWN" }}
          </span>
          <span class="server-project-script-dialog__chip">
            {{ scriptLanguage }}
          </span>
        </div>
      </header>

      <ScAiTextarea
        v-model="draft.configTemplate"
        :rows="8"
        :ai-enabled="aiEnabled"
        :provider-label="executionProvider"
        task-title="AI 项目配置模板"
        :context="configTemplateAiContext"
        :build-prompt="buildConfigTemplatePrompt"
        placeholder="这里维护项目配置模板、环境变量模板或部署说明。"
      />

      <div class="server-project-script-dialog__grid">
        <ServerScriptComposer
          v-model="draft.detectScript"
          title="检测脚本"
          description="项目状态补充探测，适合检测端口、进程、容器与日志关键字。"
          :shortcuts="detectShortcuts"
          :spi-label="executionProvider"
          :can-generate-ai="aiEnabled"
          :ai-enabled="aiEnabled"
          :ai-unavailable-reason="aiUnavailableReason"
          :ai-context="scriptAiContext"
          :language="scriptLanguage"
        />
        <ServerScriptComposer
          v-model="draft.statusScript"
          title="状态脚本"
          description="读取项目运行态，返回 RUNNING / STOPPED / ERROR。"
          :shortcuts="statusShortcuts"
          :spi-label="executionProvider"
          :can-generate-ai="aiEnabled"
          :ai-enabled="aiEnabled"
          :ai-unavailable-reason="aiUnavailableReason"
          :ai-context="scriptAiContext"
          :language="scriptLanguage"
        />
        <ServerScriptComposer
          v-model="draft.startScript"
          title="启动脚本"
          description="支持 Spring Boot、静态站点与容器等典型项目场景。"
          :shortcuts="startShortcuts"
          :spi-label="executionProvider"
          :can-generate-ai="aiEnabled"
          :ai-enabled="aiEnabled"
          :ai-unavailable-reason="aiUnavailableReason"
          :ai-context="scriptAiContext"
          :language="scriptLanguage"
        />
        <ServerScriptComposer
          v-model="draft.stopScript"
          title="停止脚本"
          description="用于优雅停止项目进程或容器。"
          :shortcuts="stopShortcuts"
          :spi-label="executionProvider"
          :can-generate-ai="aiEnabled"
          :ai-enabled="aiEnabled"
          :ai-unavailable-reason="aiUnavailableReason"
          :ai-context="scriptAiContext"
          :language="scriptLanguage"
        />
        <ServerScriptComposer
          v-model="draft.restartScript"
          title="重启脚本"
          description="优先复用 start/stop 或系统原生命令。"
          :shortcuts="restartShortcuts"
          :spi-label="executionProvider"
          :can-generate-ai="aiEnabled"
          :ai-enabled="aiEnabled"
          :ai-unavailable-reason="aiUnavailableReason"
          :ai-context="scriptAiContext"
          :language="scriptLanguage"
        />
      </div>
    </div>

    <template #footer>
      <div class="server-project-script-dialog__footer">
        <el-button @click="emit('update:modelValue', false)">取消</el-button>
        <el-button
          type="primary"
          :loading="saving"
          @click="emit('submit', cloneDraft())"
        >
          保存脚本
        </el-button>
      </div>
    </template>
  </ScDialog>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import ScAiTextarea, {
  type ScAiTextareaPayload,
} from "@repo/components/ScAiTextarea";
import type { ServerService } from "../api";
import ServerScriptComposer, {
  type ServerScriptShortcut,
} from "./ServerScriptComposer.vue";

const createEmptyForm = (): ServerService => ({
  serverServiceId: undefined,
  serverId: undefined,
  serviceName: "",
  serviceType: "",
  installPath: "",
  runtimeStatus: "UNKNOWN",
  configTemplate: "",
  detectScript: "",
  startScript: "",
  stopScript: "",
  restartScript: "",
  statusScript: "",
  enabled: true,
  description: "",
});

const normalizeForm = (value?: ServerService | null): ServerService => ({
  ...createEmptyForm(),
  ...(value || {}),
});

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    saving?: boolean;
    service?: ServerService | null;
    aiEnabled?: boolean;
    aiUnavailableReason?: string;
    executionProvider?: string;
    hostContext?: Record<string, unknown> | null;
  }>(),
  {
    saving: false,
    service: null,
    aiEnabled: false,
    aiUnavailableReason: "",
    executionProvider: "",
    hostContext: null,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  submit: [value: ServerService];
}>();

const draft = reactive<ServerService>(normalizeForm(props.service));
const serializeForm = (value: ServerService) =>
  JSON.stringify(normalizeForm(value));

const syncDraft = (value?: ServerService | null) => {
  const next = normalizeForm(value);
  Object.assign(draft, next);
};

watch(
  () => serializeForm(normalizeForm(props.service)),
  () => syncDraft(props.service),
  { immediate: true },
);

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      syncDraft(props.service);
    }
  },
  { immediate: true },
);

const cloneDraft = () =>
  normalizeForm(JSON.parse(serializeForm(draft)) as ServerService);

const dialogTitle = computed(() =>
  draft.serviceName ? `${draft.serviceName} · 项目脚本` : "项目脚本",
);

const scriptLanguage = computed(() => {
  const osType = String(props.hostContext?.osType || "").toLowerCase();
  return osType.includes("win") ||
    props.executionProvider.includes("WinRM") ||
    props.executionProvider.includes("Windows")
    ? "powershell"
    : "shell";
});

const scriptContext = computed(() => {
  const serviceName = draft.serviceName?.trim() || "demo-project";
  const installPath = draft.installPath?.trim() || "/opt/demo-project";
  const jarName = `${serviceName}.jar`;
  const isWindows = scriptLanguage.value === "powershell";
  return {
    serviceName,
    installPath,
    jarName,
    isWindows,
    logPath: isWindows
      ? `${installPath}\\logs\\${serviceName}.log`
      : `${installPath}/logs/${serviceName}.log`,
  };
});

const scriptAiContext = computed(() => ({
  host: props.hostContext,
  service: {
    serviceName: draft.serviceName,
    serviceType: draft.serviceType,
    installPath: draft.installPath,
    runtimeStatus: draft.runtimeStatus,
    description: draft.description,
  },
  tools: ["spi", "local", "ssh", "winrm", "winvim"],
  projectModes: ["spring-boot", "nginx-static", "frontend-backend", "docker"],
}));

const configTemplateAiContext = computed(() => ({
  ...scriptAiContext.value,
  configTemplate: draft.configTemplate,
}));

const buildConfigTemplatePrompt = (payload: ScAiTextareaPayload) =>
  [
    `请为项目“${draft.serviceName || "demo-project"}”生成配置模板或部署说明。`,
    `脚本语言：${scriptLanguage.value}`,
    payload.instruction
      ? `额外要求：${payload.instruction}`
      : "额外要求：内容要适配当前服务器接入方式和部署路径。",
    payload.context
      ? `上下文：\n${JSON.stringify(payload.context, null, 2)}`
      : "",
    payload.content ? `当前内容：\n${payload.content}` : "当前内容为空。",
    payload.mode === "append"
      ? "输出要求：只返回需要追加的片段。"
      : "输出要求：直接返回完整内容，不要 Markdown 代码块。",
  ]
    .filter(Boolean)
    .join("\n\n");

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

const detectShortcuts = computed<ServerScriptShortcut[]>(() =>
  buildShortcuts(
    `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*${scriptContext.value.jarName}*' }`,
    `pgrep -af '${scriptContext.value.jarName}' || ss -lntp | grep '${scriptContext.value.serviceName}'`,
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
    `if (Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*${scriptContext.value.jarName}*' }) { 'RUNNING' } else { 'STOPPED' }`,
    `if pgrep -af '${scriptContext.value.jarName}' >/dev/null 2>&1; then echo RUNNING; else echo STOPPED; fi`,
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

const startShortcuts = computed<ServerScriptShortcut[]>(() =>
  buildShortcuts(
    `Start-Process -FilePath "java" -ArgumentList '-jar','${scriptContext.value.jarName}' -WorkingDirectory '${scriptContext.value.installPath}'`,
    `cd ${scriptContext.value.installPath} && nohup java -jar ${scriptContext.value.jarName} >> ${scriptContext.value.logPath} 2>&1 &`,
    [
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
    `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*${scriptContext.value.jarName}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`,
    `pkill -f '${scriptContext.value.jarName}'`,
    [
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
    `${stopShortcuts.value[0]?.snippet || ""}\n${startShortcuts.value[0]?.snippet || ""}`.trim(),
    `${stopShortcuts.value[0]?.snippet || ""}\n${startShortcuts.value[0]?.snippet || ""}`.trim(),
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
</script>

<style scoped lang="scss">
.server-project-script-dialog {
  display: grid;
  gap: 16px;
}

.server-project-script-dialog__hero,
.server-project-script-dialog__chips,
.server-project-script-dialog__footer {
  display: flex;
  align-items: center;
}

.server-project-script-dialog__hero {
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 22px;
  background:
    radial-gradient(
      circle at top left,
      color-mix(in srgb, var(--el-color-primary) 12%, transparent),
      transparent 56%
    ),
    color-mix(in srgb, var(--el-bg-color-page) 84%, white);
}

.server-project-script-dialog__hero p {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
}

.server-project-script-dialog__chips {
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.server-project-script-dialog__chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-fill-color-light) 88%, white);
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-project-script-dialog__grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.server-project-script-dialog__footer {
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 900px) {
  .server-project-script-dialog__grid {
    grid-template-columns: 1fr;
  }
}
</style>
