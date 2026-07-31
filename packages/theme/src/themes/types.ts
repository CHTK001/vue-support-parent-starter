/**
 * 主题定义类型
 */
import type { ThemeTokens } from "../tokens";

/** 主题唯一标识，供持久化与启动选择使用 */
export type ThemeId = "default" | "koi";

/** 一个完整的主题定义：亮/暗两套令牌 */
export interface ThemeDefinition {
  /** 主题标识（持久化用） */
  id: ThemeId;
  /** 主题展示名 */
  name: string;
  /** 亮色令牌 */
  light: ThemeTokens;
  /** 暗色令牌 */
  dark: ThemeTokens;
}
