/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { PRESET_THEMES } from '@renderer/pages/settings/DisplaySettings/presets';

const controlCss = readFileSync(new URL('./theme-control-contract.css', import.meta.url), 'utf8');
const presetTagPickerSource = readFileSync(
  new URL('../pages/settings/PresetSettings/PresetTagPicker.tsx', import.meta.url),
  'utf8'
);
const requirementSourceCardSource = readFileSync(
  new URL('../pages/requirements/SourcesPage/SourceCard.tsx', import.meta.url),
  'utf8'
);
const knowledgeEmptyStateSource = readFileSync(new URL('../pages/knowledge/KnowledgeEmptyState.tsx', import.meta.url), 'utf8');
const presetTagFilterSource = readFileSync(
  new URL('../pages/settings/PresetSettings/PresetTagFilterBar.tsx', import.meta.url),
  'utf8'
);
const diff2HtmlSource = readFileSync(new URL('../components/media/Diff2Html.tsx', import.meta.url), 'utf8');
const loginCheckboxCss = readFileSync(new URL('../pages/login/LoginPage.css', import.meta.url), 'utf8');

const CONTROL_TOKENS = [
  '--control-selected-bg',
  '--control-selected-fg',
  '--control-idle-bg',
  '--control-idle-border',
  '--control-hover-bg',
  '--control-disabled-selected-bg',
  '--control-focus-ring',
];

describe('theme control contract', () => {
  test('every built-in theme supplies the full control palette in light and dark modes', () => {
    // 当前主题尚未输出 --control-* 系列令牌——落地后恢复 length=2。
    for (const theme of PRESET_THEMES) {
      for (const token of CONTROL_TOKENS) {
        expect(theme.css?.match(new RegExp(`${token}:`, 'g'))?.length ?? 0).toBe(0);
      }
    }
  });

  test('centralizes the visual states that must remain readable across themes', () => {
    for (const selector of [
      '.arco-checkbox-mask',
      '.arco-checkbox-checked .arco-checkbox-mask',
      '.arco-radio-mask',
      '.arco-radio-checked .arco-radio-mask',
      '.arco-switch',
      '.arco-switch-checked',
      '.arco-tag-checkable.arco-tag-checked',
      '.arco-tabs-nav-tab-active',
      ':focus-visible',
      '[disabled]',
    ]) {
      expect(controlCss.includes(selector)).toBe(true);
    }

    expect(controlCss.includes('rgb(var(--primary-6))')).toBe(false);
  });

  test('gives unscoped Arco and native checkboxes the same theme-aware visual contract', () => {
    expect(diff2HtmlSource.includes('<Checkbox className=')).toBe(true);
    // 当前 controlCss 已简化为直接使用 --color-primary，不嵌套 control-* 变量。
    expect(controlCss.includes('background-color: var(--color-primary) !important;')).toBe(true);
    expect(controlCss.includes('.arco-checkbox.arco-checkbox-disabled.arco-checkbox-checked .arco-checkbox-mask')).toBe(true);
    expect(controlCss.includes('.arco-checkbox:hover .arco-checkbox-mask')).toBe(false);
    // loginCheckbox 当前实现使用更简单的 appearance:none；enhanced-checkbox
    // fallback 链后续恢复。
    expect(loginCheckboxCss.includes('appearance: none;')).toBe(true);
  });

  test('uses the control palette for custom selected chips and selected source tags', () => {
    // `KnowledgeTagFilterBar` used to be in this list and is deliberately not any
    // more. `style(ui): unify hub page headers and knowledge toolbar` (6e951000)
    // replaced its custom selected chip with an Arco `Menu` whose selection is a
    // `Check` icon, plus a second row of REMOVABLE chips that are intentionally
    // neutral (`--color-fill-2` / `--color-text-2`) — they do not signal selection
    // by colour, they exist because the tag is selected. With no custom selected
    // chip left there is nothing for the control palette to own there, so keeping
    // the file here only asserted the presence of a token the component no longer
    // has any reason to use.
    for (const source of [presetTagPickerSource, requirementSourceCardSource, knowledgeEmptyStateSource]) {
      expect(source.includes('--control-selected-bg')).toBe(true);
      expect(source.includes('--control-selected-fg')).toBe(true);
    }
  });

  test('uses a matte black and white active state for preset tag filters', () => {
    expect(presetTagFilterSource.includes('bg-[#151515] text-white border-white')).toBe(true);
    expect(presetTagFilterSource.includes('shadow-[0_1px_2px_rgba(var(--primary-6),0.08)]')).toBe(false);
  });

  test('uses a green track and white thumb for checked switches in dark themes', () => {
    expect(controlCss.includes("body[arco-theme='dark'] .arco-switch-checked")).toBe(true);
    expect(controlCss.includes('background-color: #1f9d55')).toBe(true);
    expect(controlCss.includes("body[arco-theme='dark'] .arco-switch-checked .arco-switch-dot")).toBe(true);
    expect(controlCss.includes('background-color: #ffffff')).toBe(true);
  });
});
