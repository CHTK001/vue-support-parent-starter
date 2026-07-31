/**
 * 设计令牌（框架无关）
 *
 * 换框架时令牌不变，各框架适配器（element-plus / koi / naive ...）共用同一份。
 * 修改这里的值即可全局换肤。
 */

export type ThemeMode = "light" | "dark";

export interface ThemeTokens {
  /** 明暗模式 */
  mode: ThemeMode;
  /** 品牌色 */
  colorPrimary: string;
  colorPrimaryHover: string;
  colorPrimaryActive: string;
  /** 中性色 */
  colorBg: string;
  colorBgContainer: string;
  colorText: string;
  colorTextSecondary: string;
  colorBorder: string;
  /** 功能色 */
  colorSuccess: string;
  colorWarning: string;
  colorError: string;
  colorInfo: string;
  /** 圆角 */
  borderRadius: string;
  /** 字号 */
  fontSize: string;
}

/** 亮色模式默认令牌 */
export const lightTokens: ThemeTokens = {
  mode: "light",
  colorPrimary: "#409eff",
  colorPrimaryHover: "#79bbff",
  colorPrimaryActive: "#337ecc",
  colorBg: "#f5f7fa",
  colorBgContainer: "#ffffff",
  colorText: "#303133",
  colorTextSecondary: "#606266",
  colorBorder: "#dcdfe6",
  colorSuccess: "#67c23a",
  colorWarning: "#e6a23c",
  colorError: "#f56c6c",
  colorInfo: "#909399",
  borderRadius: "4px",
  fontSize: "14px",
};

/** 暗色模式默认令牌 */
export const darkTokens: ThemeTokens = {
  mode: "dark",
  colorPrimary: "#409eff",
  colorPrimaryHover: "#79bbff",
  colorPrimaryActive: "#337ecc",
  colorBg: "#141414",
  colorBgContainer: "#1d1e1f",
  colorText: "#e5eaf3",
  colorTextSecondary: "#a3a6ad",
  colorBorder: "#4c4d4f",
  colorSuccess: "#67c23a",
  colorWarning: "#e6a23c",
  colorError: "#f56c6c",
  colorInfo: "#909399",
  borderRadius: "4px",
  fontSize: "14px",
};

/** 预设令牌集合，便于扩展更多主题 */
export const presetTokens: Record<string, ThemeTokens> = {
  light: lightTokens,
  dark: darkTokens,
};
