/**
 * koi 主题 —— koi 品牌视觉体系
 *
 * 与 default 主题完全解耦，构建时只选择一套打进产物。
 * 修改这里即可自定义 koi 的整体观感（品牌色、中性色、圆角等）。
 */
import type { ThemeDefinition } from "../types";
import type { ThemeTokens } from "../../tokens";

const light: ThemeTokens = {
  mode: "light",
  colorPrimary: "#6d5dfc",
  colorPrimaryHover: "#8f83fd",
  colorPrimaryActive: "#5a4bd9",
  colorBg: "#f6f7fb",
  colorBgContainer: "#ffffff",
  colorText: "#1f2430",
  colorTextSecondary: "#5c6270",
  colorBorder: "#e3e6ef",
  colorSuccess: "#2fbf71",
  colorWarning: "#f5a524",
  colorError: "#f04a5d",
  colorInfo: "#9aa3b2",
  borderRadius: "8px",
  fontSize: "14px",
};

const dark: ThemeTokens = {
  mode: "dark",
  colorPrimary: "#7d6dff",
  colorPrimaryHover: "#9b8fff",
  colorPrimaryActive: "#6656e6",
  colorBg: "#14151f",
  colorBgContainer: "#1d1f2d",
  colorText: "#eef0f8",
  colorTextSecondary: "#a4aabc",
  colorBorder: "#33364a",
  colorSuccess: "#2fbf71",
  colorWarning: "#f5a524",
  colorError: "#f04a5d",
  colorInfo: "#7c8494",
  borderRadius: "8px",
  fontSize: "14px",
};

export const koiTheme: ThemeDefinition = {
  id: "koi",
  name: "Koi 主题",
  light,
  dark,
};
