/**
 * 登录页主题配置工具
 * @author CH
 * @date 2025-12-13
 * @version 1.0.0
 */

export interface ThemeConfig {
  /** 登录页主题 */
  LoginTheme: string;
  /** 是否启用节日主题 */
  EnableFestivalTheme: boolean;
}

const STORAGE_KEY = "login-theme-config";
const DEFAULT_CONFIG: ThemeConfig = {
  LoginTheme: "modern",
  EnableFestivalTheme: true,
};

/**
 * 获取主题配置
 * @returns 主题配置对象
 */
export function getThemeConfig(): ThemeConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        LoginTheme: parsed.LoginTheme || DEFAULT_CONFIG.LoginTheme,
        EnableFestivalTheme:
          parsed.EnableFestivalTheme !== undefined
            ? parsed.EnableFestivalTheme
            : DEFAULT_CONFIG.EnableFestivalTheme,
      };
    }
  } catch (error) {
    console.warn("[ThemeConfig] Failed to parse theme config from storage:", error);
  }
  return DEFAULT_CONFIG;
}

/**
 * 保存主题配置
 * @param config 主题配置对象
 */
export function saveThemeConfig(config: Partial<ThemeConfig>): void {
  try {
    const currentConfig = getThemeConfig();
    const newConfig = { ...currentConfig, ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    console.debug("[ThemeConfig] Theme config saved:", newConfig);
  } catch (error) {
    console.error("[ThemeConfig] Failed to save theme config:", error);
  }
}

/**
 * 重置主题配置到默认值
 */
export function resetThemeConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.debug("[ThemeConfig] Theme config reset to default");
  } catch (error) {
    console.error("[ThemeConfig] Failed to reset theme config:", error);
  }
}

/**
 * 设置登录主题
 * @param theme 主题key
 */
export function setLoginTheme(theme: string): void {
  saveThemeConfig({ LoginTheme: theme });
}

/**
 * 获取登录主题
 * @returns 主题key
 */
export function getLoginTheme(): string {
  return getThemeConfig().LoginTheme;
}

/**
 * 设置是否启用节日主题
 * @param enable 是否启用
 */
export function setEnableFestivalTheme(enable: boolean): void {
  saveThemeConfig({ EnableFestivalTheme: enable });
}

/**
 * 获取是否启用节日主题
 * @returns 是否启用
 */
export function getEnableFestivalTheme(): boolean {
  return getThemeConfig().EnableFestivalTheme;
}
