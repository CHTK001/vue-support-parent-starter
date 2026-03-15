/**
 * 主题相关的 hooks
 */

export interface ThemeConfig {
  id: string;
  name: string;
  group?: string;
  colors?: Record<string, string>;
  [key: string]: any;
}

/**
 * 根据分组获取主题列表
 */
export function getThemesByGroup(group?: string): ThemeConfig[] {
  // 这里返回主题配置，可以从配置文件或API获取
  const allThemes: ThemeConfig[] = [
    { id: "default", name: "默认主题", group: "basic" },
    { id: "dark", name: "暗黑主题", group: "basic" },
    { id: "halloween", name: "万圣节主题", group: "festival" },
    { id: "christmas", name: "圣诞节主题", group: "festival" }
  ];

  if (!group) {
    return allThemes;
  }

  return allThemes.filter(theme => theme.group === group);
}

/**
 * 切换主题
 */
export function switchTheme(themeId: string): void {
  // 实现主题切换逻辑
  const html = document.documentElement;

  // 移除所有主题类
  html.classList.remove("theme-default", "theme-dark", "theme-halloween", "theme-christmas");

  // 添加新主题类
  html.classList.add(`theme-${themeId}`);

  // 保存到本地存储
  localStorage.setItem("current-theme", themeId);

  // 触发主题变更事件
  window.dispatchEvent(new CustomEvent("theme-change", { detail: { themeId } }));
}

/**
 * 获取当前主题
 */
export function getCurrentTheme(): string {
  return localStorage.getItem("current-theme") || "default";
}

/**
 * 初始化主题
 */
export function initTheme(): void {
  const savedTheme = getCurrentTheme();
  switchTheme(savedTheme);
}
