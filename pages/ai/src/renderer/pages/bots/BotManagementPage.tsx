/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Empty,
  Input,
  InputNumber,
  Message,
  Modal,
  Select,
  Spin,
  Tag,
  Tooltip,
} from '@arco-design/web-react';
import { Refresh } from '@icon-park/react';
import classNames from 'classnames';
import { httpRequest } from '@/common/adapter/httpBridge';
import { HUB_PAGE_TITLE_CLASS } from '@/renderer/components/layout/HubPageShell';

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
  /** 凭证是否来自微信扫码（提交时映射为 bind_source） */
  fromScan?: boolean;
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
};

/** 新建时的表单初始值 */
const EMPTY_FORM: BotFormState = {
  botId: '',
  botToken: '',
  platform: 'wechat',
  nickname: '',
  gatewayPort: undefined,
  status: 'online',
};

/** 桌面端列表列模板：主体 | 平台 | 端口 | 最后活跃 | 状态 | 操作 */
const LIST_GRID_COLUMNS = 'minmax(0,1fr) 96px 88px 112px 88px 128px';

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
const BotAvatar: React.FC<{ binding: BotBinding }> = ({ binding }) => {
  const initial = (binding.nickname || binding.botId || '?').slice(0, 1).toUpperCase();
  if (binding.avatarUrl) {
    return (
      <img
        src={binding.avatarUrl}
        alt={binding.nickname ?? ''}
        className='h-34px w-34px shrink-0 rounded-10px object-cover'
      />
    );
  }
  return (
    <span className='flex h-34px w-34px shrink-0 items-center justify-center rounded-10px bg-fill-2 text-14px font-500 text-t-secondary'>
      {initial}
    </span>
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
}

/** 微信扫码状态机（对齐后端 /v2/ai/bot-binding/qrcode/status 的 status 字段） */
type ScanPhase = 'idle' | 'fetching' | 'showing_qr' | 'scanned' | 'confirmed' | 'expired' | 'error';

const EditorModal: React.FC<EditorModalProps> = ({ visible, editing, saving, onCancel, onSubmit }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<BotFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<'botId' | 'nickname', string>>>({});

  /* 新建态：平台选择与扫码面板状态 */
  const [platform, setPlatform] = useState<string>('wechat');
  const [scanPhase, setScanPhase] = useState<ScanPhase>('idle');
  const [scanKey, setScanKey] = useState('');
  const [qrcodeUrl, setQrcodeUrl] = useState('');
  const [scanMsg, setScanMsg] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        });
      } else {
        setPlatform('wechat');
        setForm(EMPTY_FORM);
      }
      setScanPhase('idle');
      setScanKey('');
      setQrcodeUrl('');
      setScanMsg('');
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
        const res = await httpRequest<{ data?: { status?: string; botId?: string; botToken?: string } }>(
          'GET', `/v2/ai/bot-binding/qrcode/status?key=${encodeURIComponent(key)}`
        );
        const s = res?.data?.status ?? 'pending';
        if (s === 'confirmed') {
          stopPoll();
          // 扫码成功：凭证已由后端自动写入 DB，关闭弹窗并刷新列表
          Message.success(t('bots.scan.success', { defaultValue: '扫码成功，已自动绑定' }));
          onSubmit({ ...EMPTY_FORM, fromScan: true });
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
  }, [stopPoll, onSubmit, t]);

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
    try {
      const res = await httpRequest<{ data?: { key?: string; qrcodeUrl?: string } }>(
        'POST', `/v2/ai/bot-binding/qrcode?platform=${encodeURIComponent(platform)}`
      );
      const key = res?.data?.key ?? '';
      const url = res?.data?.qrcodeUrl ?? '';
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
                { label: PLATFORM_LABEL.wecom, value: 'wecom' },
              ]}
            />
            <div className='mt-4px text-12px text-t-tertiary'>
              {platform === 'wechat'
                ? t('bots.form.wechatHint', { defaultValue: '微信 iLink 支持扫码绑定' })
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
                <img
                  src={qrcodeUrl}
                  alt='QR'
                  className='rounded-10px bg-white p-8px'
                  style={{ maxWidth: 168, width: 168, height: 168, objectFit: 'contain' }}
                />
                <span className='text-13px text-t-secondary'>
                  {t('bots.scan.qrHint', { defaultValue: '打开微信扫一扫，确认登录' })}
                </span>
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

        {/* 绑定信息表单（编辑态 或 企微手动 或 扫码完成后补全昵称） */}
        {(editing || platform === 'wecom' || scanPhase === 'confirmed') && (
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

  const [bindings, setBindings] = useState<BotBinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [editorVisible, setEditorVisible] = useState(false);
  const [editing, setEditing] = useState<BotBinding | null>(null);
  const [saving, setSaving] = useState<Saving>(false);

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
        const payload: Record<string, unknown> = {
          botId: form.botId.trim(),
          platform: form.platform,
          nickname: form.nickname.trim(),
          gatewayPort: form.gatewayPort ?? null,
          status: form.status,
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
          <div className='min-w-0 flex-1'>
            <h1 className={HUB_PAGE_TITLE_CLASS}>
              {t('bots.page.title', { defaultValue: 'Bot 管理' })}
            </h1>
            <p className='m-0 mt-6px text-13px leading-18px text-t-tertiary'>
              {t('bots.page.description', {
                defaultValue: '管理微信 / 企业微信 Bot 的绑定、网关端口与运行状态。',
              })}
            </p>
          </div>
          <div className='flex shrink-0 items-center gap-8px'>
            <Tooltip content={t('bots.refresh', { defaultValue: '刷新' })}>
              <Button
                shape='circle'
                icon={<Refresh theme='outline' size='14' fill='currentColor' strokeWidth={4} />}
                onClick={() => void load()}
              />
            </Tooltip>
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
                    <Tag size='small' className='!m-0 !rounded-6px !border-0 !bg-fill-2 !text-t-secondary'>
                      {PLATFORM_LABEL[row.platform ?? ''] ?? row.platform ?? '—'}
                    </Tag>
                  </div>

                  {/* 端口 */}
                  <span className='text-13px leading-20px text-t-secondary' title={row.gatewayPort != null ? String(row.gatewayPort) : undefined}>
                    {row.gatewayPort != null && row.gatewayPort > 0 ? `:${row.gatewayPort}` : '—'}
                  </span>

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
      />
    </div>
  );
}
