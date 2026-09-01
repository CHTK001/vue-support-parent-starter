import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { httpRequest } from '@/common/adapter/httpBridge';
import { Button, DatePicker, Select, Spin, Table } from '@arco-design/web-react';
import SettingsPageWrapper from './components/SettingsPageWrapper';

interface UsageRow {
  id?: number;
  groupName?: string;
  provider?: string;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  totalCost?: number;
  callTime?: string;
}

interface UsageStats {
  totalCalls?: number;
  totalTokens?: number;
  totalCost?: number;
  totalPromptTokens?: number;
  totalCompletionTokens?: number;
}

/** Map backend snake_case keys to frontend camelCase */
const mapRow = (r: any): UsageRow => ({
  id: r.sysAiUsageId,
  groupName: r.sysAiUsageGroupName,
  provider: r.sysAiUsageProvider,
  model: r.sysAiUsageModel,
  promptTokens: r.sysAiUsagePromptTokens ?? 0,
  completionTokens: r.sysAiUsageCompletionTokens ?? 0,
  totalTokens: r.sysAiUsageTotalTokens ?? 0,
  totalCost: r.sysAiUsageTotalCost ?? 0,
  callTime: r.sysAiUsageCallTime,
});

const fmtNum = (v: unknown, digits: number = 0): string =>
  v == null ? '—' : Number(v).toLocaleString(undefined, { maximumFractionDigits: digits });

const fmtDate = (v: unknown): string =>
  v == null ? '—' : new Date(v as string).toLocaleString();

const LIST_API = '/v2/usage/list';
const STAT_API = '/v2/usage/statistics';

/** Default range: last 7 days */
const defaultStart = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  d.setHours(0, 0, 0, 0);
  return d;
};
const defaultEnd = () => new Date();

const UsageLibraryPage: React.FC = () => {
  const { t } = useTranslation();
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<UsageStats>({});
  const [statsLoading, setStatsLoading] = useState(false);
  const [provider, setProvider] = useState<string | undefined>(undefined);
  const [model, setModel] = useState<string | undefined>(undefined);
  const [providers, setProviders] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<any[]>([dayjs(defaultStart()), dayjs(defaultEnd())]);

  const buildParams = useCallback(() => {
    const p = new URLSearchParams();
    if (provider) p.set('provider', provider);
    if (model) p.set('model', model);
    if (dateRange?.[0]) {
      const s = dateRange[0].format('YYYY-MM-DD HH:mm:ss');
      p.set('startTime', s);
    }
    if (dateRange?.[1]) {
      const e = dateRange[1].format('YYYY-MM-DD HH:mm:ss');
      p.set('endTime', e);
    }
    return p;
  }, [provider, model, dateRange]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await httpRequest<{ data?: UsageRow[] }>('GET', `${LIST_API}?${buildParams()}`);
      const list = (res?.data ?? []).map(mapRow) as UsageRow[];
      setRows(list);
      setProviders((prev) => {
        const set = new Set(prev);
        for (const r of list) if (r.provider) set.add(r.provider);
        return [...set].sort();
      });
      setModels((prev) => {
        const set = new Set(prev);
        for (const r of list) if (r.model) set.add(r.model);
        return [...set].sort();
      });
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await httpRequest<UsageStats>('GET', `${STAT_API}?${buildParams()}`);
      setStats(res ?? {});
    } catch {
      setStats({});
    } finally {
      setStatsLoading(false);
    }
  }, [buildParams]);

  useEffect(() => { void loadList(); void loadStats(); }, [loadList, loadStats]);

  const columns = [
    { title: '调用时间', dataIndex: 'callTime', width: 160, render: (v: unknown) => fmtDate(v) },
    { title: '分组', dataIndex: 'groupName', width: 120 },
    { title: '提供商', dataIndex: 'provider', width: 120 },
    { title: '模型', dataIndex: 'model', width: 160 },
    { title: '输入 Token', dataIndex: 'promptTokens', width: 100, render: (v: unknown) => fmtNum(v, 0) },
    { title: '输出 Token', dataIndex: 'completionTokens', width: 100, render: (v: unknown) => fmtNum(v, 0) },
    { title: '总 Token', dataIndex: 'totalTokens', width: 100, render: (v: unknown) => fmtNum(v, 0) },
    { title: '费用（元）', dataIndex: 'totalCost', width: 100, render: (v: unknown) => fmtNum(v, 6) },
  ];

  return (
    <SettingsPageWrapper>
      <div className='flex flex-col h-full w-full'>
        {/* ─── 顶部卡片统计 ─── */}
        <div className='px-[32px] pt-16px grid grid-cols-2 md:grid-cols-4 gap-12px'>
          {[
            { label: t('usage.stats.totalCalls', { defaultValue: '总调用次数' }), value: stats.totalCalls },
            { label: t('usage.stats.totalTokens', { defaultValue: '总 Token 数' }), value: stats.totalTokens },
            { label: t('usage.stats.inputTokens', { defaultValue: '输入 Token' }), value: stats.totalPromptTokens },
            { label: t('usage.stats.outputTokens', { defaultValue: '输出 Token' }), value: stats.totalCompletionTokens },
            { label: t('usage.stats.totalCost', { defaultValue: '总费用（元）' }), value: stats.totalCost, digits: 6 },
          ].map((card) => (
            <div
              key={card.label}
              className='rd-16px bg-2 px-16px py-14px flex flex-col gap-4px'
            >
              <span className='text-12px text-t-secondary'>{card.label}</span>
              <span className='text-22px font-700 text-[var(--color-text-1)] font-mono'>
                {statsLoading ? (
                  <Spin />
                ) : (
                  fmtNum(card.value, card.digits ?? 0)
                )}
              </span>
            </div>
          ))}
        </div>

        {/* ─── 中部筛选栏 ─── */}
        <div className='flex items-center gap-8px px-[32px] py-12px flex-wrap'>
          <DatePicker.RangePicker
            allowClear
            showTime
            value={dateRange}
            onChange={(v: any) => setDateRange(v ?? [])}
            format='YYYY-MM-DD HH:mm:ss'
            style={{ width: 'clamp(180px,22vw,260px)' }}
          />
          <Select
            allowClear
            placeholder={t('usage.provider', { defaultValue: '提供商' })}
            value={provider}
            onChange={(v) => setProvider(v as string | undefined)}
            options={providers.map((p) => ({ label: p, value: p }))}
            style={{ width: 'clamp(100px,12vw,160px)' }}
          />
          <Select
            allowClear
            placeholder={t('usage.model', { defaultValue: '模型' })}
            value={model}
            onChange={(v) => setModel(v as string | undefined)}
            options={models.map((m) => ({ label: m, value: m }))}
            style={{ width: 'clamp(100px,14vw,200px)' }}
          />
          <Button size='small' onClick={() => void Promise.all([loadList(), loadStats()])}>
            {t('common.refresh', { defaultValue: '刷新' })}
          </Button>
          <Button
            size='small'
            type='text'
            onClick={() => {
              setDateRange([dayjs(defaultStart()), dayjs(defaultEnd())]);
              setProvider(undefined);
              setModel(undefined);
            }}
          >
            {t('usage.reset', { defaultValue: '重置' })}
          </Button>
          <div className='ml-auto text-12px text-t-secondary'>
            共{' '}
            <span className='font-mono text-[var(--color-text-1)]'>{rows.length}</span>
            {' 条'}
          </div>
        </div>

        {/* ─── 底部表格 ─── */}
        <div className='flex-1 min-h-0 px-[32px] pb-16px'>
          {loading ? (
            <div className='grid h-full place-items-center'>
              <Spin />
            </div>
          ) : rows.length === 0 ? (
            <div className='py-40px text-center text-13px text-t-secondary'>
              {t('usage.empty', { defaultValue: '暂无用量数据，请确认用量分析已启用' })}
            </div>
          ) : (
            <Table
              columns={columns}
              data={rows}
              rowKey='id'
              pagination={{ pageSize: 20, showTotal: true }}
              size='small'
              scroll={{ y: 'calc(100vh - 340px)' }}
            />
          )}
        </div>
      </div>
    </SettingsPageWrapper>
  );
};

export default UsageLibraryPage;
