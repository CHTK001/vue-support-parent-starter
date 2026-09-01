/**
 * SkillMarketDetailDrawer — read-only detail view for a market listing.
 *
 * Market items are remote listings without a local SKILL.md, so this drawer
 * shows the full description, tags, install command and source page instead of
 * rendering document content.
 */
import { resolveLocaleKey } from '@/common/utils';
import type { ISkillMarketItem } from '@/common/adapter/ipcBridge';
import type { PresetTag } from '@/common/types/agent/presetTypes';
import CopyIconButton from '@/renderer/components/base/CopyIconButton';
import { openExternalUrl } from '@/renderer/utils/platform';
import { Button, Drawer, Tag } from '@arco-design/web-react';
import { LinkOut, Plus } from '@icon-park/react';
import { normalizeTestId } from './skillPresentation';
import { marketSourceLabel, translateMarketDescription } from './skillMarket';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

type SkillMarketDetailDrawerProps = {
  visible: boolean;
  item: ISkillMarketItem | null;
  tagByKey: Map<string, PresetTag>;
  localeKey: string;
  adding: boolean;
  added: boolean;
  addedStateLoading: boolean;
  onAdd: (item: ISkillMarketItem) => void;
  onClose: () => void;
};

const resolveTagLabel = (tag: PresetTag, localeKey: string): string =>
  tag.label_i18n?.[localeKey] || tag.label;

const MarketDetailSourceBadge: React.FC<{ source: ISkillMarketItem['source'] }> = ({ source }) => {
  const label = marketSourceLabel(source);
  const className = {
    clawhub: '!bg-primary-1 !text-primary-6',
    loophub: '!bg-[rgba(var(--warning-6),0.12)] !text-warning-7',
    skillhub: '!bg-[rgba(var(--success-6),0.1)] !text-success-6',
    skillhub_mcp: '!bg-[rgba(var(--arcoblue-6),0.1)] !text-[rgba(var(--arcoblue-6),1)]',
    mcpworld: '!bg-[rgba(var(--purple-6),0.1)] !text-[rgba(var(--purple-6),1)]',
    clawhub_plugins: '!bg-[rgba(var(--orange-6),0.12)] !text-[rgba(var(--orange-7),1)]',
    skillhub_packages: '!bg-[rgba(var(--cyan-6),0.1)] !text-[rgba(var(--cyan-7),1)]',
  }[source];

  return (
    <Tag
      size='small'
      bordered={false}
      className={`!flex-shrink-0 !text-11px !leading-16px !px-8px !py-0 !rounded-8px ${className}`}
    >
      {label}
    </Tag>
  );
};

const SkillMarketDetailDrawer: React.FC<SkillMarketDetailDrawerProps> = ({
  visible,
  item,
  tagByKey,
  localeKey,
  adding,
  added,
  addedStateLoading,
  onAdd,
  onClose,
}) => {
  const { t } = useTranslation();
  const resolvedLocaleKey = resolveLocaleKey(localeKey);
  const [opening, setOpening] = useState(false);
  const testId = item ? normalizeTestId(item.id) : '';

  const handleOpenSource = useCallback(async () => {
    if (!item?.url) return;
    setOpening(true);
    try {
      await openExternalUrl(item.url);
    } catch (error) {
      console.error('Failed to open market source page:', error);
    } finally {
      setOpening(false);
    }
  }, [item?.url]);

  const resolvedTags = [...(item?.audience_tags ?? []), ...(item?.scenario_tags ?? [])]
    .map((key) => tagByKey.get(key))
    .filter((tag): tag is PresetTag => Boolean(tag));
  const rawTags = (item?.tags ?? []).filter(
    (tag) => !tagByKey.has(tag) && tag !== 'requires_api_key' && tag !== 'no_api_key'
  );

  return (
    <Drawer
      visible={visible}
      onCancel={onClose}
      placement='right'
      width={560}
      zIndex={1250}
      autoFocus={false}
      getPopupContainer={() => document.body}
      title={t('settings.skillsMarket.detailTitle', { defaultValue: '技能详情' })}
      data-testid='skill-market-detail-drawer'
      headerStyle={{ background: 'var(--color-bg-1)' }}
      bodyStyle={{ background: 'var(--color-bg-1)', padding: 0 }}
      footer={
        <div className='flex w-full items-center justify-between gap-12px'>
          <Button onClick={onClose} className='min-w-100px rounded-[100px] bg-fill-2'>
            {t('common.close', { defaultValue: '关闭' })}
          </Button>
          {item && (
            <Button
              type='primary'
              icon={added ? undefined : <Plus theme='outline' size={14} strokeWidth={3} />}
              loading={adding}
              disabled={adding || added || addedStateLoading}
              onClick={() => onAdd(item)}
              className='min-w-100px rounded-[100px]'
              data-testid={`btn-detail-add-market-skill-${testId}`}
            >
              {added
                ? t('common.added', { defaultValue: '已添加' })
                : t('settings.skillsMarket.addFromDetail', { defaultValue: '添加技能' })}
            </Button>
          )}
        </div>
      }
    >
      {item && (
        <div className='flex h-full min-h-0 flex-col' data-testid='skill-market-detail-content'>
          <div className='flex-shrink-0 border-b border-b-solid border-[var(--color-border-1)] px-20px py-16px'>
            <div className='flex items-start gap-12px'>
              <div className='flex h-44px w-44px flex-shrink-0 items-center justify-center rounded-12px bg-primary-1 text-17px font-700 uppercase text-primary-6 shadow-sm'>
                {item.name.charAt(0)}
              </div>
              <div className='min-w-0 flex-1'>
                <h2 className='m-0 break-words text-20px font-700 leading-28px text-t-primary'>{item.name}</h2>
                <div className='mt-6px flex flex-wrap items-center gap-8px'>
                  <MarketDetailSourceBadge source={item.source} />
                  {item.stats && <span className='text-12px text-t-tertiary'>{item.stats}</span>}
                </div>
              </div>
            </div>
          </div>

          <div className='flex-1 overflow-y-auto px-20px py-16px'>
            <div className='space-y-16px'>
              <section>
                <h3 className='m-0 mb-8px text-12px font-600 uppercase tracking-[0.08em] text-t-tertiary'>
                  {t('settings.skillsMarket.detailDescription', { defaultValue: '说明' })}
                </h3>
                <p className='m-0 break-words text-14px leading-22px text-t-secondary'>
                  {translateMarketDescription(item.description, item, resolvedLocaleKey) ||
                    t('settings.skillsMarket.noDescription', { defaultValue: '暂无描述。' })}
                </p>
              </section>

              {(resolvedTags.length > 0 || rawTags.length > 0) && (
                <section>
                  <h3 className='m-0 mb-8px text-12px font-600 uppercase tracking-[0.08em] text-t-tertiary'>
                    {t('settings.skillsMarket.detailTags', { defaultValue: '标签' })}
                  </h3>
                  <div className='flex flex-wrap items-center gap-6px'>
                    {resolvedTags.map((tag) => (
                      <span
                        key={tag.key}
                        className='inline-flex items-center rounded-[12px] border border-solid border-[var(--color-border-2)] bg-[var(--color-fill-2)] px-8px py-2px text-12px leading-18px text-[var(--color-text-2)]'
                      >
                        {resolveTagLabel(tag, resolvedLocaleKey)}
                      </span>
                    ))}
                    {rawTags.map((tag) => (
                      <span
                        key={tag}
                        className='inline-flex items-center rounded-[12px] border border-solid border-[var(--color-border-2)] bg-[var(--color-fill-2)] px-8px py-2px text-12px leading-18px text-[var(--color-text-2)]'
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {item.install_command && (
                <section>
                  <h3 className='m-0 mb-8px text-12px font-600 uppercase tracking-[0.08em] text-t-tertiary'>
                    {t('settings.skillsMarket.detailCommand', { defaultValue: '安装命令' })}
                  </h3>
                  <div className='flex items-center gap-8px rounded-12px border border-solid border-[var(--color-border-1)] bg-[var(--color-bg-2)] px-12px py-10px'>
                    <code className='min-w-0 flex-1 break-all text-12px leading-18px text-[var(--color-text-1)]'>
                      {item.install_command}
                    </code>
                    <CopyIconButton
                      text={item.install_command}
                      tooltip={t('settings.skillsMarket.copyCommand', { defaultValue: '复制完整命令' })}
                      size={14}
                      className='size-24px shrink-0'
                    />
                  </div>
                </section>
              )}

              {item.url && (
                <section>
                  <h3 className='m-0 mb-8px text-12px font-600 uppercase tracking-[0.08em] text-t-tertiary'>
                    {t('settings.skillsMarket.detailSource', { defaultValue: '来源页面' })}
                  </h3>
                  <Button
                    type='text'
                    size='small'
                    loading={opening}
                    icon={<LinkOut size={14} fill='currentColor' />}
                    onClick={() => void handleOpenSource()}
                    className='!p-0 !text-13px !text-primary-6 hover:!text-primary-5'
                    data-testid={`btn-open-market-source-${testId}`}
                  >
                    <span className='break-all'>{item.url}</span>
                  </Button>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default SkillMarketDetailDrawer;
