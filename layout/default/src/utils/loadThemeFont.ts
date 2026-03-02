/**
 * 主题字体动态加载工具
 * 根据主题动态加载对应的字体 CSS 文件
 */

/**
 * Pixelium 字体 CSS 链接引用
 */
let pixeliumFontLink: HTMLLinkElement | null = null;

/**
 * 加载 Pixelium 字体 CSS
 */
export function loadPixeliumFont(): void {
  // 如果已经加载，直接返回
  if (pixeliumFontLink && document.head.contains(pixeliumFontLink)) {
    return;
  }

  // 检查是否已存在相同的样式链接
  const existingLink = document.getElementById("pixelium-font-style") as HTMLLinkElement;
  if (existingLink) {
    pixeliumFontLink = existingLink;
    return;
  }

  try {
    // 动态导入 CSS 文件获取 URL
    import("@pixelium/web-vue/dist/font.css?url")
      .then((cssModule: any) => {
        const cssUrl = typeof cssModule === "string" ? cssModule : cssModule.default || cssModule;

        // 创建 link 标签
        const styleLink = document.createElement("link");
        styleLink.rel = "stylesheet";
        styleLink.href = cssUrl;
        styleLink.id = "pixelium-font-style";
        document.head.appendChild(styleLink);

        pixeliumFontLink = styleLink;
      })
      .catch((error) => {
        console.warn("[loadThemeFont] 加载 Pixelium 字体 CSS 失败:", error);
        // 如果动态导入失败，尝试直接使用路径
        const styleLink = document.createElement("link");
        styleLink.rel = "stylesheet";
        styleLink.href = "/node_modules/@pixelium/web-vue/dist/font.css";
        styleLink.id = "pixelium-font-style";
        document.head.appendChild(styleLink);
        pixeliumFontLink = styleLink;
      });
  } catch (error) {
    console.error("[loadThemeFont] 加载 Pixelium 字体 CSS 失败:", error);
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
  const existingLink = document.getElementById("pixelium-font-style");
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

