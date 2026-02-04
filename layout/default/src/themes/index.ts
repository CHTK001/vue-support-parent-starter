/**
 * Layout 主题皮肤配置
 * @author CH
 * @date 2025-12-12
 * @version 2.0.0
 * @description 主题分类：常规主题(regular)、内测主题(beta)、节日主题(festival)
 */
import type { ThemeKey, ThemeType } from "../types/theme";

// 重新导出类型以保持向后兼容
export type { ThemeKey, ThemeType };

export interface LayoutTheme {
  name: string;
  key: ThemeKey;
  description: string;
  stylesheet?: string;
  icon?: string;
  /** 主题类型：regular-常规主题, beta-内测主题, festival-节日主题 */
  type: ThemeType;
  /** 主题颜色（用于显示） */
  color?: string;
}

/**
 * 主题皮肤列表
 */
export const layoutThemes: LayoutTheme[] = [
  // === 常规主题 ===
  {
    name: "默认",
    key: "default",
    description: "系统默认主题皮肤",
    icon: "ri:settings-3-line",
    type: "regular",
    color: "#409EFF",
  },
  // === 内测主题 ===
  {
    name: "赛博朋克",
    key: "cyberpunk",
    description: "赛博朋克风格主题，科技感十足",
    stylesheet: "cyberpunk.scss",
    icon: "ri:robot-2-line",
    type: "beta",
    color: "#00ffff",
  },
  {
    name: "现代科技",
    key: "modern-tech",
    description: "Modern Tech 现代科技主题，深色玻璃拟态风格",
    stylesheet: "modern-tech.css",
    icon: "ri:macbook-line",
    type: "beta",
    color: "#5b13ec",
  },
  {
    name: "新春灯笼",
    key: "lunar-spring-festival",
    description: "深度定制新春主题，灯笼样式标签、烟花粒子、新年装饰",
    stylesheet: "lunar-spring-festival.css",
    icon: "noto:red-paper-lantern",
    type: "beta",
    color: "#ff4d4f",
  },
  // === 节日主题 ===
  {
    name: "万圣节",
    key: "halloween",
    description: "万圣节主题，神秘诡异",
    stylesheet: "halloween.scss",
    icon: "noto:jack-o-lantern",
    type: "festival",
    color: "#ff7518",
  },
  {
    name: "春节",
    key: "spring-festival",
    description: "春节主题皮肤，喜庆祥和",
    stylesheet: "spring-festival.scss",
    icon: "noto:firecracker",
    type: "festival",
    color: "#f5222d",
  },
  {
    name: "圣诞",
    key: "christmas",
    description: "圣诞主题皮肤，温馨浪漫",
    stylesheet: "christmas.scss",
    icon: "noto:christmas-tree",
    type: "festival",
    color: "#722ed1",
  },
  {
    name: "中秋",
    key: "mid-autumn",
    description: "中秋主题皮肤，月圆人团圆",
    stylesheet: "mid-autumn.scss",
    icon: "noto:full-moon",
    type: "festival",
    color: "#13c2c2",
  },
  {
    name: "国庆",
    key: "national-day",
    description: "国庆主题皮肤，祝福祖国",
    stylesheet: "national-day.scss",
    icon: "twemoji:flag-china",
    type: "festival",
    color: "#fa541c",
  },
  {
    name: "元旦",
    key: "new-year",
    description: "元旦主题皮肤，新年新气象",
    stylesheet: "new-year.scss",
    icon: "noto:party-popper",
    type: "festival",
    color: "#1b2a47",
  },
];

/**
 * 获取主题皮肤
 * @param themeKey 主题键值
 */
export const getLayoutTheme = (themeKey: ThemeKey = "default"): LayoutTheme => {
  const theme = layoutThemes.find((t) => t.key === themeKey);
  return theme || layoutThemes[0];
};

/**
 * 根据类型筛选获取主题列表
 * @param types 主题类型数组
 */
export const getThemesByType = (types: ThemeType[]): LayoutTheme[] => {
  return layoutThemes.filter((t) => types.includes(t.type));
};

/**
 * 获取可用的主题列表（根据环境和权限过滤）
 * @param enableFestivalTheme 是否启用节日主题自动切换
 * @param userRoles 用户角色列表
 * @param isDevelopment 是否为开发环境
 * @param isTest 是否为测试环境
 * @description 
 *   - 常规主题和内测主题：始终显示，不受节日主题自动切换开关影响
 *   - 节日主题：仅在关闭自动切换时显示，开启自动切换时由系统自动管理
 */
export const getAvailableThemes = (
  enableFestivalTheme: boolean = true,
  userRoles: string[] = [],
  isDevelopment: boolean = false,
  isTest: boolean = false
): LayoutTheme[] => {
  let themes: LayoutTheme[] = [];

  // 常规主题始终可用（不受节日主题自动切换开关影响）
  themes = themes.concat(getThemesByType(['regular']));

  // 内测主题始终可用（所有用户都可以使用）
  themes = themes.concat(getThemesByType(['beta']));

  // 节日主题根据开关显示
  // 关闭自动切换时，显示所有节日主题供手动选择
  // 开启自动切换时，节日主题由系统自动管理，不在列表中显示
  if (!enableFestivalTheme) {
    themes = themes.concat(getThemesByType(['festival']));
  }

  return themes;
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
 * 检测当前日期是否匹配节日主题
 * @returns 匹配的节日主题，如果没有匹配则返回 null
 */
export const detectFestivalTheme = (): LayoutTheme | null => {
  const now = new Date();
  const month = now.getMonth() + 1; // 0-11 -> 1-12
  const date = now.getDate();
  
  // 春节：农历正月初一（简化处理：公历1-2月）
  if (month === 1 || month === 2) {
    // 这里可以添加更精确的农历计算逻辑
    // 简化处理：1月20日-2月20日视为春节期间
    if ((month === 1 && date >= 20) || (month === 2 && date <= 20)) {
      return getLayoutTheme("spring-festival");
    }
  }
  
  // 国庆：10月1日-10月7日
  if (month === 10 && date >= 1 && date <= 7) {
    return getLayoutTheme("national-day");
  }
  
  // 元旦：1月1日
  if (month === 1 && date === 1) {
    return getLayoutTheme("new-year");
  }
  
  // 中秋：农历八月十五（简化处理：公历9月15日-9月20日）
  if (month === 9 && date >= 15 && date <= 20) {
    return getLayoutTheme("mid-autumn");
  }
  
  // 圣诞：12月24日-12月26日
  if (month === 12 && date >= 24 && date <= 26) {
    return getLayoutTheme("christmas");
  }
  
  return null;
};