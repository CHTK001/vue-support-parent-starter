/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ProviderModelMetrics } from '@/common/protocolBindings/ProviderModelResponse';

/**
 * 按模型 ID 关键字启发式推断指标默认值（延迟/智能/输出速度）。
 *
 * - 延迟 `latency_ms`：首字延迟，越小越快
 * - 智能 `intelligence`：1..10 能力分
 * - 输出速度 `output_speed`：每秒输出 token 数
 *
 * 仅是新增模型时的合理初值，用户可手动覆盖。
 */
export const guessModelMetrics = (modelId: string): ProviderModelMetrics => {
  const id = (modelId ?? '').toLowerCase();

  // 轻量快速系：flash / mini / turbo / lite / nano / instant / haiku
  if (/(flash|mini|turbo|lite|nano|instant|haiku|small|8b|7b)/.test(id)) {
    return { latency_ms: 600, intelligence: 6, output_speed: 90 };
  }
  // 旗舰重量系：opus / pro / max / ultra / large / reasoning / thinking / r 系
  if (/(opus|ultra|large|reasoning|thinking|r1|70b|405b|pro)/.test(id)) {
    return { latency_ms: 1800, intelligence: 9, output_speed: 35 };
  }
  // 推理/深度思考系
  if (/(deepseek-r|o1|o3|qwq|think)/.test(id)) {
    return { latency_ms: 2400, intelligence: 9, output_speed: 28 };
  }
  // 嵌入/向量系：无输出速度概念
  if (/(embed|embedding|rerank|bge|m3e)/.test(id)) {
    return { latency_ms: 300, intelligence: 4 };
  }
  // 常规默认
  return { latency_ms: 1000, intelligence: 7, output_speed: 60 };
};

/** 智能等级文案（1..10 → 三档展示） */
export const intelligenceTier = (score?: number): 'high' | 'mid' | 'low' | null => {
  if (score == null) return null;
  if (score >= 8) return 'high';
  if (score >= 5) return 'mid';
  return 'low';
};
