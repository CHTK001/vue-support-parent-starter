import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

/**
 * ECharts 饼图组件（用于用量库顶部各分布面板）。
 *
 * @param data   饼图数据：label + value
 * @param colors 自定义色板（缺省用内置色板）
 * @param height 图表高度（px）
 */
const EChartsPie: React.FC<{
  data: { label: string; value: number }[];
  colors?: string[];
  height?: number;
}> = ({ data, colors, height = 120 }) => {
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
    chart.setOption({
      color: colors ?? ['var(--primary)', 'var(--success)', 'var(--warning)', 'var(--danger)', 'var(--info)'],
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        backgroundColor: 'var(--bg-1)',
        borderColor: 'var(--bg-3)',
        textStyle: { color: 'var(--text-primary)', fontSize: 12 },
      },
      legend: { show: false },
      series: [
        {
          type: 'pie',
          radius: ['45%', '72%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: 'var(--bg-1)', borderWidth: 2 },
          label: { show: false },
          emphasis: { label: { show: false }, scaleSize: 4 },
          data: hasData ? data : [{ name: '暂无数据', value: 1, itemStyle: { color: 'var(--bg-3)' } }],
        },
      ],
    });
  }, [data, colors]);

  useEffect(() => {
    const onResize = () => chartRef.current?.resize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return <div ref={ref} style={{ width: 120, height, flexShrink: 0 }} />;
};

export default EChartsPie;
