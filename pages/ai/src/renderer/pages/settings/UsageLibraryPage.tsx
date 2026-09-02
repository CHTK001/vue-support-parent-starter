import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { httpRequest } from '@/common/adapter/httpBridge';
import { Button, DatePicker, Select, Tooltip } from '@arco-design/web-react';
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
const fmtToken = (v: number) => v >= 1e9 ? (v/1e9).toFixed(2)+'B' : v >= 1e6 ? (v/1e6).toFixed(2)+'M' : v >= 1e3 ? (v/1e3).toFixed(1)+'K' : String(v);
const fmtCost = (v: unknown) => v == null ? '-' : `$${Number(v).toFixed(2)}`;
const fmtDate = (v: unknown) => v == null ? '-' : dayjs(v).format('MM/DD HH:mm');
const fmtLatency = (ms?: number) => ms == null || ms <= 0 ? '-' : ms >= 1000 ? `${(ms/1000).toFixed(1)}s` : `${Math.round(ms)}ms`;

const mapRow = (r: any): UsageRow => ({
  id: r.sysAiUsageId, api_key: r.sysAiUsageGroupName ?? '默认', model: r.sysAiUsageModel,
  inference_strength: r.sysAiUsageInferenceStrength, endpoint: r.sysAiUsageEndpoint,
  ip: r.sysAiUsageIp, group_name: r.sysAiUsageGroupName, type: r.sysAiUsageType,
  billing_mode: r.sysAiUsageBillingMode,
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
  { label: '近1小时', days: 0, hours: 1 },
  { label: '近6小时', days: 0, hours: 6 },
  { label: '近24小时', days: 0, hours: 24 },
  { label: '近7天', days: 7, hours: 0 },
  { label: '近30天', days: 30, hours: 0 },
];

async function fetchList(p: URLSearchParams) {
  const res = await httpRequest<{ data?: any[] }>('GET', `${LIST_API}?${p}`);
  return (res?.data ?? []).map(mapRow);
}
async function fetchStats(p: URLSearchParams) {
  const res = await httpRequest<UsageStats>('GET', `${STAT_API}?${p}`);
  return res ?? {};
}

// ─── SVG 图表 ──────────────────────────────────────────────────

const CHART_COLORS = ['#3b82f6', '#34d399', '#f59e0b', '#ef4444', '#a78bfa'];

const DonutChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const R = 30, C = 50;
  if (total === 0) {
    return <svg width={100} height={100} viewBox={`0 0 ${C*2} ${C*2}`}>
      <circle cx={C} cy={C} r={R} fill="none" stroke="#2a3548" strokeWidth={10}/>
    </svg>;
  }
  let cum = -90;
  const arcs = data.filter(d => d.value > 0).map(d => {
    const ang = (d.value / total) * 360, s = cum, e = cum + ang; cum = e;
    const sr = s*Math.PI/180, er = e*Math.PI/180;
    return { d: `M${C+R*Math.cos(sr)},${C+R*Math.sin(sr)}A${R},${R} 0 ${ang>180?1:0} 1 ${C+R*Math.cos(er)},${C+R*Math.sin(er)}`, c: d.color };
  });
  return (
    <svg width={100} height={100} viewBox={`0 0 ${C*2} ${C*2}`}>
      {arcs.map((a, i) => <path key={i} d={a.d} fill="none" stroke={a.c} strokeWidth={10} strokeLinecap="round"/>)}
      <text x={C} y={C+4} textAnchor="middle" fill="#94a3b8" fontSize="10">{fmtToken(total)}</text>
    </svg>
  );
};

const TrendChart: React.FC<{ points: { label: string; input: number; output: number; cacheRead: number }[] }> = ({ points }) => {
  if (points.length === 0) {
    return <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#3d4f65', fontSize:12 }}>暂无数据</div>;
  }
  const W=500, H=150, pL=44, pR=40, pT=6, pB=20;
  const cW=W-pL-pR, cH=H-pT-pB;
  const maxT = Math.max(...points.flatMap(p=>[p.input,p.output,p.cacheRead]),1);
  const xS = points.length>1 ? cW/(points.length-1) : cW/2;
  const sx = (i:number) => pL+i*xS;
  const syT = (v:number) => pT+cH-(v/maxT)*cH;
  const mkP = (vals:number[]) => vals.map((v,i)=>`${i===0?'M':'L'} ${sx(i).toFixed(1)} ${syT(v).toFixed(1)}`).join(' ');
  const gridY = [0,0.25,0.5,0.75,1].map(f => pT+cH*(1-f));
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow:'visible' }}>
      {gridY.map((y,i) => <line key={i} x1={pL} y1={y} x2={W-pR} y2={y} stroke="#1e2d42" strokeWidth={1}/>)}
      {[0,0.25,0.5,0.75,1].map((f,i) => <text key={i} x={pL-4} y={pT+cH*(1-f)+3} textAnchor="end" fill="#4a5568" fontSize="9">{fmtToken(maxT*f)}</text>)}
      <path d={mkP(points.map(p=>p.output))} fill="none" stroke="#48bb78" strokeWidth={1.5}/>
      <path d={mkP(points.map(p=>p.input))} fill="none" stroke="#63b3ed" strokeWidth={1.5}/>
      <path d={mkP(points.map(p=>p.cacheRead))} fill="none" stroke="#ed8936" strokeWidth={1.5} strokeDasharray="4,2"/>
      {points.map((p,i) => {
        const show = points.length<=20 || i%Math.ceil(points.length/10)===0 || i===points.length-1;
        return show ? <text key={i} x={sx(i)} y={H-3} textAnchor="middle" fill="#4a5568" fontSize="9">{p.label}</text> : null;
      })}
    </svg>
  );
};

// ─── 浮窗 ──────────────────────────────────────────────────────

const popS: React.CSSProperties = { background:'#1a202c', border:'1px solid #2d3748', borderRadius:8, padding:'8px 10px', fontSize:12, boxShadow:'0 4px 12px rgba(0,0,0,0.4)', minWidth:155, zIndex:1000 };
const rRow: React.CSSProperties = { display:'flex', justifyContent:'space-between', padding:'2px 0', gap:8 };
const rLbl: React.CSSProperties = { color:'#a0aec0' };
const rVal: React.CSSProperties = { color:'#c8d6e5', fontVariantNumeric:'tabular-nums', textAlign:'right' as const };

const TokenPop: React.FC<{ row: UsageRow }> = ({ row }) => (
  <div style={popS}>
    <div style={{ fontSize:12, fontWeight:700, color:'#e2e8f0', marginBottom:4, paddingBottom:4, borderBottom:'1px solid #2d3748' }}>Token 明细</div>
    <div style={rRow}><span style={rLbl}>输入 Token</span><span style={rVal}>{fmtNum(row.prompt_tokens??0,0)}</span></div>
    <div style={rRow}><span style={rLbl}>输出 Token</span><span style={rVal}>{fmtNum(row.completion_tokens??0,0)}</span></div>
    {(row.cached_tokens??0)>0 && <div style={rRow}><span style={rLbl}>缓存读取</span><span style={rVal}>{fmtNum(row.cached_tokens!,0)}</span></div>}
    <div style={{...rRow,borderTop:'1px solid #2d3748',paddingTop:4,marginTop:4}}>
      <span style={rLbl}>总 Token</span><span style={{...rVal,color:'#60a5fa',fontWeight:700}}>{fmtNum(row.total_tokens??0,0)}</span>
    </div>
  </div>
);

const CostPop: React.FC<{ row: UsageRow }> = ({ row }) => (
  <div style={popS}>
    <div style={{ fontSize:12, fontWeight:700, color:'#e2e8f0', marginBottom:4, paddingBottom:4, borderBottom:'1px solid #2d3748' }}>成本明细</div>
    <div style={rRow}><span style={rLbl}>输入成本</span><span style={rVal}>{fmtCost(row.input_cost)}</span></div>
    <div style={rRow}><span style={rLbl}>输出成本</span><span style={rVal}>{fmtCost(row.output_cost)}</span></div>
    {(row.cached_cost??0)>0 && <div style={rRow}><span style={rLbl}>缓存读取</span><span style={rVal}>{fmtCost(row.cached_cost)}</span></div>}
    <div style={{...rRow,borderTop:'1px solid #2d3748',margin:'4px 0'}}/>
    <div style={rRow}><span style={rLbl}>服务档位</span><span style={{...rVal,color:'#818cf8'}}>{row.service_tier??'-'}</span></div>
    <div style={rRow}><span style={rLbl}>倍率</span><span style={rVal}>{row.ratio!=null?`${row.ratio.toFixed(2)}x`:'-'}</span></div>
    <div style={rRow}><span style={rLbl}>原始</span><span style={rVal}>{fmtCost(row.original_cost)}</span></div>
    <div style={{...rRow,borderTop:'1px solid #2d3748',paddingTop:4,marginTop:4}}>
      <span style={rLbl}>用户扣费</span><span style={{...rVal,color:'#34d399',fontWeight:700,fontSize:13}}>{fmtCost(row.total_cost)}</span>
    </div>
  </div>
);

const DelayBar: React.FC<{ firstMs?: number; totalMs?: number }> = ({ firstMs, totalMs }) => {
  const mx = 10000;
  const c = (ms?:number) => ms==null ? '#3d4f65' : ms<500 ? '#22c55e' : ms<2000 ? '#eab308' : '#ef4444';
  return (
    <div style={{display:'flex',flexDirection:'column',gap:2,minWidth:68}}>
      {firstMs!=null && <div style={{display:'flex',alignItems:'center',gap:3}}>
        <span style={{fontSize:10,color:'#3d4f65',whiteSpace:'nowrap'}}>首字</span>
        <div style={{flex:1,height:3,background:'#2d3748',borderRadius:2,overflow:'hidden'}}><div style={{width:`${Math.min(firstMs/mx*100,100)}%`,height:'100%',background:c(firstMs),borderRadius:2}}/></div>
        <span style={{fontSize:10,color:c(firstMs),whiteSpace:'nowrap'}}>{fmtLatency(firstMs)}</span>
      </div>}
      {totalMs!=null && <div style={{display:'flex',alignItems:'center',gap:3}}>
        <span style={{fontSize:10,color:'#3d4f65',whiteSpace:'nowrap'}}>总耗时</span>
        <div style={{flex:1,height:3,background:'#2d3748',borderRadius:2,overflow:'hidden'}}><div style={{width:`${Math.min(totalMs/mx*100,100)}%`,height:'100%',background:c(totalMs),borderRadius:2}}/></div>
        <span style={{fontSize:10,color:c(totalMs),whiteSpace:'nowrap'}}>{fmtLatency(totalMs)}</span>
      </div>}
    </div>
  );
};

// ─── 图表面板 ──────────────────────────────────────────────────

interface PanelData { label: string; requests: number; tokens: number; actual: number; standard: number; }

const ChartPanel: React.FC<{
  title: string; toggleKey: string; byToken: boolean;
  onToggle: (k:string,b:boolean) => void; data: PanelData[];
}> = ({ title, toggleKey, byToken, onToggle, data }) => {
  const top5 = data.slice(0, 5);
  const totalVal = top5.reduce((s,d) => s + (byToken ? d.tokens : d.actual), 0);
  const chartData = top5.map((d,i) => ({ label: d.label, value: byToken ? d.tokens : d.actual, color: CHART_COLORS[i%CHART_COLORS.length] }));
  return (
    <div style={{ background:'#1a202c', borderRadius:12, border:'1px solid #2d3748', overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {/* 标题行 */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderBottom:'1px solid #2d3748' }}>
        <span style={{ fontSize:13, fontWeight:600, color:'#e2e8f0' }}>{title}</span>
        <div style={{ display:'flex', gap:2, background:'#171923', borderRadius:6, padding:2 }}>
          {(['token','cost'] as const).map(m => (
            <button key={m} onClick={() => onToggle(toggleKey, m==='token')}
              style={{ padding:'2px 10px', borderRadius:5, fontSize:11, border:'none', cursor:'pointer',
                background: byToken===(m==='token') ? '#3b82f6' : 'transparent',
                color: byToken===(m==='token') ? '#fff' : '#a0aec0', transition:'all 0.15s' }}>
              {m==='token' ? '按 Token' : '按实际消费'}
            </button>
          ))}
        </div>
      </div>
      {/* 图表区域 */}
      <div style={{ display:'flex', alignItems:'center', gap:16, padding:'16px' }}>
        <div style={{ flexShrink:0 }}>
          <DonutChart data={chartData} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
            <thead>
              <tr style={{ color:'#4a5568', borderBottom:'1px solid #1e3050' }}>
                {['模型','请求','Token','实际','标准'].map(h => (
                  <th key={h} style={{ padding:'3px 8px', textAlign: h==='模型'?'left':'right', fontWeight:400, fontSize:11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {top5.map((d,i) => (
                <tr key={d.label} style={{ borderBottom:'1px solid #2d3748' }}>
                  <td style={{ padding:'4px 8px', color:'#cbd5e0', maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    <span style={{ display:'inline-block', width:5, height:5, borderRadius:'50%', background:CHART_COLORS[i%CHART_COLORS.length], marginRight:5, flexShrink:0 }}/>
                    {d.label}
                  </td>
                  <td style={{ padding:'4px 8px', textAlign:'right', color:'#718096' }}>{fmtNum(d.requests,0)}</td>
                  <td style={{ padding:'4px 8px', textAlign:'right', color:'#718096' }}>{fmtToken(d.tokens)}</td>
                  <td style={{ padding:'4px 8px', textAlign:'right', color:'#34d399' }}>{fmtCost(d.actual)}</td>
                  <td style={{ padding:'4px 8px', textAlign:'right', color:'#4a5568' }}>{fmtCost(d.standard)}</td>
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

  const syncTimerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const paramsRef = useRef('');

  const doSync = useCallback(async (params: string) => {
    try {
      const [listRes, statRes] = await Promise.all([fetchList(new URLSearchParams(params)), fetchStats(new URLSearchParams(params))]);
      setRows(listRes); setStats(statRes);
      const pSet=new Set<string>(), mSet=new Set<string>();
      listRes.forEach(r => { if(r.group_name) pSet.add(r.group_name); if(r.model) mSet.add(r.model); });
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
      const [listRes, statRes] = await Promise.all([fetchList(new URLSearchParams(params)), fetchStats(new URLSearchParams(params))]);
      setRows(listRes); setStats(statRes);
      const pSet=new Set<string>(), mSet=new Set<string>();
      listRes.forEach(r => { if(r.group_name) pSet.add(r.group_name); if(r.model) mSet.add(r.model); });
      setProviders([...pSet].sort()); setModels([...mSet].sort());
    } catch { /* ignore */ } finally { setSyncing(false); }
  }, [buildParams]);

  useEffect(() => { void handleRefresh(); startSync(buildParams()); }, [handleRefresh, startSync, buildParams, dateRange, provider, model]);

  const handleDateChange = useCallback((v: any) => {
    if (!v || v.length !== 2) { setDateRange(null); return; }
    const [start, end] = v;
    const diffDays = end.diff(start, 'day');
    if (diffDays > MAX_DAYS) { setDateRange([start, start.add(MAX_DAYS, 'day')]); return; }
    setDateRange([start, end]);
  }, []);

  const handlePresetChange = useCallback((days:number, hours:number) => {
    setDateRange([dayjs().subtract(days,'day').subtract(hours,'hour'), dayjs()]);
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
  const endpointAgg = useMemo(() => aggData(r => r.endpoint ?? '-'), [aggData]);

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
            { icon:'📋', bg:'#2d3748', title:'总请求数', sub:'所选范围内', val: stats.totalCalls ?? rows.length },
            { icon:'📦', bg:'#2d3748', title:'总 Token', sub:`输入: ${fmtToken(stats.totalPromptTokens??0)} / 输出: ${fmtToken(stats.totalCompletionTokens??0)} / 缓存: ${fmtToken(stats.totalCachedTokens??0)}`, val: fmtToken(stats.totalTokens??0) },
            { icon:'💵', bg:'#2d3748', title:'总消费', sub: stats.standardCost!=null ? `标准 $${stats.standardCost.toFixed(6)}` : undefined, val: fmtCost(stats.totalCost) },
            { icon:'⏱️', bg:'#2d3748', title:'平均耗时', sub: undefined, val: fmtLatency(stats.avgLatency) },
          ].map(({ icon, bg, title, sub, val }) => (
            <div key={title} style={{ flex:'1 1 180px', background:'#1a202c', borderRadius:12, border:'1px solid #2d3748', padding:'14px 18px', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{icon}</div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:11, color:'#718096', marginBottom:2 }}>{title}</div>
                <div style={{ fontSize:20, fontWeight:700, color:'#e2e8f0', fontVariantNumeric:'tabular-nums', lineHeight:1.2 }}>
                  {typeof val==='number' ? val.toLocaleString() : val}
                </div>
                {sub && <div style={{ fontSize:10, color:'#4a5568', marginTop:2 }}>{sub}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* ── 筛选栏 ── */}
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 20px 10px', flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:4, flexWrap:'wrap' }}>
            <span style={{ fontSize:12, color:'#718096' }}>时间范围:</span>
            {PRESETS.map(({ label, days, hours }) => (
              <button key={label} onClick={() => handlePresetChange(days, hours)}
                style={{ padding:'3px 10px', borderRadius:6, fontSize:11, background:'#1a202c', color:'#a0aec0', cursor:'pointer', border:'none' }}>{label}</button>
            ))}
            <DatePicker.RangePicker allowClear showTime value={dateRange} onChange={handleDateChange} format="YYYY-MM-DD HH:mm:ss" style={{ width:240, background:'#1a202c', border:'1px solid #2d3748', borderRadius:6 }} placeholder={['开始','结束']} />
          </div>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
            <Select value={granularity} onChange={(v)=>setGranularity(v as 'hourly'|'daily')} size="small" style={{ width:90, background:'#1a202c' }}>
              <Select.Option value="hourly">按小时</Select.Option>
              <Select.Option value="daily">按天</Select.Option>
            </Select>
            <Select allowClear placeholder="分组" value={provider} onChange={(v)=>setProvider(v as string|undefined)} options={providers.map(p=>({label:p,value:p}))} style={{ width:120, background:'#1a202c' }} size="small" />
            <Select allowClear placeholder="模型" value={model} onChange={(v)=>setModel(v as string|undefined)} options={models.map(m=>({label:m,value:m}))} style={{ width:150, background:'#1a202c' }} size="small" />
            <Button size="small" icon={<Refresh theme="outline" size="14"/>} loading={syncing} onClick={() => void handleRefresh()}>刷新</Button>
            <Button size="small" type="text" style={{ color:'#f87171' }} onClick={handleReset}>重置</Button>
            <span style={{ fontSize:11, color:'#4a5568', display:'flex', alignItems:'center', gap:4 }}>
              <Sync theme="outline" size="12"/> 每5分钟自动同步 · {rows.length} 条
            </span>
          </div>
        </div>

        {/* ── 图表区域 ── */}
        <div style={{ flex:1, overflow:'auto', padding:'0 20px 16px', display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <ChartPanel title="模型分布" toggleKey="model" byToken={chartModes.model??true} onToggle={toggleChartMode} data={modelAgg} />
            <ChartPanel title="分组使用分布" toggleKey="group" byToken={chartModes.group??true} onToggle={toggleChartMode} data={groupAgg} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <ChartPanel title="端点分布" toggleKey="endpoint" byToken={chartModes.endpoint??true} onToggle={toggleChartMode} data={endpointAgg} />
            <div style={{ background:'#1a202c', borderRadius:12, border:'1px solid #2d3748', display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderBottom:'1px solid #2d3748' }}>
                <span style={{ fontSize:13, fontWeight:600, color:'#e2e8f0' }}>Token 使用趋势</span>
                <span style={{ fontSize:11, color:'#4a5568' }}>{granularity==='hourly'?'按小时':'按天'}</span>
              </div>
              <div style={{ flex:1, minHeight:140, padding:'8px 12px' }}>
                <TrendChart points={trendPoints} />
              </div>
            </div>
          </div>
        </div>

        {/* ── 数据表格 ── */}
        <div style={{ padding:'0 20px 20px', flexShrink:0 }}>
          {rows.length === 0 ? (
            <div style={{ background:'#1a202c', borderRadius:12, border:'1px solid #2d3748', padding:'40px', textAlign:'center', color:'#4a5568', fontSize:13 }}>
              暂无用量数据
            </div>
          ) : (
            <div style={{ background:'#1a202c', borderRadius:12, border:'1px solid #2d3748', overflow:'hidden' }}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ background:'#171923', position:'sticky', top:0, zIndex:10 }}>
                      {['API密钥','模型','推理强度','端点','IP','分组','类型','计费模式','TOKEN','费用','延迟','时间'].map(h => (
                        <th key={h} style={{ padding:'8px 12px', textAlign:'left', color:'#718096', fontWeight:500, fontSize:11, whiteSpace:'nowrap', borderBottom:'1px solid #2d3748' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={row.id ?? i} style={{ borderBottom:'1px solid #2d3748' }}
                        onMouseEnter={e => (e.currentTarget.style.background='#171923')}
                        onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
                        <td style={{ padding:'7px 12px', color:'#718096', fontSize:11, fontFamily:'monospace' }}>{row.api_key??'-'}</td>
                        <td style={{ padding:'7px 12px', color:'#cbd5e0', fontWeight:500, maxWidth:130, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.model??'-'}</td>
                        <td style={{ padding:'7px 12px', color:'#718096' }}>{row.inference_strength??'-'}</td>
                        <td style={{ padding:'7px 12px', color:'#60a5fa', maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.endpoint??'-'}</td>
                        <td style={{ padding:'7px 12px', color:'#718096', fontSize:11, fontFamily:'monospace' }}>{row.ip??'-'}</td>
                        <td style={{ padding:'7px 12px' }}>
                          <span style={{ fontSize:11, padding:'1px 6px', borderRadius:4, background: row.group_name==='入站'?'rgba(22,93,255,0.15)':row.group_name==='出站'?'rgba(35,195,67,0.15)':'#1e3050', color: row.group_name==='入站'?'#60a5fa':row.group_name==='出站'?'#34d399':'#a0aec0' }}>{row.group_name??'-'}</span>
                        </td>
                        <td style={{ padding:'7px 12px', color:'#718096' }}>{row.type??'-'}</td>
                        <td style={{ padding:'7px 12px' }}>
                          <span style={{ fontSize:11, padding:'1px 6px', borderRadius:4, background:'rgba(129,140,248,0.12)', color:'#818cf8' }}>
                            {{pay_as_you_go:'按量',subscription:'订阅'}[row.billing_mode??'']??'-'}
                          </span>
                        </td>
                        <td style={{ padding:'7px 12px' }}>
                          <Tooltip content={<TokenPop row={row}/>} trigger="hover" position="top">
                            <div style={{ cursor:'pointer' }}>
                              <div style={{ display:'flex', gap:3, fontSize:11, alignItems:'baseline' }}>
                                <span style={{ color:'#60a5fa' }}>↓{fmtToken(row.prompt_tokens??0)}</span>
                                <span style={{ color:'#34d399' }}>↑{fmtToken(row.completion_tokens??0)}</span>
                              </div>
                              {(row.cached_tokens??0)>0 && <div style={{ fontSize:10, color:'#4a5568' }}>🗄{fmtToken(row.cached_tokens!)}</div>}
                              <div style={{ fontSize:11, color:'#cbd5e0', fontWeight:500, fontFamily:'monospace' }}>{fmtNum(row.total_tokens??0,0)}</div>
                            </div>
                          </Tooltip>
                        </td>
                        <td style={{ padding:'7px 12px' }}>
                          <Tooltip content={<CostPop row={row}/>} trigger="hover" position="top">
                            <span style={{ color:'#34d399', fontWeight:600, fontSize:13, fontFamily:'monospace', cursor:'pointer' }}>{fmtCost(row.total_cost)}</span>
                          </Tooltip>
                        </td>
                        <td style={{ padding:'7px 12px' }}><DelayBar firstMs={row.first_token_latency} totalMs={row.total_latency}/></td>
                        <td style={{ padding:'7px 12px', color:'#718096', fontSize:11 }}>{fmtDate(row.call_time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </SettingsPageWrapper>
  );
};

export default UsageLibraryPage;
