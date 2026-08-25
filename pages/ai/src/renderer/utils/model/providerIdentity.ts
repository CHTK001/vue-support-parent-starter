/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CSSProperties } from 'react';

/**
 * 供应商身份色：按名称稳定散列到 8 组渐变，让每家供应商拥有可记忆的专属色。
 * 同名永远同色（跨页面/跨会话一致），无需存储。
 * 以内联样式输出，避免依赖原子类扫描（动态拼接的类名不可靠）。
 */
const PROVIDER_GRADIENTS: readonly [string, string][] = [
  ['#8b5cf6', '#7c3aed'], // violet
  ['#0ea5e9', '#2563eb'], // sky→blue
  ['#10b981', '#0d9488'], // emerald→teal
  ['#f59e0b', '#f97316'], // amber→orange
  ['#f43f5e', '#db2777'], // rose→pink
  ['#06b6d4', '#0284c7'], // cyan
  ['#6366f1', '#8b5cf6'], // indigo→violet
  ['#d946ef', '#ec4899'], // fuchsia→pink
];

const hashName = (name: string): number => {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
};

const pick = (name: string): [string, string] =>
  PROVIDER_GRADIENTS[hashName(name ?? '') % PROVIDER_GRADIENTS.length];

/** 供应商渐变头像内联样式（135° 对角渐变）。 */
export const providerGradientStyle = (name: string): CSSProperties => {
  const [from, to] = pick(name);
  return { backgroundImage: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` };
};

/** 统计卡等固定语义色的渐变内联样式。 */
export const toneGradientStyle = (tone: 'violet' | 'sky' | 'amber' | 'emerald'): CSSProperties => {
  const map: Record<string, [string, string]> = {
    violet: ['#8b5cf6', '#7c3aed'],
    sky: ['#0ea5e9', '#2563eb'],
    amber: ['#f59e0b', '#f97316'],
    emerald: ['#10b981', '#0d9488'],
  };
  const [from, to] = map[tone];
  return { backgroundImage: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` };
};
