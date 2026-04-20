<template>
  <ScDialog
    v-model="visible"
    :title="editing ? '编辑项目' : '新增项目'"
    width="1320px"
    append-to-body
    destroy-on-close
    class="project-editor-dialog"
    draggable
    layout="simple"
  >
    <div class="project-designer">
      <header class="project-designer__hero">
        <div class="project-designer__copy">
          <p class="project-designer__eyebrow">Project Blueprint</p>
          <h2>{{ editing ? "调整项目档案" : "新建项目档案" }}</h2>
          <p>
            把部署入口、目录约定、运行脚本和巡检命令在一个画布内收口。
            表单采用无滚动的紧凑编排，适合连续录入多台服务。
          </p>
        </div>

        <div class="project-designer__chips">
          <span>{{ projectTypeLabel(project.projectType) }}</span>
          <span>{{ project.rootDirectory || "待填写根目录" }}</span>
          <span>{{ project.projectName || "未命名项目" }}</span>
        </div>
      </header>

      <ScTabs v-model="editorTab" class="project-tabs">
        <ScTabPane name="basic">
          <template #label>
            <span class="project-tab-label">
              <ElIcon><Document /></ElIcon>
              基础信息
            </span>
          </template>

          <div class="project-designer__grid">
            <section class="project-section">
              <div class="project-section__head">
                <strong>项目身份</strong>
                <span>名称、类型与用途说明</span>
              </div>
              <div class="project-form-grid project-form-grid--2">
                <el-form-item label="项目名称" required>
                  <el-input
                    v-model="project.projectName"
                    placeholder="gateway-service"
                  />
                </el-form-item>
                <el-form-item label="项目类型" required>
                  <ScSelect v-model="project.projectType">
                    <ElOption
                      v-for="item in projectTypes"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </ScSelect>
                </el-form-item>
                <el-form-item class="project-form-grid__full" label="项目描述">
                  <el-input
                    v-model="project.description"
                    type="textarea"
                    :rows="2"
                    placeholder="描述服务职责、端口、依赖与维护要点"
                  />
                </el-form-item>
              </div>
            </section>

            <section class="project-section">
              <div class="project-section__head">
                <strong>目录规划</strong>
                <span>部署、配置、依赖与日志目录</span>
              </div>
              <div class="project-form-grid project-form-grid--1">
                <el-form-item label="根目录" required>
                  <el-input
                    v-model="project.rootDirectory"
                    type="textarea"
                    :autosize="{ minRows: 1, maxRows: 3 }"
                    placeholder="/opt/apps/gateway"
                  />
                </el-form-item>
                <el-form-item label="依赖目录">
                  <el-input
                    v-model="project.libDirectory"
                    type="textarea"
                    :autosize="{ minRows: 1, maxRows: 3 }"
                    placeholder="/opt/apps/gateway/lib"
                  />
                </el-form-item>
                <el-form-item label="配置目录">
                  <el-input
                    v-model="project.configDirectory"
                    type="textarea"
                    :autosize="{ minRows: 1, maxRows: 3 }"
                    placeholder="/opt/apps/gateway/conf"
                  />
                </el-form-item>
                <el-form-item label="日志目录（可空）">
                  <el-input
                    v-model="project.logDirectory"
                    type="textarea"
                    :autosize="{ minRows: 1, maxRows: 3 }"
                    placeholder="/opt/apps/gateway/logs"
                  />
                </el-form-item>
                <el-form-item label="启动日志文件（可空）">
                  <el-input
                    v-model="project.startupLogFile"
                    type="textarea"
                    :autosize="{ minRows: 1, maxRows: 3 }"
                    placeholder="/opt/apps/gateway/logs/console.log"
                  />
                </el-form-item>
                <el-form-item
                  v-if="
                    isSpringBootProjectType(project.projectType) ||
                    project.projectType === 'tomcat'
                  "
                  label="主包入口（可空）"
                >
                  <el-input
                    v-model="project.mainArtifact"
                    type="textarea"
                    :autosize="{ minRows: 1, maxRows: 3 }"
                    placeholder="gateway.jar / app.war"
                  />
                </el-form-item>
              </div>
            </section>
          </div>
        </ScTabPane>

        <ScTabPane v-if="isJavaProject" name="jvm">
          <template #label>
            <span class="project-tab-label">
              <ElIcon><Cpu /></ElIcon>
              JVM 参数
            </span>
          </template>

          <section class="project-section project-section--wide">
            <div class="jvm-compact-head">
              <div>
                <strong>JVM 参数编排（紧凑头）</strong>
                <p>按行维护参数键和值，可直接调整单个参数，无需整段重写。</p>
              </div>
              <span class="jvm-compact-head__version">{{
                javaVersionHint
              }}</span>
            </div>
            <div class="jvm-rows">
              <div
                v-for="(row, index) in jvmRows"
                :key="`jvm-${index}`"
                class="jvm-row"
              >
                <div class="jvm-row__main">
                  <ScSelect
                    v-model="row.key"
                    filterable
                    allow-create
                    default-first-option
                    placeholder="参数键，如 -Xmx / -XX:+UseZGC / -XX:+ZGenerational"
                    @change="handleJvmKeyChange(row)"
                  >
                    <ElOption
                      v-for="item in jvmArgCatalog"
                      :key="item.key"
                      :label="item.key"
                      :value="item.key"
                    />
                  </ScSelect>
                  <ScSelect
                    v-if="resolveJvmValueMode(row.key) === 'select'"
                    v-model="row.value"
                    placeholder="请选择参数值"
                  >
                    <ElOption
                      v-for="option in resolveJvmSelectOptions(row.key)"
                      :key="`${row.key}-${option}`"
                      :label="option"
                      :value="option"
                    />
                  </ScSelect>
                  <el-input
                    v-else-if="resolveJvmValueMode(row.key) === 'text'"
                    v-model="row.value"
                    placeholder="参数值"
                  />
                  <div v-else class="jvm-row__switch-placeholder">
                    开关参数，无需输入值
                  </div>
                  <ScButton
                    circle
                    plain
                    type="danger"
                    @click="removeJvmRow(index)"
                  >
                    <ElIcon><Delete /></ElIcon>
                  </ScButton>
                </div>
                <p class="jvm-row__tip">{{ resolveJvmTip(row.key) }}</p>
              </div>
            </div>
            <ScButton plain type="primary" @click="addJvmRow">
              <ElIcon><Plus /></ElIcon>
              新增参数行
            </ScButton>
            <div class="project-form-grid__hint project-form-grid__hint--muted">
              已覆盖内存、GC（含
              ZGC）、容器感知、诊断、编码与时区。保存后将自动拼接为
              <code>jvmArgs</code> 字符串。
            </div>
          </section>
        </ScTabPane>

        <ScTabPane v-if="isSpringProject" name="spring">
          <template #label>
            <span class="project-tab-label">
              <ElIcon><Operation /></ElIcon>
              Spring 参数
            </span>
          </template>

          <section class="project-section project-section--wide">
            <div class="project-section__head">
              <strong>Spring 参数配置</strong>
              <span>常用参数快速配置 + 自定义参数扩展（会注入启动命令）</span>
            </div>
            <div class="project-form-grid project-form-grid--2">
              <el-form-item label="运行环境">
                <el-input v-model="springProfilesActive" placeholder="prod" />
              </el-form-item>
              <el-form-item label="应用名">
                <el-input
                  v-model="springApplicationName"
                  placeholder="gateway-service"
                />
              </el-form-item>
              <el-form-item label="服务端口">
                <el-input v-model="springServerPort" placeholder="8080" />
              </el-form-item>
              <el-form-item label="配置地址">
                <el-input
                  v-model="springConfigLocation"
                  placeholder="file:/opt/apps/gateway/config/"
                />
              </el-form-item>
              <el-form-item label="日志级别">
                <div class="spring-switch-row">
                  <ScSwitch v-model="springLoggingDebug" />
                  <span>{{ springLoggingDebug ? "DEBUG" : "INFO" }}</span>
                </div>
              </el-form-item>
              <el-form-item label="延迟初始化">
                <div class="spring-switch-row">
                  <ScSwitch v-model="springLazyInitialization" />
                  <span>{{ springLazyInitialization ? "true" : "false" }}</span>
                </div>
              </el-form-item>
              <el-form-item label="ANSI 彩色日志">
                <div class="spring-switch-row">
                  <ScSwitch v-model="springAnsiEnabled" />
                  <span>{{ springAnsiEnabled ? "always" : "never" }}</span>
                </div>
              </el-form-item>
              <el-form-item label="Actuator 暴露端点">
                <el-input
                  v-model="springManagementExposure"
                  placeholder="health,info,prometheus"
                />
              </el-form-item>
              <el-form-item
                class="project-form-grid__full"
                label="自定义参数（每行一个）"
              >
                <el-input
                  v-model="springCustomArgsText"
                  type="textarea"
                  :rows="4"
                  placeholder="--logging.level.root=INFO&#10;--management.endpoints.web.exposure.include=*"
                />
              </el-form-item>
              <div class="project-form-grid__full project-form-grid__hint">
                当前汇总参数：<code>{{ project.springArgs || "(空)" }}</code>
              </div>
            </div>
          </section>
        </ScTabPane>

        <ScTabPane name="script">
          <template #label>
            <span class="project-tab-label">
              <ElIcon><Operation /></ElIcon>
              运行脚本
            </span>
          </template>

          <section class="project-section project-section--wide">
            <div class="project-section__head">
              <strong>运行脚本</strong>
              <span>
                {{
                  isCustomProjectType
                    ? "自定义类型：脚本完全手填"
                    : "模板类型：支持按项目类型自动生成脚本，可继续手工调整"
                }}
              </span>
            </div>
            <div v-if="!isCustomProjectType" class="project-script-actions">
              <ScButton plain type="primary" @click="regenerateScriptsByType">
                <ElIcon><Operation /></ElIcon>
                按类型模板生成脚本
              </ScButton>
              <p class="project-script-actions__hint">
                {{
                  isSpringBootResourceSplitType(project.projectType)
                    ? "资源分离 SpringBoot：将使用 mainArtifact + libDirectory + configDirectory 生成脚本"
                    : "SpringBoot：将使用 mainArtifact + configDirectory + jvmArgs 生成脚本"
                }}
              </p>
            </div>
            <div class="project-form-grid project-form-grid--scripts">
              <el-form-item label="启动脚本" required>
                <ScriptInlineEditorField
                  v-model="project.startScript"
                  v-model:language="startScriptLanguage"
                  label="启动脚本"
                  :language-options="scriptLanguageOptions"
                  placeholder="./bin/start.sh 或完整命令"
                />
              </el-form-item>
              <el-form-item label="停止脚本">
                <ScriptInlineEditorField
                  v-model="project.stopScript"
                  v-model:language="stopScriptLanguage"
                  label="停止脚本"
                  :language-options="scriptLanguageOptions"
                  placeholder="./bin/stop.sh 或 kill 命令"
                />
              </el-form-item>
              <el-form-item label="重启脚本">
                <ScriptInlineEditorField
                  v-model="project.restartScript"
                  v-model:language="restartScriptLanguage"
                  label="重启脚本"
                  :language-options="scriptLanguageOptions"
                  placeholder="./bin/restart.sh"
                />
              </el-form-item>
            </div>
          </section>
        </ScTabPane>

        <ScTabPane name="inspect">
          <template #label>
            <span class="project-tab-label">
              <ElIcon><Monitor /></ElIcon>
              巡检与日志
            </span>
          </template>

          <section class="project-section project-section--wide">
            <div class="project-section__head">
              <strong>巡检与可观测</strong>
              <span>状态探针与运行说明</span>
            </div>
            <div class="project-form-grid project-form-grid--2">
              <el-form-item
                class="project-form-grid__full"
                label="状态检查脚本"
              >
                <el-input
                  v-model="project.statusScript"
                  type="textarea"
                  :rows="3"
                  placeholder="pgrep -f gateway.jar 或 curl 健康检查"
                />
              </el-form-item>
            </div>
          </section>
        </ScTabPane>
      </ScTabs>
    </div>

    <template #footer>
      <ScButton @click="visible = false">取消</ScButton>
      <ScButton type="primary" :loading="saving" @click="$emit('submit')"
        >保存项目</ScButton
      >
    </template>
  </ScDialog>
</template>

<script setup lang="ts">
import {
  Cpu,
  Delete,
  Document,
  Monitor,
  Operation,
  Plus,
} from "@element-plus/icons-vue";
import { ElMessage, ElOption } from "element-plus";
import { computed, ref, watch } from "vue";
import ScSelect from "@repo/components/ScSelect/src/index.vue";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import type { RemoteProject } from "../../api/manage/remote";
import {
  applyProjectTypeDefaults,
  buildProjectTypeScriptTemplates,
  isSpringBootProjectType,
  isSpringBootResourceSplitType,
  normalizeProjectType,
  projectTypeLabel,
  projectTypes,
} from "./projectPanelShared";
import ScriptInlineEditorField from "./ScriptInlineEditorField.vue";

const props = defineProps<{
  modelValue: boolean;
  editing: boolean;
  project: RemoteProject;
  saving: boolean;
}>();

const emit = defineEmits<{
  (e: "submit"): void;
  (e: "update:modelValue", value: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const editorTab = ref("basic");
const isCustomProjectType = computed(
  () => normalizeProjectType(props.project.projectType) === "custom",
);
const isSpringProject = computed(() =>
  isSpringBootProjectType(props.project.projectType),
);
const isJavaProject = computed(() => {
  const normalized = normalizeProjectType(props.project.projectType);
  return (
    isSpringBootProjectType(props.project.projectType) ||
    normalized === "tomcat" ||
    normalized === "java"
  );
});

const scriptLanguageOptions = [
  { label: "Shell / Bash", value: "shell" },
  { label: "PowerShell", value: "powershell" },
  { label: "Batch / CMD", value: "bat" },
  { label: "Python", value: "python" },
  { label: "Node.js", value: "javascript" },
];
const startScriptLanguage = ref("shell");
const stopScriptLanguage = ref("shell");
const restartScriptLanguage = ref("shell");

const javaVersionHint = computed(() =>
  normalizeProjectType(props.project.projectType) === "tomcat"
    ? "推荐 Java 17（Tomcat 10+ 建议 17，兼容 11 / 21）"
    : "推荐 Java 17（兼容 11 / 21；ZGC 需 JDK 15+，分代 ZGC 需 JDK 21+）",
);

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      editorTab.value = "basic";
      applyProjectTypeDefaults(props.project);
      maybeGenerateScriptsFromType();
    }
  },
);

const SPRING_COMMON_KEYS = {
  profiles: "spring.profiles.active",
  appName: "spring.application.name",
  serverPort: "server.port",
  configLocation: "spring.config.location",
  loggingLevelRoot: "logging.level.root",
  lazyInitialization: "spring.main.lazy-initialization",
  ansiEnabled: "spring.output.ansi.enabled",
  managementExposure: "management.endpoints.web.exposure.include",
} as const;

const springProfilesActive = ref("");
const springApplicationName = ref("");
const springServerPort = ref("");
const springConfigLocation = ref("");
const springLoggingDebug = ref(false);
const springLazyInitialization = ref(false);
const springAnsiEnabled = ref(false);
const springManagementExposure = ref("");
const springCustomArgsText = ref("");
let syncingSpringArgs = false;

const parseBoolean = (value?: string) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return normalized === "true" || normalized === "on" || normalized === "yes";
};

const splitSpringArgToken = (token: string) => {
  const normalized = String(token || "")
    .trim()
    .replace(/^--/, "");
  if (!normalized) {
    return null;
  }
  const index = normalized.indexOf("=");
  if (index < 0) {
    return {
      key: normalized,
      value: "",
    };
  }
  return {
    key: normalized.slice(0, index).trim(),
    value: normalized.slice(index + 1).trim(),
  };
};

const parseSpringArgs = (value?: string) => {
  const tokens = String(value || "")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const map = new Map<string, string>();
  const custom: string[] = [];
  for (const token of tokens) {
    const pair = splitSpringArgToken(token);
    if (!pair?.key) {
      continue;
    }
    if (Object.values(SPRING_COMMON_KEYS).includes(pair.key as any)) {
      map.set(pair.key, pair.value);
      continue;
    }
    custom.push(`--${pair.key}${pair.value ? `=${pair.value}` : ""}`);
  }
  return {
    map,
    custom,
  };
};

const syncSpringFormFromProject = () => {
  const parsed = parseSpringArgs(props.project.springArgs);
  springProfilesActive.value =
    parsed.map.get(SPRING_COMMON_KEYS.profiles) || "";
  springApplicationName.value =
    parsed.map.get(SPRING_COMMON_KEYS.appName) || "";
  springServerPort.value = parsed.map.get(SPRING_COMMON_KEYS.serverPort) || "";
  springConfigLocation.value =
    parsed.map.get(SPRING_COMMON_KEYS.configLocation) || "";
  springLoggingDebug.value =
    String(parsed.map.get(SPRING_COMMON_KEYS.loggingLevelRoot) || "")
      .trim()
      .toUpperCase() === "DEBUG";
  springLazyInitialization.value = parseBoolean(
    parsed.map.get(SPRING_COMMON_KEYS.lazyInitialization),
  );
  springAnsiEnabled.value =
    String(parsed.map.get(SPRING_COMMON_KEYS.ansiEnabled) || "")
      .trim()
      .toLowerCase() === "always";
  springManagementExposure.value =
    parsed.map.get(SPRING_COMMON_KEYS.managementExposure) || "";
  springCustomArgsText.value = parsed.custom.join("\n");
};

const buildSpringArgsFromForm = () => {
  const tokens: string[] = [];
  const pushArg = (key: string, value: string) => {
    const normalized = String(value || "").trim();
    if (!normalized) {
      return;
    }
    tokens.push(`--${key}=${normalized}`);
  };
  pushArg(SPRING_COMMON_KEYS.profiles, springProfilesActive.value);
  pushArg(SPRING_COMMON_KEYS.appName, springApplicationName.value);
  pushArg(SPRING_COMMON_KEYS.serverPort, springServerPort.value);
  pushArg(SPRING_COMMON_KEYS.configLocation, springConfigLocation.value);
  pushArg(
    SPRING_COMMON_KEYS.loggingLevelRoot,
    springLoggingDebug.value ? "DEBUG" : "INFO",
  );
  pushArg(
    SPRING_COMMON_KEYS.lazyInitialization,
    springLazyInitialization.value ? "true" : "false",
  );
  pushArg(
    SPRING_COMMON_KEYS.ansiEnabled,
    springAnsiEnabled.value ? "always" : "never",
  );
  pushArg(
    SPRING_COMMON_KEYS.managementExposure,
    springManagementExposure.value,
  );
  const customLines = String(springCustomArgsText.value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  for (const line of customLines) {
    const normalized = line.startsWith("--") ? line : `--${line}`;
    const pair = splitSpringArgToken(normalized);
    if (
      pair?.key &&
      Object.values(SPRING_COMMON_KEYS).includes(pair.key as any)
    ) {
      continue;
    }
    tokens.push(normalized);
  }
  return tokens.join(" ");
};

const hasLifecycleScriptValues = (project: RemoteProject) =>
  Boolean(
    String(project.startScript || "").trim() ||
    String(project.stopScript || "").trim() ||
    String(project.restartScript || "").trim(),
  );

const applyTemplatesToProject = (force = false) => {
  const templates = buildProjectTypeScriptTemplates(props.project);
  if (!templates) {
    return false;
  }
  if (!force && hasLifecycleScriptValues(props.project)) {
    return false;
  }
  props.project.startScript = templates.startScript;
  props.project.stopScript = templates.stopScript;
  props.project.restartScript = templates.restartScript;
  if (!String(props.project.statusScript || "").trim()) {
    props.project.statusScript = templates.statusScript;
  }
  return true;
};

const maybeGenerateScriptsFromType = () => {
  applyProjectTypeDefaults(props.project);
  applyTemplatesToProject(false);
};

const regenerateScriptsByType = () => {
  applyProjectTypeDefaults(props.project);
  const updated = applyTemplatesToProject(true);
  if (!updated) {
    ElMessage.warning("当前项目类型不支持模板脚本自动生成，请改为手动填写");
    return;
  }
  ElMessage.success("已按项目类型生成脚本模板，可继续手动调整");
};

watch(
  () => props.project.projectType,
  () => {
    applyProjectTypeDefaults(props.project);
    applyTemplatesToProject(true);
  },
  { immediate: true },
);

watch(
  () => props.project.springArgs,
  () => {
    if (syncingSpringArgs || !isSpringProject.value) {
      return;
    }
    syncSpringFormFromProject();
  },
  { immediate: true },
);

watch(
  [
    springProfilesActive,
    springApplicationName,
    springServerPort,
    springConfigLocation,
    springLoggingDebug,
    springLazyInitialization,
    springAnsiEnabled,
    springManagementExposure,
    springCustomArgsText,
  ],
  () => {
    if (!isSpringProject.value) {
      props.project.springArgs = "";
      return;
    }
    syncingSpringArgs = true;
    props.project.springArgs = buildSpringArgsFromForm();
    syncingSpringArgs = false;
  },
  { deep: true },
);

watch(
  () => [
    props.project.rootDirectory,
    props.project.mainArtifact,
    props.project.libDirectory,
    props.project.configDirectory,
    props.project.jvmArgs,
  ],
  () => {
    if (!hasLifecycleScriptValues(props.project)) {
      maybeGenerateScriptsFromType();
    }
  },
);

type JvmArgRow = {
  key: string;
  value: string;
};

type JvmValueMode = "text" | "none" | "select";
type JvmArgCatalogItem = {
  key: string;
  tip: string;
  valueMode?: JvmValueMode;
  options?: string[];
};

const jvmArgCatalog: JvmArgCatalogItem[] = [
  { key: "-Xms", tip: "初始堆大小，如 512m / 1g", valueMode: "text" },
  { key: "-Xmx", tip: "最大堆大小，建议与容器内存协同", valueMode: "text" },
  {
    key: "-Xmn",
    tip: "新生代大小（仅部分 GC 场景建议显式设置）",
    valueMode: "text",
  },
  { key: "-Xss", tip: "线程栈大小", valueMode: "text" },
  {
    key: "-XX:+UseG1GC",
    tip: "启用 G1 垃圾回收器（JDK 8+ 默认常用）",
    valueMode: "none",
  },
  {
    key: "-XX:MaxGCPauseMillis",
    tip: "目标停顿时间（毫秒）",
    valueMode: "text",
  },
  {
    key: "-XX:InitiatingHeapOccupancyPercent",
    tip: "并发标记触发阈值（G1）",
    valueMode: "text",
  },
  { key: "-XX:+UseZGC", tip: "启用 ZGC（JDK 15+）", valueMode: "none" },
  {
    key: "-XX:+ZGenerational",
    tip: "启用分代 ZGC（JDK 21+）",
    valueMode: "none",
  },
  {
    key: "-XX:+UnlockExperimentalVMOptions",
    tip: "开启实验参数（部分 JDK 版本需要）",
    valueMode: "none",
  },
  {
    key: "-XX:+UseCompactObjectHeaders",
    tip: "启用紧凑对象头（JDK 25 常用参数）",
    valueMode: "none",
  },
  {
    key: "-XX:ObjectAlignmentInBytes",
    tip: "对象对齐字节，常见 8 / 16",
    valueMode: "select",
    options: ["8", "16"],
  },
  {
    key: "-XX:TieredStopAtLevel",
    tip: "JIT 分层编译层级",
    valueMode: "select",
    options: ["1", "2", "3", "4"],
  },
  {
    key: "-XX:SoftMaxHeapSize",
    tip: "ZGC 软堆上限，降低突发内存占用",
    valueMode: "text",
  },
  {
    key: "-XX:ZUncommitDelay",
    tip: "ZGC 归还空闲内存延迟（秒）",
    valueMode: "text",
  },
  {
    key: "-XX:+UseShenandoahGC",
    tip: "启用 Shenandoah（特定 JDK 发行版）",
    valueMode: "none",
  },
  {
    key: "-XX:+UseContainerSupport",
    tip: "读取容器资源限制",
    valueMode: "none",
  },
  {
    key: "-XX:MaxRAMPercentage",
    tip: "最大堆占容器内存比例",
    valueMode: "text",
  },
  {
    key: "-XX:InitialRAMPercentage",
    tip: "初始堆占容器内存比例",
    valueMode: "text",
  },
  {
    key: "-XX:MinRAMPercentage",
    tip: "最小堆占容器内存比例",
    valueMode: "text",
  },
  {
    key: "-XX:MaxDirectMemorySize",
    tip: "DirectBuffer 最大内存",
    valueMode: "text",
  },
  { key: "-XX:MetaspaceSize", tip: "元空间初始阈值", valueMode: "text" },
  { key: "-XX:MaxMetaspaceSize", tip: "元空间上限", valueMode: "text" },
  {
    key: "-XX:ReservedCodeCacheSize",
    tip: "JIT CodeCache 大小上限",
    valueMode: "text",
  },
  {
    key: "-XX:+HeapDumpOnOutOfMemoryError",
    tip: "OOM 自动导出堆快照",
    valueMode: "none",
  },
  { key: "-XX:HeapDumpPath", tip: "堆快照输出路径", valueMode: "text" },
  {
    key: "-XX:ErrorFile",
    tip: "致命错误日志输出路径（hs_err）",
    valueMode: "text",
  },
  {
    key: "-XX:+ExitOnOutOfMemoryError",
    tip: "OOM 后强制退出进程",
    valueMode: "none",
  },
  {
    key: "-XX:+DisableExplicitGC",
    tip: "屏蔽显式 System.gc()",
    valueMode: "none",
  },
  {
    key: "-Dspring.profiles.active",
    tip: "Spring 环境标识",
    valueMode: "text",
  },
  {
    key: "-Dspring.config.location",
    tip: "指定 Spring 配置文件路径",
    valueMode: "text",
  },
  { key: "-Dfile.encoding", tip: "文件编码，建议 UTF-8", valueMode: "text" },
  { key: "-Duser.timezone", tip: "时区，如 Asia/Shanghai", valueMode: "text" },
  {
    key: "-Djava.security.egd",
    tip: "加速随机源初始化（常用 /dev/urandom）",
    valueMode: "text",
  },
  {
    key: "-Djava.net.preferIPv4Stack",
    tip: "优先使用 IPv4 网络栈",
    valueMode: "text",
  },
];

const jvmRows = ref<JvmArgRow[]>([]);
let syncingJvmRows = false;

const parseJvmArgsToRows = (value?: string): JvmArgRow[] =>
  String(value || "")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => {
      if (/^-X(ms|mx|ss)/.test(token)) {
        const key = token.slice(0, 4);
        return {
          key,
          value: token.slice(4),
        };
      }
      if (
        (token.startsWith("-D") || token.startsWith("-XX:")) &&
        token.includes("=")
      ) {
        const [key, ...rest] = token.split("=");
        return {
          key,
          value: rest.join("="),
        };
      }
      return {
        key: token,
        value: "",
      };
    });

const joinJvmRowsToArgs = (rows: JvmArgRow[]) =>
  rows
    .map((row) => {
      const key = String(row.key || "").trim();
      const value = String(row.value || "").trim();
      if (!key) {
        return "";
      }
      if (!value) {
        return key;
      }
      if (/^-X(ms|mx|ss)$/.test(key)) {
        return `${key}${value}`;
      }
      if (key.startsWith("-D") || key.startsWith("-XX:")) {
        return `${key}=${value}`;
      }
      return `${key}${value}`;
    })
    .filter(Boolean)
    .join(" ");

const syncRowsFromProject = () => {
  const rows = parseJvmArgsToRows(props.project.jvmArgs);
  jvmRows.value = rows.length ? rows : [{ key: "-Xms", value: "512m" }];
};

watch(
  () => props.project.jvmArgs,
  () => {
    if (syncingJvmRows || !isJavaProject.value) {
      return;
    }
    syncRowsFromProject();
  },
  { immediate: true },
);

watch(
  () => props.project.projectType,
  () => {
    if (isJavaProject.value) {
      syncRowsFromProject();
      return;
    }
    jvmRows.value = [];
    props.project.jvmArgs = "";
  },
  { immediate: true },
);

watch(
  jvmRows,
  (rows) => {
    if (syncingJvmRows || !isJavaProject.value) {
      return;
    }
    syncingJvmRows = true;
    props.project.jvmArgs = joinJvmRowsToArgs(rows);
    syncingJvmRows = false;
  },
  { deep: true },
);

const resolveJvmTip = (key?: string) =>
  jvmArgCatalog.find((item) => item.key === String(key || "").trim())?.tip ||
  "自定义 JVM 参数";

const resolveJvmCatalogItem = (key?: string) =>
  jvmArgCatalog.find((item) => item.key === String(key || "").trim());

const resolveJvmValueMode = (key?: string): JvmValueMode =>
  resolveJvmCatalogItem(key)?.valueMode || "text";

const resolveJvmSelectOptions = (key?: string) =>
  resolveJvmCatalogItem(key)?.options || [];

const handleJvmKeyChange = (row: JvmArgRow) => {
  const mode = resolveJvmValueMode(row.key);
  if (mode === "none") {
    row.value = "";
    return;
  }
  if (mode === "select") {
    const options = resolveJvmSelectOptions(row.key);
    if (!options.includes(String(row.value || "").trim())) {
      row.value = options[0] || "";
    }
  }
};

const addJvmRow = () => {
  jvmRows.value.push({ key: "", value: "" });
};

const removeJvmRow = (index: number) => {
  if (jvmRows.value.length <= 1) {
    jvmRows.value[0] = { key: "", value: "" };
    return;
  }
  jvmRows.value.splice(index, 1);
};
</script>

<style scoped lang="scss">
.project-designer {
  display: grid;
  gap: 18px;
}

.project-tabs {
  :deep(.el-tabs__header) {
    margin: 0 0 14px;
  }

  :deep(.el-tabs__nav-wrap::after) {
    background: rgba(148, 163, 184, 0.14);
  }

  :deep(.el-tabs__item) {
    height: 44px;
    padding: 0 18px;
    color: #64748b;
    font-weight: 600;
  }

  :deep(.el-tabs__item.is-active) {
    color: #1d4ed8;
  }

  :deep(.el-tabs__active-bar) {
    background: linear-gradient(90deg, #2563eb, #0ea5e9);
    height: 3px;
    border-radius: 999px;
  }
}

.project-tab-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.project-designer__hero {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.9fr);
  gap: 18px;
  padding: 20px 22px;
  border-radius: 28px;
  background:
    radial-gradient(
      circle at top left,
      rgba(59, 130, 246, 0.16),
      transparent 26%
    ),
    radial-gradient(
      circle at bottom right,
      rgba(14, 165, 233, 0.14),
      transparent 22%
    ),
    linear-gradient(140deg, rgba(255, 255, 255, 0.98), rgba(239, 246, 255, 0.9));
  border: 1px solid rgba(147, 197, 253, 0.34);
  box-shadow: 0 16px 40px rgba(37, 99, 235, 0.08);
}

.project-designer__copy {
  h2 {
    margin: 0 0 10px;
    font-size: 28px;
    color: #0f172a;
  }

  p:last-child {
    margin: 0;
    color: #475569;
    line-height: 1.8;
    font-size: 14px;
  }
}

.project-designer__eyebrow {
  margin: 0 0 10px;
  font-size: 11px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: #2563eb;
}

.project-designer__chips {
  display: grid;
  align-content: start;
  gap: 10px;

  span {
    padding: 12px 14px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.84);
    border: 1px solid rgba(148, 163, 184, 0.14);
    color: #1e3a8a;
    font-size: 13px;
    font-weight: 600;
    word-break: break-word;
  }
}

.project-designer__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.project-section {
  display: grid;
  gap: 14px;
  padding: 18px 18px 8px;
  border-radius: 24px;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.88);
}

.project-section--wide {
  grid-column: 1 / -1;
}

.project-section__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;

  strong {
    font-size: 16px;
    color: #0f172a;
  }

  span {
    font-size: 12px;
    color: #64748b;
  }
}

.project-form-grid {
  display: grid;
  gap: 14px 16px;
  align-items: start;
}

.project-form-grid__hint {
  margin-top: -2px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.6;
}

.project-form-grid__hint--muted {
  color: #94a3b8;
}

.project-form-grid--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.project-form-grid--1 {
  grid-template-columns: 1fr;
}

.project-form-grid--scripts {
  grid-template-columns: 1fr;
}

.project-script-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.project-script-actions__hint {
  margin: 0;
  font-size: 12px;
  color: #64748b;
}

.project-form-grid__full {
  grid-column: 1 / -1;
}

:deep(.project-editor-dialog .el-dialog) {
  border-radius: 28px;
  overflow: hidden;
}

:deep(.project-editor-dialog .el-dialog__body) {
  padding-top: 10px;
}

:deep(.project-editor-dialog .el-form-item) {
  margin-bottom: 0;
  display: grid;
  gap: 8px;
  align-content: start;
}

:deep(.project-editor-dialog .el-form-item__label) {
  width: auto !important;
  padding: 0;
  margin: 0;
  min-height: 20px;
  color: #475569;
  font-weight: 600;
  line-height: 1.4;
}

:deep(.project-editor-dialog .el-form-item__content) {
  margin-left: 0 !important;
  width: 100%;
}

:deep(.project-editor-dialog .el-input__wrapper),
:deep(.project-editor-dialog .el-textarea__inner),
:deep(.project-editor-dialog .sc-select),
:deep(.project-editor-dialog .el-select__wrapper) {
  border-radius: 16px;
}

.jvm-compact-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;

  strong {
    display: block;
    font-size: 16px;
    color: #0f172a;
  }

  p {
    margin: 8px 0 0;
    font-size: 12px;
    color: #64748b;
    line-height: 1.7;
  }
}

.jvm-compact-head__version {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.26);
  background: rgba(248, 250, 252, 0.92);
  color: #64748b;
  font-size: 12px;
  white-space: nowrap;
}

.jvm-rows {
  display: grid;
  gap: 12px;
}

.jvm-row {
  display: grid;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.82);
}

.jvm-row__main {
  display: grid;
  grid-template-columns: minmax(220px, 1.3fr) minmax(220px, 1fr) auto;
  align-items: center;
  gap: 10px;
}

.jvm-row__switch-placeholder {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.7);
  color: #94a3b8;
  font-size: 12px;
}

.jvm-row__tip {
  margin: 0;
  color: #9ca3af;
  font-size: 12px;
  line-height: 1.5;
}

.spring-switch-row {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 32px;
  color: #64748b;
  font-size: 12px;
}

@media (max-width: 980px) {
  .project-designer__hero,
  .project-designer__grid,
  .project-form-grid--2,
  .project-form-grid--scripts {
    grid-template-columns: 1fr;
  }

  .jvm-compact-head,
  .jvm-row__main {
    grid-template-columns: 1fr;
  }
}
</style>
