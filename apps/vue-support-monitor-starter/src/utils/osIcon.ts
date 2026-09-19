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
    '<path d="M14.62 8.35c-.42.28-1.75 1.04-1.95 1.19c-.39.31-.75.29-1.14-.01c-.2-.16-1.53-.92-1.95-1.19c-.48-.31-.45-.7.08-.92c1.64-.69 3.28-.64 4.91.03c.49.21.51.6.05.9m7.22 7.28c-.93-2.09-2.2-3.99-3.84-5.66a4.3 4.3 0 0 1-1.06-1.88c-.1-.33-.17-.67-.24-1.01c-.2-.88-.29-1.78-.7-2.61c-.73-1.58-2-2.4-3.84-2.47c-1.81.05-3.16.81-3.95 2.4c-.21.43-.36.88-.46 1.34c-.17.76-.32 1.55-.5 2.32c-.15.65-.45 1.21-.96 1.71c-1.61 1.57-2.9 3.37-3.88 5.35c-.14.29-.28.58-.37.88c-.19.66.29 1.12.99.96c.44-.09.88-.18 1.3-.31c.41-.15.57-.05.67.35c.65 2.15 2.07 3.66 4.24 4.5c4.12 1.56 8.93-.66 9.97-4.58c.07-.27.17-.37.47-.27c.46.14.93.24 1.4.35c.49.09.85-.16.92-.64c.03-.26-.06-.49-.16-.73"/>',
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
    const body = stroke.replace(/<(polyline|line|circle|path) /g, '<$1 style="stroke:currentColor" ');
    return `<svg class="os-ico" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  }
  // 主题样式会把内联 svg 的 path 填充为白色（iconify 图标的既定行为），只有内联 style 能盖住
  const body = PATH_ICONS[key].replace(/<path /g, '<path style="fill:currentColor" ');
  return `<svg class="os-ico" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" fill="currentColor">${body}</svg>`;
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
