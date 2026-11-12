/**
 * 字符终端配色方案（前端契约）。
 *
 * <p>配色存在后端系统配置里（键 {@code terminal.theme}，见
 * {@code TerminalThemeController}），所以「打开终端就用我的配色」不依赖
 * 任何一台机器的 localStorage。这里放四样东西：</p>
 *
 * <ul>
 *   <li>{@link TerminalTheme} —— 与 xterm 的 {@code ITheme} 对齐的 21 个颜色键；</li>
 *   <li>{@link DEFAULT_TERMINAL_THEME} / {@link TERMINAL_THEME_PRESETS} —— 后端
 *       拿不到时的兜底，以及设置面板里的内置预设；</li>
 *   <li>{@link encodeThemeParam} —— 把配色压成 URL-safe base64 塞进 iframe 的
 *       {@code theme} 参数（iframe 首次渲染时就要有颜色，晚一步会闪一下深色底）；</li>
 *   <li>自定义预设的读写（{@code /terminal/theme/presets}，一套一行配置）与
 *       {@link parseThemeJson} —— 从粘贴的 JSON 里挑出能识别的颜色键。</li>
 * </ul>
 *
 * <p>默认值与后端 {@code TerminalThemeController.DEFAULT_THEME} 必须保持一致：
 * 后端永远会返回完整 21 个键，前端这份只是「请求还没回来」和「接口挂了」的兜底。</p>
 *
 * @author CH
 * @since 4.0.0.57
 */
import { http, unwrapResult } from "@repo/utils";

/** 可编辑的颜色键（顺序即设置面板的显示顺序，与后端校验白名单一致） */
export const TERMINAL_THEME_KEYS = [
  "background",
  "foreground",
  "cursor",
  "cursorAccent",
  "selectionBackground",
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
  "brightBlack",
  "brightRed",
  "brightGreen",
  "brightYellow",
  "brightBlue",
  "brightMagenta",
  "brightCyan",
  "brightWhite",
] as const;

/** 单个颜色键 */
export type TerminalThemeKey = (typeof TERMINAL_THEME_KEYS)[number];

/** 一套配色：21 个键都必须有值，避免出现「只改了一半」的残缺主题 */
export type TerminalTheme = Record<TerminalThemeKey, string>;

/** ANSI 标准色（0-7） */
export const ANSI_KEYS: TerminalThemeKey[] = [
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
];

/** ANSI 明亮色（8-15） */
export const ANSI_BRIGHT_KEYS: TerminalThemeKey[] = [
  "brightBlack",
  "brightRed",
  "brightGreen",
  "brightYellow",
  "brightBlue",
  "brightMagenta",
  "brightCyan",
  "brightWhite",
];

/** 默认配色（底色/前景沿用终端页原有的 #111111 / #e6e6e6，升级后观感不变） */
export const DEFAULT_TERMINAL_THEME: TerminalTheme = {
  background: "#111111",
  foreground: "#e6e6e6",
  cursor: "#e6e6e6",
  cursorAccent: "#111111",
  selectionBackground: "#264f78",
  black: "#000000",
  red: "#cd3131",
  green: "#0dbc79",
  yellow: "#e5e510",
  blue: "#2472c8",
  magenta: "#bc3fbc",
  cyan: "#11a8cd",
  white: "#e5e5e5",
  brightBlack: "#666666",
  brightRed: "#f14c4c",
  brightGreen: "#23d18b",
  brightYellow: "#f5f543",
  brightBlue: "#3b8eea",
  brightMagenta: "#d670d6",
  brightCyan: "#29b8db",
  brightWhite: "#ffffff",
};

/**
 * 以默认配色为底，覆写若干键拼出一套完整配色。
 *
 * @param overrides 需要改的键
 * @returns 完整配色
 */
function withDefaults(overrides: Partial<TerminalTheme>): TerminalTheme {
  return { ...DEFAULT_TERMINAL_THEME, ...overrides };
}

/** 预设配色：给不想逐个调色的场景一个体面的起点 */
export const TERMINAL_THEME_PRESETS: { id: string; name: string; theme: TerminalTheme }[] = [
  { id: "default", name: "深色（默认）", theme: { ...DEFAULT_TERMINAL_THEME } },
  {
    id: "light",
    name: "亮色",
    theme: withDefaults({
      background: "#ffffff",
      foreground: "#1f2328",
      cursor: "#1f2328",
      cursorAccent: "#ffffff",
      selectionBackground: "#b6d7ff",
      black: "#24292f",
      red: "#cf222e",
      green: "#116329",
      yellow: "#7d4e00",
      blue: "#0969da",
      magenta: "#8250df",
      cyan: "#1b7c83",
      white: "#6e7781",
      brightBlack: "#57606a",
      brightRed: "#a40e26",
      brightGreen: "#1a7f37",
      brightYellow: "#9a6700",
      brightBlue: "#218bff",
      brightMagenta: "#a475f9",
      brightCyan: "#3192aa",
      brightWhite: "#8c959f",
    }),
  },
  {
    id: "dracula",
    name: "Dracula",
    theme: withDefaults({
      background: "#282a36",
      foreground: "#f8f8f2",
      cursor: "#f8f8f2",
      cursorAccent: "#282a36",
      selectionBackground: "#44475a",
      black: "#21222c",
      red: "#ff5555",
      green: "#50fa7b",
      yellow: "#f1fa8c",
      blue: "#bd93f9",
      magenta: "#ff79c6",
      cyan: "#8be9fd",
      white: "#f8f8f2",
      brightBlack: "#6272a4",
      brightRed: "#ff6e6e",
      brightGreen: "#69ff94",
      brightYellow: "#ffffa5",
      brightBlue: "#d6acff",
      brightMagenta: "#ff92df",
      brightCyan: "#a4ffff",
      brightWhite: "#ffffff",
    }),
  },
  {
    id: "solarized-dark",
    name: "Solarized Dark",
    theme: withDefaults({
      background: "#002b36",
      foreground: "#839496",
      cursor: "#93a1a1",
      cursorAccent: "#002b36",
      selectionBackground: "#073642",
      black: "#073642",
      red: "#dc322f",
      green: "#859900",
      yellow: "#b58900",
      blue: "#268bd2",
      magenta: "#d33682",
      cyan: "#2aa198",
      white: "#eee8d5",
      brightBlack: "#002b36",
      brightRed: "#cb4b16",
      brightGreen: "#586e75",
      brightYellow: "#657b83",
      brightBlue: "#839496",
      brightMagenta: "#6c71c4",
      brightCyan: "#93a1a1",
      brightWhite: "#fdf6e3",
    }),
  },
  {
    id: "high-contrast",
    name: "高对比",
    theme: withDefaults({
      background: "#000000",
      foreground: "#ffffff",
      cursor: "#ffff00",
      cursorAccent: "#000000",
      selectionBackground: "#0050a0",
      black: "#000000",
      red: "#ff5555",
      green: "#55ff55",
      yellow: "#ffff55",
      blue: "#5599ff",
      magenta: "#ff55ff",
      cyan: "#55ffff",
      white: "#ffffff",
      brightBlack: "#808080",
      brightRed: "#ff8080",
      brightGreen: "#80ff80",
      brightYellow: "#ffff80",
      brightBlue: "#80bfff",
      brightMagenta: "#ff80ff",
      brightCyan: "#80ffff",
      brightWhite: "#ffffff",
    }),
  },
];

/** 十六进制颜色（3/6/8 位），与后端校验口径一致 */
const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/**
 * 判断是否为合法颜色值。
 *
 * @param value 颜色串
 * @returns 合法返回 true
 */
export function isValidHexColor(value: string): boolean {
  return HEX_RE.test(value.trim());
}

/**
 * 补齐缺失键 / 丢弃非法值：接口只回了一部分键时也能直接用。
 *
 * @param raw 后端返回值（可能是残缺或脏数据）
 * @returns 完整配色
 */
export function normalizeTerminalTheme(raw: unknown): TerminalTheme {
  const theme: TerminalTheme = { ...DEFAULT_TERMINAL_THEME };
  if (!raw || typeof raw !== "object") return theme;
  const src = raw as Record<string, unknown>;
  for (const key of TERMINAL_THEME_KEYS) {
    const value = src[key];
    if (typeof value === "string" && isValidHexColor(value)) {
      theme[key] = value.trim().toLowerCase();
    }
  }
  return theme;
}

/**
 * 把配色压成 URL-safe base64，供 iframe 的 {@code theme} 参数使用。
 *
 * <p>着色值本身就是 ASCII，但这里仍按 UTF-8 逐字节编码：将来若加进中文描述字段，
 * {@code btoa} 直接抛 InvalidCharacterError 的坑不会再踩一次。</p>
 *
 * @param theme 配色
 * @returns URL-safe base64（无填充）
 */
export function encodeThemeParam(theme: TerminalTheme): string {
  const json = JSON.stringify(normalizeTerminalTheme(theme));
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** 读取后台保存的终端配色 */
export const getTerminalTheme = () =>
  http()
    .get("/ms/server/terminal/theme")
    .then(r => normalizeTerminalTheme(unwrapResult<TerminalTheme>(r)));

/** 保存终端配色（增量覆盖：只传要改的键，未传的键由后端保留库里当前值） */
export const saveTerminalTheme = (theme: TerminalTheme) =>
  http()
    .put("/ms/server/terminal/theme")
    .data(normalizeTerminalTheme(theme))
    .then(r => normalizeTerminalTheme(unwrapResult<TerminalTheme>(r)));

/**
 * 恢复默认配色（后端接口，供脚本/验收使用）。
 *
 * <p>前端设置面板的「恢复默认」已改成只重置草稿（点保存才落库），
 * 所以页面不再调用它；接口本身保留，作为「一键回到出厂配色」的服务端契约。</p>
 */
export const resetTerminalTheme = () =>
  http()
    .post("/ms/server/terminal/theme/reset")
    .then(r => normalizeTerminalTheme(unwrapResult<TerminalTheme>(r)));

/** 一套自定义预设 */
export interface TerminalThemePreset {
  id: string;
  name: string;
  theme: TerminalTheme;
}

/**
 * 列出自定义预设。
 *
 * <p>后端每套预设存一行配置（{@code terminal.theme.preset.<id>}），
 * 不做成一条 JSON 数组——{@code ms_server_config_value} 只有 2048 字符，
 * 两三套就会撑爆。</p>
 */
export const listTerminalPresets = () =>
  http()
    .get("/ms/server/terminal/theme/presets")
    .then(r => unwrapResult<TerminalThemePreset[]>(r) ?? []);

/**
 * 新增自定义预设。
 *
 * @param name  预设名称
 * @param theme 配色（整体入库，未给全的键按默认值补齐）
 */
export const saveTerminalPreset = (name: string, theme: TerminalTheme) =>
  http()
    .post("/ms/server/terminal/theme/presets")
    .data({ name, theme: normalizeTerminalTheme(theme) })
    .then(r => unwrapResult<TerminalThemePreset>(r));

/**
 * 更新一套自定义预设：改名并用给定配色覆盖（id 不变）。
 *
 * @param id    预设标识
 * @param name  新名称
 * @param theme 新配色
 */
export const updateTerminalPreset = (id: string, name: string, theme: TerminalTheme) =>
  http()
    .put(`/ms/server/terminal/theme/presets/${encodeURIComponent(id)}`)
    .data({ name, theme: normalizeTerminalTheme(theme) })
    .then(r => unwrapResult<TerminalThemePreset>(r));

/**
 * 删除自定义预设。
 *
 * @param id 预设标识
 */
export const deleteTerminalPreset = (id: string) =>
  http()
    .delete(`/ms/server/terminal/theme/presets/${encodeURIComponent(id)}`)
    .then(r => unwrapResult<boolean>(r));

/**
 * 别家格式的键名 → 本项目的键名。
 *
 * <p>Windows Terminal 的 color scheme 把光标色叫 {@code cursorColor}，
 * 部分导出工具把选区色叫 {@code selection}；只认自家那 21 个键的话，这两项会在
 * 导入时静默丢失。</p>
 */
const THEME_KEY_ALIASES: Record<string, TerminalThemeKey> = {
  cursorColor: "cursor",
  cursorAccentColor: "cursorAccent",
  selection: "selectionBackground",
};

/**
 * 从一段 JSON 里挑出能识别的颜色键。
 *
 * <p>兼容的输入：本页导出的 JSON、Windows Terminal 的 color scheme（光标键是
 * {@code cursorColor}，走别名映射）、以及其它同名字段的 JSON 配色。
 * iTerm2 导出的 {@code .itermcolors} 是 XML plist 不是 JSON —— 这里明确报出来，
 * 而不是抛一个「不是合法 JSON」让人猜。</p>
 *
 * <p>未知键忽略，缺的键由调用方保留现值（导入不该顺手改掉没提到的颜色）。</p>
 *
 * @param raw 粘贴的 JSON 文本
 * @returns 只包含合法颜色键的部分配色
 */
export function parseThemeJson(raw: string): Partial<TerminalTheme> {
  const text = String(raw ?? "").trim();
  if (!text) throw new Error("内容为空");
  if (/^<\?xml|^<plist/i.test(text)) {
    throw new Error("这是 iTerm2 的 .itermcolors（XML plist），不是 JSON，请先转成 JSON 再导入");
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("不是合法 JSON");
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("需要一个配色对象");
  }
  const src = data as Record<string, unknown>;
  const picked: Partial<TerminalTheme> = {};
  for (const key of TERMINAL_THEME_KEYS) {
    const value = src[key];
    if (typeof value !== "string") continue;
    const v = value.trim();
    if (!isValidHexColor(v)) continue;
    picked[key] = v.toLowerCase();
  }
  for (const [alias, key] of Object.entries(THEME_KEY_ALIASES)) {
    if (picked[key] !== undefined) continue;
    const value = src[alias];
    if (typeof value !== "string") continue;
    const v = value.trim();
    if (!isValidHexColor(v)) continue;
    picked[key] = v.toLowerCase();
  }
  if (!Object.keys(picked).length) {
    throw new Error("没识别到任何颜色键（需要 background / foreground / black…brightWhite）");
  }
  return picked;
}
