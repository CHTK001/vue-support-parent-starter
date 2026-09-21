/**
 * 节点图标（24×24 viewBox 的描边 path，画在彩色圆角徽章里）
 *
 * 只收录采集/调度平台会用到的语义图标；页面可用 FlowNodeTypeDef.path 自带路径覆盖，
 * 未命中的 type 走 DEFAULT_FLOW_ICON。全部为描边图形，配合白色 stroke 在深底上更清晰。
 */

/** 未指定图标时的通用图形 */
export const DEFAULT_FLOW_ICON = "M6 5h12a1 1 0 011 1v12a1 1 0 01-1 1H6a1 1 0 01-1-1V6a1 1 0 011-1zm3 5h6m-6 4h4";

/** type → path d */
export const FLOW_ICON_PATHS: Record<string, string> = {
  start: "M9 6l10 6-10 6z",
  end: "M7 7h10v10H7z",
  request:
    "M12 3a9 9 0 100 18 9 9 0 000-18M3.5 9h17M3.5 15h17M12 3c2.6 2.4 4 5.6 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.6-4-9s1.4-6.6 4-9z",
  link: "M10.5 13.5a4 4 0 005.7 0l2.3-2.3a4 4 0 00-5.7-5.7L11.5 6.8M13.5 10.5a4 4 0 00-5.7 0l-2.3 2.3a4 4 0 005.7 5.7l1.3-1.3",
  extract: "M4 5h16l-6 7v6l-4 2v-8z",
  sql: "M12 4c4.4 0 8 1.2 8 2.8S16.4 9.6 12 9.6 4 8.4 4 6.8 7.6 4 12 4M4 6.8V17c0 1.6 3.6 2.8 8 2.8s8-1.2 8-2.8V6.8M4 11.9c0 1.6 3.6 2.8 8 2.8s8-1.2 8-2.8",
  output: "M12 3.5v9.5m0 0l-3.5-3.5M12 13l3.5-3.5M4.5 16.5V18a2 2 0 002 2h11a2 2 0 002-2v-1.5",
  variable:
    "M9.5 4.5H8a2 2 0 00-2 2v2.6L4.8 12l1.2 2.9V17.5a2 2 0 002 2h1.5M14.5 4.5H16a2 2 0 012 2v2.6l1.2 2.9-1.2 2.9v2.6a2 2 0 01-2 2h-1.5",
  dedup: "M12 3.2l7 2.8v5.6c0 4.1-2.9 7.4-7 8.8-4.1-1.4-7-4.7-7-8.8V6zM9 11.8l2.2 2.2 4.2-4.4",
  sleep: "M12 4a8 8 0 100 16 8 8 0 000-16M12 7.6V12l3.2 2",
  comment: "M5 5h14v10H9.5L5 19z",
  script: "M9 7L4.6 12 9 17M15 7l4.4 5L15 17",
  process: "M4 6.5h16v11H4zM8.5 12h6.5m0 0l-2.4-2.4M15 12l-2.4 2.4",
  function: "M7.5 19.5c1.9 0 2.4-1.2 2.8-3.9l1.9-9c.3-1.6 1-2.3 2.3-2.3M6 10.5h7M14 14l4.5 4.5m0-4.5L14 18.5",
  notice: "M12 4a5 5 0 00-5 5c0 3.9-1.3 5.3-2 6h14c-.7-.7-2-2.1-2-6a5 5 0 00-5-5zM10 19.2a2 2 0 004 0",
  condition: "M12 3.5L20.5 12 12 20.5 3.5 12z",
  loop: "M7.5 8.5h9a3.5 3.5 0 010 7H9m0 0l2.4-2.4M9 15.5l2.4 2.4M16.5 8.5l-2.4-2.4M16.5 8.5l-2.4 2.4",
  cache: "M12 3.5c4.7 0 8.5 1.4 8.5 3.2S16.7 9.9 12 9.9 3.5 8.5 3.5 6.7 7.3 3.5 12 3.5M3.5 6.7v10.6c0 1.8 3.8 3.2 8.5 3.2s8.5-1.4 8.5-3.2V6.7M3.5 12c0 1.8 3.8 3.2 8.5 3.2s8.5-1.4 8.5-3.2",
  delay: "M12 3.6a8.4 8.4 0 100 16.8 8.4 8.4 0 000-16.8M12 7.4v.2M12 16.4v.2M9.2 9.2l5.6 5.6m0-5.6l-5.6 5.6",
};

/** 取 path，未命中回退通用图形 */
export function resolveFlowIcon(type?: string): string {
  return (type && FLOW_ICON_PATHS[type]) || DEFAULT_FLOW_ICON;
}

/** 未指定配色时的循环取色 */
export const FLOW_TYPE_COLORS = [
  "#4f7cff",
  "#00b96b",
  "#f59a23",
  "#e5484d",
  "#8e4ec6",
  "#0aa2c0",
  "#d6409f",
  "#5b6b7b",
];

/** 按 type 稳定取一个主色 */
export function resolveFlowColor(type?: string): string {
  if (!type) return FLOW_TYPE_COLORS[0];
  let hash = 0;
  for (let i = 0; i < type.length; i += 1) {
    hash = (hash * 31 + type.charCodeAt(i)) >>> 0;
  }
  return FLOW_TYPE_COLORS[hash % FLOW_TYPE_COLORS.length];
}
