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
}

/**
 * 主题皮肤列表
 */
export const layoutThemes: LayoutTheme[] = [
  {
    name: "默认",
    key: "default",
    description: "默认主题皮肤",
  },
  {
    name: "元旦",
    key: "new-year",
    description: "元旦主题皮肤，新年新气象",
    stylesheet: "new-year.css",
  },
  {
    name: "春节",
    key: "spring-festival",
    description: "春节主题皮肤，喜庆祥和",
    stylesheet: "spring-festival.css",
  },
  {
    name: "情人节",
    key: "valentines-day",
    description: "情人节主题皮肤，浪漫甜蜜",
    stylesheet: "valentines-day.css",
  },
  {
    name: "中秋",
    key: "mid-autumn",
    description: "中秋主题皮肤，月圆人团圆",
    stylesheet: "mid-autumn.css",
  },
  {
    name: "国庆",
    key: "national-day",
    description: "国庆主题皮肤，祝福祖国",
    stylesheet: "national-day.css",
  },
  {
    name: "圣诞",
    key: "christmas",
    description: "圣诞主题皮肤，温馨浪漫",
    stylesheet: "christmas.css",
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

/**
 * 检测当前是否为节日期间，自动返回对应的主题
 */
export const detectFestivalTheme = (): LayoutTheme | null => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // 元旦（1月1日-1月3日）
  if (month === 1 && day >= 1 && day <= 3) {
    return layoutThemes.find((t) => t.key === "new-year") || null;
  }

  // 春节（农历正月初一前后15天，这里简化为公历1月20日-2月20日）
  if ((month === 1 && day >= 20) || (month === 2 && day <= 20)) {
    return layoutThemes.find((t) => t.key === "spring-festival") || null;
  }

  // 情人节（2月14日前后3天）
  if (month === 2 && day >= 12 && day <= 16) {
    return layoutThemes.find((t) => t.key === "valentines-day") || null;
  }

  // 中秋（农历八月十五前后7天，这里简化为公历9月10日-9月25日）
  if (month === 9 && day >= 10 && day <= 25) {
    return layoutThemes.find((t) => t.key === "mid-autumn") || null;
  }

  // 国庆节（10月1日-10月7日）
  if (month === 10 && day >= 1 && day <= 7) {
    return layoutThemes.find((t) => t.key === "national-day") || null;
  }

  // 圣诞（12月15日-12月31日）
  if (month === 12 && day >= 15) {
    return layoutThemes.find((t) => t.key === "christmas") || null;
  }

  return null;
};
