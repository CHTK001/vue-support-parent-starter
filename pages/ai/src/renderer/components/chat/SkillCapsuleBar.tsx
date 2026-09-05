/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { Lightning } from '@icon-park/react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';
import { emitter } from '@/renderer/utils/emitter';

/**
 * SkillCapsuleBar — 聊天输入框上方的技能胶囊条。
 *
 * <p>展示当前会话已挂载（loaded）的技能，点击胶囊即在输入框填充 {@code /name }，
 * 与 FileAttachButton / 斜杠命令走同一触发通道（{@code emitter 'sendbox.fill'}）。
 * 默认收起为「技能 · N」入口，hover 展开胶囊列表，避免挤占输入区域。</p>
 */
export interface SkillCapsuleBarProps {
  /** 当前会话已挂载的技能名快照（conversation.extra.skills）。 */
  loadedSkills?: string[];
  /** 点击胶囊触发技能命令。默认填充 /{name} 到输入框。 */
  onSkillClick?: (name: string) => void;
  /** 可选：点击「管理」跳转技能库的处理器（默认打开 /skills）。 */
  onManage?: () => void;
}

const SkillCapsuleBar: React.FC<SkillCapsuleBarProps> = ({
  loadedSkills = [],
  onSkillClick,
  onManage,
}) => {
  const { t } = useTranslation();
  const skills = useMemo(() => loadedSkills.slice(0, 4), [loadedSkills]);
  const overflow = Math.max(0, loadedSkills.length - skills.length);

  // 复用 FileAttachButton 的 'skills-index' SWR key，技能详情只在需要时拉取
  const { data: skillIndex } = useSWR(loadedSkills.length > 0 ? 'skills-index' : null, () =>
    ipcBridge.fs.listAvailableSkills.invoke()
  );
  const descriptionByName = useMemo(
    () => new Map((skillIndex ?? []).map((s) => [s.name, s.description])),
    [skillIndex]
  );

  if (loadedSkills.length === 0) return null;

  const handleClick = (name: string) => {
    if (onSkillClick) {
      onSkillClick(name);
      return;
    }
    // 触发通道与 FileAttachButton 一致：填充 /{name} 交给斜杠命令模板
    emitter.emit('sendbox.fill', `/${name} `);
  };

  return (
    <div
      className='flex flex-wrap items-center gap-6px mb-8px'
      data-testid='sendbox-skill-capsule-bar'
    >
      <span className='inline-flex items-center gap-4px text-12px text-t-tertiary leading-none'>
        <Lightning theme='outline' size={13} strokeWidth={3} />
        {t('conversation.skills.loaded', { defaultValue: 'Skills' })}
      </span>
      {skills.map((name) => (
        <button
          key={name}
          type='button'
          className='inline-flex items-center gap-4px max-w-140px px-8px h-22px rd-full bg-fill-2 hover:bg-fill-3 b-1px b-solid border-arco-2 text-12px text-t-primary cursor-pointer transition-colors'
          onClick={() => handleClick(name)}
          title={descriptionByName.get(name) ?? name}
        >
          <span className='truncate'>{name}</span>
        </button>
      ))}
      {overflow > 0 && (
        <button
          type='button'
          className='inline-flex items-center h-22px px-8px rd-full text-12px text-t-secondary cursor-pointer hover:text-t-primary transition-colors'
          onClick={onManage}
          title={t('conversation.skills.manageHint', { defaultValue: '管理技能' })}
        >
          +{overflow}
        </button>
      )}
    </div>
  );
};

export default SkillCapsuleBar;
