import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { httpRequest } from '@/common/adapter/httpBridge';
import { Button, DatePicker, Select, Tooltip } from '@arco-design/web-react';
import EChartsPie from './EChartsPie';
import EChartLine from './EChartLine';
import { Refresh, Sync } from '@icon-park/react';
import SettingsPageWrapper from './components/SettingsPageWrapper';

// ─── 类型 ──────────────────────────────────────────────────────

interface UsageRow {
  id?: number;
  api_key?: string;
  model?: string;
  inference_strength?: string;
  endpoint?: string;
  ip?: string;
  group_name?: string;
  type?: string;
  billing_mode?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  cached_tokens?: number;
  total_tokens?: number;
  input_cost?: number;
  output_cost?: number;
  cached_cost?: number;
  total_cost?: number;
  service_tier?: string;
  ratio?: number;
  original_cost?: number;
  first_token_latency?: number;
  total_latency?: number;
  call_time?: string;
}

interface UsageStats {
  totalCalls?: number;
  totalTokens?: number;
  totalCost?: number;
  totalPromptTokens?: number;
  totalCompletionTokens?: number;
  totalCachedTokens?: number;
  avgLatency?: number;
  standardCost?: number;
}

// ─── 工具 ──────────────────────────────────────────────────────

const fmtNum = (v: unknown, d = 0) => v == null ? '-' : Number(v).toLocaleString(undefined, { maximumFractionDigits: d });
const fmtStr = (v: unknown, def = '-') => v == null ? def : String(v);
const fmtToken = (v: number) => v >= 1e9 ? (v/1e9).toFixed(2)+'B' : v >= 1e6 ? (v/1e6).toFixed(2)+'M' : v >= 1e3 ? (v/1e3).toFixed(1)+'K' : String(v);
const fmtCost = (v: unknown) => v == null ? '-' : `$${Number(v).toFixed(2)}`;
/** 表格内费用：六位小数（对齐账单精度，如 $0.057030） */
const fmtCost6 = (v: unknown) => v == null ? '-' : `$${Number(v).toFixed(6)}`;
const fmtDate = (v: unknown) => v == null ? '-' : dayjs(v as string | number | Date).format('YYYY/MM/DD HH:mm');
const fmtDateFull = (v: unknown) => v == null ? '-' : dayjs(v as string | number | Date).format('YYYY/MM/DD HH:mm:ss');
const fmtLatency = (ms?: number) => ms == null || ms <= 0 ? '-' : ms >= 1000 ? `${(ms/1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
/** 延迟展示：>60s 显示 "3m 17s"，>1s 显示两位小数秒，否则毫秒 */
const fmtLatencyImg = (ms?: number) => {
  if (ms == null || ms <= 0) return '-';
  if (ms >= 60000) { const m = Math.floor(ms / 60000); const s = Math.round((ms % 60000) / 1000); return `${m}m ${s}s`; }
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${Math.round(ms)}ms`;
};

const mapRow = (r: any): UsageRow => ({
  id: r.sysAiUsageId, api_key: r.sysAiUsageGroupName ?? '默认', model: r.sysAiUsageModel,
  inference_strength: r.sysAiUsageInferenceStrength ?? '默认', endpoint: r.sysAiUsageEndpoint ?? '/v1/chat/completions',
  ip: r.sysAiUsageIp ?? '127.0.0.1', group_name: r.sysAiUsageGroupName, type: r.sysAiUsageType ?? 'chat',
  billing_mode: r.sysAiUsageBillingMode ?? '默认',
  prompt_tokens: r.sysAiUsagePromptTokens ?? 0, completion_tokens: r.sysAiUsageCompletionTokens ?? 0,
  cached_tokens: r.sysAiUsageCachedTokens ?? 0, total_tokens: r.sysAiUsageTotalTokens ?? 0,
  input_cost: r.sysAiUsageInputCost ?? 0, output_cost: r.sysAiUsageOutputCost ?? 0,
  cached_cost: r.sysAiUsageCachedCost ?? 0, total_cost: r.sysAiUsageTotalCost ?? 0,
  service_tier: r.sysAiUsageServiceTier, ratio: r.sysAiUsageRatio,
  original_cost: r.sysAiUsageOriginalCost,
  first_token_latency: r.sysAiUsageFirstTokenLatency, total_latency: r.sysAiUsageTotalLatency,
  call_time: r.sysAiUsageCallTime,
});

// ─── API ───────────────────────────────────────────────────────

const LIST_API = '/v2/usage/list';
const STAT_API = '/v2/usage/statistics';
const MAX_DAYS = 31;
const PRESETS = [
  { label: '今天', type: 'today' as const },
  { label: '昨天', type: 'yesterday' as const },
  { label: '本周', type: 'thisWeek' as const },
  { label: '本月', type: 'thisMonth' as const },
  { label: '近7天', days: 7, hours: 0 },
  { label: '近30天', days: 30, hours: 0 },
];

interface ListResponse {
  records: any[];
  total: number;
  page: number;
  pageSize: number;
}

async function fetchList(p: URLSearchParams) {
  const res = await httpRequest<ListResponse>('GET', `${LIST_API}?${p}`);
  return {
    rows: ((res?.records ?? []) as any[]).map(mapRow),
    total: res?.total ?? 0,
    page: res?.page ?? 1,
    pageSize: res?.pageSize ?? 10,
  };
}
async function fetchStats(p: URLSearchParams) {
  // 统计接口需要登录鉴权（list 在白名单内匿名可查）。鉴权失败时降级为空统计，
  // 不能让 Promise.all 整体 reject 把列表也一起清空。
  try {
    const res = await httpRequest<UsageStats>('GET', `${STAT_API}?${p}`);
    return res ?? {};
  } catch {
    return {} as UsageStats;
  }
}

// ─── 图表 ──────────────────────────────────────────────────

/** ECharts 饼图主题色板 token（亮/暗自动切换） */
const CHART_COLOR_TOKENS = ['--primary-6', '--success-6', '--warning-6', '--danger-6', '--info'];

/**
 * 读取当前主题下 CSS 变量的实际色值。
 *
 * @param token 不含 var() 包裹的 token 名（如 "--primary-6"）
 * @param fallback 变量缺失时的兜底色
 * @return 解析后的颜色值
 */
function resolveCssToken(token: string, fallback: string): string {
  const cs = getComputedStyle(document.documentElement);
  const v = cs.getPropertyValue(token).trim();
  return v || fallback;
}

// ─── 浮窗 ──────────────────────────────────────────────────────

const popS: React.CSSProperties = { background:'var(--bg-1)', border:'1px solid var(--bg-3)', borderRadius:8, padding:'8px 10px', fontSize:13, boxShadow:'0 4px 12px rgba(0,0,0,0.4)', minWidth:155, zIndex:1000 };
const rRow: React.CSSProperties = { display:'flex', justifyContent:'space-between', padding:'2px 0', gap:8 };
const rLbl: React.CSSProperties = { color:'var(--text-secondary)' };
const rVal: React.CSSProperties = { color:'var(--text-primary)', fontVariantNumeric:'tabular-nums', textAlign:'right' as const };

const TokenPop: React.FC<{ row: UsageRow }> = ({ row }) => (
  <div style={popS}>
    <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', marginBottom:4, paddingBottom:4, borderBottom:'1px solid var(--bg-3)' }}>Token 明细</div>
    <div style={rRow}><span style={rLbl}>输入 Token</span><span style={rVal}>{fmtNum(row.prompt_tokens??0,0)}</span></div>
    <div style={rRow}><span style={rLbl}>输出 Token</span><span style={rVal}>{fmtNum(row.completion_tokens??0,0)}</span></div>
    {(row.cached_tokens??0)>0 && <div style={rRow}><span style={rLbl}>缓存读取</span><span style={rVal}>{fmtNum(row.cached_tokens!,0)}</span></div>}
    <div style={{...rRow,borderTop:'1px solid var(--bg-3)',paddingTop:4,marginTop:4}}>
      <span style={rLbl}>总 Token</span><span style={{...rVal,color:'var(--primary)',fontWeight:700}}>{fmtNum(row.total_tokens??0,0)}</span>
    </div>
  </div>
);

const CostPop: React.FC<{ row: UsageRow }> = ({ row }) => (
  <div style={popS}>
    <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', marginBottom:4, paddingBottom:4, borderBottom:'1px solid var(--bg-3)' }}>成本明细</div>
    <div style={rRow}><span style={rLbl}>输入成本</span><span style={rVal}>{fmtCost(row.input_cost)}</span></div>
    <div style={rRow}><span style={rLbl}>输出成本</span><span style={rVal}>{fmtCost(row.output_cost)}</span></div>
    {(row.cached_cost??0)>0 && <div style={rRow}><span style={rLbl}>缓存读取</span><span style={rVal}>{fmtCost(row.cached_cost)}</span></div>}
    <div style={{...rRow,borderTop:'1px solid var(--bg-3)',margin:'4px 0'}}/>
    <div style={rRow}><span style={rLbl}>服务档位</span><span style={{...rVal,color:'var(--info)'}}>{row.service_tier??'-'}</span></div>
    <div style={rRow}><span style={rLbl}>倍率</span><span style={rVal}>{row.ratio!=null?`${row.ratio.toFixed(2)}x`:'-'}</span></div>
    <div style={rRow}><span style={rLbl}>原始</span><span style={rVal}>{fmtCost(row.original_cost)}</span></div>
    <div style={{...rRow,borderTop:'1px solid var(--bg-3)',paddingTop:4,marginTop:4}}>
      <span style={rLbl}>用户扣费</span><span style={{...rVal,color:'var(--success)',fontWeight:700,fontSize:14}}>{fmtCost(row.total_cost)}</span>
    </div>
  </div>
);

/** 延迟阈值：首字 / 总耗时 通用分档 */
const latencyColor = (ms?: number) => ms == null || ms <= 0 ? 'var(--color-text-4)' : ms < 500 ? 'var(--success)' : ms < 2000 ? 'var(--warning)' : ms < 30000 ? 'var(--warning-6, var(--warning))' : 'var(--danger)';

/** 参考图延迟单元格：左侧竖色条 + 首字/总耗时 两行 */
const DelayBar: React.FC<{ firstMs?: number; totalMs?: number }> = ({ firstMs, totalMs }) => {
  const barColor = latencyColor(totalMs ?? firstMs);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 110 }}>
      <div style={{ width: 3, alignSelf: 'stretch', minHeight: 30, borderRadius: 2, background: barColor, flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--color-text-3)', whiteSpace: 'nowrap' }}>首字</span>
          <span style={{ fontSize: 12, color: 'var(--warning)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{fmtLatencyImg(firstMs)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--color-text-3)', whiteSpace: 'nowrap' }}>总耗时</span>
          <span style={{ fontSize: 12, color: latencyColor(totalMs), whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{fmtLatencyImg(totalMs)}</span>
        </div>
      </div>
    </div>
  );
};

/** 表格 ⓘ 信息角标（悬停出明细浮窗） */
const InfoMark: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Tooltip content={children} trigger='hover' position='top'>
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--color-border-3)',
        color: 'var(--color-text-3)', fontSize: 9, lineHeight: 1, cursor: 'pointer',
        flexShrink: 0, userSelect: 'none', fontStyle: 'normal',
      }}
    >i</span>
  </Tooltip>
);

// ─── 图表面板 ──────────────────────────────────────────────────

interface PanelData { label: string; requests: number; tokens: number; actual: number; standard: number; }

const ChartPanel: React.FC<{
  title: string; toggleKey: string; byToken: boolean;
  onToggle: (k:string,b:boolean) => void; data: PanelData[];
}> = ({ title, toggleKey, byToken, onToggle, data }) => {
  const top5 = data.slice(0, 5);
  const pieData = top5.map((d,i) => ({ label: d.label, value: byToken ? d.tokens : d.actual }));
  return (
    <div style={{ background:'var(--bg-1)', borderRadius:12, border:'1px solid var(--bg-3)', overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {/* 标题行 */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderBottom:'1px solid var(--bg-3)' }}>
        <span style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>{title}</span>
        <div style={{ display:'flex', gap:2, background:'var(--bg-2)', borderRadius:6, padding:2 }}>
          {(['token','cost'] as const).map(m => (
            <button key={m} onClick={() => onToggle(toggleKey, m==='token')}
              style={{ padding:'2px 10px', borderRadius:5, fontSize:12, border:'none', cursor:'pointer',
                background: byToken===(m==='token') ? 'var(--primary)' : 'transparent',
                color: byToken===(m==='token') ? '#fff' : 'var(--text-secondary)', transition:'all 0.15s' }}>
              {m==='token' ? '按 Token' : '按实际消费'}
            </button>
          ))}
        </div>
      </div>
      {/* 图表区域 */}
      <div style={{ display:'flex', alignItems:'center', gap:16, padding:'16px' }}>
        <div style={{ flexShrink:0 }}>
          <EChartsPie data={pieData} tokens={CHART_COLOR_TOKENS} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ color:'var(--bg-6)', borderBottom:'1px solid var(--bg-3)' }}>
                {['模型','请求','Token','实际','标准'].map(h => (
                  <th key={h} style={{ padding:'3px 8px', textAlign: h==='模型'?'left':'right', fontWeight:400, fontSize:12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {top5.map((d,i) => (
                <tr key={d.label} style={{ borderBottom:'1px solid var(--bg-3)' }}>
                  <td style={{ padding:'4px 8px', color:'var(--text-secondary)', maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    <span style={{ display:'inline-block', width:5, height:5, borderRadius:'50%', background:resolveCssToken(CHART_COLOR_TOKENS[i%CHART_COLOR_TOKENS.length],'#165dff'), marginRight:5, flexShrink:0 }}/>
                    {d.label}
                  </td>
                  <td style={{ padding:'4px 8px', textAlign:'right', color:'var(--bg-6)' }}>{fmtNum(d.requests,0)}</td>
                  <td style={{ padding:'4px 8px', textAlign:'right', color:'var(--bg-6)' }}>{fmtToken(d.tokens)}</td>
                  <td style={{ padding:'4px 8px', textAlign:'right', color:'var(--success)' }}>{fmtCost(d.actual)}</td>
                  <td style={{ padding:'4px 8px', textAlign:'right', color:'var(--bg-6)' }}>{fmtCost(d.standard)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── 主页面 ────────────────────────────────────────────────────

const UsageLibraryPage: React.FC = () => {
  const { t } = useTranslation();
  const defaultStart = () => { const d = new Date(); d.setHours(d.getHours()-24); d.setMinutes(0,0,0); return d; };

  const [rows, setRows] = useState<UsageRow[]>([]);
  const [stats, setStats] = useState<UsageStats>({});
  const [provider, setProvider] = useState<string|undefined>();
  const [model, setModel] = useState<string|undefined>();
  const [providers, setProviders] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs,dayjs.Dayjs]|null>([dayjs(defaultStart()), dayjs()]);
  const [granularity, setGranularity] = useState<'hourly'|'daily'>('hourly');
  const [chartModes, setChartModes] = useState<Record<string,boolean>>({ model:true, group:true, endpoint:true });
  const [syncing, setSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  /** 表格排序：模型 / 时间（客户端，作用于当前页） */
  const [sortKey, setSortKey] = useState<'time' | 'model'>('time');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = useCallback((key: 'time' | 'model') => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'time' ? 'desc' : 'asc');
    }
  }, [sortKey]);

  const sortedRows = useMemo(() => {
    const sign = sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (sortKey === 'model') return String(a.model ?? '').localeCompare(String(b.model ?? '')) * sign;
      return ((a.call_time ?? '').localeCompare(b.call_time ?? '')) * sign;
    });
  }, [rows, sortKey, sortDir]);

  const syncTimerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const paramsRef = useRef('');
  const seqRef = useRef(0);

  const doSync = useCallback(async (params: string) => {
    const seq = ++seqRef.current;
    try {
      const [listRes, statRes] = await Promise.all([fetchList(new URLSearchParams(params)), fetchStats(new URLSearchParams(params))]);
      // 只应用最新一次请求的结果，丢弃过期响应，避免翻页/切换条数后旧响应还原页码
      if (seq !== seqRef.current) return;
      setRows(listRes.rows); setStats(statRes); setTotal(listRes.total);
      setCurrentPage(listRes.page); setPageSize(listRes.pageSize);
      const pSet=new Set<string>(), mSet=new Set<string>();
      listRes.rows.forEach(r => { if(r.group_name) pSet.add(r.group_name); if(r.model) mSet.add(r.model); });
      setProviders([...pSet].sort()); setModels([...mSet].sort());
    } catch { /* ignore */ }
  }, []);

  const startSync = useCallback((currentParams: string) => {
    if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    paramsRef.current = currentParams;
    void doSync(currentParams);
    syncTimerRef.current = setInterval(() => { void doSync(paramsRef.current); }, 5*60*1000);
  }, [doSync]);

  useEffect(() => { return () => { if(syncTimerRef.current) clearInterval(syncTimerRef.current); }; }, []);

  const buildParams = useCallback(() => {
    const p = new URLSearchParams();
    if(provider) p.set('provider', provider);
    if(model) p.set('model', model);
    if(dateRange?.[0]) p.set('startTime', dateRange[0].format('YYYY-MM-DD HH:mm:ss'));
    if(dateRange?.[1]) p.set('endTime', dateRange[1].format('YYYY-MM-DD HH:mm:ss'));
    return p.toString();
  }, [provider, model, dateRange]);

  const handleRefresh = useCallback(async () => {
    setSyncing(true);
    try {
      const params = buildParams();
      const p = new URLSearchParams(params);
      p.set('page', String(currentPage)); p.set('size', String(pageSize));
      const seq = ++seqRef.current;
      const [listRes, statRes] = await Promise.all([fetchList(p), fetchStats(new URLSearchParams(params))]);
      if (seq !== seqRef.current) return;
      setRows(listRes.rows); setStats(statRes); setTotal(listRes.total);
      setCurrentPage(listRes.page); setPageSize(listRes.pageSize);
      const pSet=new Set<string>(), mSet=new Set<string>();
      listRes.rows.forEach(r => { if(r.group_name) pSet.add(r.group_name); if(r.model) mSet.add(r.model); });
      setProviders([...pSet].sort()); setModels([...mSet].sort());
    } catch { /* ignore */ } finally { setSyncing(false); }
  }, [buildParams, currentPage, pageSize]);

  const handlePage = useCallback((page: number) => {
    setCurrentPage(page);
    void doSync(buildParams() + `&page=${page}&size=${pageSize}`);
  }, [buildParams, pageSize, doSync]);

  const handleSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    void doSync(buildParams() + `&page=1&size=${size}`);
  }, [buildParams, doSync]);

  // 仅当筛选条件（provider/model/日期范围）变化时重置并刷新到第 1 页；
  // 不再依赖 handleRefresh/startSync 引用，避免翻页/切换条数触发重复请求
  useEffect(() => {
    const params = buildParams();
    startSync(params + `&page=1&size=${pageSize}`);
  }, [buildParams, startSync, pageSize]);

  const handleDateChange = useCallback((v: any) => {
    if (!v || v.length !== 2) { setDateRange(null); return; }
    const [start, end] = [dayjs(v[0]), dayjs(v[1])];
    if (!start.isValid() || !end.isValid()) { setDateRange(null); return; }
    const diffDays = end.diff(start, 'day');
    if (diffDays > MAX_DAYS) { setDateRange([start, start.add(MAX_DAYS, 'day')]); return; }
    setDateRange([start, end]);
  }, []);

  const handlePresetChange = useCallback((preset: { label: string; type?: string; days?: number; hours?: number }) => {
    const now = dayjs();
    let start: dayjs.Dayjs;
    if (preset.type === 'today') {
      start = now.startOf('day');
    } else if (preset.type === 'yesterday') {
      start = now.subtract(1, 'day').startOf('day');
    } else if (preset.type === 'thisWeek') {
      start = now.startOf('week');
    } else if (preset.type === 'thisMonth') {
      start = now.startOf('month');
    } else {
      start = now.subtract(preset.days ?? 0, 'day').subtract(preset.hours ?? 0, 'hour');
    }
    setDateRange([start, now]);
  }, []);

  const handleReset = useCallback(() => {
    setDateRange([dayjs(defaultStart()), dayjs()]);
    setProvider(undefined); setModel(undefined);
  }, []);

  const toggleChartMode = useCallback((key:string, byToken:boolean) => {
    setChartModes(prev => ({ ...prev, [key]: byToken }));
  }, []);

  const aggData = useCallback((getKey: (r:UsageRow) => string): PanelData[] => {
    const m = new Map<string,{ requests:number; tokens:number; actual:number; standard:number }>();
    rows.forEach(r => {
      const k = getKey(r);
      const prev = m.get(k) ?? { requests:0, tokens:0, actual:0, standard:0 };
      m.set(k, { requests:prev.requests+1, tokens:prev.tokens+(r.total_tokens??0), actual:prev.actual+(r.total_cost??0), standard:prev.standard+(r.original_cost??r.total_cost??0) });
    });
    return [...m.entries()].sort((a,b)=>b[1].tokens-a[1].tokens).map(([label,v]) => ({ label, ...v }));
  }, [rows]);

  const modelAgg = useMemo(() => aggData(r => r.model ?? '未知'), [aggData]);
  const groupAgg = useMemo(() => aggData(r => r.group_name ?? '未知'), [aggData]);
  const endpointAgg = useMemo(() => aggData(r => r.endpoint ?? '默认'), [aggData]);

  const trendPoints = useMemo(() => {
    if (rows.length === 0) return [];
    const keyFn = (row:UsageRow) => granularity==='hourly' ? dayjs(row.call_time).format('MM/DD HH:00') : dayjs(row.call_time).format('MM/DD');
    const m = new Map<string,{ input:number; output:number; cacheRead:number }>();
    rows.forEach(r => {
      const k = keyFn(r);
      const prev = m.get(k) ?? { input:0, output:0, cacheRead:0 };
      m.set(k, { input:prev.input+(r.prompt_tokens??0), output:prev.output+(r.completion_tokens??0), cacheRead:prev.cacheRead+(r.cached_tokens??0) });
    });
    return [...m.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([label,v]) => ({
      label, input:v.input, output:v.output, cacheRead:v.cacheRead,
    }));
  }, [rows, granularity]);

  // ── 渲染 ──
  return (
    <SettingsPageWrapper contentClassName="md:max-w-none">
      <div style={{ display:'flex', flexDirection:'column', height:'100%', maxWidth:'none' }}>

        {/* ── 统计卡片行 ── */}
        <div style={{ display:'flex', gap:12, padding:'16px 20px 12px', flexWrap:'wrap' }}>
          {[
            { icon:'📋', bg:'var(--bg-3)', title:'总请求数', sub:'所选范围内', val: stats.totalCalls ?? rows.length },
            { icon:'📦', bg:'var(--bg-3)', title:'总 Token', sub:`输入: ${fmtToken(stats.totalPromptTokens??0)} / 输出: ${fmtToken(stats.totalCompletionTokens??0)} / 缓存: ${fmtToken(stats.totalCachedTokens??0)}`, val: fmtToken(stats.totalTokens??0) },
            { icon:'💵', bg:'var(--bg-3)', title:'总消费', sub: stats.standardCost!=null ? `标准 $${stats.standardCost.toFixed(6)}` : undefined, val: fmtCost(stats.totalCost) },
            { icon:'⏱️', bg:'var(--bg-3)', title:'平均首字', sub: 'TTFT', val: fmtLatency(stats.avgFirstTokenLatency) },
            { icon:'⏱️', bg:'var(--bg-3)', title:'平均耗时', sub: '端到端', val: fmtLatency(stats.avgLatency) },
          ].map(({ icon, bg, title, sub, val }) => (
            <div key={title} style={{ flex:'1 1 180px', background:'var(--bg-1)', borderRadius:12, border:'1px solid var(--bg-3)', padding:'14px 18px', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{icon}</div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:12, color:'var(--bg-6)', marginBottom:2 }}>{title}</div>
                <div style={{ fontSize:20, fontWeight:700, color:'var(--text-primary)', fontVariantNumeric:'tabular-nums', lineHeight:1.2 }}>
                  {typeof val==='number' ? val.toLocaleString() : val}
                </div>
                {sub && <div style={{ fontSize:11, color:'var(--bg-6)', marginTop:2 }}>{sub}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* ── 筛选栏 ── */}
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 20px 10px', flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:4, flexWrap:'wrap' }}>
            <span style={{ fontSize:13, color:'var(--bg-6)' }}>时间范围:</span>
            {PRESETS.map((p) => (
              <button key={p.label} onClick={() => handlePresetChange(p)}
                style={{ padding:'3px 10px', borderRadius:6, fontSize:12, background:'var(--bg-1)', color:'var(--text-secondary)', cursor:'pointer', border:'none' }}>{p.label}</button>
            ))}
            <DatePicker.RangePicker allowClear showTime value={dateRange ?? undefined} onChange={handleDateChange} format="YYYY-MM-DD HH:mm:ss" style={{ width:240, background:'var(--bg-1)', border:'1px solid var(--bg-3)', borderRadius:6 }} placeholder={['开始','结束']} />
          </div>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
            <Select value={granularity} onChange={(v)=>setGranularity(v as 'hourly'|'daily')} size="small" style={{ width:90, background:'var(--bg-1)' }}>
              <Select.Option value="hourly">按小时</Select.Option>
              <Select.Option value="daily">按天</Select.Option>
            </Select>
            <Select allowClear placeholder="分组" value={provider} onChange={(v)=>setProvider(v as string|undefined)} options={providers.map(p=>({label:p,value:p}))} style={{ width:120, background:'var(--bg-1)' }} size="small" />
            <Select allowClear placeholder="模型" value={model} onChange={(v)=>setModel(v as string|undefined)} options={models.map(m=>({label:m,value:m}))} style={{ width:150, background:'var(--bg-1)' }} size="small" />
            <Button size="small" icon={<Refresh theme="outline" size="14"/>} loading={syncing} onClick={() => void handleRefresh()}>刷新</Button>
            <Button size="small" type="text" style={{ color:'var(--danger)' }} onClick={handleReset}>重置</Button>
            <span style={{ fontSize:12, color:'var(--bg-6)', display:'flex', alignItems:'center', gap:4 }}>
              <Sync theme="outline" size="12"/> 每5分钟自动同步 · {rows.length} 条
            </span>
          </div>
        </div>

        {/* ── 数据表格（主视图，对齐账单流水风格） ── */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '0 20px 12px', display: 'flex', flexDirection: 'column' }}>
          {rows.length === 0 ? (
            <div style={{ background: 'var(--bg-1)', borderRadius: 12, border: '1px solid var(--bg-3)', padding: '40px', textAlign: 'center', color: 'var(--bg-6)', fontSize: 14 }}>
              暂无用量数据
            </div>
          ) : (
            <div style={{ background: 'var(--bg-1)', borderRadius: 12, border: '1px solid var(--bg-3)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-2)', position: 'sticky', top: 0, zIndex: 10 }}>
                      {([
                        { key: 'api_key', label: 'API 密钥', sortable: false },
                        { key: 'model', label: '模型', sortable: true },
                        { key: 'inference', label: '推理强度', sortable: false },
                        { key: 'endpoint', label: '端点', sortable: false },
                        { key: 'ip', label: 'IP', sortable: false },
                        { key: 'group', label: '分组', sortable: false },
                        { key: 'type', label: '类型', sortable: false },
                        { key: 'billing', label: '计费模式', sortable: false },
                        { key: 'token', label: 'TOKEN', sortable: false },
                        { key: 'cost', label: '费用', sortable: false },
                        { key: 'latency', label: '延迟', sortable: false },
                        { key: 'time', label: '时间', sortable: true },
                      ] as const).map((h) => {
                        const active = h.sortable && sortKey === (h.key as 'time' | 'model');
                        return (
                          <th key={h.key} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--color-text-3)', fontWeight: 500, fontSize: 12, whiteSpace: 'nowrap', borderBottom: '1px solid var(--bg-3)' }}>
                            {h.sortable ? (
                              <span onClick={() => toggleSort(h.key as 'time' | 'model')} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, userSelect: 'none' }}>
                                {h.label}
                                <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 0, lineHeight: 1 }}>
                                  <span style={{ fontSize: 8, color: active && sortDir === 'asc' ? 'var(--primary)' : 'var(--color-text-4)' }}>▲</span>
                                  <span style={{ fontSize: 8, color: active && sortDir === 'desc' ? 'var(--primary)' : 'var(--color-text-4)' }}>▼</span>
                                </span>
                              </span>
                            ) : h.label}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((row, i) => (
                      <tr key={row.id ?? i} style={{ borderBottom: '1px solid var(--bg-3)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '12px 14px', color: 'var(--color-text-3)', fontSize: 12 }}>{row.api_key ?? '-'}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-primary)', fontWeight: 500, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.model ?? '-'}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--color-text-3)' }}>{row.inference_strength === '默认' ? '-' : row.inference_strength ?? '-'}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--color-text-2)', fontSize: 12, maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>入站: {row.endpoint ?? '-'}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <span style={{ color: 'var(--color-text-2)', fontSize: 12 }}>{row.ip ?? '-'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, background: row.group_name === '入站' ? 'rgba(22,93,255,0.12)' : row.group_name === '出站' ? 'rgba(35,195,67,0.12)' : 'rgba(22,93,255,0.08)', color: row.group_name === '出站' ? 'var(--success)' : 'var(--primary)' }}>{row.group_name ?? '-'}</span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, background: 'rgba(22,93,255,0.08)', color: 'var(--primary)' }}>{row.type ?? '-'}</span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, background: 'rgba(22,93,255,0.08)', color: 'var(--primary)' }}>
                            {{ pay_as_you_go: '按量', subscription: '订阅' }[row.billing_mode ?? ''] ?? (row.billing_mode ?? '默认')}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: 8, fontSize: 12, alignItems: 'center', color: 'var(--color-text-2)' }}>
                            <span style={{ color: 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>↓ {fmtNum(row.prompt_tokens ?? 0, 0)}</span>
                            <span style={{ color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>↑ {fmtNum(row.completion_tokens ?? 0, 0)}</span>
                            <InfoMark><TokenPop row={row} /></InfoMark>
                          </div>
                          {(row.cached_tokens ?? 0) > 0 && (
                            <div style={{ display: 'flex', gap: 8, fontSize: 12, alignItems: 'center', marginTop: 2 }}>
                              <span style={{ color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>⚡ {fmtToken(row.cached_tokens!)}</span>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--success)', fontWeight: 600, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                            {fmtCost6(row.total_cost)}
                            <InfoMark><CostPop row={row} /></InfoMark>
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}><DelayBar firstMs={row.first_token_latency} totalMs={row.total_latency} /></td>
                        <td style={{ padding: '12px 14px', color: 'var(--color-text-2)', fontSize: 12, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{fmtDateFull(row.call_time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderTop: '1px solid var(--bg-3)' }}>
                <span style={{ fontSize: 12, color: 'var(--bg-6)' }}>共 {total} 条</span>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <button onClick={() => void handlePage(currentPage - 1)} disabled={currentPage <= 1}
                    style={{ padding: '3px 10px', borderRadius: 5, fontSize: 12, border: '1px solid var(--bg-3)', background: 'var(--bg-1)', color: 'var(--text-secondary)', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer' }}>上一页</button>
                  <span style={{ fontSize: 12, color: 'var(--bg-6)', padding: '0 6px' }}>{currentPage} / {Math.ceil(total / pageSize) || 1}</span>
                  <button onClick={() => void handlePage(currentPage + 1)} disabled={currentPage >= Math.ceil(total / pageSize)}
                    style={{ padding: '3px 10px', borderRadius: 5, fontSize: 12, border: '1px solid var(--bg-3)', background: 'var(--bg-1)', color: 'var(--text-secondary)', cursor: currentPage >= Math.ceil(total / pageSize) ? 'not-allowed' : 'pointer' }}>下一页</button>
                  <select value={pageSize} onChange={e => void handleSize(+e.target.value)}
                    style={{ fontSize: 12, padding: '2px 4px', background: 'var(--bg-1)', border: '1px solid var(--bg-3)', borderRadius: 4, color: 'var(--text-secondary)' }}>
                    {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}条/页</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 图表区域 ── */}
        <div style={{ flexShrink: 0, padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <ChartPanel title="模型分布" toggleKey="model" byToken={chartModes.model ?? true} onToggle={toggleChartMode} data={modelAgg} />
            <ChartPanel title="分组使用分布" toggleKey="group" byToken={chartModes.group ?? true} onToggle={toggleChartMode} data={groupAgg} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <ChartPanel title="端点分布" toggleKey="endpoint" byToken={chartModes.endpoint ?? true} onToggle={toggleChartMode} data={endpointAgg} />
            <div style={{ background: 'var(--bg-1)', borderRadius: 12, border: '1px solid var(--bg-3)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--bg-3)' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Token 使用趋势</span>
                <span style={{ fontSize: 12, color: 'var(--bg-6)' }}>{granularity === 'hourly' ? '按小时' : '按天'}</span>
              </div>
              <div style={{ flex: 1, minHeight: 140, padding: '8px 12px' }}>
                <EChartLine points={trendPoints} height={150} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SettingsPageWrapper>
  );
};

export default UsageLibraryPage;
