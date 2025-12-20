/**
 * Layout 主题皮肤配置
 * @author CH
 * @date 2025-12-12
 * @version 1.0.0
 */

export interface LayoutTheme {
  name: string;
  key: string;
  description: string;
  stylesheet?: string;
  icon?: string;
}

/**
 * 主题皮肤列表
 */
export const layoutThemes: LayoutTheme[] = [
  {
    name: "默认",
    key: "default",
    description: "系统默认主题皮肤",
    icon: "ri:settings-3-line",
  },
  {
    name: "圣诞",
    key: "christmas",
    description: "圣诞主题皮肤，温馨浪漫",
    stylesheet: "christmas.scss",
    icon: "noto:christmas-tree",
  },
  {
    name: "春节",
    key: "spring-festival",
    description: "春节主题皮肤，喜庆祥和",
    stylesheet: "spring-festival.scss",
    icon: "noto:firecracker",
  },
  {
    name: "情人节",
    key: "valentines-day",
    description: "情人节主题皮肤，浪漫甜蜜",
    stylesheet: "valentines-day.scss",
    icon: "noto:red-heart",
  },
  {
    name: "中秋",
    key: "mid-autumn",
    description: "中秋主题皮肤，月圆人团圆",
    stylesheet: "mid-autumn.scss",
    icon: "noto:full-moon",
  },
  {
    name: "国庆",
    key: "national-day",
    description: "国庆主题皮肤，祝福祖国",
    stylesheet: "national-day.scss",
    icon: "twemoji:flag-china",
  },
  {
    name: "元旦",
    key: "new-year",
    description: "元旦主题皮肤，新年新气象",
    stylesheet: "new-year.scss",
    icon: "noto:party-popper",
  },
];

/**
 * 获取主题皮肤
 * @param themeKey 主题键值
 */
export const getLayoutTheme = (themeKey: string = "default"): LayoutTheme => {
  const theme = layoutThemes.find((t) => t.key === themeKey);
  return theme || layoutThemes[0];
};

/**
 * 加载主题皮肤样式表
 * @param themeKey 主题键值
 */
export const loadThemeStylesheet = (themeKey: string): void => {
  // 移除现有的主题样式表
  const existingLink = document.getElementById("layout-theme-stylesheet");
  if (existingLink) {
    existingLink.remove();
  }

  // 如果是默认主题，不需要加载额外样式
  if (themeKey === "default") {
    return;
  }

  const theme = getLayoutTheme(themeKey);
  if (theme.stylesheet) {
    const link = document.createElement("link");
    link.id = "layout-theme-stylesheet";
    link.rel = "stylesheet";
    link.href = `/themes/${theme.stylesheet}`;
    document.head.appendChild(link);
  }
};
