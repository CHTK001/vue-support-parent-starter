import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';

/**
 * 读取当前主题下 CSS 变量的实际色值。
 * @param token 不含 var() 包裹的 token 名，如 '--primary-6'
 * @param fallback 变量缺失时的兜底色
 */
function resolveToken(token: string, fallback: string): string {
  const cs = getComputedStyle(document.documentElement);
  const v = cs.getPropertyValue(token).trim();
  if (!v) return fallback;
  const m = v.match(/^(rgb|rgba)\(var\((--[\w-]+)\)/);
  if (m) {
    const base = cs.getPropertyValue(m[2]).trim();
    if (base) {
      return v.includes('rgba')
        ? `rgba(${base}, ${v.match(/,?\s*([\d.]+)\s*\)\s*$/)?.[1] ?? '1'})`
        : `rgb(${base})`;
    }
  }
  return v;
}

/** 内置默认色板（浅色主题语义色） */
const DEFAULT_COLORS = ['#165dff', '#00b42a', '#ff7d00', '#f53f3f', '#86909c'];

/** 折线数据点 */
export interface TrendPoint {
  label: string;
  input: number;
  output: number;
  cacheRead: number;
}

/** 系列配置 */
interface Series {
  key: 'input' | 'output' | 'cacheRead';
  label: string;
  token: string;
  dashed?: boolean;
}

const SERIES: Series[] = [
  { key: 'input', label: '输入', token: '--primary-6' },
  { key: 'output', label: '输出', token: '--success-6' },
  { key: 'cacheRead', label: '缓存', token: '--warning-6', dashed: true },
];

/**
 * ECharts 折线图（Token 使用趋势），随主题联动，带鼠标悬停 tooltip。
 * tooltip 设置 confine 防止被容器/DOM 遮挡而不完整显示。
 *
 * @param points 数据点
 * @param height 图表高度（px）
 */
const EChartLine: React.FC<{ points: TrendPoint[]; height?: number }> = ({ points, height = 200 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [empty, setEmpty] = useState(points.length === 0);
  const pointsRef = useRef(points);
  pointsRef.current = points;

  useEffect(() => {
    setEmpty(points.length === 0);
    if (!ref.current) return;
    if (!chartRef.current) {
      chartRef.current = echarts.init(ref.current);
    }
    const chart = chartRef.current;
    const labels = points.map((p) => p.label);
    chart.setOption({
      tooltip: {
        trigger: 'axis',
        confine: true,
        appendToBody: true,
        backgroundColor: resolveToken('--color-bg-2', '#ffffff'),
        borderColor: resolveToken('--color-border-2', '#e5e6eb'),
        textStyle: { color: resolveToken('--color-text-1', '#1d2129'), fontSize: 12 },
      },
      legend: {
        top: 0,
        textStyle: { color: resolveToken('--color-text-2', '#4e5969'), fontSize: 12 },
        itemWidth: 14,
        itemHeight: 8,
      },
      grid: { left: 8, right: 12, top: 28, bottom: 0, containLabel: true },
      xAxis: {
        type: 'category',
        data: labels,
        boundaryGap: false,
        axisLine: { lineStyle: { color: resolveToken('--color-border-2', '#e5e6eb') } },
        axisLabel: { color: resolveToken('--color-text-3', '#86909c'), fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: resolveToken('--color-text-3', '#86909c'), fontSize: 11 },
        splitLine: { lineStyle: { color: resolveToken('--color-fill-3', '#e5e6eb') } },
      },
      series: SERIES.map((s) => ({
        name: s.label,
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: s.dashed ? { width: 1.5, type: 'dashed' } : { width: 1.5 },
        itemStyle: { color: resolveToken(s.token, DEFAULT_COLORS[SERIES.indexOf(s) % DEFAULT_COLORS.length]) },
        data: points.map((p) => p[s.key]),
      })),
    }, { notMerge: true });
  }, [points]);

  // 主题切换（data-theme / data-color-scheme）时同步刷新图表颜色
  useEffect(() => {
    const onResize = () => chartRef.current?.resize();
    window.addEventListener('resize', onResize);
    const observer = new MutationObserver(() => {
      onResize();
      // 重新 setOption 使颜色生效
      if (chartRef.current) {
        const pts = pointsRef.current;
        chartRef.current.setOption({
          tooltip: {
            backgroundColor: resolveToken('--color-bg-2', '#ffffff'),
            borderColor: resolveToken('--color-border-2', '#e5e6eb'),
            textStyle: { color: resolveToken('--color-text-1', '#1d2129'), fontSize: 12 },
          },
          legend: { textStyle: { color: resolveToken('--color-text-2', '#4e5969') } },
          xAxis: {
            axisLine: { lineStyle: { color: resolveToken('--color-border-2', '#e5e6eb') } },
            axisLabel: { color: resolveToken('--color-text-3', '#86909c') },
          },
          yAxis: {
            axisLabel: { color: resolveToken('--color-text-3', '#86909c') },
            splitLine: { lineStyle: { color: resolveToken('--color-fill-3', '#e5e6eb') } },
          },
          series: SERIES.map((s, i) => ({
            name: s.label,
            itemStyle: { color: resolveToken(s.token, DEFAULT_COLORS[i % DEFAULT_COLORS.length]) },
            data: pts.map((p) => p[s.key]),
          })),
        }, { notMerge: false });
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-color-scheme'],
    });
    return () => {
      window.removeEventListener('resize', onResize);
      observer.disconnect();
    };
  }, []);

  useEffect(() => () => { chartRef.current?.dispose(); chartRef.current = null; }, []);

  return (
    <div ref={ref} style={{ width: '100%', height, position: 'relative' }}>
      {empty && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-8)', fontSize: 13 }}>
          暂无数据
        </div>
      )}
    </div>
  );
};

export default EChartLine;