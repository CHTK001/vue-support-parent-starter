/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Empty,
  Input,
  InputNumber,
  Message,
  Modal,
  Select,
  Spin,
  Switch,
  Tag,
  Tooltip,
} from '@arco-design/web-react';
import { Comment, EveryUser, Refresh } from '@icon-park/react';
import { QRCodeSVG } from 'qrcode.react';
import classNames from 'classnames';
import { http } from '@repo/core';
import { unwrapResult } from '@repo/utils';
import { HUB_PAGE_TITLE_CLASS } from '@/renderer/components/layout/HubPageShell';
import { resolveModelVendorLogo } from '@/renderer/utils/model/modelVendorLogo';
import { PlatformLogo } from '@/renderer/utils/platformLogo';

/* ── 类型（对齐后端 SysAiBotBinding 实体）── */

interface BotBinding {
  id: number;
  /** iLink 分配的 Bot 唯一标识 */
  botId?: string;
  /** 登录凭证 Token（仅在提交时使用，不在列表中展示明文） */
  botToken?: string;
  /** 平台类型：wechat / wecom */
  platform?: string;
  /** Bot 昵称 */
  nickname?: string;
  /** 头像地址 */
  avatarUrl?: string;
  /** 独立网关端口 */
  gatewayPort?: number | null;
  /** online / offline / expired */
  status?: string;
  /** qrcode_scan / manual_import */
  bindSource?: string;
  /** 绑定的 AI 模型（用于微信聊天时 AI 回复） */
  model?: string;
  /** 是否启用深度思考 */
  thinking?: boolean;
  /** 深度思考强度 */
  thinkingEffort?: string;
  /** 上下文思考（深度思考：Bot 级覆盖全局默认） */
  contextThinking?: boolean | null;
  /** 系统提示词 */
  systemPrompt?: string;
  /** 是否记录 AI 用量 */
  recordUsage?: boolean;
  /** 绑定的 Skill 列表 */
  skills?: string[];
  createTime?: string;
  lastActiveTime?: string;
}

/** 表单的可编辑字段集合 */
interface BotFormState {
  botId: string;
  botToken: string;
  platform: string;
  nickname: string;
  gatewayPort: number | undefined;
  status: string;
  /** 绑定的 AI 模型（用于微信聊天时 AI 回复） */
  model?: string;
  /** 是否启用深度思考（默认关闭） */
  thinking?: boolean;
  /** 深度思考强度 */
  thinkingEffort?: string;
  /** 上下文思考（null = 跟随全局默认） */
  contextThinking?: boolean | null;
  /** 系统提示词 */
  systemPrompt?: string;
  /** 是否记录 AI 用量（默认开启） */
  recordUsage?: boolean;
  /** 绑定的 Skill 列表（支持多个） */
  skills?: string[];
  /** 凭证是否来自微信扫码（提交时映射为 bind_source） */
  fromScan?: boolean;
  /** 飞书凭据配置（platform=feishu 时使用） */
  feishuAppId?: string;
  feishuAppSecret?: string;
}

type StatusFilter = 'all' | 'online' | 'offline' | 'expired';
type Saving = boolean;

/* ── 常量与展示映射 ── */

/** 状态 → 展示文案与圆点色（低饱和语义变量，禁止硬编码色值） */
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

/** 新建时的表单初始值 */
const EMPTY_FORM: BotFormState = {
  botId: '',
  botToken: '',
  platform: 'wechat',
  nickname: '',
  gatewayPort: undefined,
  status: 'online',
  thinking: false,
  thinkingEffort: '',
  systemPrompt: '',
  recordUsage: true,
  skills: [],
  feishuAppId: '',
  feishuAppSecret: '',
};

/** 桌面端列表列模板：主体 | 平台 | 端口 | 模型 | 最后活跃 | 状态 | 操作 */
const LIST_GRID_COLUMNS = 'minmax(0,1fr) 96px 88px minmax(0,120px) 112px 88px 128px';

/* ── 工具函数 ── */

/** LocalDateTime 字符串 → 相对时间；非法值原样返回，空值返回占位符 */
function formatRelativeTime(v?: string | null): string {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  const diff = Date.now() - d.getTime();
  if (diff < 0) return '刚刚';
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)} 天前`;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 兼容两种信封：httpBridge 解包一层 data 后可能是数组本身，也可能还剩一层 */
function extractList(res: unknown): BotBinding[] {
  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object' && Array.isArray((res as { data?: unknown }).data)) {
    return (res as { data: BotBinding[] }).data;
  }
  return [];
}

/* ── 子组件 ── */

/** 状态徽章：圆点 + 文案，未知状态兜底为灰色「未知」 */
const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  const meta = STATUS_META[status ?? ''] ?? { label: '未知', dot: 'bg-[var(--color-text-4)]' };
  return (
    <span className='inline-flex items-center gap-6px text-13px leading-20px text-t-secondary'>
      <span className={classNames('h-6px w-6px shrink-0 rounded-full', meta.dot)} />
      <span>{meta.label}</span>
    </span>
  );
};

/** 头像：优先 avatarUrl，缺失时退化为昵称首字符的圆形占位 */
const BotAvatar: React.FC<{ binding: BotBinding; size?: number }> = ({ binding, size = 34 }) => {
  const initial = (binding.nickname || binding.botId || '?').slice(0, 1).toUpperCase();
  if (binding.avatarUrl) {
    return (
      <img
        src={binding.avatarUrl}
        alt={binding.nickname ?? ''}
        className='shrink-0 rounded-10px object-cover'
        style={{ height: size, width: size }}
      />
    );
  }
  return (
    <span
      className='flex shrink-0 items-center justify-center rounded-10px bg-fill-2 text-t-secondary font-500'
      style={{ height: size, width: size, fontSize: size * 0.41 }}
    >
      {initial}
    </span>
  );
};

/** 模型厂商 Logo（内联小图标，显示在模型名左侧） */
const ModelVendorLogo: React.FC<{ model?: string | null }> = ({ model }) => {
  const logoUrl = resolveModelVendorLogo(model ?? '', undefined);
  if (!logoUrl) return null;
  return (
    <img
      src={logoUrl}
      alt={model ?? ''}
      title={model ?? ''}
      className='mr-6px inline-block h-16px w-16px shrink-0 rounded-4px object-contain'
    />
  );
};

/* ── 编辑对话框 ── */

interface EditorModalProps {
  visible: boolean;
  /** null 表示新建，否则为编辑该行 */
  editing: BotBinding | null;
  saving: Saving;
  onCancel: () => void;
  onSubmit: (form: BotFormState) => void;
  /** 扫码确认后关闭弹窗并刷新列表（后端已自动创建绑定） */
  onScanConfirmed: () => void;
}

/** 微信扫码状态机（对齐后端 /v2/ai/bot-binding/qrcode/status 的 status 字段） */
type ScanPhase = 'idle' | 'fetching' | 'showing_qr' | 'scanned' | 'confirmed' | 'expired' | 'error';

const EditorModal: React.FC<EditorModalProps> = ({ visible, editing, saving, onCancel, onSubmit, onScanConfirmed }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<BotFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<'botId' | 'nickname', string>>>({});

  /* 新建态：平台选择与扫码面板状态 */
  const [platform, setPlatform] = useState<string>('wechat');
  const [scanPhase, setScanPhase] = useState<ScanPhase>('idle');
  const [scanKey, setScanKey] = useState('');
  const [qrcodeUrl, setQrcodeUrl] = useState('');
  const [scanMsg, setScanMsg] = useState('');
  /** 二维码过期时间戳（毫秒），后端 /qrcode/status 返回，用于倒计时展示与到期自动刷新 */
  const [scanExpireAt, setScanExpireAt] = useState<number | null>(null);
  /** 二维码剩余有效期（秒），每秒刷新 */
  const [scanRemaining, setScanRemaining] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* 可选 AI 模型列表（供微信 Bot 设置聊天模型） */
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  /* 可选 Skill 列表（全局可用） */
  const [skillOptions, setSkillOptions] = useState<string[]>([]);
  /** 全局「深度思考」默认值（来自 /global-config，仅控制是否显示 per-bot 开关） */
  const [globalContextThinking, setGlobalContextThinking] = useState(false);

  // 加载可用 AI 模型列表
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await http().get('/v2/ai/bot-binding/models').then(r => unwrapResult<string[]>(r));
        const list = Array.isArray(res) ? res : undefined;
        if (!cancelled && Array.isArray(list)) setModelOptions(list);
      } catch {
        // 忽略：模型列表加载失败不影响绑定
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 加载全局配置（深度思考默认值）
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await http().get('/v2/ai/bot-binding/global-config').then(r => unwrapResult<{ contextThinking?: boolean }>(r));
        if (!cancelled && typeof res?.contextThinking === 'boolean') {
          setGlobalContextThinking(res.contextThinking);
        }
      } catch { /* 忽略 */ }
    })();
    return () => { cancelled = true; };
  }, [visible]);

  // 加载可用 Skill 列表
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await httpRequest<{ data?: string[] }>('GET', '/v2/ai/skills/catalog');
        const list = Array.isArray(res) ? res : res?.data;
        if (!cancelled && Array.isArray(list)) setSkillOptions(list);
      } catch {
        // 忽略：skill 列表加载失败不影响绑定
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /** 停止轮询 */
  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  // 打开时重置状态；关闭时停轮询
  useEffect(() => {
    if (visible) {
      setErrors({});
      if (editing) {
        setPlatform(editing.platform || 'wechat');
        setForm({
          botId: editing.botId ?? '',
          botToken: '',
          platform: editing.platform || 'wechat',
          nickname: editing.nickname ?? '',
          gatewayPort: editing.gatewayPort ?? undefined,
          status: editing.status || 'online',
          model: editing.model ?? '',
          thinking: editing.thinking ?? false,
          thinkingEffort: editing.thinkingEffort ?? '',
          contextThinking: editing.contextThinking ?? null,
          systemPrompt: editing.systemPrompt ?? '',
          recordUsage: editing.recordUsage ?? true,
          skills: editing.skills ?? [],
        });
      } else {
        setPlatform('wechat');
        setForm(EMPTY_FORM);
      }
      setScanPhase('idle');
      setScanKey('');
      setQrcodeUrl('');
      setScanMsg('');
      setScanExpireAt(null);
      setScanRemaining(null);
      stopPoll();
    } else {
      stopPoll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editing]);

  /** 启动轮询：每 3s 查询一次二维码状态 */
  const startPoll = useCallback((key: string) => {
    setScanKey(key);
    stopPoll();
    pollRef.current = setInterval(async () => {
      try {
        const res = await httpRequest<{ status?: string; qrcodeUrl?: string; botId?: string; botToken?: string; expireAt?: number }>(
          'GET', `/v2/ai/bot-binding/qrcode/status?key=${encodeURIComponent(key)}`
        );
        const s = res?.status ?? 'pending';
        // 后端二维码就绪（ready）时返回 qrcodeUrl，赋给 state 供 img 展示
        if (res?.qrcodeUrl) setQrcodeUrl(res.qrcodeUrl);
        // 记录过期时间戳，供倒计时展示与到期自动刷新
        if (typeof res?.expireAt === 'number') setScanExpireAt(res.expireAt);
        if (s === 'confirmed') {
          stopPoll();
          Message.success(t('bots.scan.success', { defaultValue: '扫码成功，已自动绑定' }));
          onScanConfirmed();
        } else if (s === 'scanned') {
          setScanPhase('scanned');
        } else if (s === 'expired' || s === 'error') {
          stopPoll();
          setScanPhase(s);
        } else if (s === 'ready') {
          // 二维码就绪，展示二维码等待扫描
          setScanPhase('showing_qr');
        } else {
          setScanPhase('showing_qr');
        }
      } catch {
        stopPoll();
        setScanPhase('error');
        setScanMsg(t('bots.scan.pollFailed', { defaultValue: '状态查询失败，请重试' }));
      }
    }, 3000);
  }, [stopPoll, onScanConfirmed, t]);

  const patch = (p: Partial<BotFormState>) => setForm((prev) => ({ ...prev, ...p }));

  const handleSubmit = () => {
    const next: typeof errors = {};
    if (!form.nickname.trim()) next.nickname = t('bots.form.required', { defaultValue: '请输入昵称' });
    if (!form.botId.trim()) next.botId = t('bots.form.required', { defaultValue: '请输入 Bot ID' });
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit(form);
  };

  const handleStartScan = useCallback(async () => {
    stopPoll();
    setScanPhase('fetching');
    setQrcodeUrl('');
    setScanMsg('');
    setScanExpireAt(null);
    setScanRemaining(null);
    try {
      const res = await httpRequest<{ key?: string; qrcodeUrl?: string }>(
        'POST', `/v2/ai/bot-binding/qrcode?platform=${encodeURIComponent(platform)}`
      );
      const key = res?.key ?? '';
      const url = res?.qrcodeUrl ?? '';
      if (!key) {
        setScanPhase('error');
        setScanMsg(t('bots.scan.noKey', { defaultValue: '未获取到会话 key，请重试' }));
        return;
      }
      if (url) setQrcodeUrl(url);
      setScanPhase('showing_qr');
      startPoll(key);
    } catch {
      setScanPhase('error');
      setScanMsg(
        t('bots.scan.unavailable', {
          defaultValue: 'iLink 服务暂不可用，请确认网络连通性或稍后重试',
        })
      );
    }
  }, [platform, startPoll, stopPoll, t]);

  // 二维码倒计时 + 到期自动刷新：每秒计算剩余秒数，归零后自动重新获取二维码
  const handleStartScanRef = useRef(handleStartScan);
  handleStartScanRef.current = handleStartScan;
  useEffect(() => {
    if (scanPhase !== 'showing_qr' || scanExpireAt == null) {
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((scanExpireAt - Date.now()) / 1000));
      setScanRemaining(remaining);
      if (remaining <= 0) {
        // 二维码已过期：停止轮询并自动重新获取
        stopPoll();
        setScanPhase('expired');
        void handleStartScanRef.current();
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanPhase, scanExpireAt, stopPoll]);
  const labelCls = 'mb-6px block text-13px leading-20px text-t-secondary';
  const inputCls =
    '[&_.arco-input-inner-wrapper]:!rounded-10px [&_.arco-select-view-single]:!rounded-10px [&_.arco-input-number]:!rounded-10px';

  return (
    <Modal
      title={
        editing
          ? t('bots.editor.editTitle', { defaultValue: '编辑 Bot' })
          : t('bots.editor.createTitle', { defaultValue: '新增 Bot 绑定' })
      }
      visible={visible}
      onCancel={onCancel}
      footer={null}
      unmountOnExit
      style={{ width: 480 }}
    >
      <div className='flex flex-col gap-16px pt-4px'>
        {/* 平台选择（仅新建态显示） */}
        {!editing && (
          <div>
            <label className={labelCls}>{t('bots.form.platform', { defaultValue: '平台' })}</label>
            <Select
              className={inputCls}
              value={platform}
              onChange={(v) => setPlatform(v)}
              options={[
                { label: PLATFORM_LABEL.wechat, value: 'wechat' },
                { label: PLATFORM_LABEL.feishu, value: 'feishu' },
                { label: PLATFORM_LABEL.wecom, value: 'wecom' },
              ]}
            />
            <div className='mt-4px text-12px text-t-tertiary'>
              {platform === 'wechat'
                ? t('bots.form.wechatHint', { defaultValue: '微信 iLink 支持扫码绑定' })
                : platform === 'feishu'
                  ? t('bots.form.feishuHint', { defaultValue: '飞书为凭据配置（appId / appSecret）' })
                  : t('bots.form.wecomHint', { defaultValue: '企业微信仅支持手动导入' })}
            </div>
          </div>
        )}

        {/* 微信扫码面板（仅 wechat 平台的新建态展示） */}
        {!editing && platform === 'wechat' && (
          <div className='flex min-h-260px flex-col items-center justify-center gap-12px rounded-12px border border-solid border-[var(--color-border-2)] bg-fill-1 px-16px py-20px'>
            {(scanPhase === 'idle' || scanPhase === 'fetching') && (
              <>
                {scanPhase === 'fetching' && <Spin />}
                <span className='text-13px text-t-secondary'>
                  {scanPhase === 'fetching'
                    ? t('bots.scan.fetching', { defaultValue: '正在获取二维码…' })
                    : t('bots.scan.hint', { defaultValue: '通过微信扫码授权绑定 Bot 凭证' })}
                </span>
                <Button
                  type='primary'
                  shape='round'
                  size='small'
                  loading={scanPhase === 'fetching'}
                  onClick={() => void handleStartScan()}
                >
                  {t('bots.scan.fetchQr', { defaultValue: '获取二维码' })}
                </Button>
              </>
            )}
            {scanPhase === 'showing_qr' && qrcodeUrl ? (
              <>
                {/* qrcodeUrl 是微信登录页 URL（iLink 返回），作为二维码内容由 QRCodeSVG 渲染，
                    用户微信扫码即打开该 URL 完成登录；不能用 <img> 直接加载（那是 HTML 页面） */}
                <div className='rounded-10px bg-white p-8px'>
                  <QRCodeSVG value={qrcodeUrl} size={168} marginSize={1} />
                </div>
                <span className='text-13px text-t-secondary'>
                  {t('bots.scan.qrHint', { defaultValue: '打开微信扫一扫，确认登录' })}
                </span>
                {scanRemaining != null && (
                  <span
                    className={`text-12px ${scanRemaining <= 30 ? 'text-danger' : 'text-t-tertiary'}`}
                    data-testid='qr-expiry-countdown'
                  >
                    {t('bots.scan.expiresIn', {
                      seconds: scanRemaining,
                      defaultValue: '二维码 {{seconds}} 秒后过期，到期自动刷新',
                    })}
                  </span>
                )}
                <Button size='mini' type='text' onClick={() => void handleStartScan()}>
                  {t('bots.scan.refetch', { defaultValue: '重新获取' })}
                </Button>
              </>
            ) : null}
            {scanPhase === 'scanned' && (
              <>
                <span className='text-14px text-success font-500'>
                  {t('bots.scan.scannedHint', { defaultValue: '已扫描，请在手机上确认登录' })}
                </span>
                <Spin />
              </>
            )}
            {scanPhase === 'error' && (
              <>
                <div className='w-full rounded-8px bg-fill-2 px-12px py-10px text-center text-12px leading-18px text-t-secondary'>
                  {scanMsg}
                </div>
                <Button size='mini' onClick={() => void handleStartScan()}>
                  {t('bots.scan.retry', { defaultValue: '重试' })}
                </Button>
              </>
            )}
            {scanPhase === 'expired' && (
              <>
                <div className='w-full rounded-8px bg-fill-2 px-12px py-10px text-center text-12px leading-18px text-t-secondary'>
                  {t('bots.scan.expired', { defaultValue: '二维码已过期' })}
                </div>
                <Button size='mini' onClick={() => void handleStartScan()}>
                  {t('bots.scan.retry', { defaultValue: '重新获取' })}
                </Button>
              </>
            )}
          </div>
        )}

        {/* 绑定信息表单（编辑态 或 企微/飞书手动 或 扫码完成后补全昵称） */}
        {(editing || platform === 'wecom' || platform === 'feishu' || scanPhase === 'confirmed') && (
          <>
        {platform === 'feishu' ? (
          /* 飞书：凭据配置（appId / appSecret） */
          <>
        <div>
          <label className={labelCls}>App ID <span className='text-danger'>*</span></label>
          <Input
            className={inputCls}
            placeholder={t('bots.form.feishuAppIdPlaceholder', { defaultValue: '飞书开放平台应用 ID' })}
            value={form.feishuAppId ?? ''}
            allowClear
            onChange={(v) => patch({ feishuAppId: v.trim() })}
          />
        </div>

        <div>
          <label className={labelCls}>App Secret <span className='text-danger'>*</span></label>
          <Input.Password
            className={inputCls}
            placeholder={t('bots.form.feishuAppSecretPlaceholder', { defaultValue: '飞书开放平台应用密钥' })}
            value={form.feishuAppSecret ?? ''}
            onChange={(v) => patch({ feishuAppSecret: v.trim() })}
          />
        </div>
          </>
        ) : (
          <>
        <div>
          <label className={labelCls}>
            {t('bots.form.nickname', { defaultValue: '昵称' })} <span className='text-danger'>*</span>
          </label>
          <Input
            className={inputCls}
            placeholder={t('bots.form.nicknamePlaceholder', { defaultValue: '来自微信资料的 Bot 昵称' })}
            value={form.nickname}
            allowClear
            autoFocus={scanPhase === 'confirmed'}
            onChange={(v) => patch({ nickname: v })}
          />
          {errors.nickname && <div className='mt-4px text-12px text-danger'>{errors.nickname}</div>}
        </div>

        <div>
          <label className={labelCls}>
            Bot ID <span className='text-danger'>*</span>
          </label>
          <Input
            className={inputCls}
            placeholder={t('bots.form.botIdPlaceholder', { defaultValue: 'iLink 分配的唯一标识' })}
            value={form.botId}
            allowClear
            disabled={!!editing}
            onChange={(v) => patch({ botId: v.trim() })}
          />
          {editing && (
            <div className='mt-4px text-12px text-t-tertiary'>
              {t('bots.form.botIdLocked', { defaultValue: 'Bot ID 创建后不可修改' })}
            </div>
          )}
          {errors.botId && <div className='mt-4px text-12px text-danger'>{errors.botId}</div>}
        </div>

        <div className='grid grid-cols-2 gap-12px'>
          <div>
            <label className={labelCls}>{t('bots.form.gatewayPort', { defaultValue: '网关端口' })}</label>
            <InputNumber
              className={inputCls}
              placeholder={t('bots.form.portPlaceholder', { defaultValue: '可选' })}
              value={form.gatewayPort}
              min={1}
              max={65535}
              onChange={(v) => {
                const raw = String(v ?? '').trim();
                const n = Number(raw);
                patch({ gatewayPort: raw !== '' && Number.isFinite(n) ? n : undefined });
              }}
            />
          </div>
          <div>
            <label className={labelCls}>{t('bots.form.status', { defaultValue: '状态' })}</label>
            <Select
              className={inputCls}
              value={form.status}
              onChange={(v) => patch({ status: v })}
              options={[
                { label: STATUS_META.online.label, value: 'online' },
                { label: STATUS_META.offline.label, value: 'offline' },
                { label: STATUS_META.expired.label, value: 'expired' },
              ]}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Token</label>
          <Input.Password
            className={inputCls}
            placeholder={
              editing
                ? t('bots.form.tokenKeepPlaceholder', { defaultValue: '留空则沿用原值' })
                : t('bots.form.tokenPlaceholder', { defaultValue: '登录凭证' })
            }
            value={form.botToken}
            onChange={(v) => patch({ botToken: v })}
          />
        </div>

        {/* AI 模型（仅微信 Bot 使用，用于微信聊天 AI 回复） */}
        <div>
          <label className={labelCls}>
            {t('bots.form.model', { defaultValue: 'AI 模型' })}
            <span className='ml-4px text-12px text-t-tertiary'>
              {t('bots.form.modelHint', { defaultValue: '微信聊天时 AI 回复使用的模型' })}
            </span>
          </label>
          <Select
            className={inputCls}
            value={form.model ?? ''}
            allowClear
            onChange={(v) => patch({ model: v as string })}
            placeholder={t('bots.form.modelPlaceholder', { defaultValue: '选择模型（默认模型）' })}
            options={modelOptions.map((m) => ({ label: m, value: m }))}
          />
        </div>

        {/* 深度思考覆盖（仅全局开启时显示；Bot 级覆盖全局默认值） */}
        {globalContextThinking && (
          <div className='flex items-center justify-between rounded-10px bg-fill-2 px-12px py-10px'>
            <div className='flex flex-col gap-2px'>
              <span className='text-13px leading-20px text-t-primary'>
                {t('bots.form.contextThinking', { defaultValue: '深度思考' })}
              </span>
              <span className='text-12px leading-18px text-t-tertiary'>
                {t('bots.form.contextThinkingHint', { defaultValue: '关闭后该 Bot 不参与上下文拼接（全局默认已开启）' })}
              </span>
            </div>
            <Switch
              checked={form.contextThinking !== false}
              onChange={(v) => patch({ contextThinking: v })}
            />
          </div>
        )}

        {/* 系统提示词（仅微信 Bot 使用，作为 AI 回复的 system prompt） */}
        <div>
          <label className={labelCls}>
            {t('bots.form.systemPrompt', { defaultValue: '系统提示词' })}
            <span className='ml-4px text-12px text-t-tertiary'>
              {t('bots.form.systemPromptHint', { defaultValue: '设置 Bot 的性格与行为准则' })}
            </span>
          </label>
          <Input.TextArea
            className={inputCls}
            placeholder={t('bots.form.systemPromptPlaceholder', {
              defaultValue: '例如：你是一名热情友好的微信客服助手，回答简洁……',
            })}
            rows={3}
            maxLength={1000}
            value={form.systemPrompt ?? ''}
            onChange={(v) => patch({ systemPrompt: v })}
          />
        </div>

        {/* 记录 AI 用量开关（bot 专属，关闭后该 bot 的 AI 调用不计入 usage 统计） */}
        <div>
          <label className={labelCls}>
            {t('bots.form.recordUsage', { defaultValue: '记录用量' })}
            <span className='ml-4px text-12px text-t-tertiary'>
              {t('bots.form.recordUsageHint', { defaultValue: '关闭后该 Bot 的 AI 调用不计入用量统计，不影响全局设置' })}
            </span>
          </label>
          <Switch
            checked={form.recordUsage !== false}
            onChange={(v) => patch({ recordUsage: v })}
          />
        </div>

        {/* Skill 绑定（多选） */}
        <div>
          <label className={labelCls}>
            {t('bots.form.skills', { defaultValue: '绑定的 Skill' })}
            <span className='ml-4px text-12px text-t-tertiary'>
              {t('bots.form.skillsHint', { defaultValue: '可选，为空则使用全局默认 Skill' })}
            </span>
          </label>
          <Select
            className={inputCls}
            mode='multiple'
            value={form.skills ?? []}
            allowClear
            onChange={(v) => patch({ skills: v as string[] })}
            placeholder={t('bots.form.skillsPlaceholder', { defaultValue: '选择 Skill（可多选）' })}
            options={skillOptions.map((s) => ({ label: s, value: s }))}
            notFoundContent={skillOptions.length === 0 ? t('bots.form.skillsEmpty', { defaultValue: '暂无可用 Skill' }) : undefined}
          />
        </div>
          </>
        )}
      </>
      )}

        <div className='mt-4px flex items-center justify-end gap-8px'>
          <Button onClick={onCancel}>{t('common.cancel', { defaultValue: '取消' })}</Button>
          <Button type='primary' shape='round' loading={saving} onClick={handleSubmit}>
            {editing
              ? t('common.save', { defaultValue: '保存' })
              : t('bots.editor.create', { defaultValue: '创建' })}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

/* ── 页面主体 ── */

export default function BotManagementPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [bindings, setBindings] = useState<BotBinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [editorVisible, setEditorVisible] = useState(false);
  const [editing, setEditing] = useState<BotBinding | null>(null);
  const [saving, setSaving] = useState<Saving>(false);
  /** 是否为管理员（来自后端 /meta 判定，控制「全部用户」入口） */
  const [isManager, setIsManager] = useState(false);

  /* 管理员判定：后端统一判定，开发环境（vite dev）直接开放 */
  useEffect(() => {
    if (import.meta.env.DEV) {
      setIsManager(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await httpRequest<{ hasAdmin?: boolean }>('GET', '/v2/ai/bot-binding/meta');
        const has = res?.hasAdmin === true;
        if (!cancelled) setIsManager(has);
      } catch {
        if (!cancelled) setIsManager(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* 数据加载 */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await httpRequest<unknown>('GET', '/v2/ai/bot-binding/list');
      setBindings(extractList(res));
    } catch {
      Message.error(t('bots.loadFailed', { defaultValue: '加载失败' }));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  /* 搜索 + 状态筛选（纯前端派生） */
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bindings.filter((b) => {
      if (statusFilter !== 'all' && (b.status ?? 'offline') !== statusFilter) return false;
      if (!q) return true;
      return (
        (b.nickname ?? '').toLowerCase().includes(q) ||
        (b.botId ?? '').toLowerCase().includes(q) ||
        (b.platform ?? '').toLowerCase().includes(q)
      );
    });
  }, [bindings, searchQuery, statusFilter]);

  const stats = useMemo(
    () => ({
      total: bindings.length,
      online: bindings.filter((b) => b.status === 'online').length,
      rest: bindings.filter((b) => b.status !== 'online').length,
    }),
    [bindings]
  );

  /* 打开新增 / 编辑 */
  const openCreate = useCallback(() => {
    setEditing(null);
    setEditorVisible(true);
  }, []);

  const openEdit = useCallback((row: BotBinding) => {
    setEditing(row);
    setEditorVisible(true);
  }, []);

  /* 提交：新建带 bind_source，编辑不带 */
  const handleSubmit = useCallback(
    async (form: BotFormState) => {
      setSaving(true);
      try {
        // 飞书：凭据配置型，走独立 /feishu 接口
        if (!editing && form.platform === 'feishu') {
          const appId = (form.feishuAppId ?? '').trim();
          const appSecret = (form.feishuAppSecret ?? '').trim();
          if (!appId || !appSecret) {
            Message.error(t('bots.feishuRequired', { defaultValue: '请填写飞书 App ID 与 App Secret' }));
            return;
          }
          await httpRequest('POST',
            `/v2/ai/bot-binding/feishu?appId=${encodeURIComponent(appId)}&appSecret=${encodeURIComponent(appSecret)}`);
          Message.success(t('bots.feishuSuccess', { defaultValue: '飞书绑定成功' }));
          setEditorVisible(false);
          await load();
          return;
        }
        const payload: Record<string, unknown> = {
          botId: form.botId.trim(),
          platform: form.platform,
          nickname: form.nickname.trim(),
          gatewayPort: form.gatewayPort ?? null,
          status: form.status,
          model: form.model ?? '',
          thinking: form.thinking ?? false,
          thinkingEffort: form.thinkingEffort ?? '',
          contextThinking: form.contextThinking,
          systemPrompt: form.systemPrompt ?? '',
          recordUsage: form.recordUsage ?? true,
          skills: form.skills ?? [],
        };
        if (editing) {
          payload.id = editing.id;
          if (form.botToken.trim()) payload.botToken = form.botToken.trim();
          await httpRequest('PUT', '/v2/ai/bot-binding/update', payload);
        } else {
          if (form.fromScan) payload.bindSource = 'qrcode_scan';
          else payload.bindSource = 'manual_import';
          if (form.botToken.trim()) payload.botToken = form.botToken.trim();
          await httpRequest('POST', '/v2/ai/bot-binding/create', payload);
        }
        Message.success(
          editing
            ? t('bots.saveSuccess', { defaultValue: '已保存' })
            : t('bots.createSuccess', { defaultValue: '创建成功' })
        );
        setEditorVisible(false);
        await load();
      } catch {
        Message.error(t('bots.saveFailed', { defaultValue: '保存失败' }));
      } finally {
        setSaving(false);
      }
    },
    [editing, load, t]
  );

  /* 删除（二次确认） */
  const handleDelete = useCallback(
    (row: BotBinding) => {
      Modal.confirm({
        title: t('bots.deleteTitle', { defaultValue: '解除绑定' }),
        content: t('bots.deleteContent', {
          name: row.nickname || row.botId || '该 Bot',
          defaultValue: `确定解绑「${row.nickname || row.botId || '该 Bot'}」吗？此操作不可恢复。`,
        }),
        okText: t('bots.deleteOk', { defaultValue: '解绑' }),
        cancelText: t('common.cancel', { defaultValue: '取消' }),
        okButtonProps: { status: 'danger' },
        maskClosable: false,
        onOk: async () => {
          try {
            await httpRequest('DELETE', `/v2/ai/bot-binding/${row.id}`);
            Message.success(t('bots.deleteSuccess', { defaultValue: '已解绑' }));
            await load();
          } catch {
            Message.error(t('bots.deleteFailed', { defaultValue: '解绑失败' }));
          }
        },
      });
    },
    [load, t]
  );

  /* 筛选 chips */
  const filterItems: readonly { key: StatusFilter; label: string }[] = [
    { key: 'all', label: t('bots.filter.all', { defaultValue: '全部' }) },
    { key: 'online', label: STATUS_META.online.label },
    { key: 'offline', label: STATUS_META.offline.label },
    { key: 'expired', label: STATUS_META.expired.label },
  ];

  const statCards = [
    { label: t('bots.stats.total', { defaultValue: '已绑定' }), value: stats.total, valueCls: 'text-t-primary' },
    { label: STATUS_META.online.label, value: stats.online, valueCls: 'text-success' },
    {
      label: t('bots.stats.rest', { defaultValue: '离线 / 过期' }),
      value: stats.rest,
      valueCls: 'text-t-tertiary',
    },
  ];

  return (
    <div className='box-border w-full min-h-full overflow-y-auto px-12px py-24px md:px-40px md:py-32px'>
      <div className='mx-auto flex w-full max-w-860px box-border flex-col gap-16px'>
        {/* 头部：标题 + 操作 */}
        <div className='flex w-full items-center justify-between gap-12px max-[560px]:flex-wrap'>
          <div className='flex items-center gap-12px min-w-0 flex-1'>
            <div className='flex size-42px shrink-0 items-center justify-center rounded-12px bg-primary-1'>
              <svg className='h-24px w-24px' viewBox='0 0 24 24' fill='none'>
                <path d='M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 9h-4v-7h4v7z' fill='rgb(var(--el-color-primary))' />
              </svg>
            </div>
            <div className='min-w-0'>
              <h1 className={HUB_PAGE_TITLE_CLASS}>
                {t('bots.page.title', { defaultValue: 'Bot 配置' })}
              </h1>
              <p className='m-0 mt-6px text-13px leading-18px text-t-tertiary'>
                {t('bots.page.description', {
                  defaultValue: '管理微信 / 企业微信 Bot 的绑定、网关端口与运行状态。',
                })}
              </p>
            </div>
          </div>
          <div className='flex shrink-0 items-center gap-8px'>
            <Tooltip content={t('bots.refresh', { defaultValue: '刷新' })}>
              <Button
                shape='circle'
                icon={<Refresh theme='outline' size='14' fill='currentColor' strokeWidth={4} />}
                onClick={() => void load()}
              />
            </Tooltip>
            {isManager && (
              <Button shape='round' icon={<EveryUser theme='outline' size='14' fill='currentColor' strokeWidth={4} />} onClick={() => navigate('/bots/users')}>
                {t('bots.users.entry', { defaultValue: 'Bot 用户' })}
              </Button>
            )}
            {isManager && (
              <Button shape='round' icon={<Comment theme='outline' size='14' fill='currentColor' strokeWidth={4} />} onClick={() => navigate('/bots/im')}>
                {t('bots.im.entry', { defaultValue: 'Bot IM' })}
              </Button>
            )}
            <Button type='primary' shape='round' onClick={openCreate}>
              {t('bots.create', { defaultValue: '+ 新增绑定' })}
            </Button>
          </div>
        </div>

        {/* 统计卡 */}
        <div className='grid w-full grid-cols-3 gap-12px max-[560px]:gap-8px'>
          {statCards.map((s) => (
            <div
              key={s.label}
              className='rounded-12px border border-solid border-[var(--color-border-2)] bg-fill-1 px-16px py-14px'
            >
              <div className='mb-4px text-11px leading-16px text-t-tertiary'>{s.label}</div>
              <div className={classNames('text-24px font-600 leading-none', s.valueCls)}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* 工具栏：搜索 + 状态筛选 */}
        <div className='flex w-full flex-wrap items-center gap-x-12px gap-y-8px'>
          <Input.Search
            allowClear
            className='w-full max-w-280px [&_.arco-input-inner-wrapper]:!rounded-full [&_.arco-input-inner-wrapper]:!border [&_.arco-input-inner-wrapper]:!border-solid [&_.arco-input-inner-wrapper]:!border-[var(--color-border-2)]'
            placeholder={t('bots.searchPlaceholder', { defaultValue: '搜索昵称 / Bot ID / 平台' })}
            value={searchQuery}
            onChange={setSearchQuery}
          />
          <div className='flex items-center gap-4px'>
            {filterItems.map((item) => {
              const selected = statusFilter === item.key;
              return (
                <button
                  key={item.key}
                  type='button'
                  aria-pressed={selected}
                  className={classNames(
                    'appearance-none !border-0 !outline-none !shadow-none rounded-8px px-9px py-4px text-13px leading-18px transition-colors',
                    selected
                      ? 'bg-fill-2 font-medium text-t-primary'
                      : 'bg-transparent text-t-secondary hover:bg-fill-1 hover:text-t-primary'
                  )}
                  onClick={() => setStatusFilter(item.key)}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 列表 */}
        {loading ? (
          <div className='flex min-h-220px items-center justify-center rounded-16px border border-dashed border-[var(--color-border-2)] bg-fill-1'>
            <Spin />
          </div>
        ) : filtered.length === 0 ? (
          <div className='flex min-h-220px items-center justify-center [&_.arco-empty-image]:!text-64px'>
            <Empty
              description={
                bindings.length === 0
                  ? t('bots.emptyAll', { defaultValue: '还没有绑定任何 Bot' })
                  : t('bots.emptyFiltered', { defaultValue: '没有匹配的 Bot' })
              }
            />
          </div>
        ) : (
          <div className='w-full'>
            {/* 桌面表头 */}
            <div
              className='hidden items-center gap-16px border-b border-b-solid border-b-[var(--color-border-2)] px-16px py-10px text-12px font-medium leading-18px text-t-tertiary md:grid'
              style={{ gridTemplateColumns: LIST_GRID_COLUMNS }}
            >
              <span>{t('bots.list.bot', { defaultValue: 'Bot' })}</span>
              <span>{t('bots.form.platform', { defaultValue: '平台' })}</span>
              <span>{t('bots.list.gatewayPort', { defaultValue: '端口' })}</span>
              <span>{t('bots.list.model', { defaultValue: '模型' })}</span>
              <span>{t('bots.list.lastActive', { defaultValue: '最后活跃' })}</span>
              <span>{t('bots.list.status', { defaultValue: '状态' })}</span>
              <span className='justify-self-end'>{t('bots.list.actions', { defaultValue: '操作' })}</span>
            </div>

            <div className='block w-full divide-y divide-x-0 divide-solid divide-[var(--color-border-2)]'>
              {filtered.map((row) => (
                <div
                  key={row.id}
                  className='group flex flex-col gap-10px rounded-12px border border-solid border-[var(--color-border-2)] bg-fill-1 px-16px py-12px transition-colors duration-200 hover:border-[var(--color-border-3)] hover:shadow-sm md:grid md:min-h-52px md:items-center md:gap-16px md:rounded-0 md:border-0 md:bg-transparent md:px-16px md:py-8px md:hover:bg-fill-1 md:hover:shadow-none'
                  style={{ gridTemplateColumns: LIST_GRID_COLUMNS }}
                >
                  {/* 主体：头像 + 昵称 + Bot ID */}
                  <div className='flex min-w-0 items-center gap-10px'>
                    <BotAvatar binding={row} />
                    <div className='flex min-w-0 flex-col'>
                      <span className='truncate text-14px font-500 leading-20px text-t-primary' title={row.nickname}>
                        {row.nickname || '—'}
                      </span>
                      <span className='truncate text-12px leading-16px text-t-tertiary' title={row.botId}>
                        {row.botId || '—'}
                      </span>
                    </div>
                  </div>

                  {/* 平台 */}
                  <div className='md:justify-self-start'>
                    <PlatformLogo platform={row.platform} className='h-20px w-20px' />
                  </div>

                  {/* 端口 */}
                  <span className='text-13px leading-20px text-t-secondary' title={row.gatewayPort != null ? String(row.gatewayPort) : undefined}>
                    {row.gatewayPort != null && row.gatewayPort > 0 ? `:${row.gatewayPort}` : '—'}
                  </span>

                  {/* 模型（带厂商 Logo） */}
                  <div className='flex min-w-0 items-center text-13px leading-20px text-t-secondary' title={row.model}>
                    <ModelVendorLogo model={row.model} />
                    <span className='truncate'>{row.model || '—'}</span>
                  </div>

                  {/* 最后活跃 */}
                  <span
                    className='truncate text-13px leading-20px text-t-secondary'
                    title={row.lastActiveTime ?? undefined}
                  >
                    {formatRelativeTime(row.lastActiveTime)}
                  </span>

                  {/* 状态 */}
                  <StatusBadge status={row.status} />

                  {/* 操作 */}
                  <div className='flex items-center justify-start gap-4px md:justify-self-end'>
                    <Button
                      size='mini'
                      type='text'
                      onClick={() => openEdit(row)}
                    >
                      {t('common.edit', { defaultValue: '编辑' })}
                    </Button>
                    <Button size='mini' type='text' status='danger' onClick={() => handleDelete(row)}>
                      {t('bots.unbind', { defaultValue: '解绑' })}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 新增 / 编辑对话框 */}
      <EditorModal
        visible={editorVisible}
        editing={editing}
        saving={saving}
        onCancel={() => setEditorVisible(false)}
        onSubmit={(form) => void handleSubmit(form)}
        onScanConfirmed={() => { setEditorVisible(false); void load(); }}
      />
    </div>
  );
}
