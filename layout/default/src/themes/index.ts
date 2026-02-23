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
  /** 基础风格：light-浅色, dark-深色 */
  baseStyle?: 'light' | 'dark';
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
    // baseStyle 不指定，由外部 ThemeManager 控制
  },
  // === 内测主题 ===
  {
    name: "像素风",
    key: "pixel-art",
    description: "像素风格主题，复古游戏体验",
    stylesheet: "pixel-art.scss",
    icon: "ri:gamepad-line",
    type: "beta",
    color: "#ff00ff",
    baseStyle: "light",
  },
  {
    name: "未来科技",
    key: "future-tech",
    description: "未来科技主题，科幻感十足",
    stylesheet: "future-tech.scss",
    icon: "ri:rocket-2-line",
    type: "beta",
    color: "#00ffff",
    baseStyle: "dark",
  },
  // === 节日主题 ===
  {
    name: "万圣节",
    key: "halloween",
    description: "深度定制万圣节主题，包含南瓜、幽灵、蜘蛛网等节日元素",
    stylesheet: "halloween.scss",
    icon: "noto:jack-o-lantern",
    type: "festival",
    color: "#ff7518",
    baseStyle: "dark",
  },
  {
    name: "春节",
    key: "spring-festival",
    description: "春节主题皮肤，喜庆祥和",
    stylesheet: "spring-festival.scss",
    icon: "noto:firecracker",
    type: "festival",
    color: "#f5222d",
    baseStyle: "light",
  },
  {
    name: "圣诞",
    key: "christmas",
    description: "圣诞主题皮肤，温馨浪漫",
    stylesheet: "christmas.scss",
    icon: "noto:christmas-tree",
    type: "festival",
    color: "#722ed1",
    baseStyle: "light",
  },
  {
    name: "中秋",
    key: "mid-autumn",
    description: "中秋主题皮肤，月圆人团圆",
    stylesheet: "mid-autumn.scss",
    icon: "noto:full-moon",
    type: "festival",
    color: "#13c2c2",
    baseStyle: "light",
  },
  {
    name: "元旦",
    key: "new-year",
    description: "元旦主题皮肤，新年新气象",
    stylesheet: "new-year.css",
    icon: "noto:party-popper",
    type: "festival",
    color: "#faad14",
    baseStyle: "light",
  },
];

/**
 * 获取当前启用的主题
 * @param themeKey 主题key
 */
export const getTheme = (themeKey: ThemeKey): LayoutTheme | undefined => {
  return layoutThemes.find((theme) => theme.key === themeKey);
};

/**
 * 获取所有可用主题
 */
export const getAvailableThemes = (): LayoutTheme[] => {
  return layoutThemes;
};

/**
 * 检测当前日期是否匹配某个节日主题
 * @returns 匹配的节日主题key，如果没有匹配则返回undefined
 */
export const detectFestivalTheme = (): ThemeKey | undefined => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const date = now.getDate();

  // 万圣节 (10.25 - 11.5)
  if ((month === 10 && date >= 25) || (month === 11 && date <= 5)) {
    return "halloween";
  }

  // 圣诞节 (12.20 - 12.31)
  if (month === 12 && date >= 20) {
    return "christmas";
  }

  // 元旦 (1.1 - 1.5)
  if (month === 1 && date <= 5) {
    return "new-year";
  }

  // 春节 (此处仅为示例，实际春节日期不固定，通常需要农历转换库)
  // 假设 2.1 - 2.15
  if (month === 2 && date <= 15) {
    return "spring-festival";
  }

  return undefined;
};

/**
 * 获取布局主题
 * @param themeKey
 */
export const getLayoutTheme = (themeKey: ThemeKey): LayoutTheme | undefined => {
  return layoutThemes.find((theme) => theme.key === themeKey);
};

// 动态导入主题样式
const themeModules = import.meta.glob('./*.{scss,css}');

/**
 * 动态加载主题样式表
 * @param themeKey
 */
export const loadThemeStylesheet = (themeKey: ThemeKey) => {
  const theme = getLayoutTheme(themeKey);
  if (!theme || !theme.stylesheet) return;

  const path = `./${theme.stylesheet}`;
  if (themeModules[path]) {
    themeModules[path]().then(() => {
      console.debug(`Theme stylesheet loaded: ${path}`);
    }).catch((e) => {
      console.error(`Failed to load theme stylesheet: ${path}`, e);
    });
  } else {
    console.warn(`Theme stylesheet not found: ${path}`);
  }
};
