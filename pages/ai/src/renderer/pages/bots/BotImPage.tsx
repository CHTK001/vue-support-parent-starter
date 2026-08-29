/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 *
 * Bot 微信 IM（独立聊天页）
 *
 * 左侧会话列表（按 Bot + 微信用户聚合，显示最后一条消息），
 * 右侧聊天窗（chatscope UI），支持主动发送与实时接收（WebSocket 广播）。
 *
 * 数据源：
 *  - GET  /v2/ai/bot-binding/conversations  会话列表
 *  - GET  /v2/ai/bot-binding/messages       单会话历史
 *  - POST /v2/ai/bot-binding/send           主动发送
 *  - WS   bot.message                       新消息实时推送
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Button, Empty, Message, Spin, Tag, Tooltip } from '@arco-design/web-react';
import { Refresh } from '@icon-park/react';
import classNames from 'classnames';
import {
  Conversation,
  ConversationList,
  Message as ChatMsg,
  MessageList,
  MessageSeparator,
} from '@chatscope/chat-ui-kit-react';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { httpRequest, wsEmitter } from '@/common/adapter/httpBridge';
import { useConfig } from '@renderer/hooks/config/useConfig';
import { isSubmitGesture, type SendKeyMode } from '@renderer/hooks/chat/useCompositionInput';
import { HUB_PAGE_TITLE_CLASS } from '@/renderer/components/layout/HubPageShell';
import '@/renderer/styles/chatscope-override.css';

/** 会话列表项 */
interface ConversationItem {
  botId?: string;
  fromUser?: string;
  nickname?: string;
  platform?: string;
  lastContent?: string;
  lastTime?: string;
  unread?: number;
  status?: string;
}

/** 聊天记录消息 */
interface ChatMessage {
  id?: number;
  botId?: string;
  direction?: string;
  fromUser?: string;
  content?: string;
  createTime?: string;
}

/** 兼容两种信封 */
function extractList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === 'object' && Array.isArray((res as { data?: unknown }).data)) {
    return (res as { data: T[] }).data;
  }
  return [];
}

const STATUS_META: Record<string, { label: string; dot: string }> = {
  online: { label: '在线', dot: 'bg-success' },
  offline: { label: '离线', dot: 'bg-[var(--color-text-4)]' },
  expired: { label: '已过期', dot: 'bg-warning' },
};

const PLATFORM_LABEL: Record<string, string> = {
  wechat: '微信',
  wecom: '企业微信',
  feishu: '飞书',
};

function formatTime(v?: string | null): string {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
    : `${d.getMonth() + 1}/${d.getDate()} ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

function formatGroupTime(v?: string | null): string {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return '今天';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return '昨天';
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  const meta = STATUS_META[status ?? ''] ?? { label: '未知', dot: 'bg-[var(--color-text-4)]' };
  return (
    <span className='inline-flex shrink-0 items-center gap-6px text-12px leading-18px text-t-secondary'>
      <span className={classNames('h-6px w-6px shrink-0 rounded-full', meta.dot)} />
      <span>{meta.label}</span>
    </span>
  );
};

/** 输入框（chatscope 不内置受控输入，自绘一个简洁输入条，发送键适配全局配置） */
const ChatInput: React.FC<{
  disabled?: boolean;
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
}> = ({ disabled, value, onChange, onSend }) => {
  const { t } = useTranslation();
  const [sendKeyPref] = useConfig('chat.sendKey');
  const sendKey: SendKeyMode = sendKeyPref ?? 'enter';
  const placeholder = sendKey === 'enter'
    ? t('bots.im.inputPlaceholder', { defaultValue: '输入消息，回车发送，Shift+Enter 换行……' })
    : t('bots.im.inputPlaceholderMod', { defaultValue: '输入消息，Ctrl+Enter 发送，Enter 换行……' });
  return (
    <div className='flex shrink-0 items-end gap-8px border-t border-solid border-[var(--color-border-2)] bg-fill-1 p-10px'>
      <textarea
        rows={2}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (isSubmitGesture(e, sendKey)) {
            e.preventDefault();
            if (!disabled && value.trim()) onSend();
          }
        }}
        className='min-h-40px flex-1 resize-none rounded-10px border border-solid border-[var(--color-border-2)] bg-[var(--color-bg-2)] px-12px py-8px text-13px leading-20px text-t-primary outline-none placeholder:text-t-tertiary focus:border-[var(--color-primary-6)]'
      />
      <Button type='primary' shape='round' disabled={disabled || !value.trim()} onClick={onSend}>
        {t('bots.im.send', { defaultValue: '发送' })}
      </Button>
    </div>
  );
};

export default function BotImPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeKey, setActiveKey] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  /* 会话列表 */
  const loadConversations = useCallback(async () => {
    try {
      const res = await httpRequest<unknown>('GET', '/v2/ai/bot-binding/conversations');
      const list = extractList<ConversationItem>(res);
      setConversations(list);
      // 优先按 URL 参数（来自 Bot 用户页「聊天」）选中会话
      const targetBotId = searchParams.get('botId');
      const targetUser = searchParams.get('fromUser');
      const targetKey =
        targetBotId && targetUser ? `${targetBotId}|${targetUser}` : '';
      const resolvedKey =
        (targetKey && list.some((c) => `${c.botId}|${c.fromUser ?? ''}` === targetKey))
          ? targetKey
          : (list.length > 0 ? `${list[0].botId}|${list[0].fromUser ?? ''}` : '');
      setActiveKey((prev) => {
        if (resolvedKey) return resolvedKey;
        if (prev && list.some((c) => `${c.botId}|${c.fromUser ?? ''}` === prev)) return prev;
        return '';
      });
    } catch {
      Message.error(t('bots.im.loadFailed', { defaultValue: '会话加载失败' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const active = useMemo(
    () => conversations.find((c) => `${c.botId}|${c.fromUser ?? ''}` === activeKey) ?? null,
    [conversations, activeKey]
  );

  /* 加载当前会话历史 */
  const loadMessages = useCallback(async () => {
    if (!active?.botId) return;
    setLoading(true);
    try {
      const res = await httpRequest<unknown>('GET',
        `/v2/ai/bot-binding/messages?botId=${encodeURIComponent(active.botId)}&fromUser=${encodeURIComponent(active.fromUser ?? '')}`);
      setMessages(extractList<ChatMessage>(res));
    } catch {
      Message.error(t('bots.im.loadChatFailed', { defaultValue: '聊天记录加载失败' }));
    } finally {
      setLoading(false);
    }
  }, [active, t]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  /* 新消息滚动到底 */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeKey]);

  /* WebSocket 实时接收：bot.message 广播 */
  useEffect(() => {
    const emitter = wsEmitter<{
      type?: string;
      botId?: string;
      direction?: string;
      fromUser?: string;
      content?: string;
      createTime?: string;
    }>('bot.message');
    const off = emitter.on((payload) => {
      const botId = payload?.botId;
      const fromUser = payload?.fromUser ?? '';
      const key = `${botId}|${fromUser}`;
      // 更新当前会话消息
      if (botId && key === activeKey) {
        setMessages((prev) => [...prev, {
          id: Date.now(),
          botId,
          direction: payload?.direction,
          fromUser,
          content: payload?.content,
          createTime: payload?.createTime ?? new Date().toISOString(),
        }]);
      }
      // 更新会话列表的最后一条 + 置顶
      setConversations((prev: ConversationItem[]) => {
        const idx = prev.findIndex((c) => `${c.botId}|${c.fromUser ?? ''}` === key);
        const content = payload?.content ?? '';
        const time = payload?.createTime ?? new Date().toISOString();
        let next: ConversationItem[];
        if (idx >= 0) {
          const updated = { ...prev[idx], lastContent: content, lastTime: time };
          next = [...prev.slice(0, idx), ...prev.slice(idx + 1), updated];
        } else {
          next = [{ botId, fromUser, nickname: fromUser, lastContent: content, lastTime: time }, ...prev];
        }
        return next.sort((a, b) => (b.lastTime ?? '').localeCompare(a.lastTime ?? ''));
      });
    });
    return off;
  }, [activeKey]);

  /* 主动发送 */
  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!active?.botId || !active.fromUser || !content) return;
    setSending(true);
    try {
      await httpRequest('POST', '/v2/ai/bot-binding/send', {
        botId: active.botId,
        fromUser: active.fromUser,
        content,
      });
      setInput('');
      setMessages((prev) => [...prev, {
        id: Date.now(),
        botId: active.botId,
        direction: 'OUT',
        fromUser: active.fromUser,
        content,
        createTime: new Date().toISOString(),
      }]);
    } catch {
      Message.error(t('bots.im.sendFailed', { defaultValue: '发送失败' }));
    } finally {
      setSending(false);
    }
  }, [active, input, t]);

  const handleSelect = useCallback((key: string) => {
    setActiveKey(key);
  }, []);

  return (
    <div className='box-border flex h-full w-full flex-col overflow-hidden'>
      {/* 头部 */}
      <div className='flex shrink-0 items-center justify-between gap-12px border-b border-solid border-[var(--color-border-2)] px-16px py-14px md:px-24px'>
        <div className='min-w-0'>
          <h1 className={HUB_PAGE_TITLE_CLASS}>
            {t('bots.im.title', { defaultValue: 'Bot IM' })}
          </h1>
          <p className='m-0 mt-4px text-13px leading-18px text-t-tertiary'>
            {t('bots.im.description', { defaultValue: 'Bot 与用户的实时聊天，支持主动发送。' })}
          </p>
        </div>
        <Tooltip content={t('bots.refresh', { defaultValue: '刷新' })}>
          <Button
            shape='circle'
            icon={<Refresh theme='outline' size='14' fill='currentColor' strokeWidth={4} />}
            onClick={() => { void loadConversations(); void loadMessages(); }}
          />
        </Tooltip>
      </div>

      <div className='grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)] gap-0 max-[760px]:grid-cols-1'>
        {/* 左栏：会话列表 */}
        <aside className='flex min-h-0 flex-col border-r border-solid border-[var(--color-border-2)]'>
          <div className='flex shrink-0 items-center justify-between px-14px py-10px'>
            <span className='text-12px font-medium leading-18px text-t-tertiary'>
              {t('bots.im.conversations', { defaultValue: '会话' })}
              <span className='ml-6px'>({conversations.length})</span>
            </span>
          </div>
          <div className='min-h-0 flex-1 overflow-y-auto p-8px'>
            {conversations.length === 0 ? (
              <div className='flex h-full items-center justify-center py-20px'>
                <Empty description={t('bots.im.empty', { defaultValue: '暂无会话' })} />
              </div>
            ) : (
              <ConversationList className='!h-auto !bg-transparent !p-0'>
                {conversations.map((c) => {
                  const key = `${c.botId}|${c.fromUser ?? ''}`;
                  const selected = key === activeKey;
                  return (
                    <Conversation
                      key={key}
                      name={c.nickname || c.fromUser || c.botId || '—'}
                      lastSenderName={c.platform ? (PLATFORM_LABEL[c.platform] ?? c.platform) : undefined}
                      info={c.lastContent || ''}
                      active={selected}
                      onClick={() => handleSelect(key)}
                      style={{
                        borderRadius: 12,
                        marginBottom: 6,
                        padding: '10px 12px',
                        background: selected ? 'var(--color-fill-2)' : 'transparent',
                        border: 'none',
                      }}
                    >
                      <Conversation.Operations>
                        <StatusBadge status={c.status} />
                      </Conversation.Operations>
                    </Conversation>
                  );
                })}
              </ConversationList>
            )}
          </div>
        </aside>

        {/* 右栏：聊天窗 */}
        <section className='flex min-h-0 min-w-0 flex-col max-[760px]:h-[70vh]'>
          {!active ? (
            <div className='flex h-full items-center justify-center'>
              <Empty description={t('bots.im.select', { defaultValue: '选择左侧会话开始聊天' })} />
            </div>
          ) : (
            <>
              {/* 会话头 */}
              <div className='flex shrink-0 items-center gap-10px border-b border-solid border-[var(--color-border-2)] bg-fill-1 px-16px py-12px'>
                <span className='flex size-34px shrink-0 items-center justify-center rounded-10px bg-fill-2 text-14px font-500 text-t-secondary'>
                  {(active.nickname || active.fromUser || '?').slice(0, 1).toUpperCase()}
                </span>
                <div className='min-w-0 flex-1'>
                  <div className='truncate text-14px font-500 leading-20px text-t-primary'>
                    {active.nickname || active.fromUser || '—'}
                  </div>
                  <div className='flex items-center gap-8px'>
                    <span className='truncate text-12px leading-16px text-t-tertiary'>{active.botId || '—'}</span>
                    <StatusBadge status={active.status} />
                  </div>
                </div>
              </div>

              {/* 消息区 */}
              <div className='min-h-0 flex-1 overflow-hidden bg-[var(--color-bg-1)]'>
                {loading ? (
                  <div className='flex h-full items-center justify-center'><Spin /></div>
                ) : (
                  <MessageList className='!h-full !bg-transparent'>
                    {messages.length === 0 ? (
                      <div className='flex h-full items-center justify-center'>
                        <Empty description={t('bots.im.noMessages', { defaultValue: '暂无消息，发一条开始对话' })} />
                      </div>
                    ) : (
                      messages.map((m, i) => {
                        const isOut = m.direction === 'OUT';
                        const showSeparator =
                          i === 0 ||
                          (m.createTime && messages[i - 1]?.createTime &&
                            new Date(m.createTime).toDateString() !== new Date(messages[i - 1].createTime!).toDateString());
                        return (
                          <React.Fragment key={m.id ?? i}>
                            {showSeparator ? <MessageSeparator content={formatGroupTime(m.createTime)} /> : null}
                            <ChatMsg
                              model={{
                                message: m.content ?? '',
                                direction: isOut ? 'outgoing' : 'incoming',
                                position: 'single',
                              }}
                              avatarSpacer
                              style={{ marginBottom: 10 }}
                            >
                              <ChatMsg.Footer sender={isOut ? '' : (active.fromUser ?? '')}>
                                {formatTime(m.createTime)}
                              </ChatMsg.Footer>
                            </ChatMsg>
                          </React.Fragment>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </MessageList>
                )}
              </div>

              {/* 输入条 */}
              <ChatInput
                disabled={sending}
                value={input}
                onChange={setInput}
                onSend={() => void handleSend()}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}