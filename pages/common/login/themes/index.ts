/**
 * 登录页面主题配置
 * @author CH
 * @date 2025-12-12
 */

export interface LoginTheme {
  name: string;
  key: string;
  description: string;
  component: () => Promise<any>;
  preview?: string;
}

// 主题列表
export const loginThemes: LoginTheme[] = [
  {
    name: "现代简约",
    key: "modern",
    description: "现代化设计，简洁大方",
    // @ts-ignore
    component: () => import("./modern/index.vue"),
  },

  {
    name: "科技未来",
    key: "tech",
    description: "科技感十足，动态效果",
    // @ts-ignore
    component: () => import("./tech/index.vue"),
  },

  {
    name: "像素风",
    key: "pixel",
    description: "复古像素艺术风格",
    // @ts-ignore
    component: () => import("./pixel/index.vue"),
  },
];

// 节日主题
export const festivalThemes: LoginTheme[] = [];

/**
 * 根据配置获取主题
 * @param themeKey 主题key，支持 'random' 随机选择
 * @param enableFestival 是否启用节日主题
 */
export const getLoginTheme = (
  themeKey: string = "modern",
  enableFestival: boolean = true,
  disabledThemes: string[] = [],
): LoginTheme => {
  const disabledThemeSet = new Set(
    disabledThemes
      .map((item) => String(item || "").trim())
      .filter(Boolean),
  );
  const enabledLoginThemes = loginThemes.filter(
    (theme) => !disabledThemeSet.has(theme.key),
  );
  const enabledFestivalThemes = festivalThemes.filter(
    (theme) => !disabledThemeSet.has(theme.key),
  );
  const availableThemes = [...enabledLoginThemes, ...enabledFestivalThemes];
  const fallbackTheme = availableThemes[0] || loginThemes[0];

  // 检查是否在节日期间，自动启用节日主题
  if (enableFestival) {
    const festivalTheme = detectFestivalTheme(enabledFestivalThemes);
    if (festivalTheme) {
      return festivalTheme;
    }
  }

  // 随机主题
  if (themeKey === "random") {
    if (availableThemes.length === 0) {
      return fallbackTheme;
    }

    const randomIndex = Math.floor(Math.random() * availableThemes.length);
    return availableThemes[randomIndex];
  }

  // 查找指定主题（包括常规主题和节日主题）
  let theme = enabledLoginThemes.find((t) => t.key === themeKey);
  if (!theme) {
    theme = enabledFestivalThemes.find((t) => t.key === themeKey);
  }
  return theme || fallbackTheme;
};

/**
 * 检测当前是否为节日期间
 */
const detectFestivalTheme = (
  availableFestivalThemes: LoginTheme[],
): LoginTheme | null => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // 元旦（1月1日-1月3日）
  if (month === 1 && day >= 1 && day <= 3) {
    return availableFestivalThemes[0] || null; // 元旦主题
  }

  // 春节（农历正月初一前后15天，这里简化为公历1月20日-2月20日）
  if ((month === 1 && day >= 20) || (month === 2 && day <= 20)) {
    return availableFestivalThemes[1] || null; // 春节主题
  }

  // 情人节（2月14日前后7天）
  if (month === 2 && day >= 10 && day <= 16) {
    return availableFestivalThemes[2] || null; // 情人节主题
  }

  // 中秋（农历八月十五前后7天，这里简化为公历9月10日-9月25日）
  if (month === 9 && day >= 10 && day <= 25) {
    return availableFestivalThemes[3] || null; // 中秋主题
  }

  // 国庆节（10月1日-10月7日）
  if (month === 10 && day >= 1 && day <= 7) {
    return availableFestivalThemes[4] || null; // 国庆主题
  }

  // 万圣节（10月25日-11月2日）
  if ((month === 10 && day >= 25) || (month === 11 && day <= 2)) {
    return availableFestivalThemes.find((t) => t.key === "halloween") || null;
  }

  // 圣诞（12月15日-12月31日）
  if (month === 12 && day >= 15) {
    return availableFestivalThemes[5] || null; // 圣诞主题
  }

  return null;
};
