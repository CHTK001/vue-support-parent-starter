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
    name: "8-bit",
    key: "8bit",
    description: "8-bit 风格主题，复古游戏体验",
    stylesheet: "8bit.scss",
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
