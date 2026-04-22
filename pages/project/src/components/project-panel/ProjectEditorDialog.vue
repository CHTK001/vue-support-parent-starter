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
      <!-- Hero Banner -->
      <header class="project-hero">
        <div class="project-hero__glow project-hero__glow--1"></div>
        <div class="project-hero__glow project-hero__glow--2"></div>

        <div class="project-hero__content">
          <div class="project-hero__main">
            <div class="project-hero__badge">
              <ElIcon :size="14"><Folder /></ElIcon>
              Project Blueprint
            </div>
            <h2 class="project-hero__title">
              {{ editing ? "调整项目档案" : "新建项目档案" }}
            </h2>
            <p class="project-hero__desc">
              把部署入口、目录约定、运行脚本和巡检命令在一个画布内收口。
              表单采用无滚动的紧凑编排，适合连续录入多台服务。
            </p>
          </div>

          <div class="project-hero__chips">
            <div class="project-chip">
              <ElIcon :size="14"><Grid /></ElIcon>
              <span>{{ projectTypeLabel(project.projectType) }}</span>
            </div>
            <div class="project-chip">
              <ElIcon :size="14"><FolderOpened /></ElIcon>
              <span>{{ project.rootDirectory || "待填写根目录" }}</span>
            </div>
            <div class="project-chip project-chip--primary">
              <ElIcon :size="14"><Document /></ElIcon>
              <span>{{ project.projectName || "未命名项目" }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Tabs Navigation -->
      <ScTabs v-model="editorTab" class="project-tabs">
        <ScTabPane name="basic">
          <template #label>
            <span class="project-tab-label">
              <span class="project-tab-icon">
                <ElIcon :size="16"><Document /></ElIcon>
              </span>
              基础信息
            </span>
          </template>

          <div class="project-grid project-grid--2">
            <!-- Identity Section -->
            <section class="project-card">
              <div class="project-card__header">
                <div class="project-card__icon project-card__icon--blue">
                  <ElIcon :size="18"><User /></ElIcon>
                </div>
                <div class="project-card__title">
                  <strong>项目身份</strong>
                  <span>名称、类型与用途说明</span>
                </div>
              </div>

              <div class="project-form project-form--2">
                <el-form-item label="项目名称" required label-width="100px">
                  <el-input
                    v-model="project.projectName"
                    placeholder="gateway-service"
                    :prefix-icon="Edit"
                  />
                </el-form-item>
                <el-form-item label="项目类型" required label-width="100px">
                  <ScSelect v-model="project.projectType">
                    <ElOption
                      v-for="item in projectTypes"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </ScSelect>
                </el-form-item>
                <p class="project-type-desc">{{ projectTypeDescription }}</p>
                <el-form-item
                  class="project-form__full"
                  label="项目描述"
                  label-width="100px"
                >
                  <el-input
                    v-model="project.description"
                    type="textarea"
                    :rows="2"
                    placeholder="描述服务职责、端口、依赖与维护要点"
                  />
                </el-form-item>
              </div>
            </section>

            <!-- Directory Section -->
            <section class="project-card">
              <div class="project-card__header">
                <div class="project-card__icon project-card__icon--emerald">
                  <ElIcon :size="18"><Folder /></ElIcon>
                </div>
                <div class="project-card__title">
                  <strong>目录规划</strong>
                  <span>部署、配置、依赖与日志目录</span>
                </div>
              </div>

              <div class="project-form project-form--1">
                <el-form-item
                  v-if="!isTomcatProjectType(project.projectType)"
                  label="根目录"
                  required
                  label-width="120px"
                >
                  <ScriptInlineEditorField
                    v-model="project.rootDirectory"
                    label="根目录"
                    placeholder="/opt/apps/gateway"
                    empty-text="点击填写根目录"
                    :show-language-toolbar="false"
                  />
                </el-form-item>
                <el-form-item
                  v-if="
                    !isStaticProjectType(project.projectType) &&
                    !isTomcatProjectType(project.projectType)
                  "
                  label="依赖目录"
                  label-width="120px"
                >
                  <ScriptInlineEditorField
                    v-model="project.libDirectory"
                    label="依赖目录"
                    placeholder="/opt/apps/gateway/lib"
                    empty-text="点击填写依赖目录"
                    :show-language-toolbar="false"
                  />
                </el-form-item>
                <el-form-item
                  v-if="
                    !isStaticProjectType(project.projectType) &&
                    !isTomcatProjectType(project.projectType)
                  "
                  label="配置目录"
                  label-width="120px"
                >
                  <ScriptInlineEditorField
                    v-model="project.configDirectory"
                    label="配置目录"
                    placeholder="/opt/apps/gateway/conf"
                    empty-text="点击填写配置目录"
                    :show-language-toolbar="false"
                  />
                </el-form-item>
                <el-form-item
                  v-if="isTomcatProjectType(project.projectType)"
                  label="Tomcat 位置"
                  label-width="120px"
                >
                  <ScriptInlineEditorField
                    v-model="project.tomcatHome"
                    label="Tomcat 位置"
                    placeholder="/opt/tomcat"
                    empty-text="点击填写 Tomcat 位置"
                    :show-language-toolbar="false"
                  />
                </el-form-item>
                <el-form-item
                  v-if="
                    !isStaticProjectType(project.projectType) &&
                    !isTomcatProjectType(project.projectType)
                  "
                  label="日志目录"
                  label-width="120px"
                >
                  <ScriptInlineEditorField
                    v-model="project.logDirectory"
                    label="日志目录"
                    placeholder="/opt/apps/gateway/logs"
                    empty-text="点击填写日志目录"
                    :show-language-toolbar="false"
                  />
                </el-form-item>
                <el-form-item
                  v-if="
                    !isStaticProjectType(project.projectType) &&
                    !isTomcatProjectType(project.projectType)
                  "
                  label="启动日志文件"
                  label-width="120px"
                >
                  <ScriptInlineEditorField
                    v-model="project.startupLogFile"
                    label="启动日志文件"
                    placeholder="/opt/apps/gateway/logs/console.log"
                    empty-text="点击填写启动日志文件"
                    :show-language-toolbar="false"
                  />
                </el-form-item>
                <el-form-item
                  v-if="
                    isSpringBootProjectType(project.projectType) ||
                    project.projectType === 'tomcat'
                  "
                  label="主包入口"
                  label-width="120px"
                >
                  <ScriptInlineEditorField
                    v-model="project.mainArtifact"
                    label="主包入口"
                    placeholder="gateway.jar / app.war"
                    empty-text="点击填写主包入口"
                    :show-language-toolbar="false"
                  />
                </el-form-item>
              </div>
            </section>
          </div>
        </ScTabPane>

        <!-- JVM Tab -->
        <ScTabPane v-if="isJavaProject" name="jvm">
          <template #label>
            <span class="project-tab-label">
              <span class="project-tab-icon project-tab-icon--amber">
                <ElIcon :size="16"><Cpu /></ElIcon>
              </span>
              JVM 参数
            </span>
          </template>

          <section class="project-card project-card--wide">
            <div class="project-card__header project-card__header--between">
              <div class="project-card__header-left">
                <div class="project-card__icon project-card__icon--amber">
                  <ElIcon :size="18"><Cpu /></ElIcon>
                </div>
                <div class="project-card__title">
                  <strong>JVM 参数编排</strong>
                  <span
                    >按行维护参数键和值，可直接调整单个参数，无需整段重写</span
                  >
                </div>
              </div>
              <div class="project-java-badge">
                <ElIcon :size="12"><InfoFilled /></ElIcon>
                {{ javaVersionHint }}
              </div>
            </div>

            <div class="jvm-list">
              <TransitionGroup name="jvm-row">
                <div
                  v-for="(row, index) in jvmRows"
                  :key="`jvm-${index}`"
                  class="jvm-item"
                >
                  <div class="jvm-item__index">{{ index + 1 }}</div>
                  <div class="jvm-item__fields">
                    <ScSelect
                      v-model="row.key"
                      filterable
                      allow-create
                      default-first-option
                      placeholder="参数键，如 -Xmx / -XX:+UseZGC"
                      class="jvm-item__key"
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
                      class="jvm-item__value"
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
                      class="jvm-item__value"
                    />
                    <div v-else class="jvm-item__switch">
                      <ElIcon :size="14"><Check /></ElIcon>
                      开关参数
                    </div>
                  </div>
                  <p class="jvm-item__tip">{{ resolveJvmTip(row.key) }}</p>
                  <ScButton
                    class="jvm-item__delete"
                    circle
                    plain
                    type="danger"
                    @click="removeJvmRow(index)"
                  >
                    <ElIcon><Delete /></ElIcon>
                  </ScButton>
                </div>
              </TransitionGroup>
            </div>

            <div class="jvm-actions">
              <ScButton plain type="primary" @click="addJvmRow">
                <ElIcon><Plus /></ElIcon>
                新增参数行
              </ScButton>
              <p class="jvm-actions__hint">
                已覆盖内存、GC（含
                ZGC）、容器感知、诊断、编码与时区。保存后将自动拼接为
                <code>jvmArgs</code> 字符串。
              </p>
            </div>
          </section>
        </ScTabPane>

        <!-- Spring Tab -->
        <ScTabPane v-if="isSpringProject" name="spring">
          <template #label>
            <span class="project-tab-label">
              <span class="project-tab-icon project-tab-icon--green">
                <ElIcon :size="16"><Operation /></ElIcon>
              </span>
              Spring 参数
            </span>
          </template>

          <section class="project-card project-card--wide">
            <div class="project-card__header">
              <div class="project-card__icon project-card__icon--green">
                <ElIcon :size="18"><Operation /></ElIcon>
              </div>
              <div class="project-card__title">
                <strong>Spring 参数配置</strong>
                <span>常用参数快速配置 + 自定义参数扩展（会注入启动命令）</span>
              </div>
            </div>

            <div class="project-form project-form--2">
              <el-form-item label="运行环境" label-width="100px">
                <el-input v-model="springProfilesActive" placeholder="prod" />
              </el-form-item>
              <el-form-item label="应用名" label-width="100px">
                <el-input
                  v-model="springApplicationName"
                  placeholder="gateway-service"
                />
              </el-form-item>
              <el-form-item label="服务端口" label-width="100px">
                <el-input v-model="springServerPort" placeholder="8080" />
              </el-form-item>
              <el-form-item label="配置地址" label-width="100px">
                <el-input
                  v-model="springConfigLocation"
                  placeholder="file:/opt/apps/gateway/config/"
                />
              </el-form-item>

              <!-- Switch Cards -->
              <div class="spring-switches">
                <div
                  class="spring-switch-card"
                  :class="{ 'spring-switch-card--active': springLoggingDebug }"
                  @click="springLoggingDebug = !springLoggingDebug"
                >
                  <div class="spring-switch-card__icon">
                    <ElIcon :size="18"><View /></ElIcon>
                  </div>
                  <div class="spring-switch-card__content">
                    <span class="spring-switch-card__label">日志级别</span>
                    <span class="spring-switch-card__value">{{ springLoggingDebug ? "DEBUG" : "INFO" }}</span>
                  </div>
                  <ScSwitch v-model="springLoggingDebug" @click.stop />
                </div>

                <div
                  class="spring-switch-card"
                  :class="{ 'spring-switch-card--active': springLazyInitialization }"
                  @click="springLazyInitialization = !springLazyInitialization"
                >
                  <div class="spring-switch-card__icon">
                    <ElIcon :size="18"><Timer /></ElIcon>
                  </div>
                  <div class="spring-switch-card__content">
                    <span class="spring-switch-card__label">延迟初始化</span>
                    <span class="spring-switch-card__value">{{ springLazyInitialization ? "true" : "false" }}</span>
                  </div>
                  <ScSwitch v-model="springLazyInitialization" @click.stop />
                </div>

                <div
                  class="spring-switch-card"
                  :class="{ 'spring-switch-card--active': springAnsiEnabled }"
                  @click="springAnsiEnabled = !springAnsiEnabled"
                >
                  <div class="spring-switch-card__icon">
                    <ElIcon :size="18"><Brush /></ElIcon>
                  </div>
                  <div class="spring-switch-card__content">
                    <span class="spring-switch-card__label">ANSI 彩色日志</span>
                    <span class="spring-switch-card__value">{{ springAnsiEnabled ? "always" : "never" }}</span>
                  </div>
                  <ScSwitch v-model="springAnsiEnabled" @click.stop />
                </div>
              </div>

              <el-form-item label="Actuator 暴露端点" label-width="140px">
                <el-input
                  v-model="springManagementExposure"
                  placeholder="health,info,prometheus"
                />
              </el-form-item>
              <el-form-item label="健康地址" label-width="140px">
                <el-input
                  v-model="project.healthCheckUrl"
                  placeholder="http://127.0.0.1:8080/actuator/health"
                />
              </el-form-item>
              <el-form-item
                class="project-form__full"
                label="自定义参数（每行一个）"
                label-width="160px"
              >
                <el-input
                  v-model="springCustomArgsText"
                  type="textarea"
                  :rows="4"
                  placeholder="--logging.level.root=INFO&#10;--management.endpoints.web.exposure.include=*"
                />
              </el-form-item>
              <div class="project-form__full spring-summary">
                <span class="spring-summary__label">当前汇总参数</span>
                <code class="spring-summary__code">{{ project.springArgs || "(空)" }}</code>
              </div>
            </div>
          </section>
        </ScTabPane>

        <!-- Inspect Tab -->
        <ScTabPane name="inspect">
          <template #label>
            <span class="project-tab-label">
              <span class="project-tab-icon project-tab-icon--cyan">
                <ElIcon :size="16"><Monitor /></ElIcon>
              </span>
              巡检与日志
            </span>
          </template>

          <section class="project-card project-card--wide">
            <div class="project-card__header">
              <div class="project-card__icon project-card__icon--cyan">
                <ElIcon :size="18"><Monitor /></ElIcon>
              </div>
              <div class="project-card__title">
                <strong>巡检与可观测</strong>
                <span>状态探针与运行说明</span>
              </div>
            </div>

            <div class="inspect-content">
              <div class="inspect-hint">
                <ElIcon :size="14"><InfoFilled /></ElIcon>
                当前项目由系统内置策略自动探测状态，不开放脚本编辑。
              </div>
            </div>
          </section>
        </ScTabPane>
      </ScTabs>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ScButton @click="visible = false">取消</ScButton>
        <ScButton type="primary" :loading="saving" @click="$emit('submit')">
          <ElIcon v-if="!saving"><Check /></ElIcon>
          保存项目
        </ScButton>
      </div>
    </template>
  </ScDialog>
</template>

<script setup lang="ts">
import {
  Brush,
  Check,
  Cpu,
  Delete,
  Document,
  Edit,
  Folder,
  FolderOpened,
  Grid,
  InfoFilled,
  Monitor,
  Operation,
  Plus,
  Refresh,
  Timer,
  User,
  VideoPause,
  VideoPlay,
  View,
  WarningFilled,
} from "@element-plus/icons-vue";
import { ElOption } from "element-plus";
import { computed, ref, watch, TransitionGroup } from "vue";
import ScSelect from "@repo/components/ScSelect/src/index.vue";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import type { RemoteProject } from "../../api/manage/remote";
import {
  applyProjectTypeDefaults,
  buildProjectTypeScriptTemplates,
  isSpringBootProjectType,
  isSpringBootResourceSplitType,
  isStaticProjectType,
  isTomcatProjectType,
  normalizeProjectType,
  projectTypeLabel,
  projectTypes,
  resolveProjectDirectoryPlan,
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
const projectTypeDescription = computed(() =>
  isTomcatProjectType(props.project.projectType)
    ? "Tomcat 类型固定使用后台内置启停脚本，仅支持 war/ear 部署包。"
    : isSpringBootResourceSplitType(props.project.projectType)
      ? "资源分离项目支持目录规划与目录级上传，保存时继续使用内置策略。"
      : "当前项目使用系统内置启停策略，不开放脚本编辑。",
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

const syncDirectoryPlanningFromRoot = (
  nextRoot?: string,
  previousRoot?: string,
) => {
  if (!String(nextRoot || "").trim()) {
    return;
  }
  const nextPlan = resolveProjectDirectoryPlan(props.project, nextRoot);
  const previousPlan = resolveProjectDirectoryPlan(props.project, previousRoot);
  (
    [
      "configDirectory",
      "libDirectory",
      "logDirectory",
      "startupLogFile",
    ] as const
  ).forEach((key) => {
    const currentValue = String(props.project[key] || "").trim();
    if (!currentValue || currentValue === previousPlan[key]) {
      props.project[key] = nextPlan[key];
    }
  });
};

watch(
  () => props.project.projectType,
  (nextType, previousType) => {
    applyProjectTypeDefaults(props.project);
    if (nextType !== previousType) {
      syncDirectoryPlanningFromRoot(
        props.project.rootDirectory,
        props.project.rootDirectory,
      );
    }
    applyTemplatesToProject(true);
  },
  { immediate: true },
);

watch(
  () => props.project.rootDirectory,
  (nextRoot, previousRoot) => {
    syncDirectoryPlanningFromRoot(nextRoot, previousRoot);
  },
);

watch(
  () => props.project.tomcatHome,
  () => {
    if (isTomcatProjectType(props.project.projectType)) {
      applyProjectTypeDefaults(props.project);
    }
  },
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
    if (!String(props.project.healthCheckUrl || "").trim()) {
      props.project.healthCheckUrl = `http://127.0.0.1:${springServerPort.value || "8080"}/actuator/health`;
    }
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
  {
    key: "-XX:+UseSerialGC",
    tip: "启用串行垃圾回收器（适用于单核CPU或小内存应用）",
    valueMode: "none",
  },
  {
    key: "-XX:+UseParallelGC",
    tip: "启用并行垃圾回收器（JDK 8 默认）",
    valueMode: "none",
  },
  {
    key: "-XX:ParallelGCThreads",
    tip: "并行GC线程数",
    valueMode: "text",
  },
  {
    key: "-XX:ConcGCThreads",
    tip: "并发GC线程数（G1/ZGC）",
    valueMode: "text",
  },
  {
    key: "-XX:+AlwaysPreTouch",
    tip: "JVM启动时立即分配所有内存页，避免运行时分配开销",
    valueMode: "none",
  },
  {
    key: "-XX:+UseStringDeduplication",
    tip: "启用字符串去重（G1 GC特有，减少内存占用）",
    valueMode: "none",
  },
  {
    key: "-XX:StringDeduplicationAgeThreshold",
    tip: "字符串去重年龄阈值（默认3）",
    valueMode: "text",
  },
  {
    key: "-XX:+PrintGC",
    tip: "打印GC基本信息",
    valueMode: "none",
  },
  {
    key: "-XX:+PrintGCDetails",
    tip: "打印详细的GC信息",
    valueMode: "none",
  },
  {
    key: "-XX:+PrintGCTimeStamps",
    tip: "打印GC时间戳",
    valueMode: "none",
  },
  {
    key: "-Xloggc",
    tip: "GC日志输出文件路径",
    valueMode: "text",
  },
  {
    key: "-XX:GCLogFileSize",
    tip: "GC日志文件大小限制",
    valueMode: "text",
  },
  {
    key: "-XX:NumberOfGCLogFiles",
    tip: "GC日志文件数量",
    valueMode: "text",
  },
  {
    key: "-XX:+UseGCLogFileRotation",
    tip: "启用GC日志文件轮转",
    valueMode: "none",
  },
  {
    key: "-XX:+FlightRecorder",
    tip: "启用Java Flight Recorder（JFR）",
    valueMode: "none",
  },
  {
    key: "-XX:StartFlightRecording",
    tip: "启动时自动开始JFR记录",
    valueMode: "text",
  },
  {
    key: "-XX:+PreserveFramePointer",
    tip: "保留帧指针，便于性能分析工具使用",
    valueMode: "none",
  },
  {
    key: "-XX:+UseBiasedLocking",
    tip: "启用偏向锁（JDK 15+ 默认禁用）",
    valueMode: "none",
  },
  {
    key: "-XX:BiasedLockingStartupDelay",
    tip: "偏向锁启动延迟（毫秒）",
    valueMode: "text",
  },
  {
    key: "-XX:+UseLargePages",
    tip: "启用大页面支持（需操作系统配置）",
    valueMode: "none",
  },
  {
    key: "-XX:LargePageSizeInBytes",
    tip: "大页面大小（如 2m, 4m）",
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
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Hero Section */
.project-hero {
  position: relative;
  padding: 28px 32px;
  border-radius: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.project-hero__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
}

.project-hero__glow--1 {
  top: -40px;
  left: -40px;
  width: 180px;
  height: 180px;
  background: rgba(59, 130, 246, 0.15);
}

.project-hero__glow--2 {
  bottom: -60px;
  right: -40px;
  width: 200px;
  height: 200px;
  background: rgba(16, 185, 129, 0.12);
}

.project-hero__content {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
  align-items: start;
}

.project-hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.project-hero__title {
  margin: 0 0 10px;
  font-size: 26px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.project-hero__desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: #64748b;
  max-width: 560px;
}

.project-hero__chips {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.project-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #475569;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.project-chip--primary {
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-color: #bfdbfe;
  color: #1e40af;
}

/* Tabs */
.project-tabs {
  :deep(.el-tabs__header) {
    margin: 0 0 16px;
  }

  :deep(.el-tabs__nav-wrap::after) {
    background: #e2e8f0;
    height: 1px;
  }

  :deep(.el-tabs__item) {
    height: 48px;
    padding: 0 20px;
    color: #64748b;
    font-weight: 500;
  }

  :deep(.el-tabs__item.is-active) {
    color: #1e40af;
  }

  :deep(.el-tabs__active-bar) {
    background: linear-gradient(90deg, #3b82f6, #2563eb);
    height: 2px;
    border-radius: 2px;
  }
}

.project-tab-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.project-tab-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #64748b;
  transition: all 0.2s;
}

.project-tab-icon--amber {
  background: #fef3c7;
  color: #d97706;
}

.project-tab-icon--green {
  background: #dcfce7;
  color: #16a34a;
}

.project-tab-icon--purple {
  background: #f3e8ff;
  color: #9333ea;
}

.project-tab-icon--cyan {
  background: #cffafe;
  color: #0891b2;
}

:deep(.el-tabs__item.is-active) .project-tab-icon {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
}

/* Grid Layout */
.project-grid {
  display: grid;
  gap: 16px;
}

.project-grid--2 {
  grid-template-columns: repeat(2, 1fr);
}

/* Card Component */
.project-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  transition: box-shadow 0.2s;
}

.project-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.project-card--wide {
  grid-column: 1 / -1;
}

.project-card__header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.project-card__header--between {
  justify-content: space-between;
  flex-wrap: wrap;
}

.project-card__header-left {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.project-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  flex-shrink: 0;
}

.project-card__icon--blue {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #2563eb;
}

.project-card__icon--emerald {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  color: #059669;
}

.project-card__icon--amber {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #d97706;
}

.project-card__icon--green {
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  color: #16a34a;
}

.project-card__icon--purple {
  background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
  color: #9333ea;
}

.project-card__icon--cyan {
  background: linear-gradient(135deg, #cffafe, #a5f3fc);
  color: #0891b2;
}

.project-card__title {
  display: flex;
  flex-direction: column;
  gap: 4px;

  strong {
    font-size: 15px;
    font-weight: 600;
    color: #0f172a;
  }

  span {
    font-size: 12px;
    color: #94a3b8;
  }
}

/* Form Layout */
.project-form {
  display: grid;
  gap: 14px;
}

.project-form--2 {
  grid-template-columns: repeat(2, 1fr);
}

.project-form--1 {
  grid-template-columns: 1fr;
}

.project-form__full {
  grid-column: 1 / -1;
}

.project-type-desc {
  grid-column: 1 / -1;
  margin: -4px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: #64748b;
}

/* Java Version Badge */
.project-java-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 20px;
  background: #fef3c7;
  color: #92400e;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

/* JVM Section - 改为 Flex 布局 */
.jvm-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.jvm-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.jvm-item:hover {
  border-color: #cbd5e1;
  background: #f1f5f9;
}

.jvm-item__index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #e2e8f0;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.jvm-item__fields {
  display: flex;
  flex: 1;
  gap: 10px;
  min-width: 0;
}

.jvm-item__key {
  flex: 1.4;
  min-width: 0;
}

.jvm-item__value {
  flex: 1;
  min-width: 0;
}

.jvm-item__switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px;
  height: 36px;
  border-radius: 8px;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  color: #94a3b8;
  font-size: 12px;
  flex-shrink: 0;
}

.jvm-item__tip {
  flex: 1;
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.4;
  min-width: 0;
}

.jvm-item__delete {
  flex-shrink: 0;
}

.jvm-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding-top: 8px;
}

.jvm-actions__hint {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.6;

  code {
    padding: 2px 6px;
    border-radius: 4px;
    background: #f1f5f9;
    color: #475569;
    font-family: ui-monospace, monospace;
  }
}

/* JVM Row Animation */
.jvm-row-enter-active,
.jvm-row-leave-active {
  transition: all 0.3s ease;
}

.jvm-row-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.jvm-row-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* Spring Switches */
.spring-switches {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.spring-switch-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s;
}

.spring-switch-card:hover {
  border-color: #cbd5e1;
}

.spring-switch-card--active {
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-color: #93c5fd;
}

.spring-switch-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #e2e8f0;
  color: #64748b;
  transition: all 0.2s;
}

.spring-switch-card--active .spring-switch-card__icon {
  background: #3b82f6;
  color: #fff;
}

.spring-switch-card__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.spring-switch-card__label {
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}

.spring-switch-card__value {
  font-size: 12px;
  color: #94a3b8;
  font-family: ui-monospace, monospace;
}

.spring-summary {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.spring-summary__label {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  white-space: nowrap;
}

.spring-summary__code {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e2e8f0;
  font-size: 12px;
  font-family: ui-monospace, monospace;
  color: #475569;
  word-break: break-all;
  line-height: 1.6;
}

/* Script Section */
.script-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 10px;
  background: #fef3c7;
  color: #92400e;
  font-size: 13px;
}

.script-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.script-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.script-card__header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.script-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
}

.script-card__icon--green {
  background: #dcfce7;
  color: #16a34a;
}

.script-card__icon--red {
  background: #fee2e2;
  color: #dc2626;
}

.script-card__icon--amber {
  background: #fef3c7;
  color: #d97706;
}

.script-card__label {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.script-card__required {
  color: #ef4444;
  font-size: 14px;
}

/* Inspect Section */
.inspect-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.inspect-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 10px;
  background: #fff7ed;
  color: #9a3412;
  font-size: 13px;
}

/* Dialog Footer */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Form Item Overrides */
:deep(.project-editor-dialog .el-dialog) {
  border-radius: 20px;
  overflow: hidden;
}

:deep(.project-editor-dialog .el-dialog__body) {
  padding: 16px 24px;
}

:deep(.project-editor-dialog .el-form-item) {
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.project-editor-dialog .el-form-item__label) {
  width: auto !important;
  padding: 0;
  margin: 0;
  color: #475569;
  font-weight: 500;
  font-size: 13px;
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
  border-radius: 10px;
}

:deep(.project-editor-dialog .el-input__wrapper:focus-within),
:deep(.project-editor-dialog .el-textarea__inner:focus) {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

/* Responsive */
@media (max-width: 1100px) {
  .project-hero__content {
    grid-template-columns: 1fr;
  }

  .project-hero__chips {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .project-grid--2 {
    grid-template-columns: 1fr;
  }

  .spring-switches {
    grid-template-columns: 1fr;
  }

  .script-grid {
    grid-template-columns: 1fr;
  }

  .jvm-item {
    flex-wrap: wrap;
  }

  .jvm-item__fields {
    flex: 1;
    min-width: 200px;
  }

  .jvm-item__tip {
    flex: none;
    width: 100%;
    order: 3;
    padding-left: 40px;
  }
}

@media (max-width: 768px) {
  .project-hero {
    padding: 20px;
  }

  .project-hero__title {
    font-size: 22px;
  }

  .project-form--2 {
    grid-template-columns: 1fr;
  }

  .project-card__header--between {
    flex-direction: column;
    gap: 12px;
  }

  .jvm-item {
    flex-direction: column;
    align-items: stretch;
  }

  .jvm-item__fields {
    flex-direction: column;
  }

  .jvm-item__tip {
    padding-left: 0;
  }
}
</style>



