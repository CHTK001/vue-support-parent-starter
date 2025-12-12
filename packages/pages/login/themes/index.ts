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
    name: "商务专业",
    key: "business",
    description: "商务风格，专业稳重",
    // @ts-ignore
    component: () => import("./business/index.vue"),
  },
];

// 节日主题
export const festivalThemes: LoginTheme[] = [
  {
    name: "元旦",
    key: "new-year",
    description: "元旦主题，新年新气象",
    // @ts-ignore
    component: () => import("./festival/new-year.vue"),
  },
  {
    name: "春节",
    key: "spring-festival",
    description: "春节主题，喜庆祥和",
    // @ts-ignore
    component: () => import("./festival/spring-festival.vue"),
  },
  {
    name: "情人节",
    key: "valentines-day",
    description: "情人节主题，浪漫甜蜜",
    // @ts-ignore
    component: () => import("./festival/valentines-day.vue"),
  },
  {
    name: "中秋",
    key: "mid-autumn",
    description: "中秋主题，月圆人团圆",
    // @ts-ignore
    component: () => import("./festival/mid-autumn.vue"),
  },
  {
    name: "国庆",
    key: "national-day",
    description: "国庆主题，祝福祖国",
    // @ts-ignore
    component: () => import("./festival/national-day.vue"),
  },
  {
    name: "圣诞",
    key: "christmas",
    description: "圣诞主题，温馨浪漫",
    // @ts-ignore
    component: () => import("./festival/christmas.vue"),
  },
];

/**
 * 根据配置获取主题
 * @param themeKey 主题key，支持 'random' 随机选择
 * @param enableFestival 是否启用节日主题
 */
export const getLoginTheme = (
  themeKey: string = "modern",
  enableFestival: boolean = true
): LoginTheme => {
  // 检查是否在节日期间，自动启用节日主题
  if (enableFestival) {
    const festivalTheme = detectFestivalTheme();
    if (festivalTheme) {
      return festivalTheme;
    }
  }

  // 随机主题
  if (themeKey === "random") {
    const randomIndex = Math.floor(Math.random() * loginThemes.length);
    return loginThemes[randomIndex];
  }

  // 查找指定主题（包括常规主题和节日主题）
  let theme = loginThemes.find((t) => t.key === themeKey);
  if (!theme) {
    theme = festivalThemes.find((t) => t.key === themeKey);
  }
  return theme || loginThemes[0];
};

/**
 * 检测当前是否为节日期间
 */
const detectFestivalTheme = (): LoginTheme | null => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // 元旦（1月1日-1月3日）
  if (month === 1 && day >= 1 && day <= 3) {
    return festivalThemes[0]; // 元旦主题
  }

  // 春节（农历正月初一前后15天，这里简化为公历1月20日-2月20日）
  if ((month === 1 && day >= 20) || (month === 2 && day <= 20)) {
    return festivalThemes[1]; // 春节主题
  }

  // 情人节（2月14日前后7天）
  if (month === 2 && day >= 10 && day <= 16) {
    return festivalThemes[2]; // 情人节主题
  }

  // 中秋（农历八月十五前后7天，这里简化为公历9月10日-9月25日）
  if (month === 9 && day >= 10 && day <= 25) {
    return festivalThemes[3]; // 中秋主题
  }

  // 国庆节（10月1日-10月7日）
  if (month === 10 && day >= 1 && day <= 7) {
    return festivalThemes[4]; // 国庆主题
  }

  // 圣诞（12月15日-12月31日）
  if (month === 12 && day >= 15) {
    return festivalThemes[5]; // 圣诞主题
  }

  return null;
};
