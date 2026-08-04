/**
 * 模板入口 —— 按组件名索引所有已配置 schema
 *
 * 注册了 schema 的组件在调试页有「结构化参数面板」；
 * 未注册的组件在调试页自动退化为「通用调试模式」（原始 props JSON 编辑器）。
 */
import type { TemplateMeta } from "./types";
import { basicTemplates } from "./basic";
import { feedbackTemplates } from "./feedback";
import { dataTemplates } from "./data";

const allTemplates: TemplateMeta[] = [
  ...basicTemplates,
  ...feedbackTemplates,
  ...dataTemplates,
];

/** 通过组件名索引 */
export const templateMap: Map<string, TemplateMeta> = new Map(
  allTemplates.map((t) => [t.name, t]),
);

export type { TemplateMeta, PropField, TemplateState } from "./types";
export { createInitialState } from "./types";
export { generateTemplateCode, formatPropsForDebug } from "./code";