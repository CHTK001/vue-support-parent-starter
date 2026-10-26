/**
 * 代码生成 —— 根据 TemplateState 渲染可复制的 Vue 片段
 *
 * 通用逻辑：
 *   1) 遍历 props，过滤「与默认值相同」的属性（保持片段简洁）
 *   2) 布尔属性仅在 true 时输出（无值）
 *   3) 字符串/数字直接输出；对象/数组按 JSON 格式化
 *   4) v-model 与 default slot 内容附加到根标签
 *
 * 个别组件（v-model 形式、特殊插槽、嵌套）可在 TemplateMeta.generate 覆盖。
 */
import type { PropField, TemplateMeta, TemplateState } from "./types";

/** 格式化属性值（字符串加引号、数字直接、布尔仅 true、对象 JSON） */
function formatValue(value: unknown): string {
  if (value === true) return "";
  if (value === false || value === null || value === undefined) return "false";
  if (typeof value === "string") return `"${escapeAttr(value)}"`;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** XML 属性转义 */
function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** XML 文本转义 */
function escapeText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** 转成短横线（kebab-case） —— 仅展示用，props 保留原 key */
function kebab(s: string): string {
  return s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/** 判断值是否为「默认」 */
function isDefault(field: PropField, value: unknown): boolean {
  if (value === undefined) return true;
  if (field.default === undefined) return value === undefined;
  if (typeof value === "object") {
    return JSON.stringify(value) === JSON.stringify(field.default);
  }
  return value === field.default;
}

/** 通用代码生成 */
export function generateTemplateCode(meta: TemplateMeta, state: TemplateState): string {
  // 自定义生成器优先
  if (meta.generate) return meta.generate(state);

  const lines: string[] = [];
  const tag = meta.name;
  const attrs: string[] = [];

  for (const field of meta.props) {
    if (field.isSlot) continue; // 插槽不进 attrs
    // dataset 只是调试面板的分段控件，不是组件 prop：它把档位写进 nodes/edges 等
    // 真实字段，自己不该出现在生成的代码里。
    if (field.type === "dataset") continue;
    const value = state.values[field.key];
    if (isDefault(field, value)) continue;
    attrs.push(`${kebab(field.key)}=${formatValue(value)}`);
  }

  if (meta.modelable) {
    attrs.push(`v-model="value"`);
  }

  // 默认插槽文本
  const defaultSlotText = state.slots.default ?? "";

  // 是否有命名插槽
  const namedSlots = Object.entries(state.slots).filter(
    ([name, text]) => name !== "default" && text.trim() !== "",
  );

  if (!attrs.length && !defaultSlotText && !namedSlots.length) {
    return `<${tag} />`;
  }

  if (!defaultSlotText && !namedSlots.length) {
    lines.push(`<${tag}${attrs.length ? " " + attrs.join(" ") : ""} />`);
    return lines.join("\n");
  }

  const attrStr = attrs.length ? "\n  " + attrs.join("\n  ") : "";
  const slotLines: string[] = [];

  if (defaultSlotText) {
    slotLines.push(`  ${escapeText(defaultSlotText)}`);
  }
  for (const [name, text] of namedSlots) {
    slotLines.push(`  <template #${name}>`);
    slotLines.push(`    ${escapeText(text)}`);
    slotLines.push(`  </template>`);
  }

  lines.push(`<${tag}${attrStr}>`);
  lines.push(...slotLines);
  lines.push(`</${tag}>`);
  return lines.join("\n");
}

/** 仅生成 props 字符串（用于展示当前生效参数） */
export function formatPropsForDebug(meta: TemplateMeta, state: TemplateState): string {
  const out: string[] = [];
  for (const field of meta.props) {
    if (field.isSlot) continue;
    if (field.type === "dataset") continue;
    const value = state.values[field.key];
    out.push(`${field.key}: ${JSON.stringify(value)}`);
  }
  if (meta.modelable) {
    out.push(`v-model: ${JSON.stringify(state.model)}`);
  }
  return out.join("\n");
}