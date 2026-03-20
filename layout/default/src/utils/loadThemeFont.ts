/**
 * 主题字体动态加载工具
 * 根据主题动态加载对应的字体 CSS 文件
 */

/**
 * Pixelium 字体 CSS 链接引用
 */
let pixeliumFontLink: HTMLLinkElement | null = null;
const pixeliumFontSpecifier = "@mmt817/pixel-ui/dist/index.css?url";
const pixelUiStyleId = "pixel-ui-theme-style";
const pixelUiGlobalAttr = "data-pixel-ui-global";
const runtimeImport = new Function(
  "specifier",
  "return import(specifier);",
) as (specifier: string) => Promise<any>;

async function loadOptionalCssUrl(specifier: string): Promise<string | null> {
  try {
    const cssModule: any = await runtimeImport(specifier);
    return typeof cssModule === "string" ? cssModule : cssModule.default || cssModule;
  } catch {
    return null;
  }
}

/**
 * 加载 Pixelium 字体 CSS
 */
export function loadPixeliumFont(): void {
  // 如果已经加载，直接返回
  if (pixeliumFontLink && document.head.contains(pixeliumFontLink)) {
    return;
  }

  // 检查是否已存在相同的样式链接
  if (existingLink) {
    pixeliumFontLink = existingLink;
    pixeliumFontLink.setAttribute(pixelUiGlobalAttr, "true");
    return;
  }

  try {

        // 创建 link 标签
        const styleLink = document.createElement("link");
        styleLink.rel = "stylesheet";
        styleLink.href = cssUrl;
        styleLink.id = pixelUiStyleId;
        styleLink.setAttribute(pixelUiGlobalAttr, "true");
        document.head.appendChild(styleLink);

        pixeliumFontLink = styleLink;
      })
      .catch(() => {});
  } catch {
    // ignore optional theme font load failures
  }
}

/**
 * 移除 Pixelium 字体 CSS
 */
export function removePixeliumFont(): void {
  if (pixeliumFontLink) {
    pixeliumFontLink.remove();
    pixeliumFontLink = null;
  }

  // 也检查是否有通过 ID 存在的链接
  const existingLink = document.getElementById(pixelUiStyleId);
  if (existingLink) {
    existingLink.remove();
  }
}

/**
 * 根据主题加载对应的字体 CSS
 * @param themeKey 主题 key
 */
export function loadThemeFont(themeKey: string): void {
  if (themeKey === "8bit") {
    loadPixeliumFont();
  } else {
    removePixeliumFont();
  }
}
