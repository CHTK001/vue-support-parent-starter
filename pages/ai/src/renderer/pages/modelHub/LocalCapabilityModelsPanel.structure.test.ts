import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import zhSettings from '@/renderer/services/i18n/locales/zh-CN/settings.json';
import enSettings from '@/renderer/services/i18n/locales/en-US/settings.json';

const panel = readFileSync(
  new URL('./LocalCapabilityModelsPanel.tsx', import.meta.url),
  'utf8'
);

const CAPABILITY_LABELS = [
  'detect', 'face-recognize', 'feature', 'eye-detect', 'smile-detect',
  'face-quality', 'liveness', 'ocr', 'classify', 'image-detect',
  'segment', 'captioning', 'depth', 'pedestrian', 'image-quality',
  'layout', 'pose',
] as const;

describe('LocalCapabilityModelsPanel', () => {
  test('consumes /v2/ai/models/capabilities via httpRequest', () => {
    expect(panel.includes('/v2/ai/models/capabilities')).toBe(true);
    expect(panel.includes("httpRequest<Record<string, string[]>>")).toBe(true);
    expect(panel.includes("'GET'")).toBe(true);
  });

  test('capability keys are resolved via dynamic i18n key', () => {
    expect(panel.includes('settings.modelHub.capability.${group.capability}')).toBe(true);
  });

  test('every capability label has i18n entries in both locales', () => {
    for (const locale of [zhSettings, enSettings]) {
      const cap = (locale as unknown as { modelHub: { capability: Record<string, string> } })
        .modelHub.capability;
      for (const label of CAPABILITY_LABELS) {
        expect(typeof cap[label]).toBe('string');
        expect(cap[label].trim().length > 0).toBe(true);
      }
    }
  });

  test('panel status strings (loading/error/empty) exist in both locales', () => {
    const keys = ['loading', 'loadFailed', 'loadFailedHint', 'empty', 'emptyHint'] as const;
    for (const locale of [zhSettings, enSettings]) {
      const cap = (locale as unknown as { modelHub: { capability: Record<string, string> } })
        .modelHub.capability;
      for (const key of keys) {
        expect(typeof cap[key]).toBe('string');
        expect(cap[key].trim().length > 0).toBe(true);
      }
    }
  });
});