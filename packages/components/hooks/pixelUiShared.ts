import type { Component } from "vue";
import * as PixelUiModule from "pixel-ui";
import pixelUiCssUrlModule from "pixel-ui/dist/index.css?url";

type PixelUiNamespace = Record<string, any>;

const pixelUiNamespace = PixelUiModule as PixelUiNamespace;
const pixelUiDefaultExport = (pixelUiNamespace.default ?? {}) as PixelUiNamespace;
const pixelUiCssUrl =
  typeof pixelUiCssUrlModule === "string"
    ? pixelUiCssUrlModule
    : ((pixelUiCssUrlModule as any)?.default ?? String(pixelUiCssUrlModule));

export const PIXEL_UI_THEME_STYLE_ID = "pixel-ui-theme-style";
export const PIXEL_UI_GLOBAL_ATTR = "data-pixel-ui-global";
export const PIXEL_UI_MODULE_NAMESPACE = pixelUiNamespace;
export const PIXEL_UI_PLUGIN = pixelUiNamespace.default ?? PixelUiModule;
export const PIXEL_UI_CSS_URL = pixelUiCssUrl;

let pixelUiStyleLink: HTMLLinkElement | null = null;
let globalPixelUiCssRefs = 0;
let componentPixelUiCssRefs = 0;

function getExistingPixelUiStyleLink(): HTMLLinkElement | null {
  if (typeof document === "undefined") {
    return null;
  }

  const existingLink = document.getElementById(
    PIXEL_UI_THEME_STYLE_ID,
  ) as HTMLLinkElement | null;

  if (existingLink) {
    pixelUiStyleLink = existingLink;
  }

  return existingLink;
}

function syncPixelUiStyleLinkState(link: HTMLLinkElement): void {
  if (link.href !== PIXEL_UI_CSS_URL) {
    link.href = PIXEL_UI_CSS_URL;
  }

  if (globalPixelUiCssRefs > 0) {
    link.setAttribute(PIXEL_UI_GLOBAL_ATTR, "true");
    return;
  }

  link.removeAttribute(PIXEL_UI_GLOBAL_ATTR);
}

function ensurePixelUiStyleLink(): HTMLLinkElement | null {
  if (typeof document === "undefined") {
    return null;
  }

  const existingLink = getExistingPixelUiStyleLink();
  if (existingLink) {
    syncPixelUiStyleLinkState(existingLink);
    return existingLink;
  }

  const styleLink = document.createElement("link");
  styleLink.rel = "stylesheet";
  styleLink.id = PIXEL_UI_THEME_STYLE_ID;
  document.head.appendChild(styleLink);

  pixelUiStyleLink = styleLink;
  syncPixelUiStyleLinkState(styleLink);
  return styleLink;
}

function syncPixelUiThemeCss(): HTMLLinkElement | null {
  if (typeof document === "undefined") {
    return null;
  }

  const totalRefs = globalPixelUiCssRefs + componentPixelUiCssRefs;
  if (totalRefs <= 0) {
    const existingLink = getExistingPixelUiStyleLink();
    if (existingLink) {
      existingLink.remove();
    }
    pixelUiStyleLink = null;
    return null;
  }

  const styleLink = ensurePixelUiStyleLink();
  if (styleLink) {
    syncPixelUiStyleLinkState(styleLink);
  }
  return styleLink;
}

export function preloadPixelUiResources(): void {
  void PIXEL_UI_MODULE_NAMESPACE;
  void PIXEL_UI_CSS_URL;
}

export function retainPixelUiThemeCss(
  options: { global?: boolean } = {},
): HTMLLinkElement | null {
  if (options.global) {
    globalPixelUiCssRefs += 1;
  } else {
    componentPixelUiCssRefs += 1;
  }

  return syncPixelUiThemeCss();
}

export function releasePixelUiThemeCss(
  options: { global?: boolean } = {},
): void {
  if (options.global) {
    globalPixelUiCssRefs = Math.max(0, globalPixelUiCssRefs - 1);
  } else {
    componentPixelUiCssRefs = Math.max(0, componentPixelUiCssRefs - 1);
  }

  syncPixelUiThemeCss();
}

export function removePixelUiThemeCss(): void {
  globalPixelUiCssRefs = 0;
  componentPixelUiCssRefs = 0;
  syncPixelUiThemeCss();
}

export function getPixelUiComponent(componentName: string): Component | null {
  const component =
    pixelUiNamespace[componentName] ?? pixelUiDefaultExport[componentName] ?? null;

  return component as Component | null;
}
