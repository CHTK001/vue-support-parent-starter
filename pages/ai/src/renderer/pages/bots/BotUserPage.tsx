/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 *
 * Bot 用户管理页（管理员视角，独立于 Bot 管理页）
 *
 * 布局：左侧 Bot 列表，点击某个 Bot 后右侧展示其绑定的用户列表。
 * 数据源：/v2/ai/bot-binding/list（含 userId / userName / status / lastActiveTime）。
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Empty, Message, Spin, Tag, Tooltip } from '@arco-design/web-react';
import { Refresh, User } from '@icon-park/react';
import classNames from 'classnames';
import { httpRequest } from '@/common/adapter/httpBridge';
import { HUB_PAGE_TITLE_CLASS } from '@/renderer/components/layout/HubPageShell';

/** 与后端 SysAiBotBinding 对齐的绑定记录 */
interface BotBinding {
  id: number;
  userId?: number | null;
  userName?: string;
  botId?: string;
  platform?: string;
  nickname?: string;
  status?: string;
  model?: string;
  thinking?: boolean;
  lastActiveTime?: string;
  createTime?: string;
}

/** 兼容两种信封：解包一层 data 后可能是数组，也可能还剩一层 */
function extractList(res: unknown): BotBinding[] {
  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object' && Array.isArray((res as { data?: unknown }).data)) {
    return (res as { data: BotBinding[] }).data;
  }
  return [];
}

const PLATFORM_LABEL: Record<string, string> = {
  wechat: '微信',
  wecom: '企业微信',
  feishu: '飞书',
};

const STATUS_META: Record<string, { label: string; dot: string }> = {
  online: { label: '在线', dot: 'bg-success' },
  offline: { label: '离线', dot: 'bg-[var(--color-text-4)]' },
  expired: { label: '已过期', dot: 'bg-warning' },
};

/** LocalDateTime 字符串 → 相对时间 */
function formatRelativeTime(v?: string | null): string {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  return `${Math.floor(diff / 86_400_000)} 天前`;
}

const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  const meta = STATUS_META[status ?? ''] ?? { label: '未知', dot: 'bg-[var(--color-text-4)]' };
  return (
    <span className='inline-flex items-center gap-6px text-12px leading-18px text-t-secondary'>
      <span className={classNames('h-6px w-6px shrink-0 rounded-full', meta.dot)} />
      <span>{meta.label}</span>
    </span>
  );
};

/** 左侧 Bot 列表项 */
const BotItem: React.FC<{ bot: BotBinding; selected: boolean; onClick: () => void }> = ({ bot, selected, onClick }) => (
  <button
    type='button'
    aria-pressed={selected}
    onClick={onClick}
    className={classNames(
      'appearance-none !border-0 !outline-none !shadow-none w-full rounded-12px px-14px py-12px text-left transition-colors',
      selected ? 'bg-fill-2 ring-1 ring-[var(--color-border-2)]' : 'hover:bg-fill-1 active:bg-fill-2'
    )}
  >
    <div className='flex items-center gap-10px'>
      <span className='flex size-34px shrink-0 items-center justify-center rounded-10px bg-fill-2 text-14px font-500 text-t-secondary'>
        {(bot.nickname || bot.botId || '?').slice(0, 1).toUpperCase()}
      </span>
      <div className='min-w-0 flex-1'>
        <div className='mb-2px truncate text-14px font-500 leading-20px text-t-primary' title={bot.nickname}>
          {bot.nickname || '—'}
        </div>
        <div className='flex items-center gap-8px'>
          <span className='truncate text-12px leading-16px text-t-tertiary' title={bot.botId}>
            {bot.botId || '—'}
          </span>
          <StatusBadge status={bot.status} />
        </div>
      </div>
    </div>
  </button>
);

/** 右侧用户列表项 */
const UserCard: React.FC<{ row: BotBinding; onChat?: () => void }> = ({ row, onChat }) => {
  const { t } = useTranslation();
  return (
    <div className='flex items-center gap-12px rounded-12px border border-solid border-[var(--color-border-2)] bg-fill-1 px-16px py-14px'>
      <span className='flex size-40px shrink-0 items-center justify-center rounded-12px bg-fill-2 text-t-secondary'>
        <User theme='outline' size='20' fill='currentColor' />
      </span>
      <div className='min-w-0 flex-1'>
        <div className='text-14px font-500 leading-20px text-t-primary'>
          {row.userName || row.nickname || '未分配用户'}
        </div>
        <div className='mt-2px text-12px leading-16px text-t-tertiary'>
          {row.botId || '—'}
          {row.userId != null ? ` · userId ${row.userId}` : ''}
        </div>
      </div>
      <div className='flex shrink-0 items-center gap-8px'>
        {row.platform ? (
          <Tag size='small' className='!m-0 !rounded-6px !border-0 !bg-fill-2 !text-t-secondary'>
            {PLATFORM_LABEL[row.platform] ?? row.platform}
          </Tag>
        ) : null}
        <StatusBadge status={row.status} />
        {onChat ? (
          <Button size='mini' type='text' onClick={onChat}>
            {t('bots.users.chat', { defaultValue: '聊天' })}
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default function BotUserPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [bindings, setBindings] = useState<BotBinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await httpRequest<unknown>('GET', '/v2/ai/bot-binding/list');
      const list = extractList(res);
      setBindings(list);
      if (list.length > 0 && (selectedId == null || !list.some((b) => b.id === selectedId))) {
        setSelectedId(list[0].id);
      } else if (list.length === 0) {
        setSelectedId(null);
      }
    } catch {
      Message.error(t('bots.loadFailed', { defaultValue: '加载失败' }));
    } finally {
      setLoading(false);
    }
  }, [selectedId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  /* Bot 按 id 去重（一个 Bot 可被多个用户绑定，但展示为主列表去重） */
  const bots = useMemo(() => {
    const unique = new Map<number, BotBinding>();
    for (const b of bindings) unique.set(b.id, b);
    return [...unique.values()];
  }, [bindings]);

  /* 选中 Bot 的绑定用户记录（同一 botId 的所有记录即为其用户列表） */
  const selected = bots.find((b) => b.id === selectedId) ?? null;
  const selectedUsers = useMemo(() => {
    if (!selected?.botId) return [];
    return bindings.filter((b) => b.botId === selected.botId);
  }, [bindings, selected]);

  return (
    <div className='box-border w-full min-h-full overflow-y-auto px-12px py-24px md:px-40px md:py-32px'>
      <div className='mx-auto flex w-full max-w-1080px box-border flex-col gap-16px'>
        {/* 头部 */}
        <div className='flex w-full items-center justify-between gap-12px'>
          <div className='min-w-0 flex-1'>
            <h1 className={HUB_PAGE_TITLE_CLASS}>
              {t('bots.users.pageTitle', { defaultValue: 'Bot 用户' })}
            </h1>
            <p className='m-0 mt-6px text-13px leading-18px text-t-tertiary'>
              {t('bots.users.pageDescription', {
                defaultValue: '按 Bot 查看其绑定的用户列表与可用性（管理员视角）。',
              })}
            </p>
          </div>
          <Tooltip content={t('bots.refresh', { defaultValue: '刷新' })}>
            <Button
              shape='circle'
              icon={<Refresh theme='outline' size='14' fill='currentColor' strokeWidth={4} />}
              onClick={() => void load()}
            />
          </Tooltip>
        </div>

        {loading ? (
          <div className='flex min-h-280px items-center justify-center rounded-16px border border-dashed border-[var(--color-border-2)] bg-fill-1'>
            <Spin />
          </div>
        ) : bindings.length === 0 ? (
          <div className='flex min-h-280px items-center justify-center [&_.arco-empty-image]:!text-64px'>
            <Empty description={t('bots.emptyAll', { defaultValue: '还没有绑定任何 Bot' })} />
          </div>
        ) : (
          <div className='grid w-full grid-cols-[280px_minmax(0,1fr)] gap-16px max-[760px]:grid-cols-1'>
            {/* 左栏：Bot 列表 */}
            <aside className='flex flex-col gap-8px'>
              <div className='mb-2px px-2px text-12px font-medium leading-18px text-t-tertiary'>
                {t('bots.users.botList', { defaultValue: 'Bot 列表' })}
                <span className='ml-6px'>({bots.length})</span>
              </div>
              {bots.map((bot) => (
                <BotItem
                  key={bot.id}
                  bot={bot}
                  selected={bot.id === selectedId}
                  onClick={() => setSelectedId(bot.id)}
                />
              ))}
            </aside>

            {/* 右栏：该 Bot 的用户列表 */}
            <section className='min-w-0'>
              {selected ? (
                <>
                  <div className='mb-8px px-2px'>
                    <div className='truncate text-14px font-500 leading-20px text-t-primary'>
                      {selected.nickname || selected.botId || '—'}
                      {selected.botId ? <span className='ml-8px text-12px text-t-tertiary'>{selected.botId}</span> : null}
                    </div>
                    <div className='mt-2px text-12px leading-18px text-t-tertiary'>
                      {selected.model ? `模型：${selected.model}` : ''}
                      {selected.thinking ? ' · 深度思考开启' : ''}
                    </div>
                  </div>
                  {selectedUsers.length === 0 ? (
                    <div className='flex min-h-220px items-center justify-center rounded-16px border border-dashed border-[var(--color-border-2)] bg-fill-1'>
                      <Empty description={t('bots.users.noUsers', { defaultValue: '该 Bot 暂无绑定用户' })} />
                    </div>
                  ) : (
                    <div className='flex flex-col gap-8px'>
                      {selectedUsers.map((row) => (
                        <UserCard
                          key={row.id}
                          row={row}
                          onChat={() => navigate(
                            `/bots/im?botId=${encodeURIComponent(row.botId ?? '')}&fromUser=${encodeURIComponent(row.userName || row.nickname || row.botId || '')}`
                          )}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : null}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}