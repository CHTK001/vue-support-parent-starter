import type { ProjectType, RemoteProject } from "../../api/manage/remote";

const SPRING_BOOT_RESOURCE_SPLIT_ALIASES = new Set<string>([
  "springboot_resource_split",
  "springboot_resource_isolation",
  "springboot_resource_separation",
  "spring_boot_resource_split",
  "spring_boot_resource_isolation",
  "spring_boot_resource_separation",
  "springboot-resource-split",
  "springboot-resource-isolation",
  "springboot-resource-separation",
]);

const STATIC_PROJECT_ALIASES = new Set<string>([
  "static",
  "nginx-static",
  "nginx_static",
  "nginx_static_site",
  "static_site",
]);

const normalizeTypeToken = (type?: string) =>
  String(type || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");

export const normalizeProjectType = (type?: string) => {
  const raw = normalizeTypeToken(type);
  if (!raw) {
    return "";
  }
  if (SPRING_BOOT_RESOURCE_SPLIT_ALIASES.has(raw)) {
    return "springboot_resource_isolation";
  }
  if (STATIC_PROJECT_ALIASES.has(raw)) {
    return "static";
  }
  return raw;
};

export const isSpringBootProjectType = (type?: string) => {
  const normalized = normalizeProjectType(type);
  return (
    normalized === "springboot" ||
    normalized === "springboot_resource_isolation"
  );
};

export const isSpringBootResourceSplitType = (type?: string) =>
  normalizeProjectType(type) === "springboot_resource_isolation";

export const isStaticProjectType = (type?: string) =>
  normalizeProjectType(type) === "static";

export const projectTypes: { label: string; value: ProjectType }[] = [
  { label: "Spring Boot", value: "springboot" },
  { label: "资源分离 Spring Boot", value: "springboot_resource_isolation" },
  { label: "Tomcat", value: "tomcat" },
  { label: "Node.js", value: "nodejs" },
  { label: "Python", value: "python" },
  { label: "静态站点", value: "static" },
  { label: "Docker", value: "docker" },
  { label: "自定义", value: "custom" },
];

export const projectTypeLabel = (type?: string) =>
  projectTypes.find((item) => item.value === normalizeProjectType(type))
    ?.label ??
  type ??
  "未知类型";

export const statusLabel = (status?: string) => {
  const map: Record<string, string> = {
    running: "运行中",
    stopped: "已停止",
    error: "异常",
    unknown: "未知",
  };
  return map[status || "unknown"] ?? "未知";
};

export const statusTone = (status?: string) => {
  switch (status) {
    case "running":
      return "running";
    case "error":
      return "error";
    case "stopped":
      return "stopped";
    default:
      return "unknown";
  }
};

export const formatSize = (size?: number) => {
  if (!size) return "0 B";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024)
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const trimText = (value?: string) => String(value || "").trim();
const isCustomProjectType = (project: RemoteProject) =>
  normalizeProjectType(project.projectType) === "custom";

export const hasStartScript = (project: RemoteProject) =>
  Boolean(trimText(project.startScript));

export const hasStopScript = (project: RemoteProject) =>
  Boolean(trimText(project.stopScript));

export const hasCustomLifecycleScript = (project: RemoteProject) =>
  Boolean(
    hasStartScript(project) ||
    hasStopScript(project) ||
    trimText(project.restartScript),
  );

export const hasRequiredLifecycleScripts = (project: RemoteProject) => {
  if (!isCustomProjectType(project)) {
    return true;
  }
  return hasStartScript(project);
};

export const resolveLifecycleModeLabel = (project: RemoteProject) =>
  isCustomProjectType(project)
    ? hasRequiredLifecycleScripts(project)
      ? "脚本控制"
      : "脚本未就绪"
    : "内置策略";

export const resolveLifecycleHint = (project: RemoteProject) => {
  if (!isCustomProjectType(project)) {
    return "按项目类型执行内置启动/停止/重启策略";
  }
  if (!hasStartScript(project)) {
    return "需配置启动脚本";
  }
  if (trimText(project.restartScript)) {
    return "启动/停止/重启均使用项目脚本";
  }
  if (hasStopScript(project)) {
    return "已配置启动/停止脚本，重启将按停止+启动顺序执行";
  }
  return "停止脚本为空时将按 PID/进程关键字兜底停止";
};

export const resolveStartCommandPreview = (project: RemoteProject) => {
  if (!isCustomProjectType(project)) {
    return "系统按项目类型自动生成启动命令";
  }
  const custom = trimText(project.startScript);
  if (custom) {
    return custom;
  }
  return "未配置启动脚本";
};

export const buildDefaultProject = (): RemoteProject => ({
  projectName: "",
  projectType: "springboot",
  rootDirectory: "",
  libDirectory: "",
  configDirectory: "",
  logDirectory: "",
  startupLogFile: "",
  startScript: "",
  stopScript: "",
  restartScript: "",
  statusScript: "",
  mainArtifact: "",
  jvmArgs: "",
  springArgs: "",
  description: "",
});

const normalizePath = (value?: string) => String(value || "").trim();

const joinPath = (base: string, sub: string) => {
  const normalizedBase = normalizePath(base).replace(/[\\/]+$/, "");
  const normalizedSub = normalizePath(sub).replace(/^[\\/]+/, "");
  if (!normalizedBase) {
    return normalizedSub;
  }
  if (!normalizedSub) {
    return normalizedBase;
  }
  const separator = normalizedBase.includes("\\") ? "\\" : "/";
  return `${normalizedBase}${separator}${normalizedSub}`;
};

const ensureTrailingSlash = (value: string) => {
  const path = normalizePath(value);
  if (!path) {
    return "";
  }
  return /[\\/]$/.test(path) ? path : `${path}/`;
};

const buildPidFile = (rootDirectory: string) => joinPath(rootDirectory, ".app.pid");

const buildSpringArgsSegment = (
  project: RemoteProject,
  defaultConfigDirectory: string,
) => {
  const springArgs = normalizePath(project.springArgs);
  const hasConfigLocation = /--spring\.config\.location(=|\s)/.test(springArgs);
  const configArg = hasConfigLocation
    ? ""
    : `--spring.config.location="${ensureTrailingSlash(defaultConfigDirectory)}"`;
  const merged = [springArgs, configArg].filter(Boolean).join(" ").trim();
  return merged ? `${merged} ` : "";
};

export const applyProjectTypeDefaults = (project: RemoteProject) => {
  const normalizedType = normalizeProjectType(project.projectType);
  const rootDirectory = normalizePath(project.rootDirectory);
  if (!rootDirectory) {
    return;
  }
  if (isSpringBootProjectType(normalizedType)) {
    if (!normalizePath(project.configDirectory)) {
      project.configDirectory = joinPath(rootDirectory, "config");
    }
    if (isSpringBootResourceSplitType(normalizedType)) {
      if (!normalizePath(project.libDirectory)) {
        project.libDirectory = joinPath(rootDirectory, "lib");
      }
    }
  }
};

export const buildProjectTypeScriptTemplates = (project: RemoteProject) => {
  const normalizedType = normalizeProjectType(project.projectType);
  const rootDirectory = normalizePath(project.rootDirectory) || ".";
  const mainArtifact = normalizePath(project.mainArtifact) || "app.jar";
  const logDirectory = normalizePath(project.logDirectory) || joinPath(rootDirectory, "logs");
  const startupLogFile =
    normalizePath(project.startupLogFile) || joinPath(logDirectory, "console.log");
  const configDirectory = normalizePath(project.configDirectory) || joinPath(rootDirectory, "config");
  const libDirectory = normalizePath(project.libDirectory) || joinPath(rootDirectory, "lib");
  const jvmArgs = normalizePath(project.jvmArgs);
  const pidFile = buildPidFile(rootDirectory);
  const statusScript = [
    `for pid in $(pgrep -f -- "${mainArtifact}" 2>/dev/null); do`,
    `  cmd=$(ps -p "$pid" -o args= 2>/dev/null)`,
    `  echo "$cmd" | grep -E "pgrep -f --|grep -F --|grep -E --" >/dev/null && continue`,
    `  echo running`,
    `  exit 0`,
    `done`,
    `echo stopped`,
  ].join("\n");

  if (normalizedType === "springboot") {
    const jvmPart = jvmArgs ? `${jvmArgs} ` : "";
    const springArgsPart = buildSpringArgsSegment(project, configDirectory);
    const startScript = [
      `mkdir -p "${logDirectory}"`,
      `cd "${rootDirectory}"`,
      `nohup java ${jvmPart}-jar "${mainArtifact}" ${springArgsPart}> "${startupLogFile}" 2>&1 &`,
      `echo $! > "${pidFile}"`,
    ].join("\n");
    const stopScript = [
      `if [ -f "${pidFile}" ]; then kill $(cat "${pidFile}") 2>/dev/null || true; rm -f "${pidFile}"; fi`,
      `pkill -f "${mainArtifact}" 2>/dev/null || true`,
    ].join("\n");
    const restartScript = `${stopScript}\nsleep 2\n${startScript}`;
    return {
      startScript,
      stopScript,
      restartScript,
      statusScript,
    };
  }

  if (normalizedType === "springboot_resource_isolation") {
    const jvmPart = jvmArgs ? `${jvmArgs} ` : "";
    const springArgsPart = buildSpringArgsSegment(project, configDirectory);
    const startScript = [
      `mkdir -p "${logDirectory}"`,
      `cd "${rootDirectory}"`,
      `nohup java ${jvmPart}-Dloader.path="${libDirectory}" -jar "${mainArtifact}" ${springArgsPart}> "${startupLogFile}" 2>&1 &`,
      `echo $! > "${pidFile}"`,
    ].join("\n");
    const stopScript = [
      `if [ -f "${pidFile}" ]; then kill $(cat "${pidFile}") 2>/dev/null || true; rm -f "${pidFile}"; fi`,
      `pkill -f "${mainArtifact}" 2>/dev/null || true`,
    ].join("\n");
    const restartScript = `${stopScript}\nsleep 2\n${startScript}`;
    return {
      startScript,
      stopScript,
      restartScript,
      statusScript,
    };
  }

  return null;
};

export const validateProjectTypeRequiredFields = (project: RemoteProject) => {
  const normalizedType = normalizeProjectType(project.projectType);
  const misses: string[] = [];
  if (!isSpringBootProjectType(normalizedType)) {
    return misses;
  }
  if (isSpringBootResourceSplitType(normalizedType)) {
    if (!normalizePath(project.libDirectory)) {
      misses.push("依赖目录");
    }
    if (!normalizePath(project.configDirectory)) {
      misses.push("配置目录");
    }
  }
  return misses;
};
