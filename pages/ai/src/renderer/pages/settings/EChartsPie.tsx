import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

/**
 * 读取当前主题下 CSS 变量的实际色值。
 * 主题通过 `<html data-theme / data-color-scheme>` 切换，CSS 变量定义在
 * `themes/*.css`。ECharts canvas 无法直接解析 `var(--x)` 字符串，必须转为 hex。
 *
 * @param token 不含 var() 包裹的 token 名，如 '--primary-6'
 * @param fallback 变量缺失时的兜底色
 * @return 解析后的颜色字符串（如 '#165dff'）
 */
function resolveToken(token: string, fallback: string): string {
  const cs = getComputedStyle(document.documentElement);
  const v = cs.getPropertyValue(token).trim();
  if (!v) return fallback;
  // 兼容 rgb(var(--x)) / rgba(var(--x), a) 间接引用
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

/**
 * ECharts 饼图组件，颜色随应用主题（亮/暗/配色方案）联动。
 *
 * @param data  饼图数据：label + value（value<=0 项自动隐藏）
 * @param tokens 色板 token 列表，缺省用内置色板
 * @param height 图表高度（px）
 */
const EChartsPie: React.FC<{
  data: { label: string; value: number }[];
  tokens?: string[];
  height?: number;
}> = ({ data, tokens, height = 120 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    chartRef.current = echarts.init(ref.current);
    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const hasData = data.some((d) => d.value > 0);
    const visible = data.filter((d) => d.value > 0);
    // 从当前主题解析实际颜色；未提供 token 时用内置色板
    const palette =
      tokens && tokens.length > 0
        ? tokens.map((tk, i) => resolveToken(tk, DEFAULT_COLORS[i % DEFAULT_COLORS.length]))
        : DEFAULT_COLORS.slice();
    chart.setOption({
      color: palette,
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        backgroundColor: resolveToken('--color-bg-2', '#ffffff'),
        borderColor: resolveToken('--color-border-2', '#e5e6eb'),
        textStyle: {
          color: resolveToken('--color-text-1', '#1d2129'),
          fontSize: 12,
        },
      },
      legend: { show: false },
      series: [
        {
          type: 'pie',
          radius: ['45%', '72%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: resolveToken('--color-bg-1', '#ffffff'), borderWidth: 2 },
          label: { show: false },
          emphasis: { label: { show: false }, scaleSize: 4 },
          data: hasData
            ? visible
            : [{ name: '暂无数据', value: 1, itemStyle: { color: resolveToken('--color-fill-3', '#e5e6eb') } }],
        },
      ],
    });
  }, [data, tokens]);

  // 主题切换（data-theme / data-color-scheme）时同步刷新图表颜色
  useEffect(() => {
    const onResize = () => chartRef.current?.resize();
    window.addEventListener('resize', onResize);
    const observer = new MutationObserver(() => {
      onResize();
      // 强制重绘以应用新主题颜色
      chartRef.current?.setOption(
        { backgroundColor: 'transparent' },
        { lazyUpdate: false }
      );
      const chart = chartRef.current;
      if (chart) {
        const current = chart.getOption() as echarts.EChartsOption;
        void current;
        chart.setOption({}, { notMerge: false });
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

  return <div ref={ref} style={{ width: 120, height, flexShrink: 0 }} />;
};

export default EChartsPie;
