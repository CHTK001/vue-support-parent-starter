import { ref, type Component } from "vue";
import {
  Wrench24Filled,
  Edit32Filled,
  Search16Filled,
  CalendarAgenda20Regular,
  BookSearch24Regular,
  Code24Regular,
  WindowWrench16Regular,
  TaskListSquareLtr20Regular,
  EyeTracking16Filled,
  Window16Regular,
  WindowConsole20Filled,
} from "@vicons/fluent";
import Terminal from "@/components/icons/Terminal.vue";
import { t } from "@/locales";
import { parse as partialParse } from "partial-json";

export interface ToolCall {
  name?: string;
  arguments?: any;
  args?: any;
  outcome?: "success" | "error" | "rejected" | "aborted";
  metadata?: { [key: string]: any };
}

export interface InlineContentConfig {
  key: string;
  mode: "text" | "code";
  language?: string;
}

export interface ToolDisplayConfig {
  text: { executing: string; completed: string };
  /** 聚合展示文案，{n} 为数量占位符 */
  aggregate?: { executing: string; completed: string };
  argsKey?: string;
  /** 图标标识（TOOL_ICON_MAP 的 key） */
  icon?: string;
  inlineContent?: InlineContentConfig;
}

/**
 * 图标标识 → Vue 组件映射
 *
 * 插件通过 display.icon 声明字符串标识，前端在此映射为实际图标组件。
 * 纯前端渲染资源，不随语言包变化。
 */
export const TOOL_ICON_MAP: Record<string, Component> = {
  file: CalendarAgenda20Regular,
  read: CalendarAgenda20Regular,
  search: Search16Filled,
  edit: Edit32Filled,
  browser: WindowWrench16Regular,
  code: Code24Regular,
  window: Window16Regular,
  eye: EyeTracking16Filled,
  todo: TaskListSquareLtr20Regular,
  book: BookSearch24Regular,
  terminal: WindowConsole20Filled,
  console: WindowConsole20Filled,
  wrench: Wrench24Filled,
  time: Wrench24Filled,
  generic: Wrench24Filled,
  tool: Wrench24Filled,
};

export const DEFAULT_CONFIG: ToolDisplayConfig = {
  text: { executing: "", completed: "" },
  aggregate: { executing: "", completed: "" },
  icon: "wrench",
};

/** 获取带 i18n 翻译的默认工具展示配置 */
function getDefaultConfig(): ToolDisplayConfig {
  return {
    text: {
      executing: t("common.tool.calling"),
      completed: t("common.tool.called"),
    },
    aggregate: {
      executing: t("common.tool.executingSteps"),
      completed: t("common.tool.executedSteps"),
    },
    icon: "wrench",
  };
}

/**
 * 插件工具展示文案注册表
 *
 * 由后端 queryPlugins 返回，启动时加载。
 * key = 工具名, value = 后端已解析的最终文案（%key% 已替换为当前 locale 字符串）。
 */
const pluginToolDisplays = ref<Record<string, ToolDisplayConfig>>({});

/** 设置插件工具展示文案注册表 */
export function setPluginToolDisplays(
  displays: Record<string, ToolDisplayConfig>,
) {
  pluginToolDisplays.value = displays;
}

export function resolveToolName(tool: ToolCall): string {
  if (tool.name === "tool_use") {
    try {
      const parsed =
        typeof tool.arguments === "string"
          ? partialParse(tool.arguments)
          : tool.arguments;
      if (parsed?.tool_name) return parsed.tool_name;
    } catch {}
  }
  return tool.name || "";
}

/**
 * 内置工具的兜底展示。
 *
 * 用户口径（2026-10-08）：每个工具调用要**单独一行、可展开、默认折叠**，
 * 且 agent_send / list_files / agent_spawn 这类要显示成可辨认的名字而不是通用「调用工具」。
 * 后端 /v2/plugins/tool-displays 目前是空桩（恒返回 {}），插件注册表拿不到这些名字，
 * 故此处按工具名给出前端兜底图标（文案沿用 common.tool.*）。
 */
const BUILTIN_TOOL_ICONS: Record<string, string> = {
  // 子智能体
  agent_send: 'todo', agent_spawn: 'todo', agent_spawn_sub: 'todo', agent_cancel: 'todo',
  // 文件
  list_files: 'file', list_directory: 'file', list_dir: 'file', glob: 'file', ls: 'file',
  read_file: 'read', file_read: 'read', view_file: 'read',
  write_file: 'edit', file_write: 'edit', edit_file: 'edit', create_file: 'edit',
  search_files: 'search', grep: 'search', web_search: 'search', fetch: 'search',
  // 终端
  bash: 'terminal', shell: 'terminal', run_command: 'terminal', execute: 'terminal',
};

function getBuiltinConfig(name: string): ToolDisplayConfig | null {
  const icon = BUILTIN_TOOL_ICONS[name];
  if (!icon) return null;
  const defaults = getDefaultConfig();
  return { icon, text: defaults.text, aggregate: defaults.aggregate };
}

/**
 * 内置工具的动作名。
 *
 * 通用文案（common.tool.called = 「调用工具」）看不出这一步到底干了什么，
 * 一屏工具调用里全是同一句话，等于没有信息。这里按工具名给出可辨认的动作名，
 * 与 BUILTIN_TOOL_ICONS 同为前端兜底：后端 /v2/plugins/tool-displays 注册了文案时优先用后端的。
 */
const BUILTIN_TOOL_LABELS: Record<string, string> = {
  // 文件读取
  read_file: '读取文件', file_read: '读取文件', view_file: '读取文件', read: '读取文件',
  // 文件写入 / 编辑
  write_file: '写入', file_write: '写入', create_file: '新建文件',
  edit_file: '编辑', edit: '编辑', apply_patch: '编辑',
  // 检索
  grep: '搜索文件内容', search_files: '搜索文件', search: '搜索',
  glob: '按名匹配文件', list_files: '列出文件', list_directory: '列出目录', ls: '列出目录',
  web_search: '联网搜索', fetch: '抓取网页',
  // 终端
  bash: '运行命令', shell: '运行命令', execute: '运行命令', run_command: '运行命令',
  // 子智能体
  agent_send: '派发子智能体', agent_spawn: '创建子智能体', agent_cancel: '中止子智能体',
  // 其它
  todo_write: '更新任务清单',
};

/**
 * 取工具行要显示的动作名。
 *
 * 优先级：后端注册的插件文案 > 内置动作名 > 通用兜底文案。
 * 执行中/失败态由调用方按行状态追加，不在这里体现。
 */
export function getToolActionLabel(tool: ToolCall): string {
  const name = resolveToolName(tool);
  const custom = pluginToolDisplays.value[name];
  if (custom?.text?.completed) return custom.text.completed;
  const builtin = BUILTIN_TOOL_LABELS[name];
  if (builtin) return builtin;
  return getToolConfig(tool).text.completed;
}

/** 工具是否为终端/命令类：这类行的失败摘要在会话里是醒目的红色 */
export function isCommandTool(tool: ToolCall): boolean {
  const name = resolveToolName(tool);
  return name === 'bash' || name === 'shell' || name === 'execute' || name === 'run_command';
}

export function getToolConfig(tool: ToolCall): ToolDisplayConfig {
  const name = resolveToolName(tool);
  const custom = pluginToolDisplays.value[name];
  if (!custom) return getBuiltinConfig(name) ?? getDefaultConfig();
  // 防御性合并:插件注册的配置可能缺少 text/aggregate 等字段,补齐默认值避免渲染崩溃
  const defaults = getDefaultConfig();
  return {
    ...custom,
    text: {
      executing: custom.text?.executing ?? defaults.text.executing,
      completed: custom.text?.completed ?? defaults.text.completed,
    },
    aggregate: {
      executing: custom.aggregate?.executing ?? defaults.aggregate!.executing,
      completed: custom.aggregate?.completed ?? defaults.aggregate!.completed,
    },
  };
}

export function getToolIcon(tool: ToolCall): Component {
  const config = getToolConfig(tool);
  if (config.icon) {
    return TOOL_ICON_MAP[config.icon] || TOOL_ICON_MAP[DEFAULT_CONFIG.icon!];
  }
  return TOOL_ICON_MAP[DEFAULT_CONFIG.icon!];
}

export function formatArgSummary(value: any): string {
  if (typeof value !== "string") return String(value);
  return value.length > 60 ? value.substring(0, 260) : value;
}

export function getToolArgs(tool: ToolCall): any {
  if (tool.name === "tool_use") {
    try {
      const parsed =
        typeof tool.arguments === "string"
          ? partialParse(tool.arguments)
          : tool.arguments;
      if (parsed?.arguments) return parsed.arguments;
    } catch {}
  }
  return tool.arguments ?? tool.args;
}

export function getArgsText(tool: ToolCall): string | undefined {
  const params = getToolArgs(tool);
  if (!params) return undefined;

  let parsedParams = params;
  if (typeof params === "string") {
    try {
      parsedParams = partialParse(params);
    } catch {
      return undefined;
    }
  }

  if (!parsedParams || typeof parsedParams !== "object") return undefined;

  const config = getToolConfig(tool);
  const isKnownTool = resolveToolName(tool) in pluginToolDisplays.value;

  if (config.argsKey && parsedParams[config.argsKey]) {
    return formatArgSummary(parsedParams[config.argsKey]);
  }

  if (isKnownTool) return undefined;

  for (const value of Object.values(parsedParams)) {
    if (typeof value === "string" && value.length > 0) {
      return formatArgSummary(value);
    }
  }
  return undefined;
}

export function getInlineContent(tool: ToolCall): string | undefined {
  const config = getToolConfig(tool);
  if (!config.inlineContent) return undefined;

  const params = getToolArgs(tool);
  if (!params) return undefined;

  let parsedParams = params;
  if (typeof params === "string") {
    try {
      parsedParams = partialParse(params);
    } catch {
      return undefined;
    }
  }

  if (!parsedParams || typeof parsedParams !== "object") return undefined;

  const value = parsedParams[config.inlineContent.key];
  if (typeof value !== "string" || value.length === 0) return undefined;

  return value;
}

export function countSteps(items: any[]): number {
  return items.reduce((sum, item) => {
    if (item.type === "tool" && item.toolCalls?.length) {
      return sum + item.toolCalls.length;
    }
    return sum + 1;
  }, 0);
}
