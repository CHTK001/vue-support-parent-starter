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
import { QRCodeSVG } from 'qrcode.react';
import { Button, Checkbox, Empty, Message, Modal, Spin, Tooltip } from '@arco-design/web-react';
import { Attention, Check, Checkbox as CheckboxIcon, Delete, EmotionHappy, FaceRecognition, Refresh } from '@icon-park/react';
import {
  Avatar as ChatAvatar,
  Conversation,
  ConversationList,
  Message as ChatMsg,
  MessageList,
  MessageSeparator,
} from '@chatscope/chat-ui-kit-react';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { wsEmitter } from '@/common/adapter/httpBridge';
import { http } from '@repo/core';
import { unwrapResult, AxiosError } from '@repo/utils';
import { useConfig } from '@renderer/hooks/config/useConfig';
import { isSubmitGesture, type SendKeyMode } from '@renderer/hooks/chat/useCompositionInput';
import { HUB_PAGE_TITLE_CLASS } from '@/renderer/components/layout/HubPageShell';
import { PlatformBadge, StatusBadge } from '@/renderer/utils/botStatusMeta';
import { PlatformLogo } from '@/renderer/utils/platformLogo';
import '@/renderer/styles/chatscope-override.css';
import '@/renderer/styles/ai-page.css';
import { resolveModelVendorLogo } from '@/renderer/utils/model/modelVendorLogo';
import { ContextInfoPanel } from '@/renderer/components/chat/ContextInfoPanel';

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
  avatarUrl?: string;
  model?: string;
}

/** 聊天记录消息 */
interface ChatMessage {
  id?: number;
  botId?: string;
  direction?: string;
  fromUser?: string;
  content?: string;
  createTime?: string;
  /** 发送状态：sending=发送中 / sent=已发送 / failed=发送失败 */
  status?: 'sending' | 'sent' | 'failed';
  /** 发送失败时的错误描述（供聊天记录内展示） */
  sendError?: string;
}

/** 兼容两种信封 */
function extractList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === 'object' && Array.isArray((res as { data?: unknown }).data)) {
    return (res as { data: T[] }).data;
  }
  return [];
}

/**
 * 将后端返回的原始错误文案映射为面向用户的中文说明（失败原因 + 解决方式）。
 * 后端可能返回英文（如 session timeout）或简短短语，用户无法据此判断下一步，
 * 这里统一转换为可操作的提示。无法识别的原文原样返回（不吞错误）。
 *
 * @param raw 后端返回的原始错误消息（可能为空）
 * @return 用户可理解的中文说明
 */
function friendlyError(raw: string): string {
  const r = (raw ?? '').trim();
  if (!r) return '消息发送失败';
  const lower = r.toLowerCase();
  if (lower.includes('session timeout') || lower.includes('timeout') || lower.includes('expired') || lower.includes('-14')) {
    return '微信会话已过期，请点击「重新扫码绑定」后重试';
  }
  if (lower.includes('not running') || lower.includes('未运行') || lower.includes('offline') || lower.includes('离线')) {
    return 'Bot 未在运行，请扫描二维码重新绑定后重试';
  }
  if (r.includes('不能为空')) return r;
  return r;
}

/** 从 http() 抛出的错误中提取后端返回的错误信息（兼容 AxiosError 与 unwrapResult 抛出的 Error） */
function getBackendError(e: unknown): string {
  if (e instanceof AxiosError) {
    const data = e.response?.data;
    if (data && typeof data === 'object') {
      const msg = (data as Record<string, unknown>).msg || (data as Record<string, unknown>).message || '';
      if (msg) return String(msg);
    }
  }
  return (e instanceof Error ? e.message : '') || '';
}

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

/** 常用 Emoji 列表（按场景分组） */
const COMMON_EMOJIS = [
  '😀', '😂', '🥰', '😎', '🤔', '😅', '😊', '🥳', '😭', '😡',
  '👍', '👎', '🙏', '💪', '👏', '🤝', '✌️', '🤞', '💯', '🔥',
  '❤️', '💕', '💔', '👀', '⭐', '🌟', '✨', '💫', '🎉', '🎊',
  '✅', '❌', '⚡', '💡', '📌', '🔔', '🎯', '💬', '📝', '🚀',
] as const;

/** 简易 Emoji 面板（点击插入光标位置） */
const EmojiPicker: React.FC<{ onInsert: (emoji: string) => void }> = ({ onInsert }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className='relative'>
        <button
        type='button'
        className='flex h-28px w-28px items-center justify-center rounded-8px text-t-secondary transition-colors hover:bg-fill-2 hover:text-t-primary'
        onClick={() => setOpen((v) => !v)}
        aria-label='Emoji'
        title='插入表情'
      >
        <EmotionHappy theme='outline' size='16' fill='currentColor' strokeWidth={2} />
      </button>
      {open && (
        <>
          <div className='fixed inset-0 z-40' onClick={() => setOpen(false)} />
          <div className='absolute bottom-full left-0 z-50 mb-8px w-280px rounded-12px border border-solid border-[var(--color-border-2)] bg-fill-1 p-8px shadow-lg'>
            <div className='grid grid-cols-10 gap-2px'>
              {COMMON_EMOJIS.map((e) => (
                <button
                  key={e}
                  type='button'
                  className='flex h-26px w-26px items-center justify-center rounded-6px text-lg transition-all hover:bg-fill-2 hover:scale-110'
                  onClick={() => { onInsert(e); setOpen(false); }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/** 输入框（chatscope 不内置受控输入，自绘一个简洁输入条，发送键适配全局配置） */
const ChatInput: React.FC<{
  disabled?: boolean;
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onPolish?: () => void;
  polishing?: boolean;
  onSummarize?: () => void;
  summarizing?: boolean;
  botId?: string;
}> = ({ disabled, value, onChange, onSend, onPolish, polishing, onSummarize, summarizing, botId }) => {
  const { t } = useTranslation();
  const [sendKeyPref] = useConfig('chat.sendKey');
  const sendKey: SendKeyMode = sendKeyPref
    ?? (() => { try { return localStorage.getItem('chat.sendKey') as SendKeyMode || 'enter'; } catch { return 'enter'; } })();
  const placeholder = sendKey === 'enter'
    ? t('bots.im.inputPlaceholder', { defaultValue: '输入消息，回车发送，Shift+Enter 换行……' })
    : t('bots.im.inputPlaceholderMod', { defaultValue: '输入消息，Ctrl+Enter 发送，Enter 换行……' });

  /** 命令补全状态 */
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdType, setCmdType] = useState<'/' | '@' | '#'>('/');
  const [cmdQuery, setCmdQuery] = useState('');
  const [cmdIdx, setCmdIdx] = useState(0);
  const cmdRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  /** 从后端 SPI 加载命令清单 */
  interface CmdItem { prefix: string; label: string; desc: string; }
  const [cmdList, setCmdList] = useState<CmdItem[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await http().get('/v2/ai/bot-binding/commands').then(r => unwrapResult<Array<{ name?: string; description?: string; prefix?: string }>>(r));
        if (Array.isArray(res)) {
          setCmdList(res.map((c) => ({
            prefix: c.prefix ?? '/',
            label: c.name ?? '',
            desc: c.description ?? '',
          })));
        }
      } catch { /* 忽略 */ }
    })();
  }, []);

  /** 动态命令（@ / #）的联系人列表 */
  const [contacts, setContacts] = useState<string[]>([]);
  const loadContacts = useCallback(async (id?: string) => {
    if (!id) return;
    try {
      const res = await http().get(`/v2/ai/bot-binding/contacts?botId=${id}`).then(r => unwrapResult<string[]>(r));
      setContacts(Array.isArray(res) ? res : []);
    } catch { setContacts([]); }
  }, []);

  /** botId 变化时加载联系人 */
  useEffect(() => {
    void loadContacts(botId);
  }, [botId, loadContacts]);

  /** 检测输入中的命令 */
  const detectCommand = useCallback((text: string) => {
    const trimmed = text;
    if (trimmed.startsWith('/') || trimmed.startsWith('@') || trimmed.startsWith('#')) {
      const prefix = trimmed[0] as '/' | '@' | '#';
      const query = trimmed.slice(1);
      setCmdType(prefix);
      setCmdQuery(query);
      setCmdIdx(0);
      setCmdOpen(true);
    } else {
      setCmdOpen(false);
    }
  }, []);

  /** 选中命令 */
  const selectCmd = useCallback((label: string) => {
    const suffix = label.startsWith('/') ? ' ' : '';
    onChange(label + suffix);
    setCmdOpen(false);
    requestAnimationFrame(() => {
      const ta = taRef.current ?? (document.querySelector('textarea') as HTMLTextAreaElement | null);
      if (ta) ta.focus();
    });
  }, [onChange]);

  /** 获取当前候选列表 */
  const cmdItems = useMemo(() => {
    if (cmdType === '/') {
      return cmdList.filter(c => c.label.includes(cmdQuery));
    }
    const lowerQuery = cmdQuery.toLowerCase();
    const filtered = contacts
      .filter(c => c.toLowerCase().includes(lowerQuery))
      .map(c => ({
        prefix: cmdType,
        label: `${cmdType}${c}`,
        desc: cmdType === '@' ? t('bots.cmd.atUser', { defaultValue: '向用户发消息' }) : t('bots.cmd.aiAtUser', { defaultValue: 'AI 回复用户' }),
      }));
    // 即使联系人为空，也显示提示
    if (filtered.length === 0 && contacts.length === 0) {
      return [{
        prefix: cmdType,
        label: `${cmdType}`,
        desc: t('bots.cmd.noContacts', { defaultValue: '暂无联系人' }),
      }];
    }
    return filtered;
  }, [cmdType, cmdQuery, contacts, cmdList, t]);

  /** 键盘导航命令列表 */
  const handleCmdKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!cmdOpen || cmdItems.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCmdIdx(i => (i + 1) % cmdItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCmdIdx(i => (i - 1 + cmdItems.length) % cmdItems.length);
    } else if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey && sendKey === 'enter')) {
      if (cmdItems.length > 0) {
        e.preventDefault();
        selectCmd(cmdItems[cmdIdx].label);
      }
    } else if (e.key === 'Escape') {
      setCmdOpen(false);
    }
  }, [cmdOpen, cmdItems, cmdIdx, selectCmd, sendKey]);

  /** 点击外部关闭命令面板 */
  useEffect(() => {
    if (!cmdOpen) return;
    const handler = (e: MouseEvent) => {
      if (cmdRef.current && !cmdRef.current.contains(e.target as Node)) {
        setCmdOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [cmdOpen]);

  const insertEmoji = useCallback((emoji: string) => {
    const ta = document.querySelector('textarea') as HTMLTextAreaElement | null;
    if (ta) {
      const start = ta.selectionStart ?? ta.value.length;
      const end = ta.selectionEnd ?? start;
      const next = ta.value.slice(0, start) + emoji + ta.value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + emoji.length;
        ta.focus();
      });
    } else {
      onChange(value + emoji);
    }
  }, [onChange, value]);

  return (
    <div className='ai-page relative flex shrink-0 flex-col border-t border-solid border-[var(--color-border-2)] bg-fill-1'>
      {/* 工具栏：Emoji + AI 分析 */}
      <div className='flex items-center gap-6px px-12px pt-8px'>
        <EmojiPicker onInsert={insertEmoji} />
        {onPolish && value.trim() && (
          <Tooltip content={t('bots.im.polishHint', { defaultValue: 'AI 润色：让文本更得体、清晰' })}>
            <Button
              size='mini'
              type='text'
              icon={<FaceRecognition theme='outline' size='14' fill='currentColor' strokeWidth={2} />}
              loading={polishing}
              disabled={disabled}
              onClick={onPolish}
              className='text-t-secondary hover:text-t-primary'
            >
              {t('bots.im.polish', { defaultValue: '润色' })}
            </Button>
          </Tooltip>
        )}
        {onSummarize && (
          <Tooltip content={t('bots.im.summarizeHint', { defaultValue: 'AI 上下文总结：自动提炼对话摘要' })}>
            <Button
              size='mini'
              type='text'
              icon={<EmotionHappy theme='outline' size='14' fill='currentColor' strokeWidth={2} />}
              loading={summarizing}
              disabled={disabled}
              onClick={onSummarize}
              className='text-t-secondary hover:text-t-primary'
            >
              {t('bots.im.summarize', { defaultValue: '上下文总结' })}
            </Button>
          </Tooltip>
        )}
      </div>
      {/* 命令补全面板 */}
      {cmdOpen && cmdItems.length > 0 && (
        <div
          ref={cmdRef}
          className='absolute bottom-full left-12px right-12px z-50 mb-6px max-h-200px overflow-auto rounded-12px border border-solid border-[var(--color-border-2)] bg-[var(--color-bg-1)] p-4px shadow-lg'
        >
          <div className='px-8px py-6px text-11px font-medium text-t-tertiary'>
            {cmdType === '/' ? t('bots.im.commands', { defaultValue: '可用命令' }) : t('bots.im.contacts', { defaultValue: '选择联系人' })}
          </div>
          {cmdItems.map((item, i) => (
            <div
              key={item.label}
              className={`flex cursor-pointer items-center gap-8px rounded-8px px-8px py-7px text-13px transition-colors ${
                i === cmdIdx ? 'bg-primary-1 text-primary-6' : 'hover:bg-fill-2 text-t-primary'
              }`}
              onMouseEnter={() => setCmdIdx(i)}
              onMouseDown={(e) => { e.preventDefault(); selectCmd(item.label); }}
            >
              <span className='shrink-0 rounded-4px bg-fill-2 px-4px font-mono text-11px font-600 text-t-secondary'>
                {item.label.split(' ')[0]}
              </span>
              <span className='truncate text-t-secondary'>{item.desc}</span>
            </div>
          ))}
        </div>
      )}
      {/* 输入区 + 发送按钮 */}
      <div className='flex items-end gap-8px p-10px'>
        <div className='relative min-h-40px max-h-300px flex-1'>
          <textarea
            ref={taRef}
            rows={2}
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(e) => { onChange(e.target.value); detectCommand(e.target.value); }}
            onKeyDown={(e) => {
              if (cmdOpen) {
                handleCmdKeyDown(e);
                return;
              }
              if (isSubmitGesture(e, sendKey)) {
                e.preventDefault();
                if (!disabled && value.trim()) onSend();
              }
            }}
            className='h-full w-full resize-y rounded-12px border border-solid border-[var(--color-border-2)] bg-[var(--color-bg-2)] px-12px py-8px text-13px leading-20px text-t-primary outline-none transition-colors placeholder:text-t-tertiary focus:border-[var(--color-primary-6)]'
          />
        </div>
        <Button
          type='primary'
          shape='round'
          disabled={disabled || !value.trim()}
          onClick={onSend}
          style={{ paddingInline: 20 }}
        >
          {t('bots.im.send', { defaultValue: '发送' })}
        </Button>
      </div>
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
  const [polishing, setPolishing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [historySize, setHistorySize] = useState<number>(50);
  const [messagePage, setMessagePage] = useState(0);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  /* 会话列表 */
  const loadConversations = useCallback(async () => {
    try {
      const res = await http().get('/v2/ai/bot-binding/conversations').then(r => unwrapResult<ConversationItem[]>(r));
      const list = Array.isArray(res) ? res : extractList<ConversationItem>(res);
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
    /* 加载全局配置（含 historySize） */
    (async () => {
      try {
        const res = await http().get('/v2/ai/bot-binding/global-config').then(r => unwrapResult<Record<string, unknown>>(r));
        if (typeof res?.historySize === 'number') setHistorySize(res.historySize);
      } catch { /* 忽略 */ }
    })();
  }, [loadConversations]);

  const active = useMemo(
    () => conversations.find((c) => `${c.botId}|${c.fromUser ?? ''}` === activeKey) ?? null,
    [conversations, activeKey]
  );

  /* ILink 会话运行状态 + 重新扫码 */
  const [runtimeStatus, setRuntimeStatus] = useState<'checking' | 'running' | 'stopped'>('checking');
  const [scanPhase, setScanPhase] = useState<'idle' | 'fetching' | 'showing_qr' | 'scanned' | 'expired' | 'error' | 'confirmed'>('idle');
  const [qrcodeUrl, setQrcodeUrl] = useState('');
  const [scanKey, setScanKey] = useState('');
  const [scanMsg, setScanMsg] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPoll = useCallback(() => {
    if (pollRef.current != null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  /* 查询指定 Bot 的 ILink 会话运行状态（超时则提示重新扫码） */
  const checkRuntimeStatus = useCallback(async (botId?: string) => {
    if (!botId) return;
    try {
      const res = await http().get(`/v2/ai/bot-binding/runtime-status?botId=${encodeURIComponent(botId)}`).then(r => unwrapResult<{ status?: string }>(r));
      setRuntimeStatus(res?.status === 'running' ? 'running' : 'stopped');
    } catch {
      setRuntimeStatus('stopped');
    }
  }, []);

  useEffect(() => {
    if (!active?.botId) return;
    setRuntimeStatus('checking');
    void checkRuntimeStatus(active.botId);
  }, [active?.botId, checkRuntimeStatus]);

  /** 启动扫码轮询（复用 BotManagementPage 的二维码状态机） */
  const startScanPoll = useCallback((key: string) => {
    setScanKey(key);
    stopPoll();
    pollRef.current = setInterval(async () => {
      try {
        const res = await http().get(`/v2/ai/bot-binding/qrcode/status?key=${encodeURIComponent(key)}`).then(r => unwrapResult<{ status?: string; qrcodeUrl?: string; expireAt?: number }>(r));
        const s = res?.status ?? 'pending';
        if (res?.qrcodeUrl) setQrcodeUrl(res.qrcodeUrl);
        if (s === 'confirmed') {
          stopPoll();
          setScanPhase('confirmed');
          Message.success(t('bots.scan.success', { defaultValue: '扫码成功，已自动绑定' }));
          void checkRuntimeStatus(active?.botId);
          void loadConversations();
        } else if (s === 'scanned') {
          setScanPhase('scanned');
        } else if (s === 'expired' || s === 'error') {
          stopPoll();
          setScanPhase(s);
        } else {
          setScanPhase('showing_qr');
        }
      } catch {
        stopPoll();
        setScanPhase('error');
        setScanMsg(t('bots.scan.pollFailed', { defaultValue: '状态查询失败，请重试' }));
      }
    }, 3000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopPoll, t]);

  /** 发起重新扫码（携带旧 botId，扫码确认后合并到旧绑定并自动刷新会话） */
  const handleRescan = useCallback(async () => {
    stopPoll();
    setScanPhase('fetching');
    setQrcodeUrl('');
    setScanMsg('');
    try {
      const oldBotId = active?.botId ? encodeURIComponent(active.botId) : '';
      const platform = encodeURIComponent(active?.platform ?? 'wechat');
      const res = await http().post(`/v2/ai/bot-binding/qrcode?platform=${platform}${oldBotId ? `&botId=${oldBotId}` : ''}`)
        .then(r => unwrapResult<{ key?: string; qrcodeUrl?: string }>(r));
      const key = res?.key ?? '';
      if (!key) {
        setScanPhase('error');
        setScanMsg(t('bots.scan.noKey', { defaultValue: '未获取到会话 key，请重试' }));
        return;
      }
      if (res?.qrcodeUrl) setQrcodeUrl(res.qrcodeUrl);
      setScanPhase('showing_qr');
      startScanPoll(key);
    } catch {
      setScanPhase('error');
      setScanMsg(t('bots.scan.unavailable', { defaultValue: 'iLink 服务暂不可用，请确认网络连通性或稍后重试' }));
    }
  }, [stopPoll, startScanPoll, t, active?.botId, active?.platform]);

  useEffect(() => () => stopPoll(), [stopPoll]);

  /** 获取当前 Bot 的绑定信息（含模型） */
  const activeBot = useMemo(() => {
    if (!active?.botId) return null;
    return conversations.find((c) => c.botId === active.botId) ?? null;
  }, [active?.botId, conversations]);

  /* 加载当前会话历史 */
  const loadMessages = useCallback(async (resetPage = false) => {
    if (!active?.botId) return;
    const page = resetPage ? 0 : messagePage;
    if (resetPage) setLoading(true);
    else setLoadingOlder(true);
    try {
      const res = await http().get(`/v2/ai/bot-binding/messages?botId=${encodeURIComponent(active.botId)}&fromUser=${encodeURIComponent(active.fromUser ?? '')}&page=${page}&pageSize=${historySize}`)
        .then(r => unwrapResult<{ messages?: ChatMessage[]; hasMore?: boolean; page?: number; pageSize?: number }>(r));
      const data = res as Record<string, unknown>;
      const list: ChatMessage[] = Array.isArray(data.messages) ? data.messages : extractList<ChatMessage>(data);
      if (resetPage) {
        setMessages(list);
        // 第 0 页（最近一页）已展示，滚动加载更早历史应从第 1 页开始
        setMessagePage(1);
      } else {
        setMessages((prev) => [...list, ...prev]);
        setMessagePage((p) => p + 1);
      }
      setHasMore(data.hasMore !== false);
    } catch {
      Message.error(t('bots.im.loadChatFailed', { defaultValue: '聊天记录加载失败' }));
    } finally {
      setLoading(false);
      setLoadingOlder(false);
    }
  }, [active, t, messagePage, historySize]);

  useEffect(() => {
    void loadMessages(true);
  }, [activeKey]);

  /* 删除会话（清理僵尸账号聊天记录） */
  const handleDeleteConversation = useCallback(async (botId: string, fromUser: string | undefined) => {
    try {
      await http().delete(`/v2/ai/bot-binding/conversations?botId=${encodeURIComponent(botId)}&fromUser=${encodeURIComponent(fromUser ?? '')}`)
        .then(r => unwrapResult<{ deleted?: number }>(r));
      const key = `${botId}|${fromUser ?? ''}`;
      setConversations((prev) => prev.filter((c) => `${c.botId}|${c.fromUser ?? ''}` !== key));
      if (key === activeKey) {
        setActiveKey('');
        setMessages([]);
      }
      Message.success(t('bots.im.deleteConversationSuccess', { defaultValue: '会话已删除' }));
    } catch {
      Message.error(t('bots.im.deleteConversationFailed', { defaultValue: '删除失败' }));
    }
  }, [activeKey, t]);

  /* 批量选择模式切换（退出时清空选中） */
  const handleToggleSelectMode = useCallback(() => {
    setSelectMode((prev) => {
      const next = !prev;
      if (!next) setSelectedKeys(new Set());
      return next;
    });
  }, []);

  /* 切换单个会话选中 */
  const handleToggleSelect = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  /* 批量删除选中会话 */
  const handleBatchDelete = useCallback(async () => {
    const keys = [...selectedKeys];
    if (keys.length === 0) return;
    try {
      await Promise.all(keys.map((key) => {
        const [botId, ...rest] = key.split('|');
        const fromUser = rest.join('|');
        return http().delete(`/v2/ai/bot-binding/conversations?botId=${encodeURIComponent(botId)}&fromUser=${encodeURIComponent(fromUser)}`)
          .then(r => unwrapResult<{ deleted?: number }>(r));
      }));
      const keySet = new Set(keys);
      setConversations((prev) => prev.filter((c) => !keySet.has(`${c.botId}|${c.fromUser ?? ''}`)));
      if (selectedKeys.has(activeKey)) {
        setActiveKey('');
        setMessages([]);
      }
      setSelectedKeys(new Set());
      setSelectMode(false);
      Message.success(t('bots.im.deleteConversationsSuccess', { count: keys.length, defaultValue: '已删除 {{count}} 个会话' }));
    } catch {
      Message.error(t('bots.im.deleteConversationsFailed', { defaultValue: '批量删除失败' }));
    }
  }, [selectedKeys, activeKey, t]);

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
      const content = (payload?.content ?? '').trim();
      // 过滤 / 命令消息（不保存数据库）
      if (content.startsWith('/')) return;
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
    const localId = Date.now();
    const localMsg: ChatMessage = {
      id: localId,
      botId: active.botId,
      direction: 'OUT',
      fromUser: active.fromUser,
      content,
      createTime: new Date().toISOString(),
      status: 'sending',
    };
    // 先乐观插入用户消息，发送成功/失败都保留在聊天记录中，避免"发出去没反应"
    setMessages((prev) => [...prev, localMsg]);
    setInput('');
    try {
      const res = await http().post('/v2/ai/bot-binding/send')
        .data({
          botId: active.botId,
          fromUser: active.fromUser,
          content,
        })
        .then(r => unwrapResult<{ ok?: boolean; success?: boolean; msg?: string; msgId?: string; messageId?: string }>(r));
      // 业务失败：后端可能返回 HTTP 200 但 ok=false / success=false（如会话过期），
      // 必须识别并标记失败，否则用户会看到自己的消息"已发出"但实际没送达。
      if (res && (res.ok === false || res.success === false)) {
        const reason = friendlyError(res.msg || '');
        const rescanNeeded = /未在运行|未运行|过期|expired|timeout|超时|重新扫码|已停止|离线|session/i.test(reason);
        setMessages((prev) => prev.map((m) => (m.id === localId ? { ...m, status: 'failed', sendError: reason } : m)));
        if (rescanNeeded) {
          setRuntimeStatus('stopped');
          Message.warning(reason);
        } else {
          Message.error(reason);
        }
        return;
      }
      // 发送成功：标记该消息为已发送
      setMessages((prev) => prev.map((m) => (m.id === localId ? { ...m, status: 'sent' } : m)));
      // / 命令：服务器返回的命令输出以系统消息追加
      if (content.startsWith('/')) {
        const cmdOutput = res?.messageId ?? res?.msgId;
        if (cmdOutput) {
          setMessages((prev) => [...prev, {
            id: Date.now() + 1,
            botId: active.botId,
            direction: 'IN',
            fromUser: 'system',
            content: cmdOutput,
            createTime: new Date().toISOString(),
            status: 'sent',
          }]);
        }
      }
    } catch (e) {
      // 发送失败：保留该消息，标记失败并展示错误原因 + 解决入口
      const reason = friendlyError(getBackendError(e));
      // 判断是否为"Bot 未运行 / 会话过期"类错误，提示重新扫码
      const rescanNeeded = /未在运行|未运行|过期|expired|timeout|超时|重新扫码|已停止|离线|session/i.test(reason);
      setMessages((prev) => prev.map((m) => (m.id === localId ? { ...m, status: 'failed', sendError: reason } : m)));
      if (rescanNeeded) {
        setRuntimeStatus('stopped');
        Message.warning(reason);
      } else {
        Message.error(reason);
      }
    } finally {
      setSending(false);
    }
  }, [active, input, t]);

  /** AI 润色：对输入框文本做得体化润色 */
  const handlePolish = useCallback(async () => {
    if (!active?.botId || !input.trim()) return;
    setPolishing(true);
    try {
      const res = await http().post('/v2/ai/bot-binding/polish')
        .data({
          botId: active.botId,
          text: input,
        })
        .then(r => unwrapResult<{ result?: string }>(r));
      const result = res?.result?.trim();
      if (result) {
        setInput(result);
        Message.success(t('bots.im.polishSuccess', { defaultValue: '润色完成' }));
      } else {
        Message.warning(t('bots.im.polishEmpty', { defaultValue: '润色未返回内容' }));
      }
    } catch {
      Message.error(t('bots.im.polishFailed', { defaultValue: '润色失败' }));
    } finally {
      setPolishing(false);
    }
  }, [active, input, t]);

  /** 滚动到顶部时加载更早的消息 */
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || loadingOlder || !hasMore) return;
    if (container.scrollTop < 60 && messages.length > 0) {
      void loadMessages();
    }
  }, [loadingOlder, hasMore, messages.length, loadMessages]);

  /** 上下文总结：AI 对当前会话的聊天记录生成摘要 */
  const handleSummarize = useCallback(async () => {
    if (!active?.botId) return;
    setSummarizing(true);
    try {
      const res = await http().post('/v2/ai/bot-binding/summarize')
        .data({
          botId: active.botId,
          fromUser: active.fromUser,
        })
        .then(r => unwrapResult<{ summary?: string }>(r));
      const summary = res?.summary?.trim();
      if (summary) {
        Message.success(t('bots.im.summarizeSuccess', { defaultValue: '上下文总结完成' }));
        // 将总结作为系统提示注入输入框
        setInput((prev) => prev ? `${prev}\n\n--- 上下文摘要 ---\n${summary}` : `--- 上下文摘要 ---\n${summary}`);
      } else {
        Message.warning(t('bots.im.summarizeEmpty', { defaultValue: '未生成摘要' }));
      }
    } catch {
      Message.error(t('bots.im.summarizeFailed', { defaultValue: '上下文总结失败' }));
    } finally {
      setSummarizing(false);
    }
  }, [active, t]);

  const handleSelect = useCallback((key: string) => {
    setActiveKey(key);
  }, []);

  return (
    <div className='ai-page box-border flex h-full w-full flex-col overflow-hidden'>
      {/* 头部 */}
      <div className='flex shrink-0 items-center justify-between gap-12px border-b border-solid border-[var(--color-border-2)] bg-fill-1 px-16px py-12px md:px-24px'>
        <div className='flex min-w-0 items-center gap-12px'>
          <div className='ai-icon-tile !size-38px !rounded-12px'>
            <svg className='h-20px w-20px' viewBox='0 0 24 24' fill='none'>
              <path d='M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 9h-4v-7h4v7z' fill='currentColor' />
            </svg>
          </div>
          <div className='min-w-0'>
            <h1 className={HUB_PAGE_TITLE_CLASS}>
              {t('bots.im.title', { defaultValue: 'Bot IM' })}
            </h1>
            <p className='m-0 mt-2px text-12px leading-16px text-t-tertiary'>
              {t('bots.im.description', { defaultValue: 'Bot 与用户的实时聊天，支持主动发送。' })}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-6px'>
          <Tooltip content={t('bots.refresh', { defaultValue: '刷新' })}>
            <Button
              shape='circle'
              icon={<Refresh theme='outline' size='14' fill='currentColor' strokeWidth={4} />}
              onClick={() => { void loadConversations(); void loadMessages(true); }}
            />
          </Tooltip>
          <Tooltip content={t('bots.im.selectMode', { defaultValue: '批量选择' })}>
            <Button
              shape='circle'
              className={selectMode ? '!text-primary-6 !bg-primary-1' : undefined}
              icon={<CheckboxIcon theme='outline' size='16' fill='currentColor' strokeWidth={2} />}
              onClick={handleToggleSelectMode}
            />
          </Tooltip>
          {selectMode && selectedKeys.size > 0 && (
            <Tooltip content={t('bots.im.deleteSelected', { defaultValue: '删除所选' })}>
              <Button
                shape='circle'
                status='danger'
                icon={<Delete theme='outline' size='16' fill='currentColor' strokeWidth={2} />}
                onClick={() => {
                  Modal.confirm({
                    title: t('bots.im.deleteSelected', { defaultValue: '删除所选' }),
                    content: t('bots.im.deleteSelectedConfirm', {
                      count: selectedKeys.size,
                      defaultValue: '确定删除选中的 {{count}} 个会话吗？聊天记录将一并清除且不可恢复。',
                    }),
                    okButtonProps: { status: 'danger' },
                    onOk: () => handleBatchDelete(),
                  });
                }}
              />
            </Tooltip>
          )}
          <Tooltip content={t('bots.im.clearHistory', { defaultValue: '清空聊天记录' })}>
            <Button
              shape='circle'
              status='danger'
              icon={<Delete theme='outline' size='16' fill='currentColor' strokeWidth={2} />}
              onClick={() => {
                if (!active) return;
                Modal.confirm({
                  title: t('bots.im.clearHistory', { defaultValue: '清空聊天记录' }),
                  content: t('bots.im.clearHistoryConfirm', {
                    defaultValue: '仅清空本地展示的聊天记录，确认继续？',
                  }),
                  okButtonProps: { status: 'danger' },
                  onOk: () => setMessages([]),
                });
              }}
            />
          </Tooltip>
        </div>
      </div>

      <div className='grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)] gap-0 max-[760px]:grid-cols-1'>
        {/* 左栏：会话列表 */}
        <aside className='botim-scroll flex min-h-0 flex-col border-r border-solid border-[var(--color-border-2)]'>
          {/* 上下文信息面板 */}
          <ContextInfoPanel modelName={active?.model || undefined} />
          <div className='min-h-0 flex-1 overflow-y-auto p-8px'>
            {conversations.length === 0 ? (
              <div className='flex h-full flex-col items-center justify-center gap-y-8px px-16px text-center'>
                <Empty description={t('bots.im.empty', { defaultValue: '暂无会话' })} />
                <div className='text-12px leading-18px text-t-tertiary'>
                  {t('bots.im.emptyHint', {
                    defaultValue: '还没有微信用户会话。请先前往「Bot 管理」扫码绑定微信，新消息会自动出现在这里。',
                  })}
                </div>
              </div>
            ) : (
              <ConversationList className='!h-auto !bg-transparent !p-0'>
                {conversations.map((c) => {
                  const key = `${c.botId}|${c.fromUser ?? ''}`;
                  const selected = key === activeKey;
                  const checked = selectedKeys.has(key);
                  return (
                    <Conversation
                      key={key}
                      name={
                        <span className='flex w-full items-center gap-x-6px'>
                          {selectMode && (
                            <Checkbox
                              checked={checked}
                              onClick={(event) => event.stopPropagation()}
                              onChange={() => handleToggleSelect(key)}
                            />
                          )}
                          <span className='truncate'>{c.nickname || c.fromUser || c.botId || '—'}</span>
                          <PlatformBadge platform={c.platform} />
                          <span className='ml-auto shrink-0 text-11px font-400 text-t-tertiary'>
                            {formatTime(c.lastTime)}
                          </span>
                        </span>
                      }
                      info={
                        <span className='flex w-full items-center gap-6px'>
                          <span className='min-w-0 flex-1 truncate'>{c.lastContent || ''}</span>
                          {(c.unread ?? 0) > 0 && (
                            <span className='flex h-16px min-w-16px shrink-0 items-center justify-center rounded-full bg-[var(--primary)] px-5px text-10px font-500 leading-none text-white'>
                              {c.unread! > 99 ? '99+' : c.unread}
                            </span>
                          )}
                        </span>
                      }
                      active={selectMode ? checked : selected}
                      onClick={() => {
                        if (selectMode) handleToggleSelect(key);
                        else handleSelect(key);
                      }}
                    >
                      <Conversation.Avatar>
                        <div className='ai-avatar !shrink-0'>
                          <PlatformLogo platform={c.platform} className='h-24px w-24px' />
                        </div>
                      </Conversation.Avatar>
                      <Conversation.Operations>
                        <div className='flex items-center gap-4px' onClick={(event) => event.stopPropagation()}>
                          <StatusBadge status={c.status} pulse />
                          <Tooltip content={t('bots.im.deleteConversation', { defaultValue: '删除会话' })}>
                            <Button
                              size='mini'
                              type='text'
                              status='danger'
                              className='!h-20px !min-w-20px !w-20px !p-0 !rounded-4px !text-t-tertiary hover:!text-danger'
                              icon={<Delete theme='outline' size='14' fill='currentColor' strokeWidth={2} />}
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleDeleteConversation(c.botId ?? '', c.fromUser);
                              }}
                            />
                          </Tooltip>
                        </div>
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
              {/* 会话头：大 Logo + Bot 信息 + 平台徽标 + 用户头像 */}
              <div className='flex shrink-0 items-center gap-12px border-b border-solid border-[var(--color-border-2)] bg-fill-1 px-16px py-12px'>
                {/* 大 Logo（主色浅底圆角块） */}
                <div className='ai-avatar shrink-0'>
                  <PlatformLogo platform={active.platform} className='h-24px w-24px' />
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-6px'>
                    <span className='truncate text-14px font-500 leading-20px text-t-primary'>
                      {active.nickname || active.fromUser || '—'}
                    </span>
                    <PlatformBadge platform={active.platform} />
                  </div>
                  <div className='mt-2px flex items-center gap-8px'>
                    <span className='truncate text-12px leading-16px text-t-tertiary'>{active.botId || '—'}</span>
                    <StatusBadge status={active.status} />
                    {activeBot?.model && (
                      <Tooltip content={activeBot.model}>
                        <img
                          src={resolveModelVendorLogo(activeBot.model) ?? undefined}
                          alt={activeBot.model}
                          className='h-14px w-14px shrink-0 rounded-4px object-contain opacity-70'
                        />
                      </Tooltip>
                    )}
                  </div>
                </div>
                {/* 用户头像 */}
                <span className='ai-avatar !size-34px shrink-0 !text-14px'>
                  {(active.nickname || active.fromUser || '?').slice(0, 1).toUpperCase()}
                </span>
              </div>

              {/* ILink 会话超时提示 + 重新扫码（二维码直接展示在聊天区） */}
              {runtimeStatus === 'stopped' && (
                <div className='shrink-0 px-16px py-12px'>
                  <div className='ai-warn-banner px-14px py-12px'>
                  <div className='flex items-start gap-10px'>
                    <Attention theme='filled' size='18' fill='var(--color-warning)' className='mt-1px shrink-0' />
                    <div className='min-w-0 flex-1'>
                      <div className='text-13px font-500 text-warning'>
                        {t('bots.im.sessionExpired', { defaultValue: '微信会话已过期，Bot 暂时无法收发消息' })}
                      </div>
                      <div className='mt-2px text-12px leading-18px text-t-tertiary'>
                        {t('bots.im.sessionExpiredHint', { defaultValue: '扫描下方二维码重新登录微信即可恢复（扫码成功后自动回到聊天）' })}
                      </div>
                    </div>
                  </div>
                  {/* 扫码区：折叠在提示条内，点击「重新扫码」展开 */}
                  {scanPhase === 'idle' ? (
                    <Button
                      size='small'
                      type='primary'
                      shape='round'
                      className='mt-10px'
                      onClick={() => void handleRescan()}
                    >
                      {t('bots.im.rescan', { defaultValue: '重新扫码绑定' })}
                    </Button>
                  ) : scanPhase === 'fetching' ? (
                    <div className='mt-10px flex items-center gap-8px text-12px text-t-tertiary'>
                      <Spin size={14} />
                      {t('bots.scan.fetching', { defaultValue: '正在获取二维码…' })}
                    </div>
                  ) : scanPhase === 'confirmed' ? (
                    <div className='mt-10px flex items-center gap-6px text-12px text-success'>
                      <Check theme='filled' size='14' fill='var(--color-success)' />
                      {t('bots.im.rescanDone', { defaultValue: '绑定成功，正在恢复会话…' })}
                    </div>
                  ) : (
                    <div className='ai-qr-panel !min-h-0 !p-12px mt-10px'>
                      {qrcodeUrl ? (
                        // qrcodeUrl 是微信登录页 URL（iLink 返回），需要编码为二维码供用户扫码，
                        // 不能直接用 <img src>（那是 HTML 页面，无法显示）。
                        <div className='ai-qr-frame'>
                          <QRCodeSVG value={qrcodeUrl} size={180} marginSize={1} />
                        </div>
                      ) : (
                        <div className='ai-qr-frame flex !size-180px items-center justify-center bg-[var(--color-fill-2)]'>
                          <Spin />
                        </div>
                      )}
                      <div className='text-12px text-t-tertiary'>
                        {scanPhase === 'scanned'
                          ? t('bots.scan.scanned', { defaultValue: '已扫码，请在手机上确认登录' })
                          : scanPhase === 'expired'
                            ? t('bots.scan.expired', { defaultValue: '二维码已过期' })
                            : scanPhase === 'error'
                              ? (scanMsg || t('bots.scan.error', { defaultValue: '获取二维码失败' }))
                              : t('bots.scan.waiting', { defaultValue: '请使用微信扫码' })}
                      </div>
                      {(scanPhase === 'expired' || scanPhase === 'error') && (
                        <Button size='mini' shape='round' onClick={() => void handleRescan()}>
                          {t('common.retry', { defaultValue: '重试' })}
                        </Button>
                      )}
                    </div>
                  )}
                  </div>
                </div>
              )}

              {/* 消息区 */}
              <div ref={messagesContainerRef} onScroll={handleScroll} className='botim-scroll min-h-0 flex-1 overflow-auto bg-[var(--color-bg-1)]'>
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
                        const prev = messages[i - 1];
                        const showSeparator =
                          i === 0 ||
                          (m.createTime && prev?.createTime &&
                            new Date(m.createTime).toDateString() !== new Date(prev.createTime!).toDateString());
                        // 连续同方向且间隔 <5min 的消息归为一组：组内仅最后一条带头像/时间
                        const sameGroupAsPrev =
                          !!prev && prev.direction === m.direction &&
                          !!m.createTime && !!prev.createTime &&
                          new Date(m.createTime).getTime() - new Date(prev.createTime).getTime() < 5 * 60 * 1000;
                        const next = messages[i + 1];
                        const sameGroupAsNext =
                          !!next && next.direction === m.direction &&
                          !!m.createTime && !!next.createTime &&
                          new Date(next.createTime).getTime() - new Date(m.createTime).getTime() < 5 * 60 * 1000;
                        const position = !sameGroupAsPrev && !sameGroupAsNext ? 'single' : !sameGroupAsPrev ? 'first' : sameGroupAsNext ? 'normal' : 'last';
                        const isGroupEnd = !sameGroupAsNext;
                        const avatarNode = isGroupEnd ? (
                          <ChatAvatar
                            name={isOut ? (active.fromUser || '?') : (activeBot?.nickname || activeBot?.botId || '?')}
                            className='botim-msg-avatar'
                          >
                            {isOut ? (
                              <span className='text-12px font-500 text-primary-6'>
                                {(active.fromUser || '?').slice(0, 1).toUpperCase()}
                              </span>
                            ) : activeBot?.avatarUrl ? (
                              <img src={activeBot.avatarUrl} alt='' className='h-full w-full rounded-full object-cover' />
                            ) : (
                              <span className='text-12px font-500 text-t-secondary'>
                                {(activeBot?.nickname || activeBot?.botId || '?').slice(0, 1).toUpperCase()}
                              </span>
                            )}
                          </ChatAvatar>
                        ) : undefined;
                        return (
                          <React.Fragment key={m.id ?? i}>
                            {showSeparator ? <MessageSeparator content={formatGroupTime(m.createTime)} /> : null}
                            <ChatMsg
                              model={{
                                message: m.content ?? '',
                                direction: isOut ? 'outgoing' : 'incoming',
                                position,
                              }}
                              avatarSpacer={!isGroupEnd || undefined}
                              style={{ marginBottom: sameGroupAsNext ? 2 : 10 }}
                            >
                              {avatarNode}
                              {isGroupEnd && (
                                <ChatMsg.Footer sender={isOut ? '' : (active.fromUser ?? '')}>
                                  {formatTime(m.createTime)}
                                  {/* 发送状态标记：发送中 / 已发送 / 失败 */}
                                  {m.status === 'sending'
                                    ? (<span className='ml-6px text-11px text-t-tertiary'>{t('bots.im.sending', { defaultValue: '发送中…' })}</span>)
                                    : m.status === 'failed'
                                      ? (<span className='ml-6px inline-flex items-center gap-2px text-11px text-danger'><Attention theme='filled' size='12' fill='currentColor' />{t('bots.im.sendFailed', { defaultValue: '发送失败' })}</span>)
                                      : m.status === 'sent'
                                        ? (<span className='ml-6px inline-flex items-center text-11px text-success'><Check theme='filled' size='12' fill='currentColor' /></span>)
                                        : null}
                                </ChatMsg.Footer>
                              )}
                            </ChatMsg>
                            {/* 发送失败：气泡下方展示错误原因与解决入口 */}
                            {m.status === 'failed' && m.sendError && (
                              <div className='mb-10px ml-auto max-w-[85%] rounded-12px border border-solid border-danger-2 bg-danger-1/10 px-10px py-8px text-12px text-danger'>
                                <div className='flex items-start gap-6px'>
                                  <Attention theme='filled' size='15' fill='var(--color-danger)' className='mt-1px shrink-0' />
                                  <div className='min-w-0 flex-1'>
                                    <div className='font-500'>{t('bots.im.sendErrorTitle', { defaultValue: '消息发送失败' })}</div>
                                    <div className='mt-2px break-words text-t-secondary'>{m.sendError}</div>
                                    {/未在运行|未运行|过期|expired|timeout|超时|重新扫码/i.test(m.sendError) && (
                                      <Button size='mini' type='primary' shape='round' className='mt-8px' onClick={() => void handleRescan()}>
                                        {t('bots.im.rescan', { defaultValue: '重新扫码绑定' })}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </MessageList>
                )}
                {loadingOlder && (
                  <div className='flex justify-center py-8px'><Spin /></div>
                )}
              </div>

              {/* 输入条 */}
              <ChatInput
                disabled={sending}
                value={input}
                onChange={setInput}
                onSend={() => void handleSend()}
                onPolish={() => void handlePolish()}
                polishing={polishing}
                onSummarize={() => void handleSummarize()}
                summarizing={summarizing}
                botId={active?.botId}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}