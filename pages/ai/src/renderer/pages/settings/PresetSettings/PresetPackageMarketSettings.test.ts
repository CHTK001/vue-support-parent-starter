import { describe, expect, test } from 'vitest';
import { BackendHttpError } from '@/common/adapter/httpBridge';
import { parsePresetId } from '@/common/types/ids';
import type { Preset } from '@/common/types/agent/presetTypes';
import {
  buildPresetFromMarketPackage,
  classifyPresetPackageAddError,
  getOrCreatePresetMarketId,
  invokePresetPackageInstallWithRetry,
  isPresetMarketItemInstalled,
} from './PresetPackageMarketSettings';

const memoryStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
};

describe('preset package market import payload', () => {
  test('keeps real package skills and applies expert package defaults', () => {
    const presetId = parsePresetId('0190f5fe-7c00-7a00-8000-000000000231');
    const preset = buildPresetFromMarketPackage(
      {
        name: 'Test Automation',
        description: 'Testing workflow package',
        instructions: '---\nname: tech-test-automation\nmetadata:\n  author: SkillHub\n---\n# Test Automation',
        skill_slugs: ['name', 'superpowers-tdd', 'description', 'superpowers-tdd', 'test-case-generator'],
      },
      'zh-CN',
      presetId
    );

    expect(preset.preset_id).toBe('0190f5fe-7c00-7a00-8000-000000000231');
    expect(preset.targets).toEqual(['conversation', 'execution_step']);
    expect(preset.included_skills).toEqual([
      { skill_name: 'superpowers-tdd', required: false },
      { skill_name: 'test-case-generator', required: false },
    ]);
    expect((preset.instructions || '').includes('metadata:')).toBe(true);
    expect(preset.instructions_i18n?.['zh-CN']).toBe(preset.instructions);
  });

  test('keeps installed skill names that are not market slugs', () => {
    const preset = buildPresetFromMarketPackage(
      {
        name: 'Localized Skills',
        description: 'Package with installed skill names',
        instructions: '# Localized Skills',
        skill_slugs: [
          '中文技能',
          'skill with space',
          '',
          '   ',
          '中文技能',
          '../escape',
          'folder\\escape',
          'bad\u0000name',
          'name',
        ],
      },
      'zh-CN',
      undefined,
      'installed'
    );

    expect(preset.included_skills).toEqual([
      { skill_name: '中文技能', required: false },
      { skill_name: 'skill with space', required: false },
    ]);
  });
});

describe('preset package installed state', () => {
  const marketItem = {
    id: 'skillhub_packages:tech-test-automation',
    name: 'Test Automation',
    description: 'Testing workflow package',
  };

  test('reuses a stable preset id and only reports added while that preset exists', () => {
    const storage = memoryStorage();
    const presetId = getOrCreatePresetMarketId(marketItem.id, storage);
    expect(getOrCreatePresetMarketId(marketItem.id, storage)).toBe(presetId);

    const installed = {
      preset_id: presetId,
      source: 'user',
      name: 'Renamed after install',
      description: 'Changed by the user',
    } as Preset;
    expect(isPresetMarketItemInstalled(marketItem, [installed], storage)).toBe(true);
    expect(isPresetMarketItemInstalled(marketItem, [], storage)).toBe(false);
  });

  test('recognizes packages installed before stable ids were recorded', () => {
    const legacy = {
      preset_id: parsePresetId('0190f5fe-7c00-7a00-8000-000000000232'),
      source: 'user',
      name: marketItem.name,
      description: marketItem.description,
    } as Preset;
    expect(isPresetMarketItemInstalled(marketItem, [legacy], memoryStorage())).toBe(true);
  });
});

describe('preset package market errors', () => {
  const backendError = (code: string, status?: number) =>
    new BackendHttpError({
      method: 'POST',
      path: '/api/skills/market/package/install',
      status: status ?? (code === 'NOT_FOUND' ? 404 : 502),
      body: { success: false, code, error: 'redacted backend error' },
    });

  test('maps structured upstream failures to actionable messages', () => {
    expect(classifyPresetPackageAddError(backendError('TIMEOUT'))).toBe('timeout');
    expect(classifyPresetPackageAddError(backendError('BAD_GATEWAY'))).toBe('upstream');
    expect(classifyPresetPackageAddError(backendError('NOT_FOUND'))).toBe('not_found');
  });

  test('maps raw 5xx (incl. empty-body proxy 502) to upstream, 404 to not_found', () => {
    expect(classifyPresetPackageAddError(backendError('INTERNAL_ERROR', 500))).toBe('upstream');
    expect(
      classifyPresetPackageAddError(new BackendHttpError({ method: 'POST', path: '/x', status: 502, body: '' }))
    ).toBe('upstream');
    expect(
      classifyPresetPackageAddError(new BackendHttpError({ method: 'GET', path: '/x', status: 404, body: '' }))
    ).toBe('not_found');
  });

  test('keeps unknown failures on the generic safe fallback', () => {
    expect(classifyPresetPackageAddError(backendError('UNHANDLED', 400))).toBe('generic');
    expect(classifyPresetPackageAddError(new TypeError('malformed response'))).toBe('generic');
  });

  test('retries transient install failures once', async () => {
    const flaky = new BackendHttpError({ method: 'POST', path: '/x', status: 502, body: '' });
    let calls = 0;
    const ok = {
      package: { name: 'p', description: '', instructions: '', skill_slugs: ['a'] },
      installed_skill_names: ['a'],
      errors: [],
    };
    const result = await invokePresetPackageInstallWithRetry(
      async () => {
        calls += 1;
        if (calls === 1) throw flaky;
        return ok;
      },
      1
    );
    expect(calls).toBe(2);
    expect(result.installed_skill_names).toEqual(['a']);

    let thrown = false;
    try {
      await invokePresetPackageInstallWithRetry(async () => {
        throw new BackendHttpError({ method: 'POST', path: '/x', status: 400, body: { code: 'BAD_REQUEST' } });
      }, 1);
    } catch {
      thrown = true;
    }
    expect(thrown).toBe(true);
  });
});
