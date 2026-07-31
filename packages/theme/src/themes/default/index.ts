/**
 * default 主题 —— 通用默认视觉体系（Element Plus 风格基底）
 */
import type { ThemeDefinition } from "../types";
import { darkTokens, lightTokens } from "../../tokens";

export const defaultTheme: ThemeDefinition = {
  id: "default",
  name: "默认主题",
  light: lightTokens,
  dark: darkTokens,
};
