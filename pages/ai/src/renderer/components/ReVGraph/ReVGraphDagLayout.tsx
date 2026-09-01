/**
 * ReVGraphDagLayout — DAG 布局组件
 * 适用于有向无环图、工作流编排、Pipeline 可视化
 */
import React from 'react';
import { ReVGraph } from '../ReVGraph';
import type { ReVGraphProps } from '../ReVGraph';

export interface ReVGraphDagLayoutProps extends Omit<ReVGraphProps, 'layoutType'> {
  /** DAG 方向: TB(默认) | BT | LR | RL */
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
  /** 层级间距 */
  rankSep?: number;
  /** 节点间距 */
  nodeSep?: number;
}

export const ReVGraphDagLayout: React.FC<ReVGraphDagLayoutProps> = ({
  direction = 'TB',
  rankSep = 80,
  nodeSep = 60,
  ...rest
}) => {
  return (
    <ReVGraph
      {...rest}
      layoutType="dag"
      direction={direction}
      defaultNodeStyle={{
        size: [120, 48],
        borderRadius: 8,
        fill: 'var(--color-bg-panel, #1e2027)',
        stroke: 'var(--color-border, #3a3d45)',
        lineWidth: 1.5,
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowBlur: 6,
      }}
      defaultEdgeStyle={{
        stroke: 'var(--color-border-muted, #3a3d45)',
        lineWidth: 2,
        curveOffset: 0,
      }}
    />
  );
};

export default ReVGraphDagLayout;
