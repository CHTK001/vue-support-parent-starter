/**
 * UsageConfigPage — 系统设置 · 用量配置
 *
 * 分组 global（/v2/usage/config）：
 * - enable_usage_analysis      用量开关
 * - usage_report_interval      定时同步时间（秒）
 * - usage_sync_providers       Provider SPI 配置开关（逗号分隔白名单，前端用开关列表编辑）
 * - usage_timewheel_enabled    后台时间轮
 *
 * 手动操作：
 * - 立即同步（/v2/usage/trigger）：同步外部数据 + 当天聚合
 * - 全量同步（/v2/usage/aggregate-all）：全量历史数据聚合
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form, InputNumber, Message, Spin, Switch } from '@arco-design/web-react';
import { DataAll, Refresh, Save, Sync, Time, Timer } from '@icon-park/react';
import {
  getGroupConfig,
  modelMetricsApi,
  SettingField,
  updateGroupConfig,
  usageApi,
  UsageParserInfo,
} from '@/renderer/services/api/aiConsoleApi';
import '@/renderer/styles/ai-page.css';

const FIELD_LABELS: Record<string, string> = {
  enable_usage_analysis: '用量开关',
  usage_report_interval: '定时同步时间（秒）',
  usage_sync_providers: 'Provider SPI 配置开关',
  usage_timewheel_enabled: '后台时间轮',
};

export default function UsageConfigPage() {
  const { t } = useTranslation('settings');
  const [form] = Form.useForm();
  const [fields, setFields] = useState<SettingField[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsers, setParsers] = useState<UsageParserInfo[]>([]);
  const [parsersLoading, setParsersLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [fullSyncing, setFullSyncing] = useState(false);

  // 模型指标采集
  const [metricsEnabled, setMetricsEnabled] = useState(false);
  const [metricsInterval, setMetricsInterval] = useState(300);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsSaving, setMetricsSaving] = useState(false);
  const [syncPricingLoading, setSyncPricingLoading] = useState(false);
  const metricsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setParsersLoading(true);
    try {
      const [f, p] = await Promise.all([
        getGroupConfig('global'),
        usageApi.parsers().catch(() => [] as UsageParserInfo[]),
      ]);
      setFields(f);
      setParsers(p);
      const values: Record<string, unknown> = {};
      f.forEach((item) => {
        if (item.field === 'usage_sync_providers') {
          // 解析白名单为 Set，用于开关初始状态
          const whitelist = (item.value ?? '').split(/[,，\s]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
          values[item.field] = whitelist;
        } else {
          values[item.field] = item.valueType === 'BOOLEAN' ? item.value === 'true' : item.value;
        }
      });
      form.setFieldsValue(values);
    } catch {
      Message.error(t('console.usageConfig.loadFailed', '用量配置加载失败'));
    } finally {
      setLoading(false);
      setParsersLoading(false);
    }
  }, [form, t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    const values = (await form.validate()) as Record<string, unknown>;
    // 将开关列表转换为逗号分隔白名单
    const enabledProviders = (values.usage_sync_providers as string[]) ?? [];
    const payload: SettingField[] = fields.map((item) => ({
      field: item.field,
      valueType: item.valueType,
      description: item.description,
      sort: item.sort,
      value: item.field === 'usage_sync_providers' ? enabledProviders.join(',') : String(values[item.field] ?? ''),
    }));
    setSaving(true);
    try {
      await updateGroupConfig('global', payload);
      Message.success(t('console.usageConfig.saveOk', '用量配置已保存，调度器将按新参数生效'));
      load();
    } catch {
      Message.error(t('console.usageConfig.saveFailed', '保存失败'));
    } finally {
      setSaving(false);
    }
  };

  const handleTrigger = async () => {
    setSyncing(true);
    try {
      await usageApi.trigger();
      Message.success(t('console.usageConfig.triggerOk', '已触发同步，后台正在执行外部数据同步与当天聚合'));
    } catch {
      Message.error(t('console.usageConfig.triggerFailed', '触发同步失败'));
    } finally {
      setSyncing(false);
    }
  };

  const handleFullSync = async () => {
    setFullSyncing(true);
    try {
      await usageApi.aggregateAll();
      Message.success(t('console.usageConfig.fullSyncOk', '已触发全量同步，后台正在聚合全部历史数据（可能耗时较长）'));
    } catch {
      Message.error(t('console.usageConfig.fullSyncFailed', '全量同步失败'));
    } finally {
      setFullSyncing(false);
    }
  };

  const find = (field: string) => fields.find((f) => f.field === field);
  const enabledProviders = (Form.useWatch?.('usage_sync_providers', form) as string[]) ?? [];

  /* ===== 模型指标采集 ===== */
  const loadMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const cfg = await modelMetricsApi.getConfig();
      setMetricsEnabled(cfg.enabled);
      setMetricsInterval(cfg.intervalSec ?? 300);
    } catch {
      /* 后端不可达时保持默认 */
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const persistMetrics = useCallback(async (enabled: boolean, intervalSec: number) => {
    setMetricsSaving(true);
    try {
      await modelMetricsApi.saveConfig({ enabled, intervalSec });
    } catch {
      Message.error(t('console.usageConfig.metricsSaveFailed', '模型指标配置保存失败'));
    } finally {
      setMetricsSaving(false);
    }
  }, [t]);

  const handleMetricsToggle = (checked: boolean) => {
    setMetricsEnabled(checked);
    persistMetrics(checked, metricsInterval);
  };

  const handleMetricsIntervalChange = (val: number | undefined) => {
    const next = val ?? 300;
    setMetricsInterval(next);
    // 防抖 500ms 自动保存
    if (metricsTimerRef.current) clearTimeout(metricsTimerRef.current);
    metricsTimerRef.current = setTimeout(() => {
      persistMetrics(metricsEnabled, next);
    }, 500);
  };

  const handleSyncPricing = async () => {
    setSyncPricingLoading(true);
    try {
      await modelMetricsApi.syncPricing();
      Message.success(t('console.usageConfig.pricingSynced', '官方定价已同步到 sys_ai_pricing 表'));
    } catch {
      Message.error(t('console.usageConfig.pricingSyncFailed', '官方定价同步失败'));
    } finally {
      setSyncPricingLoading(false);
    }
  };

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <span className="ai-icon-tile">
          <Timer theme="outline" size={20} strokeWidth={4} fill="currentColor" />
        </span>
        <div>
          <h1 className="title">{t('console.usageConfig.title', '用量配置')}</h1>
          <p className="desc">{t('console.usageConfig.desc', '定时同步时间、Provider SPI 配置开关、用量开关与后台时间轮')}</p>
        </div>
      </div>

      <div className="ai-pipeline-block" style={{ marginTop: 18 }}>
        <div className="block-head">
          <span className="block-title">{t('console.usageConfig.blockTitle', '全局用量行为')}</span>
          <span className="block-sub">{t('console.usageConfig.blockHint', '由后台调度任务动态读取，保存后立即生效')}</span>
          <div style={{ flex: 1 }} />
          <Button size="small" icon={<Refresh size={13} />} onClick={load} />
          <Button size="small" type="primary" icon={<Save size={13} />} onClick={handleSave} loading={saving}>
            {t('console.capability.save', '保存')}
          </Button>
        </div>
        <div style={{ padding: '4px 16px 16px' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <Spin size={26} />
            </div>
          ) : (
            <Form form={form} layout="vertical" style={{ maxWidth: 720 }}>
              <Form.Item
                field="enable_usage_analysis"
                label={FIELD_LABELS.enable_usage_analysis}
                triggerPropName="checked"
                extra={find('enable_usage_analysis')?.description}
              >
                <Switch />
              </Form.Item>
              <Form.Item
                field="usage_report_interval"
                label={FIELD_LABELS.usage_report_interval}
                extra={find('usage_report_interval')?.description}
              >
                <InputNumber min={10} step={10} style={{ width: 200 }} />
              </Form.Item>
              <Form.Item
                field="usage_timewheel_enabled"
                label={FIELD_LABELS.usage_timewheel_enabled}
                triggerPropName="checked"
                extra={find('usage_timewheel_enabled')?.description}
              >
                <Switch />
              </Form.Item>

              {/* Provider SPI 开关列表 */}
              <Form.Item
                field="usage_sync_providers"
                label={FIELD_LABELS.usage_sync_providers}
                extra={find('usage_sync_providers')?.description}
                triggerPropName="checked"
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {parsersLoading ? (
                    <div style={{ padding: 12, textAlign: 'center' }}>
                      <Spin size={18} />
                    </div>
                  ) : parsers.length === 0 ? (
                    <span style={{ fontSize: 12, color: 'var(--color-text-3, #9a9aa5)' }}>
                      {t('console.usageConfig.noParsers', '未发现可用的用量数据源 Provider')}
                    </span>
                  ) : (
                    parsers.map((p) => {
                      const checked = enabledProviders.includes(p.name.toLowerCase());
                      return (
                        <div
                          key={p.name}
                          className="ai-provider-switch-row"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            border: '1px solid var(--color-border-2, #e5e6eb)',
                            borderRadius: 6,
                            background: checked ? 'var(--color-primary-light-1, #e8f3ff)' : 'transparent',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <DataAll size={14} style={{ color: 'var(--color-text-3, #9a9aa5)' }} />
                            <span style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</span>
                            <span style={{ fontSize: 11, color: 'var(--color-text-3, #9a9aa5)', fontFamily: 'monospace' }}>{p.type}</span>
                          </div>
                          <Switch
                            checked={checked}
                            onChange={(val) => {
                              const current = (form.getFieldValue('usage_sync_providers') as string[]) ?? [];
                              const next = val
                                ? [...new Set([...current, p.name.toLowerCase()])]
                                : current.filter((n) => n !== p.name.toLowerCase());
                              form.setFieldValue('usage_sync_providers', next);
                            }}
                          />
                        </div>
                      );
                    })
                  )}
                  {parsers.length > 0 && (
                    <span style={{ fontSize: 11, color: 'var(--color-text-3, #9a9aa5)' }}>
                      {t('console.usageConfig.providerHint', '已开启 {{count}} / {{total}} 个数据源，同步只同步开启的 Provider', {
                        count: enabledProviders.length,
                        total: parsers.length,
                      })}
                    </span>
                  )}
                </div>
              </Form.Item>
            </Form>
          )}
        </div>
      </div>

      {/* 手动同步操作 */}
      <div className="ai-pipeline-block" style={{ marginTop: 16 }}>
        <div className="block-head">
          <span className="block-title">{t('console.usageConfig.manualSync', '手动同步')}</span>
          <span className="block-sub">{t('console.usageConfig.manualSyncHint', '立即触发同步，无需等待定时任务')}</span>
        </div>
        <div style={{ padding: '12px 16px 16px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button
            type="primary"
            icon={<Sync size={14} />}
            onClick={handleTrigger}
            loading={syncing}
            disabled={syncing || fullSyncing}
          >
            {t('console.usageConfig.triggerSync', '立即同步（当天）')}
          </Button>
          <Button
            status="warning"
            icon={<DataAll size={14} />}
            onClick={handleFullSync}
            loading={fullSyncing}
            disabled={syncing || fullSyncing}
          >
            {t('console.usageConfig.fullSync', '全量同步（历史数据）')}
          </Button>
          <span style={{ fontSize: 12, color: 'var(--color-text-3, #9a9aa5)', alignSelf: 'center' }}>
            {t('console.usageConfig.syncNote', '定时任务只同步当天数据；全量同步会遍历全部历史用量，耗时较长')}
          </span>
        </div>
      </div>

      {/* 模型指标采集 */}
      <div className="ai-pipeline-block" style={{ marginTop: 16 }}>
        <div className="block-head">
          <span className="block-title">
            <Time size={14} style={{ marginRight: 6 }} />
            {t('console.usageConfig.metricsTitle', '模型指标采集')}
          </span>
          <span className="block-sub">{t('console.usageConfig.metricsHint', '定时同步官方定价到 sys_ai_pricing 表，供用量金额 fallback')}</span>
        </div>
        <div style={{ padding: '12px 16px 16px' }}>
          {metricsLoading ? (
            <div style={{ padding: 16, textAlign: 'center' }}>
              <Spin size={20} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 720 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{t('console.usageConfig.metricsEnable', '启用模型指标采集')}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-3, #9a9aa5)' }}>
                    {t('console.usageConfig.metricsEnableHint', '开启后按间隔定时同步官方定价')}
                  </div>
                </div>
                <Switch checked={metricsEnabled} loading={metricsSaving} onChange={handleMetricsToggle} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{t('console.usageConfig.metricsInterval', '同步间隔（秒）')}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-3, #9a9aa5)' }}>
                    {t('console.usageConfig.metricsIntervalHint', '最小 30 秒，修改后 500ms 自动保存')}
                  </div>
                </div>
                <InputNumber
                  min={30}
                  step={30}
                  value={metricsInterval}
                  onChange={(v) => handleMetricsIntervalChange(v as number | undefined)}
                  disabled={!metricsEnabled}
                  style={{ width: 180 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid var(--color-border-1, #f2f3f5)', paddingTop: 12 }}>
                <Button type="primary" icon={<Sync size={14} />} loading={syncPricingLoading} onClick={handleSyncPricing}>
                  {t('console.usageConfig.metricsSyncNow', '立即同步官方定价')}
                </Button>
                <span style={{ fontSize: 12, color: 'var(--color-text-3, #9a9aa5)' }}>
                  {t('console.usageConfig.metricsSyncNote', '手动触发一次定价同步，无需等待定时任务')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 模型指标采集（datasearch-starter 官方定价同步） */}
      <div className="ai-pipeline-block" style={{ marginTop: 16 }}>
        <div className="block-head">
          <span className="block-title">{t('console.usageConfig.metricsTitle', '模型指标采集')}</span>
          <span className="block-sub">
            {t('console.usageConfig.metricsSub', 'datasearch-starter 官方定价同步，每次同步清空旧数据；用量无金额时回退使用官方金额')}
          </span>
          <div style={{ flex: 1 }} />
          <Button size="small" icon={<Refresh size={13} />} onClick={load} loading={metricsLoading} />
          <Button size="small" type="primary" icon={<Save size={13} />} onClick={handleMetricsSave} loading={metricsSaving}>
            {t('console.capability.save', '保存')}
          </Button>
        </div>
        <div style={{ padding: '12px 16px 16px' }}>
          {metricsLoading ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <Spin size={20} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Switch
                  checked={metricsEnabled}
                  onChange={(val) => setMetricsEnabled(val)}
                />
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  {t('console.usageConfig.metricsEnabled', '启用模型指标采集与官方定价同步')}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, minWidth: 120 }}>
                  {t('console.usageConfig.metricsInterval', '定时同步时间（秒）')}
                </span>
                <InputNumber
                  min={30}
                  step={30}
                  value={metricsInterval}
                  onChange={(val) => setMetricsInterval(val ?? 300)}
                  style={{ width: 200 }}
                  disabled={!metricsEnabled}
                />
                <span style={{ fontSize: 11, color: 'var(--color-text-3, #9a9aa5)' }}>
                  {t('console.usageConfig.metricsIntervalHint', '最小 30 秒，默认 300 秒（5 分钟）')}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Button
                  type="primary"
                  icon={<Sync size={14} />}
                  onClick={handleSyncPricing}
                  loading={syncPricingLoading}
                  disabled={syncPricingLoading}
                >
                  {t('console.usageConfig.syncPricing', '立即同步官方定价')}
                </Button>
                <span style={{ fontSize: 12, color: 'var(--color-text-3, #9a9aa5)' }}>
                  {t('console.usageConfig.syncPricingHint', '从 datasearch-starter 加载全量官方定价，清空旧数据后全量插入 sys_ai_pricing 表')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 16, fontSize: 12, color: 'var(--color-text-3, #9a9aa5)', lineHeight: '18px' }}>
        <span>说明：</span>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>用量开关关闭后，定时同步与聚合任务会跳过执行（手动触发仍可用）。</li>
          <li>定时同步时间最小 10 秒，未配置时默认 300 秒（5 分钟）。</li>
          <li>Provider SPI 开关：同步只同步开启的数据源，全部关闭则跳过外部同步。</li>
          <li>开启后台时间轮后，用量同步改用时间轮调度；关闭则回退 Spring 动态 Trigger。</li>
          <li>定时任务只聚合当天数据（轻量、低压力）；历史数据回填请使用「全量同步」。</li>
          <li>模型指标采集：定时从 datasearch-starter 同步官方定价到 sys_ai_pricing 表，每次同步清空旧数据。</li>
          <li>用量统计无金额时，自动回退使用 sys_ai_pricing 表中的官方金额计算（@Cacheable 缓存查询结果）。</li>
        </ul>
      </div>
    </div>
  );
}
