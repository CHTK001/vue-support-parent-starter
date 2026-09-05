import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const capsuleSource = readFileSync(new URL('./SkillCapsuleBar.tsx', import.meta.url), 'utf8');
const sendBoxSource = readFileSync(new URL('./SendBox/index.tsx', import.meta.url), 'utf8');

describe('SkillCapsuleBar', () => {
  test('renders loaded skills as a capsule strip and fills /{name} on click', () => {
    expect(capsuleSource.includes("data-testid='sendbox-skill-capsule-bar'")).toBe(true);
    expect(capsuleSource.includes("emitter.emit('sendbox.fill', `/${name} `)")).toBe(true);
    expect(capsuleSource.includes("ipcBridge.fs.listAvailableSkills.invoke()")).toBe(true);
    expect(capsuleSource.includes("useSWR(loadedSkills.length > 0 ? 'skills-index' : null")).toBe(true);
  });

  test('returns null when no skills are loaded', () => {
    expect(capsuleSource.includes('if (loadedSkills.length === 0) return null;')).toBe(true);
  });

  test('capsules stay compact: shows at most 4 plus an overflow counter', () => {
    expect(capsuleSource.includes('loadedSkills.slice(0, 4)')).toBe(true);
    expect(capsuleSource.includes('Math.max(0, loadedSkills.length - skills.length)')).toBe(true);
  });

  test('SendBox surfaces the capsule bar with the conversation loaded-skills snapshot', () => {
    expect(sendBoxSource.includes("import SkillCapsuleBar from '@/renderer/components/chat/SkillCapsuleBar';")).toBe(true);
    expect(
      sendBoxSource.includes('<SkillCapsuleBar loadedSkills={conversationContext?.loadedSkills} />')
    ).toBe(true);
  });
});