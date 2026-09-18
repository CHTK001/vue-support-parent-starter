/**
 * ModelLogo — 模型图标
 *
 * 按模型名（name / code）推断所属供应商，复用 ProviderIcon 的内置图标表渲染；
 * 推断不出供应商时回退为模型名首字符圆角块。
 *
 * 与 modelVendorLogo.ts（Bot 列表远程 Logo URL 解析）并存：
 *   - 本页用 ModelLogo（本地内置，离线可用）；
 *   - Bot 会话页继续走 resolveModelVendorLogo（远程 URL）。
 */
import React from 'react';
import { PROVIDER_ICONS, resolveProviderIconKey } from '@/renderer/components/common/ProviderIcon';

/* 模型名 / code 前缀 → 供应商图标键 */
const MODEL_VENDOR_PREFIXES: Array<[string, string]> = [
  // OpenAI
  ['gpt-', 'openai'],
  ['o1-', 'openai'],
  ['o3-', 'openai'],
  ['o4-', 'openai'],
  ['chat-completions', 'openai'],
  ['text-embedding', 'openai'],
  ['dall-e', 'openai'],
  // Anthropic
  ['claude-', 'anthropic'],
  // Google
  ['gemini-', 'google'],
  ['palm', 'google'],
  // DeepSeek
  ['deepseek-', 'deepseek'],
  // 通义千问
  ['qwen', 'qwen'],
  ['tongyi', 'qwen'],
  // 智谱
  ['glm-', 'zhipu'],
  ['chatglm', 'zhipu'],
  // 百度
  ['ernie', 'baidu'],
  ['wenxin', 'baidu'],
  // 讯飞星火
  ['spark-', 'xfyun'],
  // 月之暗面
  ['kimi', 'moonshot'],
  ['moonshot', 'moonshot'],
  // MiniMax
  ['minimax', 'minimax'],
  ['abab-', 'minimax'],
  // 快手可灵
  ['kling', 'kling'],
  // Midjourney / Stability
  ['mj-', 'midjourney'],
  ['midjourney', 'midjourney'],
  ['stable-diffusion', 'stability'],
  ['sd-', 'stability'],
  // 本地运行时（模型 code 直接带运行时名）
  ['ollama-', 'ollama'],
  ['onnx-', 'onnx'],
  ['pytorch-', 'pytorch'],
  ['tensorflow-', 'tensorflow'],
];

/**
 * 按模型名 / code 推断供应商图标键。
 * 匹配顺序：① code 精确匹配供应商 code；② 模型名 / code 前缀匹配。
 */
export function resolveModelIconKey(nameOrCode?: string | null, vendorHint?: string | null): string | null {
  const s = (nameOrCode ?? '').toLowerCase();
  if (s) {
    for (const [prefix, key] of MODEL_VENDOR_PREFIXES) {
      if (s.startsWith(prefix) || s.includes(prefix)) return key;
    }
    // 模型 code 本身就是供应商 code（如本地运行时直接叫 "ollama"）
    if (PROVIDER_ICONS[s]) return s;
  }
  // 供应商提示（模型行的 providerName / code）优先
  if (vendorHint) {
    const key = resolveProviderIconKey(vendorHint);
    if (key) return key;
  }
  return null;
}

export interface ModelLogoProps {
  /** 模型名或模型 code（如 "gpt-4o"、"deepseek-chat"） */
  model?: string | null;
  /** 供应商名 / code（可选提示，如 "DeepSeek"） */
  vendor?: string | null;
  /** 图标尺寸，默认 16 */
  size?: number;
  className?: string;
}

/**
 * 模型图标：内置供应商 SVG + 模型首字符回退。
 */
export function ModelLogo({ model, vendor, size = 16, className = '' }: ModelLogoProps) {
  const key = resolveModelIconKey(model, vendor);
  if (key) {
    // 复用 ProviderIcon 的渲染逻辑（svgOnly 阻止首字母回退，避免双图标）
    const svg = (
      <svg
        className={`ai-model-logo shrink-0 ${className}`}
        viewBox='0 0 24 24'
        width={size * 2}
        height={size * 2}
        aria-hidden='true'
        style={{ color: 'var(--color-text-2, #5c5c66)' }}
      >
        {PROVIDER_ICONS[key]}
      </svg>
    );
    return svg;
  }
  // 回退：模型名首字符
  const raw = (model ?? vendor ?? '').trim();
  const ch = raw ? raw[0].toUpperCase() : '?';
  return (
    <span
      className={`ai-model-logo-initial shrink-0 ${className}`}
      style={{ width: size * 2, height: size * 2, fontSize: size * 0.9 }}
      aria-hidden='true'
    >
      {ch}
    </span>
  );
}

/** 模型图标 = 供应商图标体系，统一从 ProviderIcon 导出便于按 key 取图 */
export { ProviderIcon } from '@/renderer/components/common/ProviderIcon';
