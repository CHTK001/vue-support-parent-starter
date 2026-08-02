/**
 * PureAdmin 主题 —— 基于 vue-pure-admin 的品牌视觉体系
 *
 * 与 koi 主题完全解耦，构建时只选择一套打进产物。
 */
import type { ThemeDefinition } from "../types";
import type { ThemeTokens } from "../../tokens";

const light: ThemeTokens = {
  mode: "light",
  colorPrimary: "#409EFF", // pureadmin 经典亮蓝
  colorPrimaryHover: "#79BBFF",
  colorPrimaryActive: "#337ECC",
  colorBg: "#F5F7FA",
  colorBgContainer: "#FFFFFF",
  colorText: "#1F2329",
  colorTextSecondary: "#86909C",
  colorBorder: "#E5E6EB",
  colorSuccess: "#2EA8A3",
  colorWarning: "#FAB740",
  colorError: "#F56065",
  colorInfo: "#86909C",
  borderRadius: "4px",
  fontSize: "14px",
};

const dark: ThemeTokens = {
  mode: "dark",
  colorPrimary: "#409EFF",
  colorPrimaryHover: "#79BBFF",
  colorPrimaryActive: "#337ECC",
  colorBg: "#181A1B",
  colorBgContainer: "#1E2329",
  colorText: "#EDEFF0",
  colorTextSecondary: "#86909C",
  colorBorder: "#2D333B",
  colorSuccess: "#2EA8A3",
  colorWarning: "#FAB740",
  colorError: "#F56065",
  colorInfo: "#86909C",
  borderRadius: "4px",
  fontSize: "14px",
};

export const pureadminTheme: ThemeDefinition = {
  id: "pureadmin",
  name: "PureAdmin 主题",
  light,
  dark,
};
