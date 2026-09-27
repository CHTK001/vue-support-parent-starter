/**
 * 回合级执行阶段归类
 *
 * 一个助手回合里可能先后发生：在线检索 → 深度思考 → 执行命令 → 编辑文件 → 组织回答。
 * 这些信息原本散落在 TurnItem 的分组标题里（每组各自折叠），
 * 摘要条需要的是「本回合一共发生了哪些阶段、各几次」，故在此归类。
 *
 * 阶段按**首次出现顺序**保留，这样摘要条读起来就是真实的时间线。
 */
import type { DisplayGroup } from "./messageUtils";

export type PhaseKind =
  | "search"
  | "think"
  | "command"
  | "editFile"
  | "read"
  | "web"
  | "tool"
  | "compose";

export interface TurnPhase {
  kind: PhaseKind;
  /** 该阶段在本回合出现的次数 */
  count: number;
}

/**
 * 工具名 → 阶段类别。
 *
 * 键统一小写；匹配时对工具名做同样的小写化，并去掉 MCP 前缀（形如 mcp__fs__read）。
 * 未命中的工具统一归到 tool，不臆造类别。
 */
const TOOL_KIND: Array<[PhaseKind, string[]]> = [
  // 编辑文件：真正落盘改内容的
  ["editFile", ["write", "edit", "multiedit", "notebookedit", "apply_patch", "create_file", "str_replace"]],
  // 执行命令：跑 shell / 脚本
  ["command", ["bash", "shell", "sh", "run_command", "runcommand", "exec", "execute", "terminal", "powershell", "cmd"]],
  // 读取文件：只读不改
  ["read", ["read", "read_file", "readfile", "view", "cat", "glob", "grep", "ls", "list_dir", "listdir", "search_files", "notebookread"]],
  // 联网
  ["web", ["websearch", "web_search", "webfetch", "web_fetch", "fetch", "browser", "http"]],
];

/**
 * 把单个工具名归到阶段类别。
 *
 * @param rawName 原始工具名（已 resolve 过）
 * @returns 阶段类别；无法识别时返回 tool
 */
export function toolNameToPhase(rawName: string): PhaseKind {
  if (!rawName) return "tool";
  // MCP 工具常见形如 `mcp__filesystem__read_file`，只取末段做匹配
  const tail = rawName.toLowerCase().split("__").pop() || rawName.toLowerCase();
  for (const [kind, names] of TOOL_KIND) {
    if (names.includes(tail)) return kind;
  }
  for (const [kind, names] of TOOL_KIND) {
    if (names.some((n) => tail.includes(n))) return kind;
  }
  return "tool";
}

/**
 * 从展示分组推导本回合的执行阶段序列。
 *
 * @param groups TurnItem 的 displayGroups
 * @param options.editedFileCount write/edit 归类出的文件数；>0 时确保 editFile 阶段出现
 *                           （工具名被归到 command 等其他类别时也能补上）
 * @returns 去重后的阶段序列，按首次出现顺序
 */
export function deriveTurnPhases(
  groups: DisplayGroup[],
  options: { editedFileCount?: number } = {},
): TurnPhase[] {
  const order: PhaseKind[] = [];
  const counts = new Map<PhaseKind, number>();

  const bump = (kind: PhaseKind): void => {
    if (!counts.has(kind)) {
      counts.set(kind, 0);
      order.push(kind);
    }
    counts.set(kind, (counts.get(kind) || 0) + 1);
  };

  let hasCompose = false;

  for (const group of groups) {
    if (group.type === "content") {
      // 有正文即视为「组织回答」阶段
      const hasText = group.items.some((i) => (i.content || "").trim().length > 0);
      if (hasText) hasCompose = true;
      continue;
    }

    for (const item of group.items) {
      if (item.type === "think") {
        bump("think");
        continue;
      }
      if (item.type === "search") {
        bump("search");
        continue;
      }
      if (item.type === "tool") {
        for (const tc of item.toolCalls || []) {
          const name = tc?.name || tc?.function?.name || "";
          bump(toolNameToPhase(name));
        }
      }
    }
  }

  if (hasCompose) bump("compose");

  // 有文件落盘变更时确保 editFile 阶段一定出现，
  // 避免工具名形态特殊时被归到别的类别导致摘要漏掉最显眼的阶段
  if ((options.editedFileCount || 0) > 0 && !counts.has("editFile")) {
    counts.set("editFile", 0);
    order.splice(order.length, 0, "editFile");
  }

  return order.map((kind) => ({ kind, count: counts.get(kind) || 0 }));
}
