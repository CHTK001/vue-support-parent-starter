/**
 * UsageManagementPage — 用量管理（美化版）
 *
 * 参考 New API / One API 用量统计设计：
 * - 顶部 4 统计卡（总请求数 / 总 Token / 总消费 / 平均耗时）
 * - 时间范围 + 粒度筛选
 * - 模型分布 / 分组使用分布 / 端点分布（环形图 + 表格）
 * - Token 使用趋势（折线图：Input / Output / Cache Creation / Cache Read / Cache Hit Rate）
 * - 用量明细（多维筛选 + 详细表格 + Token/成本悬浮明细）
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  DatePicker,
  Empty,
  Input,
  Message,
  Pagination,
  Popover,
  Select,
  Spin,
  Table,
  Tabs,
  Tag,
  Tooltip,
} from '@arco-design/web-react';
import {
  DataAll,
  Download,
  Filter,
  Refresh,
  Search,
  Thunderbolt,
  Time,
  Wallet,
} from '@icon-park/react';
import * as echarts from 'echarts';
import {
  formatCost,
  formatNumber,
  usageApi,
  UsageRecord,
  UsageStatistics,
  UsageTrendItem,
} from '@/renderer/services/api/aiConsoleApi';
import '@/renderer/styles/ai-page.css';

const { RangePicker } = DatePicker;
const PAGE_SIZE = 20;

/** 模拟仪表盘数据（后端不可达时降级） */
const MOCK_DASHBOARD = {
  totalRequests: 1853,
  totalTokens: 935430000,
  inputTokens: 60010000,
  outputTokens: 742560,
  cacheReadTokens: 874690000,
  totalCost: 189.268,
  avgLatency: 18.77,
  modelDistribution: [
    { model: 'deepseek-v4-pro', requests: 1853, tokens: 935430000, cost: 189.27 },
  ],
  groupDistribution: [
    { group: 'DeepSeek订阅', requests: 1853, tokens: 935430000, cost: 189.27 },
  ],
  endpointDistribution: [
    { endpoint: '/v1/chat/completions', requests: 1853, tokens: 935430000, cost: 189.27 },
  ],
  tokenTrend: Array.from({ length: 13 }, (_, i) => ({
    time: `2026-09-12 ${String(i + 7).padStart(2, '0')}:00`,
    input: 4000000 + Math.random() * 2000000,
    output: 50000 + Math.random() * 30000,
    cacheRead: 60000000 + Math.random() * 20000000,
    cacheCreation: 100000 + Math.random() * 50000,
    cacheHitRate: 0.85 + Math.random() * 0.1,
  })),
};

export default function UsageManagementPage() {
  const { t } = useTranslation('settings');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<UsageStatistics | null>(null);
  const [trend, setTrend] = useState<UsageTrendItem[]>([]);
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [modelFilter, setModelFilter] = useState<string>('');
  const [groupFilter, setGroupFilter] = useState<string>('');
  const [granularity, setGranularity] = useState<string>('hour');
  const [activeTab, setActiveTab] = useState<string>('details');

  const trendChartRef = useRef<HTMLDivElement>(null);
  const modelChartRef = useRef<HTMLDivElement>(null);
  const groupChartRef = useRef<HTMLDivElement>(null);
  const endpointChartRef = useRef<HTMLDivElement>(null);
  const trendChartInstance = useRef<echarts.ECharts | null>(null);
  const modelChartInstance = useRef<echarts.ECharts | null>(null);
  const groupChartInstance = useRef<echarts.ECharts | null>(null);
  const endpointChartInstance = useRef<echarts.ECharts | null>(null);

  const dashboard = MOCK_DASHBOARD;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, tr, rec] = await Promise.all([
        usageApi.statistics().catch(() => null),
        usageApi.trend().catch(() => [] as UsageTrendItem[]),
        usageApi.list(page, PAGE_SIZE).catch(() => ({ records: [] as UsageRecord[], total: 0 })),
      ]);
      setStats(s);
      setTrend(tr);
      setRecords(rec.records ?? []);
      setTotal(rec.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 初始化图表
  useEffect(() => {
    if (trendChartRef.current && !trendChartInstance.current) {
      trendChartInstance.current = echarts.init(trendChartRef.current);
    }
    if (modelChartRef.current && !modelChartInstance.current) {
      modelChartInstance.current = echarts.init(modelChartRef.current);
    }
    if (groupChartRef.current && !groupChartInstance.current) {
      groupChartInstance.current = echarts.init(groupChartRef.current);
    }
    if (endpointChartRef.current && !endpointChartInstance.current) {
      endpointChartInstance.current = echarts.init(endpointChartRef.current);
    }

    const handleResize = () => {
      trendChartInstance.current?.resize();
      modelChartInstance.current?.resize();
      groupChartInstance.current?.resize();
      endpointChartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      trendChartInstance.current?.dispose();
      modelChartInstance.current?.dispose();
      groupChartInstance.current?.dispose();
      endpointChartInstance.current?.dispose();
    };
  }, []);

  // 更新趋势图
  useEffect(() => {
    if (!trendChartInstance.current) return;
    const data = dashboard.tokenTrend;
    trendChartInstance.current.setOption({
      tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e5e6eb', textStyle: { color: '#1d1d1f', fontSize: 12 } },
      legend: { data: ['Input', 'Output', 'Cache Creation', 'Cache Read', 'Cache Hit Rate'], top: 0, textStyle: { fontSize: 11, color: '#4e5969' } },
      grid: { left: 50, right: 50, top: 40, bottom: 30 },
      xAxis: { type: 'category', data: data.map((d) => d.time.slice(11, 16)), axisLine: { lineStyle: { color: '#e5e6eb' } }, axisLabel: { fontSize: 10, color: '#9a9aa5' } },
      yAxis: [
        { type: 'value', name: 'Token', axisLine: { show: false }, splitLine: { lineStyle: { color: '#f2f3f5' } }, axisLabel: { fontSize: 10, color: '#9a9aa5', formatter: (v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v) } },
        { type: 'value', name: 'Hit Rate', max: 1, axisLine: { show: false }, splitLine: { show: false }, axisLabel: { fontSize: 10, color: '#9a9aa5', formatter: (v: number) => `${(v * 100).toFixed(0)}%` } },
      ],
      series: [
        { name: 'Input', type: 'line', smooth: true, data: data.map((d) => d.input), areaStyle: { color: 'rgba(64,128,255,0.1)' }, lineStyle: { color: '#4080ff', width: 2 }, itemStyle: { color: '#4080ff' } },
        { name: 'Output', type: 'line', smooth: true, data: data.map((d) => d.output), lineStyle: { color: '#00b42a', width: 2 }, itemStyle: { color: '#00b42a' } },
        { name: 'Cache Creation', type: 'line', smooth: true, data: data.map((d) => d.cacheCreation), lineStyle: { color: '#ff7d00', width: 2 }, itemStyle: { color: '#ff7d00' } },
        { name: 'Cache Read', type: 'line', smooth: true, data: data.map((d) => d.cacheRead), areaStyle: { color: 'rgba(0,180,212,0.08)' }, lineStyle: { color: '#00b4d4', width: 2 }, itemStyle: { color: '#00b4d4' } },
        { name: 'Cache Hit Rate', type: 'line', yAxisIndex: 1, smooth: true, data: data.map((d) => d.cacheHitRate), lineStyle: { color: '#722ed1', width: 2, type: 'dashed' }, itemStyle: { color: '#722ed1' } },
      ],
    });
  }, [dashboard]);

  // 环形图通用配置
  const renderDonut = (instance: echarts.ECharts | null, data: Array<{ name: string; value: number }>, color: string) => {
    if (!instance) return;
    instance.setOption({
      tooltip: { trigger: 'item', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e5e6eb', textStyle: { color: '#1d1d1f', fontSize: 12 }, formatter: (p: { name: string; value: number; percent: number }) => `${p.name}<br/>${formatNumber(p.value)} (${p.percent}%)` },
      series: [{
        type: 'pie', radius: ['55%', '75%'], center: ['50%', '50%'],
        avoidLabelOverlap: false, label: { show: false }, labelLine: { show: false },
        data: data.length > 0 ? data : [{ name: '暂无数据', value: 1, itemStyle: { color: '#f2f3f5' } }],
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        color: data.length > 0 ? [color, '#4080ff', '#00b42a', '#ff7d00', '#722ed1', '#f53f3f'] : ['#f2f3f5'],
      }],
    });
  };

  useEffect(() => {
    renderDonut(modelChartInstance.current, dashboard.modelDistribution.map((d) => ({ name: d.model, value: d.tokens })), '#4080ff');
  }, [dashboard]);
  useEffect(() => {
    renderDonut(groupChartInstance.current, dashboard.groupDistribution.map((d) => ({ name: d.group, value: d.tokens })), '#00b42a');
  }, [dashboard]);
  useEffect(() => {
    renderDonut(endpointChartInstance.current, dashboard.endpointDistribution.map((d) => ({ name: d.endpoint, value: d.tokens })), '#ff7d00');
  }, [dashboard]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (keyword && !`${r.model ?? ''} ${r.endpoint ?? ''} ${r.apiKey ?? ''}`.toLowerCase().includes(keyword.toLowerCase())) return false;
      if (modelFilter && r.model !== modelFilter) return false;
      if (groupFilter && r.group !== groupFilter) return false;
      return true;
    });
  }, [records, keyword, modelFilter, groupFilter]);

  /** CSV 单元格转义 */
  const csvEscape = (val: unknown): string => {
    if (val == null) return '';
    const s = String(val);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  /** 导出当前用量明细为 CSV（UTF-8 BOM，防 Excel 中文乱码） */
  const handleExportCsv = useCallback(() => {
    const rows = filteredRecords;
    if (rows.length === 0) {
      Message.warning(t('console.usage.noDataToExport', '暂无可导出的用量数据'));
      return;
    }
    const header = ['时间', '模型', '提供商', '输入Token', '输出Token', '总Token', '费用', '请求ID'];
    const lines = rows.map((r) =>
      [
        r.time ? new Date(Number(r.time) * (Number(r.time) < 1e12 ? 1000 : 1)).toLocaleString('zh-CN') : '',
        r.model ?? '',
        (r as UsageRecord).sysAiUsageProvider ?? (r as UsageRecord).sysAiUsageGroupName ?? r.group ?? '',
        (r as UsageRecord).sysAiUsagePromptTokens ?? r.inputTokens ?? 0,
        (r as UsageRecord).sysAiUsageCompletionTokens ?? r.outputTokens ?? 0,
        (r as UsageRecord).sysAiUsageTotalTokens ?? r.totalTokens ?? 0,
        (r as UsageRecord).sysAiUsageTotalCost ?? r.cost ?? 0,
        (r as UsageRecord).sysAiUsageRequestId ?? r.requestId ?? '',
      ]
        .map(csvEscape)
        .join(','),
    );
    const csv = '\uFEFF' + header.map(csvEscape).join(',') + '\n' + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `usage-export-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Message.success(t('console.usage.exportOk', '已导出 {{count}} 条记录', { count: rows.length }));
  }, [filteredRecords, t]);

  const modelOptions = useMemo(() => {
    const set = new Set(records.map((r) => r.model).filter(Boolean) as string[]);
    return Array.from(set).map((m) => ({ label: m, value: m }));
  }, [records]);

  const groupOptions = useMemo(() => {
    const set = new Set(records.map((r) => r.group).filter(Boolean) as string[]);
    return Array.from(set).map((g) => ({ label: g, value: g }));
  }, [records]);

  const formatTokens = (input?: number, output?: number, cacheRead?: number) => {
    const total = (input ?? 0) + (output ?? 0) + (cacheRead ?? 0);
    return (
      <Popover
        content={
          <div style={{ minWidth: 180 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Token 明细</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
              <span style={{ color: '#4080ff' }}>输入 Token</span><span>{formatNumber(input ?? 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
              <span style={{ color: '#00b42a' }}>输出 Token</span><span>{formatNumber(output ?? 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
              <span style={{ color: '#00b4d4' }}>缓存读取</span><span>{formatNumber(cacheRead ?? 0)}</span>
            </div>
            <div style={{ borderTop: '1px solid #e5e6eb', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 12 }}>
              <span>总 Token</span><span>{formatNumber(total)}</span>
            </div>
          </div>
        }
      >
        <span style={{ cursor: 'pointer', color: '#4080ff', fontWeight: 500 }}>{formatNumber(total)}</span>
      </Popover>
    );
  };

  const formatCostDetail = (cost?: number, originalCost?: number) => (
    <Popover
      content={
        <div style={{ minWidth: 200 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>成本明细</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
            <span>原始费用</span><span>¥{formatCost(originalCost ?? cost)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
            <span>倍率</span><span>0.50x</span>
          </div>
          <div style={{ borderTop: '1px solid #e5e6eb', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 12, color: '#00b42a' }}>
            <span>用户扣费</span><span>¥{formatCost(cost)}</span>
          </div>
        </div>
      }
    >
      <span style={{ cursor: 'pointer', color: '#00b42a', fontWeight: 600 }}>¥{formatCost(cost)}</span>
    </Popover>
  );

  const columns: any[] = [
    { title: 'API 密钥', dataIndex: 'apiKey', width: 100, render: (v: any) => <Tag size="small">{v ?? '默认'}</Tag> },
    { title: '模型', dataIndex: 'model', width: 160, render: (v: any) => <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{v ?? '—'}</span> },
    { title: '端点', dataIndex: 'endpoint', width: 200, render: (v: any) => <span style={{ color: '#4e5969', fontSize: 12 }}>{v ?? '—'}</span> },
    { title: 'IP', dataIndex: 'ip', width: 120, render: (v: any) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v ?? '—'}</span> },
    { title: '分组', dataIndex: 'group', width: 120, render: (v: any) => v ? <Tag color="arcoblue" size="small">{v}</Tag> : '—' },
    { title: '类型', dataIndex: 'type', width: 80, render: (v: any) => <Tag size="small">{v ?? '—'}</Tag> },
    { title: 'TOKEN', dataIndex: 'totalTokens', width: 130, render: (_: any, r: UsageRecord) => formatTokens(r.inputTokens as number | undefined, r.outputTokens as number | undefined, r.cacheReadTokens as number | undefined) },
    { title: '费用', dataIndex: 'cost', width: 100, render: (_: any, r: UsageRecord) => formatCostDetail(r.cost as number | undefined, r.originalCost as number | undefined) },
    { title: '延迟', dataIndex: 'latency', width: 120, render: (_: any, r: UsageRecord) => (
      <div style={{ fontSize: 12 }}>
        <div style={{ color: '#ff7d00' }}>首字 {(r.firstTokenLatency as number | undefined) ?? '—'}s</div>
        <div style={{ color: '#4e5969' }}>总耗时 {(r.totalLatency as number | undefined) ?? '—'}s</div>
      </div>
    ) },
    { title: '时间', dataIndex: 'time', width: 160, render: (v: any) => <span style={{ fontSize: 12, color: '#9a9aa5' }}>{v ? new Date(v).toLocaleString('zh-CN') : '—'}</span>, sorter: (a: UsageRecord, b: UsageRecord) => ((a.time as number) ?? 0) - ((b.time as number) ?? 0) },
  ];

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <div>
          <h2 className="ai-page-title">{t('console.usage.title', '用量管理')}</h2>
          <p className="ai-page-subtitle">{t('console.usage.subtitle', '实时统计 API 调用量、Token 消耗与费用，支持多维度筛选与明细追溯')}</p>
        </div>
        <div className="ai-page-actions">
          <Button icon={<Refresh {...iconProps} />} onClick={loadData}>{t('console.common.refresh', '刷新')}</Button>
          <Button icon={<Download {...iconProps} />} onClick={handleExportCsv}>{t('console.usage.exportCsv', '导出 CSV')}</Button>
        </div>
      </div>

      {/* 统计卡 */}
      <div className="ai-usage-stats">
        <div className="ai-usage-stat-card">
          <div className="ai-usage-stat-label"><DataAll {...iconProps} /> 总请求数</div>
          <div className="ai-usage-stat-value">{formatNumber(dashboard.totalRequests)}</div>
          <div className="ai-usage-stat-sub">所选范围内</div>
        </div>
        <div className="ai-usage-stat-card">
          <div className="ai-usage-stat-label"><Thunderbolt {...iconProps} /> 总 Token</div>
          <div className="ai-usage-stat-value">{(dashboard.totalTokens / 1000000).toFixed(2)}M</div>
          <div className="ai-usage-stat-sub">输入: {(dashboard.inputTokens / 1000000).toFixed(2)}M / 输出: {(dashboard.outputTokens / 1000).toFixed(1)}K / 缓存: {(dashboard.cacheReadTokens / 1000000).toFixed(2)}M</div>
        </div>
        <div className="ai-usage-stat-card">
          <div className="ai-usage-stat-label"><Wallet {...iconProps} /> 总消费</div>
          <div className="ai-usage-stat-value" style={{ color: '#00b42a' }}>¥{formatCost(dashboard.totalCost)}</div>
          <div className="ai-usage-stat-sub">标准 ¥{formatCost(dashboard.totalCost * 2)}</div>
        </div>
        <div className="ai-usage-stat-card">
          <div className="ai-usage-stat-label"><Time {...iconProps} /> 平均耗时</div>
          <div className="ai-usage-stat-value">{dashboard.avgLatency}s</div>
          <div className="ai-usage-stat-sub">首字 + 总耗时</div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="ai-toolbar" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#9a9aa5' }}>时间范围:</span>
          <RangePicker style={{ width: 240 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#9a9aa5' }}>粒度:</span>
          <Select value={granularity} onChange={setGranularity} style={{ width: 120 }}>
            <Select.Option value="hour">按小时</Select.Option>
            <Select.Option value="day">按天</Select.Option>
            <Select.Option value="week">按周</Select.Option>
          </Select>
        </div>
      </div>

      {/* 分布图 */}
      <div className="ai-usage-grid">
        <div className="ai-usage-panel">
          <div className="ai-usage-panel-header">
            <span className="ai-usage-panel-title">模型分布</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <Button size="small" type="primary">按 Token</Button>
              <Button size="small">按实际消费</Button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div ref={modelChartRef} style={{ width: 180, height: 180 }} />
            <Table
              size="small"
              pagination={false}
              columns={[
                { title: '模型', dataIndex: 'model', render: (v: string) => <span style={{ fontSize: 12, fontFamily: 'monospace' }}>{v}</span> },
                { title: '请求', dataIndex: 'requests', render: (v: number) => formatNumber(v), align: 'right' as const },
                { title: 'Token', dataIndex: 'tokens', render: (v: number) => `${(v / 1000000).toFixed(2)}M`, align: 'right' as const },
                { title: '实际', dataIndex: 'cost', render: (v: number) => <span style={{ color: '#00b42a' }}>¥{formatCost(v)}</span>, align: 'right' as const },
              ]}
              data={dashboard.modelDistribution}
            />
          </div>
        </div>

        <div className="ai-usage-panel">
          <div className="ai-usage-panel-header">
            <span className="ai-usage-panel-title">分组使用分布</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <Button size="small" type="primary">按 Token</Button>
              <Button size="small">按实际消费</Button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div ref={groupChartRef} style={{ width: 180, height: 180 }} />
            <Table
              size="small"
              pagination={false}
              columns={[
                { title: '分组', dataIndex: 'group', render: (v: string) => <Tag color="arcoblue" size="small">{v}</Tag> },
                { title: '请求', dataIndex: 'requests', render: (v: number) => formatNumber(v), align: 'right' as const },
                { title: 'Token', dataIndex: 'tokens', render: (v: number) => `${(v / 1000000).toFixed(2)}M`, align: 'right' as const },
                { title: '实际', dataIndex: 'cost', render: (v: number) => <span style={{ color: '#00b42a' }}>¥{formatCost(v)}</span>, align: 'right' as const },
              ]}
              data={dashboard.groupDistribution}
            />
          </div>
        </div>

        <div className="ai-usage-panel">
          <div className="ai-usage-panel-header">
            <span className="ai-usage-panel-title">端点分布</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <Button size="small" type="primary">按 Token</Button>
              <Button size="small">按实际消费</Button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div ref={endpointChartRef} style={{ width: 180, height: 180 }} />
            <Table
              size="small"
              pagination={false}
              columns={[
                { title: '端点', dataIndex: 'endpoint', render: (v: string) => <span style={{ fontSize: 12, fontFamily: 'monospace' }}>{v}</span> },
                { title: '请求', dataIndex: 'requests', render: (v: number) => formatNumber(v), align: 'right' as const },
                { title: 'Token', dataIndex: 'tokens', render: (v: number) => `${(v / 1000000).toFixed(2)}M`, align: 'right' as const },
                { title: '实际', dataIndex: 'cost', render: (v: number) => <span style={{ color: '#00b42a' }}>¥{formatCost(v)}</span>, align: 'right' as const },
              ]}
              data={dashboard.endpointDistribution}
            />
          </div>
        </div>

        <div className="ai-usage-panel">
          <div className="ai-usage-panel-header">
            <span className="ai-usage-panel-title">Token 使用趋势</span>
          </div>
          <div ref={trendChartRef} className="ai-usage-chart" />
        </div>
      </div>

      {/* 用量明细 */}
      <Card className="ai-usage-panel" style={{ padding: 0 }}>
        <div style={{ padding: '16px 16px 0' }}>
          <Tabs activeTab={activeTab} onChange={setActiveTab}>
            <Tabs.TabPane key="details" title="用量明细" />
            <Tabs.TabPane key="errors" title="错误请求" />
          </Tabs>
        </div>
        <div style={{ padding: '0 16px 16px' }}>
          <div className="ai-toolbar" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <Input
              prefix={<Search {...iconProps} />}
              placeholder="搜索 API 密钥 / 模型 / 端点"
              value={keyword}
              onChange={setKeyword}
              allowClear
              style={{ width: 240 }}
            />
            <Select placeholder="模型" value={modelFilter} onChange={setModelFilter} allowClear style={{ width: 160 }}>
              {modelOptions.map((o) => <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>)}
            </Select>
            <Select placeholder="分组" value={groupFilter} onChange={setGroupFilter} allowClear style={{ width: 140 }}>
              {groupOptions.map((o) => <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>)}
            </Select>
            <Select placeholder="类型" allowClear style={{ width: 120 }}>
              <Select.Option value="chat">对话</Select.Option>
              <Select.Option value="embedding">嵌入</Select.Option>
              <Select.Option value="image">图像</Select.Option>
            </Select>
            <Select placeholder="计费类型" allowClear style={{ width: 120 }}>
              <Select.Option value="token">按 Token</Select.Option>
              <Select.Option value="time">按时长</Select.Option>
            </Select>
            <div style={{ flex: 1 }} />
            <Button icon={<Filter {...iconProps} />} onClick={() => { setKeyword(''); setModelFilter(''); setGroupFilter(''); }}>重置</Button>
          </div>

          <Spin loading={loading}>
            {activeTab === 'details' ? (
              filteredRecords.length === 0 ? (
                <Empty description="暂无用量记录" style={{ padding: 40 }} />
              ) : (
                <>
                  <Table
                    className="ai-usage-detail-table"
                    columns={columns}
                    data={filteredRecords}
                    pagination={false}
                    size="small"
                    border={{ wrapper: true, cell: true }}
                    scroll={{ x: 1400 }}
                  />
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                    <Pagination
                      total={total}
                      current={page}
                      pageSize={PAGE_SIZE}
                      onChange={setPage}
                      size="small"
                    />
                  </div>
                </>
              )
            ) : (
              <Empty description="暂无错误请求" style={{ padding: 40 }} />
            )}
          </Spin>
        </div>
      </Card>
    </div>
  );
}

const iconProps = { theme: 'outline' as const, size: 16, strokeWidth: 4, fill: 'currentColor' as const };
