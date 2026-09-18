/**
 * 平台图标 —— 全站统一的一套常规单色图标（Linux/Windows/macOS/Android/本机/其他）
 *
 * 统一 24x24 视口、currentColor 描色、1em 尺寸（外层容器用 font-size 控制大小），
 * 因此卡片、表格、主机画像、终端资源条、编辑弹窗选择器复用同一份图标。
 */

/** 操作系统类型 → 图标 key */
export function osIconKey(osType?: string | null): string {
  const s = (osType ?? "").toUpperCase();
  if (s.includes("ANDROID")) return "android";
  if (s.includes("WIN")) return "windows";
  if (s.includes("LINUX")) return "linux";
  if (s.includes("MAC") || s.includes("DARWIN")) return "macos";
  if (s.includes("LOCAL")) return "local";
  return "other";
}

/** 24x24 实心路径集合（随 currentColor 取色） */
const PATH_ICONS: Record<string, string> = {
  linux:
    '<path d="M12 2.4c-2.9 0-5.2 1.5-5.2 3.3 0 1.2.7 2.2 1.7 2.9C7.2 9.5 6.2 10.9 6.2 12.5c0 1.2.6 2.2 1.4 2.9-.1.9-.5 1.7-1.1 2.4-.3.3-.2.8.1 1 .3.2.7.2 1 0 .8-.5 1.4-1 1.9-1.4.5.1.9.2 1.4.2.6 0 1.2-.1 1.7-.3.6.4 1.2.7 1.9 1 .4.1.7-.1.8-.5.1-.4.1-.8-.1-1.1-.2-.3-.4-.5-.6-.8-.6-.7-.9-1.5-1-2.4.8-.8 1.3-1.9 1.3-3 0-.4-.1-.8-.2-1.2.3-.6.4-1.3.4-2 0-1.8-2.3-3.3-5.2-3.3zm3.7 4.6c.2 0 .3.5.3 1.2s-.1 1.2-.3 1.2-.3-.5-.3-1.2.1-1.2.3-1.2zm-7.4 0c.2 0 .3.5.3 1.2s-.1 1.2-.3 1.2-.3-.5-.3-1.2.1-1.2.3-1.2z"/>',
  windows:
    '<path d="M1.5 6.3 10.2 5.1v6.4H1.5zM11.7 4.8 22.5 3.3v8.2H11.7zM1.5 12.7h8.7v6.4L1.5 18zM11.7 12.7h10.8v8.3l-10.8-1.8z"/>',
  macos:
    '<path d="M16.6 12.5c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 6.9 1.2 9.1.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 2.9-.7 1.3 0 1.7.7 3 .7 1.2 0 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.2-2.6 0 0-2.7-1-2.7-3.6zM14.2 5.4c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.6 1.3-.6.7-1 1.6-.9 2.6 1 .1 2-.5 2.6-1.2z"/>',
  android:
    '<path d="M17.3 11.6H6.7v6.7c0 .6.5 1.1 1.1 1.1h.7v2.1c0 .6.5 1.1 1.1 1.1s1.1-.5 1.1-1.1v-2.1h2.6v2.1c0 .6.5 1.1 1.1 1.1s1.1-.5 1.1-1.1v-2.1h.7c.6 0 1.1-.5 1.1-1.1zM4.5 11.1c-.6 0-1.1.5-1.1 1.1v4.9c0 .6.5 1.1 1.1 1.1s1.1-.5 1.1-1.1v-4.9c0-.6-.5-1.1-1.1-1.1zm15 0c-.6 0-1.1.5-1.1 1.1v4.9c0 .6.5 1.1 1.1 1.1s1.1-.5 1.1-1.1v-4.9c0-.6-.5-1.1-1.1-1.1zm-2-5.6.9-1.6c.1-.2.1-.3-.1-.4-.2-.1-.3-.1-.4.1l-.9 1.7c-.9-.4-2-.6-3-.6s-2.1.2-3 .6L6.1 3.2c-.1-.2-.3-.2-.4-.1s-.2.3-.1.4l.9 1.6C4.9 6.2 4 7.9 4 9.8h16c0-1.9-.9-3.6-2.5-4.3zM8.9 6.9c-.4 0-.7-.3-.7-.7s.3-.7.7-.7.7.3.7.7-.3.7-.7.7zm6.2 0c-.4 0-.7-.3-.7-.7s.3-.7.7-.7.7.3.7.7-.3.7-.7.7z"/>',
  local:
    '<path d="M3 5.2h18v10.4H3zM8.6 17.4h6.8v1.4h3.4v1.4H5.2v-1.4h3.4z"/>',
};

/** 描线图标（未知平台兜底，走 stroke 而非 fill） */
const STROKE_ICONS: Record<string, string> = {
  other:
    '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',
};

/**
 * 平台图标内联 SVG（配合 v-html 渲染）
 * @param osType 操作系统类型
 */
export function osIconSvg(osType?: string | null): string {
  const key = osIconKey(osType);
  const stroke = STROKE_ICONS[key];
  if (stroke) {
    return `<svg class="os-ico" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${stroke}</svg>`;
  }
  return `<svg class="os-ico" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" fill="currentColor">${PATH_ICONS[key]}</svg>`;
}

const OS_LABEL: Record<string, string> = {
  linux: "Linux",
  windows: "Windows",
  macos: "macOS",
  android: "Android",
  local: "本机",
  other: "其他",
};

/**
 * 平台名称（图标加载场景下的兜底文案）
 * @param osType 操作系统类型
 */
export function osLabel(osType?: string | null): string {
  return OS_LABEL[osIconKey(osType)];
}
