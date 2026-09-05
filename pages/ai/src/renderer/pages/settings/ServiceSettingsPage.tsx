import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, InputNumber, Message, Switch } from '@arco-design/web-react';
import NomiScrollArea from '@/renderer/components/base/NomiScrollArea';
import SettingsPageWrapper from './components/SettingsPageWrapper';
import PreferenceRow from '@/renderer/components/settings/SettingsModal/contents/SystemModalContent/PreferenceRow';
import { httpRequest } from '@/common/adapter/httpBridge';
import {
  AiGlobalSettings,
  aiBool,
  aiNum,
  aiStr,
  loadAiGlobalSettings,
  saveAiGlobalSettings,
} from '@/common/config/aiGlobalSettings';

/** AI 网关端口启停状态（/v2/ai/gateway/status） */
interface GatewayStatus {
  running: boolean;
  port: number;
}

/**
 * 服务设置页 —— 聚合对外 AI 服务能力。
 *
 * <p>将后端 ChatClient 聚合能力以 OpenAI 兼容协议（Chat Completions / Completions /
 * Models）暴露给其它软件（OpenWebUI 等），并提供 AI 独立网关端口启停、协议服务开关。</p>
 */
const ServiceSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<AiGlobalSettings>({});
  const [gateway, setGateway] = useState<GatewayStatus>({ running: false, port: -1 });
  const [gatewayPort, setGatewayPort] = useState(8081);
  const [gatewayBusy, setGatewayBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [g, gs] = await Promise.all([
        httpRequest<GatewayStatus>('GET', '/v2/ai/gateway/status'),
        loadAiGlobalSettings(),
      ]);
      if (g && typeof g === 'object') setGateway({ running: Boolean(g.running), port: Number(g.port) ?? -1 });
      setValues(gs);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const set = useCallback(<K extends keyof AiGlobalSettings>(key: K, value: AiGlobalSettings[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleGateway = useCallback(
    async (on: boolean) => {
      setGatewayBusy(true);
      try {
        await httpRequest('POST', on ? '/v2/ai/gateway/start' : '/v2/ai/gateway/stop', on ? { port: gatewayPort } : {});
        await load();
        Message.success(on ? t('settings.serviceGatewayStarted', { defaultValue: 'AI 网关已启动' }) : t('settings.serviceGatewayStopped', { defaultValue: 'AI 网关已停止' }));
      } catch {
        Message.error(t('settings.serviceGatewayFailed', { defaultValue: '操作失败' }));
      } finally {
        setGatewayBusy(false);
      }
    },
    [gatewayPort, load, t],
  );

  const handleSave = useCallback(async () => {
    try {
      await saveAiGlobalSettings(values);
      Message.success(t('common.saveSuccess', { defaultValue: '已保存' }));
    } catch {
      Message.error(t('common.saveFailed', { defaultValue: '保存失败' }));
    }
  }, [t, values]);

  const protocolEnabled = aiBool(values, 'protocolServerEnabled', false);
  const protocolPort = aiNum(values, 'protocolServerPort', 8090);

  const endpoints = useMemo(
    () => [
      { label: 'Chat Completions', path: '/v2/v1/chat/completions' },
      { label: 'Completions', path: '/v2/v1/completions' },
      { label: 'Models', path: '/v2/v1/models' },
      { label: 'Claude Messages', path: '/v2/v1/messages' },
      { label: 'Gemini', path: '/v2/v1beta/models' },
    ],
    [],
  );

  if (loading) {
    return (
      <SettingsPageWrapper>
        <div className='py-20px text-center text-14px text-t-secondary'>
          {t('settings.globalSettingsLoading', { defaultValue: '加载中…' })}
        </div>
      </SettingsPageWrapper>
    );
  }

  return (
    <SettingsPageWrapper>
      <div className='flex flex-col h-full w-full'>
        <NomiScrollArea className='flex-1 min-h-0 pb-16px' disableOverflow>
          <div className='px-[12px] md:px-[32px] py-16px bg-2 rd-16px space-y-12px'>
            <div className='text-14px font-600 text-t-primary'>
              {t('settings.serviceOpenaiCompatible', { defaultValue: 'OpenAI 兼容服务' })}
            </div>
            <div className='text-13px text-t-secondary leading-20px'>
              {t('settings.serviceOpenaiCompatibleDesc', {
                defaultValue: '将后端聚合的 ChatClient 以 OpenAI 标准协议暴露，可供 OpenWebUI 等第三方软件接入。端点鉴权使用 AppKey（Bearer Token）。',
              })}
            </div>
            <div className='w-full flex flex-col divide-y divide-x-0 divide-solid divide-[var(--color-border-2)]'>
              {endpoints.map((ep) => (
                <PreferenceRow key={ep.path} label={ep.label}>
                  <code className='text-13px text-t-primary font-mono'>{ep.path}</code>
                </PreferenceRow>
              ))}
            </div>
          </div>

          <div className='px-[12px] md:px-[32px] py-16px bg-2 rd-16px space-y-12px'>
            <div className='text-14px font-600 text-t-primary'>
              {t('settings.serviceProtocolServer', { defaultValue: '聚合协议服务' })}
            </div>
            <div className='w-full flex flex-col divide-y divide-x-0 divide-solid divide-[var(--color-border-2)]'>
              <PreferenceRow label={t('settings.serviceProtocolEnabled', { defaultValue: '启用聚合协议服务' })}>
                <Switch
                  checked={protocolEnabled}
                  onChange={(v) => set('protocolServerEnabled', v)}
                />
              </PreferenceRow>
              <PreferenceRow label={t('settings.serviceProtocolPort', { defaultValue: '协议服务端口' })}>
                <InputNumber
                  className='w-160px'
                  min={1024}
                  max={65535}
                  value={protocolPort}
                  onChange={(v) => set('protocolServerPort', v ?? 8090)}
                />
              </PreferenceRow>
            </div>
          </div>

          <div className='px-[12px] md:px-[32px] py-16px bg-2 rd-16px space-y-12px'>
            <div className='text-14px font-600 text-t-primary'>
              {t('settings.serviceAiGateway', { defaultValue: 'AI 独立网关端口' })}
            </div>
            <div className='text-13px text-t-secondary leading-20px'>
              {t('settings.serviceAiGatewayDesc', {
                defaultValue: '在运行中的 Servlet 容器上动态添加独立 Connector，使 /v2/** 端点同时监听主端口与独立端口，供外部软件直连。',
              })}
            </div>
            <div className='w-full flex flex-col divide-y divide-x-0 divide-solid divide-[var(--color-border-2)]'>
              <PreferenceRow
                label={t('settings.serviceGatewayRunning', { defaultValue: '运行状态' })}
              >
                <div className='flex items-center gap-8px'>
                  <Switch checked={gateway.running} loading={gatewayBusy} onChange={toggleGateway} />
                  <span className='text-13px font-mono text-t-secondary'>
                    {gateway.running ? `:${gateway.port}` : t('settings.serviceGatewayStopped', { defaultValue: '已停止' })}
                  </span>
                </div>
              </PreferenceRow>
              {!gateway.running && (
                <PreferenceRow label={t('settings.serviceGatewayPort', { defaultValue: '网关端口' })}>
                  <InputNumber
                    className='w-160px'
                    min={1024}
                    max={65535}
                    value={gatewayPort}
                    onChange={(v) => setGatewayPort(v ?? 8081)}
                  />
                </PreferenceRow>
              )}
            </div>
          </div>
        </NomiScrollArea>
        <div className='flex items-center justify-end px-[12px] md:px-[32px] py-16px bg-2 rd-16px'>
          <Button type='primary' onClick={handleSave} className='min-w-120px rounded-8px'>
            {t('common.save', { defaultValue: '保存' })}
          </Button>
        </div>
      </div>
    </SettingsPageWrapper>
  );
};

export default ServiceSettingsPage;