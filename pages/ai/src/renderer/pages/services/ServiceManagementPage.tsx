/**
 * ServiceManagementPage — 服务管理
 *
 * 功能：聚合 ChatClient 服务状态 / 启动停止 / 端口配置 / usage 开关 / 协议（OpenAI/CC/Codex/Gemini）开关
 * 后端：/v2/services/status、/v2/services/{name}/start、/v2/services/{name}/stop
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  Empty,
  InputNumber,
  Message,
  Popconfirm,
  Spin,
  Switch,
  Tag,
  Tooltip,
} from '@arco-design/web-react';
import {
  Refresh,
  Server,
  Play,
  PauseOne,
  SettingOne,
  Copy,
} from '@icon-park/react';
import { serviceApi, ServiceStatus } from '@/renderer/services/api/aiConsoleApi';
import '@/renderer/styles/ai-page.css';

/** 内置服务定义（后端不可达时的降级数据） */
const DEFAULT_SERVICES: ServiceStatus[] = [
  {
    name: 'chat-client-aggregator',
    description: '聚合 ChatClient 服务（统一对话路由 / 模型调度 / 故障转移）',
    running: false,
    port: 8787,
    usageEnabled: true,
    protocols: { openai: true, cc: false, codex: false, gemini: false },
  },
  {
    name: 'openai-compatible',
    description: 'OpenAI 兼容协议服务（/v1/chat/completions、/v1/models）',
    running: false,
    port: 8788,
    usageEnabled: true,
    protocols: { openai: true },
  },
  {
    name: 'claude-code-protocol',
    description: 'Claude Code 协议服务（CC 兼容端点）',
    running: false,
    port: 8789,
    usageEnabled: false,
    protocols: { cc: true },
  },
  {
    name: 'codex-protocol',
    description: 'Codex 协议服务（OpenAI Codex 兼容端点）',
    running: false,
    port: 8790,
    usageEnabled: false,
    protocols: { codex: true },
  },
  {
    name: 'gemini-protocol',
    description: 'Gemini 协议服务（Google Gemini 兼容端点）',
    running: false,
    port: 8791,
    usageEnabled: false,
    protocols: { gemini: true },
  },
];

export default function ServiceManagementPage() {
  const { t } = useTranslation();
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const list = await serviceApi.list().catch(() => [] as ServiceStatus[]);
      // 合并后端返回与内置默认（后端可能只返回运行状态，不含配置）
      const merged = DEFAULT_SERVICES.map((def) => {
        const remote = list.find((s) => s.name === def.name);
        return remote ? { ...def, ...remote } : def;
      });
      setServices(merged);
    } catch {
      setServices(DEFAULT_SERVICES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleStart = async (name: string) => {
    setActionLoading(name);
    try {
      await serviceApi.start(name);
      Message.success(t('console.service.started', '服务已启动'));
      setServices((prev) => prev.map((s) => (s.name === name ? { ...s, running: true } : s)));
    } catch {
      Message.error(t('console.service.startFailed', '启动失败'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleStop = async (name: string) => {
    setActionLoading(name);
    try {
      await serviceApi.stop(name);
      Message.success(t('console.service.stopped', '服务已停止'));
      setServices((prev) => prev.map((s) => (s.name === name ? { ...s, running: false } : s)));
    } catch {
      Message.error(t('console.service.stopFailed', '停止失败'));
    } finally {
      setActionLoading(null);
    }
  };

  const handlePortChange = (name: string, port: number) => {
    setServices((prev) => prev.map((s) => (s.name === name ? { ...s, port } : s)));
  };

  const handleUsageToggle = (name: string, enabled: boolean) => {
    setServices((prev) => prev.map((s) => (s.name === name ? { ...s, usageEnabled: enabled } : s)));
    Message.success(enabled ? t('console.service.usageOn', '用量记录已开启') : t('console.service.usageOff', '用量记录已关闭'));
  };

  const handleProtocolToggle = (name: string, protocol: keyof NonNullable<ServiceStatus['protocols']>, enabled: boolean) => {
    setServices((prev) =>
      prev.map((s) =>
        s.name === name ? { ...s, protocols: { ...s.protocols, [protocol]: enabled } } : s,
      ),
    );
  };

  /** 协议端点 URL：openai 为 /v1，其余为 /v1/{protocol} */
  const protocolUrl = (port?: number, protocol?: string): string => {
    if (!port) return '';
    if (!protocol || protocol === 'openai') return `http://localhost:${port}/v1`;
    return `http://localhost:${port}/v1/${protocol}`;
  };

  const handleCopyUrl = async (url: string) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      Message.success(t('console.service.urlCopied', 'URL 已复制'));
    } catch {
      Message.error(t('console.service.copyFailed', '复制失败'));
    }
  };

  const formatUptime = (sec?: number) => {
    if (!sec || sec <= 0) return '—';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <div>
          <h2 className="ai-page-title">{t('console.service.title', '服务管理')}</h2>
          <p className="ai-page-subtitle">{t('console.service.subtitle', '聚合 ChatClient 服务启停、端口配置、用量记录与协议端点管理')}</p>
        </div>
        <div className="ai-page-actions">
          <Button icon={<Refresh {...iconProps} />} onClick={loadServices}>{t('console.common.refresh', '刷新')}</Button>
        </div>
      </div>

      <Spin loading={loading} style={{ display: 'block' }}>
        {services.length === 0 ? (
          <Empty description={t('console.service.empty', '暂无服务')} />
        ) : (
          <div className="ai-service-list">
            {services.map((svc) => (
              <Card key={svc.name} className="ai-service-card" hoverable>
                <div className="ai-service-card-header">
                  <div className="ai-service-card-title">
                    <Server {...iconProps} />
                    <span>{svc.name}</span>
                    {svc.running ? (
                      <Tag color="green" size="small">
                        <span className="ai-status-dot ai-status-dot-running" />
                        {t('console.service.running', '运行中')}
                      </Tag>
                    ) : (
                      <Tag color="gray" size="small">
                        <span className="ai-status-dot" />
                        {t('console.service.stopped', '已停止')}
                      </Tag>
                    )}
                  </div>
                  <div className="ai-service-card-actions">
                    {svc.running ? (
                      <Popconfirm title={t('console.service.confirmStop', '确定停止该服务？')} onOk={() => handleStop(svc.name)}>
                        <Button type="text" size="small" status="danger" icon={<PauseOne {...iconProps} />} loading={actionLoading === svc.name}>
                          {t('console.service.stop', '停止')}
                        </Button>
                      </Popconfirm>
                    ) : (
                      <Button type="text" size="small" status="success" icon={<Play {...iconProps} />} loading={actionLoading === svc.name} onClick={() => handleStart(svc.name)}>
                        {t('console.service.start', '启动')}
                      </Button>
                    )}
                  </div>
                </div>

                <p className="ai-service-desc">{svc.description}</p>

                <div className="ai-service-config">
                  <div className="ai-service-config-item">
                    <span className="ai-service-config-label">{t('console.service.port', '端口')}</span>
                    <InputNumber
                      min={1}
                      max={65535}
                      value={svc.port}
                      onChange={(v) => handlePortChange(svc.name, v as number)}
                      size="small"
                      style={{ width: 100 }}
                      disabled={svc.running}
                    />
                  </div>
                  <div className="ai-service-config-item">
                    <span className="ai-service-config-label">{t('console.service.usage', '用量记录')}</span>
                    <Switch checked={svc.usageEnabled} onChange={(v) => handleUsageToggle(svc.name, v)} size="small" />
                  </div>
                  <div className="ai-service-config-item">
                    <span className="ai-service-config-label">{t('console.service.pid', 'PID')}</span>
                    <span className="ai-service-config-value">{svc.pid ?? '—'}</span>
                  </div>
                  <div className="ai-service-config-item">
                    <span className="ai-service-config-label">{t('console.service.uptime', '运行时长')}</span>
                    <span className="ai-service-config-value">{formatUptime(svc.uptime)}</span>
                  </div>
                </div>

                <div className="ai-service-protocols">
                  <span className="ai-service-protocols-label"><SettingOne {...iconProps} /> {t('console.service.protocols', '协议端点')}</span>
                  <div className="ai-service-protocols-list">
                    {(['openai', 'cc', 'codex', 'gemini'] as const).map((proto) => (
                      <div key={proto} className="ai-service-protocol-item">
                        <span className="ai-service-protocol-name">{proto.toUpperCase()}</span>
                        <Switch
                          checked={svc.protocols?.[proto] ?? false}
                          onChange={(v) => handleProtocolToggle(svc.name, proto, v)}
                          size="small"
                          disabled={svc.running && proto === 'openai'}
                        />
                        {(svc.protocols?.[proto] ?? false) && (
                          <span
                            style={{
                              fontFamily: "'SF Mono','Consolas',monospace",
                              fontSize: 11,
                              color: 'var(--color-text-3, #9a9aa5)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              cursor: 'pointer',
                            }}
                            title={protocolUrl(svc.port, proto)}
                            onClick={() => handleCopyUrl(protocolUrl(svc.port, proto))}
                          >
                            {protocolUrl(svc.port, proto)}
                            <Copy size={12} />
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Spin>
    </div>
  );
}

const iconProps = { theme: 'outline' as const, size: 16, strokeWidth: 4, fill: 'currentColor' as const };
