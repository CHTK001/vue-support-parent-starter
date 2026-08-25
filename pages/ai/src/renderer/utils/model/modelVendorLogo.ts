/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { getProviderLogo } from '@/renderer/utils/model/modelPlatforms';

/**
 * 按模型 ID 前缀推断上游厂商并解析其 logo。
 *
 * 聚合平台（OpenRouter / SiliconFlow / ModelScope 等）目录里的模型 ID 带
 * 厂商前缀（如 `deepseek-ai/…`、`Qwen/...`、`google/gemma`），据此映射到
 * 对应厂商 logo；无前缀或未命中时回退到 `getProviderLogo`（供应商自身平台）。
 */
const VENDOR_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/^deepseek/i, 'deepseek'],
  [/^(qwen|qwq)/i, 'dashscope'],
  [/^glm/i, 'zhipu'],
  [/^(claude|anthropic)/i, 'anthropic'],
  [/^(gpt|o[1345](-|$)|chatgpt|davinci|text-embedding-3)/i, 'openai'],
  [/^(gemini|gemma|palm)/i, 'gemini'],
  [/^(kimi|moonshot)/i, 'moonshot-cn'],
  [/^(ernie|baidu)/i, 'qianfan'],
  [/^(hunyuan|tencent)/i, 'hunyuan'],
  [/^(doubao|skylark)/i, 'ark'],
  [/^(minimax|abab)/i, 'minimax'],
  [/^(grok)/i, 'xai'],
  [/^(yi-|01-ai|lingyi)/i, 'lingyi'],
  [/^step/i, 'stepfun'],
  [/^siliconflow/i, 'siliconflow'],
  [/^(mimo)/i, 'mimo'],
];

/**
 * 解析模型条目应展示的厂商图标 URL；`fallbackPlatform` 为当前供应商平台，
 * 作为无前缀模型（如 `gpt-4o` 直连 OpenAI）的兜底。
 */
export const resolveModelVendorLogo = (
  modelId: string,
  fallbackPlatform?: string
): string | null => {
  const id = (modelId ?? '').trim();
  for (const [pattern, platform] of VENDOR_PATTERNS) {
    if (pattern.test(id)) {
      const logo = getProviderLogo({ platform });
      if (logo) return logo;
    }
  }
  return getProviderLogo({ platform: fallbackPlatform });
};
