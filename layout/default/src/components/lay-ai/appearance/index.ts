import type { Component } from "vue";
import LayAiRobotAppearance from "./LayAiRobotAppearance.vue";

export interface AiAppearanceOption {
  label: string;
  value: string;
  tip?: string;
}

/**
 * AI 外观组件注册表
 * @description 统一由 lay-ai 提供，系统设置与 lay-ai-chat 复用同一套外观组件
 */
export const AI_APPEARANCE_COMPONENTS = {
  robot: LayAiRobotAppearance,
} as const satisfies Record<string, Component>;

export type AiAppearanceKey = keyof typeof AI_APPEARANCE_COMPONENTS;

export const AI_APPEARANCE_OPTIONS: Array<AiAppearanceOption> = [
  {
    label: "🤖 机器人",
    value: "robot",
    tip: "经典机器人造型",
  },
];

export function normalizeAiAppearanceKey(raw?: unknown): AiAppearanceKey {
  if (typeof raw === "string" && raw in AI_APPEARANCE_COMPONENTS) {
    return raw as AiAppearanceKey;
  }
  return "robot";
}

export function resolveAiAppearanceComponent(key?: unknown): Component {
  const normalized = normalizeAiAppearanceKey(key);
  return AI_APPEARANCE_COMPONENTS[normalized];
}
