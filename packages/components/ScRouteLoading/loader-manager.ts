/**
 * 路由加载动画样式管理
 * 单一数据源：首屏 loader、系统设置预览、开发切换器都读取 /loader-config.js 注入的 HTML/CSS 定义。
 */

export interface LoaderStyleDefinition extends LoaderRuntimeStyleDefinition {}

export const LOADER_APP_CONTAINER_ID = "app-loader";
export const LOADER_APP_STYLE_ID = "app-loader-style";
export const LOADER_SHELL_CLASS = "sys-loader-shell";
export const LOADER_PREVIEW_SHELL_CLASS = "sys-loader-shell--preview";

const DEFAULT_LOADER_BASE_STYLE_TEXT = `
html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #ffffff;
}

html.dark #app {
  background: #1a1a1a;
}

#${LOADER_APP_CONTAINER_ID} {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 32px;
  background:
    radial-gradient(circle at top, rgba(64, 110, 235, 0.08), transparent 44%),
    #ffffff;
  z-index: 9999;
}

html.dark #${LOADER_APP_CONTAINER_ID} {
  background:
    radial-gradient(circle at top, rgba(64, 110, 235, 0.14), transparent 44%),
    #111827;
}
`;

const DEFAULT_LOADER_STYLE: LoaderStyleDefinition = {
  key: "default",
  name: "三个圆点",
  description: "经典的三点跳动，适合通用加载页",
  previewScale: 0.46,
  html: '<div class="sys-loader-default"></div>',
  css: `
.sys-loader-default,
.sys-loader-default::before,
.sys-loader-default::after {
  width: 2.5em;
  height: 2.5em;
  border-radius: 50%;
  animation: sys-loader-load-animation 1.8s infinite ease-in-out;
  animation-fill-mode: both;
}

.sys-loader-default {
  position: relative;
  margin: 0 auto;
  font-size: 10px;
  color: #406eeb;
  text-indent: -9999em;
  transform: translateZ(0);
  animation-delay: -0.16s;
}

.sys-loader-default::before,
.sys-loader-default::after {
  position: absolute;
  top: 0;
  content: "";
}

.sys-loader-default::before {
  left: -3.5em;
  animation-delay: -0.32s;
}

.sys-loader-default::after {
  left: 3.5em;
}

@keyframes sys-loader-load-animation {
  0%,
  80%,
  100% {
    box-shadow: 0 2.5em 0 -1.3em;
  }

  40% {
    box-shadow: 0 2.5em 0 0;
  }
}
`.trim(),
};

const DEFAULT_LOADER_CONFIG: LoaderRuntimeConfig = {
  baseStyleText: DEFAULT_LOADER_BASE_STYLE_TEXT,
  definitions: [DEFAULT_LOADER_STYLE],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeDefinition(value: unknown): LoaderStyleDefinition | null {
  if (!isRecord(value)) {
    return null;
  }

  const key = normalizeString(value.key).trim();
  const html = normalizeString(value.html);
  const css = normalizeString(value.css);

  if (!key || !html || !css) {
    return null;
  }

  return {
    key,
    name: normalizeString(value.name, key),
    description: normalizeString(value.description),
    html,
    css,
    previewScale: normalizeNumber(value.previewScale),
  };
}

function normalizeRuntimeConfig(config: unknown): LoaderRuntimeConfig {
  if (!isRecord(config)) {
    return DEFAULT_LOADER_CONFIG;
  }

  const definitions = Array.isArray(config.definitions)
    ? config.definitions
        .map((item) => normalizeDefinition(item))
        .filter((item): item is LoaderStyleDefinition => !!item)
    : [];

  return {
    baseStyleText: normalizeString(
      config.baseStyleText,
      DEFAULT_LOADER_BASE_STYLE_TEXT,
    ),
    definitions: definitions.length ? definitions : DEFAULT_LOADER_CONFIG.definitions,
  };
}

function getRuntimeLoaderConfig(): LoaderRuntimeConfig {
  if (typeof window === "undefined") {
    return DEFAULT_LOADER_CONFIG;
  }

  return normalizeRuntimeConfig(window.__SYS_LOADER_CONFIG__);
}

const runtimeLoaderConfig = getRuntimeLoaderConfig();
const LOADER_DEFINITIONS = Object.freeze([...runtimeLoaderConfig.definitions]);

export const LOADER_BASE_STYLE_TEXT = runtimeLoaderConfig.baseStyleText;

const LOADER_SHELL_STYLE_TEXT = `
.${LOADER_SHELL_CLASS} {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
`.trim();

const LOADER_PREVIEW_SHELL_STYLE_TEXT = `
.${LOADER_SHELL_CLASS}.${LOADER_PREVIEW_SHELL_CLASS} {
  position: relative;
  inset: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0;
  background: transparent;
  z-index: auto;
}
`.trim();

export const LOADER_STYLES = Object.freeze(
  Object.fromEntries(LOADER_DEFINITIONS.map((item) => [item.key, item])),
) as Record<string, LoaderStyleDefinition>;

const LOADER_SHARED_STYLE_TEXT = LOADER_DEFINITIONS.map((item) => item.css)
  .concat(LOADER_SHELL_STYLE_TEXT)
  .join("\n")
  .trim();

export const LOADER_PREVIEW_STYLE_TEXT = [
  LOADER_SHARED_STYLE_TEXT,
  LOADER_PREVIEW_SHELL_STYLE_TEXT,
]
  .filter(Boolean)
  .join("\n")
  .trim();

export const LOADER_APP_STYLE_TEXT = [
  LOADER_BASE_STYLE_TEXT,
  LOADER_SHARED_STYLE_TEXT,
]
  .filter(Boolean)
  .join("\n");

export function getLoaderStyle(key?: string): LoaderStyleDefinition {
  return (
    LOADER_STYLES[key ?? ""] ||
    LOADER_STYLES.default ||
    LOADER_DEFINITIONS[0] ||
    DEFAULT_LOADER_STYLE
  );
}

export function getLoaderStyleEntries(): LoaderStyleDefinition[] {
  return [...LOADER_DEFINITIONS];
}

function renderLoaderShellMarkup(
  loader: LoaderStyleDefinition,
  extraClass?: string,
): string {
  const className = [LOADER_SHELL_CLASS, extraClass].filter(Boolean).join(" ");

  return `<div class="${className}" data-loader-key="${loader.key}">${loader.html}</div>`;
}

export function renderLoaderMarkup(key?: string): string {
  const loader = getLoaderStyle(key);

  return renderLoaderShellMarkup(loader);
}

export function renderLoaderPreviewMarkup(key?: string): string {
  const loader = getLoaderStyle(key);

  return renderLoaderShellMarkup(loader, LOADER_PREVIEW_SHELL_CLASS);
}
